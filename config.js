// config.js - Trip Tracker Configuration
const AppConfig = {
    // App Configuration
    config: {
        appName: 'Trips',
        appVersion: 'v0.0.4',
        appDescription: 'Effortlessly track trip expenses, manage currency conversions, and create summary reports, even offline. Your ultimate free PWA for travel budgeting.',
        companyName: 'LipiKit',
        
/*        // Trip Tracker Color Theme (Purple theme)
        colors: {
            primary: '#9333ea',
            primaryHover: '#7c3aed',
            secondary: '#6b7280',
            secondaryHover: '#4b5563',
            success: '#059669',
            successHover: '#047857',
            danger: '#dc2626',
            dangerHover: '#b91c1c',
            backgroundGradient: 'linear-gradient(135deg, #f3e8ff 0%, #e5e7eb 100%)',
            headerGradient: 'linear-gradient(to right, #F78E69, #F1BB87)'   

        },
*/
       // Trip Tracker Color Theme (SOOTHING VIBRANT theme)
colors: {
    primary: '#14B8A6',         // teal
    primaryHover: '#0D9488',
    secondary: '#334155',       // slate gray
    secondaryHover: '#1E293B',
    success: '#22C55E',         // emerald
    successHover: '#15803D',
    danger: '#E11D48',          // crimson
    dangerHover: '#9F1239',
    backgroundGradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    headerGradient: 'linear-gradient(to right, #14B8A6, #334155)'  // teal → slate
}


,
        
        // Trip-specific configurations
        categories: ["Food", "Transport", "Accommodation", "Shopping", "Activities", "Groceries", "Other"],
        currencies: ["INR", "USD", "EUR", "SGD", "THB", "MYR", "VND", "GBP", "JPY", "CAD", "AUD"],
        currencyNames: {
            INR: "Indian Rupee", USD: "United States Dollar", EUR: "Euro", SGD: "Singapore Dollar",
            THB: "Thai Baht", MYR: "Malaysian Ringgit", VND: "Vietnamese Dong", GBP: "British Pound Sterling",
            JPY: "Japanese Yen", CAD: "Canadian Dollar", AUD: "Australian Dollar"
        },
        modes: ["Cash", "Credit Card", "Prepaid Card"],
        
        // Google Forms Configuration for Analytics & Data Sync
        googleForm: {
            // Main expense data form
            expenseActionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdkfyEAqMf5h0rLPWuXw1PmywLct2-3VbIfSQu4iyEc2bLo9Q/formResponse',
            expenseFields: {
                name: 'entry.1731583832',           // userId:displayName
                tripName: 'entry.1093227282',       // tripName:baseCurrency
                expenseDate: 'entry.505163115',
                amount: 'entry.1623455754',
                currency: 'entry.1004211902',
                category: 'entry.59253883',
                place: 'entry.283121596',
                notes: 'entry.261715790',
                location: 'entry.56139846',
                mode: 'entry.1829164279'
            },
            
            // Diagnostics form
            diagActionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfAbtJTg-IequMyIVZU_LaskIyfL9_lAhTdcDfl09MsBF1dIg/formResponse',
            diagFields: {
                installUserInfo: 'entry.975398843',  // InstallId|UserId|DisplayName|Version
                timestamp: 'entry.626283681',        // Timestamp
                eventData: 'entry.738839204'         // Event|DeviceInfo
            }
        },
        
        // PIN validation (hashed PINs for sync security)
        hashedPins: [
            "07625cda1ed6dad6aa4cf70c899207812c2b8bc99e2f0774bc321e9b6573113c",
            "9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0", 
            "07334386287751ba02a4588c1a0875dbd074a61bd9e6ab7c48d244eacd0c99e0",
            "0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c"
        ],
        
        // Local Storage Keys
        storageKeys: {
            installId: 'lipikit_installId', // Updated to match profile.js
            userId: 'lipikit_currentUser',
            userProfile: 'lipikit_userProfile',
            appData: 'lipikit_trip_data',
            trips: 'tripList',
            activeTrip: 'activeTrip',
            unsyncedExpenses: 'unsyncedExpenses',
            syncedExpenses: 'syncedExpenses',
            conversionRates: 'tripConversionRatesBase',
            appSettings: 'lipikit_trip_settings'
        },
        
        // External Links
        links: {
            lipikit: 'https://lipikit.com',
            founder: 'https://PriyankaDatar.com',
            support: 'mailto:connect@sparkyminis.com',
            privacy: 'https://lipikit.com/privacy',
            terms: 'https://lipikit.com/terms'
        },
        
        // API Configuration
        exchangeRateApi: {
            primary: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            fallback: 'https://latest.currency-api.pages.dev/v1/currencies'
        },
        
        // Feature flags
        features: {
            getIP: true,
            offlineMode: true,
            syncEnabled: true,
            locationCapture: true,
            exchangeRates: true
        },

        data: {
            dataUrl: "https://data.lipikit.com/",   // base remote data domain
            remoteDataFolder: "trips/",             // remote dataset folder
            localDataFolder: "/data/",             // bundled local dataset folder
            versionFileName: "version",        // version file name
            datasetPrefix: "lipikit_data_",               // prefix for localStorage/DB keys
            versionStorageKey: "version_json"       // logical key name for version.json in storage
    },

    },
    
    init: function() {
        this.applyConfiguration();
        this.applyTheme();
        this.updateAppInfo();
    },
    
    applyConfiguration: function() {
        // Update page title and meta
        document.title = `${this.config.companyName} ${this.config.appName}`;
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = document.title;
        
        // Update header if elements exist
        const companyName = document.getElementById('company-name');
        const appName = document.getElementById('app-name');
        if (companyName) companyName.textContent = this.config.companyName;
        if (appName) appName.textContent = this.config.appName;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = this.config.appDescription;
        }
        
        // Update theme color
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) {
            themeColor.content = this.config.colors.primary;
        }
        
        // Update app version in footer
        const appVersion = document.getElementById('app-version');
        const appVersionFooter = document.getElementById('app-version-footer');
        if (appVersion) appVersion.textContent = this.config.appVersion;
        if (appVersionFooter) appVersionFooter.textContent = this.config.appVersion;
    },
    
    applyTheme: function() {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.config.colors.primary);
        root.style.setProperty('--primary-hover', this.config.colors.primaryHover);
        root.style.setProperty('--background-gradient', this.config.colors.backgroundGradient);
        if (this.config.colors.headerGradient) {
            root.style.setProperty('--header-gradient', this.config.colors.headerGradient);
        }

        // Apply to body background if needed
        document.body.style.background = this.config.colors.backgroundGradient;
    },

    
    updateAppInfo: function() {
        const appInfoBlock = document.getElementById('app-info-block');
        if (appInfoBlock) {
            appInfoBlock.innerHTML = `
                <h2>${this.config.companyName} ${this.config.appName}</h2>
                <h3>Travel Expense Management</h3>
                <p>${this.config.appDescription}</p>
                <p>Track expenses in multiple currencies, get automatic exchange rates, and generate comprehensive reports - all working offline!</p>
                <button class="btn btn-primary" onclick="this.scrollIntoView({behavior: 'smooth', block: 'start'})">Start Tracking Expenses</button>
            `;
        }
    },
    
    // Analytics & Diagnostics
    sendDiagnostics: async function(event = 'S', userInfo = null, installId = null) {
        if (!navigator.onLine || !this.config.features.getIP) return;
        
        try {
            // Use ProfileManager.lipikit_installId if available, otherwise fallback to local storage
            const lipikitInstallId = installId || ProfileManager?.lipikit_installId || localStorage.getItem(this.config.storageKeys.installId);
            const userId = userInfo ? userInfo.userId : 'N';
            const displayName = userInfo ? userInfo.displayName : 'N';
            
            // Format: InstallId|UserId|DisplayName|Version
            const installUserInfo = `${lipikitInstallId}|${userId}|${displayName}|${this.config.appVersion}`;
            
            // Current timestamp
            const timestamp = new Date().toISOString();
            
            // Device info
            const deviceInfo = await this.getDeviceInfo();
            const eventData = `${event}|${deviceInfo}`;
            
            // Send to Google Form
            const formData = new FormData();
            formData.append(this.config.googleForm.diagFields.installUserInfo, installUserInfo);
            formData.append(this.config.googleForm.diagFields.timestamp, timestamp);
            formData.append(this.config.googleForm.diagFields.eventData, eventData);
            
            await fetch(this.config.googleForm.diagActionUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            
            console.log(`Trip Tracker diagnostics sent: ${event}`);
        } catch (error) {
            console.error('Failed to send diagnostics:', error);
        }
    },
    
    getInstallId: function() {
        let installId = localStorage.getItem(this.config.storageKeys.installId);
        if (!installId) {
            installId = `lipikit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(this.config.storageKeys.installId, installId);
        }
        return installId;
    },
    
    getDeviceInfo: async function() {
        let deviceInfo = `ua:${navigator.userAgent.replace(/ /g,'_')};`;
        deviceInfo += `p:${navigator.platform};`;
        deviceInfo += `l:${navigator.language};`;
        deviceInfo += `scr:${screen.width}x${screen.height}x${screen.colorDepth};`;
        deviceInfo += `vp:${window.innerWidth}x${window.innerHeight};`;
        deviceInfo += `dm:${window.matchMedia('(display-mode: standalone)').matches ? 'P' : 'B'};`;
        
        if (navigator.hardwareConcurrency) {
            deviceInfo += `hc:${navigator.hardwareConcurrency};`;
        }
        if (navigator.deviceMemory) {
            deviceInfo += `dmem:${navigator.deviceMemory};`;
        }
        
        deviceInfo += `tz:${Intl.DateTimeFormat().resolvedOptions().timeZone};`;
        
        // Try to get IP address
        if (this.config.features.getIP) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch('https://api.ipify.org?format=json', { 
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);
                const data = await response.json();
                deviceInfo += `ip:${data.ip};`;
            } catch (error) {
                deviceInfo += `ip:N/A;`;
            }
        }
        
        return deviceInfo;
    },
    
    // Trip-specific utility functions
    validatePIN: function(enteredPIN) {
        if (!window.CryptoJS) {
            console.error('CryptoJS library not loaded');
            return false;
        }
        
        const enteredPinHash = CryptoJS.SHA256(enteredPIN).toString();
        return this.config.hashedPins.includes(enteredPinHash);
    },
    
    getCurrencyName: function(currencyCode) {
        return this.config.currencyNames[currencyCode] || currencyCode;
    },
    
    formatCurrency: function(amount, currencyCode) {
        const numAmount = parseFloat(amount) || 0;
        return `${numAmount.toLocaleString()} ${currencyCode}`;
    },
    
    // Utility functions
    generateUUID: function() {
        return 'uuid-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    },
    
    formatDate: function(date) {
        return new Date(date).toISOString().split('T')[0];
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    isOnline: function() {
        return navigator.onLine;
    }
};