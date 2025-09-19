// faq.js - FAQ Manager
const FAQManager = {
    faqs: [
        {
            question: "How do I get started with this app?",
            answer: "Simply create a user profile by entering a username. The app will guide you through the rest. All your data is stored locally on your device and can be synced when you're online."
        },
        {
            question: "Is this app free to use?",
            answer: "Yes! This app is completely free to use. There are no hidden charges, subscriptions, or premium features. We believe in providing powerful productivity tools accessible to everyone."
        },
        {
            question: "Does the app work offline?",
            answer: "Absolutely! This is a Progressive Web App (PWA) that works completely offline after your first visit. You can use all features without an internet connection, and your data will sync when you go back online."
        },
        {
            question: "How is my data protected?",
            answer: "Your data is stored locally on your device first. We only collect anonymous usage statistics to improve the app. When you sync data, it's transmitted securely. You can export or delete all your data at any time from the settings."
        },
        {
            question: "Can I install this app on my phone?",
            answer: "Yes! Use your browser's 'Add to Home Screen' or 'Install App' option to install it like a native app. It will work offline and give you a native app experience."
        },
        {
            question: "How do I backup my data?",
            answer: "Go to Settings > Data Management and click 'Export My Data' to download a backup file. You can also enable sync to backup your data to our secure servers."
        },
        {
            question: "Can I use this app on multiple devices?",
            answer: "Yes! Create the same username on different devices and your data will sync when you're online. Each device gets its own install ID but can share the same user profile."
        },
        {
            question: "What happens if I clear my browser data?",
            answer: "Your app data will be lost if you clear browser data. Make sure to export your data regularly or enable sync to prevent data loss."
        },
        {
            question: "How do I update the app?",
            answer: "The app updates automatically when you're online. If you notice issues, try refreshing the page or clearing the browser cache for this site."
        },
        {
            question: "Can I change my username?",
            answer: "Usernames cannot be changed once created to maintain data consistency. However, you can reset all app data and create a new profile with a different username."
        },
        {
            question: "Who can I contact for support?",
            answer: "For support, feature requests, or bug reports, email us at connect@sparkyminis.com. We typically respond within 24-48 hours."
        },
        {
            question: "What browsers are supported?",
            answer: "The app works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use the latest version of your preferred browser."
        }
    ],
    
    init: function() {
        this.renderFAQs();
        this.bindEvents();
    },
    
    renderFAQs: function() {
        const faqContainer = document.getElementById('faq-container');
        if (!faqContainer) return;
        
        faqContainer.innerHTML = '';
        
        this.faqs.forEach((faq, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.innerHTML = `
                <div class="faq-question" data-faq-index="${index}">
                    <span>${faq.question}</span>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    ${faq.answer}
                </div>
            `;
            faqContainer.appendChild(faqItem);
        });
        
        // Add CSS for the toggle icon
        const style = document.createElement('style');
        style.textContent = `
            .faq-question {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .faq-toggle {
                font-size: 1.2rem;
                font-weight: bold;
                color: var(--primary-color);
                transition: transform 0.2s ease;
            }
            
            .faq-item.open .faq-toggle {
                transform: rotate(45deg);
            }
            
            .faq-answer {
                line-height: 1.6;
                border-top: 1px solid #f3f4f6;
            }
            
            .faq-item.open .faq-answer {
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .faq-question:focus {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    },
    
    bindEvents: function() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.faq-question')) {
                this.toggleFAQ(e.target.closest('.faq-question'));
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.faq-question') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.toggleFAQ(e.target.closest('.faq-question'));
            }
        });
    },
    
    toggleFAQ: function(questionElement) {
        const faqItem = questionElement.closest('.faq-item');
        const isOpen = faqItem.classList.contains('open');
        
        // Close all other FAQs (accordion behavior)
        document.querySelectorAll('.faq-item.open').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('open');
            }
        });
        
        // Toggle current FAQ
        faqItem.classList.toggle('open', !isOpen);
        
        // Update ARIA attributes for accessibility
        questionElement.setAttribute('aria-expanded', !isOpen);
        
        // Make questions focusable for keyboard navigation
        if (!questionElement.hasAttribute('tabindex')) {
            questionElement.setAttribute('tabindex', '0');
        }
    },
    
    // Method to add custom FAQs for specific apps
    addCustomFAQs: function(customFaqs) {
        if (Array.isArray(customFaqs)) {
            this.faqs = [...this.faqs, ...customFaqs];
            this.renderFAQs();
        }
    },
    
    // Method to replace default FAQs with app-specific ones
    setCustomFAQs: function(customFaqs) {
        if (Array.isArray(customFaqs)) {
            this.faqs = customFaqs;
            this.renderFAQs();
        }
    },
    
    // Search functionality
    searchFAQs: function(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        if (!normalizedSearch) {
            this.renderFAQs();
            return;
        }
        
        const filteredFAQs = this.faqs.filter(faq => 
            faq.question.toLowerCase().includes(normalizedSearch) ||
            faq.answer.toLowerCase().includes(normalizedSearch)
        );
        
        this.renderFilteredFAQs(filteredFAQs, searchTerm);
    },
    
    renderFilteredFAQs: function(faqs, searchTerm) {
        const faqContainer = document.getElementById('faq-container');
        if (!faqContainer) return;
        
        faqContainer.innerHTML = '';
        
        if (faqs.length === 0) {
            faqContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <p>No FAQs found matching "${searchTerm}"</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Try a different search term or <a href="#" onclick="FAQManager.clearSearch()" style="color: var(--primary-color);">clear the search</a></p>
                </div>
            `;
            return;
        }
        
        // START of the lines you should add here
        const resultHeader = document.createElement('div');
        resultHeader.style.cssText = 'margin-bottom: 1rem; padding: 0.75rem; background: #f0f9ff; border-radius: 6px; font-size: 0.875rem;';
        resultHeader.innerHTML = `
            <span style="color: var(--primary-color); font-weight: 500;">Search Results:</span> 
            Found ${faqs.length} FAQ${faqs.length !== 1 ? 's' : ''} matching "${searchTerm}"
            <button onclick="FAQManager.clearSearch()" style="float: right; background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 0.75rem;">Clear Search</button>
        `;
        faqContainer.parentNode.insertBefore(resultHeader, faqContainer);
        // END of the lines you should add here
        
        faqs.forEach((faq, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            
            // Highlight search term in question and answer
            const highlightedQuestion = this.highlightSearchTerm(faq.question, searchTerm);
            const highlightedAnswer = this.highlightSearchTerm(faq.answer, searchTerm);
            
            faqItem.innerHTML = `
                <div class="faq-question" data-faq-index="${index}">
                    <span>${highlightedQuestion}</span>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    ${highlightedAnswer}
                </div>
            `;
            faqContainer.appendChild(faqItem);
        });
    },
    
    highlightSearchTerm: function(text, searchTerm) {
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        return text.replace(regex, '<mark style="background: #fef3c7; padding: 0.1rem 0.2rem; border-radius: 2px;">$1</mark>');
    },
    
    clearSearch: function() {
        // Remove search result header if it exists
        const searchHeader = document.querySelector('[onclick="FAQManager.clearSearch()"]');
        if (searchHeader && searchHeader.parentNode) {
            searchHeader.parentNode.remove();
        }
        
        // Re-render all FAQs
        this.renderFAQs();
        
        // Clear search input if it exists
        const searchInput = document.getElementById('faq-search');
        if (searchInput) {
            searchInput.value = '';
        }
    },
    
    // Method to add a search box to the FAQ section
    addSearchBox: function() {
        const faqSection = document.querySelector('.faq-section');
        if (!faqSection) return;
        
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = 'margin-bottom: 1.5rem;';
        searchContainer.innerHTML = `
            <div class="form-group">
                <label for="faq-search">Search FAQs</label>
                <input type="text" id="faq-search" placeholder="Type to search questions and answers..." style="margin-bottom: 0;">
            </div>
        `;
        
        const faqContainer = document.getElementById('faq-container');
        faqSection.insertBefore(searchContainer, faqContainer);
        
        // Add search functionality
        const searchInput = document.getElementById('faq-search');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchFAQs(e.target.value);
            }, 300);
        });
        
        // Add keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
                searchInput.blur();
            }
        });
    },
    
    // Utility method to get FAQ data for export
    exportFAQs: function() {
        return {
            faqs: this.faqs,
            exportDate: new Date().toISOString(),
            totalCount: this.faqs.length
        };
    }
};