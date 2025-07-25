# 🛠️ IT Support Mandiri - AI-Powered Help Desk System

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-1.4+-orange.svg)](https://sqlalchemy.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistem IT Support mandiri dengan AI chatbot untuk solusi masalah teknologi. Aplikasi web modern dengan interface yang responsif dan sistem manajemen tiket yang lengkap.

## ✨ Fitur Utama

### 🎯 **Client Features**
- **AI Chatbot Assistant** - Bantuan instan dengan AI yang cerdas
- **Ticket Creation System** - Buat tiket support dengan mudah
- **Smart Search** - Pencarian solusi dengan saran otomatis
- **Category Browse** - Jelajahi solusi berdasarkan kategori
- **Responsive Design** - Optimal di desktop dan mobile
- **Dark/Light Theme** - Mode tema yang dapat disesuaikan

### 🔧 **Admin Features**
- **Complete CRUD Operations** - Kelola Solutions, FAQs, dan Tickets
- **Ticket Management** - Status tracking dan assignment
- **Dashboard Analytics** - Statistik dan laporan
- **User-friendly Interface** - Modal-based editing
- **Secure Authentication** - Admin login system

### 🚀 **Technical Features**
- **RESTful API** - Endpoints yang terstruktur
- **Real-time Validation** - Form validation dengan feedback
- **Error Handling** - Comprehensive error management
- **Database Integration** - SQLAlchemy ORM
- **Production Ready** - Optimized untuk deployment

## 🛠️ Teknologi yang Digunakan

- **Backend**: Python Flask, SQLAlchemy
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite (development), PostgreSQL ready
- **Styling**: CSS Variables, Flexbox, Grid
- **Icons**: Font Awesome 6
- **AI**: Keyword-based chatbot (expandable)

## 📋 Persyaratan Sistem

- Python 3.8 atau lebih tinggi
- pip (Python package manager)
- Git (untuk development)

## 🚀 Instalasi dan Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/IT_Support_App.git
cd IT_Support_App
```

### 2. Buat Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Buat file `.env` di root directory:
```env
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True
```

### 5. Initialize Database
```bash
python -c "from app import init_database; init_database()"
```

### 6. Run Application
```bash
python app.py
```

Aplikasi akan berjalan di `http://localhost:5000`

## 📱 Penggunaan

### Untuk User/Client:
1. **Buat Tiket Support**: Klik tombol "Buat Tiket" dan isi form
2. **Chat dengan AI**: Gunakan AI Assistant untuk bantuan instan
3. **Cari Solusi**: Gunakan search bar atau browse kategori
4. **Track Status**: Gunakan nomor tiket untuk tracking

### Untuk Admin:
1. **Login Admin**: Akses `/admin/login`
   - Username: `admin`
   - Password: `admin123` (ganti di production!)
2. **Kelola Content**: CRUD operations untuk Solutions dan FAQs
3. **Manage Tickets**: Update status, assign, dan resolve tickets
4. **View Analytics**: Monitor statistik dan performa

## 🏗️ Struktur Project

```
IT_Support_App/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── README.md            # Project documentation
├── static/              # Static assets
│   ├── style.css        # Main stylesheet
│   ├── script.js        # JavaScript functionality
│   └── admin.css        # Admin panel styles
├── templates/           # HTML templates
│   ├── index.html       # Main homepage
│   ├── admin.html       # Admin dashboard
│   └── admin_login.html # Admin login page
└── instance/            # Instance folder (ignored)
    └── it_support.db    # SQLite database
```

## 🔧 API Endpoints

### Public Endpoints
- `GET /` - Homepage
- `POST /chat` - AI Chatbot
- `GET /solutions` - Get all solutions
- `GET /faqs` - Get all FAQs
- `POST /api/tickets/create` - Create client ticket

### Admin Endpoints (Authentication Required)
- `GET /admin` - Admin dashboard
- `POST /admin/login` - Admin authentication
- `GET /tickets` - Get all tickets
- `POST /tickets` - Create ticket
- `PUT /tickets/<id>` - Update ticket
- `DELETE /tickets/<id>` - Delete ticket

## 🎨 Customization

### Tema dan Styling
- Edit `static/style.css` untuk mengubah tema
- CSS Variables tersedia untuk konsistensi
- Dark mode support built-in

### AI Chatbot
- Expand keyword responses di `app.py`
- Integrate dengan AI services (OpenAI, etc.)
- Add machine learning capabilities

### Database
- Ganti ke PostgreSQL untuk production
- Add migrations dengan Flask-Migrate
- Implement database seeding

## 🚀 Deployment

### Heroku Deployment
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set SECRET_KEY=your-key`
4. Deploy: `git push heroku main`

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## 🔒 Security Notes

⚠️ **PENTING untuk Production:**
- Ganti default admin password
- Set SECRET_KEY yang kuat
- Enable HTTPS
- Implement rate limiting
- Add input sanitization
- Use environment variables untuk sensitive data

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Contact

- **Developer**: Your Name
- **Email**: your.email@example.com
- **Project Link**: [https://github.com/yourusername/IT_Support_App](https://github.com/yourusername/IT_Support_App)

## 🙏 Acknowledgments

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Font Awesome](https://fontawesome.com/) for icons
- [SQLAlchemy](https://sqlalchemy.org/) for ORM
- Community contributors and testers

---

⭐ **Star this repository if you find it helpful!**