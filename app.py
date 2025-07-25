from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
import json
import os
import logging
from datetime import datetime
from functools import wraps
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///it_support.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'kunci-rahasia-super-aman-untuk-it-support')

# Initialize extensions
db = SQLAlchemy(app)
# Admin credentials (in production, use proper user management)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("admin123".encode()).hexdigest()  # Change this in production!

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Database Models
class Solution(db.Model):
    __tablename__ = 'solutions'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(80), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    keywords = db.Column(db.String(250), nullable=True, index=True)
    description = db.Column(db.Text, nullable=False)
    steps = db.Column(db.Text, nullable=True)
    priority = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'title': self.title,
            'keywords': self.keywords,
            'description': self.description,
            'steps': json.loads(self.steps) if self.steps else [],
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class FAQ(db.Model):
    __tablename__ = 'faqs'
    
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(250), nullable=False, index=True)
    answer = db.Column(db.Text, nullable=False)
    keywords = db.Column(db.String(250), nullable=True, index=True)
    category = db.Column(db.String(80), nullable=True)
    priority = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'question': self.question,
            'answer': self.answer,
            'keywords': self.keywords,
            'category': self.category,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(250), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='open')  # open, in_progress, resolved, closed
    priority = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, urgent
    category = db.Column(db.String(80), nullable=True)
    user_name = db.Column(db.String(100), nullable=True)
    user_email = db.Column(db.String(150), nullable=True)
    assigned_to = db.Column(db.String(100), nullable=True)
    resolution = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'subject': self.subject,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'user_name': self.user_name,
            'user_email': self.user_email,
            'assigned_to': self.assigned_to,
            'resolution': self.resolution,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class ChatLog(db.Model):
    __tablename__ = 'chat_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_message = db.Column(db.Text, nullable=False)
    bot_response = db.Column(db.Text, nullable=False)
    response_type = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Simple keyword-based chatbot
def get_simple_response(user_message):
    """Enhanced keyword-based response system"""
    user_lower = user_message.lower()
    
    # Greeting responses
    if any(word in user_lower for word in ['halo', 'hai', 'hello', 'hi', 'selamat']):
        return "Halo! Saya asisten IT virtual. Ada masalah teknis yang bisa saya bantu? Anda bisa menanyakan tentang WiFi, komputer lemot, blue screen, printer, atau masalah IT lainnya.", 'greeting'
    
    # Network issues
    elif any(word in user_lower for word in ['wifi', 'wi-fi', 'internet', 'jaringan', 'koneksi', 'tidak konek', 'putus']):
        return """**Solusi Masalah Jaringan/WiFi:**

1. **Restart perangkat** - Restart router dan komputer Anda
2. **Periksa koneksi** - Pastikan WiFi sudah dihidupkan di perangkat
3. **Reset jaringan** - Lupakan jaringan WiFi dan sambungkan kembali
4. **Update driver** - Update driver network adapter
5. **Test koneksi** - Coba sambungkan ke jaringan lain untuk tes
6. **Hubungi provider** - Jika masih bermasalah, hubungi provider internet

Tips: Periksa juga apakah ada gangguan dari provider internet di area Anda.""", 'solution'
    
    # Performance issues
    elif any(word in user_lower for word in ['lemot', 'lambat', 'hang', 'lag', 'ngelag', 'macet', 'freezing']):
        return """**Mengatasi Komputer Lemot:**

1. **Task Manager** - Tutup program yang tidak diperlukan
2. **Disk Cleanup** - Bersihkan file temporary dan sampah
3. **Startup Programs** - Nonaktifkan program startup yang tidak perlu
4. **Antivirus Scan** - Scan virus dengan antivirus terbaru
5. **Restart Rutin** - Restart komputer secara berkala
6. **Storage Space** - Pastikan hard disk memiliki space kosong minimal 15%
7. **Hardware Upgrade** - Pertimbangkan upgrade RAM atau SSD

Quick Fix: Restart komputer terlebih dahulu, sering kali ini sudah cukup membantu.""", 'solution'
    
    # Blue screen issues
    elif any(word in user_lower for word in ['blue screen', 'bsod', 'layar biru', 'crash']):
        return """**Mengatasi Blue Screen of Death (BSOD):**

1. **Catat Error Code** - Foto atau catat kode error yang muncul
2. **Safe Mode** - Restart dan masuk ke Safe Mode
3. **Driver Issues** - Update atau rollback driver yang baru diinstal
4. **System File Check** - Jalankan: `sfc /scannow` di Command Prompt
5. **Memory Test** - Jalankan Windows Memory Diagnostic
6. **Hardware Check** - Periksa RAM, hard disk, dan power supply
7. **Professional Help** - Jika terus terjadi, backup data dan konsultasi teknisi

Penting: BSOD menunjukkan masalah serius, jangan diabaikan.""", 'solution'
    
    # Printer issues
    elif any(word in user_lower for word in ['printer', 'print', 'cetak', 'tidak mencetak']):
        return """**Solusi Masalah Printer:**

1. **Koneksi** - Periksa koneksi USB/jaringan dan daya printer
2. **Print Spooler** - Restart layanan Print Spooler di Services
3. **Print Queue** - Bersihkan antrean cetak yang tertunda
4. **Driver Update** - Update atau reinstall driver printer
5. **Test Print** - Test cetak dengan Notepad atau aplikasi sederhana
6. **Consumables** - Periksa level tinta/toner
7. **Maintenance** - Bersihkan print head jika diperlukan

Tips: Pastikan printer dalam kondisi online dan tidak ada paper jam.""", 'solution'
    
    # Virus/security issues
    elif any(word in user_lower for word in ['virus', 'malware', 'terinfeksi', 'keamanan', 'security']):
        return """**Mengatasi Virus/Malware:**

1. **Full Scan** - Jalankan full scan dengan antivirus terbaru
2. **Update Database** - Update database virus antivirus
3. **Secondary Scan** - Scan dengan Malwarebytes atau Windows Defender
4. **Safe Browsing** - Hindari download dari sumber tidak terpercaya
5. **Email Safety** - Jangan klik link atau attachment mencurigakan
6. **System Update** - Update sistem operasi secara rutin
7. **Backup** - Backup data penting secara berkala

Pencegahan: Selalu gunakan antivirus yang ter-update dan berhati-hati saat browsing.""", 'solution'
    
    # Password issues
    elif any(word in user_lower for word in ['password', 'kata sandi', 'lupa', 'reset']):
        return """**Mengatasi Masalah Password:**

1. **Try Common** - Coba password yang biasa Anda gunakan
2. **Forgot Password** - Gunakan fitur 'Forgot Password' jika tersedia
3. **Microsoft Account** - Untuk Windows: gunakan akun Microsoft untuk reset
4. **Password Reset Disk** - Gunakan USB reset password jika ada
5. **Password Manager** - Pertimbangkan menggunakan password manager
6. **Strong Password** - Buat password yang kuat tapi mudah diingat

Tips: Kombinasikan huruf besar, kecil, angka, dan simbol untuk password yang aman.""", 'solution'
    
    # Thanks/gratitude
    elif any(word in user_lower for word in ['terima kasih', 'makasih', 'thanks', 'thank you']):
        return "Sama-sama! Senang bisa membantu. Jika ada masalah IT lainnya, jangan ragu untuk bertanya lagi. Saya siap membantu 24/7!", 'gratitude'
    
    # Default response
    else:
        return """Maaf, saya belum bisa memahami masalah Anda sepenuhnya. 

**Saya bisa membantu dengan:**
- Masalah WiFi/Internet
- Komputer lemot/hang
- Blue Screen (BSOD)
- Masalah printer
- Virus/malware
- Password/login
- Masalah IT umum lainnya

Bisa jelaskan masalah Anda dengan lebih detail? Atau pilih salah satu kategori di atas.""", 'fallback'

# Routes
@app.route('/')
def index():
    """Render optimized homepage"""
    return render_template('index.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username dan password harus diisi', 'error')
            return render_template('admin_login.html')
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if username == ADMIN_USERNAME and password_hash == ADMIN_PASSWORD_HASH:
            session['admin_logged_in'] = True
            session['admin_username'] = username
            flash('Login berhasil!', 'success')
            return redirect(url_for('admin'))
        else:
            flash('Username atau password salah', 'error')
            return render_template('admin_login.html')
    
    # If already logged in, redirect to admin
    if session.get('admin_logged_in'):
        return redirect(url_for('admin'))
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    """Admin logout"""
    session.clear()
    flash('Logout berhasil', 'info')
    return redirect(url_for('admin_login'))
@app.route('/admin')
@admin_required
def admin():
    """Render admin page (protected)"""
    return render_template('admin.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests with improved error handling"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'response': 'Invalid request format.', 'type': 'error'}), 400
        
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'response': 'Silakan tulis pesan Anda.', 'type': 'error'}), 400
        
        if len(user_message) > 1000:
            return jsonify({'response': 'Pesan terlalu panjang. Maksimal 1000 karakter.', 'type': 'error'}), 400
        
        # Get response using simple keyword matching
        response, response_type = get_simple_response(user_message)
        
        # Log the conversation (with error handling)
        try:
            chat_log = ChatLog(
                user_message=user_message,
                bot_response=response,
                response_type=response_type
            )
            db.session.add(chat_log)
            db.session.commit()
        except Exception as log_error:
            logger.error(f"Error logging chat: {log_error}")
            # Don't fail the request if logging fails
        
        return jsonify({
            'response': response,
            'type': response_type
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({
            'response': 'Maaf, terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.', 
            'type': 'error'
        }), 500

@app.route('/solutions')
def solutions():
    """Get all solutions with better error handling"""
    try:
        solutions = Solution.query.order_by(Solution.priority.desc(), Solution.created_at.desc()).all()
        if not solutions:
            return jsonify({
                'message': 'Belum ada solusi yang tersedia. Silakan hubungi administrator.',
                'data': []
            }), 200
        
        solutions_data = []
        for solution in solutions:
            try:
                solutions_data.append(solution.to_dict())
            except Exception as e:
                logger.error(f"Error converting solution {solution.id} to dict: {e}")
                continue
        
        return jsonify({
            'message': 'Solusi berhasil dimuat',
            'data': solutions_data,
            'total': len(solutions_data)
        })
    except Exception as e:
        logger.error(f"Error getting solutions: {e}")
        return jsonify({
            'error': 'Gagal memuat data solusi. Silakan coba lagi.',
            'message': 'Terjadi kesalahan saat mengambil data solusi'
        }), 500

@app.route('/faqs')
def faqs():
    """Get all FAQs with better error handling"""
    try:
        faqs = FAQ.query.order_by(FAQ.priority.desc(), FAQ.created_at.desc()).all()
        if not faqs:
            return jsonify({
                'message': 'Belum ada FAQ yang tersedia. Silakan hubungi administrator.',
                'data': []
            }), 200
        
        faqs_data = []
        for faq in faqs:
            try:
                faqs_data.append(faq.to_dict())
            except Exception as e:
                logger.error(f"Error converting FAQ {faq.id} to dict: {e}")
                continue
        
        return jsonify({
            'message': 'FAQ berhasil dimuat',
            'data': faqs_data,
            'total': len(faqs_data)
        })
    except Exception as e:
        logger.error(f"Error getting FAQs: {e}")
        return jsonify({
            'error': 'Gagal memuat data FAQ. Silakan coba lagi.',
            'message': 'Terjadi kesalahan saat mengambil data FAQ'
        }), 500

@app.route('/api/solutions_by_category')
def solutions_by_category():
    """Get solutions by category"""
    try:
        category = request.args.get('category', '')
        if not category:
            return jsonify({'error': 'Category parameter required'}), 400
        
        solutions = Solution.query.filter_by(category=category)\
                                 .order_by(Solution.priority.desc(), Solution.created_at.desc())\
                                 .all()
        return jsonify([solution.to_dict() for solution in solutions])
    except Exception as e:
        logger.error(f"Error getting solutions by category: {e}")
        return jsonify({'error': 'Error fetching solutions'}), 500

@app.route('/api/faqs_by_category')
def faqs_by_category():
    """Get FAQs by category"""
    try:
        category = request.args.get('category', '')
        if not category:
            return jsonify({'error': 'Category parameter required'}), 400
        
        faqs = FAQ.query.filter_by(category=category)\
                       .order_by(FAQ.priority.desc(), FAQ.created_at.desc())\
                       .all()
        return jsonify([faq.to_dict() for faq in faqs])
    except Exception as e:
        logger.error(f"Error getting FAQs by category: {e}")
        return jsonify({'error': 'Error fetching FAQs'}), 500

# CRUD Routes for Solutions
@app.route('/solutions', methods=['POST'])
@admin_required
def create_solution():
    """Create a new solution"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['category', 'title', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new solution
        solution = Solution(
            category=data.get('category'),
            title=data.get('title'),
            keywords=data.get('keywords', ''),
            description=data.get('description'),
            steps=data.get('steps', '[]'),
            priority=int(data.get('priority', 0))
        )
        
        db.session.add(solution)
        db.session.commit()
        
        return jsonify({
            'message': 'Solusi berhasil ditambahkan',
            'data': solution.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating solution: {e}")
        return jsonify({'error': 'Gagal menambahkan solusi'}), 500

@app.route('/solutions/<int:solution_id>', methods=['GET'])
def get_solution(solution_id):
    """Get a specific solution"""
    try:
        solution = Solution.query.get_or_404(solution_id)
        return jsonify({
            'message': 'Solusi ditemukan',
            'data': solution.to_dict()
        })
    except Exception as e:
        logger.error(f"Error getting solution {solution_id}: {e}")
        return jsonify({'error': 'Solusi tidak ditemukan'}), 404

@app.route('/solutions/<int:solution_id>', methods=['PUT'])
@admin_required
def update_solution(solution_id):
    """Update an existing solution"""
    try:
        solution = Solution.query.get_or_404(solution_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'category' in data:
            solution.category = data['category']
        if 'title' in data:
            solution.title = data['title']
        if 'keywords' in data:
            solution.keywords = data['keywords']
        if 'description' in data:
            solution.description = data['description']
        if 'steps' in data:
            solution.steps = data['steps']
        if 'priority' in data:
            solution.priority = int(data['priority'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Solusi berhasil diupdate',
            'data': solution.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating solution {solution_id}: {e}")
        return jsonify({'error': 'Gagal mengupdate solusi'}), 500

@app.route('/solutions/<int:solution_id>', methods=['DELETE'])
@admin_required
def delete_solution(solution_id):
    """Delete a solution"""
    try:
        solution = Solution.query.get_or_404(solution_id)
        db.session.delete(solution)
        db.session.commit()
        
        return jsonify({
            'message': 'Solusi berhasil dihapus'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting solution {solution_id}: {e}")
        return jsonify({'error': 'Gagal menghapus solusi'}), 500

# CRUD Routes for FAQs
@app.route('/faqs', methods=['POST'])
@admin_required
def create_faq():
    """Create a new FAQ"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['question', 'answer']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new FAQ
        faq = FAQ(
            question=data.get('question'),
            answer=data.get('answer'),
            keywords=data.get('keywords', ''),
            category=data.get('category', ''),
            priority=int(data.get('priority', 0))
        )
        
        db.session.add(faq)
        db.session.commit()
        
        return jsonify({
            'message': 'FAQ berhasil ditambahkan',
            'data': faq.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating FAQ: {e}")
        return jsonify({'error': 'Gagal menambahkan FAQ'}), 500

@app.route('/faqs/<int:faq_id>', methods=['GET'])
def get_faq(faq_id):
    """Get a specific FAQ"""
    try:
        faq = FAQ.query.get_or_404(faq_id)
        return jsonify({
            'message': 'FAQ ditemukan',
            'data': faq.to_dict()
        })
    except Exception as e:
        logger.error(f"Error getting FAQ {faq_id}: {e}")
        return jsonify({'error': 'FAQ tidak ditemukan'}), 404

@app.route('/faqs/<int:faq_id>', methods=['PUT'])
@admin_required
def update_faq(faq_id):
    """Update an existing FAQ"""
    try:
        faq = FAQ.query.get_or_404(faq_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'question' in data:
            faq.question = data['question']
        if 'answer' in data:
            faq.answer = data['answer']
        if 'keywords' in data:
            faq.keywords = data['keywords']
        if 'category' in data:
            faq.category = data['category']
        if 'priority' in data:
            faq.priority = int(data['priority'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'FAQ berhasil diupdate',
            'data': faq.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating FAQ {faq_id}: {e}")
        return jsonify({'error': 'Gagal mengupdate FAQ'}), 500

@app.route('/faqs/<int:faq_id>', methods=['DELETE'])
@admin_required
def delete_faq(faq_id):
    """Delete a FAQ"""
    try:
        faq = FAQ.query.get_or_404(faq_id)
        db.session.delete(faq)
        db.session.commit()
        
        return jsonify({
            'message': 'FAQ berhasil dihapus'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting FAQ {faq_id}: {e}")
        return jsonify({'error': 'Gagal menghapus FAQ'}), 500

# CRUD Routes for Tickets
@app.route('/tickets')
@admin_required
def get_tickets():
    """Get all tickets with filtering support"""
    try:
        status_filter = request.args.get('status')
        priority_filter = request.args.get('priority')
        category_filter = request.args.get('category')
        
        query = Ticket.query
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        if priority_filter:
            query = query.filter_by(priority=priority_filter)
        if category_filter:
            query = query.filter_by(category=category_filter)
        
        tickets = query.order_by(Ticket.created_at.desc()).all()
        
        if not tickets:
            return jsonify({
                'message': 'Belum ada tiket yang tersedia.',
                'data': []
            }), 200
        
        tickets_data = []
        for ticket in tickets:
            try:
                tickets_data.append(ticket.to_dict())
            except Exception as e:
                logger.error(f"Error converting ticket {ticket.id} to dict: {e}")
                continue
        
        return jsonify({
            'message': 'Tiket berhasil dimuat',
            'data': tickets_data,
            'total': len(tickets_data)
        })
    except Exception as e:
        logger.error(f"Error getting tickets: {e}")
        return jsonify({
            'error': 'Gagal memuat data tiket. Silakan coba lagi.',
            'message': 'Terjadi kesalahan saat mengambil data tiket'
        }), 500

@app.route('/tickets', methods=['POST'])
@admin_required
def create_ticket():
    """Create a new ticket"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['subject', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new ticket
        ticket = Ticket(
            subject=data.get('subject'),
            description=data.get('description'),
            status=data.get('status', 'open'),
            priority=data.get('priority', 'medium'),
            category=data.get('category', ''),
            user_name=data.get('user_name', ''),
            user_email=data.get('user_email', ''),
            assigned_to=data.get('assigned_to', '')
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        return jsonify({
            'message': 'Tiket berhasil ditambahkan',
            'data': ticket.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating ticket: {e}")
        return jsonify({'error': 'Gagal menambahkan tiket'}), 500

@app.route('/tickets/<int:ticket_id>', methods=['GET'])
@admin_required
def get_ticket(ticket_id):
    """Get a specific ticket"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        return jsonify({
            'message': 'Tiket ditemukan',
            'data': ticket.to_dict()
        })
    except Exception as e:
        logger.error(f"Error getting ticket {ticket_id}: {e}")
        return jsonify({'error': 'Tiket tidak ditemukan'}), 404

@app.route('/tickets/<int:ticket_id>', methods=['PUT'])
@admin_required
def update_ticket(ticket_id):
    """Update an existing ticket"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'subject' in data:
            ticket.subject = data['subject']
        if 'description' in data:
            ticket.description = data['description']
        if 'status' in data:
            ticket.status = data['status']
            # Set resolved_at if status is resolved or closed
            if data['status'] in ['resolved', 'closed'] and not ticket.resolved_at:
                ticket.resolved_at = datetime.utcnow()
        if 'priority' in data:
            ticket.priority = data['priority']
        if 'category' in data:
            ticket.category = data['category']
        if 'user_name' in data:
            ticket.user_name = data['user_name']
        if 'user_email' in data:
            ticket.user_email = data['user_email']
        if 'assigned_to' in data:
            ticket.assigned_to = data['assigned_to']
        if 'resolution' in data:
            ticket.resolution = data['resolution']
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Tiket berhasil diupdate',
            'data': ticket.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating ticket {ticket_id}: {e}")
        return jsonify({'error': 'Gagal mengupdate tiket'}), 500

@app.route('/tickets/<int:ticket_id>', methods=['DELETE'])
@admin_required
def delete_ticket(ticket_id):
    """Delete a ticket"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        db.session.delete(ticket)
        db.session.commit()
        
        return jsonify({
            'message': 'Tiket berhasil dihapus'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting ticket {ticket_id}: {e}")
        return jsonify({'error': 'Gagal menghapus tiket'}), 500

@app.route('/tickets/<int:ticket_id>/status', methods=['PATCH'])
@admin_required
def update_ticket_status(ticket_id):
    """Update ticket status only"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        old_status = ticket.status
        ticket.status = data['status']
        
        # Set resolved_at if status is resolved or closed
        if data['status'] in ['resolved', 'closed'] and old_status not in ['resolved', 'closed']:
            ticket.resolved_at = datetime.utcnow()
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Status tiket berhasil diupdate',
            'data': ticket.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating ticket status {ticket_id}: {e}")
        return jsonify({'error': 'Gagal mengupdate status tiket'}), 500

# Public ticket creation endpoint for clients
@app.route('/api/tickets/create', methods=['POST'])
def create_client_ticket():
    """Create a new ticket from client-side (public endpoint)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['subject', 'description', 'user_name', 'user_email']
        for field in required_fields:
            if not data.get(field) or not str(data.get(field)).strip():
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format (basic validation)
        user_email = data.get('user_email', '').strip()
        if '@' not in user_email or '.' not in user_email:
            return jsonify({'error': 'Valid email address is required'}), 400
        
        # Validate subject and description length
        subject = data.get('subject', '').strip()
        description = data.get('description', '').strip()
        
        if len(subject) < 5 or len(subject) > 250:
            return jsonify({'error': 'Subject must be between 5 and 250 characters'}), 400
        
        if len(description) < 10 or len(description) > 2000:
            return jsonify({'error': 'Description must be between 10 and 2000 characters'}), 400
        
        # Create new ticket with default values for client submissions
        ticket = Ticket(
            subject=subject,
            description=description,
            status='open',  # Always start as open for client tickets
            priority=data.get('priority', 'medium'),
            category=data.get('category', ''),
            user_name=data.get('user_name', '').strip(),
            user_email=user_email,
            assigned_to='',  # Will be assigned by admin later
            resolution=''
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        # Return success response with ticket ID
        return jsonify({
            'success': True,
            'message': 'Tiket berhasil dibuat! Tim support akan segera menghubungi Anda.',
            'ticket_id': ticket.id,
            'data': {
                'id': ticket.id,
                'subject': ticket.subject,
                'status': ticket.status,
                'priority': ticket.priority,
                'created_at': ticket.created_at.isoformat() if ticket.created_at else None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating client ticket: {e}")
        return jsonify({
            'success': False,
            'error': 'Gagal membuat tiket. Silakan coba lagi atau hubungi support.'
        }), 500
    """Update ticket status only"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        old_status = ticket.status
        ticket.status = data['status']
        
        # Set resolved_at if status is resolved or closed
        if data['status'] in ['resolved', 'closed'] and old_status not in ['resolved', 'closed']:
            ticket.resolved_at = datetime.utcnow()
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Status tiket berhasil diupdate',
            'data': ticket.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating ticket status {ticket_id}: {e}")
        return jsonify({'error': 'Gagal mengupdate status tiket'}), 500

@app.route('/chat_logs')
@admin_required
def get_chat_logs():
    """Get chat logs for analytics"""
    try:
        logs = ChatLog.query.order_by(ChatLog.timestamp.desc()).limit(1000).all()
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
                'user_message': log.user_message,
                'bot_response': log.bot_response,
                'response_type': log.response_type,
                'timestamp': log.timestamp.isoformat() if log.timestamp else None
            })
        
        return jsonify({
            'message': 'Chat logs berhasil dimuat',
            'data': logs_data,
            'total': len(logs_data)
        })
    except Exception as e:
        logger.error(f"Error getting chat logs: {e}")
        return jsonify({'error': 'Gagal memuat chat logs'}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK', 
        'message': 'IT Support App is running',
        'timestamp': datetime.utcnow().isoformat()
    })

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"500 Internal Server Error: {error}")
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request_error(error):
    return jsonify({'error': 'Bad request'}), 400

# Database initialization
def init_database():
    """Initialize database with sample data"""
    try:
        with app.app_context():
            db.create_all()
            
            # Add comprehensive sample data if none exists
            if not Solution.query.first():
                solutions = [
                    # Network Solutions
                    Solution(
                        category='network',
                        title='Mengatasi WiFi Tidak Bisa Konek',
                        keywords='wifi, tidak konek, tidak bisa sambung, connection failed, jaringan bermasalah',
                        description='Solusi lengkap untuk masalah WiFi yang tidak bisa tersambung',
                        steps=json.dumps([
                            "Periksa apakah WiFi sudah dinyalakan di perangkat",
                            "Restart router dengan mencabut kabel power 30 detik",
                            "Forget network WiFi dan sambungkan kembali",
                            "Periksa password WiFi apakah sudah benar",
                            "Update driver network adapter",
                            "Reset network settings: netsh winsock reset",
                            "Ganti DNS ke 8.8.8.8 dan 8.8.4.4",
                            "Periksa apakah router dalam jangkauan",
                            "Coba sambungkan perangkat lain untuk test",
                            "Hubungi ISP jika masalah berlanjut"
                        ]),
                        priority=10
                    ),
                    Solution(
                        category='network',
                        title='Internet Lambat dan Sering Putus',
                        keywords='internet lambat, koneksi putus, loading lama, bandwidth rendah',
                        description='Cara mengatasi koneksi internet yang lambat dan tidak stabil',
                        steps=json.dumps([
                            "Test kecepatan internet dengan speedtest.net",
                            "Restart modem dan router",
                            "Periksa kabel ethernet apakah longgar",
                            "Tutup aplikasi yang menggunakan bandwidth tinggi",
                            "Scan malware yang mungkin menggunakan bandwidth",
                            "Ganti channel WiFi di router (1, 6, atau 11)",
                            "Update firmware router",
                            "Posisikan router di tempat terbuka",
                            "Gunakan kabel ethernet untuk koneksi stabil",
                            "Upgrade paket internet jika perlu"
                        ]),
                        priority=9
                    ),
                    
                    # Performance Solutions
                    Solution(
                        category='performance',
                        title='Laptop/PC Sangat Lemot dan Hang',
                        keywords='laptop lemot, pc lambat, hang, freeze, tidak responsif, macet',
                        description='Solusi komprehensif untuk mengatasi komputer yang berjalan lambat',
                        steps=json.dumps([
                            "Buka Task Manager (Ctrl+Shift+Esc) dan tutup program yang tidak perlu",
                            "Restart komputer untuk membersihkan memory",
                            "Jalankan Disk Cleanup untuk hapus file temporary",
                            "Nonaktifkan startup programs yang tidak perlu",
                            "Scan virus dengan antivirus terbaru",
                            "Defragmentasi hard disk (HDD saja)",
                            "Bersihkan registry dengan CCleaner",
                            "Periksa space hard disk (minimal 15% kosong)",
                            "Update driver terutama graphics dan chipset",
                            "Pertimbangkan upgrade RAM atau ganti ke SSD",
                            "Periksa suhu CPU dengan HWMonitor"
                        ]),
                        priority=10
                    ),
                    Solution(
                        category='performance',
                        title='Startup Windows Sangat Lama',
                        keywords='startup lama, boot lambat, loading windows, booting lemot',
                        description='Cara mempercepat waktu startup Windows',
                        steps=json.dumps([
                            "Buka Task Manager > Startup tab",
                            "Disable program startup yang tidak perlu",
                            "Jalankan msconfig dan pilih Selective Startup",
                            "Enable Fast Startup di Power Options",
                            "Scan dan repair system files: sfc /scannow",
                            "Defragmentasi hard disk secara rutin",
                            "Bersihkan registry dengan tools seperti CCleaner",
                            "Update semua driver ke versi terbaru",
                            "Periksa hard disk dengan chkdsk",
                            "Pertimbangkan upgrade ke SSD untuk boot yang lebih cepat"
                        ]),
                        priority=8
                    ),
                    
                    # OS Solutions
                    Solution(
                        category='os',
                        title='Blue Screen of Death (BSOD) Berulang',
                        keywords='blue screen, bsod, layar biru, crash, system crash, error windows',
                        description='Panduan lengkap mengatasi Blue Screen yang sering terjadi',
                        steps=json.dumps([
                            "Catat kode error BSOD (contoh: 0x0000007E)",
                            "Restart komputer dan masuk ke Safe Mode",
                            "Uninstall driver yang baru diinstall",
                            "Jalankan System File Checker: sfc /scannow",
                            "Jalankan Memory Diagnostic: mdsched",
                            "Update semua driver ke versi terbaru",
                            "Scan malware dengan antivirus",
                            "Periksa suhu CPU dan GPU",
                            "Test RAM dengan MemTest86",
                            "Rollback Windows Update jika perlu",
                            "Backup data dan pertimbangkan reinstall Windows"
                        ]),
                        priority=10
                    ),
                    Solution(
                        category='os',
                        title='Windows Update Gagal atau Error',
                        keywords='windows update error, update gagal, update stuck, pembaruan bermasalah',
                        description='Solusi untuk masalah Windows Update yang bermasalah',
                        steps=json.dumps([
                            "Restart komputer dan coba update lagi",
                            "Jalankan Windows Update Troubleshooter",
                            "Reset Windows Update components",
                            "Bersihkan folder SoftwareDistribution",
                            "Jalankan DISM tool: DISM /Online /Cleanup-Image /RestoreHealth",
                            "Jalankan sfc /scannow untuk repair system files",
                            "Download update manual dari Microsoft Catalog",
                            "Disable antivirus sementara saat update",
                            "Free up disk space minimal 10GB",
                            "Reset Windows Update dengan tool Microsoft"
                        ]),
                        priority=7
                    ),
                    
                    # Hardware Solutions
                    Solution(
                        category='hardware',
                        title='Komputer Mati Mendadak dan Restart Sendiri',
                        keywords='mati mendadak, restart sendiri, shutdown otomatis, power bermasalah',
                        description='Diagnosa dan solusi untuk komputer yang mati mendadak',
                        steps=json.dumps([
                            "Periksa suhu CPU dengan software monitoring",
                            "Bersihkan debu dari kipas dan heatsink",
                            "Periksa kabel power supply apakah longgar",
                            "Test dengan RAM satu per satu",
                            "Periksa kapasitor pada motherboard",
                            "Test power supply dengan multimeter",
                            "Update BIOS ke versi terbaru",
                            "Periksa log Event Viewer untuk error",
                            "Disable automatic restart di System Properties",
                            "Ganti thermal paste CPU jika perlu",
                            "Konsultasi teknisi jika masalah hardware"
                        ]),
                        priority=9
                    ),
                    Solution(
                        category='hardware',
                        title='RAM Bermasalah - Memory Error',
                        keywords='ram error, memory error, bad memory, ram rusak, memory bermasalah',
                        description='Cara mendeteksi dan mengatasi masalah RAM',
                        steps=json.dumps([
                            "Jalankan Windows Memory Diagnostic",
                            "Download dan jalankan MemTest86",
                            "Test RAM satu per satu jika ada beberapa",
                            "Bersihkan slot RAM dan modul RAM",
                            "Periksa apakah RAM terpasang dengan benar",
                            "Test dengan RAM di slot yang berbeda",
                            "Periksa kompatibilitas RAM dengan motherboard",
                            "Update BIOS motherboard",
                            "Periksa voltage RAM di BIOS",
                            "Ganti RAM yang bermasalah"
                        ]),
                        priority=8
                    ),
                    
                    # Software Solutions
                    Solution(
                        category='software',
                        title='Aplikasi Sering Crash dan Not Responding',
                        keywords='aplikasi crash, not responding, program error, software bermasalah',
                        description='Solusi untuk aplikasi yang sering crash atau hang',
                        steps=json.dumps([
                            "Restart aplikasi yang bermasalah",
                            "Update aplikasi ke versi terbaru",
                            "Jalankan aplikasi sebagai administrator",
                            "Periksa kompatibilitas dengan Windows",
                            "Reinstall aplikasi dari scratch",
                            "Scan file system dengan sfc /scannow",
                            "Update .NET Framework dan Visual C++ Redistributables",
                            "Disable antivirus sementara untuk test",
                            "Periksa log Event Viewer untuk error detail",
                            "Reset aplikasi jika memungkinkan",
                            "Hubungi support aplikasi jika masalah berlanjut"
                        ]),
                        priority=7
                    ),
                    Solution(
                        category='software',
                        title='Driver Bermasalah atau Tidak Terdeteksi',
                        keywords='driver error, driver tidak terdeteksi, device tidak dikenali, hardware tidak berfungsi',
                        description='Cara mengatasi masalah driver yang bermasalah',
                        steps=json.dumps([
                            "Buka Device Manager dan cari device dengan tanda seru",
                            "Uninstall driver yang bermasalah",
                            "Download driver terbaru dari website manufacturer",
                            "Install driver dalam mode compatibility",
                            "Gunakan Windows Update untuk cari driver",
                            "Rollback driver ke versi sebelumnya",
                            "Scan hardware changes di Device Manager",
                            "Disable driver signature enforcement jika perlu",
                            "Update Windows ke versi terbaru",
                            "Gunakan tools seperti Driver Booster"
                        ]),
                        priority=8
                    ),
                    
                    # Security Solutions
                    Solution(
                        category='security',
                        title='Komputer Terinfeksi Virus/Malware',
                        keywords='virus, malware, trojan, spyware, infected, terinfeksi, keamanan',
                        description='Langkah komprehensif mengatasi infeksi virus dan malware',
                        steps=json.dumps([
                            "Disconnect dari internet untuk mencegah data theft",
                            "Boot ke Safe Mode untuk isolasi",
                            "Update antivirus ke database terbaru",
                            "Jalankan full system scan",
                            "Gunakan Malwarebytes untuk scan tambahan",
                            "Jalankan Windows Defender Offline scan",
                            "Hapus file temporary dan cache browser",
                            "Reset browser settings ke default",
                            "Ganti semua password penting",
                            "Update sistem operasi dan software",
                            "Backup data penting secara rutin",
                            "Install ad-blocker dan anti-malware realtime"
                        ]),
                        priority=10
                    ),
                    Solution(
                        category='security',
                        title='Lupa Password Windows/Login',
                        keywords='lupa password, password reset, tidak bisa login, forgot password',
                        description='Cara mengatasi lupa password Windows',
                        steps=json.dumps([
                            "Coba password hint yang tersedia",
                            "Gunakan akun Microsoft untuk reset online",
                            "Boot dengan USB password reset disk",
                            "Gunakan Safe Mode dengan akun Administrator",
                            "Reset password dengan Command Prompt",
                            "Gunakan tools seperti Ophcrack",
                            "Reset dengan instalasi Windows (keep files)",
                            "Gunakan akun lokal lain jika ada",
                            "Hubungi administrator domain jika di kantor",
                            "Backup data dan reinstall Windows sebagai last resort"
                        ]),
                        priority=9
                    ),
                    
                    # Printer Solutions
                    Solution(
                        category='hardware',
                        title='Printer Tidak Bisa Print atau Error',
                        keywords='printer error, tidak bisa print, printer offline, print spooler',
                        description='Solusi lengkap untuk masalah printer',
                        steps=json.dumps([
                            "Periksa koneksi USB atau jaringan printer",
                            "Pastikan printer dalam keadaan online",
                            "Restart Print Spooler service",
                            "Clear print queue yang tertunda",
                            "Update atau reinstall driver printer",
                            "Periksa level tinta atau toner",
                            "Bersihkan print head jika perlu",
                            "Test print dengan aplikasi sederhana",
                            "Periksa paper jam atau masalah mekanis",
                            "Reset printer ke factory settings",
                            "Hubungi support printer jika masalah berlanjut"
                        ]),
                        priority=8
                    ),
                    
                    # Email Solutions
                    Solution(
                        category='software',
                        title='Email Tidak Bisa Kirim/Terima',
                        keywords='email error, tidak bisa kirim email, email bermasalah, smtp error',
                        description='Solusi untuk masalah email yang tidak berfungsi',
                        steps=json.dumps([
                            "Periksa koneksi internet",
                            "Verify email server settings (SMTP/POP3/IMAP)",
                            "Periksa username dan password email",
                            "Disable antivirus email protection sementara",
                            "Periksa firewall settings",
                            "Update email client ke versi terbaru",
                            "Coba akses email via webmail",
                            "Periksa quota mailbox",
                            "Reset email account settings",
                            "Hubungi email provider jika perlu"
                        ]),
                        priority=6
                    ),
                    
                    # Audio/Video Solutions
                    Solution(
                        category='hardware',
                        title='Audio Tidak Keluar atau Suara Bermasalah',
                        keywords='no audio, suara tidak keluar, speaker bermasalah, audio driver',
                        description='Cara mengatasi masalah audio yang tidak berfungsi',
                        steps=json.dumps([
                            "Periksa volume dan mute settings",
                            "Test dengan headphone/speaker berbeda",
                            "Update audio driver",
                            "Restart Windows Audio service",
                            "Jalankan Audio Troubleshooter",
                            "Periksa default audio device",
                            "Reinstall audio driver",
                            "Periksa audio format compatibility",
                            "Disable audio enhancements",
                            "Reset audio settings ke default"
                        ]),
                        priority=7
                    )
                ]
                
                faqs = [
                    # Network FAQs
                    FAQ(
                        question='Bagaimana cara mengatasi WiFi yang sering putus?',
                        answer='Restart router, periksa jarak dari router, dan pastikan driver network adapter ter-update. Juga periksa interferensi dari perangkat lain seperti microwave atau bluetooth. Ganti channel WiFi ke 1, 6, atau 11 untuk menghindari interferensi.',
                        keywords='wifi putus, koneksi tidak stabil, jaringan bermasalah, disconnect',
                        category='network',
                        priority=10
                    ),
                    FAQ(
                        question='Kenapa internet saya lambat padahal paket sudah besar?',
                        answer='Internet lambat bisa disebabkan oleh: malware yang menggunakan bandwidth, terlalu banyak device tersambung, router yang overheating, atau ISP yang sedang maintenance. Coba restart router dan scan malware.',
                        keywords='internet lambat, bandwidth, speed rendah, loading lama',
                        category='network',
                        priority=9
                    ),
                    FAQ(
                        question='Bagaimana cara mengetahui password WiFi yang sudah tersimpan?',
                        answer='Di Windows: buka Command Prompt dan ketik "netsh wlan show profile [nama_wifi] key=clear". Di Android: buka Settings > WiFi > pilih network > Share (akan muncul QR code). Di iPhone: buka Settings > WiFi > tap info icon.',
                        keywords='password wifi, lihat password, wifi tersimpan, network key',
                        category='network',
                        priority=8
                    ),
                    
                    # Performance FAQs
                    FAQ(
                        question='Kenapa komputer saya lemot setelah update Windows?',
                        answer='Update Windows kadang menyebabkan masalah kompatibilitas driver atau mengaktifkan fitur yang memakan resource. Coba update semua driver, disable startup programs yang tidak perlu, dan periksa Windows Update untuk patch tambahan.',
                        keywords='komputer lemot, lambat setelah update, windows update slow',
                        category='performance',
                        priority=10
                    ),
                    FAQ(
                        question='Berapa RAM yang dibutuhkan untuk Windows 11?',
                        answer='Windows 11 membutuhkan minimal 4GB RAM, tapi untuk performa optimal disarankan 8GB atau lebih. Untuk gaming atau aplikasi berat, 16GB lebih ideal. Periksa usage RAM di Task Manager untuk menentukan apakah perlu upgrade.',
                        keywords='ram windows 11, memory requirement, upgrade ram',
                        category='performance',
                        priority=8
                    ),
                    FAQ(
                        question='Bagaimana cara mempercepat startup Windows?',
                        answer='Disable startup programs yang tidak perlu di Task Manager > Startup tab. Enable Fast Startup di Power Options. Gunakan SSD jika masih HDD. Bersihkan registry dan jalankan disk cleanup secara rutin.',
                        keywords='startup lambat, boot lama, mempercepat startup',
                        category='performance',
                        priority=9
                    ),
                    
                    # Hardware FAQs
                    FAQ(
                        question='Apa yang harus dilakukan saat blue screen?',
                        answer='Catat kode error, restart komputer, masuk ke Safe Mode, dan uninstall driver yang baru diinstall. Jika terus terjadi, jalankan memory test dan periksa suhu CPU. BSOD biasanya menunjukkan masalah hardware atau driver.',
                        keywords='blue screen, bsod, layar biru, system crash',
                        category='os',
                        priority=10
                    ),
                    FAQ(
                        question='Bagaimana cara mengetahui hardware yang bermasalah?',
                        answer='Gunakan tools diagnostic: MemTest86 untuk RAM, CrystalDiskInfo untuk hard disk, HWMonitor untuk suhu, dan FurMark untuk graphics card. Periksa juga Event Viewer untuk error log sistem.',
                        keywords='hardware bermasalah, diagnosa hardware, test hardware',
                        category='hardware',
                        priority=9
                    ),
                    FAQ(
                        question='Kenapa komputer saya sering restart sendiri?',
                        answer='Restart otomatis biasanya karena overheating, power supply bermasalah, atau RAM rusak. Periksa suhu CPU, bersihkan debu, dan test RAM satu per satu. Juga disable automatic restart di System Properties.',
                        keywords='restart sendiri, shutdown otomatis, mati mendadak',
                        category='hardware',
                        priority=9
                    ),
                    
                    # Software FAQs
                    FAQ(
                        question='Bagaimana cara mengatasi aplikasi yang sering crash?',
                        answer='Update aplikasi ke versi terbaru, jalankan sebagai administrator, periksa kompatibilitas dengan Windows, dan reinstall jika perlu. Juga update .NET Framework dan Visual C++ Redistributables.',
                        keywords='aplikasi crash, program error, software bermasalah',
                        category='software',
                        priority=8
                    ),
                    FAQ(
                        question='Kenapa driver tidak terdeteksi di Device Manager?',
                        answer='Download driver terbaru dari website manufacturer, install dalam mode compatibility, atau gunakan Windows Update. Jika masih tidak terdeteksi, coba disable driver signature enforcement sementara.',
                        keywords='driver tidak terdeteksi, device manager, hardware tidak dikenali',
                        category='software',
                        priority=7
                    ),
                    FAQ(
                        question='Bagaimana cara mengatasi Windows Update yang stuck?',
                        answer='Restart komputer, jalankan Windows Update Troubleshooter, reset Windows Update components, atau download update manual dari Microsoft Update Catalog. Pastikan ada space disk yang cukup.',
                        keywords='windows update stuck, update gagal, pembaruan bermasalah',
                        category='os',
                        priority=8
                    ),
                    
                    # Security FAQs
                    FAQ(
                        question='Bagaimana cara mengetahui komputer terinfeksi virus?',
                        answer='Tanda-tanda: komputer lambat, popup iklan, homepage browser berubah, file hilang, atau aktivitas network yang mencurigakan. Jalankan full scan dengan antivirus dan Malwarebytes untuk memastikan.',
                        keywords='virus, malware, infected, terinfeksi, keamanan',
                        category='security',
                        priority=10
                    ),
                    FAQ(
                        question='Apa yang harus dilakukan jika lupa password Windows?',
                        answer='Gunakan password hint, reset via akun Microsoft, boot dengan USB password reset disk, atau gunakan Safe Mode dengan akun Administrator. Sebagai last resort, reinstall Windows dengan keep files.',
                        keywords='lupa password, password reset, tidak bisa login',
                        category='security',
                        priority=9
                    ),
                    FAQ(
                        question='Bagaimana cara membuat password yang aman?',
                        answer='Gunakan kombinasi huruf besar, kecil, angka, dan simbol. Minimal 12 karakter. Hindari informasi personal. Gunakan password manager untuk menyimpan password yang unik untuk setiap akun.',
                        keywords='password aman, keamanan password, strong password',
                        category='security',
                        priority=7
                    ),
                    
                    # Printer FAQs
                    FAQ(
                        question='Kenapa printer saya tidak bisa print?',
                        answer='Periksa koneksi USB/jaringan, pastikan printer online, restart Print Spooler service, clear print queue, dan update driver printer. Juga periksa level tinta dan paper jam.',
                        keywords='printer tidak bisa print, printer offline, print error',
                        category='hardware',
                        priority=8
                    ),
                    FAQ(
                        question='Bagaimana cara mengatasi printer yang print bergaris?',
                        answer='Bersihkan print head melalui utility printer, periksa level tinta, align print head, dan gunakan kertas yang sesuai. Jika masih bergaris, mungkin cartridge perlu diganti.',
                        keywords='printer bergaris, print quality buruk, hasil print jelek',
                        category='hardware',
                        priority=7
                    ),
                    
                    # Email FAQs
                    FAQ(
                        question='Kenapa email saya tidak bisa kirim/terima?',
                        answer='Periksa koneksi internet, verify server settings (SMTP/POP3/IMAP), periksa username/password, disable antivirus email protection sementara, dan periksa quota mailbox.',
                        keywords='email error, tidak bisa kirim email, email bermasalah',
                        category='software',
                        priority=7
                    ),
                    FAQ(
                        question='Bagaimana cara backup email Outlook?',
                        answer='Export ke file PST melalui File > Open & Export > Import/Export. Pilih "Export to a file" dan pilih lokasi penyimpanan. Untuk backup otomatis, gunakan OneDrive atau backup software.',
                        keywords='backup email, outlook backup, export email',
                        category='software',
                        priority=6
                    ),
                    
                    # Audio/Video FAQs
                    FAQ(
                        question='Kenapa audio/suara tidak keluar dari speaker?',
                        answer='Periksa volume dan mute settings, test dengan headphone lain, update audio driver, restart Windows Audio service, dan periksa default audio device di Sound settings.',
                        keywords='no audio, suara tidak keluar, speaker bermasalah',
                        category='hardware',
                        priority=8
                    ),
                    FAQ(
                        question='Bagaimana cara mengatasi video yang lag atau patah-patah?',
                        answer='Update graphics driver, tutup aplikasi lain yang berat, periksa format video yang didukung, gunakan hardware acceleration, dan pastikan sistem memiliki RAM yang cukup.',
                        keywords='video lag, video patah, playback bermasalah',
                        category='hardware',
                        priority=7
                    ),
                    
                    # General IT FAQs
                    FAQ(
                        question='Seberapa sering harus restart komputer?',
                        answer='Untuk Windows, disarankan restart minimal seminggu sekali untuk membersihkan memory dan install update. Untuk server atau komputer yang digunakan 24/7, restart sebulan sekali sudah cukup.',
                        keywords='restart komputer, maintenance komputer, kapan restart',
                        category='performance',
                        priority=6
                    ),
                    FAQ(
                        question='Bagaimana cara backup data yang aman?',
                        answer='Gunakan rule 3-2-1: 3 copy data, 2 media berbeda, 1 offsite. Gunakan cloud storage, external drive, dan backup software. Backup secara rutin dan test restore untuk memastikan data bisa dipulihkan.',
                        keywords='backup data, data safety, backup strategy',
                        category='security',
                        priority=8
                    ),
                    FAQ(
                        question='Kapan harus upgrade hardware komputer?',
                        answer='Upgrade jika: aplikasi berjalan lambat, RAM usage tinggi (>80%), storage hampir penuh, atau komputer sering hang. Prioritas upgrade: SSD > RAM > Graphics Card > CPU.',
                        keywords='upgrade hardware, kapan upgrade, hardware recommendation',
                        category='hardware',
                        priority=7
                    )
                ]
                
                # Sample tickets
                tickets = [
                    Ticket(
                        subject='Laptop tidak bisa nyala',
                        description='Laptop saya tidak bisa menyala sama sekali. Sudah dicoba tekan tombol power tapi tidak ada respon. Lampu indikator juga tidak menyala.',
                        status='open',
                        priority='high',
                        category='hardware',
                        user_name='Budi Santoso',
                        user_email='budi.santoso@email.com',
                        assigned_to='Admin IT'
                    ),
                    Ticket(
                        subject='WiFi tidak bisa konek',
                        description='Koneksi WiFi di kantor sering putus-putus. Sudah dicoba restart router tapi masih bermasalah. Ini mengganggu pekerjaan.',
                        status='in_progress',
                        priority='medium',
                        category='network',
                        user_name='Sari Dewi',
                        user_email='sari.dewi@email.com',
                        assigned_to='Network Admin'
                    ),
                    Ticket(
                        subject='Printer tidak mau print',
                        description='Printer di lantai 2 tidak bisa mencetak dokumen. Ada pesan error "Paper Jam" tapi tidak ada kertas yang nyangkut.',
                        status='resolved',
                        priority='low',
                        category='hardware',
                        user_name='Ahmad Rahman',
                        user_email='ahmad.rahman@email.com',
                        assigned_to='Hardware Support',
                        resolution='Sudah dibersihkan sensor kertas dan dikalibrasi ulang. Printer sudah normal kembali.',
                        resolved_at=datetime.utcnow()
                    ),
                    Ticket(
                        subject='Komputer sangat lemot',
                        description='Komputer di workstation 15 sangat lambat. Butuh waktu lama untuk membuka aplikasi dan sering hang.',
                        status='open',
                        priority='medium',
                        category='performance',
                        user_name='Lisa Permata',
                        user_email='lisa.permata@email.com'
                    ),
                    Ticket(
                        subject='Email tidak bisa kirim attachment',
                        description='Tidak bisa mengirim email dengan attachment. Muncul error "File size too large" padahal file hanya 2MB.',
                        status='closed',
                        priority='low',
                        category='software',
                        user_name='Rudi Hartono',
                        user_email='rudi.hartono@email.com',
                        assigned_to='Software Support',
                        resolution='Setting email client sudah diubah untuk mendukung attachment hingga 25MB. Issue resolved.',
                        resolved_at=datetime.utcnow()
                    )
                ]
                
                db.session.add_all(solutions + faqs + tickets)
                db.session.commit()
                logger.info("Sample data added successfully")
            
            logger.info("Database initialized successfully")
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    # Start the Flask app
    logger.info("Starting IT Support App...")
    print("=" * 50)
    print("IT Support App Starting...")
    print("URL: http://127.0.0.1:5001")
    print("Database: Initialized")
    print("Chatbot: Ready (Keyword-based)")
    print("=" * 50)
    
    app.run(debug=True, host='127.0.0.1', port=5001)