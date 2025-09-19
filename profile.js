const ProfileManager = {
    currentUser: null,
    lipikit_installId: null,

    init: function() {
        this.lipikit_installId = this.getOrCreateInstallId();
        this.loadUserProfile();
        this.renderProfileSection();

        // Send initial app start diagnostic
        if (typeof AppConfig !== 'undefined') {
            AppConfig.sendDiagnostics('S', this.currentUser, this.lipikit_installId);
        }
    },

    getOrCreateInstallId: function() {
        let installId = localStorage.getItem('lipikit_installId');
        if (!installId) {
            installId = this.generateNewInstallId();
            localStorage.setItem('lipikit_installId', installId);
        }
        return installId;
    },

    generateNewInstallId: function() {
        return `lipikit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    },

    loadUserProfile: function() {
        try {
            const currentUserId = localStorage.getItem('lipikit_currentUser');
            if (currentUserId) {
                const userProfile = localStorage.getItem(`lipikit_userProfile_${currentUserId}`);
                if (userProfile) {
                    this.currentUser = JSON.parse(userProfile);
                }
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.currentUser = null;
        }
    },

    renderProfileSection: function() {
        const profileSection = document.getElementById('profile-section');
        const header = document.querySelector('.header');
        const settingsBtn = document.getElementById('settings-btn');

        // Remove existing user dropdown if present
        const existingDropdown = header.querySelector('.user-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Always create the dropdown (for both logged in users and guests)
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        userDropdown.style.cssText = 'position: relative; margin-left: 0.5rem;';
        
        const displayName = this.currentUser ? this.currentUser.displayName : 'Guest';
        const isGuest = !this.currentUser;
        
       userDropdown.innerHTML = `
  <button class="user-btn profile-btn" aria-haspopup="true" aria-expanded="false">
    <span class="user-greeting">
      ${isGuest ? `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      ` : `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      `}
      Hi, ${displayName}
    </span>
    <span class="dropdown-arrow" style="margin-left: 0.5rem; transition: transform 0.2s;">▼</span>
  </button>

  <div class="dropdown-menu hidden"
       style="position: absolute; top: 100%; right: 0; background: white; border-radius: var(--border-radius); box-shadow: var(--card-shadow); min-width: 180px; z-index: 1000; border: 1px solid #e5e7eb;">
    
    ${isGuest ? `
      <div class="dropdown-item" id="create-profile-btn">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 5v14M5 12h14"/>
        </svg>
        Create Profile
      </div>
      <div class="dropdown-item" id="existing-user-btn">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
        Existing User
      </div>
    ` : `
      <div class="dropdown-item user-info" style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 0.8rem;">
        <div style="font-weight: 600; color: #374151;">${this.currentUser.displayName}</div>
        <div>ID: ${this.currentUser.userId.slice(-8)}</div>
      </div>
      <div class="dropdown-item" id="switch-user-btn">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M4 4v6h6M20 20v-6h-6M20 4l-6 6M4 20l6-6"/>
        </svg>
        Switch User
      </div>
    `}

    <div class="dropdown-item" id="settings-dropdown-btn" style="border-top: 1px solid #f3f4f6;">
      <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 12a7.38 7.38 0 0 0-.07-1l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.12 7.12 0 0 0-1.73-1l-.38-2.65a.5.5 0 0 0-.5-.42h-4a.5.5 0 0 0-.5.42l-.38 2.65a7.12 7.12 0 0 0-1.73 1l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.65L4.67 11a7.38 7.38 0 0 0 0 2l-2.11 1.65a.5.5 0 0 0-.12.65l2 3.46c.14.24.42.34.67.22l2.49-1a7.12 7.12 0 0 0 1.73 1l.38 2.65a.5.5 0 0 0 .5.42h4c.25 0 .46-.18.5-.42l.38-2.65a7.12 7.12 0 0 0 1.73-1l2.49 1c.25.12.53.02.67-.22l2-3.46a.5.5 0 0 0-.12-.65L19.33 13a7.38 7.38 0 0 0 .07-1z"/>
      </svg>
      Settings
    </div>
  </div>
`;


        // Insert dropdown before settings button or at the end of header if no settings button
        if (settingsBtn) {
            header.insertBefore(userDropdown, settingsBtn);
        } else {
            header.appendChild(userDropdown);
        }

        // Add enhanced dropdown styles
        const style = document.createElement('style');
        if (!document.getElementById('profile-dropdown-styles')) {
            style.id = 'profile-dropdown-styles';
            style.textContent = `
                .user-btn { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 1rem; border-radius: 25px; color: white; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; backdrop-filter: blur(10px); min-width: 120px; justify-content: center; }
                .user-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .user-btn[aria-expanded="true"] .dropdown-arrow { transform: rotate(180deg); }
                .dropdown-menu { transition: all 0.2s ease; }
                .dropdown-menu.hidden { display: none; }
                .dropdown-item { transition: all 0.2s ease; }
                .dropdown-item:hover { background: #f8fafc; color: var(--primary-color); transform: translateX(2px); }
                .user-info { background: #f9fafb !important; cursor: default !important; }
                .profile-forms-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    align-items: stretch;
                }
                @media(min-width: 768px) {
                    .profile-forms-container {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                .profile-form .card { height: 100%; display: flex; flex-direction: column; }
                .existing-users-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; max-height: 18rem; overflow-y: auto; padding-right: 0.5rem; }
                @media(min-width: 768px) { .existing-users-grid { grid-template-columns: repeat(3, 1fr); } }
                .existing-user-btn { padding: 1.5rem; text-align: center; border-radius: var(--border-radius); font-size: 1rem; background: var(--primary-bg, #f3f4f6); color: #111827; transition: all 0.2s ease; }
                .existing-user-btn:hover { background: var(--primary-color); color: #fff; transform: translateY(-2px); }
            `;
            document.head.appendChild(style);
        }

        // Add event listeners for dropdown
        const userBtn = userDropdown.querySelector('.user-btn');
        const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
        
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
            userBtn.setAttribute('aria-expanded', !dropdownMenu.classList.contains('hidden'));
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                userBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Add event listeners based on user state
        if (isGuest) {
            userDropdown.querySelector('#create-profile-btn').addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
                userBtn.setAttribute('aria-expanded', 'false');
                this.showCreateProfileForm();
            });

            userDropdown.querySelector('#existing-user-btn').addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
                userBtn.setAttribute('aria-expanded', 'false');
                this.showExistingUserForm();
            });
        } else {
            userDropdown.querySelector('#switch-user-btn').addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
                userBtn.setAttribute('aria-expanded', 'false');
                this.showSwitchUserConfirmation();
            });
        }

        // Settings button
        userDropdown.querySelector('#settings-dropdown-btn').addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
            userBtn.setAttribute('aria-expanded', 'false');
            if (typeof showModal !== 'undefined') {
                showModal('settings-modal');
            }
        });

        // Handle app area visibility and profile section content
        if (this.currentUser) {
            profileSection.innerHTML = '';
            document.getElementById('app-area').classList.remove('hidden');
        } else {
            document.getElementById('app-area').classList.add('hidden');
            profileSection.innerHTML = `
                <div class="profile-forms-container">
                    <div class="profile-form existing-form"></div>
                    <div class="profile-form create-form"></div>
                </div>
            `;
            this.showExistingUserForm(profileSection.querySelector('.existing-form'));
            this.showCreateProfileForm(profileSection.querySelector('.create-form'));
        }
    },

    showCreateProfileForm: function(container = null) {
        const target = container || document.getElementById('profile-section');
        target.innerHTML = `
            <div class="card">
                <h2>Create Your Profile</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">Create a new profile to start using the app. Your username will be stored locally and never leaves your device. Optionally, sync to LipiKit secure servers to get Magical Reports.</p>
                <form id="create-profile-form">
                    <div class="form-group">
                        <label for="display-name">Username</label>
                        <input type="text" id="display-name" placeholder="Enter your username" required>
                        <small style="color: #6b7280;">Choose a unique username. This cannot be changed later.</small>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">Create Profile</button>
                    ${container ? '' : '<button type="button" id="cancel-create" class="btn btn-secondary" style="width: 100%;">Cancel</button>'}
                </form>
                <div id="profile-error" class="hidden" style="background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-top: 1rem;"></div>
            </div>
        `;

        target.querySelector('#create-profile-form').addEventListener('submit', (e) => {
            this.handleProfileCreation(e);
        });

        if (!container) {
            const cancelBtn = target.querySelector('#cancel-create');
            if (cancelBtn) cancelBtn.addEventListener('click', () => { target.innerHTML = ''; });
        }
    },

    showExistingUserForm: function(container = null) {
        const target = container || document.getElementById('profile-section');
        const existingUsers = this.getExistingUsers();

        if (existingUsers.length === 0) {
            target.innerHTML = `
                <div class="card">
                    <h2>No Existing Users</h2>
                    <p style="color: #6b7280; margin-bottom: 2rem;">No existing user profiles found. Please create a new profile instead.</p>
                    <button type="button" id="create-instead" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">Create New Profile</button>
                    ${container ? '' : '<button type="button" id="cancel-existing" class="btn btn-secondary" style="width: 100%;">Cancel</button>'}
                </div>
            `;
            target.querySelector('#create-instead').addEventListener('click', () => { this.showCreateProfileForm(container); });
            if (!container) {
                const cancelBtn = target.querySelector('#cancel-existing');
                if (cancelBtn) cancelBtn.addEventListener('click', () => { target.innerHTML = ''; });
            }
            return;
        }

        target.innerHTML = `
            <div class="card">
                <h2>Select Existing User</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">Choose from your existing profiles or enter a username to sign in.</p>
                <div class="form-group">
                    <label>Existing Profiles</label>
                    <div class="existing-users-grid">
                        ${existingUsers.map(user => `
                            <button type="button" class="existing-user-btn" data-username="${user.displayName}">
                                <strong>${user.displayName}</strong><br>
                                <small style="color: rgba(0,0,0,0.6);">Created: ${new Date(user.createdAt).toLocaleDateString()}</small>
                            </button>`).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="existing-username">Or Enter Username</label>
                    <input type="text" id="existing-username" placeholder="Enter existing username">
                    <small style="color: #6b7280;">Enter the username of an existing profile to sign in.</small>
                </div>
                <button type="button" id="signin-btn" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">Sign In</button>
                ${container ? '' : '<button type="button" id="cancel-signin" class="btn btn-secondary" style="width: 100%;">Cancel</button>'}
                <div id="signin-error" class="hidden" style="background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-top: 1rem;"></div>
            </div>
        `;

        target.querySelectorAll('.existing-user-btn').forEach(btn => {
            btn.addEventListener('click', () => { this.signInUser(btn.getAttribute('data-username')); });
        });

        target.querySelector('#signin-btn').addEventListener('click', () => {
            const username = target.querySelector('#existing-username').value.trim();
            if (username) { this.signInUser(username); } else { this.showSignInError('Please enter a username or select from existing profiles.'); }
        });

        if (!container) {
            const cancelBtn = target.querySelector('#cancel-signin');
            if (cancelBtn) cancelBtn.addEventListener('click', () => { target.innerHTML = ''; });
        }

        target.querySelector('#existing-username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') target.querySelector('#signin-btn').click();
        });
    },

    getExistingUsers: function() {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('lipikit_userProfile_')) {
                try {
                    const userProfile = JSON.parse(localStorage.getItem(key));
                    if (userProfile && userProfile.displayName && userProfile.userId) {
                        users.push(userProfile);
                    }
                } catch (error) {
                    console.error('Error parsing user profile:', error);
                }
            }
        }
        return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    signInUser: function(username) {
        const users = this.getExistingUsers();
        const userProfile = users.find(user => user.displayName === username);

        if (userProfile) {
            // Set current user
            localStorage.setItem('lipikit_currentUser', userProfile.userId);
            this.currentUser = userProfile;

            // Re-render everything
            this.renderProfileSection();

            // Clear profile section
            document.getElementById('profile-section').innerHTML = '';

            // Show welcome back message
            this.showWelcomeBackMessage(username);

            // Ensure version.json initialized
            DatasetManager.initializeFromLocal();

            // Send diagnostics
            if (typeof AppConfig !== 'undefined') {
                AppConfig.sendDiagnostics('SI', this.currentUser, this.lipikit_installId);
            }
        } else {
            this.showSignInError(`No profile found for username "${username}". Please check the spelling or create a new profile.`);
        }
    },

    showSignInError: function(message) {
        const errorDiv = document.getElementById('signin-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');

            // Hide error after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
    },

    handleProfileCreation: function(event) {
        event.preventDefault();

        const displayName = document.getElementById('display-name').value.trim();

        // Validation
        if (!displayName) {
            this.showProfileError('Please enter a username.');
            return;
        }

        if (displayName.length < 2) {
            this.showProfileError('Username must be at least 2 characters long.');
            return;
        }

        if (displayName.length > 50) {
            this.showProfileError('Username must be less than 50 characters.');
            return;
        }

        if (displayName.toLowerCase() === 'guest') {
            this.showProfileError('Username "Guest" is not allowed. Please choose a different username.');
            return;
        }

        // Check for inappropriate content (basic filter)
        const inappropriate = ['admin', 'root', 'system', 'null', 'undefined'];
        if (inappropriate.some(word => displayName.toLowerCase().includes(word))) {
            this.showProfileError('This username is not allowed. Please choose a different one.');
            return;
        }

        // Check if username already exists
        const existingUsers = this.getExistingUsers();
        if (existingUsers.some(user => user.displayName.toLowerCase() === displayName.toLowerCase())) {
            this.showProfileError('This username already exists. Please choose a different one or sign in to existing profile.');
            return;
        }

        // Create user profile
        this.createUserProfile(displayName);
    },

    createUserProfile: function(displayName) {
        if (typeof AppConfig === 'undefined') {
            console.error('AppConfig not available');
            return;
        }

        // Generate new user ID
        const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Create user object
        this.currentUser = {
            userId: userId,
            displayName: displayName,
            createdAt: new Date().toISOString(),
            lipikit_installId: this.lipikit_installId
        };

        // Save to localStorage with user-specific key
        try {
            localStorage.setItem(`lipikit_userProfile_${userId}`, JSON.stringify(this.currentUser));
            localStorage.setItem('lipikit_currentUser', userId);

            // Send user creation diagnostic
            AppConfig.sendDiagnostics('U', this.currentUser, this.lipikit_installId);

            // Re-render profile section
            this.renderProfileSection();

            // Clear profile section
            document.getElementById('profile-section').innerHTML = '';

            // Show success message
            this.showWelcomeMessage(displayName);

            // 👉 ADD THIS LINE
            DatasetManager.initializeFromLocal();

        } catch (error) {
            console.error('Failed to save user profile:', error);
            this.showProfileError('Failed to create profile. Please try again.');
        }
    },

    showProfileError: function(message) {
        const errorDiv = document.getElementById('profile-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');

            // Hide error after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
    },

    showWelcomeMessage: function(displayName) {
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'modal';
        welcomeModal.innerHTML = `
            <div class="modal-content text-center">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Welcome, ${displayName}!</h2>
                <p>Your profile has been created successfully. You can now start using the app.</p>
                <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">Your data is stored locally and can be synced across devices when you're online.</p>
                <button id="welcome-continue" class="btn btn-primary" style="margin-top: 2rem;">Get Started</button>
            </div>
        `;

        document.body.appendChild(welcomeModal);

        document.getElementById('welcome-continue').addEventListener('click', () => {
            document.body.removeChild(welcomeModal);
        });

        setTimeout(() => {
            if (document.body.contains(welcomeModal)) {
                document.body.removeChild(welcomeModal);
            }
        }, 5000);
    },

    showWelcomeBackMessage: function(displayName) {
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'modal';
        welcomeModal.innerHTML = `
            <div class="modal-content text-center">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Welcome Back, ${displayName}!</h2>
                <p>You've successfully signed in. Your previous data has been restored.</p>
                <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">All your previous data and settings are available.</p>
                <button id="welcomeback-continue" class="btn btn-primary" style="margin-top: 2rem;">Continue</button>
            </div>
        `;

        document.body.appendChild(welcomeModal);

        document.getElementById('welcomeback-continue').addEventListener('click', () => {
            document.body.removeChild(welcomeModal);
        });

        setTimeout(() => {
            if (document.body.contains(welcomeModal)) {
                document.body.removeChild(welcomeModal);
            }
        }, 5000);
    },

    showSwitchUserConfirmation: function() {
        if (typeof showConfirmation !== 'undefined') {
            showConfirmation(
                'Switch User',
                'Switching users will clear the current session. Any unsynced data will remain in local storage. Are you sure you want to continue?',
                () => {
                    // Clear current user
                    localStorage.removeItem('lipikit_currentUser');
                    this.currentUser = null;

                    // Re-render profile section
                    this.renderProfileSection();

                    // Ensure version.json initialized (in case it was missing)
                    DatasetManager.initializeFromLocal();

                    // Send diagnostics
                    if (typeof AppConfig !== 'undefined') {
                        AppConfig.sendDiagnostics('SU', null, this.lipikit_installId);
                    }
                }
            );
        } else {
            if (confirm('Switching users will clear the current session. Any unsynced data will remain in local storage. Are you sure you want to continue?')) {
                // Clear current user
                localStorage.removeItem('lipikit_currentUser');
                this.currentUser = null;

                // Re-render profile section
                this.renderProfileSection();

                // Send diagnostics
                if (typeof AppConfig !== 'undefined') {
                    AppConfig.sendDiagnostics('SU', null, this.lipikit_installId);
                }
            }
        }
    },

    isUserLoggedIn: function() {
        return !!this.currentUser;
    },

    getCurrentUser: function() {
        return this.currentUser;
    }
};