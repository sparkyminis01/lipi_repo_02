const ProfileManager = {
    currentUser: null,
    lipikit_installId: null,
    firebaseApp: null,
    firebaseAuth: null,
    firestore: null,
    authStateListener: null,

    init: function() {
        this.lipikit_installId = this.getOrCreateInstallId();
        this.initFirebase();
        this.setupAuthStateListener();
        this.setupAutoLogout(); // 🆕 Add auto-logout
        
        if (typeof AppConfig !== 'undefined') {
            AppConfig.sendDiagnostics('S', this.currentUser, this.lipikit_installId);
        }
    },

    setupAutoLogout: function() {

        const timeoutDays = localStorage.getItem('lipikit_autoLogoutDays') || '30';
        if (timeoutDays === 'never') return; // Don't set up auto-logout
        // Auto logout after 30 days of inactivity (configurable)
        const INACTIVITY_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        const checkLastActivity = () => {
            const lastActivity = localStorage.getItem('lipikit_lastActivity');
            if (lastActivity) {
                const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
                if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
                    console.log('Auto-logout due to inactivity');
                    this.signOut();
                    this.showError('You have been automatically signed out due to inactivity.');
                }
            }
        };
        
        // Update last activity timestamp on user interaction
        const updateActivity = () => {
            localStorage.setItem('lipikit_lastActivity', Date.now().toString());
        };
        
        // Check on page load
        checkLastActivity();
        
        // Update activity on interactions
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                updateActivity();
            }, { once: true, passive: true }); // Use once to avoid excessive writes
        });
        
        // Re-check periodically (every hour)
        setInterval(checkLastActivity, 60 * 60 * 1000);
    },

    getOrCreateInstallId: function() {
        let installId = localStorage.getItem('lipikit_installId');
        if (!installId) {
            installId = `lipikit-trips-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem('lipikit_installId', installId);
        }
        return installId;
    },

    initFirebase: function() {
        if (!firebase || !AppConfig?.config?.firebase) {
            console.error('Firebase not loaded or config missing');
            return false;
        }

        try {
            const fbConfig = AppConfig.config.firebase;
            this.firebaseApp = firebase.initializeApp(fbConfig);
            this.firebaseAuth = firebase.auth();
            this.firestore = firebase.firestore();
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            return false;
        }
    },

    setupAuthStateListener: function() {
        if (!this.firebaseAuth) return;

        this.authStateListener = this.firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                await this.handleAuthenticatedUser(firebaseUser);
            } else {
                this.handleUnauthenticatedUser();
            }
        });
    },

    async handleAuthenticatedUser(firebaseUser) {
        this.currentUser = {
            userId: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            provider: firebaseUser.providerData[0]?.providerId || 'unknown',
            emailVerified: firebaseUser.emailVerified,
            lipikit_installId: this.lipikit_installId
        };

        localStorage.setItem('lipikit_currentUser', firebaseUser.uid);
        await this.cacheUser(this.currentUser);
        await this.updateFirestoreUser(firebaseUser);
        
        this.renderProfileSection();
        document.getElementById('app-area')?.classList.remove('hidden');
        
        if (typeof DatasetManager !== 'undefined') {
            DatasetManager.initializeFromLocal();
        }
    },

    handleUnauthenticatedUser() {
        this.currentUser = null;
        localStorage.removeItem('lipikit_currentUser');
        this.renderProfileSection();
        document.getElementById('app-area')?.classList.add('hidden');
    },

    async updateFirestoreUser(firebaseUser) {
        if (!this.firestore) return;

        try {
            const userRef = this.firestore.collection('users').doc(firebaseUser.uid);
            const userDoc = await userRef.get();
            
            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                provider: firebaseUser.providerData[0]?.providerId,
                emailVerified: firebaseUser.emailVerified,
                appName: AppConfig?.config?.appName || 'Trips',
                appVersion: AppConfig?.config?.appVersion || 'v0.0.7',
                lipikit_installId: this.lipikit_installId,
                lastSignIn: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };

            if (!userDoc.exists) {
                userData.createdAt = new Date().toISOString();
                userData.geo = await this.captureGeoData();
            }

            await userRef.set(userData, { merge: true });
            console.log('Firestore user document updated');
        } catch (error) {
            console.error('Failed to update Firestore:', error);
        }
    },

    async captureGeoData() {
        if (!AppConfig?.config?.geoIp?.enabled) {
            return this.getBrowserFallbackGeo();
        }

        const cached = localStorage.getItem('lipikit_geo_cache');
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    return data;
                }
            } catch (e) {
                console.warn('Invalid geo cache');
            }
        }

        for (const service of AppConfig.config.geoIp.services) {
            try {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), service.timeout);
                
                const res = await fetch(service.url, { signal: controller.signal });
                if (res.status === 429) continue;
                
                const data = await res.json();
                
                let geoData;
                if (service.name === 'ipapi') {
                    if (data.error) continue;
                    geoData = {
                        ip: data.ip,
                        country: data.country_name,
                        countryCode: data.country_code,
                        city: data.city,
                        region: data.region,
                        timezone: data.timezone,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        source: 'ipapi.co'
                    };
                } else {
                    if (data.status === 'fail') continue;
                    geoData = {
                        ip: data.query,
                        country: data.country,
                        countryCode: data.countryCode,
                        city: data.city,
                        region: data.regionName,
                        timezone: data.timezone,
                        latitude: data.lat,
                        longitude: data.lon,
                        isp: data.isp,
                        source: 'ip-api.com'
                    };
                }
                
                localStorage.setItem('lipikit_geo_cache', JSON.stringify({
                    timestamp: Date.now(),
                    data: geoData
                }));
                
                return geoData;
            } catch (error) {
                console.warn(`${service.name} failed:`, error.message);
            }
        }

        return this.getBrowserFallbackGeo();
    },

    getBrowserFallbackGeo() {
        const geoData = {
            ip: null,
            country: null,
            countryCode: null,
            city: null,
            region: null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            latitude: null,
            longitude: null,
            language: navigator.language,
            source: 'browser-fallback'
        };
        
        localStorage.setItem('lipikit_geo_cache', JSON.stringify({
            timestamp: Date.now(),
            data: geoData
        }));
        
        return geoData;
    },

    async cacheUser(user) {
        try {
            const cached = this.getCachedUsers();
            const existing = cached.findIndex(u => u.userId === user.userId);
            
            const userCache = {
                userId: user.userId,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                provider: user.provider,
                lastUsed: Date.now()
            };
            
            if (existing >= 0) {
                cached[existing] = userCache;
            } else {
                cached.push(userCache);
            }
            
            localStorage.setItem('lipikit_cached_firebase_users', JSON.stringify(cached));
        } catch (error) {
            console.error('Failed to cache user:', error);
        }
    },

    getCachedUsers() {
        try {
            const cached = localStorage.getItem('lipikit_cached_firebase_users');
            if (cached) {
                const users = JSON.parse(cached);
                return users.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
            }
        } catch (error) {
            console.error('Failed to load cached users:', error);
        }
        return [];
    },

    renderProfileSection: function() {
        const profileSection = document.getElementById('profile-section');
        const header = document.querySelector('.header');
        const settingsBtn = document.getElementById('settings-btn');

        const existingDropdown = header?.querySelector('.user-dropdown');
        if (existingDropdown) existingDropdown.remove();

        if (this.currentUser) {
            this.renderAuthenticatedUI(header, settingsBtn);
            if (profileSection) profileSection.innerHTML = '';
        } else {
            this.renderSignInUI(profileSection);
        }
    },

    renderAuthenticatedUI: function(header, settingsBtn) {
        if (!header) return;

        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        userDropdown.style.cssText = 'position: relative; margin-left: 0.5rem;';
        
        const providerIcon = this.currentUser.provider.includes('google') ? 
            '<svg class="provider-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' :
            '<svg class="provider-icon" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M13 1h10v10H13z"/><path fill="#7fba00" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>';

        userDropdown.innerHTML = `
            <button class="user-btn profile-btn" aria-haspopup="true" aria-expanded="false">
                ${this.currentUser.photoURL ? 
                    `<img src="${this.currentUser.photoURL}" class="user-avatar" alt="Profile">` :
                    `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`
                }
                <span class="user-greeting">Hi, ${this.currentUser.displayName}</span>
                <span class="dropdown-arrow">▼</span>
            </button>

            <div class="dropdown-menu hidden">
                <div class="user-info" style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6;">
                    <div style="font-weight: 600; color: #374151;">${this.currentUser.displayName}</div>
                    <div style="font-size: 0.8rem; color: #6b7280;">${this.currentUser.email}</div>
                    <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
                        ${providerIcon}
                        <span style="font-size: 0.7rem; color: #9ca3af;">${this.currentUser.provider.includes('google') ? 'Google' : 'Microsoft'}</span>
                    </div>
                </div>
                <div class="dropdown-item" id="switch-account-btn">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4v6h6M20 20v-6h-6M20 4l-6 6M4 20l6-6"/></svg>
                    Switch Account
                </div>
                <div class="dropdown-item" id="signout-btn">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 8l-1.41 1.41L17.17 11H9v2h8.17l-1.58 1.58L17 16l4-4-4-4zM5 5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5V5z"/></svg>
                    Sign Out
                </div>
                <div class="dropdown-item" id="settings-dropdown-btn" style="border-top: 1px solid #f3f4f6;">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 12a7.38 7.38 0 0 0-.07-1l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.12 7.12 0 0 0-1.73-1l-.38-2.65a.5.5 0 0 0-.5-.42h-4a.5.5 0 0 0-.5.42l-.38 2.65a7.12 7.12 0 0 0-1.73 1l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.65L4.67 11a7.38 7.38 0 0 0 0 2l-2.11 1.65a.5.5 0 0 0-.12.65l2 3.46c.14.24.42.34.67.22l2.49-1a7.12 7.12 0 0 0 1.73 1l.38 2.65a.5.5 0 0 0 .5.42h4c.25 0 .46-.18.5-.42l.38-2.65a7.12 7.12 0 0 0 1.73-1l2.49 1c.25.12.53.02.67-.22l2-3.46a.5.5 0 0 0-.12-.65L19.33 13a7.38 7.38 0 0 0 .07-1z"/></svg>
                    Settings
                </div>
            </div>
        `;

        if (settingsBtn) {
            header.insertBefore(userDropdown, settingsBtn);
        } else {
            header.appendChild(userDropdown);
        }

        this.addDropdownStyles();
        this.bindAuthenticatedEvents(userDropdown);
    },

    addDropdownStyles: function() {
        if (document.getElementById('profile-dropdown-styles')) return;

        const style = document.createElement('style');
        style.id = 'profile-dropdown-styles';
        style.textContent = `
            .user-btn { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 1rem; border-radius: 25px; color: white; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; backdrop-filter: blur(10px); }
            .user-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .user-btn[aria-expanded="true"] .dropdown-arrow { transform: rotate(180deg); }
            .user-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
            .provider-icon { width: 16px; height: 16px; }
            .dropdown-menu { transition: all 0.2s ease; }
            .dropdown-menu.hidden { display: none; }
            .dropdown-item { padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; color: #374151; font-size: 0.9rem; }
            .dropdown-item:hover { background: #f8fafc; color: var(--primary-color); transform: translateX(2px); }
            .dropdown-item .icon { width: 18px; height: 18px; }
            .user-info { background: #f9fafb !important; cursor: default !important; }
            .user-greeting { white-space: nowrap; }
            .dropdown-arrow { margin-left: 0.5rem; transition: transform 0.2s; font-size: 0.7rem; }
        `;
        document.head.appendChild(style);
    },

    bindAuthenticatedEvents: function(dropdown) {
        const userBtn = dropdown.querySelector('.user-btn');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
            userBtn.setAttribute('aria-expanded', !dropdownMenu.classList.contains('hidden'));
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                userBtn.setAttribute('aria-expanded', 'false');
            }
        });

        dropdown.querySelector('#switch-account-btn')?.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
            this.showSwitchAccountModal();
        });

        dropdown.querySelector('#signout-btn')?.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
            this.signOut();
        });

        dropdown.querySelector('#settings-dropdown-btn')?.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
            if (typeof showModal !== 'undefined') {
                showModal('settings-modal');
            }
        });
    },

    renderSignInUI: function(profileSection) {
        if (!profileSection) return;

        const cachedUsers = this.getCachedUsers();
        const isOnline = navigator.onLine;

        profileSection.innerHTML = `
            <div class="auth-container" style="max-width: 500px; margin: 2rem auto; text-align: center;">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Welcome to LipiKit Trips</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">Sign in to access your travel data and start tracking your adventures</p>
                
                ${isOnline ? `
                    <button id="google-signin" class="btn btn-google" style="width: 100%; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.875rem; background: white; color: #333; border: 1px solid #ddd;">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Sign in with Google
                    </button>
                    <button id="microsoft-signin" class="btn btn-microsoft" style="width: 100%; margin-bottom: 2rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.875rem; background: #2f2f2f; color: white;">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M13 1h10v10H13z"/><path fill="#7fba00" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
                        Sign in with Microsoft
                    </button>
                ` : `
                    <div style="padding: 1rem; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; margin-bottom: 2rem; color: #92400e;">
                        <strong>Offline Mode</strong><br>
                        You're currently offline. Connect to the internet to sign in with a new account.
                    </div>
                `}
                
                ${cachedUsers.length > 0 ? `
                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
                        <h3 style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Previously Signed In</h3>
                        <div class="cached-user-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${cachedUsers.map(user => this.renderCachedUserButton(user)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        this.bindSignInEvents();
    },

    renderCachedUserButton: function(user) {
        const daysSince = Math.floor((Date.now() - (user.lastUsed || 0)) / (1000 * 60 * 60 * 24));
        const lastUsedText = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`;

        // Use cached photo or fallback to initials
        const photoDisplay = user.photoURL ? 
            `<img src="${user.photoURL}" 
                  style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" 
                  alt="${user.displayName}"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-color); color: white; display: none; align-items: center; justify-content: center; font-weight: 600; font-size: 1.25rem;">${user.displayName?.charAt(0) || '?'}</div>` :
            `<div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.25rem;">${user.displayName?.charAt(0) || '?'}</div>`;

        return `
            <button class="cached-user-btn" data-uid="${user.userId}" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left;">
                ${photoDisplay}
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${user.displayName}</div>
                    <div style="font-size: 0.875rem; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.email}</div>
                    <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">Last used: ${lastUsedText}</div>
                </div>
                <svg style="width: 20px; height: 20px; color: var(--primary-color);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        `;
    },

    bindSignInEvents: function() {
        document.getElementById('google-signin')?.addEventListener('click', () => {
            this.signInWithGoogle();
        });

        document.getElementById('microsoft-signin')?.addEventListener('click', () => {
            this.signInWithMicrosoft();
        });

        document.querySelectorAll('.cached-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.signInCachedUser(btn.dataset.uid);
            });
        });
    },

    async signInWithGoogle() {
        if (!this.firebaseAuth || !navigator.onLine) {
            this.showError('Cannot sign in: You are offline');
            return;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await this.firebaseAuth.signInWithPopup(provider);
            
            if (typeof AppConfig !== 'undefined') {
                AppConfig.sendDiagnostics('SI-G', this.currentUser, this.lipikit_installId);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showError(`Sign in failed: ${error.message}`);
        }
    },

    async signInWithMicrosoft() {
        if (!this.firebaseAuth || !navigator.onLine) {
            this.showError('Cannot sign in: You are offline');
            return;
        }

        try {
            const provider = new firebase.auth.OAuthProvider('microsoft.com');
            await this.firebaseAuth.signInWithPopup(provider);
            
            if (typeof AppConfig !== 'undefined') {
                AppConfig.sendDiagnostics('SI-M', this.currentUser, this.lipikit_installId);
            }
        } catch (error) {
            console.error('Microsoft sign-in error:', error);
            this.showError(`Sign in failed: ${error.message}`);
        }
    },

    async signInCachedUser(uid) {
        const cachedUsers = this.getCachedUsers();
        const user = cachedUsers.find(u => u.userId === uid);
        
        if (!user) {
            this.showError('User not found');
            return;
        }

        if (navigator.onLine && this.firebaseAuth) {
            try {
                const currentUser = this.firebaseAuth.currentUser;
                
                // If already signed in with this user, just reload
                if (currentUser && currentUser.uid === uid) {
                    await currentUser.reload();
                    await this.handleAuthenticatedUser(currentUser);
                    return;
                }
                
                // If switching to a different user, sign out first then redirect to sign-in
                if (currentUser && currentUser.uid !== uid) {
                    await this.firebaseAuth.signOut();
                }
                
                // Show message and redirect to appropriate sign-in
                const providerType = user.provider?.includes('google') ? 'Google' : 
                                   user.provider?.includes('microsoft') ? 'Microsoft' : 'Unknown';
                
                this.showError(`Please sign in again with ${providerType} to access this account.`);
                
                // Auto-trigger sign-in popup for better UX
                setTimeout(() => {
                    if (user.provider?.includes('google')) {
                        this.signInWithGoogle();
                    } else if (user.provider?.includes('microsoft')) {
                        this.signInWithMicrosoft();
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Cached user sign-in error:', error);
                this.showError('Failed to switch accounts. Please sign in again.');
            }
        } else {
            // Offline mode - use cached data
            this.currentUser = {
                userId: user.userId,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                provider: user.provider,
                lipikit_installId: this.lipikit_installId,
                offlineMode: true
            };

            localStorage.setItem('lipikit_currentUser', user.userId);
            await this.cacheUser(this.currentUser);
            
            this.renderProfileSection();
            document.getElementById('app-area')?.classList.remove('hidden');
            
            if (typeof DatasetManager !== 'undefined') {
                DatasetManager.initializeFromLocal();
            }
            
            if (typeof AppConfig !== 'undefined') {
                AppConfig.sendDiagnostics('SI-C', this.currentUser, this.lipikit_installId);
            }
            
            // Dispatch event for app integration
            document.dispatchEvent(new CustomEvent('userAuthChanged', { 
                detail: { user: this.currentUser, action: 'login' }
            }));
        }
    },

    showSwitchAccountModal: function() {
        const cachedUsers = this.getCachedUsers();
        const isOnline = navigator.onLine;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'switch-account-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Switch Account</h2>
                <p style="color: #6b7280; margin-bottom: 1.5rem;">Select an account to switch to</p>
                
                ${cachedUsers.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
                        ${cachedUsers.map(user => this.renderCachedUserButton(user)).join('')}
                    </div>
                ` : ''}
                
                ${isOnline ? `
                    <div style="padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <button id="switch-google" class="btn btn-google" style="width: 100%; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            Sign in with Google
                        </button>
                        <button id="switch-microsoft" class="btn btn-microsoft" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M13 1h10v10H13z"/><path fill="#7fba00" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
                            Sign in with Microsoft
                        </button>
                    </div>
                ` : `
                    <div style="padding: 1rem; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; color: #92400e; font-size: 0.875rem;">
                        You're offline. Connect to the internet to sign in with a different account.
                    </div>
                `}
                
                <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;" onclick="document.getElementById('switch-account-modal').remove()">Cancel</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.cached-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
                this.signInCachedUser(btn.dataset.uid);
            });
        });

        modal.querySelector('#switch-google')?.addEventListener('click', () => {
            modal.remove();
            this.signInWithGoogle();
        });

        modal.querySelector('#switch-microsoft')?.addEventListener('click', () => {
            modal.remove();
            this.signInWithMicrosoft();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async signOut() {
        try {
            if (this.firebaseAuth) {
                await this.firebaseAuth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('lipikit_currentUser');
            
            this.renderProfileSection();
            document.getElementById('app-area')?.classList.add('hidden');
            
            if (typeof AppConfig !== 'undefined') {
                AppConfig.sendDiagnostics('SO', null, this.lipikit_installId);
            }
        } catch (error) {
            console.error('Sign out error:', error);
            this.showError('Failed to sign out. Please try again.');
        }
    },

    showError: function(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #fee2e2; color: #991b1b; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; max-width: 400px;';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },

    isUserLoggedIn: function() {
        return !!this.currentUser;
    },

    getCurrentUser: function() {
        return this.currentUser;
    }
};