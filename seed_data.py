from app import app
from models import db, DecisionNode, DecisionEdge, FAQ
import logging

# Setup logging biar enak liat prosesnya
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_data():
    with app.app_context():
        print("🧹 Membersihkan database lama (Nodes, Edges, FAQs)...")
        try:
            db.session.query(DecisionEdge).delete()
            db.session.query(DecisionNode).delete()
            db.session.query(FAQ).delete()
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error reset DB: {e}")
            return

        print("🌱 Menanam Data Expert System (Nodes)...")
        
        # --- LEVEL 0: ROOT ---
        root = DecisionNode(content="Apa kategori masalah utama yang Anda alami?", type="question", is_root=True)
        db.session.add(root)
        db.session.commit()

        # --- LEVEL 1: KATEGORI UTAMA ---
        n_hw = DecisionNode(content="Masalah Hardware (Fisik/Perangkat Keras)", type="question")
        n_sw = DecisionNode(content="Masalah Software (Windows/Aplikasi/Virus)", type="question")
        n_net = DecisionNode(content="Masalah Internet / WiFi / Jaringan", type="question")
        n_per = DecisionNode(content="Masalah Periferal (Printer/Mouse/Audio/USB)", type="question")
        n_data = DecisionNode(content="Masalah Data & Storage (File Hilang/Penuh)", type="question")
        
        db.session.add_all([n_hw, n_sw, n_net, n_per, n_data])
        db.session.commit()

        # --- LEVEL 2: PERTANYAAN SPESIFIK (CHAINED) ---
        # Kita buat node pertanyaan
        
        # Hardware Questions
        q_hw_1 = DecisionNode(content="Apakah PC/Laptop mati total (tidak ada lampu/kipas)?", type="question")
        q_hw_2 = DecisionNode(content="Apakah laptop terasa sangat panas dan berisik?", type="question")
        q_hw_3 = DecisionNode(content="Apakah ada masalah pada layar (gelap/bergaris)?", type="question")
        q_hw_4 = DecisionNode(content="Apakah baterai tidak mengisi atau cepat habis?", type="question")
        
        # Software Questions
        q_sw_1 = DecisionNode(content="Apakah muncul layar biru (Blue Screen of Death)?", type="question")
        q_sw_2 = DecisionNode(content="Apakah komputer terasa sangat lambat (lemot)?", type="question")
        q_sw_3 = DecisionNode(content="Apakah Windows gagal booting (stuck)?", type="question")
        q_sw_4 = DecisionNode(content="Apakah ada indikasi virus (iklan pop-up/file aneh)?", type="question")

        # Network Questions
        q_net_1 = DecisionNode(content="Apakah ikon WiFi hilang atau ada tanda silang?", type="question")
        q_net_2 = DecisionNode(content="Apakah terhubung tapi ada tanda seru (No Internet)?", type="question")
        q_net_3 = DecisionNode(content="Apakah koneksi internet sangat lambat?", type="question")

        # Peripheral Questions
        q_per_1 = DecisionNode(content="Apakah masalahnya ada pada Printer?", type="question")
        q_per_2 = DecisionNode(content="Apakah masalahnya tidak ada suara (Audio)?", type="question")
        q_per_3 = DecisionNode(content="Apakah Mouse/Keyboard tidak terdeteksi?", type="question")

        # Data Questions
        q_dat_1 = DecisionNode(content="Apakah disk penyimpanan penuh?", type="question")
        q_dat_2 = DecisionNode(content="Apakah ada file penting yang terhapus/hilang?", type="question")

        db.session.add_all([
            q_hw_1, q_hw_2, q_hw_3, q_hw_4,
            q_sw_1, q_sw_2, q_sw_3, q_sw_4,
            q_net_1, q_net_2, q_net_3,
            q_per_1, q_per_2, q_per_3,
            q_dat_1, q_dat_2
        ])
        db.session.commit()

        # --- LEVEL 3: SOLUSI (SOLUTIONS) ---
        
        # Solusi Hardware
        s_mati = DecisionNode(content="Solusi Mati Total:\n1. Cek kabel power & stop kontak.\n2. Jika laptop, lepas baterai & tekan power 30 detik.\n3. Coba adaptor lain.\n4. Jika PC, cek Power Supply.", type="solution")
        s_panas = DecisionNode(content="Solusi Overheat:\n1. Bersihkan debu di ventilasi.\n2. Ganti thermal paste.\n3. Gunakan cooling pad.\n4. Cek apakah kipas berputar.", type="solution")
        s_layar = DecisionNode(content="Solusi Layar:\n1. Cek kabel fleksibel/HDMI.\n2. Coba monitor eksternal (jika tampil, LCD laptop rusak).\n3. Update driver VGA.", type="solution")
        s_baterai = DecisionNode(content="Solusi Baterai:\n1. Uninstall driver baterai di Device Manager lalu restart.\n2. Kalibrasi baterai.\n3. Ganti baterai jika sudah kembung.", type="solution")
        s_hw_umum = DecisionNode(content="Saran Hardware Umum:\nKemungkinan kerusakan komponen fisik (Motherboard/RAM). Disarankan bawa ke teknisi profesional.", type="solution")

        # Solusi Software
        s_bsod = DecisionNode(content="Solusi BSOD:\n1. Catat kode error.\n2. Masuk Safe Mode.\n3. Uninstall driver/update terakhir.\n4. Cek RAM dengan Memory Diagnostic.", type="solution")
        s_lemot = DecisionNode(content="Solusi Lemot:\n1. Cek Task Manager (Startup Apps).\n2. Hapus temp file (%temp%).\n3. Scan virus.\n4. Pertimbangkan upgrade SSD.", type="solution")
        s_boot = DecisionNode(content="Solusi Boot Loop:\n1. Masuk Recovery Mode.\n2. Pilih Startup Repair.\n3. Jika gagal, coba System Restore.\n4. Install ulang Windows.", type="solution")
        s_virus = DecisionNode(content="Solusi Virus:\n1. Disconnect internet.\n2. Scan pakai Windows Defender & Malwarebytes.\n3. Hapus aplikasi mencurigakan di Control Panel.", type="solution")
        s_sw_umum = DecisionNode(content="Saran Software:\nCoba jalankan System File Checker (sfc /scannow) di CMD atau Reset Windows (Keep Files).", type="solution")

        # Solusi Network
        s_no_wifi = DecisionNode(content="Solusi WiFi Hilang:\n1. Cek tombol fisik WiFi/Airplane mode.\n2. Install ulang driver WiFi dari web resmi.\n3. Reset Network Settings.", type="solution")
        s_limited = DecisionNode(content="Solusi Limited Access:\n1. Restart Router & Modem.\n2. Forget Network & connect ulang.\n3. Flush DNS (ipconfig /flushdns).", type="solution")
        s_slow_net = DecisionNode(content="Solusi Internet Lambat:\n1. Cek penggunaan bandwidth di background.\n2. Ganti channel WiFi di router.\n3. Pindah posisi lebih dekat ke router.", type="solution")

        # Solusi Peripheral
        s_printer = DecisionNode(content="Solusi Printer:\n1. Restart Print Spooler service.\n2. Cek kabel USB & kertas.\n3. Reinstall driver printer.\n4. Cek tinta.", type="solution")
        s_audio = DecisionNode(content="Solusi Audio:\n1. Cek mute & volume mixer.\n2. Set Default Playback Device.\n3. Reinstall driver Realtek Audio.", type="solution")
        s_usb = DecisionNode(content="Solusi USB/Mouse:\n1. Coba port USB lain.\n2. Cek di komputer lain.\n3. Update driver USB Controller.", type="solution")

        # Solusi Data
        s_full = DecisionNode(content="Solusi Disk Penuh:\n1. Gunakan Disk Cleanup.\n2. Uninstall game/apps besar.\n3. Pindahkan file foto/video ke Cloud/HDD Eksternal.", type="solution")
        s_recovery = DecisionNode(content="Solusi File Hilang:\n1. Cek Recycle Bin.\n2. Gunakan software Recuva/EaseUS.\n3. Jangan tulis data baru ke drive tersebut.", type="solution")

        db.session.add_all([
            s_mati, s_panas, s_layar, s_baterai, s_hw_umum,
            s_bsod, s_lemot, s_boot, s_virus, s_sw_umum,
            s_no_wifi, s_limited, s_slow_net,
            s_printer, s_audio, s_usb,
            s_full, s_recovery
        ])
        db.session.commit()

        print("🔗 Menghubungkan Logika (Edges)...")
        # Logika "Flow Chaining" (Jika user jawab tidak, lempar ke pertanyaan berikutnya)

        edges = [
            # Root ke Kategori
            DecisionEdge(source_id=root.id, target_id=n_hw.id, label="Hardware"),
            DecisionEdge(source_id=root.id, target_id=n_sw.id, label="Software"),
            DecisionEdge(source_id=root.id, target_id=n_net.id, label="Internet"),
            DecisionEdge(source_id=root.id, target_id=n_per.id, label="Periferal"),
            DecisionEdge(source_id=root.id, target_id=n_data.id, label="Data"),

            # --- CHAIN HARDWARE ---
            # Q1 Mati -> Q2 Panas -> Q3 Layar -> Q4 Baterai -> Solusi Umum
            DecisionEdge(source_id=n_hw.id, target_id=q_hw_1.id, label="Mulai Cek"),
            
            DecisionEdge(source_id=q_hw_1.id, target_id=s_mati.id, label="Ya, Mati Total"),
            DecisionEdge(source_id=q_hw_1.id, target_id=q_hw_2.id, label="Tidak"), # Chain

            DecisionEdge(source_id=q_hw_2.id, target_id=s_panas.id, label="Ya, Panas"),
            DecisionEdge(source_id=q_hw_2.id, target_id=q_hw_3.id, label="Tidak"), # Chain

            DecisionEdge(source_id=q_hw_3.id, target_id=s_layar.id, label="Ya, Layar Rusak"),
            DecisionEdge(source_id=q_hw_3.id, target_id=q_hw_4.id, label="Tidak"), # Chain

            DecisionEdge(source_id=q_hw_4.id, target_id=s_baterai.id, label="Ya, Baterai"),
            DecisionEdge(source_id=q_hw_4.id, target_id=s_hw_umum.id, label="Tidak (Masalah Lain)"), # Fallback

            # --- CHAIN SOFTWARE ---
            # Q1 BSOD -> Q2 Lemot -> Q3 Boot -> Q4 Virus -> Solusi Umum
            DecisionEdge(source_id=n_sw.id, target_id=q_sw_1.id, label="Mulai Cek"),

            DecisionEdge(source_id=q_sw_1.id, target_id=s_bsod.id, label="Ya, Blue Screen"),
            DecisionEdge(source_id=q_sw_1.id, target_id=q_sw_2.id, label="Tidak"),

            DecisionEdge(source_id=q_sw_2.id, target_id=s_lemot.id, label="Ya, Lemot"),
            DecisionEdge(source_id=q_sw_2.id, target_id=q_sw_3.id, label="Tidak"),

            DecisionEdge(source_id=q_sw_3.id, target_id=s_boot.id, label="Ya, Gagal Boot"),
            DecisionEdge(source_id=q_sw_3.id, target_id=q_sw_4.id, label="Tidak"),

            DecisionEdge(source_id=q_sw_4.id, target_id=s_virus.id, label="Ya, Ada Virus"),
            DecisionEdge(source_id=q_sw_4.id, target_id=s_sw_umum.id, label="Tidak (Masalah Lain)"),

            # --- CHAIN NETWORK ---
            DecisionEdge(source_id=n_net.id, target_id=q_net_1.id, label="Mulai Cek"),

            DecisionEdge(source_id=q_net_1.id, target_id=s_no_wifi.id, label="Ya, Ikon Hilang"),
            DecisionEdge(source_id=q_net_1.id, target_id=q_net_2.id, label="Tidak"),

            DecisionEdge(source_id=q_net_2.id, target_id=s_limited.id, label="Ya, Tanda Seru"),
            DecisionEdge(source_id=q_net_2.id, target_id=q_net_3.id, label="Tidak"),

            DecisionEdge(source_id=q_net_3.id, target_id=s_slow_net.id, label="Ya, Lambat"),
            DecisionEdge(source_id=q_net_3.id, target_id=s_limited.id, label="Masalah Lain"),

            # --- CHAIN PERIPHERAL ---
            DecisionEdge(source_id=n_per.id, target_id=q_per_1.id, label="Mulai Cek"),
            DecisionEdge(source_id=q_per_1.id, target_id=s_printer.id, label="Ya, Printer"),
            DecisionEdge(source_id=q_per_1.id, target_id=q_per_2.id, label="Tidak"),

            DecisionEdge(source_id=q_per_2.id, target_id=s_audio.id, label="Ya, Audio"),
            DecisionEdge(source_id=q_per_2.id, target_id=q_per_3.id, label="Tidak"),

            DecisionEdge(source_id=q_per_3.id, target_id=s_usb.id, label="Ya, USB/Mouse"),
            
            # --- CHAIN DATA ---
            DecisionEdge(source_id=n_data.id, target_id=q_dat_1.id, label="Mulai Cek"),
            DecisionEdge(source_id=q_dat_1.id, target_id=s_full.id, label="Ya, Penuh"),
            DecisionEdge(source_id=q_dat_1.id, target_id=q_dat_2.id, label="Tidak"),
            DecisionEdge(source_id=q_dat_2.id, target_id=s_recovery.id, label="Ya, Hilang"),
        ]
        
        db.session.add_all(edges)
        db.session.commit()

        print("💬 Menanam Data FAQ (Chatbot Cerdas)...")
        faqs = [
            # GREETINGS
            FAQ(question="Halo", answer="Halo! 👋 Saya IT Support Assistant. Ada yang bisa saya bantu? Ketik masalah Anda atau ketik 'Diagnosa'.", keywords="hi,pagi,siang,sore,malam,test,ping"),
            FAQ(question="Apa kabar", answer="Saya adalah sistem komputer, jadi saya selalu siap membantu Anda! 😄", keywords="kabar,gimana"),
            FAQ(question="Siapa kamu", answer="Saya asisten virtual IT Support Mandiri. Saya bisa membantu mendiagnosa masalah komputer Anda.", keywords="nama,identitas,bot"),
            FAQ(question="Terima kasih", answer="Sama-sama! Senang bisa membantu. Jangan ragu bertanya lagi ya. 👍", keywords="makasih,thanks,thank you,tq,thx"),
            FAQ(question="Bye", answer="Sampai jumpa! Semoga harimu menyenangkan.", keywords="dadah,bye,keluar,exit"),
            
            # UMUM
            FAQ(question="Cara screenshot", answer="Tekan tombol 'Windows + PrtSc' atau gunakan 'Snipping Tool'.", keywords="ss,tangkap layar,screen"),
            FAQ(question="Lupa password laptop", answer="Jika pakai akun Microsoft, reset di web. Jika akun lokal, Anda mungkin butuh tool reset password bootable.", keywords="sandi,kunci,lock"),
            FAQ(question="Laptop kena air", answer="🚨 MATIKAN SEGERA! Cabut baterai & charger. Jangan nyalakan min 24 jam. Bawa ke ahli.", keywords="basah,minum,tumpah,banjir"),
            FAQ(question="Office Activation", answer="Pastikan lisensi resmi. Cek di File > Account pada Word/Excel.", keywords="word,excel,aktivasi,lisensi"),
            
            # JOKES (Biar seru)
            FAQ(question="Cerita lucu", answer="Kenapa komputer kedinginan? Karena lupa menutup Windows! 🥶", keywords="joke,lucu,lawak,kocak")
        ]
        db.session.add_all(faqs)
        db.session.commit()

        print("✅ Database SELESAI di-seed! Sistem siap digunakan.")

if __name__ == "__main__":
    seed_data()