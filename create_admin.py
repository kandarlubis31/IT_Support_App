from app import app
from models import db, Admin
from werkzeug.security import generate_password_hash

def create_first_admin():
    with app.app_context():
        # 1. Buat tabel Admin jika belum ada
        db.create_all()
        
        # 2. Cek apakah admin sudah ada
        if Admin.query.filter_by(username='admin').first():
            print("❌ Admin 'admin' sudah ada di database.")
            return

        # 3. Setup Username & Password Baru
        username = "admin"
        password = "kadalmesir31"  # Ganti password ini jika mau
        
        # 4. Hash Password (Enkripsi)
        # Kita gunakan SHA256 sama seperti logika sebelumnya
        password_hash = generate_password_hash(password)
        
        # 5. Simpan ke Database
        new_admin = Admin(username=username, password_hash=password_hash)
        db.session.add(new_admin)
        db.session.commit()
        
        print(f"✅ Berhasil membuat user admin baru!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")

if __name__ == "__main__":
    create_first_admin()