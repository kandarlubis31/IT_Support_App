// Optimized JavaScript for IT Support App
class ITSupportApp {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.isLoading = true;
        this.searchSuggestions = [
            'laptop lemot', 'wifi tidak konek', 'blue screen', 'printer error',
            'virus komputer', 'password lupa', 'driver bermasalah', 'sistem hang',
            'internet lambat', 'file corrupt', 'aplikasi crash', 'update windows'
        ];
        this.solutions = [];
        this.faqs = [];
        this.init();
    }

    init() {
        this.setupLoading();
        this.setupTheme();
        this.setupNavigation();
        this.setupSearch();
        this.setupChatbot();
        this.setupQuickActions();
        this.setupAnimations();
        this.setupStats();
        this.setupBackToTop();
        this.loadContent();
        this.setupTicketModal();
    }

    setupLoading() {
        // Show loading screen initially, then hide after content loads
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            // Ensure loading screen is visible initially
            loadingScreen.classList.remove('hidden');
            
            // Hide loading screen after a brief delay to show loading effect
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                document.body.classList.add('loaded');
                this.isLoading = false;
            }, 1500); // 1.5 seconds loading time
        } else {
            // Fallback if loading screen not found
            document.body.classList.add('loaded');
            this.isLoading = false;
        }
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showNotification(`Tema ${this.currentTheme === 'dark' ? 'gelap' : 'terang'} diaktifkan`, 'info');
    }

    setupNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Active navigation highlighting
        window.addEventListener('scroll', () => {
            this.updateActiveNavigation();
            this.handleBackToTop();
        });
    }

    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const searchSuggestions = document.getElementById('searchSuggestions');
        const searchTags = document.querySelectorAll('.search-tag');

        if (searchInput) {
            // Search suggestions
            searchInput.addEventListener('input', (e) => {
                this.showSearchSuggestions(e.target.value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target)) {
                    this.hideSearchSuggestions();
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        // Search tags
        searchTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const searchTerm = tag.dataset.search;
                if (searchInput) {
                    searchInput.value = searchTerm;
                }
                this.performSearch(searchTerm);
            });
        });

        // Category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                if (category) {
                    this.displayCategoryContent(category);
                }
            });
        });
    }

    showSearchSuggestions(query) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer || !query.trim()) {
            this.hideSearchSuggestions();
            return;
        }

        const filtered = this.searchSuggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filtered.length > 0) {
            suggestionsContainer.innerHTML = filtered.map(suggestion =>
                `<div class="suggestion-item" data-suggestion="${suggestion}">${suggestion}</div>`
            ).join('');
            
            suggestionsContainer.style.display = 'block';

            // Add click handlers to suggestions
            suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.value = item.dataset.suggestion;
                    }
                    this.performSearch(item.dataset.suggestion);
                    this.hideSearchSuggestions();
                });
            });
        } else {
            this.hideSearchSuggestions();
        }
    }

    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    async performSearch(query) {
        if (!query.trim()) {
            this.showNotification('Masukkan kata kunci pencarian', 'warning');
            return;
        }

        // Simple search implementation - you can enhance this
        this.showNotification(`Mencari: ${query}`, 'info');
        
        // For now, just show a simple alert - replace with actual search logic
        setTimeout(() => {
            this.showNotification(`Hasil pencarian untuk "${query}" akan ditampilkan di sini`, 'success');
        }, 1000);
    }

    async displayCategoryContent(category) {
        const main = document.querySelector('main');
        if (!main) return;

        // Create results section
        const resultsSection = document.createElement('section');
        resultsSection.id = 'category-results-section';
        resultsSection.innerHTML = `
            <div class="section-header">
                <h2>Solusi untuk Kategori: ${category.replace(/[_-]/g, ' ').toUpperCase()}</h2>
                <button class="close-results" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i> Tutup
                </button>
            </div>
            <div id="category-results">
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <p>Memuat solusi...</p>
                </div>
            </div>
        `;

        // Insert after search section
        const searchSection = document.getElementById('search-section');
        if (searchSection && searchSection.nextSibling) {
            main.insertBefore(resultsSection, searchSection.nextSibling);
        } else {
            main.appendChild(resultsSection);
        }

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Simulate loading and show mock results
        setTimeout(() => {
            this.showMockCategoryResults(category);
        }, 1000);
    }

    showMockCategoryResults(category) {
        const resultsContainer = document.getElementById('category-results');
        if (!resultsContainer) return;

        // Mock data based on category
        const mockData = {
            network: [
                {
                    title: 'Mengatasi WiFi yang Tidak Bisa Konek',
                    description: 'Langkah-langkah untuk memperbaiki masalah koneksi WiFi',
                    steps: ['Restart router', 'Periksa password WiFi', 'Update driver network', 'Reset network settings']
                },
                {
                    title: 'Internet Lambat - Solusi Cepat',
                    description: 'Cara mengatasi koneksi internet yang lambat',
                    steps: ['Tes kecepatan internet', 'Tutup aplikasi yang tidak perlu', 'Ganti DNS', 'Hubungi provider']
                }
            ],
            performance: [
                {
                    title: 'Mengatasi Laptop Lemot',
                    description: 'Optimasi performa laptop yang berjalan lambat',
                    steps: ['Bersihkan file temporary', 'Nonaktifkan startup programs', 'Scan virus', 'Defrag hard disk']
                }
            ],
            os: [
                {
                    title: 'Mengatasi Blue Screen (BSOD)',
                    description: 'Solusi untuk Blue Screen of Death',
                    steps: ['Catat kode error', 'Boot ke Safe Mode', 'Update driver', 'Scan system files']
                }
            ]
        };

        const categoryData = mockData[category] || [];

        resultsContainer.innerHTML = '';

        if (categoryData.length === 0) {
            resultsContainer.innerHTML = '<p>Belum ada solusi untuk kategori ini. Silakan hubungi support untuk bantuan lebih lanjut.</p>';
            return;
        }

        categoryData.forEach(item => {
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                ${item.steps ? `
                    <ol>
                        ${item.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                ` : ''}
            `;
            resultsContainer.appendChild(resultCard);
        });
    }

    setupChatbot() {
        const openChatbot = document.getElementById('openChatbotButton');
        const closeChatbot = document.getElementById('closeChatbotButton');
        const minimizeChatbot = document.getElementById('minimizeChatbot');
        const chatbotInput = document.getElementById('chatbotInput');
        const sendButton = document.getElementById('sendChatbotButton');
        const quickReplies = document.querySelectorAll('.quick-reply');

        if (openChatbot) {
            openChatbot.addEventListener('click', () => {
                this.openChatbot();
            });
        }

        if (closeChatbot) {
            closeChatbot.addEventListener('click', () => {
                this.closeChatbot();
            });
        }

        if (minimizeChatbot) {
            minimizeChatbot.addEventListener('click', () => {
                this.minimizeChatbot();
            });
        }

        if (chatbotInput && sendButton) {
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });

            sendButton.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }

        // Quick replies
        quickReplies.forEach(reply => {
            reply.addEventListener('click', () => {
                const message = reply.dataset.message;
                if (chatbotInput) {
                    chatbotInput.value = message;
                }
                this.sendChatMessage();
            });
        });

        // Initialize message time
        this.updateMessageTime();
    }

    openChatbot() {
        const chatbotPopup = document.getElementById('chatbot-popup');
        if (chatbotPopup) {
            chatbotPopup.classList.remove('hidden', 'minimized');
            const chatbotInput = document.getElementById('chatbotInput');
            if (chatbotInput) {
                chatbotInput.focus();
            }
        }
    }

    closeChatbot() {
        const chatbotPopup = document.getElementById('chatbot-popup');
        if (chatbotPopup) {
            chatbotPopup.classList.add('hidden');
        }
    }

    minimizeChatbot() {
        const chatbotPopup = document.getElementById('chatbot-popup');
        if (chatbotPopup) {
            chatbotPopup.classList.toggle('minimized');
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chatbotInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addChatMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add bot response
            this.addChatMessage(data.response, 'bot');

        } catch (error) {
            console.error('Chat error:', error);
            this.removeTypingIndicator();
            this.addChatMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'bot');
        }
    }

    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const currentTime = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                    <span class="message-time">${currentTime}</span>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${message}</p>
                    <span class="message-time">${currentTime}</span>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updateMessageTime() {
        const messageTime = document.querySelector('.bot-message .message-time');
        if (messageTime) {
            const currentTime = new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            messageTime.textContent = currentTime;
        }
    }

    setupQuickActions() {
        const quickActionCards = document.querySelectorAll('.quick-action-card');
        quickActionCards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // FAB menu
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');
        const fabItems = document.querySelectorAll('.fab-item');

        if (fabMain && fabMenu) {
            fabMain.addEventListener('click', () => {
                fabMenu.classList.toggle('active');
            });
        }

        fabItems.forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'create-ticket':
            case 'ticket':
                this.openTicketModal();
                break;
            case 'system-check':
                this.showNotification('Memulai diagnosa sistem...', 'info');
                break;
            case 'remote-help':
                this.showNotification('Fitur bantuan remote akan segera tersedia', 'info');
                break;
            case 'knowledge-base':
                // Scroll to categories section
                const categoriesSection = document.getElementById('categories-section');
                if (categoriesSection) {
                    categoriesSection.scrollIntoView({ behavior: 'smooth' });
                    this.showNotification('Jelajahi kategori solusi di bawah ini', 'info');
                } else {
                    this.showNotification('Membuka knowledge base...', 'info');
                }
                break;
            case 'chat':
                this.openChatbot();
                break;
            case 'call':
                this.showNotification('Hubungi: +62 123 456 7890', 'info');
                break;
            default:
                this.showNotification('Fitur ini akan segera tersedia', 'info');
        }
    }

    setupAnimations() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.category-card, .quick-action-card, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }

    setupStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const animateStats = () => {
            statNumbers.forEach(stat => {
                const target = parseInt(stat.dataset.target);
                const current = parseInt(stat.textContent);
                const increment = target / 100;
                
                if (current < target) {
                    stat.textContent = Math.ceil(current + increment);
                    setTimeout(animateStats, 20);
                }
            });
        };

        // Start animation when stats section is visible
        const statsSection = document.getElementById('stats-section');
        if (statsSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateStats();
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(statsSection);
        }
    }

    setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    handleBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <i class="${iconMap[type] || iconMap.info}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    async loadContent() {
        try {
            // Load solutions with better error handling
            const solutionsResponse = await fetch('/solutions');
            if (solutionsResponse.ok) {
                const solutionsData = await solutionsResponse.json();
                // Handle new API response format
                const solutions = solutionsData.data || solutionsData;
                if (Array.isArray(solutions)) {
                    this.solutions = solutions;
                    this.updateCategoryStats();
                } else {
                    console.warn('Solutions data is not an array:', solutionsData);
                    this.showNotification('Gagal memuat data solusi', 'error');
                }
            } else {
                const errorData = await solutionsResponse.json();
                console.error('Error loading solutions:', errorData);
                this.showNotification(errorData.message || 'Gagal memuat data solusi', 'error');
            }

            // Load FAQs with better error handling
            const faqsResponse = await fetch('/faqs');
            if (faqsResponse.ok) {
                const faqsData = await faqsResponse.json();
                // Handle new API response format
                const faqs = faqsData.data || faqsData;
                if (Array.isArray(faqs)) {
                    this.faqs = faqs;
                } else {
                    console.warn('FAQs data is not an array:', faqsData);
                    this.showNotification('Gagal memuat data FAQ', 'error');
                }
            } else {
                const errorData = await faqsResponse.json();
                console.error('Error loading FAQs:', errorData);
                this.showNotification(errorData.message || 'Gagal memuat data FAQ', 'error');
            }

            // Show success notification if data loaded
            if (this.solutions && this.solutions.length > 0) {
                this.showNotification(`${this.solutions.length} solusi berhasil dimuat`, 'success');
            }
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.showNotification('Terjadi kesalahan saat memuat data', 'error');
        }
    }

    updateCategoryStats() {
        // Initialize solutions and faqs arrays if not already done
        this.solutions = this.solutions || [];
        this.faqs = this.faqs || [];
        
        // Update category counts in the UI
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            const category = card.dataset.category;
            if (category) {
                const solutionCount = this.solutions.filter(s => s.category === category).length;
                const statElement = card.querySelector('.category-stats span');
                if (statElement) {
                    statElement.innerHTML = `<i class="fas fa-lightbulb"></i> ${solutionCount} Solusi`;
                }
            }
        });
    }

    setupTicketModal() {
        const ticketForm = document.getElementById('ticket-form');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitTicket();
            });
        }

        // Setup form validation
        const requiredFields = ['ticket-name', 'ticket-email', 'ticket-subject', 'ticket-description'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });
    }

    openTicketModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            const firstInput = document.getElementById('ticket-name');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeTicketModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Reset form
            const form = document.getElementById('ticket-form');
            if (form) {
                form.reset();
                this.clearAllFieldErrors();
            }
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error
        this.clearFieldError(field);

        switch (field.id) {
            case 'ticket-name':
                if (!value) {
                    errorMessage = 'Nama lengkap harus diisi';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Nama minimal 2 karakter';
                    isValid = false;
                }
                break;

            case 'ticket-email':
                if (!value) {
                    errorMessage = 'Email harus diisi';
                    isValid = false;
                } else if (!this.isValidEmail(value)) {
                    errorMessage = 'Format email tidak valid';
                    isValid = false;
                }
                break;

            case 'ticket-subject':
                if (!value) {
                    errorMessage = 'Judul masalah harus diisi';
                    isValid = false;
                } else if (value.length < 5) {
                    errorMessage = 'Judul minimal 5 karakter';
                    isValid = false;
                } else if (value.length > 250) {
                    errorMessage = 'Judul maksimal 250 karakter';
                    isValid = false;
                }
                break;

            case 'ticket-description':
                if (!value) {
                    errorMessage = 'Deskripsi harus diisi';
                    isValid = false;
                } else if (value.length < 10) {
                    errorMessage = 'Deskripsi minimal 10 karakter';
                    isValid = false;
                } else if (value.length > 2000) {
                    errorMessage = 'Deskripsi maksimal 2000 karakter';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    clearAllFieldErrors() {
        const errorFields = document.querySelectorAll('#ticket-form .error');
        errorFields.forEach(field => this.clearFieldError(field));
    }

    async submitTicket() {
        const form = document.getElementById('ticket-form');
        const submitBtn = document.getElementById('submit-ticket-btn');
        
        if (!form || !submitBtn) return;

        // Validate all fields
        const requiredFields = ['ticket-name', 'ticket-email', 'ticket-subject', 'ticket-description'];
        let isFormValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showNotification('Mohon perbaiki kesalahan pada form', 'error');
            return;
        }

        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        try {
            const formData = new FormData(form);
            const ticketData = {
                user_name: formData.get('user_name'),
                user_email: formData.get('user_email'),
                category: formData.get('category'),
                priority: formData.get('priority'),
                subject: formData.get('subject'),
                description: formData.get('description')
            };

            const response = await fetch('/api/tickets/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification(result.message, 'success');
                this.closeTicketModal();
                
                // Show additional success info
                setTimeout(() => {
                    this.showNotification(`Nomor tiket Anda: #${result.ticket_id}`, 'info');
                }, 2000);
            } else {
                throw new Error(result.error || 'Gagal mengirim tiket');
            }

        } catch (error) {
            console.error('Error submitting ticket:', error);
            this.showNotification(error.message || 'Terjadi kesalahan saat mengirim tiket', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Tiket';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.itSupportApp = new ITSupportApp();
});

// Global functions for modal controls
function closeTicketModal() {
    if (window.itSupportApp) {
        window.itSupportApp.closeTicketModal();
    }
}

// Legacy support for existing functionality
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const openChatbotButton = document.getElementById("openChatbotButton");
    const chatbotPopup = document.getElementById("chatbot-popup");
    const closeChatbotButton = document.getElementById("closeChatbotButton");
    const chatbotMessages = document.getElementById("chatbot-messages");
    const chatbotInput = document.getElementById("chatbotInput");
    const sendChatbotButton = document.getElementById("sendChatbotButton");

    // Legacy search functionality
    if (searchButton && !window.itSupportApp) {
        searchButton.addEventListener("click", () => {
            const query = searchInput?.value.trim();
            if (query) {
                alert(`Mencari: ${query}`);
            }
        });
    }

    // Legacy chatbot functionality
    if (sendChatbotButton && !window.itSupportApp) {
        sendChatbotButton.addEventListener("click", () => {
            sendMessage();
        });
    }

    if (chatbotInput && !window.itSupportApp) {
        chatbotInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendMessage();
            }
        });
    }

    function sendMessage() {
        if (!chatbotInput || !chatbotMessages) return;
        
        const messageText = chatbotInput.value.trim();
        if (messageText) {
            const userMessageDiv = document.createElement("div");
            userMessageDiv.classList.add("message", "user-message");
            userMessageDiv.textContent = messageText;
            chatbotMessages.appendChild(userMessageDiv);
            chatbotInput.value = "";
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            // Add loading indicator
            const loadingDiv = document.createElement("div");
            loadingDiv.classList.add("message", "bot-message", "loading-indicator");
            loadingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
            loadingDiv.id = "loading-indicator";
            chatbotMessages.appendChild(loadingDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            // Send message to backend
            fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: messageText }),
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // Remove loading indicator
                const existingLoading = document.getElementById("loading-indicator");
                if (existingLoading) {
                    existingLoading.remove();
                }

                const botMessageDiv = document.createElement("div");
                botMessageDiv.classList.add("message", "bot-message");
                botMessageDiv.innerHTML = data.response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                chatbotMessages.appendChild(botMessageDiv);
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            })
            .catch((error) => {
                console.error("Error:", error);
                const existingLoading = document.getElementById("loading-indicator");
                if (existingLoading) {
                    existingLoading.remove();
                }
                const errorMessageDiv = document.createElement("div");
                errorMessageDiv.classList.add("message", "bot-message");
                errorMessageDiv.textContent = `Maaf, terjadi kesalahan: ${error.message}`;
                chatbotMessages.appendChild(errorMessageDiv);
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            });
        }
    }
});