// config.js - Trip Tracker Configuration with Firebase
const AppConfig = {
    // App Configuration
    config: {
        appName: 'Trips',
        appVersion: 'v0.0.8b',
        appDescription: 'All-in-one travel manager for expenses, checklists, itineraries, documents, and attractions – secure and friendly.',
        companyName: 'LipiKit',
        
        // Trip Tracker Color Theme (SOOTHING VIBRANT theme)
        colors: {
            primary: '#14B8A6',
            primaryHover: '#0D9488',
            secondary: '#334155',
            secondaryHover: '#1E293B',
            success: '#22C55E',
            successHover: '#15803D',
            danger: '#E11D48',
            dangerHover: '#9F1239',
            backgroundGradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
            headerGradient: 'linear-gradient(to right, #14B8A6, #334155)'
        },
        
        // Firebase Configuration
        firebase: {
            // TODO: Replace with your Firebase project credentials
            apiKey: "AIzaSyA9nMEt2Q_FLPP6KQDPoKri6C5-f6dq50c",
            authDomain: "sparkyminis-auth.firebaseapp.com",
            projectId: "sparkyminis-auth",
            storageBucket: "sparkyminis-auth.firebasestorage.app",
            messagingSenderId: "207061052479",
            appId: "1:207061052479:web:0ede9db20747be25815c8a",
            measurementId: "G-7801T8LQ8L",
            
            collections: {
                users: 'users'
            }
        },
        
        // Geo/IP Configuration
        geoIp: {
            enabled: true,
            services: [
                { url: 'https://ipapi.co/json/', name: 'ipapi', timeout: 5000 },
                { url: 'http://ip-api.com/json/', name: 'ip-api', timeout: 5000 }
            ],
            cacheKey: 'lipikit_geo_cache',
            gracefulFallback: true
        },
        
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
            expenseActionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdkfyEAqMf5h0rLPWuXw1PmywLct2-3VbIfSQu4iyEc2bLo9Q/formResponse',
            expenseFields: {
                name: 'entry.1731583832',
                tripName: 'entry.1093227282',
                expenseDate: 'entry.505163115',
                amount: 'entry.1623455754',
                currency: 'entry.1004211902',
                category: 'entry.59253883',
                place: 'entry.283121596',
                notes: 'entry.261715790',
                location: 'entry.56139846',
                mode: 'entry.1829164279'
            },
            diagActionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfAbtJTg-IequMyIVZU_LaskIyfL9_lAhTdcDfl09MsBF1dIg/formResponse',
            diagFields: {
                installUserInfo: 'entry.975398843',
                timestamp: 'entry.626283681',
                eventData: 'entry.738839204'
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
            installId: 'lipikit_installId',
            cachedUsers: 'lipikit_cached_firebase_users',
            activeUser: 'lipikit_currentUser',
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
            dataUrl: "https://data.lipikit.com/",
            remoteDataFolder: "trips/",
            localDataFolder: "/data/",
            versionFileName: "version",
            datasetPrefix: "lipikit_data_",
            versionStorageKey: "version_json"
        },
    },
    
    init: function() {
        this.applyConfiguration();
        this.applyTheme();
        this.updateAppInfo();
    },
    
    applyConfiguration: function() {
        document.title = `${this.config.companyName} ${this.config.appName}`;
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = document.title;
        
        const companyName = document.getElementById('company-name');
        const appName = document.getElementById('app-name');
        if (companyName) companyName.textContent = this.config.companyName;
        if (appName) appName.textContent = this.config.appName;
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = this.config.appDescription;
        
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.content = this.config.colors.primary;
        
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
        document.body.style.background = this.config.colors.backgroundGradient;
    },
    
    updateAppInfo: function() {
        const appInfoBlock = document.getElementById('app-info-block');
        if (appInfoBlock) {
            appInfoBlock.innerHTML = `
                <h2>${this.config.companyName} ${this.config.appName}</h2>
                <p>${this.config.appDescription}</p>
                <p>Track multi-currency expenses, manage smart checklists, locally store all your documents at one place in secured environment, plan detailed itineraries, discover attractions, and keep data secured in your own device – with support for multiple profiles for your personal and business separations.</p>
                <button class="btn btn-primary" onclick="this.scrollIntoView({behavior: 'smooth', block: 'start'})">Plan Your Trip</button>
            `;
        }
    },
    
    // Analytics & Diagnostics
    sendDiagnostics: async function(event = 'S', userInfo = null, installId = null) {
        if (!navigator.onLine || !this.config.features.getIP) return;
        
        try {
            const lipikitInstallId = installId || ProfileManager?.lipikit_installId || localStorage.getItem(this.config.storageKeys.installId);
            const userId = userInfo ? userInfo.userId : 'N';
            const displayName = userInfo ? userInfo.displayName : 'N';
            
            const installUserInfo = `${lipikitInstallId}|${userId}|${displayName}|${this.config.appVersion}`;
            const timestamp = new Date().toISOString();
            const deviceInfo = await this.getDeviceInfo();
            const eventData = `${event}|${deviceInfo}`;
            
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
        
        if (navigator.hardwareConcurrency) deviceInfo += `hc:${navigator.hardwareConcurrency};`;
        if (navigator.deviceMemory) deviceInfo += `dmem:${navigator.deviceMemory};`;
        
        deviceInfo += `tz:${Intl.DateTimeFormat().resolvedOptions().timeZone};`;
        
        if (this.config.features.getIP) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await response.json();
                deviceInfo += `ip:${data.ip};`;
            } catch (error) {
                deviceInfo += `ip:N/A;`;
            }
        }
        
        return deviceInfo;
    },
    
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
