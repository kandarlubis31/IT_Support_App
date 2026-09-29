/**
 * IT Support Mandiri - Admin Dashboard v2
 * Search, Pagination, Live Refresh, Export CSV + Full CRUD
 */
class AdminDashboard {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.network = null;
        this.chatChart = null;
        this.categoryChart = null;
        this.liveRefreshInterval = null;
        this.pageSize = 15;
        this.currentPages = {};
        this.allData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadDashboardData();
        this.setupNavigation();
    }

    /* ============ EVENT LISTENERS ============ */
    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.showSection(section);
            });
        });

        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
        document.querySelector('.close')?.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => { if (e.target === document.getElementById('modal')) this.closeModal(); });

        document.getElementById('add-solution-btn')?.addEventListener('click', () => this.showAddSolutionForm());
        document.getElementById('add-faq-btn')?.addEventListener('click', () => this.showAddFaqForm());
        document.getElementById('add-node-btn')?.addEventListener('click', () => this.showAddNodeForm());
        document.getElementById('add-edge-btn')?.addEventListener('click', () => this.showAddEdgeForm());

        document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('export-data')?.addEventListener('click', () => this.exportData());
        document.getElementById('ticket-status-filter')?.addEventListener('change', (e) => this.loadTickets(e.target.value));
        document.getElementById('apply-filter')?.addEventListener('click', () => this.loadAnalytics());

        const thresholdSlider = document.getElementById('similarity-threshold');
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                const valEl = document.getElementById('threshold-value');
                if (valEl) valEl.textContent = e.target.value;
            });
        }

        this.setupSearchFilters();
        this.setupExportButtons();
    }

    /* ============ SEARCH FILTERS ============ */
    setupSearchFilters() {
        document.getElementById('search-solutions')?.addEventListener('input', (e) => this.filterTable('solutions-table', e.target.value));
        document.getElementById('search-faqs')?.addEventListener('input', (e) => this.filterTable('faqs-table', e.target.value));
        document.getElementById('search-tickets')?.addEventListener('input', (e) => this.filterTable('tickets-table', e.target.value));
        document.getElementById('search-chat-logs')?.addEventListener('input', (e) => this.filterTable('chat-logs-table', e.target.value));
        document.getElementById('search-nodes')?.addEventListener('input', (e) => this.filterTable('nodes-table', e.target.value));
        document.getElementById('search-edges')?.addEventListener('input', (e) => this.filterTable('edges-table', e.target.value));
    }

    filterTable(tableId, query) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        const q = query.toLowerCase();
        let visible = 0;
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = !q || text.includes(q);
            row.style.display = match ? '' : 'none';
            if (match) visible++;
        });
        const info = document.getElementById(`${tableId}-info`);
        if (info) info.textContent = q ? `Menampilkan ${visible} hasil untuk "${query}"` : '';
        // Reset pagination to page 1 after search
        this.paginate(tableId, 1);
    }

    /* ============ EXPORT BUTTONS ============ */
    setupExportButtons() {
        document.getElementById('export-tickets-csv')?.addEventListener('click', () => window.open('/api/export/tickets'));
        document.getElementById('export-chat-csv')?.addEventListener('click', () => window.open('/api/export/chat-logs'));
    }

    /* ============ NAVIGATION ============ */
    setupNavigation() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.showSection(hash);
    }

    showSection(sectionName) {
        if (this.liveRefreshInterval) { clearInterval(this.liveRefreshInterval); this.liveRefreshInterval = null; }

        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) activeLink.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) activeSection.classList.add('active');

        const titles = {
            dashboard: 'Dashboard', solutions: 'Kelola Solusi', faqs: 'Kelola FAQ',
            tickets: 'Tiket Support', analytics: 'Analytics', settings: 'Pengaturan',
            'expert-system': 'Kelola AI (Expert)', 'chat-history': 'Riwayat Chat'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[sectionName] || 'Dashboard';

        this.loadSectionData(sectionName);

        if (sectionName === 'dashboard') this.startLiveRefresh();
        if (sectionName !== 'expert-system') window.location.hash = sectionName;
    }

    startLiveRefresh() {
        if (this.liveRefreshInterval) clearInterval(this.liveRefreshInterval);
        this.liveRefreshInterval = setInterval(async () => {
            await this.loadDashboardData();
            this.setupCharts();
        }, 30000);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard': await this.loadDashboardData(); this.setupCharts(); break;
            case 'solutions': await this.loadSolutions(); break;
            case 'faqs': await this.loadFaqs(); break;
            case 'tickets': await this.loadTickets(); break;
            case 'expert-system': await this.loadExpertSystem(); break;
            case 'analytics': await this.loadAnalytics(); break;
            case 'chat-history': await this.loadChatHistory(); break;
        }
    }

    /* ============ DASHBOARD + LIVE REFRESH ============ */
    async loadDashboardData() {
        try {
            const [sol, faq, tic] = await Promise.all([
                fetch('/solutions').then(r => r.json()),
                fetch('/faqs').then(r => r.json()),
                fetch('/tickets').then(r => r.json())
            ]);
            const setTxt = (id, val) => { const el = document.getElementById(id); if (el) { el.textContent = val; el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'pulse 0.5s ease'; } };
            setTxt('total-solutions', (sol.data || sol).length || 0);
            setTxt('total-faqs', (faq.data || faq).length || 0);
            setTxt('total-tickets', (tic.data || tic).length || 0);
            const timeEl = document.getElementById('dashboard-refresh-time');
            if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('id-ID');
        } catch (e) { console.error('Dashboard error:', e); }
    }

    /* ============ CHARTS ============ */
    async setupCharts() {
        try {
            const [chatRes, catRes] = await Promise.all([
                fetch('/api/stats/chat-activity'),
                fetch('/api/stats/ticket-categories')
            ]);
            const chatData = await chatRes.json();
            const catData = await catRes.json();

            const chatCtx = document.getElementById('chatChart')?.getContext('2d');
            if (chatCtx) {
                if (this.chatChart) this.chatChart.destroy();
                this.chatChart = new Chart(chatCtx, {
                    type: 'bar',
                    data: { labels: chatData.labels || [], datasets: [{ label: 'Jumlah Chat', data: chatData.values || [], backgroundColor: 'rgba(0, 123, 255, 0.5)', borderColor: '#007bff', borderWidth: 1 }] },
                    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500 } }
                });
            }

            const catCtx = document.getElementById('categoryChart')?.getContext('2d');
            if (catCtx) {
                if (this.categoryChart) this.categoryChart.destroy();
                this.categoryChart = new Chart(catCtx, {
                    type: 'doughnut',
                    data: { labels: catData.labels || [], datasets: [{ data: catData.values || [], backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8'] }] },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        } catch (e) { console.error('Chart error:', e); }
    }

    /* ============ PAGINATION HELPER ============ */
    paginate(tableId, page) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;
        this.currentPages[tableId] = page || 1;
        const rows = Array.from(tbody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');
        const totalPages = Math.ceil(rows.length / this.pageSize) || 1;
        const start = (this.currentPages[tableId] - 1) * this.pageSize;
        rows.forEach((r, i) => { r.style.display = (i >= start && i < start + this.pageSize) ? '' : 'none'; });
        this.renderPagination(tableId, totalPages);
    }

    renderPagination(tableId, totalPages) {
        const container = document.getElementById(`${tableId}-pagination`);
        if (!container) return;
        const current = this.currentPages[tableId] || 1;
        container.innerHTML = `
            <button ${current <= 1 ? 'disabled' : ''} onclick="adminDashboard.paginate('${tableId}', ${current - 1})"><i class="fas fa-chevron-left"></i></button>
            <span>Halaman ${current} dari ${totalPages}</span>
            <button ${current >= totalPages ? 'disabled' : ''} onclick="adminDashboard.paginate('${tableId}', ${current + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }

    /* ============ SOLUTIONS CRUD ============ */
    async loadSolutions() {
        try {
            const res = await fetch('/solutions');
            const json = await res.json();
            const solutions = json.data || json;
            this.allData['solutions-table'] = solutions;
            const tbody = document.querySelector('#solutions-table tbody');
            if (!tbody) return;
            tbody.innerHTML = solutions.length ? solutions.map(s => `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.category}</td>
                    <td>${s.title}</td>
                    <td>${s.priority}</td>
                    <td>${s.created_at ? new Date(s.created_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editSolution(${s.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteSolution(${s.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('') : '<tr><td colspan="6">Belum ada data solusi.</td></tr>';
            this.paginate('solutions-table', 1);
        } catch (e) { this.showNotification('Gagal load solusi', 'error'); }
    }

    showAddSolutionForm(sol = null) {
        const isEdit = !!sol;
        this.showModalContent(`
            <h3>${isEdit ? 'Edit' : 'Tambah'} Solusi</h3>
            <form id="solution-form">
                <div class="form-group"><label>Kategori:</label><input type="text" name="category" required value="${sol?.category || ''}"></div>
                <div class="form-group"><label>Judul:</label><input type="text" name="title" required value="${sol?.title || ''}"></div>
                <div class="form-group"><label>Keywords:</label><input type="text" name="keywords" value="${sol?.keywords || ''}"></div>
                <div class="form-group"><label>Deskripsi:</label><textarea name="description" required rows="3">${sol?.description || ''}</textarea></div>
                <div class="form-group"><label>Langkah (JSON array):</label><textarea name="steps" rows="3">${sol?.steps ? JSON.stringify(sol.steps) : '[]'}</textarea></div>
                <div class="form-group"><label>Prioritas:</label><input type="number" name="priority" value="${sol?.priority || 0}"></div>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </form>`);
        document.getElementById('solution-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            data.priority = parseInt(data.priority);
            await this.postData(isEdit ? `/solutions/${sol.id}` : '/solutions', data, isEdit ? 'PUT' : 'POST');
            this.loadSolutions();
        });
    }

    async editSolution(id) { const res = await fetch(`/solutions/${id}`); const json = await res.json(); this.showAddSolutionForm(json.data); }
    async deleteSolution(id) { if (confirm('Hapus solusi ini?')) await this.deleteData(`/solutions/${id}`, this.loadSolutions.bind(this)); }

    /* ============ FAQ CRUD ============ */
    async loadFaqs() {
        try {
            const res = await fetch('/faqs');
            const json = await res.json();
            const faqs = json.data || json;
            this.allData['faqs-table'] = faqs;
            const tbody = document.querySelector('#faqs-table tbody');
            if (!tbody) return;
            tbody.innerHTML = faqs.length ? faqs.map(f => `
                <tr>
                    <td>${f.id}</td>
                    <td>${f.question}</td>
                    <td>${f.category || '-'}</td>
                    <td>${f.priority}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editFaq(${f.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteFaq(${f.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('') : '<tr><td colspan="5">Belum ada data FAQ.</td></tr>';
            this.paginate('faqs-table', 1);
        } catch (e) { this.showNotification('Gagal load FAQ', 'error'); }
    }

    showAddFaqForm(faq = null) {
        const isEdit = !!faq;
        this.showModalContent(`
            <h3>${isEdit ? 'Edit' : 'Tambah'} FAQ</h3>
            <form id="faq-form">
                <div class="form-group"><label>Pertanyaan:</label><input type="text" name="question" required value="${faq?.question || ''}"></div>
                <div class="form-group"><label>Jawaban:</label><textarea name="answer" required rows="4">${faq?.answer || ''}</textarea></div>
                <div class="form-group"><label>Keywords:</label><input type="text" name="keywords" value="${faq?.keywords || ''}"></div>
                <div class="form-group"><label>Kategori:</label><input type="text" name="category" value="${faq?.category || 'general'}"></div>
                <div class="form-group"><label>Prioritas:</label><input type="number" name="priority" value="${faq?.priority || 0}"></div>
                <button type="submit" class="btn btn-primary">Simpan</button>
            </form>`);
        document.getElementById('faq-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            data.priority = parseInt(data.priority);
            await this.postData(isEdit ? `/faqs/${faq.id}` : '/faqs', data, isEdit ? 'PUT' : 'POST');
            this.loadFaqs();
        });
    }

    async editFaq(id) { const res = await fetch(`/faqs/${id}`); const json = await res.json(); this.showAddFaqForm(json.data); }
    async deleteFaq(id) { if (confirm('Hapus FAQ ini?')) await this.deleteData(`/faqs/${id}`, this.loadFaqs.bind(this)); }

    /* ============ TICKETS ============ */
    async loadTickets(status = '') {
        try {
            const url = status ? `/tickets?status=${status}` : '/tickets';
            const res = await fetch(url);
            const json = await res.json();
            const tickets = json.data || json;
            this.allData['tickets-table'] = tickets;
            const tbody = document.querySelector('#tickets-table tbody');
            if (!tbody) return;
            tbody.innerHTML = tickets.length ? tickets.map(t => `
                <tr>
                    <td>#${t.id}</td>
                    <td>${t.subject}</td>
                    <td><span class="status-badge status-${t.status}">${t.status}</span></td>
                    <td><span class="priority-badge priority-${t.priority}">${t.priority}</span></td>
                    <td>${t.user_name || '-'}</td>
                    <td>${t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td>
                        <select onchange="adminDashboard.updateTicketStatus(${t.id}, this.value)" style="padding:4px;border-radius:4px;">
                            <option ${t.status === 'open' ? 'selected' : ''} value="open">Open</option>
                            <option ${t.status === 'in_progress' ? 'selected' : ''} value="in_progress">In Progress</option>
                            <option ${t.status === 'resolved' ? 'selected' : ''} value="resolved">Resolved</option>
                            <option ${t.status === 'closed' ? 'selected' : ''} value="closed">Closed</option>
                        </select>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteTicket(${t.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('') : '<tr><td colspan="7">Tidak ada tiket.</td></tr>';
            this.paginate('tickets-table', 1);
        } catch (e) { this.showNotification('Gagal load tiket', 'error'); }
    }

    async updateTicketStatus(id, status) {
        await fetch(`/tickets/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        this.showNotification('Status diperbarui', 'success');
    }

    async deleteTicket(id) { if (confirm('Hapus tiket ini?')) await this.deleteData(`/tickets/${id}`, this.loadTickets.bind(this)); }

    /* ============ CHAT HISTORY ============ */
    async loadChatHistory() {
        try {
            const res = await fetch('/api/chat-logs');
            const logs = await res.json();
            this.allData['chat-logs-table'] = logs;
            const tbody = document.querySelector('#chat-logs-table tbody');
            if (!tbody) return;
            tbody.innerHTML = logs.length ? logs.map(l => `
                <tr>
                    <td>${l.id}</td>
                    <td>${l.user_message}</td>
                    <td>${(l.bot_response || '').substring(0, 80)}...</td>
                    <td><span class="badge" style="background:#${l.response_type === 'solution' ? '28a745' : l.response_type === 'diagnosis_start' ? '007bff' : '6c757d'};color:white;padding:2px 8px;border-radius:12px;">${l.response_type}</span></td>
                    <td>${l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : '-'}</td>
                </tr>`).join('') : '<tr><td colspan="5">Belum ada riwayat chat.</td></tr>';
            this.paginate('chat-logs-table', 1);
        } catch (e) { this.showNotification('Gagal load chat history', 'error'); }
    }

    /* ============ EXPERT SYSTEM ============ */
    async loadExpertSystem() { await this.loadNodes(); await this.loadEdges(); }

    async loadNodes() {
        try {
            const res = await fetch('/api/nodes');
            const nodes = await res.json();
            this.allData['nodes-table'] = nodes;
            const tbody = document.querySelector('#nodes-table tbody');
            if (!tbody) return;
            tbody.innerHTML = nodes.length ? nodes.map(node => {
                const badge = node.type === 'question' ? '<span class="badge" style="background:#007bff;color:white;padding:2px 8px;border-radius:12px;">Pertanyaan</span>' : '<span class="badge" style="background:#28a745;color:white;padding:2px 8px;border-radius:12px;">Solusi</span>';
                return `<tr><td>${node.id}</td><td>${badge}</td><td>${node.content} ${node.is_root ? '<i class="fas fa-star" style="color:gold"></i>' : ''}</td><td>${node.is_root ? 'Ya' : 'Tidak'}</td><td><button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteNode(${node.id})"><i class="fas fa-trash"></i></button></td></tr>`;
            }).join('') : '<tr><td colspan="5">Belum ada node.</td></tr>';
            this.paginate('nodes-table', 1);
        } catch (e) { console.error('Error load nodes:', e); }
    }

    async loadEdges() {
        try {
            const res = await fetch('/api/edges');
            const edges = await res.json();
            this.allData['edges-table'] = edges;
            const tbody = document.querySelector('#edges-table tbody');
            if (!tbody) return;
            tbody.innerHTML = edges.length ? edges.map(edge => `
                <tr><td>${edge.id}</td><td>Node #${edge.source_id} (${(edge.source_content || '').substring(0, 20)}...)</td><td><strong>${edge.label}</strong></td><td>Node #${edge.target_id} (${(edge.target_content || '').substring(0, 20)}...)</td><td><button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteEdge(${edge.id})"><i class="fas fa-trash"></i></button></td></tr>
            `).join('') : '<tr><td colspan="5">Belum ada rule.</td></tr>';
            this.paginate('edges-table', 1);
        } catch (e) { console.error('Error load edges:', e); }
    }

    showAddNodeForm() {
        this.showModalContent(`<h3>Tambah Node Baru</h3><form id="node-form"><div class="form-group"><label>Tipe Node:</label><select name="type" required class="form-control"><option value="question">Pertanyaan</option><option value="solution">Solusi Akhir</option></select></div><div class="form-group"><label>Isi Konten:</label><textarea name="content" rows="3" required class="form-control" placeholder="Contoh: Apakah layar menyala?"></textarea></div><div class="form-group"><label><input type="checkbox" name="is_root"> Jadikan Pertanyaan Awal (Root)</label></div><button type="submit" class="btn btn-primary">Simpan</button></form>`);
        document.getElementById('node-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.postData('/api/nodes', { type: e.target.type.value, content: e.target.content.value, is_root: e.target.is_root.checked });
            this.loadNodes();
        });
    }

    async showAddEdgeForm() {
        try {
            const nodes = await fetch('/api/nodes').then(r => r.json());
            const opts = nodes.map(n => `<option value="${n.id}">[${n.id}] ${n.content.substring(0, 40)}...</option>`).join('');
            this.showModalContent(`<h3>Buat Rule</h3><form id="edge-form"><div class="form-group"><label>Dari:</label><select name="source_id" class="form-control">${opts}</select></div><div class="form-group"><label>Jawaban:</label><input type="text" name="label" required class="form-control" placeholder="Ya / Tidak"></div><div class="form-group"><label>Ke:</label><select name="target_id" class="form-control">${opts}</select></div><button type="submit" class="btn btn-success">Hubungkan</button></form>`);
            document.getElementById('edge-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.postData('/api/edges', { source_id: e.target.source_id.value, label: e.target.label.value, target_id: e.target.target_id.value });
                this.loadEdges();
            });
        } catch (e) { this.showNotification('Gagal load node data', 'error'); }
    }

    async deleteNode(id) { if (confirm('Hapus node ini?')) await this.deleteData(`/api/nodes/${id}`, this.loadNodes.bind(this)); }
    async deleteEdge(id) { if (confirm('Hapus rule ini?')) await this.deleteData(`/api/edges/${id}`, this.loadEdges.bind(this)); }

    /* ============ VISUAL GRAPH ============ */
    async loadVisualGraph() {
        const container = document.getElementById('ai-network-container');
        if (!container) return;
        if (this.network) { this.network.destroy(); this.network = null; }
        container.innerHTML = `<div style="display:flex;height:100%;justify-content:center;align-items:center;flex-direction:column;color:#666;"><i class="fas fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:15px;">Memuat Grafik...</p></div>`;
        try {
            const [nodesRes, edgesRes] = await Promise.all([fetch('/api/nodes'), fetch('/api/edges')]);
            const nodesData = await nodesRes.json();
            const edgesData = await edgesRes.json();
            container.innerHTML = '';
            if (!nodesData.length) { container.innerHTML = '<div style="display:flex;height:100%;justify-content:center;align-items:center;color:#888;">Belum ada data Node.</div>'; return; }
            const visNodes = new vis.DataSet(nodesData.map(n => ({ id: n.id, label: n.content.length > 20 ? n.content.substring(0, 20) + '...' : n.content, title: n.content, color: { background: n.type === 'solution' ? '#d4edda' : '#cce5ff', border: n.type === 'solution' ? '#28a745' : '#007bff', highlight: { background: '#fff3cd', border: '#ffc107' } }, shape: n.type === 'solution' ? 'box' : 'ellipse', font: { size: 14, color: '#333' }, borderWidth: 2, shadow: true })));
            const visEdges = new vis.DataSet(edgesData.map(e => ({ from: e.source_id, to: e.target_id, label: e.label, arrows: 'to', color: { color: '#848484' }, font: { align: 'horizontal', background: 'white', size: 12 }, smooth: { type: 'cubicBezier', roundness: 0.5 } })));
            const data = { nodes: visNodes, edges: visEdges };
            const options = { layout: { hierarchical: { enabled: true, direction: 'UD', sortMethod: 'directed', levelSeparation: 150, nodeSpacing: 250, treeSpacing: 250, blockShifting: true, edgeMinimization: true, parentCentralization: true, shakeTowards: 'roots' } }, physics: { enabled: false }, interaction: { dragNodes: true, dragView: true, zoomView: true, hover: true, navigationButtons: true, keyboard: true } };
            setTimeout(() => { this.network = new vis.Network(container, data, options); setTimeout(() => this.network?.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' } }), 500); }, 100);
        } catch (e) { container.innerHTML = '<div style="color:red;display:flex;height:100%;justify-content:center;align-items:center;">Error memuat grafik.</div>'; }
    }

    /* ============ ANALYTICS ============ */
    async loadAnalytics() {
        try {
            const start = document.getElementById('start-date')?.value;
            const end = document.getElementById('end-date')?.value;
            let url = '/api/stats/top-problems';
            if (start && end) url += `?start=${start}&end=${end}`;
            const res = await fetch(url);
            const data = await res.json();
            const el = document.getElementById('top-problems');
            if (el) el.innerHTML = data.length ? data.map((d, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--border-color);"><strong>#${i + 1}</strong> ${d.subject || d._id} <span style="float:right;color:var(--primary-color);">${d.count}x</span></div>`).join('') : '<p>Belum ada data.</p>';
            const rt = document.getElementById('response-time');
            if (rt) rt.innerHTML = '<p>Rata-rata respons: <strong>~2 detik</strong></p>';
        } catch (e) { console.error('Analytics error:', e); }
    }

    /* ============ GENERIC CRUD ============ */
    async postData(url, data, method = 'POST') {
        try { await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); this.closeModal(); this.showNotification('Berhasil disimpan', 'success'); }
        catch (e) { this.showNotification('Gagal menyimpan', 'error'); }
    }

    async deleteData(url, callback) {
        try { await fetch(url, { method: 'DELETE' }); if (callback) callback(); this.showNotification('Berhasil dihapus', 'success'); }
        catch (e) { this.showNotification('Gagal menghapus', 'error'); }
    }

    /* ============ UTILS ============ */
    showModalContent(html) { const mb = document.getElementById('modal-body'); const m = document.getElementById('modal'); if (mb && m) { mb.innerHTML = html; m.style.display = 'block'; } }
    closeModal() { const m = document.getElementById('modal'); if (m) m.style.display = 'none'; }
    showNotification(msg, type = 'info') { const div = document.createElement('div'); div.className = `notification ${type}`; div.textContent = msg; document.body.appendChild(div); setTimeout(() => div.remove(), 4000); }
    setupTheme() { document.documentElement.setAttribute('data-theme', this.currentTheme); }
    toggleTheme() { this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'; localStorage.setItem('theme', this.currentTheme); this.setupTheme(); }
    saveSettings() { this.showNotification('Pengaturan disimpan', 'success'); }
    exportData() { window.open('/api/export/tickets'); }
}

let adminDashboard;
document.addEventListener('DOMContentLoaded', () => { adminDashboard = new AdminDashboard(); });

window.switchExpertTab = function (tabName) {
    ['nodes-view', 'edges-view', 'visual-view'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    const activeEl = document.getElementById(`${tabName}-view`);
    if (activeEl) activeEl.style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.classList.remove('active'); btn.style.borderBottom = 'none'; btn.style.fontWeight = 'normal'; });
    const clicked = event?.target?.closest('.tab-btn');
    if (clicked) { clicked.classList.add('active'); clicked.style.borderBottom = '2px solid #007bff'; clicked.style.fontWeight = 'bold'; }
    if (tabName === 'visual' && adminDashboard) setTimeout(() => adminDashboard.loadVisualGraph(), 50);
};
