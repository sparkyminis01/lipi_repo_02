const AppSettingsManager={appSettings:{},init:function(){this.loadAppSettings();this.renderAppSettingsPage();this.bindEvents();},loadAppSettings:function(){try{const storageKey=this.getStorageKey();const savedSettings=localStorage.getItem(storageKey);if(savedSettings){this.appSettings=JSON.parse(savedSettings);}else{this.appSettings=this.getDefaultSettings();}}catch(error){console.error('Failed to load app settings:',error);this.appSettings=this.getDefaultSettings();}},getDefaultSettings:function(){return{preferences:{homeCurrency:'USD',homeLocation:'',defaultExpenseCategory:'Food',defaultPaymentMode:'Cash'},datasets:{questions:"questions_master",checklist:"checklist_master",ads:"ads_master",attractions:"attractions_master",itinerary:"itinerary_master",keymap:"keymap",fieldOptions:"field_options"},adtag:`
<ins class="adsbygoogle"
     style="display:none; height:1px; width:1px; overflow:hidden; position:absolute;"
     data-ad-client="ca-pub-6822234477749633"
     data-ad-slot="9821322455"
     data-ad-format="auto"
     data-full-width-responsive="true">
</ins>`};},renderAppSettingsPage:function(){const appSettingsDiv=document.getElementById('app-settings');if(!appSettingsDiv)return;appSettingsDiv.innerHTML=`
            ${this.renderTravelPreferencesSection()}
            ${SettingsManager.renderSecuritySection()}
            ${SettingsManager.renderPrivacyDataSection()}
            ${SettingsManager.renderDataManagementSection()}
            ${SettingsManager.renderSupportInfoSection()}
            
            <div class="form-group">
                <button id="reset-trip-settings-btn" class="btn btn-secondary" style="width: 100%;">
                    Reset Trip Settings to Default
                </button>
                <small style="color: #6b7280; display: block; margin-top: 0.5rem;">
                    This will reset all trip-specific settings to their default values.
                </small>
            </div>
            
            <div style="text-align: center; padding-top: 1rem; margin-top: 1rem;">
                <button id="close-settings-btn" class="btn btn-primary" style="width: 100%;">Close Settings</button>
            </div>
            
            <style>
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                }
                
                .checkbox-label input[type="checkbox"] {
                    width: auto;
                    margin-right: 0.5rem;
                    margin-bottom: 0;
                }
                
                .checkbox-label:hover {
                    color: var(--primary-color);
                }
            </style>
        `;},renderTravelPreferencesSection:function(){return`
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Travel Preferences</h3>
                
                <div class="form-group">
                    <label for="home-currency">Home Currency</label>
                    <select id="home-currency">
                        ${this.renderCurrencyOptions()}
                    </select>
                    <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
                        This will be selected by default when creating new trips
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="home-location">Home Location</label>
                    <input type="text" id="home-location" 
                           placeholder="e.g., Mumbai, India" 
                           value="${this.appSettings.preferences.homeLocation}">
                    <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
                        Your default location for trip planning
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="default-category">Default Expense Category</label>
                    <select id="default-category">
                        ${this.renderCategoryOptions()}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="default-payment-mode">Default Payment Mode</label>
                    <select id="default-payment-mode">
                        ${this.renderPaymentModeOptions()}
                    </select>
                </div>
            </div>
        `;},renderCurrencyOptions:function(){const currencies=(typeof AppConfig!=='undefined')?AppConfig.config.currencies:['USD','EUR','GBP','INR'];const currencyNames=(typeof AppConfig!=='undefined')?AppConfig.config.currencyNames:{};return currencies.map(currency=>{const name=currencyNames[currency]||currency;const selected=this.appSettings.preferences.homeCurrency===currency?'selected':'';return`<option value="${currency}" ${selected}>${currency} - ${name}</option>`;}).join('');},renderCategoryOptions:function(){const categories=(typeof AppConfig!=='undefined')?AppConfig.config.categories:['Food','Transport','Accommodation','Shopping','Other'];return categories.map(category=>{const selected=this.appSettings.preferences.defaultExpenseCategory===category?'selected':'';return`<option value="${category}" ${selected}>${category}</option>`;}).join('');},renderPaymentModeOptions:function(){const modes=(typeof AppConfig!=='undefined')?AppConfig.config.modes:['Cash','Credit Card','Prepaid Card'];return modes.map(mode=>{const selected=this.appSettings.preferences.defaultPaymentMode===mode?'selected':'';return`<option value="${mode}" ${selected}>${mode}</option>`;}).join('');},bindEvents:function(){document.addEventListener('change',(e)=>{switch(e.target.id){case'home-currency':this.appSettings.preferences.homeCurrency=e.target.value;this.saveAppSettings();break;case'home-location':this.appSettings.preferences.homeLocation=e.target.value;this.saveAppSettings();break;case'default-category':this.appSettings.preferences.defaultExpenseCategory=e.target.value;this.saveAppSettings();break;case'default-payment-mode':this.appSettings.preferences.defaultPaymentMode=e.target.value;this.saveAppSettings();break;}});document.addEventListener('click',(e)=>{if(e.target.id==='reset-trip-settings-btn'){this.handleResetSettings();}});},handleResetSettings:function(){const confirmationMessage='Are you sure you want to reset all trip settings to their default values?';if(typeof showConfirmation!=='undefined'){showConfirmation('Reset Trip Settings',confirmationMessage,()=>{this.resetToDefaults();});}else{if(confirm(confirmationMessage)){this.resetToDefaults();}}},resetToDefaults:function(){this.appSettings=this.getDefaultSettings();this.saveAppSettings();this.renderAppSettingsPage();const successModal=document.createElement('div');successModal.className='modal';successModal.innerHTML=`
            <div class="modal-content text-center">
                <h2 style="color: var(--primary-color);">Settings Reset</h2>
                <p>All trip settings have been reset to their default values.</p>
                <button onclick="document.body.removeChild(this.closest('.modal'))" class="btn btn-primary" style="margin-top: 1rem;">OK</button>
            </div>
        `;document.body.appendChild(successModal);setTimeout(()=>{if(document.body.contains(successModal)){document.body.removeChild(successModal);}},3000);},saveAppSettings:function(){try{const storageKey=this.getStorageKey();localStorage.setItem(storageKey,JSON.stringify(this.appSettings));}catch(error){console.error('Failed to save app settings:',error);}},getStorageKey:function(){if(typeof AppConfig!=='undefined'){return AppConfig.config.storageKeys.appSettings;}
return'lipikit_trip_settings';},getHomeCurrency:function(){return this.appSettings.preferences.homeCurrency||'USD';},getHomeLocation:function(){return this.appSettings.preferences.homeLocation||'';},getDefaultCategory:function(){return this.appSettings.preferences.defaultExpenseCategory||'Food';},getDefaultPaymentMode:function(){return this.appSettings.preferences.defaultPaymentMode||'Cash';},getTripDefaults:function(){return{baseCurrency:this.getHomeCurrency(),location:this.getHomeLocation(),defaultCategory:this.getDefaultCategory(),defaultPaymentMode:this.getDefaultPaymentMode()};},applyAllSettings:function(){console.debug("applyAllSettings() is deprecated and no longer needed.");}};if(typeof window!=='undefined'){window.AppSettings={datasets:AppSettingsManager.appSettings?.datasets||AppSettingsManager.getDefaultSettings().datasets};}