// settings.js - Common Settings Manager
const SettingsManager = {
    init: function() {
        // No rendering here, just bind events
        this.bindEvents();
    },

    renderPrivacyDataSection: function() {
        return `
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Privacy & Data</h3>
                
                <div class="form-group">
                    <button id="export-data-btn" class="btn btn-secondary" style="width: 100%;">
                        Export My Data
                    </button>
                    <small style="color: #6b7280; display: block; margin-top: 0.5rem;">
                        Download all your app data as a JSON file for backup or transfer.
                    </small>
                </div>
                
                <div class="form-group">
                    <button id="view-storage-info-btn" class="btn btn-secondary" style="width: 100%;">
                        View Storage Information
                    </button>
                    <small style="color: #6b7280; display: block; margin-top: 0.5rem;">
                        See how much storage space the app is using on your device.
                    </small>
                </div>
            </div>
        `;
    },

    renderDataManagementSection: function() {
        return `
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Data Management</h3>
                
                <div class="form-group">
                    <button id="clear-all-data-btn" class="btn btn-danger" style="width: 100%;">
                        Sign Out & Clear All Data
                    </button>
                    <small style="color: #6b7280; display: block; margin-top: 0.5rem;">
                        This will sign you out and permanently delete all your app data, including settings and application data. This action cannot be undone.
                    </small>
                </div>
            </div>
        `;
    },

    renderSupportInfoSection: function() {
        const appVersion = (typeof AppConfig !== 'undefined') ? AppConfig.config.appVersion : 'v1.0.0';
        return `
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Support & Information</h3>
                
                <div class="form-group">
                    <button id="contact-support-btn" class="btn btn-secondary" style="width: 100%;">
                        Contact Support
                    </button>
                    <small style="color: #6b7280; display: block; margin-top: 0.5rem;">
                        Get help with the app, report issues, or suggest new features.
                    </small>
                </div>
                
                <div class="form-group">
                    <label>App Version</label>
                    <div style="background: #f9fafb; padding: 0.75rem; border-radius: 6px; font-family: monospace;">
                        ${appVersion}
                    </div>
                </div>
            </div>
        `;
    },

       
renderSecuritySection: function() {
        const currentTimeout = localStorage.getItem('lipikit_autoLogoutDays') || '30';
        
        return `
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Security</h3>
                
                <div class="form-group">
                    <label for="auto-logout-timeout">Auto Logout After Inactivity</label>
                    <select id="auto-logout-timeout" class="form-control" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;">
                        <option value="1" ${currentTimeout === '1' ? 'selected' : ''}>1 day</option>
                        <option value="7" ${currentTimeout === '7' ? 'selected' : ''}>7 days</option>
                        <option value="30" ${currentTimeout === '30' ? 'selected' : ''}>30 days (Recommended)</option>
                        <option value="90" ${currentTimeout === '90' ? 'selected' : ''}>90 days</option>
                        <option value="never" ${currentTimeout === 'never' ? 'selected' : ''}>Never</option>
                    </select>
                    <small style="color: #6b7280; display: block; margin-top: 0.5rem;">
                        You'll be automatically signed out after this period of inactivity. Changes take effect on next login.
                    </small>
                </div>
            </div>
        `;
    },
    
    bindEvents: function() {
        document.addEventListener('click', (e) => {
            switch(e.target.id) {
                case 'clear-all-data-btn':
                    this.handleClearAllData();
                    break;
                case 'contact-support-btn':
                    this.handleContactSupport();
                    break;
                case 'export-data-btn':
                    this.handleExportData();
                    break;
                case 'view-storage-info-btn':
                    this.handleViewStorageInfo();
                    break;
                case 'close-settings-btn':
                    this.handleCloseSettings();
                    break;
            }
        });
    },
    
    handleClearAllData: function() {
        const confirmationMessage = `
            This will permanently delete ALL your app data including:
            • User profile and settings
            • All application data and files
            • Cached information
            
            This action cannot be undone. Are you absolutely sure?
        `;
        
        if (typeof showConfirmation !== 'undefined') {
            showConfirmation(
                'Clear All App Data',
                confirmationMessage,
                () => {
                    this.clearAllAppData();
                }
            );
        } else {
            if (confirm(confirmationMessage)) {
                this.clearAllAppData();
            }
        }
    },
    
    clearAllAppData: async function() {
        try {
            // 🆕 STEP 1: Sign out from Firebase first
            if (typeof ProfileManager !== 'undefined' && ProfileManager.firebaseAuth) {
                try {
                    await ProfileManager.firebaseAuth.signOut();
                    console.log('User signed out from Firebase');
                } catch (signOutError) {
                    console.error('Error signing out:', signOutError);
                }
            }
            
            // STEP 2: Clear localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('lipikit_') || key.startsWith('lipikit-') || 
                           key.startsWith('firebase:') || key.includes('firebase'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // STEP 3: Clear sessionStorage
            sessionStorage.clear();
            
            // STEP 4: Clear IndexedDB (both app and Firebase databases)
            if (indexedDB && indexedDB.databases) {
                const dbs = await indexedDB.databases();
                for (const db of dbs) {
                    if (db.name && (db.name.startsWith('lipikit_') || 
                                   db.name.startsWith('lipikit-') ||
                                   db.name.includes('firebase'))) {
                        console.log('Deleting database:', db.name);
                        indexedDB.deleteDatabase(db.name);
                    }
                }
            } else {
                // Fallback for browsers that don't support databases()
                const dbsToDelete = [
                    'lipikit_user_trips',
                    'lipikit_responses',
                    'firebaseLocalStorageDb' // Firebase's default DB
                ];
                dbsToDelete.forEach(dbName => {
                    indexedDB.deleteDatabase(dbName);
                });
            }
            
            // STEP 5: Clear service worker cache (if exists)
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            alert('All app data has been cleared successfully. The page will now reload.');
            window.location.reload();
            
        } catch (error) {
            console.error('Error clearing app data:', error);
            alert('An error occurred while clearing app data. Please try again or contact support.');
        }
    },


    handleContactSupport: function() {
        const supportEmail = (typeof AppConfig !== 'undefined') ? 
                           AppConfig.config.links.support : 'mailto:connect@sparkyminis.com';
        
        const systemInfo = this.getSystemInfo();
        const appVersion = (typeof AppConfig !== 'undefined') ? AppConfig.config.appVersion : 'Unknown';
        const appName = (typeof AppConfig !== 'undefined') ? 
                       `${AppConfig.config.companyName} ${AppConfig.config.appName}` : 'LipiKit App';
        
        const emailBody = `
Hello Support Team,

I need assistance with ${appName}.

App Version: ${appVersion}
System Information: ${systemInfo}

Please describe your issue below:
[Describe your issue here]

Thank you,
        `.trim();
        
        const mailtoLink = `${supportEmail}?subject=Support Request - ${appName}&body=${encodeURIComponent(emailBody)}`;
        
        window.open(mailtoLink, '_blank');
    },
    
    handleExportData: function() {
        try {
            const appData = this.getAllAppData();
            const timestamp = new Date().toISOString().split('T')[0];
            const appName = (typeof AppConfig !== 'undefined') ? 
                           AppConfig.config.appName.toLowerCase() : 'app';
            
            const exportData = {
                exportInfo: {
                    appName: (typeof AppConfig !== 'undefined') ? 
                            `${AppConfig.config.companyName} ${AppConfig.config.appName}` : 'LipiKit App',
                    version: (typeof AppConfig !== 'undefined') ? AppConfig.config.appVersion : 'Unknown',
                    exportDate: new Date().toISOString(),
                    dataKeys: Object.keys(appData)
                },
                appData: appData
            };
            
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lipikit_${appName}_backup_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            alert('Your app data has been exported successfully!');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('An error occurred while exporting your data. Please try again.');
        }
    },
    
    handleViewStorageInfo: function() {
        const storageInfo = this.getStorageInfo();
        const modalHtml = `
            <div class="modal" id="storage-info-modal" style="display: flex;">
                <div class="modal-content">
                    <h2>Storage Information</h2>
                    <div style="text-align: left; margin: 1.5rem 0;">
                        <h3 style="margin-bottom: 1rem;">Local Storage Usage:</h3>
                        <ul style="list-style: none; padding: 0;">
                            ${storageInfo.details.map(item => `
                                <li style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; margin-bottom: 0.25rem; border-radius: 4px;">
                                    <span>${item.key}</span>
                                    <span style="font-weight: 500;">${item.size}</span>
                                </li>
                            `).join('')}
                        </ul>
                        <div style="margin-top: 1rem; padding: 1rem; background: #e0f2fe; border-radius: 8px;">
                            <strong>Total Storage Used: ${storageInfo.totalSize}</strong>
                        </div>
                        <div style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
                            <p>Storage quota varies by browser and device. Most browsers allow 5-10MB for localStorage per domain.</p>
                        </div>
                    </div>
                    <button onclick="document.body.removeChild(document.getElementById('storage-info-modal'))" class="btn btn-primary">Close</button>
                </div>
            </div>
        `;
        
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHtml;
        document.body.appendChild(modalElement.firstElementChild);
    },
    
    handleCloseSettings: function() {
        if (typeof hideModal !== 'undefined') {
            hideModal('settings-modal');
        } else {
            document.getElementById('settings-modal').classList.add('hidden');
        }
    },
    
    getSystemInfo: function() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        return Object.entries(info)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    },
    
    getAllAppData: function() {
        const appData = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('lipikit_') || key.startsWith('lipikit-'))) {
                try {
                    appData[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    appData[key] = localStorage.getItem(key);
                }
            }
        }
        
        return appData;
    },
    
    getStorageInfo: function() {
        const details = [];
        let totalBytes = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('lipikit_') || key.startsWith('lipikit-'))) {
                const value = localStorage.getItem(key);
                const bytes = new Blob([value]).size;
                totalBytes += bytes;
                
                details.push({
                    key: key,
                    size: this.formatBytes(bytes)
                });
            }
        }
        
        return {
            details: details,
            totalSize: this.formatBytes(totalBytes),
            totalBytes: totalBytes
        };
    },
    
    formatBytes: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}