const AppManager = {
    isInitialized: false,
    activeTrip: null,
    conversionRates: {},
    lastRatesFetchDate: null,
    currentLocation: null,
    summaryMode: 'local', // 'local' or 'base'
    syncAttemptOrigin: null,
    currentTripView: 'dashboard', // 'dashboard' or 'expense'
    checklistLinksData: {},
    // New properties for trip creation form
    tripCreationStep: 1,
    maxTripCreationSteps: 2, // Step 1: Basic info, Step 2: Questions
    currentTripData: null,
    questionsData: null,
    currentQuestionPage: 0,
    questionsPerPage: 3,
    userResponses: {},
    
    init: function() {
        // Only initialize if user is logged in
        if (typeof ProfileManager !== 'undefined' && ProfileManager.isUserLoggedIn()) {
            this.loadAppData();
            this.renderApp();
            this.bindEvents();
            this.setupNetworkStatus();
            this.isInitialized = true;
            
            // Apply user settings
            this.applyUserSettings();
        } else {
            // Hide app area if no user is logged in
            const appArea = document.getElementById('app-area');
            if (appArea) appArea.classList.add('hidden');
        }
        
        // Listen for user login events
        this.setupUserLoginListener();
    },
    
    loadAppData: function() {
        try {
            // Load active trip
            const savedActiveTrip = localStorage.getItem(this.getStorageKey('activeTrip'));
            if (savedActiveTrip) {
                this.activeTrip = JSON.parse(savedActiveTrip);
                this.loadConversionRates();
            }
        } catch (error) {
            console.error('Failed to load app data:', error);
        }
    },
    
    loadConversionRates: function() {
        if (!this.activeTrip) return;
        
        try {
            const allRates = JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates'))) || {};
            this.conversionRates = allRates[this.activeTrip.id] || {};
            this.lastRatesFetchDate = allRates[this.activeTrip.id]?.lastFetchDate || null;
        } catch (e) {
            this.conversionRates = {};
            this.lastRatesFetchDate = null;
        }
    },
    
    renderApp: function() {
        const appArea = document.getElementById('app-area');
        if (!appArea) return;
        
        // Show app area
        appArea.classList.remove('hidden');
        
        if (this.activeTrip) {
            // Logic to show dashboard or expense view
            if (this.currentTripView === 'expense') {
                this.renderExpenseView();
            } else {
                this.renderTripDashboardView();
            }
        } else {
            this.renderTripSelectionView();
        }
    },
    
    renderTripSelectionView: function() {
    const appArea = document.getElementById('app-area');
    const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
    const userName = user ? user.displayName : 'User';
    
    appArea.innerHTML = `
        <div class="card">
            <h1><span style="color: var(--primary-color);">Hi ${userName}!</span> Your Trips</h1>
            <p class="currency-name" style="margin-bottom: 1.5rem;">Manage your travel adventures and track expenses across multiple trips.</p>
            
            <button id="add-trip-btn" class="btn btn-primary btn-full">+ Add New Trip</button>
            
            <div id="trip-creation-container" class="hidden">
                ${this.renderTripCreationForm()}
            </div>
            
            <div id="trip-list" style="margin-top: 2rem;">
                ${this.renderTripList()}
            </div>
             ${this.renderAdsenseBlock()}
        </div>
    `;
    
    // Initialize multi-select widgets in the basic form (if present)
    this.initTripBasicFormWidgets();
            // Initialize any ads that were just rendered
        this.initializeAds();
},

renderTripCreationForm: function() {
    if (this.tripCreationStep === 1) {
        return this.renderTripBasicInfoForm();
    } else if (this.tripCreationStep === 2) {
        const filteredQuestions = this.getFilteredQuestions();
        const totalQuestions = filteredQuestions.length;
        const startIdx = this.currentQuestionPage * this.questionsPerPage;
        const endIdx = Math.min(startIdx + this.questionsPerPage, totalQuestions);
        const isLastPage = endIdx >= totalQuestions;

        return this.renderTripQuestionsForm().replace(
            '<button type="submit" class="btn btn-primary">',
            `<button type="submit" class="btn btn-primary">${isLastPage ? 'Complete Trip Setup' : 'Save and Next'}`
        );
    }
},

renderTripBasicInfoForm: function() {
    // --- extract master lists from loaded questions dataset ---
    const q = Array.isArray(this.questionsData) ? this.questionsData : [];
    const currencyQ = q.find(x =>
        x && (x.id === 'tripCurrencies' || x.id === 'currencyList' || x.id === 'currencies_master' || x.id === 'currency_master')
    );
    const countryIdCandidates = [
        'tripDestinations', 'countryList', 'countries_master', 'country_master',
        'countries', 'destinations', 'countryList_master', 'tripDestinations_master',
        'tripCountries', 'countriesList'
    ];
    const countryQ = q.find(x => x && countryIdCandidates.includes(x.id));
    const normalizeOption = (opt) => {
        if (!opt) return null;
        if (typeof opt === 'string') return { value: opt, label: opt };
        if (opt.id && opt.name) return { value: opt.id, label: `${opt.id} - ${opt.name}` };
        if (opt.code && opt.name) return { value: opt.code, label: `${opt.code} - ${opt.name}` };
        if (opt.value && opt.label) return { value: opt.value, label: opt.label };
        const asText = typeof opt === 'object' ? (opt.name || opt.text || JSON.stringify(opt)) : String(opt);
        const asVal = opt.id || opt.code || opt.value || asText;
        return { value: asVal, label: `${asVal} - ${asText}` };
    };
    const currencyOptions = Array.isArray(currencyQ?.options)
        ? currencyQ.options.map(normalizeOption).filter(Boolean)
        : [];
    const countryOptions = Array.isArray(countryQ?.options)
        ? countryQ.options.map(normalizeOption).filter(Boolean)
        : [];
    this._pendingTripCurrencyOptions = currencyOptions;
    this._pendingTripCountryOptions = countryOptions;

    // --- render form HTML with consistent labels ---
    return `
        <div class="trip-creation-form">
            <div class="form-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(this.tripCreationStep / this.maxTripCreationSteps) * 100}%"></div>
                </div>
                <p class="text-center text-sm mt-2">Step ${this.tripCreationStep} of ${this.maxTripCreationSteps}: Basic Trip Information</p>
            </div>
            <form id="add-trip-form-step1">
                <div class="form-group">
                    <label for="new-trip-name">Trip Name</label>
                    <input type="text" id="new-trip-name" placeholder="e.g., Tokyo Adventure 2025" required value="${this.currentTripData?.name || ''}">
                    <small class="currency-name">Enter a unique name for your trip.</small>
                </div>
                <div class="form-group">
                    <label for="new-trip-currencies">Trip Currencies</label>
                    <div id="new-trip-currencies" class="multi-select"></div>
                    <small class="currency-name">Select all currencies you'll use on this trip.</small>
                </div>
                <div class="form-group">
                    <label for="new-trip-base-currency">Base Currency</label>
                    <select id="new-trip-base-currency" required>
                        <option value="" disabled selected>Choose a base currency</option>
                        ${currencyOptions.map(opt => `
                            <option value="${opt.value}" ${this.currentTripData?.baseCurrency === opt.value ? 'selected' : ''}>
                                ${opt.label}
                            </option>
                        `).join('')}
                    </select>
                    <small class="currency-name">Select one currency for exchange rates and reports.</small>
                </div>
                <div class="form-group">
                    <label for="new-trip-countries">Trip Countries</label>
                    <div id="new-trip-countries" class="multi-select"></div>
                    <small class="currency-name">Select all countries you'll visit.</small>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label for="new-trip-start">Start Date</label>
                        <input type="date" id="new-trip-start" required value="${this.currentTripData?.start || ''}">
                        <small class="currency-name">Choose when your trip begins.</small>
                    </div>
                    <div class="form-group">
                        <label for="new-trip-end">End Date</label>
                        <input type="date" id="new-trip-end" required value="${this.currentTripData?.end || ''}">
                        <small class="currency-name">Choose when your trip ends.</small>
                    </div>
                </div>
                <div id="trip-date-message" class="text-red text-sm mb-2 hidden"></div>
                <div class="form-actions">
                    <button type="button" id="cancel-trip-btn" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Next</button>
                </div>
            </form>
        </div>
    `;
},

getFilteredQuestions: function() {
    if (!this.questionsData || !Array.isArray(this.questionsData)) return [];
    
    const excludeIds = [
        'tripCurrencies', 'currencyList', 'currencies_master', 'currency_master',
        'tripDestinations', 'countryList', 'countries_master', 'country_master',
        'countries', 'destinations', 'countryList_master', 'tripDestinations_master',
        'tripCountries', 'countriesList'
    ];
    
    return this.questionsData.filter(q => q && !excludeIds.includes(q.id));
},

renderTripQuestionsForm: function() {
    if (!this.questionsData || !Array.isArray(this.questionsData)) {
        return `
            <div class="trip-creation-form">
                <div class="form-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.tripCreationStep / this.maxTripCreationSteps) * 100}%"></div>
                    </div>
                    <p class="text-center text-sm mt-2">Step ${this.tripCreationStep} of ${this.maxTripCreationSteps}: Loading Questions...</p>
                </div>
                
                <div class="text-center">
                    <p>Loading questions data...</p>
                    <div class="loader"></div>
                </div>
            </div>
        `;
    }

    const filteredQuestions = this.getFilteredQuestions();
    const totalQuestions = filteredQuestions.length;

    // If no questions after filtering, auto-complete the setup
    if (totalQuestions === 0) {
        this.completeTripCreation();
        return '';  // Return empty string to avoid rendering unnecessary HTML
    }

    const startIdx = this.currentQuestionPage * this.questionsPerPage;
    const endIdx = Math.min(startIdx + this.questionsPerPage, totalQuestions);
    const currentQuestions = filteredQuestions.slice(startIdx, endIdx);
    const isLastPage = endIdx >= totalQuestions;

    return `
        <div class="trip-creation-form">
            <div class="form-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((this.currentQuestionPage + 1) / Math.ceil(totalQuestions / this.questionsPerPage)) * 50 + 50}%"></div>
                </div>
                <p class="text-center text-sm mt-2">Step ${this.tripCreationStep} of ${this.maxTripCreationSteps}: Questions ${startIdx + 1}-${endIdx} of ${totalQuestions}</p>
            </div>

            <form id="questions-form">
                <div class="questions-container">
                    ${currentQuestions.map((question, index) => this.renderQuestionItem(question, startIdx + index)).join('')}
                </div>

                <div class="form-actions">
                    <button type="button" id="prev-questions-btn" class="btn btn-secondary" ${this.currentQuestionPage === 0 ? 'disabled' : ''}>Previous</button>
                    <button type="submit" class="btn btn-primary">
                        ${isLastPage ? 'Complete Trip Setup' : 'Save and Next'}
                    </button>
                </div>
            </form>
        </div>
    `;
},

renderQuestionItem: function(question, questionIndex) {
    const questionId = question.id || `q_${questionIndex}`;
    const type = question.type || 'single';
    const currentResponse = this.userResponses[questionId] || (type === 'multi' ? [] : '');

    return `
      <div class="question-item" data-question-id="${questionId}" data-type="${type}">
        <h3 class="question-title">${question.text}</h3>
        <div class="question-options">
          ${question.options.map(option => `
            <button type="button"
              class="quick-select-btn question-option ${(Array.isArray(currentResponse) ? currentResponse.includes(option) : currentResponse === option) ? 'active' : ''}"
              data-question-id="${questionId}"
              data-value="${option}">
              ${option}
            </button>`).join('')}
        </div>
      </div>`;
},

    renderTripDashboardView: function() {
        const appArea = document.getElementById('app-area');
        if (!this.activeTrip) return;

        // Status and metrics
        const totalExpenses = this.getAllExpenses().length;
        const totalAmount = this.calculateTripTotal();
        const status = this.getTripStatusTag(this.activeTrip);
        const statusHtml = status ? `<span class="trip-tag ${status.className}">${status.label}</span>` : "";

        appArea.innerHTML = `
            <div class="card">
                <div class="trip-header-bar">
                    <button type="button" id="back-to-trips-btn" class="btn btn-secondary">&larr; Back to Trips</button>
                </div>
                
                <h1 class="trip-view-title">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">Trip: 
                            <span style="color: var(--primary-color);">${this.escapeHtml(this.activeTrip.name)}</span>
                            ${statusHtml}
                        </div>
                        <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.025em;">
                            Base: ${this.activeTrip.baseCurrency} • ${this.formatTripDates()}
                        </div>
                    </div>
                </h1>

                <!-- Quick Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: var(--bg-light); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${totalExpenses}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase;">Expenses</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-color);">${totalAmount}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase;">Total Spent</div>
                    </div>
                </div>

                <div class="action-grid">
                    <!-- Expenses -->
                    <div class="action-card">
                        <h3>💰 Manage Expenses</h3>
                        <p>Track your spending and manage your budget. ${totalExpenses} expense${totalExpenses !== 1 ? 's' : ''} logged so far.</p>
                        <div class="action-buttons">
                            <button id="add-expense-btn" class="btn btn-primary">+ Add Expense</button>
                            <button id="expense-summary-btn" class="btn btn-secondary">View Summary</button>
                        </div>
                    </div>

                    <!-- Itinerary -->
                    <div class="action-card">
                        <h3>🗓️ Manage Itinerary</h3>
                        <p>Plan your daily activities and view your upcoming schedule. Coming soon with enhanced features.</p>
                        <div class="action-buttons">
                            <button class="btn btn-disabled" disabled>Coming Soon</button>
                        </div>
                    </div>

                    <!-- Checklist -->
                    <div class="action-card">
                        <h3>📋 Manage Checklist</h3>
                        <p>Keep track of your travel preparation and packing items.</p>
                        <div class="action-buttons">
                            <button id="view-checklist-btn" class="btn btn-success">View</button>
                            <button id="customize-checklist-btn" class="btn btn-primary">Customize</button>
                        </div>
                    </div>
                    
                    <!-- Promos -->
                    <div class="promo-container">
                        <div class="action-card promo-card">
                            <h3>🛡️ Get Travel Insurance!</h3>
                            <p>Stay protected on your adventures. Get a personalized quote in minutes.</p>
                            <button id="promo-btn" class="btn btn-special">Get Quote</button>
                        </div>
                        <div class="action-card promo-card">
                            <h3>💻 Travel Tech Deals</h3>
                            <p>Save on portable monitors, travel-friendly laptops, and tech accessories.</p>
                            <button id="promo-tech-btn" class="btn btn-special">View Deals</button>
                        </div>
                    </div>

                    <div class="text-center" style="grid-column: 1 / -1; margin-top: 0.5rem;">
                        <small style="color: #9ca3af; font-size: 0.7rem;">(Affiliate partnerships help support this free app)</small>
                    </div>
                </div>
                ${this.renderAdsenseBlock()}
            </div>
        `;

        // Bind events
        document.getElementById('add-expense-btn').addEventListener('click', () => this.openExpenseViewTab('add-expense'));
        document.getElementById('expense-summary-btn').addEventListener('click', () => this.openExpenseViewTab('expense-summary'));
        document.getElementById('back-to-trips-btn').addEventListener('click', () => this.renderTripsListView());

        // Promo event handlers
        if (document.getElementById('promo-btn')) {
            document.getElementById('promo-btn').addEventListener('click', () => this.handlePromoClick());
        }
        if (document.getElementById('promo-tech-btn')) {
            document.getElementById('promo-tech-btn').addEventListener('click', () => this.handlePromoClick());
        }

                // Initialize any ads that were just rendered
        this.initializeAds();
    },

    openExpenseViewTab: function(tabName) {
        this.currentTripView = 'expense';
        this.renderExpenseView(tabName);
    },

renderExpenseView: function(defaultTab = 'add-expense') {
    const appArea = document.getElementById('app-area');
    const status = this.getTripStatusTag(this.activeTrip);
    const statusHtml = status ? `<span class="trip-tag ${status.className}">${status.label}</span>` : "";

    appArea.innerHTML = `
        <div class="card expense-view">
            <div class="trip-header-bar">
                <button type="button" id="back-to-dashboard-btn" class="btn btn-secondary">&larr; Back to Dashboard</button>
            </div>
            <h1 class="trip-view-title">
                Trip: <span style="color: var(--primary-color);">${this.activeTrip.name}</span>
                      (<span style="color: var(--primary-color);">${this.activeTrip.baseCurrency}</span>)
                ${statusHtml}
            </h1>

            <div class="flex justify-between items-center mb-4">
                <div id="status-indicator" class="flex items-center text-sm font-medium">
                    <span id="status-dot"></span>
                    <span id="status-text">Offline</span>
                </div>
            </div>

            <div class="tab-header">
                <button class="tab-btn ${defaultTab === 'add-expense' ? 'active' : ''}" data-tab="add-expense">Add Expense</button>
                <button class="tab-btn ${defaultTab === 'expense-summary' ? 'active' : ''}" data-tab="expense-summary">Expense Summary</button>
            </div>

            <div id="add-expense" class="tab-content ${defaultTab === 'add-expense' ? 'active' : ''}">
                <p class="currency-name mb-4">Add a new expense</p>
                <form id="expense-form">
                    <input type="hidden" id="selected-currency">
                    <input type="hidden" id="selected-category">
                    <input type="hidden" id="selected-mode">
                    
                    <div id="offline-message" class="hidden">
                        You are offline. Please connect to the internet to sync data.
                    </div>
                    
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="expense-date">Date</label>
                            <input type="date" id="expense-date" required>
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <div id="quick-category-buttons">
                                ${this.renderQuickSelectButtons(AppConfig.config.categories, 'category')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-grid-3">
                        <div class="form-group">
                            <label for="amount">Amount</label>
                            <input type="number" id="amount" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Currency</label>
                            <div id="quick-currency-buttons">
                                ${this.renderQuickSelectButtons(this.activeTrip.currencies, 'currency')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Mode</label>
                            <div id="quick-mode-buttons">
                                ${this.renderQuickSelectButtons(AppConfig.config.modes, 'mode')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="place">Place (e.g., Cafe, Store Name)</label>
                        <div class="location-input-group">
                            <input type="text" id="place" placeholder="Optional" class="location-input">
                            <div class="location-btn-container">
                                <button id="add-location-btn" type="button" 
                                        class="btn location-btn" 
                                        title="Add location from map">
                                    🌐
                                </button>
                                <span class="location-btn-label">Add location</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes</label>
                        <textarea id="notes" rows="2" placeholder="Optional notes about this expense"></textarea>
                    </div>
                    
                    <div id="location-display" class="text-sm currency-name mt-2 hidden"></div>
                    
                    <div class="expense-form-reset">
                        <button type="submit" class="btn btn-primary">Add Expense</button>
                        <button type="button" id="reset-btn" class="btn btn-secondary">Reset</button>
                    </div>
                </form>
                ${this.renderAdsenseBlock()}
            </div>

            <div id="expense-summary" class="tab-content ${defaultTab === 'expense-summary' ? 'active' : ''}">
            ${this.renderAdsenseBlock()}
                <div class="card">
                    <h2>Trip Expenses Summary</h2>
                    <div class="summary-toggle">
                        <button id="summary-tab-local" class="tab ${this.summaryMode === 'local' ? 'active' : ''}">Local currencies</button>
                        <button id="summary-tab-base" class="tab ${this.summaryMode === 'base' ? 'active' : ''}">Base Currency</button>
                    </div>
                    
                    <div id="base-conversion-panel" class="${this.summaryMode === 'base' ? '' : 'hidden'}">
                        <div class="rates-fetch-controls">
                            <p class="text-sm">Rates to <span id="base-currency-label">${this.activeTrip.baseCurrency}</span> (1 ${this.activeTrip.baseCurrency} = ? Local)</p>
                            <button id="fetch-rates-btn" class="btn">Fetch Rates</button>
                        </div>
                        <div id="base-inputs">
                            ${this.renderConversionInputs()}
                        </div>
                        <div id="base-missing-warning" class="hidden"></div>
                        <p id="rates-fetch-note" class="hidden"></p>
                    </div>
                    
                    <div id="total-expenses-summary">${this.renderTotalsSummary()}</div>
                    <div id="category-expenses-summary">${this.renderCategorySummary()}</div>
                </div>
                
                <div class="card">
                    <h2>Data Queue</h2>
                    <div class="collapsible-section mb-1rem">
                        <h3 id="synced-header" class="collapsible-header text-success" aria-expanded="true">
                            Synced Data <span class="toggle-icon">▼</span>
                        </h3>
                        <ul id="synced-list" class="collapsible-content list-disc pl-1.5rem text-secondary"></ul>
                    </div>
                    <div class="collapsible-section mb-1rem">
                        <h3 id="unsynced-header" class="collapsible-header text-red" aria-expanded="true">
                            Unsynced Data <span class="toggle-icon">▼</span>
                        </h3>
                        <ul id="unsynced-list" class="collapsible-content list-disc pl-1.5rem text-secondary"></ul>
                    </div>
                    <div class="data-queue-controls">
                        <button id="export-data-btn" class="btn btn-secondary">📤 Export JSON</button>
                        <button id="manual-sync-btn" class="btn btn-success">🔄 Sync Now (PIN)</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add tab switching functionality
    document.querySelectorAll('.expense-view .tab-header .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            
            // Deactivate sibling tabs and all tab content within this card
            card.querySelectorAll('.tab-header .tab-btn').forEach(btn => btn.classList.remove('active'));
            card.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Activate the clicked tab and its corresponding content
            button.classList.add('active');
            const tabContentId = button.dataset.tab;
            const tabContent = document.getElementById(tabContentId);
            if (tabContent) {
                tabContent.classList.add('active');
            }

                    // Initialize any ads that were just rendered
        this.initializeAds();
        });
    });

    // Enhance date picker for expense form
    const expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput) {
        expenseDateInput.valueAsDate = new Date(); // default to today
        this.enhanceDateInputs(['expense-date']);
    }

    // Add collapsible functionality for Data Queue
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            const icon = header.querySelector('.toggle-icon');

            if (isExpanded) {
                content.style.display = 'none';
                header.setAttribute('aria-expanded', 'false');
                icon.textContent = '▶';
            } else {
                content.style.display = 'block';
                header.setAttribute('aria-expanded', 'true');
                icon.textContent = '▼';
            }
        });
    });

    this.applyExpenseDefaults();
    this.updateNetworkStatus();
    this.renderExpenses();
    this.scrollToTop();
},
    
    renderCurrencyOptions: function() {
        const currencies = AppConfig.config.currencies;
        const currencyNames = AppConfig.config.currencyNames;
        
        return currencies.map(currency => {
            const name = currencyNames[currency] || currency;
            const selected = this.currentTripData && this.currentTripData.currencies && this.currentTripData.currencies.includes(currency) ? 'selected' : '';
            return `<option value="${currency}" ${selected}>${currency} - ${name}</option>`;
        }).join('');
    },
    
    renderQuickSelectButtons: function(options, type) {
        return options.map(option => {
            return `<button type="button" class="quick-select-btn" data-type="${type}" data-value="${option}">${option}</button>`;
        }).join('');
    },
    
    renderConversionInputs: function() {
        if (!this.activeTrip) return '';
        
        const currencies = this.activeTrip.currencies || [];
        
        return currencies.map(curr => {
            if (curr === this.activeTrip.baseCurrency) {
                return `
                    <div class="base-rate-input-container">
                        <span class="base-rate-label">${curr} (${AppConfig.config.currencyNames[curr] || curr})</span>
                        <div class="base-rate-display">1</div>
                    </div>
                `;
            } else {
                const rateVal = this.conversionRates[curr] ?? '';
                return `
                    <div class="base-rate-input-container">
                        <label class="base-rate-label" for="base-rate-${curr}">${curr} (${AppConfig.config.currencyNames[curr] || curr})</label>
                        <input id="base-rate-${curr}" data-currency="${curr}" type="number" step="any" min="0" placeholder="e.g., 80" value="${rateVal}" class="base-rate-input" />
                    </div>
                `;
            }
        }).join('');
    },

getTripStatusTag: function (trip) {
    const startVal = trip.startDate || trip.start;
    const endVal = trip.endDate || trip.end;

    if (!startVal || !endVal) return null;

    const today = new Date();
    const start = new Date(startVal);
    const end = new Date(endVal);

    if (today >= start && today <= end) {
        return { label: "Active", className: "tag-active" };
    }

    if (today < start) {
        const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) return { label: "Soon", className: "tag-soon" };
        if (diffDays <= 30) return { label: "In a month", className: "tag-month" };
        return { label: "Upcoming", className: "tag-upcoming" };
    }

    if (today > end) {
        return { label: "Finished", className: "tag-finished" };
    }

    return null;
},

renderTripCard: function(trip) {
    const status = this.getTripStatusTag(trip);
    const statusHtml = status 
        ? `<span class="trip-tag ${status.className}">${status.label}</span>` 
        : "";

    // Format dates for better mobile display
    const startDate = this.formatDateForDisplay(trip.start || trip.startDate);
    const endDate = this.formatDateForDisplay(trip.end || trip.endDate);
    
    // Calculate trip duration
    const duration = this.calculateTripDuration(trip.start || trip.startDate, trip.end || trip.endDate);
    
    // Get expense count for this trip
    const expenseCount = this.getAllExpensesForTrip(trip.id).length;
    
    // Determine countries display
    const countriesDisplay = this.formatCountriesDisplay(trip.countries);

    return `
        <div class="trip-card">
            <div class="trip-card-content">
                <div class="trip-card-header">
                    <h3 class="trip-card-title">${this.escapeHtml(trip.name)}</h3>
                    <div class="trip-card-subtitle">
                        <span class="currency-name">Base: ${trip.baseCurrency}</span>
                        ${countriesDisplay}
                        ${statusHtml}
                    </div>
                    <div class="trip-card-dates">
                        ${startDate} → ${endDate} (${duration})
                    </div>
                    <div class="currency-name" style="font-size: 0.75rem; margin-top: 0.25rem;">
                        ${expenseCount} expense${expenseCount !== 1 ? 's' : ''} • ${trip.currencies ? trip.currencies.length : 0} currenc${(trip.currencies ? trip.currencies.length : 0) !== 1 ? 'ies' : 'y'}
                    </div>
                </div>
                <div class="trip-card-actions">
                    <button class="btn btn-primary start-trip-btn" data-trip-id="${trip.id}" title="Select and start managing this trip">
                        Select
                    </button>
                    <button class="btn btn-danger delete-trip-btn" data-trip-id="${trip.id}" title="Delete this trip permanently">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
},


renderTripList: function() {
    const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
    const userId = user ? user.userId : null;
    const trips = this.getLocalData('trips').filter(trip => trip.userId === userId);

    if (!trips || trips.length === 0) {
        return `
            <div class="text-center" style="padding: 3rem 1rem; background: var(--bg-light); border-radius: var(--border-radius); border: 2px dashed var(--border-color);">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">✈️</div>
                <h3 style="color: var(--text-medium); margin-bottom: 0.5rem; font-weight: 600;">No trips yet</h3>
                <p style="color: var(--text-light); font-size: 0.9rem; line-height: 1.5;">
                    Start planning your next adventure by creating your first trip above.
                    Track expenses, manage itineraries, and stay organized!
                </p>
            </div>
        `;
    }

    // Sort trips by start date (most recent first, then by creation date)
    const sortedTrips = trips.sort((a, b) => {
        const dateA = new Date(a.start || a.startDate || a.createdAt);
        const dateB = new Date(b.start || b.startDate || b.createdAt);
        return dateB - dateA;
    });

    return `
        <div class="trip-list">
            ${sortedTrips.map(trip => this.renderTripCard(trip)).join('')}
        </div>
    `;
},

    
        renderTotalsSummary: function() {
        if (!this.activeTrip) return '';
        
        const allExpenses = this.getAllExpenses();
        
        if (allExpenses.length === 0) {
            return `
                <h3>Overall Trip Total</h3>
                <p class="currency-name" style="font-style: italic;">No expenses recorded for this trip yet.</p>
            `;
        }
        
        let html = '<h3>Overall Trip Total</h3>';
        
        if (this.summaryMode === 'local') {
            const totalsByCurrency = {};
            
            allExpenses.forEach(expense => {
                const amount = parseFloat(expense.amount) || 0;
                const currency = expense.currency;
                
                if (amount > 0 && currency) {
                    totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;
                }
            });
            
            if (Object.keys(totalsByCurrency).length > 0) {
                html += `
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                for (const currency in totalsByCurrency) {
                    const name = AppConfig.config.currencyNames[currency] || currency;
                    const formattedAmount = totalsByCurrency[currency].toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    html += `
                        <tr>
                            <td>${currency} (${name})</td>
                            <td style="font-weight: 600; color: #1f2937;">${formattedAmount}</td>
                        </tr>
                    `;
                }
                html += '</tbody></table>';
            }
        } else {
            // Base currency mode
            let totalBase = 0;
            const missing = new Set();
            
            allExpenses.forEach(expense => {
                const amount = parseFloat(expense.amount) || 0;
                const currency = expense.currency;
                
                if (currency === this.activeTrip.baseCurrency) {
                    totalBase += amount;
                } else if (this.conversionRates[currency]) {
                    totalBase += amount / this.conversionRates[currency];
                } else {
                    missing.add(currency);
                }
            });
            
            const formattedTotal = totalBase.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            if (missing.size > 0) {
                html += `<p class="text-red">Missing conversion rates for: ${[...missing].join(', ')}</p>`;
            }
            html += `
                <div style="font-weight: 600; color: #1f2937; font-size: 1.25rem; text-align: center; padding: 1rem 0;">
                    ${formattedTotal} ${this.activeTrip.baseCurrency}
                </div>
            `;
        }
        
        return html;
    },
    
    renderCategorySummary: function() {
        if (!this.activeTrip) return '';
        
        const allExpenses = this.getAllExpenses();
        
        if (allExpenses.length === 0) {
            return `
                <h3>Category Breakdown</h3>
                <p class="currency-name" style="font-style: italic;">No expenses recorded for this trip yet.</p>
            `;
        }
        
        const totalsByCategory = {};
        
        allExpenses.forEach(expense => {
            const amount = parseFloat(expense.amount) || 0;
            const currency = expense.currency;
            const category = expense.category || 'Uncategorized';
            
            if (!totalsByCategory[category]) {
                totalsByCategory[category] = {};
            }
            
            if (this.summaryMode === 'local') {
                totalsByCategory[category][currency] = (totalsByCategory[category][currency] || 0) + amount;
            } else {
                let convertedAmount = 0;
                if (currency === this.activeTrip.baseCurrency) {
                    convertedAmount = amount;
                } else if (this.conversionRates[currency]) {
                    convertedAmount = amount / this.conversionRates[currency];
                }
                totalsByCategory[category][this.activeTrip.baseCurrency] = (totalsByCategory[category][this.activeTrip.baseCurrency] || 0) + convertedAmount;
            }
        });
        
        let html = `<h3>Category Breakdown (${this.summaryMode === 'local' ? 'Local Currencies' : this.activeTrip.baseCurrency})</h3>`;
        
        html += `
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const category in totalsByCategory) {
            const totals = totalsByCategory[category];
            let totalHtml = '';
            
            for (const currency in totals) {
                const name = AppConfig.config.currencyNames[currency] || currency;
                const formattedAmount = totals[currency].toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                totalHtml += `<div style="white-space: nowrap; margin-bottom: 0.25rem;">${formattedAmount} ${currency} (${name})</div>`;
            }
            
            html += `
                <tr>
                    <td style="font-weight: 600;">${category}</td>
                    <td class="currency-name text-sm" style="color: #1f2937;">${totalHtml}</td>
                </tr>
            `;
        }
        
        html += '</tbody></table>';
        
        return html;
    },

    // === Dataset Manager Integration Functions ===
    async initializeDatasetManager() {
        if (typeof DatasetManager === 'undefined') {
            console.error('DatasetManager not available');
            return false;
        }

        // Ensure AppSettingsManager is initialized
        if (typeof AppSettingsManager !== 'undefined' && typeof AppSettingsManager.init === 'function') {
            AppSettingsManager.init();
        }

        // Create AppSettings global object that DatasetManager expects
        if (typeof AppSettings === 'undefined' && typeof AppSettingsManager !== 'undefined') {
            window.AppSettings = {
                datasets: AppSettingsManager.appSettings?.datasets || AppSettingsManager.getDefaultSettings().datasets
            };
        }

        try {
            // Initialize from local version.json
            const initResult = await DatasetManager.initializeFromLocal();
            if (!initResult.ok) {
                console.error('Failed to initialize DatasetManager:', initResult.error);
                return false;
            }

            console.log('DatasetManager initialized successfully:', initResult);
            return true;
        } catch (error) {
            console.error('Error initializing DatasetManager:', error);
            return false;
        }
    },

    async loadQuestionsDataset() {
    if (typeof DatasetManager === 'undefined') {
        console.error('DatasetManager not available');
        return false;
    }

    try {
        if (typeof AppSettings === 'undefined' && typeof AppSettingsManager !== 'undefined') {
            window.AppSettings = {
                datasets: AppSettingsManager.appSettings?.datasets || AppSettingsManager.getDefaultSettings().datasets
            };
        }

        let questionsKey = 'questions';
        console.log(`Loading questions dataset with key: ${questionsKey}`);

        const loadResult = await DatasetManager.load_dataset_with_check(questionsKey, { skipRemote: true });
        if (!loadResult.ok) {
            console.error('Failed to load questions dataset:', loadResult.error);
            return false;
        }

        const datasetResult = await DatasetManager.getDataset(questionsKey);
        if (!datasetResult.ok) {
            console.error('Failed to get questions dataset:', datasetResult.error);
            return false;
        }

        // FIX: unwrap schema wrapper
        const rawData = datasetResult.data;
        if (rawData && rawData.questions && Array.isArray(rawData.questions)) {
            this.questionsData = rawData.questions;
        } else if (Array.isArray(rawData)) {
            this.questionsData = rawData;
        } else {
            console.error('Questions dataset has unexpected format:', rawData);
            return false;
        }

        console.log('Questions dataset loaded successfully:', this.questionsData);
        return true;
    } catch (error) {
        console.error('Error loading questions dataset:', error);
        return false;
    }
},


async initUserTripDatabase(tripId) {
    if (!tripId) return false;

    const dbName = `lipikit_user_${tripId}`;
    
    try {
        const db = await this.openUserTripDB(dbName);
        console.log(`User trip database initialized: ${dbName}`);
        return true;
    } catch (error) {
        console.error('Failed to initialize user trip database:', error);
        return false;
    }
},

async openUserTripDB(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('responses')) {
                const store = db.createObjectStore('responses', { keyPath: 'questionId' });
                store.createIndex('questionId', 'questionId', { unique: true });
            }
        };
    });
},

    async saveQuestionResponse(tripId, questionId, response) {
        if (!tripId || !questionId) return false;

        const dbName = `lipikit_user_${tripId}`;
        
        try {
            const db = await this.openUserTripDB(dbName);
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['responses'], 'readwrite');
                const store = transaction.objectStore('responses');
                
                const responseData = {
                    questionId: questionId,
                    response: response,
                    timestamp: new Date().toISOString()
                };
                
                const request = store.put(responseData);
                
                request.onerror = () => reject(new Error(`Failed to save response: ${request.error}`));
                request.onsuccess = () => {
                    console.log(`Response saved for question ${questionId}:`, response);
                    resolve(true);
                };
                
                transaction.oncomplete = () => db.close();
            });
        } catch (error) {
            console.error('Error saving question response:', error);
            return false;
        }
    },

    async loadQuestionResponses(tripId) {
        if (!tripId) return {};

        const dbName = `lipikit_user_${tripId}`;
        
        try {
            const db = await this.openUserTripDB(dbName);
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['responses'], 'readonly');
                const store = transaction.objectStore('responses');
                const request = store.getAll();
                
                request.onerror = () => reject(new Error(`Failed to load responses: ${request.error}`));
                request.onsuccess = () => {
                    const responses = {};
                    request.result.forEach(item => {
                        responses[item.questionId] = item.response;
                    });
                    resolve(responses);
                };
                
                transaction.oncomplete = () => db.close();
            });
        } catch (error) {
            console.error('Error loading question responses:', error);
            return {};
        }
    },
    
    bindEvents: function() {
        const appArea = document.getElementById('app-area');
        if (!appArea) return;

        appArea.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            // Button clicks
            if (target.id === 'add-trip-btn') this.showTripCreationForm();
            if (target.id === 'cancel-trip-btn') this.cancelTripCreation();
            if (target.id === 'prev-questions-btn') this.prevQuestionsPage();
            if (target.id === 'back-to-trips-btn') this.backToTrips();
                        // --- FIXED SECTION ---
//            if (target.id === 'back-to-dashboard-btn') { this.currentTripView = 'dashboard'; this.renderApp(); }
            // The handler for the 'Back to Dashboard' button is now context-aware.
            if (target.id === 'back-to-dashboard-btn') {
                // Only execute the default navigation if the button is NOT inside the checklist view.
                // The checklist view has its own specific handler that checks for unsaved changes.
                if (!target.closest('.checklist-view')) {
                    this.currentTripView = 'dashboard';
                    this.renderApp();
                }
            }
            // --- END FIXED SECTION ---
            if (target.id === 'add-expense-btn') this.openExpenseViewTab('add-expense');
            if (target.id === 'expense-summary-btn') this.openExpenseViewTab('expense-summary');
if (target.id === 'view-checklist-btn') this.renderChecklistView('view-checklist');
if (target.id === 'customize-checklist-btn') this.renderChecklistView('customize-checklist');            
if (target.id === 'promo-btn') this.handlePromoClick();
            if (target.id === 'promo-tech-btn') this.handlePromoClick();
            if (target.id === 'add-location-btn') this.captureLocation();
            if (target.id === 'reset-btn') this.resetExpenseForm();
            if (target.id === 'export-data-btn') this.exportData();
            if (target.id === 'manual-sync-btn') this.handleManualSync();
            if (target.id === 'fetch-rates-btn') this.fetchExchangeRates();
            if (target.id === 'summary-tab-local') this.switchSummaryMode('local');
            if (target.id === 'summary-tab-base') this.switchSummaryMode('base');

            // Delegated buttons with data attributes
            if (target.classList.contains('quick-select-btn')) this.handleQuickSelect(target);
            if (target.classList.contains('question-option')) this.handleQuestionOptionSelect(target);
            if (target.classList.contains('start-trip-btn')) this.startTrip(target.dataset.tripId);
            if (target.classList.contains('delete-trip-btn')) this.deleteTrip(target.dataset.tripId);
        });

        // --- SUBMIT Event Delegation ---
        appArea.addEventListener('submit', (e) => {
            if (e.target.id === 'add-trip-form-step1') {
                e.preventDefault();
                this.handleTripBasicInfoSubmit();
            }
            if (e.target.id === 'questions-form') {
                e.preventDefault();
                this.handleQuestionsSubmit();
            }
            if (e.target.id === 'expense-form') {
                e.preventDefault();
                this.handleAddExpense();
            }
        });

        // --- CHANGE/INPUT Event Delegation ---
        appArea.addEventListener('input', (e) => {
            // Handle rate change
            if (e.target.matches('#base-inputs input[data-currency]')) {
                this.handleRateChange(e.target);
            }
            // Handle question textarea input
            if (e.target.matches('.question-textarea')) {
                const questionId = e.target.id.replace('question-', '');
                this.userResponses[questionId] = e.target.value;

                // Save immediately in IndexedDB
                if (this.currentTripData?.id) {
                    this.saveQuestionResponse(this.currentTripData.id, questionId, e.target.value);
                }
            }
        });
        
        appArea.addEventListener('change', (e) => {
            // Dynamically update base currency options when trip currencies change
            if (e.target.id === 'new-trip-currencies' || e.target.id === 'new-trip-currencies-hidden') {
                const hiddenInput = document.getElementById('new-trip-currencies-hidden');
                const baseCurrencySelect = document.getElementById('new-trip-base-currency');

                // Read selected currencies from hidden input (multi-select widget)
                let selectedCurrencies = [];
                if (hiddenInput && hiddenInput.value) {
                    selectedCurrencies = hiddenInput.value.split(',').filter(Boolean);
                } else {
                    // fallback to the native select, only if it really is a <select>
                    const tripCurrenciesSelect = document.getElementById('new-trip-currencies');
                    if (tripCurrenciesSelect && tripCurrenciesSelect.tagName === 'SELECT' && tripCurrenciesSelect.selectedOptions) {
                        selectedCurrencies = Array.from(tripCurrenciesSelect.selectedOptions).map(opt => opt.value);
                    }
                }

                // Also include user's home currency if available
                const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
                const homeCurrency = user && user.homeCurrency ? user.homeCurrency : null;
                if (homeCurrency && !selectedCurrencies.includes(homeCurrency)) {
                    selectedCurrencies.push(homeCurrency);
                }

                // Render base currency dropdown
                baseCurrencySelect.innerHTML = `
                    <option value="" disabled ${!this.currentTripData?.baseCurrency ? 'selected' : ''}>Select a base currency</option>
                    ${selectedCurrencies.map(currency => {
                        const name = AppConfig.config.currencyNames[currency] || currency;
                        const selected = this.currentTripData && this.currentTripData.baseCurrency === currency ? 'selected' : '';
                        return `<option value="${currency}" ${selected}>${currency} - ${name}</option>`;
                    }).join('')}
                `;
            }
        });
    },

// Reusable multi-select widget initializer with debug logging
initMultiSelect: function(containerId, options, hiddenInputId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('initMultiSelect: container not found', containerId);
        return;
    }

    options = Array.isArray(options) ? options : [];
    console.log('[initMultiSelect] START', { containerId, hiddenInputId, optionsCount: options.length });

    container.innerHTML = `
        <div class="ms-input">
            <input type="text" class="ms-search" placeholder="Search or type to filter...">
            <div class="ms-dropdown hidden"></div>
        </div>
        <div class="ms-selected"></div>
        <input type="hidden" id="${hiddenInputId}" value="">
    `;

    const search = container.querySelector('.ms-search');
    const dropdown = container.querySelector('.ms-dropdown');
    const selectedWrap = container.querySelector('.ms-selected');
    let hidden = container.querySelector(`#${hiddenInputId}`);

    if (!hidden) {
        console.warn('initMultiSelect: hidden input not found, creating', hiddenInputId);
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = hiddenInputId;
        container.appendChild(hidden);
    }

    let selected = (hidden.value && typeof hidden.value === 'string')
        ? hidden.value.split(',').filter(Boolean)
        : [];
    console.log('[initMultiSelect] initial selected array:', selected);

    function renderDropdown(filter = '') {
        console.log('[renderDropdown] filter', filter);
        dropdown.innerHTML = options
            .filter(opt => (opt.label || '').toLowerCase().includes(filter.toLowerCase()))
            .map(opt => `<div class="ms-option" data-value="${opt.value}">${opt.label}</div>`)
            .join('');
    }

    function renderSelected() {
        console.log('[renderSelected] ENTER', { selected, hiddenVal: hidden.value, optionsSample: options.slice(0,3) });
        try {
            selectedWrap.innerHTML = selected.map(val => {
                const opt = options.find(o => o.value === val) || { label: val };
                return `<span class="ms-tag" data-value="${val}">${opt.label}<button type="button" class="ms-remove" data-value="${val}">&times;</button></span>`;
            }).join('');
            hidden.value = selected.join(',');
            console.log('[renderSelected] hidden.value updated', hidden.value);
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (err) {
            console.error('[renderSelected] ERROR', err, { selected, hidden, options });
            throw err;
        }
    }

    search.addEventListener('focus', () => { dropdown.classList.remove('hidden'); renderDropdown(); });
    search.addEventListener('input', (e) => renderDropdown(e.target.value));

    dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.ms-option');
        if (!option) return;
        const value = option.dataset.value;
        if (!selected.includes(value)) {
            selected.push(value);
            console.log('[dropdown click] added', value, 'selected now', selected);
            renderSelected();
        }
    });

    selectedWrap.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.ms-remove');
        if (!removeBtn) return;
        const value = removeBtn.dataset.value;
        selected = selected.filter(v => v !== value);
        console.log('[selectedWrap click] removed', value, 'selected now', selected);
        renderSelected();
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) dropdown.classList.add('hidden');
    });

    container.getSelectedValues = () => selected.slice();

    // initial render
    renderDropdown();
    renderSelected();

    console.log('[initMultiSelect] COMPLETE for', containerId);
},

// --- Make date picker enhancer a method on AppManager ---
enhanceDateInputs: function(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || typeof el.showPicker !== 'function') return;

        const showPicker = (event) => {
            if (event && event.isTrusted) {
                try {
                    el.showPicker();
                } catch (e) {
                    if (e && e.name !== 'NotAllowedError') {
                        console.warn(`Failed to show picker for ${id}:`, e);
                    }
                }
            }
        };

        if (el._showPickerHandler) {
            el.removeEventListener('focus', el._showPickerHandler);
            el.removeEventListener('click', el._showPickerHandler);
        }

        el._showPickerHandler = showPicker;
        el.addEventListener('focus', showPicker);
        el.addEventListener('click', showPicker);
    });
},

// Initialize trip basic form widgets (currencies + countries)
initTripBasicFormWidgets: function() {
    const currencyOpts = (this._pendingTripCurrencyOptions && this._pendingTripCurrencyOptions.length)
        ? this._pendingTripCurrencyOptions
        : (AppConfig?.config?.currencies || []).map(
            c => ({ value: c, label: `${c} - ${(AppConfig?.config?.currencyNames?.[c] || c)}` })
        );
    const countryOpts = (this._pendingTripCountryOptions && this._pendingTripCountryOptions.length)
        ? this._pendingTripCountryOptions
        : (AppConfig?.config?.countries || []).map(c => {
            if (typeof c === 'string') return { value: c, label: c };
            const val = c.code || c.id || c.value || c.name || c.label;
            const name = c.name || c.label || c.text || val;
            if (!val) return null;
            return { value: val, label: `${val} - ${name}` };
        }).filter(Boolean);

    // Initialize multi-select for currencies
    this.initMultiSelect('new-trip-currencies', currencyOpts, 'new-trip-currencies-hidden', (selected) => {
        const baseSelect = document.getElementById('new-trip-base-currency');
        if (baseSelect) {
            const currentBase = this.currentTripData?.baseCurrency || '';
            // Include user's home currency if available
            const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
            const homeCurrency = user && user.homeCurrency && !selected.includes(user.homeCurrency)
                ? user.homeCurrency
                : null;
            const finalCurrencies = homeCurrency ? [...selected, homeCurrency] : selected;
            baseSelect.innerHTML = `
                <option value="" disabled ${!currentBase ? 'selected' : ''}>Choose a base currency</option>
                ${finalCurrencies.sort().map(code => {
                    const found = currencyOpts.find(o => o.value === code);
                    const name = found ? found.label : `${code} - ${AppConfig?.config?.currencyNames?.[code] || code}`;
                    const selectedAttr = currentBase === code ? 'selected' : '';
                    return `<option value="${code}" ${selectedAttr}>${name}</option>`;
                }).join('')}
            `;
        }
    });

    // Initialize multi-select for countries
    this.initMultiSelect('new-trip-countries', countryOpts, 'new-trip-countries-hidden');

    // Enhance date inputs
    this.enhanceDateInputs(['new-trip-start','new-trip-end']);

    // Bind form events
    const form = document.getElementById('add-trip-form-step1');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTripBasicInfoSubmit();
        });
    }

    const cancelBtn = document.getElementById('cancel-trip-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            this.tripCreationStep = 1;
            this.currentTripData = null;
            this.userResponses = {};
            document.getElementById('trip-creation-container').classList.add('hidden');
            document.getElementById('trip-list').classList.remove('hidden');
            this.renderApp();
        });
    }

    // Trigger initial base currency update
    const hiddenCurrencies = document.getElementById('new-trip-currencies-hidden');
    const selectedCurrencies = hiddenCurrencies && hiddenCurrencies.value
        ? hiddenCurrencies.value.split(',').filter(Boolean)
        : (this.currentTripData?.currencies || []);
    const baseSelect = document.getElementById('new-trip-base-currency');
    if (baseSelect && selectedCurrencies.length) {
        const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
        const homeCurrency = user && user.homeCurrency && !selectedCurrencies.includes(user.homeCurrency)
            ? user.homeCurrency
            : null;
        const finalCurrencies = homeCurrency ? [...selectedCurrencies, homeCurrency] : selectedCurrencies;
        const currentBase = this.currentTripData?.baseCurrency || '';
        baseSelect.innerHTML = `
            <option value="" disabled ${!currentBase ? 'selected' : ''}>Choose a base currency</option>
            ${finalCurrencies.sort().map(code => {
                const found = currencyOpts.find(o => o.value === code);
                const name = found ? found.label : `${code} - ${AppConfig?.config?.currencyNames?.[code] || code}`;
                const selectedAttr = currentBase === code ? 'selected' : '';
                return `<option value="${code}" ${selectedAttr}>${name}</option>`;
            }).join('')}
        `;
    }
},

// === Trip Creation Form Handlers ===
showTripCreationForm: async function() {
    this.tripCreationStep = 1;
    this.currentTripData = null;
    this.questionsData = null;
    this.currentQuestionPage = 0;
    this.userResponses = {};

    // Ensure container and buttons exist safely
    const container = document.getElementById('trip-creation-container');
    const addBtn = document.getElementById('add-trip-btn');
    const tripList = document.getElementById('trip-list');

    if (container) container.classList.remove('hidden');
    if (addBtn) addBtn.classList.add('hidden');
    if (tripList) tripList.classList.add('hidden');

    // Load questions dataset via helper (handles AppSettings + unwrap)
    const ok = await this.loadQuestionsDataset();

    // loadQuestionsDataset returns true/false; fail gracefully but still initialize widgets so form is usable
    if (!ok) {
        console.error('Failed to load questions dataset');
        alert('Could not load trip questions. The form will still be shown with default values.');
        // render the form anyway (fall back to AppConfig) so widgets exist
        if (container) container.innerHTML = this.renderTripCreationForm();
        this.initTripBasicFormWidgets();
        return;
    }

    // After questions are loaded, re-render the form so the dataset-driven fields appear,
    // then initialize the widgets
    if (container) container.innerHTML = this.renderTripCreationForm();
    this.initTripBasicFormWidgets();
},

    cancelTripCreation: function() {
        this.tripCreationStep = 1;
        this.currentTripData = null;
        this.questionsData = null;
        this.currentQuestionPage = 0;
        this.userResponses = {};
        
        document.getElementById('trip-creation-container').classList.add('hidden');
        document.getElementById('add-trip-btn').classList.remove('hidden');
        document.getElementById('trip-list').classList.remove('hidden');
    },

async handleTripBasicInfoSubmit() {
    if (this.isSubmitting) return; // Prevent multiple submissions
    this.isSubmitting = true;

    try {
        const tripName = document.getElementById('new-trip-name').value.trim();

        // Read currencies (support new hidden input created by multi-select)
        let currencies = [];
        const hiddenCurrencies = document.getElementById('new-trip-currencies-hidden');
        if (hiddenCurrencies && hiddenCurrencies.value) {
            currencies = hiddenCurrencies.value.split(',').filter(Boolean);
        } else {
            const currencySelect = document.getElementById('new-trip-currencies');
            if (currencySelect && currencySelect.tagName === 'SELECT' && currencySelect.selectedOptions) {
                currencies = Array.from(currencySelect.selectedOptions).map(opt => opt.value);
            }
        }

        // Read countries (new field)
        let countries = [];
        const hiddenCountries = document.getElementById('new-trip-countries-hidden');
        if (hiddenCountries && hiddenCountries.value) {
            countries = hiddenCountries.value.split(',').filter(Boolean);
        }

        const baseCurrency = document.getElementById('new-trip-base-currency').value;
        const startDate = document.getElementById('new-trip-start').value;
        const endDate = document.getElementById('new-trip-end').value;

        if (!tripName || !currencies.length || !baseCurrency || !startDate || !endDate) {
            this.showError('Please fill in all required fields.');
            this.isSubmitting = false;
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showError('End date must be on or after the start date.');
            this.isSubmitting = false;
            return;
        }

        // Validate that baseCurrency is one of the selected currencies
        if (!currencies.includes(baseCurrency)) {
            this.showError('Base currency must be one of the selected trip currencies.');
            this.isSubmitting = false;
            return;
        }

        const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
        const userId = user ? user.userId : null;

        // Create trip data
        this.currentTripData = {
            id: `trip-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            userId: userId,
            name: tripName,
            currencies: currencies,
            baseCurrency: baseCurrency,
            countries: countries,
            start: startDate,
            end: endDate,
            createdAt: new Date().toISOString()
        };

        // Save the trip
        this.saveDataLocally(this.currentTripData, 'trips');

        // Initialize dataset manager
        const datasetInitialized = await this.initializeDatasetManager();
        if (!datasetInitialized) {
            this.showError('Failed to initialize data system. Proceeding without questions.');
            this.completeTripCreation();
            this.isSubmitting = false;
            return;
        }

        // Initialize user trip database
        await this.initUserTripDatabase(this.currentTripData.id);

        // Load any existing responses
        this.userResponses = await this.loadQuestionResponses(this.currentTripData.id);

        // Move to questions step only if questions exist
        const hasQuestions = this.getFilteredQuestions().length > 0;
        if (hasQuestions) {
            this.tripCreationStep = 2;
            this.currentQuestionPage = 0;
            document.getElementById('trip-creation-container').innerHTML = this.renderTripCreationForm();
        } else {
            this.completeTripCreation();
        }
    } catch (error) {
        this.showError('An error occurred during trip creation: ' + error.message);
        console.error('Error in handleTripBasicInfoSubmit:', error);
    } finally {
        this.isSubmitting = false; // Reset flag even on error
    }
},

handleQuestionOptionSelect: async function(button) {
    const questionId = button.dataset.questionId;
    const value = button.dataset.value;

    const questionItem = button.closest('.question-item');
    const type = questionItem ? questionItem.dataset.type : 'single';

    if (type === 'multi') {
        let current = this.userResponses[questionId] || [];
        if (!Array.isArray(current)) current = [];

        if (current.includes(value)) {
            current = current.filter(v => v !== value);
        } else {
            current.push(value);
        }
        this.userResponses[questionId] = current;

        // Re-sync all option buttons for this multi question
        const buttons = questionItem.querySelectorAll('.question-option');
        buttons.forEach(btn => {
            if (current.includes(btn.dataset.value)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    } else {
        // SINGLE
        const siblings = button.parentElement.querySelectorAll('.question-option');
        siblings.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.userResponses[questionId] = value;
    }

    if (this.currentTripData?.id) {
        await this.saveQuestionResponse(this.currentTripData.id, questionId, this.userResponses[questionId]);
    }
},

    prevQuestionsPage: function() {
        if (this.currentQuestionPage > 0) {
            this.currentQuestionPage--;
            document.getElementById('trip-creation-container').innerHTML = this.renderTripCreationForm();
        }
    },

async handleQuestionsSubmit() {
    // Save current page responses
    const currentQuestions = this.getCurrentPageQuestions();
    for (const question of currentQuestions) {
        const questionId = question.id || `q_${this.getCurrentPageStartIndex() + currentQuestions.indexOf(question)}`;
        const response = this.userResponses[questionId] || '';
        
        if (response) {
            await this.saveQuestionResponse(this.currentTripData.id, questionId, response);
        }
    }

    // Use filtered questions for pagination
    const filteredQuestions = this.getFilteredQuestions();
    const totalQuestions = filteredQuestions.length;
    const totalPages = Math.ceil(totalQuestions / this.questionsPerPage);
    const isLastPage = this.currentQuestionPage >= totalPages - 1;

    if (isLastPage) {
        // Complete trip creation
        this.completeTripCreation();
    } else {
        // Go to next page
        this.currentQuestionPage++;
        document.getElementById('trip-creation-container').innerHTML = this.renderTripCreationForm();
    }
},

getCurrentPageQuestions: function() {
    const filteredQuestions = this.getFilteredQuestions();
    const startIdx = this.currentQuestionPage * this.questionsPerPage;
    const endIdx = Math.min(startIdx + this.questionsPerPage, filteredQuestions.length);
    return filteredQuestions.slice(startIdx, endIdx);
},

    getCurrentPageStartIndex: function() {
        return this.currentQuestionPage * this.questionsPerPage;
    },

completeTripCreation: async function() {
    try {
        // Save question responses to IndexedDB
        await this.saveQuestionResponses();

        // Reset state
        this.tripCreationStep = 1;
        this.currentTripData = null;
        this.currentQuestionPage = 0;
        this.userResponses = {};

        // Update UI
        document.getElementById('trip-creation-container').classList.add('hidden');
        document.getElementById('trip-list').classList.remove('hidden');
        this.renderApp();
        this.showSuccess('Trip created successfully with your preferences!');
    } catch (error) {
        this.showError('Failed to complete trip creation: ' + error.message);
        console.error('Error in completeTripCreation:', error);
    }
},

saveQuestionResponses: async function() {
    if (!this.currentTripData || !this.currentTripData.id || !this.userResponses) return;

    try {
        const db = await this.getUserTripDatabase(this.currentTripData.id);
        const transaction = db.transaction(['responses'], 'readwrite');
        const store = transaction.objectStore('responses');

        for (const [questionId, response] of Object.entries(this.userResponses)) {
            await store.put({ questionId, response, timestamp: new Date().toISOString() });
        }

        await transaction.complete;
    } catch (error) {
        console.error('Error saving question responses:', error);
        throw error; // Propagate error to be caught in completeTripCreation
    }
},

getUserTripDatabase: async function(tripId) {
    if (!tripId) throw new Error('Trip ID is required');

    if (!this.databases) this.databases = {};
    if (!this.databases[tripId]) {
        // Initialize the database
        const initSuccess = await this.initUserTripDatabase(tripId);
        if (!initSuccess) throw new Error('Failed to initialize user trip database');

        // Open and cache the database
        try {
            this.databases[tripId] = await this.openUserTripDB(`lipikit_user_${tripId}`);
        } catch (error) {
            throw new Error(`Failed to open user trip database: ${error.message}`);
        }
    }
    return this.databases[tripId];
},

    handlePromoClick: function() {
        this.showMessage('Promotion', 'This link would take you to our affiliate partner for travel insurance. Thanks for your support!');
        // Example: window.open('https://affiliate.link/insurance', '_blank');
    },
    
    setupNetworkStatus: function() {
        const updateStatus = () => {
            const isOnline = navigator.onLine;
            document.querySelectorAll('#status-dot').forEach(dot => {
                dot.style.backgroundColor = isOnline ? 'var(--success-color)' : 'var(--danger-color)';
            });
            document.querySelectorAll('#status-text').forEach(text => {
                text.textContent = isOnline ? 'Online' : 'Offline';
            });
            const offlineMessage = document.getElementById('offline-message');
            if (offlineMessage) {
                 offlineMessage.classList.toggle('hidden', isOnline);
            }
        };
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus(); // Initial call
    },
    
    setupUserLoginListener: function() {
        // Note: ProfileManager should trigger re-render on login
        if (typeof ProfileManager !== 'undefined') {
            const originalRenderProfileSection = ProfileManager.renderProfileSection;
            ProfileManager.renderProfileSection = () => {
                originalRenderProfileSection.apply(ProfileManager);
                // Re-initialize app state on login/logout
                this.isInitialized = false;
                this.init();
            };
        }
    },
    
    applyUserSettings: function() {
        // Implementation for applying user-specific settings
        // Can be expanded based on user profile settings
    },
    
    applyExpenseDefaults: function() {
        // Apply default selections if any
        const defaultCategory = AppConfig.config.categories[0];
        const defaultCurrency = this.activeTrip?.currencies[0];
        const defaultMode = AppConfig.config.modes[0];
        
        if (defaultCategory) {
            const categoryBtn = document.querySelector(`#quick-category-buttons .quick-select-btn[data-value="${defaultCategory}"]`);
            if (categoryBtn) this.handleQuickSelect(categoryBtn);
        }
        
        if (defaultCurrency) {
            const currencyBtn = document.querySelector(`#quick-currency-buttons .quick-select-btn[data-value="${defaultCurrency}"]`);
            if (currencyBtn) this.handleQuickSelect(currencyBtn);
        }
        
        if (defaultMode) {
            const modeBtn = document.querySelector(`#quick-mode-buttons .quick-select-btn[data-value="${defaultMode}"]`);
            if (modeBtn) this.handleQuickSelect(modeBtn);
        }
    },
    
    deleteTrip: function(tripId) {
        const performDelete = () => {
            // Use allUsers=true to get data for all users, then filter
            const allTrips = this.getLocalData('trips', true).filter(trip => trip.id !== tripId);
            localStorage.setItem(this.getStorageKey('trips'), JSON.stringify(allTrips));
            
            // Delete associated expenses
            const allSyncedExpenses = this.getLocalData('syncedExpenses', true).filter(expense => expense.tripId !== tripId);
            const allUnsyncedExpenses = this.getLocalData('unsyncedExpenses', true).filter(expense => expense.tripId !== tripId);
            localStorage.setItem(this.getStorageKey('syncedExpenses'), JSON.stringify(allSyncedExpenses));
            localStorage.setItem(this.getStorageKey('unsyncedExpenses'), JSON.stringify(allUnsyncedExpenses));
            
            // Clear conversion rates for this trip
            const allRates = JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates'))) || {};
            delete allRates[tripId];
            localStorage.setItem(this.getStorageKey('conversionRates'), JSON.stringify(allRates));

            // Delete user trip database
            this.deleteUserTripDatabase(tripId);
            
            if (this.activeTrip?.id === tripId) {
                this.activeTrip = null;
                localStorage.removeItem(this.getStorageKey('activeTrip'));
            }
            
            this.renderApp();
            this.showSuccess('Trip deleted successfully!');
        };

        if (typeof showConfirmation !== 'undefined') {
            showConfirmation(
                'Delete Trip',
                'Are you sure you want to delete this trip? All associated expenses and responses will be permanently deleted.',
                performDelete
            );
        } else {
            console.warn("showConfirmation modal not found, using native browser confirm.");
            if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                performDelete();
            }
        }
    },

    async deleteUserTripDatabase(tripId) {
        if (!tripId) return;

        const dbName = `lipikit_user_${tripId}`;
        
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            
            deleteRequest.onerror = () => {
                console.error(`Failed to delete user trip database: ${dbName}`);
                resolve(false); // Don't reject, just resolve with false
            };
            
            deleteRequest.onsuccess = () => {
                console.log(`User trip database deleted: ${dbName}`);
                resolve(true);
            };
            
            deleteRequest.onblocked = () => {
                console.warn(`Delete blocked for user trip database: ${dbName}`);
                resolve(false);
            };
        });
    },
    
    startTrip: function(tripId) {
        const trips = this.getLocalData('trips');
        const selectedTrip = trips.find(trip => trip.id === tripId);
        
        if (selectedTrip) {
            this.activeTrip = selectedTrip;
            localStorage.setItem(this.getStorageKey('activeTrip'), JSON.stringify(selectedTrip));
            this.loadConversionRates();
            this.currentTripView = 'dashboard'; // Start at dashboard
            this.renderApp();
        }
    },
    
    backToTrips: function() {
        this.activeTrip = null;
        localStorage.removeItem(this.getStorageKey('activeTrip'));
        this.renderApp();
    },
    
    renderTripsListView: function() {
        this.backToTrips();
    },
    
    handleQuickSelect: function(button) {
        const type = button.dataset.type;
        const value = button.dataset.value;
        
        // Remove active class from siblings
        const siblings = button.parentElement.querySelectorAll('.quick-select-btn');
        siblings.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update hidden input
        const hiddenInput = document.getElementById(`selected-${type}`);
        if (hiddenInput) {
            hiddenInput.value = value;
        }
    },
    
    handleAddExpense: function() {
        const expenseData = {
            tripId: this.activeTrip.id,
            expenseDate: document.getElementById('expense-date').value,
            amount: document.getElementById('amount').value,
            currency: document.getElementById('selected-currency').value,
            category: document.getElementById('selected-category').value,
            place: document.getElementById('place').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            location: this.currentLocation ? `${this.currentLocation.latitude},${this.currentLocation.longitude}` : 'N/A',
            mode: document.getElementById('selected-mode').value,
            id: `exp-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        
        // Validation
        if (!expenseData.amount || parseFloat(expenseData.amount) <= 0 || !expenseData.currency || !expenseData.category || !expenseData.mode || !expenseData.expenseDate) {
            this.showMessage('Error', 'Please fill in all required fields (Date, Amount, Currency, Category, Mode). Amount must be greater than zero.');
            return;
        }
        
        // Save expense
        this.saveDataLocally(expenseData, 'unsyncedExpenses');
        this.resetExpenseForm();
        this.renderExpenses(); // This updates the lists and summary
        
        this.showSuccess('Expense added successfully!');
    },
    
    resetExpenseForm: function() {
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.reset();
        }
        document.querySelectorAll('.quick-select-btn.active').forEach(btn => btn.classList.remove('active'));
        
        const locationDisplay = document.getElementById('location-display');
        if (locationDisplay) {
            locationDisplay.classList.add('hidden');
        }
        
        this.currentLocation = null;
        
        // Reset to today's date
        const expenseDateInput = document.getElementById('expense-date');
        if (expenseDateInput) {
            expenseDateInput.valueAsDate = new Date();
        }
        
        // Reapply defaults
        this.applyExpenseDefaults();
    },
    
    captureLocation: function() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser.');
            return;
        }
        
        const locationDisplay = document.getElementById('location-display');
        if (locationDisplay) {
            locationDisplay.textContent = 'Capturing location...';
            locationDisplay.classList.remove('hidden');
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                this.currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                if (locationDisplay) {
                    locationDisplay.textContent = `Location Captured: ${this.currentLocation.latitude.toFixed(4)}, ${this.currentLocation.longitude.toFixed(4)}`;
                }
            },
            error => {
                console.error("Geolocation error:", error);
                if (locationDisplay) {
                    locationDisplay.textContent = "Unable to get location.";
                }
                 this.showMessage('Location Error', `Could not get location. Error: ${error.message}`);
            }
        );
    },
    
    handleManualSync: function() {
        if (!navigator.onLine) {
            this.showMessage('Offline', 'You are offline. Please connect to the internet to sync data.');
            return;
        }
        
        const unsyncedData = this.getLocalData('unsyncedExpenses', true).filter(d => d.tripId === this.activeTrip?.id);
        if (unsyncedData.length === 0) {
            this.showMessage("Sync Info", "There is no new data for this trip to sync.");
            return;
        }
        
        this.syncAttemptOrigin = 'manual';
        this.showPinModal();
    },
    
    showPinModal: function() {
        // Create PIN modal if it doesn't exist
        let pinModal = document.getElementById('pin-modal');
        if (!pinModal) {
            pinModal = document.createElement('div');
            pinModal.id = 'pin-modal';
            pinModal.className = 'modal';
            pinModal.innerHTML = `
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Enter PIN to Sync</h2>
                    <p>Please enter the security PIN to sync your data.</p>
                    <form id="pin-modal-form">
                        <div class="form-group">
                            <input type="password" id="pin-modal-input" placeholder="Enter PIN" maxlength="4" inputmode="numeric" pattern="[0-9]*" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Submit</button>
                        <div id="pin-modal-message" class="text-red text-sm mt-2"></div>
                    </form>
                </div>
            `;
            document.body.appendChild(pinModal);
            
            pinModal.querySelector('.close-button').addEventListener('click', () => pinModal.classList.add('hidden'));
            document.getElementById('pin-modal-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePinSubmission();
            });
        }
        
        pinModal.classList.remove('hidden');
        document.getElementById('pin-modal-input').focus();
    },
    
    handlePinSubmission: function() {
        const pinInput = document.getElementById('pin-modal-input');
        const pinMessage = document.getElementById('pin-modal-message');
        const enteredPin = pinInput.value;
        
        if (AppConfig.validatePIN(enteredPin)) {
            document.getElementById('pin-modal').classList.add('hidden');
            pinMessage.textContent = '';
            pinInput.value = '';
            
            if (this.syncAttemptOrigin === 'manual') {
                this.startSync();
            }
        } else {
            pinMessage.textContent = 'Invalid PIN. Please try again.';
            pinInput.select();
        }
    },
    
    async startSync() {
        const tripUnsyncedData = this.getLocalData('unsyncedExpenses', true).filter(d => d.tripId === this.activeTrip?.id);
        if (tripUnsyncedData.length === 0) return;

        this.showMessage("Syncing...", `Attempting to sync ${tripUnsyncedData.length} expense(s). Please wait.`);
        
        let newlySyncedItems = [];
        let remainingUnsynced = this.getLocalData('unsyncedExpenses', true).filter(d => d.tripId !== this.activeTrip?.id);
        
        for (const item of tripUnsyncedData) {
            const formData = new FormData();
            const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
            
            formData.append(AppConfig.config.googleForm.expenseFields.name, `${user?.userId || 'unknown'}:${user?.displayName || 'unknown'}`);
            formData.append(AppConfig.config.googleForm.expenseFields.tripName, `${item.tripId}:${this.activeTrip?.name || 'unknown'}`);
            
            // Add all expense fields from config
            Object.entries(AppConfig.config.googleForm.expenseFields).forEach(([key, fieldName]) => {
                if (key !== 'name' && key !== 'tripName' && item[key] !== undefined) {
                    formData.append(fieldName, item[key]);
                }
            });
            
            try {
                await fetch(AppConfig.config.googleForm.expenseActionUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData
                });
                
                newlySyncedItems.push({ ...item, syncDate: new Date().toISOString() });
            } catch (error) {
                console.error(`Failed to sync item with ID ${item.id}:`, error);
                remainingUnsynced.push(item); // Add back if sync failed
            }
        }
        
        // Update local storage
        if (newlySyncedItems.length > 0) {
            const currentSynced = this.getLocalData('syncedExpenses', true);
            localStorage.setItem(this.getStorageKey('syncedExpenses'), JSON.stringify([...currentSynced, ...newlySyncedItems]));
        }
        
        localStorage.setItem(this.getStorageKey('unsyncedExpenses'), JSON.stringify(remainingUnsynced));
        
        // Show result
        const modal = document.getElementById('message-modal');
        if(modal) modal.classList.add('hidden'); // Hide the "Syncing..." message

        if (newlySyncedItems.length > 0) {
            this.showMessage("Sync Complete", `${newlySyncedItems.length} expense(s) were successfully synced.`);
            this.renderExpenses();
        }
        
        if (remainingUnsynced.length > this.getLocalData('unsyncedExpenses', true).filter(d => d.tripId !== this.activeTrip?.id).length) {
             this.showMessage("Sync Incomplete", `Successfully synced ${newlySyncedItems.length} items. Some items failed to sync. Please check your connection and try again.`);
        }
    },
    
    async fetchExchangeRates() {
        if (!navigator.onLine) {
            this.showMessage('Offline', 'Cannot fetch rates while offline. Please enter them manually or connect to the internet.');
            return;
        }
        
        if (!this.activeTrip) return;

        this.showMessage('Fetching Rates...', 'Please wait while we get the latest exchange rates.');

        try {
            const baseCurrency = this.activeTrip.baseCurrency.toLowerCase();
            const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseCurrency}.json`);
            
            if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
            
            const data = await response.json();
            const rates = data[baseCurrency];
            
            this.activeTrip.currencies.forEach(curr => {
                const lowerCurr = curr.toLowerCase();
                if (curr !== this.activeTrip.baseCurrency && rates[lowerCurr]) {
                    this.conversionRates[curr] = rates[lowerCurr];
                }
            });
            
            this.lastRatesFetchDate = data.date;
            this.persistConversionRates();
            
            // Update UI
            document.getElementById('base-inputs').innerHTML = this.renderConversionInputs();
            this.updateSummaryDisplay();
            
            const ratesFetchNote = document.getElementById('rates-fetch-note');
            if (ratesFetchNote) {
                ratesFetchNote.textContent = `Rates updated as of ${this.lastRatesFetchDate}`;
                ratesFetchNote.classList.remove('hidden');
            }
            
            const modal = document.getElementById('message-modal');
            if(modal) modal.classList.add('hidden'); // Hide the "Fetching..." message
            this.showSuccess('Exchange rates updated successfully!');
            
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            this.showMessage('Error', `Failed to fetch exchange rates. Please enter them manually. Error: ${error.message}`);
        }
    },
    
    handleRateChange: function(input) {
        const currency = input.getAttribute('data-currency');
        const value = input.value.trim();
        
        if (value === '' || isNaN(parseFloat(value))) {
            delete this.conversionRates[currency];
        } else {
            const num = parseFloat(value);
            if (num >= 0) {
                this.conversionRates[currency] = num;
            }
        }
        
        this.persistConversionRates();
        
        if (this.summaryMode === 'base') {
            this.updateSummaryDisplay();
        }
    },
    
    persistConversionRates: function() {
        if (!this.activeTrip) return;
        
        try {
            const allRates = JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates'))) || {};
            allRates[this.activeTrip.id] = { 
                ...this.conversionRates, 
                lastFetchDate: this.lastRatesFetchDate 
            };
            localStorage.setItem(this.getStorageKey('conversionRates'), JSON.stringify(allRates));
        } catch (e) {
            console.error('Failed to persist conversion rates:', e);
        }
    },
    
    switchSummaryMode: function(mode) {
        if (this.summaryMode === mode) return;
        this.summaryMode = mode;
        
        // Update tab classes
        document.getElementById('summary-tab-local')?.classList.toggle('active', mode === 'local');
        document.getElementById('summary-tab-base')?.classList.toggle('active', mode === 'base');
        document.getElementById('base-conversion-panel')?.classList.toggle('hidden', mode !== 'base');

        this.updateSummaryDisplay();
    },
    
    updateSummaryDisplay: function() {
        const totalSummary = document.getElementById('total-expenses-summary');
        const categorySummary = document.getElementById('category-expenses-summary');
        
        if (totalSummary) totalSummary.innerHTML = this.renderTotalsSummary();
        if (categorySummary) categorySummary.innerHTML = this.renderCategorySummary();
    },
    
    renderExpenses: function() {
        const syncedList = document.getElementById('synced-list');
        const unsyncedList = document.getElementById('unsynced-list');
        
        if (!syncedList || !unsyncedList) return;
        
        const syncedData = this.getLocalData('syncedExpenses', true).filter(e => e.tripId === this.activeTrip.id).sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
        const unsyncedData = this.getLocalData('unsyncedExpenses', true).filter(e => e.tripId === this.activeTrip.id).sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
        
        syncedList.innerHTML = syncedData.map(item => 
            `<li>${item.amount} ${item.currency} for ${item.category} on ${item.expenseDate} (Synced)</li>`
        ).join('');
        
        unsyncedList.innerHTML = unsyncedData.map(item => 
            `<li>${item.amount} ${item.currency} for ${item.category} on ${item.expenseDate} (Unsynced)</li>`
        ).join('');

        document.getElementById('synced-header').style.display = syncedData.length > 0 ? 'block' : 'none';
        document.getElementById('unsynced-header').style.display = unsyncedData.length > 0 ? 'block' : 'none';
        
        this.updateSummaryDisplay();
    },
    
    exportData: function() {
        const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
        if (!user) {
            this.showMessage('Error', 'You must be logged in to export data.');
            return;
        }

        const allData = {
            user: { userId: user.userId, displayName: user.displayName },
            trips: this.getLocalData('trips'), // Already filtered for the current user
            syncedExpenses: this.getLocalData('syncedExpenses', true),
            unsyncedExpenses: this.getLocalData('unsyncedExpenses', true),
            conversionRates: JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates'))) || {}
        };
        
        const jsonData = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.showSuccess('Data export started!');
    },
    
    // Utility functions
    getStorageKey: function(key) {
        // Reverted to original prefix to read existing data
        return `lipikit_${key}`;
    },
    
    getLocalData: function(key, allUsers = false) {
        try {
            const data = JSON.parse(localStorage.getItem(this.getStorageKey(key))) || [];
            if (!Array.isArray(data)) return [];

            if (allUsers || key !== 'trips') {
                return data;
            }
            
            const user = ProfileManager ? ProfileManager.getCurrentUser() : null;
            const userId = user ? user.userId : null;
            return data.filter(item => item.userId === userId);

        } catch (e) {
            console.error(`Failed to parse data from localStorage for key ${key}:`, e);
            localStorage.removeItem(this.getStorageKey(key)); // Clear corrupted data
            return [];
        }
    },
    
    saveDataLocally: function(data, key) {
        try {
            const currentData = this.getLocalData(key, true);
            currentData.push(data);
            localStorage.setItem(this.getStorageKey(key), JSON.stringify(currentData));
        } catch (e) {
            console.error(`Failed to save data to localStorage for key ${key}:`, e);
            this.showMessage('Storage Error', 'Could not save data. Your browser storage might be full.');
        }
    },
    
    getAllExpenses: function() {
        if (!this.activeTrip) return [];
        
        const synced = this.getLocalData('syncedExpenses', true).filter(e => e.tripId === this.activeTrip.id);
        const unsynced = this.getLocalData('unsyncedExpenses', true).filter(e => e.tripId === this.activeTrip.id);
        
        return [...synced, ...unsynced];
    },
    
    // Updated showMessage function to handle HTML content properly

showMessage: function(title, message, isConfirmation = false, isHtml = false) {
    return new Promise((resolve) => {
        // Create or get message modal
        let modal = document.getElementById('message-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'message-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2 id="message-modal-title"></h2>
                    <div id="message-modal-body"></div>
                    <div id="message-modal-actions" class="form-actions">
                        <button id="message-modal-close" class="btn btn-primary btn-full mt-4">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Set content
        document.getElementById('message-modal-title').textContent = title;
        const bodyElement = document.getElementById('message-modal-body');
        
        // Use innerHTML for HTML content, textContent for plain text
        if (isHtml) {
            bodyElement.innerHTML = message;
        } else {
            bodyElement.textContent = message;
        }

        // Handle confirmation mode
        const actionsDiv = document.getElementById('message-modal-actions');
        if (isConfirmation) {
            actionsDiv.innerHTML = `
                <button id="message-modal-cancel" class="btn btn-secondary">Cancel</button>
                <button id="message-modal-confirm" class="btn btn-primary">Confirm</button>
            `;
        } else {
            // For help modals, completely hide the actions div
            if (title === 'Helpful Resources' || title === 'Item Help') {
                actionsDiv.style.display = 'none';
            } else {
                actionsDiv.style.display = 'block';
                actionsDiv.innerHTML = `
                    <button id="message-modal-close" class="btn btn-primary btn-full mt-4">OK</button>
                `;
            }
        }

        // Show modal
        modal.classList.remove('hidden');

        // Event listeners
        if (isConfirmation) {
            const confirmBtn = document.getElementById('message-modal-confirm');
            const cancelBtn = document.getElementById('message-modal-cancel');
            const closeBtn = modal.querySelector('.close-button');

            const confirmHandler = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', confirmHandler);
                cancelBtn.removeEventListener('click', cancelHandler);
                closeBtn.removeEventListener('click', cancelHandler);
                resolve(true);
            };

            const cancelHandler = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', confirmHandler);
                cancelBtn.removeEventListener('click', cancelHandler);
                closeBtn.removeEventListener('click', cancelHandler);
                resolve(false);
            };

            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            closeBtn.addEventListener('click', cancelHandler);
        } else {
            const closeBtn = modal.querySelector('.close-button');
            const okBtn = document.getElementById('message-modal-close');

            const closeHandler = () => {
                modal.classList.add('hidden');
                if (okBtn) okBtn.removeEventListener('click', closeHandler);
                closeBtn.removeEventListener('click', closeHandler);
                // Reset actions div display for future use
                actionsDiv.style.display = 'block';
                resolve(false);
            };

            if (okBtn) okBtn.addEventListener('click', closeHandler);
            closeBtn.addEventListener('click', closeHandler);
            
            // Also allow clicking outside the modal to close for help modals
            if (title === 'Helpful Resources' || title === 'Item Help') {
                const outsideClickHandler = (e) => {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                        modal.removeEventListener('click', outsideClickHandler);
                        closeBtn.removeEventListener('click', closeHandler);
                        actionsDiv.style.display = 'block';
                        resolve(false);
                    }
                };
                modal.addEventListener('click', outsideClickHandler);
            }
        }
    });
},

    showSuccess: function(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    },
    
    showError: function(message) {
        // Prefer showing error in a specific UI element if available
        const errorDiv = document.getElementById('trip-date-message') || document.querySelector('#pin-modal-message');
        
        if (errorDiv && !errorDiv.closest('.hidden')) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        } else {
            // Fallback to a modal for general errors
            this.showMessage('Error', message);
        }
    },
    
    updateNetworkStatus: function() {
        const updateStatus = () => {
            const isOnline = navigator.onLine;
            document.querySelectorAll('#status-dot').forEach(dot => {
                dot.style.backgroundColor = isOnline ? 'var(--success-color)' : 'var(--danger-color)';
            });
            document.querySelectorAll('#status-text').forEach(text => {
                text.textContent = isOnline ? 'Online' : 'Offline';
            });
        };
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus(); // Initial call
    },

    // Date formatting utility for mobile display
    formatDateForDisplay: function(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const isCurrentYear = date.getFullYear() === now.getFullYear();
            
            const options = {
                month: 'short',
                day: 'numeric'
            };
            
            if (!isCurrentYear) {
                options.year = 'numeric';
            }
            
            return date.toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    },

    // Trip duration calculation
    calculateTripDuration: function(startDate, endDate) {
        if (!startDate || !endDate) return 'Duration unknown';
        
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
            
            if (diffDays === 1) return '1 day';
            if (diffDays < 7) return `${diffDays} days`;
            if (diffDays < 14) return `${Math.floor(diffDays / 7)} week`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
            if (diffDays < 60) return `${Math.floor(diffDays / 30)} month`;
            return `${Math.floor(diffDays / 30)} months`;
        } catch (e) {
            return 'Duration unknown';
        }
    },

    // Countries display formatting
    formatCountriesDisplay: function(countries) {
        if (!countries || !Array.isArray(countries) || countries.length === 0) {
            return '';
        }
        
        if (countries.length === 1) {
            return `<span class="currency-name">📍 ${countries[0]}</span>`;
        }
        
        if (countries.length <= 3) {
            return `<span class="currency-name">📍 ${countries.join(', ')}</span>`;
        }
        
        return `<span class="currency-name">📍 ${countries.slice(0, 2).join(', ')} +${countries.length - 2} more</span>`;
    },

    // Get all expenses for a specific trip
    getAllExpensesForTrip: function(tripId) {
        if (!tripId) return [];
        
        const synced = this.getLocalData('syncedExpenses', true).filter(e => e.tripId === tripId);
        const unsynced = this.getLocalData('unsyncedExpenses', true).filter(e => e.tripId === tripId);
        
        return [...synced, ...unsynced];
    },

    // HTML escaping utility
    escapeHtml: function(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Format trip dates for dashboard display
    formatTripDates: function() {
        if (!this.activeTrip) return '';
        
        const start = this.formatDateForDisplay(this.activeTrip.start || this.activeTrip.startDate);
        const end = this.formatDateForDisplay(this.activeTrip.end || this.activeTrip.endDate);
        const duration = this.calculateTripDuration(this.activeTrip.start || this.activeTrip.startDate, this.activeTrip.end || this.activeTrip.endDate);
        
        return `${start} - ${end} (${duration})`;
    },

    // Calculate trip total for dashboard
    calculateTripTotal: function() {
        const expenses = this.getAllExpenses();
        if (expenses.length === 0) return '0';
        
        const totalsByCurrency = {};
        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount) || 0;
            const currency = expense.currency;
            
            if (amount > 0 && currency) {
                totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;
            }
        });
        
        const currencies = Object.keys(totalsByCurrency);
        if (currencies.length === 0) return '0';
        if (currencies.length === 1) {
            const currency = currencies[0];
            return `${totalsByCurrency[currency].toLocaleString()} ${currency}`;
        }
        
        return `${currencies.length} currencies`;
    },

    // ... after calculateTripTotal function ...

    /**
     * Renders a container for an AdSense ad unit.
     * Reads the ad tag from AppConfig.config.adtag.
     * @returns {string} HTML string for the ad container or an empty string.
     */
    renderAdsenseBlock: function() {
    // Get the ad tag from AppSettingsManager instead of AppConfig
    const adTag = AppSettingsManager?.appSettings?.adtag || 
                  AppSettingsManager?.getDefaultSettings?.()?.adtag || 
                  '';
    
    console.log('renderAdsenseBlock called, adTag:', adTag.substring(0, 100) + '...');
    
    if (adTag.trim() !== '') {
        return `
            <div class="adsense-container" data-ad-initialized="false" style="margin: 1rem 0;">
                ${adTag}
            </div>
        `;
    }
    
    // Fallback placeholder when no ad tag is configured
    console.warn('No AdSense tag configured');
    return `
        <div class="adsense-container" data-ad-initialized="false" style="margin: 1rem 0;">
            <div style="min-height:90px; background:#f9f9f9; border:2px dashed #ddd; 
                        display:flex; align-items:center; justify-content:center; 
                        color:#888; font-size:14px; border-radius:8px;">
                [No Configuration Found]
            </div>
        </div>
    `;
},

    /**
     * Initializes any new, uninitialized AdSense ad units on the page.
     * This is crucial for single-page apps where content is added dynamically.
     */
    initializeAds: function() {
    console.log('initializeAds called');
    const adContainers = document.querySelectorAll('.adsense-container[data-ad-initialized="false"]');
    console.log('Found ad containers:', adContainers.length);

    adContainers.forEach((container, index) => {
        console.log(`Processing ad container ${index + 1}:`, container);
        
        try {
            // Check if adsbygoogle script is loaded and available
            if (typeof window.adsbygoogle !== 'undefined' && window.adsbygoogle) {
                console.log('AdSense script found, initializing ad...');
                
                // Find the actual ad element inside the container
                const adElement = container.querySelector('ins.adsbygoogle');
                if (adElement) {
                    console.log('Found ad element, pushing to adsbygoogle queue');
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    container.dataset.adInitialized = 'true';
                    console.log('Ad initialized successfully');
                } else {
                    console.warn('No ins.adsbygoogle element found in container');
                }
            } else {
                console.warn('script not available, showing placeholder');
                
                // Enhanced placeholder for development/testing
                container.innerHTML = `
                    <div style="min-height:90px; background:linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                                background-size: 20px 20px;
                                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                                border:2px dashed #aaa; 
                                display:flex; align-items:center; justify-content:center; 
                                color:#666; font-weight:bold; font-size:14px; 
                                border-radius:8px; position:relative;">
                        <div style="background:white; padding:8px 16px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                            [ # ${index + 1}]
                            <br><small style="font-weight:normal; color:#888;">[ Coming soon: Ad space ]</small>
                        </div>
                    </div>
                `;
                container.dataset.adInitialized = 'true';
            }
        } catch (error) {
            console.error('Error initializing AdSense ad:', error);
            container.innerHTML = `
                <div style="min-height:90px; background:#ffebee; border:2px dashed #f44336; 
                            display:flex; align-items:center; justify-content:center; 
                            color:#d32f2f; font-size:14px; border-radius:8px;">
                    [AdSense Error: ${error.message}]
                </div>
            `;
            container.dataset.adInitialized = 'true';
        }
    });
},

    // ... next function (Checklist Management Methods etc.) ...

    // Checklist Management Methods
    async loadChecklistMaster() {
        if (typeof DatasetManager === 'undefined') {
            console.error('DatasetManager not available');
            return false;
        }

        try {
            if (typeof AppSettings === 'undefined' && typeof AppSettingsManager !== 'undefined') {
                window.AppSettings = {
                    datasets: AppSettingsManager.appSettings?.datasets || AppSettingsManager.getDefaultSettings().datasets
                };
            }

            const checklistKey = 'checklist'; // Ensure this is a string
            console.log(`Loading checklist dataset with key: ${checklistKey}`);

            // Pass the key as a string, not an object
            const loadResult = await DatasetManager.load_dataset_with_check(checklistKey, { skipRemote: true });
            if (!loadResult.ok) {
                console.error('Failed to load checklist dataset:', loadResult.error);
                return false;
            }

            const datasetResult = await DatasetManager.getDataset(checklistKey);
            if (!datasetResult.ok) {
                console.error('Failed to get checklist dataset:', datasetResult.error);
                return false;
            }

            // Handle the correct dataset format
            const rawData = datasetResult.data;
            if (rawData && rawData.items && Array.isArray(rawData.items)) {
                this.checklistMasterData = rawData.items;
            } else {
                console.error('Checklist dataset has unexpected format:', rawData);
                return false;
            }

            console.log('Checklist dataset loaded successfully:', this.checklistMasterData);
            return true;
        } catch (error) {
            console.error('Error loading checklist dataset:', error);
            return false;
        }
    },

    async initChecklistDB(tripId) {
        if (!tripId) return false;

        const dbName = `lipikit_check_${tripId}`;
        
        try {
            const db = await this.openChecklistDB(dbName);
            console.log(`Checklist database initialized: ${dbName}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize checklist database:', error);
            return false;
        }
    },

    async openChecklistDB(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            
            request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('checklist')) {
                    const store = db.createObjectStore('checklist', { keyPath: 'checklistId' });
                    store.createIndex('checklistId', 'checklistId', { unique: true });
                    store.createIndex('status', 'status', { unique: false });
                }
            };
        });
    },

    async getChecklistDB(tripId) {
        if (!tripId) throw new Error('Trip ID is required');

        if (!this.checklistDatabases) this.checklistDatabases = {};
        if (!this.checklistDatabases[tripId]) {
            try {
                this.checklistDatabases[tripId] = await this.openChecklistDB(`lipikit_check_${tripId}`);
            } catch (error) {
                throw new Error(`Failed to open checklist database: ${error.message}`);
            }
        }
        return this.checklistDatabases[tripId];
    },

    async loadTripChecklist(tripId) {
        try {
            const db = await this.getChecklistDB(tripId);
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['checklist'], 'readonly');
                const store = transaction.objectStore('checklist');
                const request = store.getAll();
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        } catch (error) {
            console.error('Error loading trip checklist:', error);
            return [];
        }
    },

    async toggleChecklistItem(tripId, checklistId, isDone) {
        try {
            const db = await this.getChecklistDB(tripId);
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['checklist'], 'readwrite');
                const store = transaction.objectStore('checklist');
                
                const request = store.put({
                    checklistId,
                    status: isDone ? 'Done' : 'Not Done',
                    updatedAt: new Date().toISOString()
                });
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(true);
            });
        } catch (error) {
            console.error('Error toggling checklist item:', error);
            return false;
        }
    },

    // Pending changes for customize view
    pendingChecklistChanges: {
        additions: new Set(),
        removals: new Set()
    },

    async applyChecklistChanges(tripId) {
        try {
            const db = await this.getChecklistDB(tripId);
            const transaction = db.transaction(['checklist'], 'readwrite');
            const store = transaction.objectStore('checklist');

            // Process removals
            for (const checklistId of this.pendingChecklistChanges.removals) {
                await store.delete(checklistId);
            }

            // Process additions
            for (const checklistId of this.pendingChecklistChanges.additions) {
                await store.put({
                    checklistId,
                    status: 'Not Done',
                    updatedAt: new Date().toISOString()
                });
            }

            // Clear pending changes
            this.pendingChecklistChanges.additions.clear();
            this.pendingChecklistChanges.removals.clear();

            return true;
        } catch (error) {
            console.error('Error applying checklist changes:', error);
            return false;
        }
    },

    async checkChecklistExists(tripId) {
        try {
            const db = await this.getChecklistDB(tripId);
            return new Promise((resolve) => {
                const transaction = db.transaction(['checklist'], 'readonly');
                const store = transaction.objectStore('checklist');
                const countRequest = store.count();
                
                countRequest.onsuccess = () => resolve(countRequest.result > 0);
                countRequest.onerror = () => resolve(false);
            });
        } catch (error) {
            console.error('Error checking checklist existence:', error);
            return false;
        }
    },

// Update the renderChecklistView method to match expense view structure
renderChecklistView: async function(defaultTab = 'view-checklist') {
    const appArea = document.getElementById('app-area');
    if (!this.activeTrip) return;

    // Load checklist master data
    if (!this.checklistMasterData) {
        const loaded = await this.loadChecklistMaster();
        if (!loaded) {
            this.showError('Failed to load checklist data');
            return;
        }
    }

    const status = this.getTripStatusTag(this.activeTrip);
    const statusHtml = status ? `<span class="trip-tag ${status.className}">${status.label}</span>` : "";

    appArea.innerHTML = `
        <div class="card checklist-view">
            <div class="trip-header-bar">
                <button type="button" id="back-to-dashboard-btn" class="btn btn-secondary">&larr; Back to Dashboard</button>
            </div>
            
            <h1 class="trip-view-title">
                Trip: <span style="color: var(--primary-color);">${this.activeTrip.name}</span>
                ${statusHtml}
            </h1>

            <div class="tab-header">
                <button class="tab-btn ${defaultTab === 'view-checklist' ? 'active' : ''}" data-tab="view-checklist">View Checklist</button>
                <button class="tab-btn ${defaultTab === 'customize-checklist' ? 'active' : ''}" data-tab="customize-checklist">Customize</button>
            </div>

            <div id="view-checklist" class="tab-content ${defaultTab === 'view-checklist' ? 'active' : ''}">
                ${await this.renderViewChecklistTab()}            ${this.renderAdsenseBlock()}

            </div>

            <div id="customize-checklist" class="tab-content ${defaultTab === 'customize-checklist' ? 'active' : ''}">
                ${await this.renderCustomizeChecklistTab()}            ${this.renderAdsenseBlock()}

            </div>
        </div>
    `;

    // Bind events for tabs and buttons
    this.bindChecklistEvents();
    
    // Scroll to top for better user experience
    this.scrollToTop();

            // Initialize any ads that were just rendered
        this.initializeAds();
    },

    // Utility function to scroll to top smoothly
    scrollToTop: function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

async renderViewChecklistTab() {
    const exists = await this.checkChecklistExists(this.activeTrip.id);
    
    if (!exists) {
        return `
            <div class="empty-state">
                <h3>No Checklist Items Yet</h3>
                <p>You haven't customized your checklist yet. Switch to the Customize tab to add items to your checklist.</p>
            </div>
        `;
    }

    const tripChecklist = await this.loadTripChecklist(this.activeTrip.id);
    const categorizedItems = this.categorizeMasterChecklist(tripChecklist);

    // Clear and rebuild links data storage
    this.checklistLinksData = {};

    return `
        <p class="currency-name mb-4">Check off items as you complete them</p>
        <div class="checklist-container">
            ${Object.entries(categorizedItems).map(([category, items]) => `
                <div class="checklist-category">
                    <h3>${category}</h3>
                    <div class="checklist-table">
                        ${items.map(item => {
                            const itemId = item.checklistId || item.id;
                            const links = item.links || [];
                            const tags = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
                            
                            // Store links data in global object
                            this.checklistLinksData[itemId] = {
                                tags: tags,
                                description: item.description || '',
                                links: links
                            };
                            
                            return `
                                <div class="checklist-row" data-id="${itemId}">
                                    <div class="checklist-checkbox">
                                        <input type="checkbox" 
                                               id="check-${itemId}"
                                               ${item.status === 'Done' ? 'checked' : ''} 
                                               data-checklist-id="${itemId}">
                                    </div>
                                    <div class="item-label">
                                        <label for="check-${itemId}">${item.text}</label>
                                    </div>
                                    <div class="item-help">
                                        <button class="help-btn" 
                                                data-item-id="${itemId}"
                                                title="Get helpful resources and links">
                                            📋 Resources
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
},

async renderCustomizeChecklistTab() {
    const tripChecklist = await this.loadTripChecklist(this.activeTrip.id);
    const existingIds = new Set(tripChecklist.map(item => item.checklistId));
    const categorizedItems = this.categorizeMasterChecklist(this.checklistMasterData, existingIds);

    // Clear and rebuild links data storage
    this.checklistLinksData = {};

    return `
        <p class="currency-name mb-4">Add or remove items from your trip checklist</p>
        
        <div class="form-actions mb-4 flex items-center gap-3">
            <button id="save-checklist-changes" class="btn btn-primary">Save Changes</button>
            
            <button id="refresh-checklist" 
                    class="btn btn-secondary" 
                    title="Get more suggestions from our secure servers">
                Get More Suggestions
            </button>
        </div>

        <div class="checklist-container">
            ${Object.entries(categorizedItems).map(([category, items]) => `
                <div class="checklist-category">
                    <h3>${category}</h3>
                    <div class="checklist-table">
                        ${items.map(item => {
                            const links = item.links || [];
                            const tags = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
                            
                            // Store links data in global object
                            this.checklistLinksData[item.id] = {
                                tags: tags,
                                description: item.description || '',
                                links: links
                            };
                            
                            return `
                                <div class="checklist-row" data-id="${item.id}">
                                    <div class="item-label">
                                        <label>${item.text}</label>
                                    </div>
                                    <div class="item-help">
                                        <!-- optional per-item help button -->
                                    </div>
                                    <div class="item-actions">
                                        <button class="toggle-item-btn btn ${existingIds.has(item.id) ? 'btn-danger' : 'btn-success'}"
                                                data-checklist-id="${item.id}">
                                            ${existingIds.has(item.id) ? 'Remove' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
},


categorizeMasterChecklist(items, existingIds = null) {
    const categorized = {};
    
    // If we're working with trip checklist items, merge with master data
    const masterItems = this.checklistMasterData || [];
    let processedItems;
    
    if (existingIds) {
        // For customize view - use master items directly
        processedItems = masterItems;
    } else {
        // For view tab - merge trip items with master data
        processedItems = items.map(item => {
            const masterItem = masterItems.find(mi => mi.id === item.checklistId);
            if (masterItem) {
                // Ensure all master item properties (including links) are included
                return { 
                    ...masterItem, 
                    ...item,
                    // Keep the master item's links, tags, etc.
                    links: masterItem.links,
                    tags: masterItem.tags,
                    description: masterItem.description
                };
            }
            return item;
        });
    }

    processedItems.forEach(item => {
        if (!item) return; // Skip null/undefined items
        
        const category = item.category || 'Uncategorized';
        if (!categorized[category]) {
            categorized[category] = [];
        }
        categorized[category].push(item);
    });

    // Sort categories alphabetically and items within each category
    const sortedCategorized = {};
    Object.keys(categorized).sort().forEach(category => {
        sortedCategorized[category] = categorized[category].sort((a, b) => {
            const textA = (a.text || '').toLowerCase();
            const textB = (b.text || '').toLowerCase();
            return textA.localeCompare(textB);
        });
    });

    return sortedCategorized;
},

bindChecklistEvents() {
    const appArea = document.getElementById('app-area');
    if (!appArea) return;

    // Keep one handler reference to avoid duplicate listeners
    if (!this._checklistClickHandler) {
        this._checklistClickHandler = async (e) => {
            // Only handle events within checklist-view
            const checklistViewRoot = e.target.closest('.checklist-view');
            if (!checklistViewRoot) return;

            // Tab button (use closest to catch clicks on child elements)
            const tabBtn = e.target.closest('.tab-btn');
            if (tabBtn && checklistViewRoot.contains(tabBtn)) {
                // Get current active tab
                const currentActiveBtn = checklistViewRoot.querySelector('.tab-btn.active');
                const currentTab = currentActiveBtn ? currentActiveBtn.dataset.tab : null;

                // Unsaved changes guard: Check when LEAVING the customize tab
                if (currentTab === 'customize-checklist' &&
                    tabBtn.dataset.tab !== 'customize-checklist' &&
                    this.pendingChecklistChanges.additions.size + this.pendingChecklistChanges.removals.size > 0) {
                    
                    const confirmed = await this.showMessage(
                        'Unsaved Changes',
                        'You have unsaved changes. Are you sure you want to discard them?',
                        true // Enable confirmation mode
                    );
                    if (!confirmed) {
                        return; // Prevent tab switch
                    }
                    // Discard changes
                    this.pendingChecklistChanges.additions.clear();
                    this.pendingChecklistChanges.removals.clear();
                }

                // Update tab states
                checklistViewRoot.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                checklistViewRoot.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                tabBtn.classList.add('active');
                const content = document.getElementById(tabBtn.dataset.tab);
                if (content) {
                    // When activating a tab, always re-render its contents freshly
                    if (tabBtn.dataset.tab === 'customize-checklist') {
                        content.classList.add('active');
                        content.innerHTML = await this.renderCustomizeChecklistTab();
                    } else if (tabBtn.dataset.tab === 'view-checklist') {
                        content.classList.add('active');
                        content.innerHTML = await this.renderViewChecklistTab();
                    } else {
                        content.classList.add('active');
                    }
                }
                return;
            }

            // Add/Remove toggle in Customize tab
            const toggleBtn = e.target.closest('.toggle-item-btn');
            if (toggleBtn && checklistViewRoot.contains(toggleBtn)) {
                const checklistId = toggleBtn.dataset.checklistId;
                const isCurrentlyAdded = toggleBtn.classList.contains('btn-danger');

                if (isCurrentlyAdded) {
                    this.pendingChecklistChanges.removals.add(checklistId);
                    this.pendingChecklistChanges.additions.delete(checklistId);
                    toggleBtn.classList.remove('btn-danger');
                    toggleBtn.classList.add('btn-success');
                    toggleBtn.textContent = 'Add';
                } else {
                    this.pendingChecklistChanges.additions.add(checklistId);
                    this.pendingChecklistChanges.removals.delete(checklistId);
                    toggleBtn.classList.remove('btn-success');
                    toggleBtn.classList.add('btn-danger');
                    toggleBtn.textContent = 'Remove';
                }
                return;
            }

            // Help button - UPDATED to handle links with debugging
            const helpBtn = e.target.closest('.help-btn');
            if (helpBtn && checklistViewRoot.contains(helpBtn)) {
                const itemId = helpBtn.dataset.itemId;
                
                console.log('Help button clicked for item:', itemId);
                
                // Get data from global storage
                const itemData = this.checklistLinksData[itemId];
                
                if (itemData) {
                    console.log('Found item data:', itemData);
                    this.showChecklistHelp(itemData.tags, itemData.description, itemData.links);
                } else {
                    console.warn('No data found for item:', itemId);
                    this.showChecklistHelp('', '', []);
                }
                return;
            }

            // Save changes
            const saveBtn = e.target.closest('#save-checklist-changes');
            if (saveBtn && checklistViewRoot.contains(saveBtn)) {
                const success = await this.applyChecklistChanges(this.activeTrip.id);
                if (success) {
                    this.showSuccess('Checklist updated successfully!');
                    // Clear pending changes
                    this.pendingChecklistChanges.additions.clear();
                    this.pendingChecklistChanges.removals.clear();

                    // Refresh both tabs so View shows latest and Customize shows new state
                    const viewTab = document.getElementById('view-checklist');
                    const customizeTab = document.getElementById('customize-checklist');
                    if (viewTab) viewTab.innerHTML = await this.renderViewChecklistTab();
                    if (customizeTab && customizeTab.classList.contains('active')) {
                        customizeTab.innerHTML = await this.renderCustomizeChecklistTab();
                    }
                } else {
                    this.showError('Failed to update checklist. Please try again.');
                }
                return;
            }

            // 🔄 NEW: Refresh checklist from server
            const refreshBtn = e.target.closest('#refresh-checklist');
            if (refreshBtn && checklistViewRoot.contains(refreshBtn)) {
                try {
                    const checklistKey = 'checklist'; // Ensure this is a string
                    console.log(`Loading checklist dataset with key: ${checklistKey}`);

                    // Pass the key as a string, not an object
                    const loadResult = await DatasetManager.load_dataset_with_check(checklistKey);
                    if (!loadResult.ok) {
                        console.error('Failed to load checklist dataset:', loadResult.error);
                        return false;
                    }
                    this.showSuccess('Got more suggestions from our servers ✅');
                      // view refresh with new data.
                    this.renderChecklistView('customize-checklist');

                    const customizeTab = document.getElementById('customize-checklist');
                    if (customizeTab && customizeTab.classList.contains('active')) {
                        customizeTab.innerHTML = await this.renderCustomizeChecklistTab();
                    }
                } catch (err) {
                    console.error('Refresh failed:', err);
                    this.showError('Could not fetch new suggestions. Please try again later.');
                }
                return;
            }

            // Back to dashboard
            const backBtn = e.target.closest('#back-to-dashboard-btn');
            if (backBtn && checklistViewRoot.contains(backBtn)) {
                if (this.pendingChecklistChanges.additions.size + this.pendingChecklistChanges.removals.size > 0) {
                    const confirmed = await this.showMessage(
                        'Unsaved Changes',
                        'You have unsaved changes. Are you sure you want to discard them?',
                        true
                    );
                    if (!confirmed) {
                        return;
                    }
                }
                this.pendingChecklistChanges.additions.clear();
                this.pendingChecklistChanges.removals.clear();
                this.currentTripView = 'dashboard';
                this.renderApp();
                return;
            }
        };

        appArea.addEventListener('click', this._checklistClickHandler);
    }

    // Checkbox status toggle in View tab - use change event and a single handler
    if (!this._checklistChangeHandler) {
        this._checklistChangeHandler = async (e) => {
            if (e.target.matches('.checklist-view input[type="checkbox"][data-checklist-id]')) {
                const checklistId = e.target.dataset.checklistId;
                const success = await this.toggleChecklistItem(this.activeTrip.id, checklistId, e.target.checked);
                if (!success) {
                    e.target.checked = !e.target.checked;
                    this.showError('Failed to update checklist item. Please try again.');
                }
            }
        };
        appArea.addEventListener('change', this._checklistChangeHandler);
    }
}
,

debugChecklistMaster() {
    console.log('=== CHECKLIST DEBUG ===');
    console.log('checklistMasterData:', this.checklistMasterData);
    if (this.checklistMasterData && this.checklistMasterData.length > 0) {
        console.log('First item sample:', this.checklistMasterData[0]);
        console.log('Items with links:');
        this.checklistMasterData.forEach(item => {
            if (item.links && item.links.length > 0) {
                console.log(`  ${item.id}: ${item.links.length} links`);
            }
        });
    } else {
        console.log('No master data loaded!');
    }
    console.log('=== END DEBUG ===');
},

// Updated showChecklistHelp to use HTML mode
showChecklistHelp(tags, description, links = []) {
    let content = '';
    
    // Add tags if available
    if (tags && tags.trim()) {
        content += `<p class="help-tags" style="font-weight: bold; color: var(--primary-color); margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-light); border-radius: 4px; border-left: 4px solid var(--primary-color);">${tags}</p>`;
    }
    
    // Add description if available
    if (description && description.trim()) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const descWithLinks = description.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        content += `<p class="help-description" style="margin-bottom: 1.5rem; line-height: 1.6; color: var(--text-medium);">${descWithLinks}</p>`;
    }
    
    // Add links section if available
    if (Array.isArray(links) && links.length > 0) {
        content += '<div class="help-links" style="margin-bottom: 1rem;">';
        content += '<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">';
        
        links.forEach(link => {
            if (link && link.url && link.label) {
                content += `<a href="${link.url}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; 
                          background: var(--primary-color); color: white; text-decoration: none; 
                          border-radius: 6px; font-size: 0.9rem; font-weight: 500; 
                          transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                   onmouseover="this.style.backgroundColor='var(--primary-hover)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                   onmouseout="this.style.backgroundColor='var(--primary-color)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                    ${this.escapeHtml(link.label)} <span style="font-size: 0.8rem;">↗</span>
                </a>`;
            }
        });
        
        content += '</div>';
        content += '</div>';
    }
    
    // If no content, show a helpful message
    if (!content.trim()) {
        content = '<p style="text-align: center; color: var(--text-light); font-style: italic; padding: 2rem;">No additional resources available for this item.</p>';
    }
    
    // Show modal with HTML content
    this.showMessage('Helpful Resources', content, false, true);
}

};