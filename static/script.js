/**
 * IT Support Mandiri - Unified Client Script v2
 * All-in-one: chatbot, diagnosis, search, tickets, feedback, notifications, sounds, skeleton loading
 */
class ITSupportApp {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.isDiagnosisMode = false;
        this.currentNodeId = null;
        this.isLoading = true;
        this.unreadCount = 0;
        this.lastBotMsgId = null;
        this.notificationGranted = false;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        
        this.searchSuggestions = [
            'laptop lemot', 'wifi tidak konek', 'blue screen', 'printer error',
            'virus komputer', 'password lupa', 'driver bermasalah', 'sistem hang',
            'internet lambat', 'file corrupt', 'aplikasi crash', 'update windows'
        ];
        this.solutions = [];
        this.faqs = [];
        this.init();
    }

    /* ============ INIT ============ */
    init() {
        this.setupLoading();
        this.setupTheme();
        this.setupNavigation();
        this.setupSearch();
        this.setupChatbot();
        this.setupTicketModal();
        this.setupQuickActions();
        this.setupAnimations();
        this.setupBackToTop();
        this.setupExtraListeners();
        this.requestNotificationPermission();
        this.loadContent();
    }

    /* ============ LOADING + SKELETON ============ */
    setupLoading() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            this.showSkeletonLoading();
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    document.body.classList.add('loaded');
                    this.isLoading = false;
                }, 400);
            }, 500);
        } else {
            document.body.classList.add('loaded');
            this.isLoading = false;
        }
    }

    showSkeletonLoading() {
        const content = document.querySelector('#loading-screen .loading-content');
        if (!content) return;
        const old = content.querySelector('p');
        if (old) old.textContent = 'Menyiapkan AI Assistant...';
    }

    /* ============ THEME ============ */
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            btn.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const icon = document.querySelector('#theme-toggle i');
        if (icon) icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    /* ============ NAVIGATION ============ */
    setupNavigation() {
        document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        });
        const hamburger = document.getElementById('hamburger-btn');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            navMenu.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
        window.addEventListener('scroll', () => {
            this.updateActiveNav();
            this.handleBackToTop();
        });
    }

    updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const links = document.querySelectorAll('.nav-link[href^="#"]');
        let current = '';
        sections.forEach(s => { if (scrollY >= s.offsetTop - 200) current = s.getAttribute('id'); });
        links.forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('href') === `#${current}`) l.classList.add('active');
        });
    }

    /* ============ SEARCH ============ */
    setupSearch() {
        const input = document.getElementById('searchInput');
        const btn = document.getElementById('searchButton');
        if (input) {
            input.addEventListener('input', (e) => this.showSearchSuggestions(e.target.value));
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.performSearch(); });
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !document.getElementById('searchSuggestions')?.contains(e.target))
                    this.hideSearchSuggestions();
            });
        }
        if (btn) btn.addEventListener('click', () => this.performSearch());
        document.querySelectorAll('.search-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const term = tag.textContent.trim();
                if (input) input.value = term;
                this.quickSearch(term);
            });
        });
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const cat = card.getAttribute('data-category');
                if (cat) this.displayCategoryContent(cat);
            });
        });
    }

    showSearchSuggestions(query) {
        const el = document.getElementById('searchSuggestions');
        if (!el || !query.trim()) { this.hideSearchSuggestions(); return; }
        const filtered = this.searchSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
        if (filtered.length) {
            el.innerHTML = filtered.map(s => `<div class="suggestion-item">${s}</div>`).join('');
            el.style.display = 'block';
            el.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const inp = document.getElementById('searchInput');
                    if (inp) inp.value = item.textContent;
                    this.quickSearch(item.textContent);
                    this.hideSearchSuggestions();
                });
            });
        } else this.hideSearchSuggestions();
    }

    hideSearchSuggestions() { const el = document.getElementById('searchSuggestions'); if (el) el.style.display = 'none'; }

    performSearch() {
        const val = document.getElementById('searchInput')?.value?.trim();
        if (val) this.quickSearch(val);
        else this.showNotification('Masukkan kata kunci pencarian', 'warning');
    }

    quickSearch(text) { this.toggleChatbot(true); this.sendMessage(text); }

    /* ============ CATEGORY DISPLAY ============ */
    async displayCategoryContent(category) {
        const main = document.querySelector('main');
        if (!main) return;
        let sec = document.getElementById('category-results-section');
        if (sec) sec.remove();
        sec = document.createElement('section');
        sec.id = 'category-results-section';
        sec.innerHTML = `<div class="section-header"><h2>Solusi: ${category.replace(/[_-]/g, ' ').toUpperCase()}</h2><button class="btn btn-secondary" onclick="this.closest('section').remove()"><i class="fas fa-times"></i> Tutup</button></div><div id="category-results"><div class="loading-spinner"></div><p>Memuat solusi...</p></div>`;
        main.insertBefore(sec, document.getElementById('search-section')?.nextSibling || main.firstChild);
        sec.scrollIntoView({ behavior: 'smooth' });
        try {
            const res = await fetch('/solutions');
            const data = await res.json();
            const solutions = (data.data || data).filter(s => s.category === category);
            const rc = document.getElementById('category-results');
            if (!rc) return;
            if (!solutions.length) { rc.innerHTML = '<p>Belum ada solusi untuk kategori ini.</p>'; return; }
            rc.innerHTML = solutions.map(s => `<div class="result-card" style="background:var(--bg-card);padding:20px;border-radius:12px;margin-bottom:15px;border:1px solid var(--border-color);"><h4 style="color:var(--primary-color)">${s.title}</h4><p>${s.description}</p>${s.steps?.length ? `<ol>${s.steps.map(st => `<li>${st}</li>`).join('')}</ol>` : ''}</div>`).join('');
        } catch (e) { const rc = document.getElementById('category-results'); if (rc) rc.innerHTML = '<p>Gagal memuat solusi.</p>'; }
    }

    /* ============ CHATBOT ============ */
    setupChatbot() {
        const input = document.getElementById('chatbotInput');
        if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        document.getElementById('sendChatbotButton')?.addEventListener('click', () => this.sendMessage());
    }

    toggleChatbot(forceOpen = null) {
        const popup = document.getElementById('chatbot-popup');
        if (!popup) return;
        if (forceOpen === true) popup.classList.remove('hidden');
        else if (forceOpen === false) popup.classList.add('hidden');
        else popup.classList.toggle('hidden');
        if (!popup.classList.contains('hidden')) {
            document.getElementById('chatbotInput')?.focus();
            this.scrollChatToBottom();
            this.clearUnreadBadge();
        }
    }

    openChatbot() { this.toggleChatbot(true); }
    closeChatbot() { this.toggleChatbot(false); }

    scrollChatToBottom() {
        const mc = document.getElementById('chatbot-messages');
        if (mc) mc.scrollTop = mc.scrollHeight;
    }

    showTyping(show) {
        const indicator = document.getElementById('typing-indicator');
        if (!indicator) return;
        if (show) { indicator.classList.remove('hidden'); document.getElementById('chatbot-messages')?.appendChild(indicator); }
        else indicator.classList.add('hidden');
        this.scrollChatToBottom();
    }

    async sendMessage(manualText = null) {
        const input = document.getElementById('chatbotInput');
        const text = manualText || input?.value?.trim();
        if (!text) return;
        this.addMessage(text, 'user');
        if (!manualText && input) input.value = '';
        this.showTyping(true);
        this.playSound('send');
        try {
            if (this.isDiagnosisMode) { await this.handleDiagnosisLogic(text); }
            else {
                const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
                const data = await res.json();
                this.showTyping(false);
                await this.typeEffect(data.response, 'bot');
                if (data.type === 'diagnosis_start') this.startDiagnosisFlow(false);
            }
        } catch (e) { this.showTyping(false); this.addMessage('Maaf, koneksi server terputus.', 'bot'); console.error(e); }
    }

    /* ============ TYPING EFFECT ============ */
    async typeEffect(fullText, sender) {
        const msgId = 'msg-' + Date.now();
        this.lastBotMsgId = msgId;
        this.prepareMessageContainer(fullText, sender, msgId);
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        const p = msgEl.querySelector('p');
        if (!p) return;
        const chars = fullText.split('');
        const speed = Math.max(15, Math.min(40, 300 / chars.length));
        let i = 0;
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (i < chars.length) {
                    p.textContent += chars[i];
                    i++;
                    this.scrollChatToBottom();
                } else {
                    clearInterval(interval);
                    this.addFeedbackButtons(msgId);
                    this.incrementUnread();
                    this.showBrowserNotification(fullText.substring(0, 60) + '...');
                    this.playSound('receive');
                    resolve();
                }
            }, speed);
        });
    }

    addMessage(text, sender) {
        const msgId = 'msg-' + Date.now();
        if (sender === 'bot') this.lastBotMsgId = msgId;
        this.prepareMessageContainer(text, sender, msgId);
        if (sender === 'bot') {
            this.addFeedbackButtons(msgId);
            this.incrementUnread();
            if (!document.getElementById('chatbot-popup')?.classList.contains('hidden')) {
                this.showBrowserNotification(text.substring(0, 60) + '...');
            }
            this.playSound('receive');
        }
        this.scrollChatToBottom();
    }

    prepareMessageContainer(text, sender, msgId) {
        const container = document.getElementById('chatbot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.id = msgId;
        const avatar = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `<div class="message-avatar"><i class="${avatar}"></i></div><div class="message-content"><p>${sender === 'user' ? text : ''}</p><span class="message-time">${time}</span></div>`;
        const typing = document.getElementById('typing-indicator');
        container.insertBefore(div, typing);
    }

    /* ============ FEEDBACK SYSTEM ============ */
    addFeedbackButtons(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        const content = msgEl.querySelector('.message-content');
        if (!content) return;
        const fb = document.createElement('div');
        fb.className = 'feedback-buttons';
        fb.innerHTML = `<button class="fb-btn fb-up" title="Membantu"><i class="fas fa-thumbs-up"></i></button><button class="fb-btn fb-down" title="Tidak membantu"><i class="fas fa-thumbs-down"></i></button>`;
        fb.querySelector('.fb-up').addEventListener('click', () => this.sendFeedback('up', fb));
        fb.querySelector('.fb-down').addEventListener('click', () => this.sendFeedback('down', fb));
        content.appendChild(fb);
    }

    async sendFeedback(type, fbEl) {
        fbEl.querySelectorAll('button').forEach(b => b.disabled = true);
        fbEl.querySelector(`.fb-${type}`).classList.add('active');
        try {
            await fetch('/api/chat-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: type }) });
            this.showNotification(type === 'up' ? '👍 Terima kasih!' : '👎 Akan kami perbaiki.', 'info');
        } catch (e) { /* silent */ }
    }

    /* ============ BROWSER NOTIFICATIONS ============ */
    async requestNotificationPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') { this.notificationGranted = true; return; }
        if (Notification.permission !== 'denied') {
            const perm = await Notification.requestPermission();
            this.notificationGranted = perm === 'granted';
        }
    }

    showBrowserNotification(text) {
        if (!this.notificationGranted || document.getElementById('chatbot-popup')?.classList.contains('hidden') === false) return;
        try {
            new Notification('IT Support AI', { body: text, icon: '/static/favicon.ico', tag: 'chat-msg' });
        } catch (e) { /* ignore */ }
    }

    /* ============ UNREAD BADGE ============ */
    incrementUnread() {
        this.unreadCount++;
        this.updateUnreadBadge();
    }

    clearUnreadBadge() {
        this.unreadCount = 0;
        this.updateUnreadBadge();
    }

    updateUnreadBadge() {
        const fab = document.getElementById('fab-chat-btn');
        if (!fab) return;
        let badge = fab.querySelector('.unread-badge');
        if (this.unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'unread-badge';
                fab.appendChild(badge);
            }
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        } else if (badge) {
            badge.remove();
        }
    }

    /* ============ SOUND EFFECTS (Web Audio API) ============ */
    playSound(type) {
        if (!this.soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.05;
            if (type === 'send') { osc.type = 'sine'; osc.frequency.value = 600; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); }
            else if (type === 'receive') { osc.type = 'sine'; osc.frequency.value = 800; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); }
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) { /* Web Audio not supported */ }
    }

    /* ============ DIAGNOSIS (EXPERT SYSTEM) ============ */
    async startDiagnosisFlow(openWindow = true) {
        if (openWindow) this.toggleChatbot(true);
        this.isDiagnosisMode = true;
        this.currentNodeId = null;
        document.querySelectorAll('.quick-replies-dynamic').forEach(el => el.remove());
        await this.handleDiagnosisLogic(null);
    }

    async handleDiagnosisLogic(userAnswer) {
        try {
            const [nodesRes, edgesRes] = await Promise.all([fetch('/api/nodes'), fetch('/api/edges')]);
            const nodes = await nodesRes.json();
            const edges = await edgesRes.json();
            let nextNode = null;
            if (this.currentNodeId === null) { nextNode = nodes.find(n => n.is_root); }
            else {
                const edge = edges.find(e => e.source_id === this.currentNodeId && e.label.toLowerCase() === userAnswer?.toLowerCase());
                if (edge) nextNode = nodes.find(n => n.id === edge.target_id);
                else { this.showTyping(false); this.addMessage('Jawaban tidak sesuai opsi. Silakan klik tombol di bawah.', 'bot'); const currentEdges = edges.filter(e => e.source_id === this.currentNodeId); this.showOptions(currentEdges.map(e => e.label)); return; }
            }
            this.showTyping(false);
            if (!nextNode) return;
            this.currentNodeId = nextNode.id;
            await this.typeEffect(nextNode.content, 'bot');
            if (nextNode.type === 'solution') { this.isDiagnosisMode = false; this.currentNodeId = null; setTimeout(() => this.addMessage('Semoga membantu! Ada lagi yang bisa saya bantu?', 'bot'), 800); }
            else { const opts = edges.filter(e => e.source_id === nextNode.id).map(e => e.label); if (opts.length) this.showOptions(opts); else { this.isDiagnosisMode = false; this.addMessage('Maaf, data diagnosa belum lengkap.', 'bot'); } }
        } catch (e) { console.error('Diagnosis Error:', e); this.showTyping(false); this.addMessage('Gagal memuat sistem pakar.', 'bot'); }
    }

    showOptions(options) {
        const container = document.getElementById('chatbot-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'quick-replies quick-replies-dynamic';
        div.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 10px 40px;';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply';
            btn.textContent = opt;
            btn.addEventListener('click', () => { div.remove(); this.sendMessage(opt); });
            div.appendChild(btn);
        });
        const typing = document.getElementById('typing-indicator');
        container.insertBefore(div, typing);
        this.scrollChatToBottom();
    }

    /* ============ EXTRA EVENT LISTENERS ============ */
    setupExtraListeners() {
        document.getElementById('nav-ai-assistant')?.addEventListener('click', (e) => { e.preventDefault(); this.toggleChatbot(true); });
        document.getElementById('hero-chat-btn')?.addEventListener('click', () => this.toggleChatbot(true));
        document.getElementById('fab-chat-btn')?.addEventListener('click', () => this.toggleChatbot());
        document.getElementById('chatbot-close-btn')?.addEventListener('click', () => this.toggleChatbot(false));
        document.getElementById('diagnosis-reset-btn')?.addEventListener('click', () => this.startDiagnosisFlow(true));
        document.getElementById('start-diagnosis-btn')?.addEventListener('click', () => this.startDiagnosisFlow(true));
        document.getElementById('ticket-modal-overlay')?.addEventListener('click', () => this.closeTicketModal());
        document.getElementById('ticket-modal-close')?.addEventListener('click', () => this.closeTicketModal());
        document.getElementById('ticket-cancel-btn')?.addEventListener('click', () => this.closeTicketModal());
        document.querySelectorAll('#initial-quick-replies .quick-reply[data-quick]').forEach(btn => {
            btn.addEventListener('click', () => { const action = btn.getAttribute('data-quick'); if (action === 'diagnosis') this.startDiagnosisFlow(false); else this.quickSearch(action); });
        });
    }

    /* ============ QUICK ACTIONS ============ */
    setupQuickActions() {
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.getAttribute('data-action');
                if (action) this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'ticket': this.openTicketModal(); break;
            case 'diagnosis': document.getElementById('diagnostic-section')?.scrollIntoView({ behavior: 'smooth' }); this.startDiagnosisFlow(false); break;
            case 'chat': this.toggleChatbot(true); break;
        }
    }

    /* ============ TICKET MODAL ============ */
    setupTicketModal() {
        const form = document.getElementById('ticket-form');
        if (!form) return;
        form.addEventListener('submit', (e) => { e.preventDefault(); this.submitTicket(form); });
        ['ticket-name', 'ticket-email', 'ticket-subject', 'ticket-description'].forEach(id => {
            const field = document.getElementById(id);
            if (field) { field.addEventListener('blur', () => this.validateField(field)); field.addEventListener('input', () => this.clearFieldError(field)); }
        });
    }

    openTicketModal() { const modal = document.getElementById('ticket-modal'); if (!modal) return; modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; setTimeout(() => document.getElementById('ticket-name')?.focus(), 100); }
    closeTicketModal() { const modal = document.getElementById('ticket-modal'); if (!modal) return; modal.classList.add('hidden'); document.body.style.overflow = ''; document.getElementById('ticket-form')?.reset(); document.querySelectorAll('#ticket-form .error').forEach(f => this.clearFieldError(f)); }

    validateField(field) {
        const v = field.value.trim(); let ok = true, msg = ''; this.clearFieldError(field);
        switch (field.id) {
            case 'ticket-name': if (!v) { msg = 'Nama harus diisi'; ok = false; } else if (v.length < 2) { msg = 'Minimal 2 karakter'; ok = false; } break;
            case 'ticket-email': if (!v) { msg = 'Email harus diisi'; ok = false; } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg = 'Format email tidak valid'; ok = false; } break;
            case 'ticket-subject': if (!v) { msg = 'Judul harus diisi'; ok = false; } else if (v.length < 5) { msg = 'Minimal 5 karakter'; ok = false; } break;
            case 'ticket-description': if (!v) { msg = 'Deskripsi harus diisi'; ok = false; } else if (v.length < 10) { msg = 'Minimal 10 karakter'; ok = false; } break;
        }
        if (!ok) this.showFieldError(field, msg);
        return ok;
    }

    showFieldError(field, msg) { field.classList.add('error'); const ex = field.parentNode.querySelector('.field-error'); if (ex) ex.remove(); const d = document.createElement('div'); d.className = 'field-error'; d.textContent = msg; field.parentNode.appendChild(d); }
    clearFieldError(field) { field.classList.remove('error'); const ex = field.parentNode.querySelector('.field-error'); if (ex) ex.remove(); }

    async submitTicket(form) {
        const btn = form.querySelector('button[type="submit"]'); if (!btn) return; const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...'; btn.disabled = true;
        const formData = new FormData(form); const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch('/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (res.ok) { const json = await res.json(); this.showNotification(`Tiket berhasil dikirim! ID: #${json.ticket_id}`, 'success'); form.reset(); this.closeTicketModal(); }
            else throw new Error('Gagal');
        } catch (e) { this.showNotification('Gagal mengirim tiket. Coba lagi.', 'error'); }
        finally { btn.innerHTML = orig; btn.disabled = false; }
    }

    /* ============ ANIMATIONS & BACK TO TOP ============ */
    setupAnimations() {
        const observer = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animate-in'); }); }, { threshold: 0.1 });
        document.querySelectorAll('.category-card, .quick-action-card, .stat-item').forEach(el => observer.observe(el));
    }
    setupBackToTop() { document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); }
    handleBackToTop() { const btn = document.getElementById('backToTop'); if (btn) btn.classList.toggle('visible', window.scrollY > 300); }

    /* ============ NOTIFICATIONS ============ */
    showNotification(msg, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) { container = document.createElement('div'); container.id = 'notification-container'; container.className = 'notification-container'; document.body.appendChild(container); }
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const notif = document.createElement('div'); notif.className = `notification ${type}`;
        notif.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> <span>${msg}</span>`;
        container.appendChild(notif); setTimeout(() => notif.remove(), 4000);
    }

    /* ============ CONTENT LOADER ============ */
    async loadContent() {
        try {
            const [solRes, faqRes] = await Promise.all([fetch('/solutions'), fetch('/faqs')]);
            if (solRes.ok) this.solutions = ((await solRes.json()).data) || [];
            if (faqRes.ok) this.faqs = ((await faqRes.json()).data) || [];
            this.updateCategoryStats();
        } catch (e) { console.error('Load content error:', e); }
    }

    updateCategoryStats() {
        document.querySelectorAll('.category-card').forEach(card => {
            const cat = card.getAttribute('data-category');
            if (cat) { const count = (this.solutions || []).filter(s => s.category === cat).length; const stat = card.querySelector('.category-stats span'); if (stat) stat.innerHTML = `<i class="fas fa-lightbulb"></i> ${count} Solusi`; }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.itSupportApp = new ITSupportApp(); });
