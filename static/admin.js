// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadDashboardData();
        this.setupNavigation();
        this.setupCharts();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.showSection(section);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal controls
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Add buttons
        document.getElementById('add-solution-btn')?.addEventListener('click', () => {
            this.showAddSolutionForm();
        });

        document.getElementById('add-faq-btn')?.addEventListener('click', () => {
            this.showAddFaqForm();
        });

        // Add ticket button
        document.getElementById('add-ticket-btn')?.addEventListener('click', () => {
            this.showAddTicketForm();
        });

        // Settings
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveSettings();
        });

        // Export data
        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });

        // Filter controls
        document.getElementById('ticket-status-filter')?.addEventListener('change', (e) => {
            this.filterTickets(e.target.value);
        });

        // Threshold slider
        const thresholdSlider = document.getElementById('similarity-threshold');
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                document.getElementById('threshold-value').textContent = e.target.value;
            });
        }
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.setupTheme();
    }

    setupNavigation() {
        // Set active navigation based on hash or default to dashboard
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.showSection(hash);
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            solutions: 'Kelola Solusi',
            faqs: 'Kelola FAQ',
            tickets: 'Tiket Support',
            analytics: 'Analytics',
            settings: 'Pengaturan'
        };
        document.getElementById('page-title').textContent = titles[sectionName] || 'Dashboard';

        // Load section-specific data
        this.loadSectionData(sectionName);

        // Update URL hash
        window.location.hash = sectionName;
    }

    async loadDashboardData() {
        try {
            const [solutions, faqs, tickets] = await Promise.all([
                fetch('/solutions').then(r => r.json()),
                fetch('/faqs').then(r => r.json()),
                fetch('/tickets').then(r => r.json())
            ]);

            // Handle new API response format
            const solutionsData = solutions.data || solutions;
            const faqsData = faqs.data || faqs;
            const ticketsData = tickets.data || tickets;

            document.getElementById('total-solutions').textContent = Array.isArray(solutionsData) ? solutionsData.length : 0;
            document.getElementById('total-faqs').textContent = Array.isArray(faqsData) ? faqsData.length : 0;
            document.getElementById('total-tickets').textContent = Array.isArray(ticketsData) ? ticketsData.length : 0;
            document.getElementById('total-chats').textContent = '0'; // Placeholder

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Gagal memuat data dashboard', 'error');
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'solutions':
                await this.loadSolutions();
                break;
            case 'faqs':
                await this.loadFaqs();
                break;
            case 'tickets':
                await this.loadTickets();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadSolutions() {
        try {
            const response = await fetch('/solutions');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Handle new API response format
            const solutions = data.data || data;
            
            const tbody = document.querySelector('#solutions-table tbody');
            tbody.innerHTML = '';

            if (!Array.isArray(solutions)) {
                tbody.innerHTML = '<tr><td colspan="6">Tidak ada data solusi</td></tr>';
                return;
            }

            solutions.forEach(solution => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${solution.id}</td>
                    <td><span class="category-badge">${solution.category}</span></td>
                    <td>${solution.title}</td>
                    <td><span class="priority-badge priority-${this.getPriorityClass(solution.priority)}">${solution.priority}</span></td>
                    <td>${new Date(solution.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editSolution(${solution.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteSolution(${solution.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading solutions:', error);
            this.showNotification('Gagal memuat data solusi: ' + error.message, 'error');
            const tbody = document.querySelector('#solutions-table tbody');
            tbody.innerHTML = '<tr><td colspan="6">Gagal memuat data</td></tr>';
        }
    }

    async loadFaqs() {
        try {
            const response = await fetch('/faqs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Handle new API response format
            const faqs = data.data || data;
            
            const tbody = document.querySelector('#faqs-table tbody');
            tbody.innerHTML = '';

            if (!Array.isArray(faqs)) {
                tbody.innerHTML = '<tr><td colspan="5">Tidak ada data FAQ</td></tr>';
                return;
            }

            faqs.forEach(faq => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${faq.id}</td>
                    <td>${faq.question}</td>
                    <td><span class="category-badge">${faq.category || 'Umum'}</span></td>
                    <td><span class="priority-badge priority-${this.getPriorityClass(faq.priority)}">${faq.priority}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editFaq(${faq.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteFaq(${faq.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading FAQs:', error);
            this.showNotification('Gagal memuat data FAQ: ' + error.message, 'error');
            const tbody = document.querySelector('#faqs-table tbody');
            tbody.innerHTML = '<tr><td colspan="5">Gagal memuat data</td></tr>';
        }
    }

    // Ticket CRUD Operations
    async viewTicket(id) {
        try {
            const response = await fetch(`/tickets/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const ticket = data.data || data;
            
            this.showTicketDetailModal(ticket);
        } catch (error) {
            console.error('Error loading ticket details:', error);
            this.showNotification('Gagal memuat detail tiket: ' + error.message, 'error');
        }
    }

    async editTicket(id) {
        try {
            const response = await fetch(`/tickets/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const ticket = data.data || data;
            
            this.showEditTicketForm(ticket);
        } catch (error) {
            console.error('Error loading ticket for edit:', error);
            this.showNotification('Gagal memuat data tiket untuk diedit: ' + error.message, 'error');
        }
    }

    async deleteTicket(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus tiket ini?')) {
            return;
        }
        
        try {
            const response = await fetch(`/tickets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.showNotification('Tiket berhasil dihapus', 'success');
            this.loadTickets(); // Reload the tickets list
            this.loadDashboardData(); // Update dashboard counts
        } catch (error) {
            console.error('Error deleting ticket:', error);
            this.showNotification('Gagal menghapus tiket: ' + error.message, 'error');
        }
    }

    async updateTicketStatus(id) {
        try {
            // First get current ticket data
            const response = await fetch(`/tickets/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const ticket = data.data || data;
            
            this.showStatusUpdateModal(ticket);
        } catch (error) {
            console.error('Error loading ticket for status update:', error);
            this.showNotification('Gagal memuat data tiket: ' + error.message, 'error');
        }
    }

    async loadTickets() {
        try {
            const response = await fetch('/tickets');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Handle new API response format
            const tickets = data.data || data;
            
            const tbody = document.querySelector('#tickets-table tbody');
            tbody.innerHTML = '';

            if (!Array.isArray(tickets)) {
                tbody.innerHTML = '<tr><td colspan="7">Tidak ada data tiket</td></tr>';
                return;
            }

            tickets.forEach(ticket => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${ticket.id}</td>
                    <td>${ticket.subject}</td>
                    <td><span class="status-badge status-${ticket.status}">${this.getStatusText(ticket.status)}</span></td>
                    <td><span class="priority-badge priority-${this.getPriorityClass(ticket.priority)}">${ticket.priority}</span></td>
                    <td>${ticket.user_name || 'N/A'}</td>
                    <td>${new Date(ticket.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewTicket(${ticket.id})" title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="adminDashboard.editTicket(${ticket.id})" title="Edit Tiket">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="adminDashboard.updateTicketStatus(${ticket.id})" title="Update Status">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteTicket(${ticket.id})" title="Hapus Tiket">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading tickets:', error);
            this.showNotification('Gagal memuat data tiket: ' + error.message, 'error');
            const tbody = document.querySelector('#tickets-table tbody');
            tbody.innerHTML = '<tr><td colspan="7">Gagal memuat data</td></tr>';
        }
    }

    setupCharts() {
        // Chat Activity Chart
        const chatCtx = document.getElementById('chatChart');
        if (chatCtx) {
            new Chart(chatCtx, {
                type: 'line',
                data: {
                    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                    datasets: [{
                        label: 'Chat per Hari',
                        data: [12, 19, 3, 5, 2, 3, 7],
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Category Chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
            new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Hardware', 'Software', 'Network', 'OS'],
                    datasets: [{
                        data: [30, 25, 20, 25],
                        backgroundColor: [
                            '#007bff',
                            '#28a745',
                            '#ffc107',
                            '#dc3545'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    showAddSolutionForm() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Tambah Solusi Baru</h3>
            <form id="solution-form">
                <div class="form-group">
                    <label>Kategori:</label>
                    <select name="category" required>
                        <option value="">Pilih Kategori</option>
                        <option value="os">Sistem Operasi</option>
                        <option value="hardware">Hardware</option>
                        <option value="network">Jaringan</option>
                        <option value="software">Software</option>
                        <option value="security">Keamanan</option>
                        <option value="performance">Performance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Judul:</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>Keywords (pisahkan dengan koma):</label>
                    <input type="text" name="keywords">
                </div>
                <div class="form-group">
                    <label>Deskripsi:</label>
                    <textarea name="description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Langkah-langkah (satu per baris):</label>
                    <textarea name="steps" rows="6" placeholder="Masukkan setiap langkah dalam baris terpisah"></textarea>
                </div>
                <div class="form-group">
                    <label>Prioritas:</label>
                    <select name="priority">
                        <option value="1">Rendah</option>
                        <option value="5">Sedang</option>
                        <option value="10">Tinggi</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Simpan Solusi</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('solution-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSolution(new FormData(e.target));
        });

        this.showModal();
    }

    showAddFaqForm() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Tambah FAQ Baru</h3>
            <form id="faq-form">
                <div class="form-group">
                    <label>Pertanyaan:</label>
                    <input type="text" name="question" required>
                </div>
                <div class="form-group">
                    <label>Jawaban:</label>
                    <textarea name="answer" rows="6" required></textarea>
                </div>
                <div class="form-group">
                    <label>Keywords (pisahkan dengan koma):</label>
                    <input type="text" name="keywords">
                </div>
                <div class="form-group">
                    <label>Kategori:</label>
                    <select name="category">
                        <option value="">Pilih Kategori</option>
                        <option value="os">Sistem Operasi</option>
                        <option value="hardware">Hardware</option>
                        <option value="network">Jaringan</option>
                        <option value="software">Software</option>
                        <option value="security">Keamanan</option>
                        <option value="performance">Performance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Prioritas:</label>
                    <select name="priority">
                        <option value="1">Rendah</option>
                        <option value="5">Sedang</option>
                        <option value="10">Tinggi</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Simpan FAQ</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('faq-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFaq(new FormData(e.target));
        });

        this.showModal();
    }

    async saveSolution(formData) {
        try {
            const steps = formData.get('steps').split('\n').filter(step => step.trim());
            
            const solutionData = {
                category: formData.get('category'),
                title: formData.get('title'),
                keywords: formData.get('keywords'),
                description: formData.get('description'),
                steps: JSON.stringify(steps),
                priority: parseInt(formData.get('priority'))
            };

            const response = await fetch('/solutions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(solutionData)
            });

            if (response.ok) {
                this.showNotification('Solusi berhasil ditambahkan', 'success');
                this.closeModal();
                this.loadSolutions();
            } else {
                throw new Error('Gagal menyimpan solusi');
            }
        } catch (error) {
            console.error('Error saving solution:', error);
            this.showNotification('Gagal menyimpan solusi', 'error');
        }
    }

    async saveFaq(formData) {
        try {
            const faqData = {
                question: formData.get('question'),
                answer: formData.get('answer'),
                keywords: formData.get('keywords'),
                category: formData.get('category'),
                priority: parseInt(formData.get('priority'))
            };

            const response = await fetch('/faqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(faqData)
            });

            if (response.ok) {
                this.showNotification('FAQ berhasil ditambahkan', 'success');
                this.closeModal();
                this.loadFaqs();
            } else {
                throw new Error('Gagal menyimpan FAQ');
            }
        } catch (error) {
            console.error('Error saving FAQ:', error);
            this.showNotification('Gagal menyimpan FAQ', 'error');
        }
    }

    showModal() {
        document.getElementById('modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getPriorityClass(priority) {
        if (priority >= 8) return 'high';
        if (priority >= 5) return 'medium';
        return 'low';
    }

    getStatusText(status) {
        const statusMap = {
            open: 'Terbuka',
            in_progress: 'Dalam Proses',
            resolved: 'Selesai',
            closed: 'Ditutup'
        };
        return statusMap[status] || status;
    }

    async exportData() {
        try {
            const [solutions, faqs, chats] = await Promise.all([
                fetch('/solutions').then(r => r.json()),
                fetch('/faqs').then(r => r.json()),
                fetch('/chat_logs').then(r => r.json())
            ]);

            const data = {
                solutions,
                faqs,
                chats,
                exported_at: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `it_support_data_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Data berhasil diekspor', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Gagal mengekspor data', 'error');
        }
    }

    async saveSettings() {
        try {
            const settings = {
                similarity_threshold: document.getElementById('similarity-threshold').value,
                max_suggestions: document.getElementById('max-suggestions').value,
                email_notifications: document.getElementById('email-notifications').checked,
                push_notifications: document.getElementById('push-notifications').checked
            };

            // Save to localStorage for now - implement API endpoint later
            localStorage.setItem('admin_settings', JSON.stringify(settings));
            this.showNotification('Pengaturan berhasil disimpan', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Gagal menyimpan pengaturan', 'error');
        }
    }

    async loadAnalytics() {
        // Implement analytics loading
        console.log('Loading analytics...');
    }

    filterTickets(status) {
        const rows = document.querySelectorAll('#tickets-table tbody tr');
        rows.forEach(row => {
            if (!status || row.querySelector('.status-badge').classList.contains(`status-${status}`)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // CRUD Operations for Solutions
    async editSolution(id) {
        try {
            const response = await fetch(`/solutions/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const solution = data.data || data;
            
            this.showEditSolutionForm(solution);
        } catch (error) {
            console.error('Error loading solution for edit:', error);
            this.showNotification('Gagal memuat data solusi untuk diedit: ' + error.message, 'error');
        }
    }

    async deleteSolution(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus solusi ini?')) {
            return;
        }
        
        try {
            const response = await fetch(`/solutions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.showNotification('Solusi berhasil dihapus', 'success');
            this.loadSolutions(); // Reload the solutions list
        } catch (error) {
            console.error('Error deleting solution:', error);
            this.showNotification('Gagal menghapus solusi: ' + error.message, 'error');
        }
    }

    async editFaq(id) {
        try {
            const response = await fetch(`/faqs/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const faq = data.data || data;
            
            this.showEditFaqForm(faq);
        } catch (error) {
            console.error('Error loading FAQ for edit:', error);
            this.showNotification('Gagal memuat data FAQ untuk diedit: ' + error.message, 'error');
        }
    }

    async deleteFaq(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) {
            return;
        }
        
        try {
            const response = await fetch(`/faqs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.showNotification('FAQ berhasil dihapus', 'success');
            this.loadFaqs(); // Reload the FAQs list
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            this.showNotification('Gagal menghapus FAQ: ' + error.message, 'error');
        }
    }

    showEditSolutionForm(solution) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Edit Solusi</h3>
            <form id="edit-solution-form">
                <input type="hidden" name="id" value="${solution.id}">
                <div class="form-group">
                    <label>Kategori:</label>
                    <select name="category" required>
                        <option value="">Pilih Kategori</option>
                        <option value="os" ${solution.category === 'os' ? 'selected' : ''}>Sistem Operasi</option>
                        <option value="hardware" ${solution.category === 'hardware' ? 'selected' : ''}>Hardware</option>
                        <option value="network" ${solution.category === 'network' ? 'selected' : ''}>Jaringan</option>
                        <option value="software" ${solution.category === 'software' ? 'selected' : ''}>Software</option>
                        <option value="security" ${solution.category === 'security' ? 'selected' : ''}>Keamanan</option>
                        <option value="performance" ${solution.category === 'performance' ? 'selected' : ''}>Performance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Judul:</label>
                    <input type="text" name="title" value="${solution.title}" required>
                </div>
                <div class="form-group">
                    <label>Keywords (pisahkan dengan koma):</label>
                    <input type="text" name="keywords" value="${solution.keywords || ''}">
                </div>
                <div class="form-group">
                    <label>Deskripsi:</label>
                    <textarea name="description" rows="4" required>${solution.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Langkah-langkah (satu per baris):</label>
                    <textarea name="steps" rows="6" placeholder="Masukkan setiap langkah dalam baris terpisah">${Array.isArray(solution.steps) ? solution.steps.join('\n') : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Prioritas:</label>
                    <select name="priority">
                        <option value="1" ${solution.priority == 1 ? 'selected' : ''}>Rendah</option>
                        <option value="5" ${solution.priority == 5 ? 'selected' : ''}>Sedang</option>
                        <option value="10" ${solution.priority == 10 ? 'selected' : ''}>Tinggi</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update Solusi</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('edit-solution-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSolution(new FormData(e.target));
        });

        this.showModal();
    }

    showEditFaqForm(faq) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Edit FAQ</h3>
            <form id="edit-faq-form">
                <input type="hidden" name="id" value="${faq.id}">
                <div class="form-group">
                    <label>Pertanyaan:</label>
                    <input type="text" name="question" value="${faq.question}" required>
                </div>
                <div class="form-group">
                    <label>Jawaban:</label>
                    <textarea name="answer" rows="6" required>${faq.answer}</textarea>
                </div>
                <div class="form-group">
                    <label>Keywords (pisahkan dengan koma):</label>
                    <input type="text" name="keywords" value="${faq.keywords || ''}">
                </div>
                <div class="form-group">
                    <label>Kategori:</label>
                    <select name="category">
                        <option value="">Pilih Kategori</option>
                        <option value="os" ${faq.category === 'os' ? 'selected' : ''}>Sistem Operasi</option>
                        <option value="hardware" ${faq.category === 'hardware' ? 'selected' : ''}>Hardware</option>
                        <option value="network" ${faq.category === 'network' ? 'selected' : ''}>Jaringan</option>
                        <option value="software" ${faq.category === 'software' ? 'selected' : ''}>Software</option>
                        <option value="security" ${faq.category === 'security' ? 'selected' : ''}>Keamanan</option>
                        <option value="performance" ${faq.category === 'performance' ? 'selected' : ''}>Performance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Prioritas:</label>
                    <select name="priority">
                        <option value="1" ${faq.priority == 1 ? 'selected' : ''}>Rendah</option>
                        <option value="5" ${faq.priority == 5 ? 'selected' : ''}>Sedang</option>
                        <option value="10" ${faq.priority == 10 ? 'selected' : ''}>Tinggi</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update FAQ</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('edit-faq-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFaq(new FormData(e.target));
        });

        this.showModal();
    }

    async updateSolution(formData) {
        try {
            const id = formData.get('id');
            const steps = formData.get('steps').split('\n').filter(step => step.trim());
            
            const solutionData = {
                category: formData.get('category'),
                title: formData.get('title'),
                keywords: formData.get('keywords'),
                description: formData.get('description'),
                steps: JSON.stringify(steps),
                priority: parseInt(formData.get('priority'))
            };

            const response = await fetch(`/solutions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(solutionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('Solusi berhasil diupdate', 'success');
            this.closeModal();
            this.loadSolutions();
        } catch (error) {
            console.error('Error updating solution:', error);
            this.showNotification('Gagal mengupdate solusi: ' + error.message, 'error');
        }
    }

    async updateFaq(formData) {
        try {
            const id = formData.get('id');
            
            const faqData = {
                question: formData.get('question'),
                answer: formData.get('answer'),
                keywords: formData.get('keywords'),
                category: formData.get('category'),
                priority: parseInt(formData.get('priority'))
            };

            const response = await fetch(`/faqs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(faqData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('FAQ berhasil diupdate', 'success');
            this.closeModal();
            this.loadFaqs();
        } catch (error) {
            console.error('Error updating FAQ:', error);
            this.showNotification('Gagal mengupdate FAQ: ' + error.message, 'error');
        }
    }

    showTicketDetailModal(ticket) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Detail Tiket #${ticket.id}</h3>
            <div class="ticket-detail">
                <div class="form-group">
                    <label><strong>Subject:</strong></label>
                    <p>${ticket.subject}</p>
                </div>
                <div class="form-group">
                    <label><strong>Deskripsi:</strong></label>
                    <p style="white-space: pre-wrap;">${ticket.description}</p>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>Status:</strong></label>
                            <p><span class="status-badge status-${ticket.status}">${this.getStatusText(ticket.status)}</span></p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>Prioritas:</strong></label>
                            <p><span class="priority-badge priority-${this.getPriorityClass(ticket.priority)}">${ticket.priority}</span></p>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>Kategori:</strong></label>
                            <p>${ticket.category || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>Assigned To:</strong></label>
                            <p>${ticket.assigned_to || 'Belum ditugaskan'}</p>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>User:</strong></label>
                            <p>${ticket.user_name || 'N/A'} ${ticket.user_email ? '(' + ticket.user_email + ')' : ''}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>Dibuat:</strong></label>
                            <p>${new Date(ticket.created_at).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
                ${ticket.resolution ? `
                <div class="form-group">
                    <label><strong>Resolution:</strong></label>
                    <p style="white-space: pre-wrap; background: #f8f9fa; padding: 10px; border-radius: 4px;">${ticket.resolution}</p>
                </div>
                ` : ''}
                ${ticket.resolved_at ? `
                <div class="form-group">
                    <label><strong>Resolved At:</strong></label>
                    <p>${new Date(ticket.resolved_at).toLocaleString('id-ID')}</p>
                </div>
                ` : ''}
                <div class="form-group">
                    <button type="button" class="btn btn-warning" onclick="adminDashboard.closeModal(); adminDashboard.editTicket(${ticket.id})">Edit Tiket</button>
                    <button type="button" class="btn btn-success" onclick="adminDashboard.closeModal(); adminDashboard.updateTicketStatus(${ticket.id})">Update Status</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Tutup</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    showEditTicketForm(ticket) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Edit Tiket #${ticket.id}</h3>
            <form id="edit-ticket-form">
                <input type="hidden" name="id" value="${ticket.id}">
                <div class="form-group">
                    <label>Subject:</label>
                    <input type="text" name="subject" value="${ticket.subject}" required>
                </div>
                <div class="form-group">
                    <label>Deskripsi:</label>
                    <textarea name="description" rows="4" required>${ticket.description}</textarea>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Status:</label>
                            <select name="status" required>
                                <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                                <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Prioritas:</label>
                            <select name="priority" required>
                                <option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${ticket.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="urgent" ${ticket.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Kategori:</label>
                            <select name="category">
                                <option value="">Pilih Kategori</option>
                                <option value="hardware" ${ticket.category === 'hardware' ? 'selected' : ''}>Hardware</option>
                                <option value="software" ${ticket.category === 'software' ? 'selected' : ''}>Software</option>
                                <option value="network" ${ticket.category === 'network' ? 'selected' : ''}>Network</option>
                                <option value="performance" ${ticket.category === 'performance' ? 'selected' : ''}>Performance</option>
                                <option value="security" ${ticket.category === 'security' ? 'selected' : ''}>Security</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Assigned To:</label>
                            <input type="text" name="assigned_to" value="${ticket.assigned_to || ''}">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>User Name:</label>
                            <input type="text" name="user_name" value="${ticket.user_name || ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>User Email:</label>
                            <input type="email" name="user_email" value="${ticket.user_email || ''}">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Resolution:</label>
                    <textarea name="resolution" rows="3" placeholder="Masukkan solusi jika tiket sudah resolved">${ticket.resolution || ''}</textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update Tiket</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('edit-ticket-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTicket(new FormData(e.target));
        });

        this.showModal();
    }

    showStatusUpdateModal(ticket) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Update Status Tiket #${ticket.id}</h3>
            <div class="ticket-info" style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <h5>${ticket.subject}</h5>
                <p><strong>Status saat ini:</strong> <span class="status-badge status-${ticket.status}">${this.getStatusText(ticket.status)}</span></p>
                <p><strong>Prioritas:</strong> <span class="priority-badge priority-${this.getPriorityClass(ticket.priority)}">${ticket.priority}</span></p>
            </div>
            <form id="status-update-form">
                <input type="hidden" name="id" value="${ticket.id}">
                <div class="form-group">
                    <label>Status Baru:</label>
                    <select name="status" required>
                        <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                        <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-success">Update Status</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('status-update-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitStatusUpdate(new FormData(e.target));
        });

        this.showModal();
    }

    async updateTicket(formData) {
        try {
            const id = formData.get('id');
            
            const ticketData = {
                subject: formData.get('subject'),
                description: formData.get('description'),
                status: formData.get('status'),
                priority: formData.get('priority'),
                category: formData.get('category'),
                user_name: formData.get('user_name'),
                user_email: formData.get('user_email'),
                assigned_to: formData.get('assigned_to'),
                resolution: formData.get('resolution')
            };

            const response = await fetch(`/tickets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('Tiket berhasil diupdate', 'success');
            this.closeModal();
            this.loadTickets();
        } catch (error) {
            console.error('Error updating ticket:', error);
            this.showNotification('Gagal mengupdate tiket: ' + error.message, 'error');
        }
    }

    async submitStatusUpdate(formData) {
        try {
            const id = formData.get('id');
            const statusData = {
                status: formData.get('status')
            };

            const response = await fetch(`/tickets/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statusData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('Status tiket berhasil diupdate', 'success');
            this.closeModal();
            this.loadTickets();
        } catch (error) {
            console.error('Error updating ticket status:', error);
            this.showNotification('Gagal mengupdate status tiket: ' + error.message, 'error');
        }
    }

    showAddTicketForm() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Tambah Tiket Baru</h3>
            <form id="ticket-form">
                <div class="form-group">
                    <label>Subject:</label>
                    <input type="text" name="subject" required>
                </div>
                <div class="form-group">
                    <label>Deskripsi:</label>
                    <textarea name="description" rows="4" required></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Status:</label>
                            <select name="status">
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Prioritas:</label>
                            <select name="priority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Kategori:</label>
                            <select name="category">
                                <option value="">Pilih Kategori</option>
                                <option value="hardware">Hardware</option>
                                <option value="software">Software</option>
                                <option value="network">Network</option>
                                <option value="performance">Performance</option>
                                <option value="security">Security</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Assigned To:</label>
                            <input type="text" name="assigned_to" placeholder="Nama admin/teknisi">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>User Name:</label>
                            <input type="text" name="user_name" placeholder="Nama user yang melaporkan">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>User Email:</label>
                            <input type="email" name="user_email" placeholder="Email user">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Simpan Tiket</button>
                    <button type="button" class="btn btn-secondary" onclick="adminDashboard.closeModal()">Batal</button>
                </div>
            </form>
        `;

        document.getElementById('ticket-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTicket(new FormData(e.target));
        });

        this.showModal();
    }

    async saveTicket(formData) {
        try {
            const ticketData = {
                subject: formData.get('subject'),
                description: formData.get('description'),
                status: formData.get('status'),
                priority: formData.get('priority'),
                category: formData.get('category'),
                user_name: formData.get('user_name'),
                user_email: formData.get('user_email'),
                assigned_to: formData.get('assigned_to')
            };

            const response = await fetch('/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('Tiket berhasil ditambahkan', 'success');
            this.closeModal();
            this.loadTickets();
            this.loadDashboardData(); // Update dashboard counts
        } catch (error) {
            console.error('Error saving ticket:', error);
            this.showNotification('Gagal menyimpan tiket: ' + error.message, 'error');
        }
    }
}
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});