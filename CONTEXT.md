# IT_Support_App — Project Context

## Ringkasan

Aplikasi web layanan mandiri IT support. Pengguna menceritakan masalahnya, aplikasi menuntun lewat
pohon diagnosis, dan kasus yang tidak selesai berubah menjadi tiket. Solusi yang terbukti berhasil
masuk basis pengetahuan sehingga masalah yang sama tidak perlu dipecahkan dua kali.

Flask + SQLAlchemy + SQLite, tanpa layanan eksternal.

## Keputusan inti: pohon diagnosis ada di database

Alur diagnosis **tidak ditulis di Python**. Pohonnya adalah data:

```
DecisionNode (type: 'question' | 'solution', is_root)
      │
      └── DecisionEdge (label: "Ya", "Tidak", "Layar Hitam", …)
                │
                └── DecisionNode berikutnya …
```

Konsekuensinya, admin bisa menambah pertanyaan atau memperbaiki solusi lewat panel admin tanpa
menyentuh kode dan tanpa deploy ulang. `engine.py` (`InferenceEngine`) hanya menelusuri tabel: ambil
simpul akar (`is_root=True`), ambil edge keluarnya untuk pilihan, lanjut ke `target_id`.

`type='solution'` mengakhiri cabang. Kalau solusinya tidak menyelesaikan masalah, pengguna melanjutkan
ke pembuatan tiket.

## Model data

`DecisionNode`, `DecisionEdge`, `Solution`, `FAQ`, `Ticket`, `ChatLog`, `Admin`. `ChatLog` mencatat
percakapan pada `/chat`, yang dipakai sebagai jalur bantuan tambahan di samping pohon diagnosis.

## Rute utama

| Rute | Fungsi |
| :--- | :--- |
| `/` | Halaman mulai diagnosis |
| `/api/diagnose` | Mengambil simpul berikutnya |
| `/chat` | Percakapan bantuan |
| `/solutions` | Daftar dan tambah solusi |
| `/solutions/<id>` | Baca, ubah, hapus solusi |
| `/admin/login`, `/admin` | Masuk dan kelola isi |

## Struktur

```
app.py           Rute, sesi, pembuatan tiket
engine.py        InferenceEngine — penelusuran pohon
models.py        Seluruh model SQLAlchemy
create_admin.py  Akun admin pertama
seed_data.py     Isi awal pohon diagnosis
instance/        Basis data SQLite
```

## Menjalankan

```bash
pip install flask flask-sqlalchemy
python create_admin.py     # sekali saja
python seed_data.py        # pohon diagnosis awal
python app.py              # http://localhost:5000
```

## Catatan

- Harus ada tepat satu simpul `is_root`; kalau tidak, halaman diagnosis kosong.
- Edge yang menunjuk `target_id` yang sudah dihapus membuat cabang buntu.
- `.env` dan `instance/` bersifat lokal, jangan di-commit.
