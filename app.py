from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash, Response
from functools import wraps
import os
import logging
import hashlib
import csv
import io
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, Solution, FAQ, Ticket, ChatLog, DecisionNode, DecisionEdge, Admin
from engine import InferenceEngine

# --- KONFIGURASI LOGGING ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- KONFIGURASI APLIKASI ---
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///it_support.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'it-support-mandiri-secret-key-2025')

# --- INISIALISASI ---
db.init_app(app)
inference_engine = InferenceEngine()

# --- HELPER FUNCTIONS ---

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def calculate_similarity(a, b):
    """Menghitung rasio kemiripan antara dua string (0.0 - 1.0)"""
    return SequenceMatcher(None, a, b).ratio()

def seed_expert_system():
    """Mengisi database AI dengan data awal jika kosong"""
    try:
        if not DecisionNode.query.first():
            root = DecisionNode(content="Apa masalah utama komputer Anda?", type="question", is_root=True)
            db.session.add(root)
            db.session.commit()

            # Node Level 1
            node_boot = DecisionNode(content="Apakah komputer bisa menyala (ada lampu/kipas)?", type="question")
            node_slow = DecisionNode(content="Apakah masalahnya lambat/lemot?", type="question")
            node_net = DecisionNode(content="Apakah masalah internet/WiFi?", type="question")
            
            db.session.add_all([node_boot, node_slow, node_net])
            db.session.commit()

            # Edges Level 1
            db.session.add(DecisionEdge(source_id=root.id, target_id=node_boot.id, label="Mati Total / Tidak Booting"))
            db.session.add(DecisionEdge(source_id=root.id, target_id=node_slow.id, label="Komputer Lemot"))
            db.session.add(DecisionEdge(source_id=root.id, target_id=node_net.id, label="Internet / WiFi"))
            
            # Solusi Contoh
            sol_power = DecisionNode(content="Cek kabel power. Jika laptop, cabut baterai, tekan power 30 detik.", type="solution")
            sol_ram = DecisionNode(content="Kemungkinan RAM penuh atau Hardisk penuh. Coba restart.", type="solution")
            
            db.session.add_all([sol_power, sol_ram])
            db.session.commit()
            
            # Edges ke Solusi
            db.session.add(DecisionEdge(source_id=node_boot.id, target_id=sol_power.id, label="Tidak Menyala"))
            db.session.add(DecisionEdge(source_id=node_slow.id, target_id=sol_ram.id, label="Ya, sangat lambat"))
            
            db.session.commit()
            logger.info("Expert System Knowledge Base Seeded")
    except Exception as e:
        logger.error(f"Seeding Error: {e}")
        db.session.rollback()

# --- PUBLIC ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify({'status': 'OK', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/favicon.ico')
def favicon():
    return '', 204

# --- ADMIN AUTHENTICATION (DATABASE VERSION) ---

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username dan password harus diisi', 'error')
            return render_template('admin_login.html')
        
        # 1. Cari admin di database
        user = Admin.query.filter_by(username=username).first()
        
        if user:
            # Support both old SHA-256 and new Werkzeug hashes
            login_ok = False
            if user.password_hash.startswith('pbkdf2:') or user.password_hash.startswith('scrypt:'):
                login_ok = check_password_hash(user.password_hash, password)
            else:
                # Legacy SHA-256 fallback - auto-upgrade to Werkzeug
                old_hash = hashlib.sha256(password.encode()).hexdigest()
                if old_hash == user.password_hash:
                    login_ok = True
                    user.password_hash = generate_password_hash(password)
                    db.session.commit()

            if login_ok:
                session['admin_logged_in'] = True
                session['admin_username'] = user.username
                session['admin_id'] = user.id
                flash('Login berhasil!', 'success')
                return redirect(url_for('admin'))
        
        flash('Username atau password salah', 'error')
        return render_template('admin_login.html')
    
    if session.get('admin_logged_in'):
        return redirect(url_for('admin'))
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    flash('Logout berhasil', 'info')
    return redirect(url_for('admin_login'))

@app.route('/admin')
@admin_required
def admin():
    return render_template('admin.html')

# --- CHATBOT & DIAGNOSIS API (DENGAN FUZZY LOGIC) ---

@app.route('/api/diagnose', methods=['POST'])
def diagnose_start():
    try:
        data = request.get_json() or {}
        current_node_id = data.get('node_id')
        result = inference_engine.diagnose(current_node_id)
        
        if result.get('status') == 404:
            return jsonify({'error': 'Alur diagnosa tidak ditemukan'}), 404
            
        return jsonify(result)
    except Exception as e:
        logger.error(f"Diagnosis Error: {e}")
        return jsonify({'error': 'Terjadi kesalahan sistem'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'response': 'Invalid request format.', 'type': 'error'}), 400
        
        user_message = data.get('message', '').strip().lower()
        if not user_message:
            return jsonify({'response': 'Silakan tulis pesan Anda.', 'type': 'error'}), 400

        # --- LOGIKA BARU: FUZZY MATCHING (Cerdas) ---
        
        # 1. Cek Keyword Khusus dulu (Prioritas Tertinggi)
        if 'diagnosa' in user_message or 'bantu' in user_message or 'mulai' in user_message:
            response_text = "Saya akan mengaktifkan mode Diagnosa Pintar. Silakan jawab pertanyaan berikut."
            response_type = 'diagnosis_start'
            
            # Simpan log
            db.session.add(ChatLog(user_message=user_message, bot_response=response_text, response_type=response_type))
            db.session.commit()
            return jsonify({'response': response_text, 'type': response_type})

        # 2. Ambil semua FAQ dari database
        all_faqs = FAQ.query.all()
        best_match = None
        highest_score = 0.0
        
        # Ambang batas kemiripan (0.0 - 1.0). 0.5 artinya 50% mirip.
        THRESHOLD = 0.5 

        for faq in all_faqs:
            # Cek kemiripan dengan Pertanyaan Utama
            score_q = calculate_similarity(user_message, faq.question.lower())
            
            # Cek kemiripan dengan Keywords (jika ada)
            score_k = 0.0
            if faq.keywords:
                # Keywords dipisah koma, kita cek satu-satu
                keywords_list = [k.strip().lower() for k in faq.keywords.split(',')]
                # Ambil score tertinggi dari salah satu keyword
                if keywords_list:
                    score_k = max([calculate_similarity(user_message, k) for k in keywords_list])
            
            # Ambil skor terbaik antara pertanyaan vs keyword
            final_score = max(score_q, score_k)
            
            if final_score > highest_score and final_score >= THRESHOLD:
                highest_score = final_score
                best_match = faq

        # 3. Tentukan Respon
        if best_match:
            response_text = best_match.answer
            response_type = 'solution'
            # (Opsional) Debug print untuk lihat skor di terminal
            print(f"🎯 Match Found! Score: {highest_score:.2f} | User: {user_message} | Match: {best_match.question}")
        else:
            response_text = "Maaf, saya kurang paham. Coba ketik 'bantu' untuk diagnosa otomatis, atau gunakan kata kunci lain."
            response_type = 'fallback'

        # 4. Simpan Log
        chat_log = ChatLog(user_message=user_message, bot_response=response_text, response_type=response_type)
        db.session.add(chat_log)
        db.session.commit()

        return jsonify({'response': response_text, 'type': response_type})
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({'response': 'Error sistem.', 'type': 'error'}), 500

# --- SOLUTIONS CRUD ---

@app.route('/solutions', methods=['GET'])
def get_solutions():
    solutions = Solution.query.order_by(Solution.priority.desc(), Solution.created_at.desc()).all()
    return jsonify({'message': 'OK', 'data': [s.to_dict() for s in solutions]})

@app.route('/solutions', methods=['POST'])
@admin_required
def create_solution():
    data = request.get_json()
    new_solution = Solution(
        category=data.get('category'),
        title=data.get('title'),
        keywords=data.get('keywords', ''),
        description=data.get('description'),
        steps=data.get('steps', '[]'),
        priority=int(data.get('priority', 0))
    )
    db.session.add(new_solution)
    db.session.commit()
    return jsonify({'message': 'Success', 'data': new_solution.to_dict()}), 201

@app.route('/solutions/<int:id>', methods=['GET'])
@admin_required
def get_solution_detail(id):
    solution = Solution.query.get_or_404(id)
    return jsonify({'data': solution.to_dict()})

@app.route('/solutions/<int:id>', methods=['PUT'])
@admin_required
def update_solution(id):
    try:
        solution = Solution.query.get_or_404(id)
        data = request.get_json()
        if 'category' in data: solution.category = data['category']
        if 'title' in data: solution.title = data['title']
        if 'keywords' in data: solution.keywords = data['keywords']
        if 'description' in data: solution.description = data['description']
        if 'steps' in data: solution.steps = data['steps']
        if 'priority' in data: solution.priority = int(data['priority'])
        db.session.commit()
        return jsonify({'message': 'Updated'})
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Update failed'}), 500

@app.route('/solutions/<int:id>', methods=['DELETE'])
@admin_required
def delete_solution(id):
    solution = Solution.query.get_or_404(id)
    db.session.delete(solution)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# --- FAQS CRUD ---

@app.route('/faqs', methods=['GET'])
def get_faqs():
    faqs = FAQ.query.order_by(FAQ.priority.desc()).all()
    return jsonify({'message': 'OK', 'data': [f.to_dict() for f in faqs]})

@app.route('/faqs', methods=['POST'])
@admin_required
def create_faq():
    data = request.get_json()
    new_faq = FAQ(
        question=data.get('question'),
        answer=data.get('answer'),
        keywords=data.get('keywords', ''),
        category=data.get('category', 'general'),
        priority=int(data.get('priority', 0))
    )
    db.session.add(new_faq)
    db.session.commit()
    return jsonify({'message': 'Success', 'data': new_faq.to_dict()}), 201

@app.route('/faqs/<int:id>', methods=['GET'])
@admin_required
def get_faq_detail(id):
    faq = FAQ.query.get_or_404(id)
    return jsonify({'data': faq.to_dict()})

@app.route('/faqs/<int:id>', methods=['PUT'])
@admin_required
def update_faq(id):
    try:
        faq = FAQ.query.get_or_404(id)
        data = request.get_json()
        if 'question' in data: faq.question = data['question']
        if 'answer' in data: faq.answer = data['answer']
        if 'keywords' in data: faq.keywords = data['keywords']
        if 'category' in data: faq.category = data['category']
        if 'priority' in data: faq.priority = int(data['priority'])
        db.session.commit()
        return jsonify({'message': 'Updated'})
    except Exception:
        return jsonify({'error': 'Update failed'}), 500

@app.route('/faqs/<int:id>', methods=['DELETE'])
@admin_required
def delete_faq(id):
    faq = FAQ.query.get_or_404(id)
    db.session.delete(faq)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# --- TICKETS CRUD ---

@app.route('/tickets', methods=['GET'])
@admin_required
def get_tickets():
    status = request.args.get('status')
    query = Ticket.query
    if status:
        query = query.filter_by(status=status)
    tickets = query.order_by(Ticket.created_at.desc()).all()
    return jsonify({'message': 'OK', 'data': [t.to_dict() for t in tickets]})

@app.route('/tickets', methods=['POST'])
def create_ticket():
    data = request.get_json()
    ticket = Ticket(
        subject=data.get('subject'),
        description=data.get('description'),
        user_name=data.get('user_name'),
        user_email=data.get('user_email'),
        priority=data.get('priority', 'medium')
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({'success': True, 'ticket_id': ticket.id}), 201

@app.route('/tickets/<int:id>', methods=['GET'])
@admin_required
def get_ticket_detail(id):
    ticket = Ticket.query.get_or_404(id)
    return jsonify({'data': ticket.to_dict()})

@app.route('/tickets/<int:id>', methods=['PUT'])
@admin_required
def update_ticket(id):
    ticket = Ticket.query.get_or_404(id)
    data = request.get_json()
    if 'subject' in data: ticket.subject = data['subject']
    if 'description' in data: ticket.description = data['description']
    if 'status' in data: ticket.status = data['status']
    if 'priority' in data: ticket.priority = data['priority']
    if 'assigned_to' in data: ticket.assigned_to = data['assigned_to']
    if 'resolution' in data: ticket.resolution = data['resolution']
    
    if data.get('status') in ['resolved', 'closed'] and not ticket.resolved_at:
        ticket.resolved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Updated', 'data': ticket.to_dict()})

@app.route('/tickets/<int:id>', methods=['DELETE'])
@admin_required
def delete_ticket(id):
    ticket = Ticket.query.get_or_404(id)
    db.session.delete(ticket)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

@app.route('/tickets/<int:id>/status', methods=['PATCH'])
@admin_required
def update_ticket_status(id):
    ticket = Ticket.query.get_or_404(id)
    data = request.get_json()
    ticket.status = data.get('status', ticket.status)
    if ticket.status in ['resolved', 'closed'] and not ticket.resolved_at:
        ticket.resolved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Updated'})

# --- EXPERT SYSTEM CRUD (NODES & EDGES) ---

@app.route('/api/nodes', methods=['GET'])
@admin_required
def get_nodes():
    nodes = DecisionNode.query.all()
    return jsonify([node.to_dict() for node in nodes])

@app.route('/api/nodes', methods=['POST'])
@admin_required
def create_node():
    data = request.get_json()
    new_node = DecisionNode(
        content=data['content'],
        type=data['type'],
        is_root=data.get('is_root', False)
    )
    db.session.add(new_node)
    db.session.commit()
    return jsonify(new_node.to_dict()), 201

@app.route('/api/nodes/<int:id>', methods=['PUT'])
@admin_required
def update_node(id):
    node = DecisionNode.query.get_or_404(id)
    data = request.get_json()
    node.content = data.get('content', node.content)
    node.type = data.get('type', node.type)
    db.session.commit()
    return jsonify(node.to_dict())

@app.route('/api/nodes/<int:id>', methods=['DELETE'])
@admin_required
def delete_node(id):
    node = DecisionNode.query.get_or_404(id)
    # Hapus semua edges terkait
    DecisionEdge.query.filter((DecisionEdge.source_id == id) | (DecisionEdge.target_id == id)).delete()
    db.session.delete(node)
    db.session.commit()
    return jsonify({'message': 'Node deleted'})

@app.route('/api/edges', methods=['GET'])
@admin_required
def get_edges():
    edges = DecisionEdge.query.all()
    result = []
    for edge in edges:
        result.append({
            'id': edge.id,
            'source_id': edge.source_id,
            'target_id': edge.target_id,
            'label': edge.label,
            'source_content': edge.source.content if edge.source else 'Unknown',
            'target_content': edge.target.content if edge.target else 'Unknown'
        })
    return jsonify(result)

@app.route('/api/edges', methods=['POST'])
@admin_required
def create_edge():
    data = request.get_json()
    new_edge = DecisionEdge(
        source_id=data['source_id'],
        target_id=data['target_id'],
        label=data['label']
    )
    db.session.add(new_edge)
    db.session.commit()
    return jsonify({'message': 'Edge created', 'id': new_edge.id}), 201

@app.route('/api/edges/<int:id>', methods=['DELETE'])
@admin_required
def delete_edge(id):
    edge = DecisionEdge.query.get_or_404(id)
    db.session.delete(edge)
    db.session.commit()
    return jsonify({'message': 'Edge deleted'})

# --- STATS & ANALYTICS API ---

@app.route('/api/stats/chat-activity')
@admin_required
def chat_activity():
    """Return chat count per day for the last 7 days"""
    labels = []
    values = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = ChatLog.query.filter(ChatLog.timestamp >= day_start, ChatLog.timestamp < day_end).count()
        labels.append(day.strftime('%a'))
        values.append(count)
    return jsonify({'labels': labels, 'values': values})

@app.route('/api/stats/ticket-categories')
@admin_required
def ticket_categories():
    """Return ticket count grouped by category"""
    results = db.session.query(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category).all()
    labels = [r[0] or 'Uncategorized' for r in results]
    values = [r[1] for r in results]
    if not labels:
        labels, values = ['Belum ada'], [1]
    return jsonify({'labels': labels, 'values': values})

@app.route('/api/stats/top-problems')
@admin_required
def top_problems():
    """Return top 10 most common ticket subjects"""
    start = request.args.get('start')
    end = request.args.get('end')
    query = db.session.query(Ticket.subject, func.count(Ticket.id)).group_by(Ticket.subject)
    if start:
        query = query.filter(Ticket.created_at >= datetime.fromisoformat(start))
    if end:
        query = query.filter(Ticket.created_at <= datetime.fromisoformat(end))
    results = query.order_by(func.count(Ticket.id).desc()).limit(10).all()
    return jsonify([{'subject': r[0], 'count': r[1]} for r in results])

# --- CHAT LOGS API ---

@app.route('/api/chat-logs')
@admin_required
def get_chat_logs():
    """Return recent chat logs for admin review"""
    logs = ChatLog.query.order_by(ChatLog.timestamp.desc()).limit(100).all()
    return jsonify([{
        'id': l.id,
        'user_message': l.user_message,
        'bot_response': l.bot_response,
        'response_type': l.response_type,
        'feedback': l.feedback,
        'timestamp': l.timestamp.isoformat() if l.timestamp else None
    } for l in logs])

# --- CHAT FEEDBACK API ---

@app.route('/api/chat-feedback', methods=['POST'])
def chat_feedback():
    """Save user feedback (thumbs up/down) for the most recent bot response"""
    data = request.get_json()
    fb = data.get('feedback')
    if fb not in ('up', 'down'):
        return jsonify({'error': 'Feedback must be up or down'}), 400
    log = ChatLog.query.order_by(ChatLog.timestamp.desc()).first()
    if log:
        log.feedback = fb
        db.session.commit()
        return jsonify({'message': 'Feedback saved'})
    return jsonify({'error': 'No chat log found'}), 404

# --- EXPORT API ---

@app.route('/api/export/tickets')
@admin_required
def export_tickets():
    """Export tickets as CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Subject', 'Description', 'Status', 'Priority', 'User', 'Email', 'Created', 'Resolved'])
    for t in Ticket.query.order_by(Ticket.created_at.desc()).all():
        writer.writerow([t.id, t.subject, t.description, t.status, t.priority, t.user_name, t.user_email, t.created_at, t.resolved_at])
    output.seek(0)
    return Response(output.getvalue(), mimetype='text/csv', headers={'Content-Disposition': 'attachment;filename=tickets.csv'})

@app.route('/api/export/chat-logs')
@admin_required
def export_chat_logs():
    """Export chat logs as CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'User Message', 'Bot Response', 'Type', 'Feedback', 'Timestamp'])
    for l in ChatLog.query.order_by(ChatLog.timestamp.desc()).all():
        writer.writerow([l.id, l.user_message, l.bot_response, l.response_type, l.feedback or '', l.timestamp])
    output.seek(0)
    return Response(output.getvalue(), mimetype='text/csv', headers={'Content-Disposition': 'attachment;filename=chat_logs.csv'})

# --- MAIN ENTRY POINT ---

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_expert_system()
    
    print("=" * 50)
    print("IT Support App Started on http://127.0.0.1:5001")
    print("=" * 50)
    app.run(debug=True, host='127.0.0.1', port=5001)