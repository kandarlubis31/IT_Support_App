from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Inisialisasi Database
db = SQLAlchemy()

# --- TABEL SOLUTIONS (SOLUSI) ---
class Solution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    keywords = db.Column(db.String(500))
    description = db.Column(db.Text, nullable=False)
    steps = db.Column(db.Text, nullable=False) # Disimpan sebagai JSON string
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
            'created_at': self.created_at
        }

# --- TABEL FAQ ---
class FAQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    keywords = db.Column(db.String(500))
    category = db.Column(db.String(50))
    priority = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'question': self.question,
            'answer': self.answer,
            'keywords': self.keywords,
            'category': self.category,
            'priority': self.priority
        }

# --- TABEL TICKET (TIKET SUPPORT) ---
class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open') # open, in_progress, resolved, closed
    priority = db.Column(db.String(20), default='medium')
    category = db.Column(db.String(50))
    user_name = db.Column(db.String(100))
    user_email = db.Column(db.String(100))
    assigned_to = db.Column(db.String(100))
    resolution = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

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
            'created_at': self.created_at,
            'resolved_at': self.resolved_at
        }

# --- TABEL CHATLOG (RIWAYAT CHAT) ---
class ChatLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_message = db.Column(db.Text)
    bot_response = db.Column(db.Text)
    response_type = db.Column(db.String(50))
    feedback = db.Column(db.String(10))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# --- TABEL EXPERT SYSTEM (AI) ---
class DecisionNode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False) # Pertanyaan atau Solusi
    type = db.Column(db.String(20), nullable=False) # 'question' or 'solution'
    is_root = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'type': self.type,
            'is_root': self.is_root
        }

class DecisionEdge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source_id = db.Column(db.Integer, db.ForeignKey('decision_node.id'), nullable=False)
    target_id = db.Column(db.Integer, db.ForeignKey('decision_node.id'), nullable=False)
    label = db.Column(db.String(100), nullable=False) # Jawaban user (Ya, Tidak, Layar Hitam, dll)

    source = db.relationship('DecisionNode', foreign_keys=[source_id], backref='out_edges')
    target = db.relationship('DecisionNode', foreign_keys=[target_id], backref='in_edges')

# --- TABEL ADMIN (BARU) ---
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at
        }