# IT Support App

A self-service IT support web application. Users describe their problem, the app
walks them through a diagnostic decision tree, and unresolved cases become tickets.
Answers and fixes live in an editable knowledge base, so the same issue is not
solved twice.

Built with Flask and SQLite, no external services required.

## How diagnosis works

The diagnostic flow is a tree stored in the database, not hard-coded in Python:

```
DecisionNode (type: 'question' | 'solution')
      │
      └── DecisionEdge (label: "Ya", "Tidak", "Layar Hitam", …)
                │
                └── next DecisionNode …
```

`engine.py` holds an `InferenceEngine` that starts from the node flagged `is_root`,
returns its question, and offers the outgoing edge labels as choices. Following an
edge moves to the next node; a node of type `solution` ends the walk with the fix.

Because the tree is data, an admin can extend the diagnosis without touching code.

## Features

- **Guided diagnosis** — `/api/diagnose` walks the decision tree node by node
- **Knowledge base** — categorised solutions with keywords, ordered steps, and priority
- **FAQ** — searchable, keyword-tagged answers
- **Tickets** — open → in progress → resolved → closed, with priority and assignee
- **Chat log** — every bot answer stored with a feedback field
- **Admin panel** — CRUD for solutions, FAQs, and tickets behind a login
- **Health endpoint** — `/health` for uptime checks

## Data model

| Table | Contents |
| :--- | :--- |
| `Solution` | Title, category, keywords, description, JSON-encoded steps, priority |
| `FAQ` | Question, answer, keywords, category, priority |
| `Ticket` | Subject, description, status, priority, requester, assignee, resolution |
| `ChatLog` | User message, bot response, response type, feedback |
| `DecisionNode` | Tree node: question text or solution text, `is_root` flag |
| `DecisionEdge` | Link from one node to another with an answer label |
| `Admin` | Username and password hash |

## Requirements

- Python 3.9+
- `Flask`, `Flask-SQLAlchemy`, `Werkzeug` — see [requirements.txt](requirements.txt)

## Setup

```bash
pip install -r requirements.txt
```

Database tables are created by the application on first run. Two helper scripts
prepare a usable install:

```bash
python seed_data.py     # populate demo solutions, FAQs, and a starter decision tree
python create_admin.py  # create the admin account for /admin/login
```

Then start the server:

```bash
python app.py
```

The SQLite file lives at `instance/it_support.db`.

## Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Public home and chat entry |
| `/chat` | Diagnostic conversation endpoint |
| `/api/diagnose` | Tree-walking API (`node_id` to advance) |
| `/solutions` | Knowledge base, plus create/update/delete |
| `/faqs` | FAQ list, plus create/update/delete |
| `/tickets` | Ticket list, plus create/update/delete |
| `/admin/login`, `/admin/logout`, `/admin` | Admin authentication and dashboard |
| `/health` | Plain status check |

## Layout

```
app.py              routes and application factory
models.py           SQLAlchemy models listed above
engine.py           InferenceEngine for the decision tree
create_admin.py     admin account creation
seed_data.py        demo content loader
templates/          Jinja pages (public + admin)
static/             CSS and JS
instance/           SQLite database (created at runtime)
```

## Notes

- `.env` and `instance/` are local-only and should not be committed with real data.
- `PLAN.md`, `IMPLEMENTATION_SUMMARY.md`, and `OPTIMIZATION_REPORT.md` are working
  notes from development, not user documentation.

---

## Bahasa Indonesia

**IT Support App** adalah aplikasi web layanan mandiri untuk masalah IT: pengguna menjelaskan kendalanya, aplikasi menuntun lewat pohon keputusan diagnosis, dan kasus yang belum selesai berubah menjadi tiket.

Jawaban dan solusi disimpan di basis pengetahuan yang bisa disunting, sehingga masalah yang sama tidak perlu didiagnosis dari awal.

---

## License

See [LICENSE](LICENSE).
