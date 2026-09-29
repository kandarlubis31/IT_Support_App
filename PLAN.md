# 🚀 IT Support Mandiri - BIG BANG Improvement Plan

> **Tanggal:** 11 Juli 2026  
> **Status:** Planning Phase  
> **Durasi Estimasi:** 3-5 sesi pengerjaan

---

## 📊 Hasil Full Scan

### Arsitektur Saat Ini

| Layer | Teknologi | Status |
|-------|-----------|--------|
| Backend | Flask + SQLAlchemy + SQLite | ✅ Solid |
| Frontend | HTML5 + CSS3 + Vanilla JS | ⚠️ Ada duplikasi logic |
| AI/Expert | Fuzzy Matching (SequenceMatcher) + Decision Tree | ✅ Jalan |
| Admin | Dashboard + vis-network Graph | ⚠️ Beberapa fitur kosong |
| Auth | SHA-256 hashing | ⚠️ Kurang aman |

### File Structure
```
IT_Support_App/
├── app.py              # Main Flask app (semua route di 1 file)
├── models.py           # SQLAlchemy models (7 tabel)
├── engine.py           # Inference engine untuk decision tree
├── create_admin.py     # Script buat admin user
├── seed_data.py        # Seeder data expert system + FAQ
├── requirements.txt    # Flask, Flask-SQLAlchemy, Werkzeug
├── static/
│   ├── style.css       # ~30KB styling (light/dark theme)
│   ├── script.js       # ITSupportApp CLASS (conflict dengan inline!)
│   ├── admin.css       # Admin dashboard styling
│   └── admin.js        # AdminDashboard CLASS (method kosong)
└── templates/
    ├── index.html      # Main page + INLINE JS (conflict!)
    ├── admin.html      # Admin dashboard
    └── admin_login.html # Login page
```

---

## ⚠️ Masalah Ditemukan (6 Critical Issues)

### 🔴 CRITICAL #1: Duplikasi JS Logic
> **Dampak:** Bisa bikin bug aneh, susah debug, dan susah maintain.

Ada **DUA app object berbeda** yang nge-handle hal yang sama:
- **`ITSupportApp` class** di `static/script.js` — complete OOP class
- **`itSupportApp` inline object** di `templates/index.html` — plain object literal

Keduanya punya method `sendMessage()`, `toggleChatbot()`, `startDiagnosisFlow()`, `submitTicket()`, dll. Tapi yang inline punya `handleDiagnosisLogic()` yang lebih sophisticated (fetch node/edge langsung dari API), sementara yang class punya `startDiagnosis()` yang pake `/api/diagnose` endpoint.

**Masalah:** Di `index.html` baris terakhir:
```js
document.addEventListener('DOMContentLoaded', () => itSupportApp.init());
window.itSupportApp = itSupportApp;
```
Dan di `script.js` baris terakhir:
```js
document.addEventListener('DOMContentLoaded', () => {
    window.itSupportApp = new ITSupportApp();
});
```
→ **`ITSupportApp` class di-overwrite oleh inline object! Class-nya ga pernah kepakai.**

**Fix:** Unifikasi semua logic ke 1 class, hapus inline script.

---

### 🔴 CRITICAL #2: Admin Method Kosong
> **Dampak:** Admin gabisa manage Solutions & FAQs dari UI.

Di `admin.js`, ada 4 method stub kosong:

| Method | Kondisi | Yang Harusnya Terjadi |
|--------|---------|----------------------|
| `loadSolutions()` | `{ /* Logic similar to loadNodes... */ }` | Fetch `/solutions`, render table |
| `loadFaqs()` | `{ /* Logic similar to loadNodes... */ }` | Fetch `/faqs`, render table |
| `setupCharts()` | `{ /* Chart.js init code */ }` | Init Chart.js buat dashboard charts |
| `filterTickets(val)` | `{ /* Filter logic */ }` | Filter tabel tiket by status |

Plus: `showAddSolutionForm()` dan `showAddFaqForm()` dipanggil di event listener tapi implementasinya ga ada.

---

### 🟡 MEDIUM #3: Security Issues
- Password hashing pake `hashlib.sha256` → harusnya `werkzeug.security.generate_password_hash()`
- Secret key hardcoded di `app.py`
- Ga ada CSRF protection
- `create_admin.py` juga pake SHA-256

---

### 🟡 MEDIUM #4: API Inconsistency
- `script.js` submit ticket ke `/api/tickets/create` (ga ada endpoint ini!)
- `index.html` inline submit ticket ke `/tickets` (ini yang bener)
- Diagnosis di class pake `/api/diagnose`, di inline fetch `/api/nodes` + `/api/edges` langsung

---

### 🟢 LOW #5: UX Missing
- Navbar ga ada hamburger menu buat mobile
- Loading screen 800ms-1.5s kurang responsif
- Category cards di index.html ga ada `data-category` attribute (jadi ga bisa diklik)
- Chatbot scroll kadang skip

### 🟢 LOW #6: Missing Features
- Ga ada chat history viewer di admin
- Export data cuma placeholder
- Analytics belum connected ke real data
- Solusi ga bisa di-search/filter di admin

---

## 🎯 Improvement Plan (3 Phase)

---

## PHASE 1: UNIFY & REFACTOR (JS Cleanup)

**Goal:** Satu sistem JS yang bersih, ga ada conflict.

### 1.1 Hapus inline `<script>` dari `index.html`
- Pindahin semua method dari inline object ke `ITSupportApp` class di `script.js`
- Method yang harus dipindahin: `startDiagnosisFlow()`, `handleDiagnosisLogic()`, `showOptions()`, `submitTicket()` (inline version)
- Jangan lupa state `isDiagnosisMode` & `currentNodeId`

### 1.2 Merge fitur terbaik
- **Dari inline** (lebih bagus): `handleDiagnosisLogic()` — fetch nodes + edges langsung, matching label case-insensitive
- **Dari class** (lebih bagus): `setupSearch()` — search suggestions, `validateField()` — form validation, `showNotification()` — ikon + styling
- Keep `/api/diagnose` endpoint buat fallback, tapi primary pake direct node/edge fetch

### 1.3 Bersihin inline `onclick` handlers
- Ganti `onclick="itSupportApp.xxx()"` jadi proper event listener di class init
- Contoh: search button, send button, theme toggle, ticket form submit

### 1.4 Fix API endpoint inconsistencies
- Pastiin semua fetch pake endpoint yang bener
- Ticket submit → `/tickets` (POST)
- Chat → `/chat` (POST)
- Diagnosa → fetch `/api/nodes` + `/api/edges` (GET)

### 1.5 Fix category cards
- Tambahin `data-category` attribute ke category-card di index.html
- Biar `displayCategoryContent()` di class bisa jalan

---

## PHASE 2: COMPLETE ADMIN FEATURES

**Goal:** Admin dashboard full functional.

### 2.1 `loadSolutions()` + CRUD
```js
async loadSolutions() {
    const res = await fetch('/solutions');
    const json = await res.json();
    const solutions = json.data || json;
    const tbody = document.querySelector('#solutions-table tbody');
    tbody.innerHTML = solutions.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.category}</td>
            <td>${s.title}</td>
            <td>${s.priority}</td>
            <td>${new Date(s.created_at).toLocaleDateString()}</td>
            <td>
                <button onclick="adminDashboard.editSolution(${s.id})">✏️</button>
                <button onclick="adminDashboard.deleteSolution(${s.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}
```
- `showAddSolutionForm()` → modal form (category, title, keywords, description, steps, priority)
- `editSolution(id)` → fetch detail, prefill form
- `deleteSolution(id)` → DELETE `/solutions/<id>`

### 2.2 `loadFaqs()` + CRUD
- Mirip kayak solutions, tapi endpoint `/faqs`
- Form fields: question, answer, keywords, category, priority

### 2.3 `setupCharts()` - Chart.js initialization
```js
setupCharts() {
    this.loadChatActivityChart();
    this.loadCategoryChart();
}
```
- **Chat Activity Chart**: Bar chart dari `ChatLog` grouped by date
- **Category Chart**: Doughnut chart dari `Ticket` grouped by category

Butuh endpoint baru:
- `GET /api/stats/chat-activity` → return chat count per day
- `GET /api/stats/ticket-categories` → return ticket count per category

### 2.4 `filterTickets(val)`
```js
filterTickets(status) {
    const url = status ? `/tickets?status=${status}` : '/tickets';
    // fetch and re-render table
}
```

### 2.5 Chat History di Admin
- Tab baru "Riwayat Chat" di sidebar
- Tabel menampilkan `ChatLog`: user_message, bot_response, type, timestamp
- Endpoint: `GET /api/chat-logs` (admin only)

---

## PHASE 3: SECURITY & UX POLISH

**Goal:** Production-ready, aman, dan enak dipake.

### 3.1 Upgrade Password Hashing ke Werkzeug

**`app.py` - admin_login():**
```python
# OLD
import hashlib
input_hash = hashlib.sha256(password.encode()).hexdigest()
if input_hash == user.password_hash:

# NEW
from werkzeug.security import check_password_hash, generate_password_hash
if check_password_hash(user.password_hash, password):
```

**`create_admin.py`:**
```python
# OLD
password_hash = hashlib.sha256(password.encode()).hexdigest()

# NEW
from werkzeug.security import generate_password_hash
password_hash = generate_password_hash(password)
```

### 3.2 Mobile Hamburger Menu
Tambahin di `templates/index.html`:
```html
<button class="hamburger" id="hamburger-btn">
    <span></span><span></span><span></span>
</button>
```
CSS animation + JS toggle class `nav-menu.active`.

### 3.3 Loading UX Improvement
- Kurangin timeout jadi 600ms (dari 800ms di inline, 1500ms di class)
- Tambahin progress bar atau skeleton loading
- Fade out yang smooth

### 3.4 Chatbot Enhancement
- Auto-scroll yang reliable (observe mutation)
- Subtle notification sound/badge pas ada pesan baru
- Better typing indicator animation

### 3.5 Minor CSS Fixes
- Category card hover animation
- Form focus states
- Dark theme consistency di semua komponen

---

## 📋 Execution Order

```
[1] Phase 1 → Unify JS           (2-3 jam)
       ↓
[2] Phase 2 → Admin Features     (2-3 jam)  
       ↓
[3] Phase 3 → Security & Polish  (1-2 jam)
```

**Dependency:** Phase 2 butuh Phase 1 selesai (karena admin.js juga mungkin kena impact dari cleanup JS). Phase 3 bisa paralel setelah Phase 2.

---

## 📁 Files Yang Akan Dimodifikasi

### Phase 1
| File | Action | Detail |
|------|--------|--------|
| `templates/index.html` | ✂️ Hapus inline `<script>` | Pindahin ke script.js |
| `templates/index.html` | 🔧 Tambah `data-category` | Di category cards |
| `templates/index.html` | 🔧 Bersihin `onclick` | Ganti jadi class-based listener |
| `static/script.js` | ✏️ Merge + rewrite | Unifikasi semua logic |

### Phase 2
| File | Action | Detail |
|------|--------|--------|
| `static/admin.js` | ✏️ Isi method kosong | loadSolutions, loadFaqs, setupCharts, filterTickets |
| `templates/admin.html` | 🔧 Tambah section | Chat History tab (opsional) |
| `app.py` | ➕ Tambah endpoint | `/api/stats/*`, `/api/chat-logs` |

### Phase 3
| File | Action | Detail |
|------|--------|--------|
| `app.py` | ✏️ Ganti hashing | SHA-256 → Werkzeug |
| `create_admin.py` | ✏️ Ganti hashing | SHA-256 → Werkzeug |
| `templates/index.html` | ➕ Hamburger menu | Mobile nav |
| `static/style.css` | ➕ Mobile styles | Hamburger + responsive |
| `static/script.js` | 🔧 UX improvements | Loading, scroll, sound |

---

## ✅ Success Criteria

- [x] Tidak ada duplikasi JS — 1 app = 1 class
- [x] Admin bisa CRUD Solutions & FAQs dari UI
- [x] Dashboard charts nampilin data real
- [x] Filter tiket berfungsi
- [x] Password di-hash pake Werkzeug (bcrypt-level security)
- [x] Mobile navigation berfungsi
- [x] Semua onclick inline handler diganti event listener
- [x] Zero breaking changes di fitur existing

---

## 🔧 Tech Debt (Optional - Next Iteration)

- Migrate ke Flask Blueprints (pisahin route per module)
- Tambah unit tests (pytest)
- Pagination di semua list
- Real-time notification via WebSocket
- Docker containerization
- CI/CD pipeline
- Rate limiting
- Input sanitization library

---

> **Last Updated:** 11 Juli 2026  
> **Author:** AI Assistant (via Freebuff)
