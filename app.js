const TripCreditManager={FREE_CREDITS:3,checkCreationAllowed(user){if(!user){return{canCreate:false,creditsRemaining:0,message:'No user logged in'};}
if(user.plan==='pro'){return{canCreate:true,creditsRemaining:null,message:'Unlimited trips'};}
const creditsUsed=user.tripCreditsUsed||0;const creditsRemaining=Math.max(0,this.FREE_CREDITS-creditsUsed);const canCreate=creditsRemaining>0;return{canCreate,creditsRemaining,creditsUsed,message:canCreate?`${creditsRemaining} trip${creditsRemaining !== 1 ? 's' : ''} remaining`:'All free trips used'};},async consumeCredit(user){try{if(!user||user.plan==='pro')return true;user.tripCreditsUsed=(user.tripCreditsUsed||0)+1;if(ProfileManager.firestore&&user.userId){const userRef=ProfileManager.firestore.collection('users').doc(user.userId);await userRef.set({tripCreditsUsed:user.tripCreditsUsed},{merge:true});console.log(`Credit consumed. Credits used: ${user.tripCreditsUsed}`);}
return true;}catch(error){console.error('Failed to consume credit:',error);return false;}},getHeaderInfo(user){if(!user){return{display:'',creditsRemaining:0,isPremium:false};}
const isPremium=user.plan==='pro';if(isPremium){return{display:'∞ Unlimited',creditsRemaining:null,isPremium:true};}
const creditsUsed=user.tripCreditsUsed||0;const creditsRemaining=Math.max(0,this.FREE_CREDITS-creditsUsed);return{display:`${creditsRemaining}/${this.FREE_CREDITS} trips`,creditsRemaining,isPremium:false};},showUpgradePrompt(){const upgradeModal=document.createElement('div');upgradeModal.className='modal app-modal';upgradeModal.id='upgrade-prompt-modal';upgradeModal.innerHTML=`
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">✈️</div>
        
        <h2 style="color: var(--primary-color); margin-bottom: 0.5rem;">
          You've used all 3 free trip credits
        </h2>
        
        <p style="color: var(--text-light); margin-bottom: 1.5rem; font-size: 0.95rem;">
          Ready for unlimited travel planning? Upgrade to Pro and create as many trips as you want!
        </p>

        <div style="background: #f0fdf4; border-left: 4px solid var(--success-color); padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; text-align: left;">
          <strong style="color: #15803d;">Pro Plan Benefits:</strong>
          <ul style="margin: 0.5rem 0 0 1rem; color: #047857; font-size: 0.9rem;">
            <li>∞ Unlimited trips</li>
            <li>Advanced analytics</li>
            <li>Cloud sync (coming soon)</li>
            <li>Priority support</li>
          </ul>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
          <a href="https://rzp.io/rzp/NiFP60q" target="_blank" class="btn btn-primary" style="text-decoration: none; padding: 1rem;">
            <strong>Upgrade Now</strong>
          </a>
          <button id="upgrade-cancel-btn" class="btn btn-secondary" style="padding: 1rem;">
            Maybe Later
          </button>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-light);">
          Questions? <a href="mailto:connect@sparkyminis.com" style="color: var(--primary-color); text-decoration: none;">Contact support</a>
        </p>
      </div>
    `;document.body.appendChild(upgradeModal);upgradeModal.querySelector('#upgrade-cancel-btn').addEventListener('click',()=>{upgradeModal.remove();});upgradeModal.addEventListener('click',(e)=>{if(e.target===upgradeModal)upgradeModal.remove();});}};const AppManager={isInitialized:false,activeTrip:null,conversionRates:{},lastRatesFetchDate:null,currentLocation:null,summaryMode:'local',syncAttemptOrigin:null,currentTripView:'dashboard',checklistLinksData:{},tripCreationStep:1,maxTripCreationSteps:2,currentTripData:null,questionsData:null,currentQuestionPage:0,questionsPerPage:3,userResponses:{},documentTypes:['ID Proof','Passport','Visa','Flight Ticket','Hotel Booking','Train Ticket','Insurance','Vaccination Certificate','Receipt','Itinerary','Other'],currentDocumentFilter:'all',currentDocumentSearch:'',init:function(){if(typeof ProfileManager!=='undefined'&&ProfileManager.isUserLoggedIn()){this.loadAppData();this.renderApp();this.bindEvents();this.setupNetworkStatus();this.isInitialized=true;this.applyUserSettings();}else{const appArea=document.getElementById('app-area');if(appArea)appArea.classList.add('hidden');}
this.setupUserLoginListener();},loadAppData:function(){try{const savedActiveTrip=localStorage.getItem(this.getStorageKey('activeTrip'));if(savedActiveTrip){this.activeTrip=JSON.parse(savedActiveTrip);this.loadConversionRates();}}catch(error){console.error('Failed to load app data:',error);}},loadConversionRates:function(){if(!this.activeTrip)return;try{const allRates=JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates')))||{};this.conversionRates=allRates[this.activeTrip.id]||{};this.lastRatesFetchDate=allRates[this.activeTrip.id]?.lastFetchDate||null;}catch(e){this.conversionRates={};this.lastRatesFetchDate=null;}},renderApp:function(){const appArea=document.getElementById('app-area');if(!appArea)return;appArea.classList.remove('hidden');if(this.activeTrip){if(this.currentTripView==='expense'){this.renderExpenseView();}else{this.renderTripDashboardView();}}else{this.renderTripSelectionView();}},renderTripSelectionView:function(){const appArea=document.getElementById('app-area');const user=ProfileManager?ProfileManager.getCurrentUser():null;const userName=user?user.displayName.split(' ')[0]:'User';const creditInfo=TripCreditManager.getHeaderInfo(user);const creditDisplay=creditInfo.isPremium?'<span style="color: #10b981; font-weight: 700;">∞ Unlimited Trips</span>':`<span style="color: var(--primary-color); font-weight: 700;">${creditInfo.creditsRemaining}/${TripCreditManager.FREE_CREDITS} trips</span>`;appArea.innerHTML=`
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
        <div>
          <h1><span style="color: var(--primary-color);">Hi ${userName}!</span> Your Trips</h1>
          <p class="currency-name" style="margin: 0.5rem 0 0;">Manage your travel adventures and track expenses across multiple trips.</p>
          <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            ${creditDisplay}
            <button id="credit-info-btn" class="btn-help-icon" title="Learn about trip credits" 
                    style="background: none; border: none; cursor: help; font-size: 1.2rem; padding: 0; color: var(--primary-color);">
              ⓘ
            </button>
          </div>
        </div>
        <div id="plan-badge" style="text-align: right;">
          ${user && user.plan === 'pro' 
            ? '<span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">✓ PRO</span>'
            : '<span style="background: #94a3b8; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">FREE</span>'}
        </div>
      </div>
      
      <button id="add-trip-btn" class="btn btn-primary btn-full">+ Add New Trip</button>
      
      <div id="trip-creation-container" class="hidden">
        ${this.renderTripCreationForm()}
      </div>
      
      <div id="trip-list" style="margin-top: 2rem;">
        ${this.renderTripList()}
      </div>
      ${this.renderAdsenseBlock()}
    </div>
  `;const creditInfoBtn=document.getElementById('credit-info-btn');if(creditInfoBtn){creditInfoBtn.addEventListener('click',(e)=>{e.stopPropagation();this.showMessage('Trip Credits',`<div style="text-align: left;">
          <p><strong>Free Plan:</strong> Create up to 3 trips</p>
          <p style="color: var(--text-light); font-size: 0.9rem;">Each trip creation uses 1 credit. Deleting trips doesn't refund credits.</p>
          <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
          <p><strong>Pro Plan:</strong> Unlimited trips</p>
          <p style="color: var(--text-light); font-size: 0.9rem;">Upgrade anytime to unlock unlimited trip creation and more features.</p>
        </div>`,false,true);});}
this.initTripBasicFormWidgets();this.initializeAds();},renderTripCreationForm:function(){if(this.tripCreationStep===1){return this.renderTripBasicInfoForm();}else if(this.tripCreationStep===2){const filteredQuestions=this.getFilteredQuestions();const totalQuestions=filteredQuestions.length;const startIdx=this.currentQuestionPage*this.questionsPerPage;const endIdx=Math.min(startIdx+this.questionsPerPage,totalQuestions);const isLastPage=endIdx>=totalQuestions;return this.renderTripQuestionsForm().replace('<button type="submit" class="btn btn-primary">',`<button type="submit" class="btn btn-primary">${isLastPage ? 'Complete Trip Setup' : 'Save and Next'}`);}},renderTripBasicInfoForm:function(){const q=Array.isArray(this.questionsData)?this.questionsData:[];const currencyQ=q.find(x=>x&&(x.id==='tripCurrencies'||x.id==='currencyList'||x.id==='currencies_master'||x.id==='currency_master'));const countryIdCandidates=['tripDestinations','countryList','countries_master','country_master','countries','destinations','countryList_master','tripDestinations_master','tripCountries','countriesList'];const countryQ=q.find(x=>x&&countryIdCandidates.includes(x.id));const normalizeOption=(opt)=>{if(!opt)return null;if(typeof opt==='string')return{value:opt,label:opt};if(opt.id&&opt.name)return{value:opt.id,label:`${opt.id} - ${opt.name}`};if(opt.code&&opt.name)return{value:opt.code,label:`${opt.code} - ${opt.name}`};if(opt.value&&opt.label)return{value:opt.value,label:opt.label};const asText=typeof opt==='object'?(opt.name||opt.text||JSON.stringify(opt)):String(opt);const asVal=opt.id||opt.code||opt.value||asText;return{value:asVal,label:`${asVal} - ${asText}`};};const currencyOptions=Array.isArray(currencyQ?.options)?currencyQ.options.map(normalizeOption).filter(Boolean):[];const countryOptions=Array.isArray(countryQ?.options)?countryQ.options.map(normalizeOption).filter(Boolean):[];this._pendingTripCurrencyOptions=currencyOptions;this._pendingTripCountryOptions=countryOptions;return`
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
                        ${currencyOptions.map(opt => `<option value="${opt.value}"${this.currentTripData?.baseCurrency===opt.value?'selected':''}>${opt.label}</option>`).join('')}
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
    `;},getFilteredQuestions:function(){if(!this.questionsData||!Array.isArray(this.questionsData))return[];const excludeIds=['tripCurrencies','currencyList','currencies_master','currency_master','tripDestinations','countryList','countries_master','country_master','countries','destinations','countryList_master','tripDestinations_master','tripCountries','countriesList'];return this.questionsData.filter(q=>q&&!excludeIds.includes(q.id));},renderTripQuestionsForm:function(){if(!this.questionsData||!Array.isArray(this.questionsData)){return`
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
        `;}
const filteredQuestions=this.getFilteredQuestions();const totalQuestions=filteredQuestions.length;if(totalQuestions===0){this.completeTripCreation();return'';}
const startIdx=this.currentQuestionPage*this.questionsPerPage;const endIdx=Math.min(startIdx+this.questionsPerPage,totalQuestions);const currentQuestions=filteredQuestions.slice(startIdx,endIdx);const isLastPage=endIdx>=totalQuestions;return`
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
    `;},renderQuestionItem:function(question,questionIndex){const questionId=question.id||`q_${questionIndex}`;const type=question.type||'single';const currentResponse=this.userResponses[questionId]||(type==='multi'?[]:'');return`
      <div class="question-item" data-question-id="${questionId}" data-type="${type}">
        <h3 class="question-title">${question.text}</h3>
        <div class="question-options">
          ${question.options.map(option => `<button type="button"
class="quick-select-btn question-option ${(Array.isArray(currentResponse) ? currentResponse.includes(option) : currentResponse === option) ? 'active' : ''}"
data-question-id="${questionId}"
data-value="${option}">${option}</button>`).join('')}
        </div>
      </div>`;},renderTripDashboardView:function(){const appArea=document.getElementById('app-area');if(!this.activeTrip)return;const totalExpenses=this.getAllExpenses().length;const totalAmount=this.calculateTripTotal();const status=this.getTripStatusTag(this.activeTrip);const statusHtml=status?`<span class="trip-tag ${status.className}">${status.label}</span>`:"";appArea.innerHTML=`
            <div class="card">
                <div class="trip-header-bar">
                    <button type="button" id="back-to-trips-btn" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Trips</button>
                </div>
                
                <h1 class="trip-view-title">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">Trip: 
                            <span style="color: var(--primary-color);">${this.escapeHtml(this.activeTrip.name)}</span>
                            ${statusHtml}
                        </div>
                        <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.025em;">
                            Base: ${this.activeTrip.baseCurrency} - ${this.formatTripDates()}
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
                        <h3><i class="fas fa-wallet"></i> Manage Expenses</h3>
                        <p>Track your spending and manage your budget. <strong>${totalExpenses}</strong> expense${totalExpenses !== 1 ? 's' : ''} logged so far.</p>
                        <div class="action-buttons">
                            <button id="add-expense-btn" class="btn btn-success btn-full">+ Add Expense</button>
                            <button id="expense-summary-btn" class="btn btn-primary btn-full"><i class="fas fa-chart-line"></i> Summary</button>
                        </div>
                    </div>

                    <!-- Itinerary -->
                    <div class="action-card">
                        <h3><i class="fas fa-calendar"></i> Manage Itinerary</h3>
                        <p>Plan your daily activities and track completion. <strong>${this.getItineraryActivities().length}</strong> activit${this.getItineraryActivities().length !== 1 ? 'ies' : 'y'} planned.</p>
                        <div class="action-buttons">
                            <button id="track-itinerary-btn" class="btn btn-success btn-full"><i class="fas fa-check"></i> Track</button>
                            <button id="plan-itinerary-btn" class="btn btn-primary btn-full"><i class="fas fa-calendar-alt"></i> Plan</button>
                        </div>
                    </div>

                    <!-- Checklist -->
                    <div class="action-card">
                        <h3><i class="fas fa-clipboard"></i> Manage Checklist</h3>
                        <p>Keep track of your travel preparation and packing items.</p>
                        <div class="action-buttons">
                            <button id="view-checklist-btn" class="btn btn-success btn-full"><i class="fas fa-check"></i> View</button>
                            <button id="customize-checklist-btn" class="btn btn-primary btn-full"><i class="fas fa-pen"></i> Customize</button>
                        </div>
                    </div>

                    <!-- Travel Documents -->
                    <div class="action-card">
                        <h3><i class="fas fa-folder"></i> Manage Travel Documents</h3>
                        <p>Upload tickets, IDs, passports, visas. Store securely on your device.</p>
                        <div class="action-buttons">
                            <button id="open-document-manager-btn" class="btn btn-success btn-full"><i class="fas fa-file"></i> Open Manager</button>
                        </div>
                    </div>

                    <!-- Map Integration (Disabled) -->
                    <div class="action-card">
                        <h3><i class="fas fa-map"></i> Map & Locations</h3>
                        <p>Visualize your trip, save spots, get directions. Store your maps and routes.</p>
                        <div class="action-buttons">
                            <button class="btn btn-disabled btn-full" disabled>Coming Soon</button>
                        </div>
                    </div>

                    <!-- Travel Journal (Disabled) -->
                    <div class="action-card">
                        <h3><i class="fas fa-book"></i> Travel Journal</h3>
                        <p>Document your journey with photos, notes, and memories. Access beautiful custom made Travel report.</p>
                        <div class="action-buttons">
                            <button class="btn btn-disabled btn-full" disabled>Coming Soon</button>
                        </div>
                    </div>
                </div>

                <!-- Promo Section -->
                <div class="promo-container">
                    <div class="action-card promo-card">
                        <h3><i class="fas fa-shield"></i> Get Travel Insurance!</h3>
                        <p>Stay protected on your adventures. Personalized quote in minutes.</p>
                        <button id="promo-btn" class="btn btn-special btn-full">Get Quote</button>
                    </div>
                    
                    <div class="action-card promo-card">
                        <h3><i class="fas fa-laptop"></i> Travel Tech Deals</h3>
                        <p>Save on portable monitors, laptops, and tech accessories.</p>
                        <button id="promo-tech-btn" class="btn btn-special btn-full">View Deals</button>
                    </div>
                </div>

                ${this.renderAdsenseBlock()}
            </div>
        `;document.getElementById('add-expense-btn').addEventListener('click',()=>this.openExpenseViewTab('add-expense'));document.getElementById('expense-summary-btn').addEventListener('click',()=>this.openExpenseViewTab('expense-summary'));document.getElementById('back-to-trips-btn').addEventListener('click',()=>this.renderTripsListView());document.getElementById('plan-itinerary-btn').addEventListener('click',()=>this.renderItineraryView('plan'));document.getElementById('track-itinerary-btn').addEventListener('click',()=>this.renderItineraryView('track'));document.getElementById('open-document-manager-btn').addEventListener('click',()=>{this.renderDocumentManagerView();});if(document.getElementById('promo-btn')){document.getElementById('promo-btn').addEventListener('click',()=>this.handlePromoClick());}
if(document.getElementById('promo-tech-btn')){document.getElementById('promo-tech-btn').addEventListener('click',()=>this.handlePromoClick());}
this.initializeAds();},openExpenseViewTab:function(tabName){this.currentTripView='expense';this.renderExpenseView(tabName);},renderExpenseView:function(defaultTab='add-expense'){const appArea=document.getElementById('app-area');const status=this.getTripStatusTag(this.activeTrip);const statusHtml=status?`<span class="trip-tag ${status.className}">${status.label}</span>`:"";appArea.innerHTML=`
        <div class="card expense-view">
            <div class="trip-header-bar">
                <button type="button" id="back-to-dashboard-btn" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
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
                                    ðŸŒ
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
                            Synced Data <span class="toggle-icon"><i class="fas fa-chevron-down"></i></span>
                        </h3>
                        <ul id="synced-list" class="collapsible-content list-disc pl-1.5rem text-secondary"></ul>
                    </div>
                    <div class="collapsible-section mb-1rem">
                        <h3 id="unsynced-header" class="collapsible-header text-red" aria-expanded="true">
                            Unsynced Data <span class="toggle-icon"><i class="fas fa-chevron-down"></i></span>
                        </h3>
                        <ul id="unsynced-list" class="collapsible-content list-disc pl-1.5rem text-secondary"></ul>
                    </div>
                    <div class="data-queue-controls">
                        <button id="export-data-btn" class="btn btn-secondary"><i class="fas fa-download"></i> Export JSON</button>
                        <button id="manual-sync-btn" class="btn btn-success"><i class="fas fa-sync"></i> Sync Now (PIN)</button>
                    </div>
                </div>
            </div>
        </div>
    `;document.querySelectorAll('.expense-view .tab-header .tab-btn').forEach(button=>{button.addEventListener('click',()=>{const card=button.closest('.card');card.querySelectorAll('.tab-header .tab-btn').forEach(btn=>btn.classList.remove('active'));card.querySelectorAll('.tab-content').forEach(content=>content.classList.remove('active'));button.classList.add('active');const tabContentId=button.dataset.tab;const tabContent=document.getElementById(tabContentId);if(tabContent){tabContent.classList.add('active');}
this.initializeAds();});});const expenseDateInput=document.getElementById('expense-date');if(expenseDateInput){expenseDateInput.valueAsDate=new Date();this.enhanceDateInputs(['expense-date']);}
document.querySelectorAll('.collapsible-header').forEach(header=>{header.addEventListener('click',()=>{const content=header.nextElementSibling;const isExpanded=header.getAttribute('aria-expanded')==='true';const icon=header.querySelector('.toggle-icon');if(isExpanded){content.style.display='none';header.setAttribute('aria-expanded','false');icon.innerHTML='<i class="fas fa-chevron-down"></i>';}else{content.style.display='block';header.setAttribute('aria-expanded','true');icon.innerHTML='<i class="fas fa-chevron-right"></i>';}});});this.applyExpenseDefaults();this.updateNetworkStatus();this.renderExpenses();this.scrollToTop();},renderCurrencyOptions:function(){const currencies=AppConfig.config.currencies;const currencyNames=AppConfig.config.currencyNames;return currencies.map(currency=>{const name=currencyNames[currency]||currency;const selected=this.currentTripData&&this.currentTripData.currencies&&this.currentTripData.currencies.includes(currency)?'selected':'';return`<option value="${currency}" ${selected}>${currency} - ${name}</option>`;}).join('');},renderQuickSelectButtons:function(options,type){return options.map(option=>{return`<button type="button" class="quick-select-btn" data-type="${type}" data-value="${option}">${option}</button>`;}).join('');},renderConversionInputs:function(){if(!this.activeTrip)return'';const currencies=this.activeTrip.currencies||[];return currencies.map(curr=>{if(curr===this.activeTrip.baseCurrency){return`
                    <div class="base-rate-input-container">
                        <span class="base-rate-label">${curr} (${AppConfig.config.currencyNames[curr] || curr})</span>
                        <div class="base-rate-display">1</div>
                    </div>
                `;}else{const rateVal=this.conversionRates[curr]??'';return`
                    <div class="base-rate-input-container">
                        <label class="base-rate-label" for="base-rate-${curr}">${curr} (${AppConfig.config.currencyNames[curr] || curr})</label>
                        <input id="base-rate-${curr}" data-currency="${curr}" type="number" step="any" min="0" placeholder="e.g., 80" value="${rateVal}" class="base-rate-input" />
                    </div>
                `;}}).join('');},getTripStatusTag:function(trip){const startVal=trip.startDate||trip.start;const endVal=trip.endDate||trip.end;if(!startVal||!endVal)return null;const today=new Date();const start=new Date(startVal);const end=new Date(endVal);if(today>=start&&today<=end){return{label:"Active",className:"tag-active"};}
if(today<start){const diffDays=Math.ceil((start-today)/(1000*60*60*24));if(diffDays<=7)return{label:"Soon",className:"tag-soon"};if(diffDays<=30)return{label:"In a month",className:"tag-month"};return{label:"Upcoming",className:"tag-upcoming"};}
if(today>end){return{label:"Finished",className:"tag-finished"};}
return null;},renderTripCard:function(trip){const status=this.getTripStatusTag(trip);const statusHtml=status?`<span class="trip-tag ${status.className}">${status.label}</span>`:"";const startDate=this.formatDateForDisplay(trip.start||trip.startDate);const endDate=this.formatDateForDisplay(trip.end||trip.endDate);const duration=this.calculateTripDuration(trip.start||trip.startDate,trip.end||trip.endDate);const expenseCount=this.getAllExpensesForTrip(trip.id).length;const countriesDisplay=this.formatCountriesDisplay(trip.countries);return`
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
                        ${startDate} <i class="fa-solid fa-arrow-right-long"></i> ${endDate} (${duration})
                    </div>
                    <div class="currency-name" style="font-size: 0.75rem; margin-top: 0.25rem;">
                    ${expenseCount} expense${expenseCount !== 1 ? 's' : ''}
                    <i class="fa-solid fa-circle" style="font-size: 0.4rem; margin: 0 0.35rem;"></i>
                    ${trip.currencies ? trip.currencies.length : 0} currenc${(trip.currencies ? trip.currencies.length : 0) !== 1 ? 'ies' : 'y'}
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
    `;},renderTripList:function(){const user=ProfileManager?ProfileManager.getCurrentUser():null;const userId=user?user.userId:null;const trips=this.getLocalData('trips').filter(trip=>trip.userId===userId);if(!trips||trips.length===0){return`
            <div class="text-center" style="padding: 3rem 1rem; background: var(--bg-light); border-radius: var(--border-radius); border: 2px dashed var(--border-color);">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"><i class="fas fa-plane"></i></div>
                <h3 style="color: var(--text-medium); margin-bottom: 0.5rem; font-weight: 600;">No trips yet</h3>
                <p style="color: var(--text-light); font-size: 0.9rem; line-height: 1.5;">
                    Start planning your next adventure by creating your first trip above.
                    Track expenses, manage itineraries, and stay organized!
                </p>
            </div>
        `;}
const sortedTrips=trips.sort((a,b)=>{const dateA=new Date(a.start||a.startDate||a.createdAt);const dateB=new Date(b.start||b.startDate||b.createdAt);return dateB-dateA;});return`
        <div class="trip-list">
            ${sortedTrips.map(trip => this.renderTripCard(trip)).join('')}
        </div>
    `;},renderTotalsSummary:function(){if(!this.activeTrip)return'';const allExpenses=this.getAllExpenses();if(allExpenses.length===0){return`
                <h3>Overall Trip Total</h3>
                <p class="currency-name" style="font-style: italic;">No expenses recorded for this trip yet.</p>
            `;}
let html='<h3>Overall Trip Total</h3>';if(this.summaryMode==='local'){const totalsByCurrency={};allExpenses.forEach(expense=>{const amount=parseFloat(expense.amount)||0;const currency=expense.currency;if(amount>0&&currency){totalsByCurrency[currency]=(totalsByCurrency[currency]||0)+amount;}});if(Object.keys(totalsByCurrency).length>0){html+=`
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                `;for(const currency in totalsByCurrency){const name=AppConfig.config.currencyNames[currency]||currency;const formattedAmount=totalsByCurrency[currency].toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});html+=`
                        <tr>
                            <td>${currency} (${name})</td>
                            <td style="font-weight: 600; color: #1f2937;">${formattedAmount}</td>
                        </tr>
                    `;}
html+='</tbody></table>';}}else{let totalBase=0;const missing=new Set();allExpenses.forEach(expense=>{const amount=parseFloat(expense.amount)||0;const currency=expense.currency;if(currency===this.activeTrip.baseCurrency){totalBase+=amount;}else if(this.conversionRates[currency]){totalBase+=amount/this.conversionRates[currency];}else{missing.add(currency);}});const formattedTotal=totalBase.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});if(missing.size>0){html+=`<p class="text-red">Missing conversion rates for: ${[...missing].join(', ')}</p>`;}
html+=`
                <div style="font-weight: 600; color: #1f2937; font-size: 1.25rem; text-align: center; padding: 1rem 0;">
                    ${formattedTotal} ${this.activeTrip.baseCurrency}
                </div>
            `;}
return html;},renderCategorySummary:function(){if(!this.activeTrip)return'';const allExpenses=this.getAllExpenses();if(allExpenses.length===0){return`
                <h3>Category Breakdown</h3>
                <p class="currency-name" style="font-style: italic;">No expenses recorded for this trip yet.</p>
            `;}
const totalsByCategory={};allExpenses.forEach(expense=>{const amount=parseFloat(expense.amount)||0;const currency=expense.currency;const category=expense.category||'Uncategorized';if(!totalsByCategory[category]){totalsByCategory[category]={};}
if(this.summaryMode==='local'){totalsByCategory[category][currency]=(totalsByCategory[category][currency]||0)+amount;}else{let convertedAmount=0;if(currency===this.activeTrip.baseCurrency){convertedAmount=amount;}else if(this.conversionRates[currency]){convertedAmount=amount/this.conversionRates[currency];}
totalsByCategory[category][this.activeTrip.baseCurrency]=(totalsByCategory[category][this.activeTrip.baseCurrency]||0)+convertedAmount;}});let html=`<h3>Category Breakdown (${this.summaryMode === 'local' ? 'Local Currencies' : this.activeTrip.baseCurrency})</h3>`;html+=`
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;for(const category in totalsByCategory){const totals=totalsByCategory[category];let totalHtml='';for(const currency in totals){const name=AppConfig.config.currencyNames[currency]||currency;const formattedAmount=totals[currency].toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});totalHtml+=`<div style="white-space: nowrap; margin-bottom: 0.25rem;">${formattedAmount} ${currency} (${name})</div>`;}
html+=`
                <tr>
                    <td style="font-weight: 600;">${category}</td>
                    <td class="currency-name text-sm" style="color: #1f2937;">${totalHtml}</td>
                </tr>
            `;}
html+='</tbody></table>';return html;},async initializeDatasetManager(){if(typeof DatasetManager==='undefined'){console.error('DatasetManager not available');return false;}
if(typeof AppSettingsManager!=='undefined'&&typeof AppSettingsManager.init==='function'){AppSettingsManager.init();}
if(typeof AppSettings==='undefined'&&typeof AppSettingsManager!=='undefined'){window.AppSettings={datasets:AppSettingsManager.appSettings?.datasets||AppSettingsManager.getDefaultSettings().datasets};}
try{const initResult=await DatasetManager.initializeFromLocal();if(!initResult.ok){console.error('Failed to initialize DatasetManager:',initResult.error);return false;}
console.log('DatasetManager initialized successfully:',initResult);return true;}catch(error){console.error('Error initializing DatasetManager:',error);return false;}},async loadQuestionsDataset(){if(typeof DatasetManager==='undefined'){console.error('DatasetManager not available');return false;}
try{if(typeof AppSettings==='undefined'&&typeof AppSettingsManager!=='undefined'){window.AppSettings={datasets:AppSettingsManager.appSettings?.datasets||AppSettingsManager.getDefaultSettings().datasets};}
let questionsKey='questions';console.log(`Loading questions dataset with key: ${questionsKey}`);const loadResult=await DatasetManager.load_dataset_with_check(questionsKey,{skipRemote:true});if(!loadResult.ok){console.error('Failed to load questions dataset:',loadResult.error);return false;}
const datasetResult=await DatasetManager.getDataset(questionsKey);if(!datasetResult.ok){console.error('Failed to get questions dataset:',datasetResult.error);return false;}
const rawData=datasetResult.data;if(rawData&&rawData.questions&&Array.isArray(rawData.questions)){this.questionsData=rawData.questions;}else if(Array.isArray(rawData)){this.questionsData=rawData;}else{console.error('Questions dataset has unexpected format:',rawData);return false;}
console.log('Questions dataset loaded successfully:',this.questionsData);return true;}catch(error){console.error('Error loading questions dataset:',error);return false;}},async initUserTripDatabase(tripId){if(!tripId)return false;const dbName=`lipikit_user_${tripId}`;try{const db=await this.openUserTripDB(dbName);console.log(`User trip database initialized: ${dbName}`);return true;}catch(error){console.error('Failed to initialize user trip database:',error);return false;}},async openUserTripDB(dbName){return new Promise((resolve,reject)=>{const request=indexedDB.open(dbName,1);request.onerror=()=>reject(new Error(`IndexedDB open failed: ${request.error}`));request.onsuccess=()=>resolve(request.result);request.onupgradeneeded=(event)=>{const db=event.target.result;if(!db.objectStoreNames.contains('responses')){const store=db.createObjectStore('responses',{keyPath:'questionId'});store.createIndex('questionId','questionId',{unique:true});}};});},async saveQuestionResponse(tripId,questionId,response){if(!tripId||!questionId)return false;const dbName=`lipikit_user_${tripId}`;try{const db=await this.openUserTripDB(dbName);return new Promise((resolve,reject)=>{const transaction=db.transaction(['responses'],'readwrite');const store=transaction.objectStore('responses');const responseData={questionId:questionId,response:response,timestamp:new Date().toISOString()};const request=store.put(responseData);request.onerror=()=>reject(new Error(`Failed to save response: ${request.error}`));request.onsuccess=()=>{console.log(`Response saved for question ${questionId}:`,response);resolve(true);};transaction.oncomplete=()=>db.close();});}catch(error){console.error('Error saving question response:',error);return false;}},async loadQuestionResponses(tripId){if(!tripId)return{};const dbName=`lipikit_user_${tripId}`;try{const db=await this.openUserTripDB(dbName);return new Promise((resolve,reject)=>{const transaction=db.transaction(['responses'],'readonly');const store=transaction.objectStore('responses');const request=store.getAll();request.onerror=()=>reject(new Error(`Failed to load responses: ${request.error}`));request.onsuccess=()=>{const responses={};request.result.forEach(item=>{responses[item.questionId]=item.response;});resolve(responses);};transaction.oncomplete=()=>db.close();});}catch(error){console.error('Error loading question responses:',error);return{};}},bindEvents:function(){const appArea=document.getElementById('app-area');if(!appArea)return;appArea.addEventListener('click',(e)=>{const target=e.target.closest('button');if(!target)return;if(target.id==='add-trip-btn')this.showTripCreationForm();if(target.id==='cancel-trip-btn')this.cancelTripCreation();if(target.id==='prev-questions-btn')this.prevQuestionsPage();if(target.id==='back-to-trips-btn')this.backToTrips();if(target.id==='back-to-dashboard-btn'){if(!target.closest('.checklist-view')){this.currentTripView='dashboard';this.renderApp();}}
if(target.id==='add-expense-btn')this.openExpenseViewTab('add-expense');if(target.id==='expense-summary-btn')this.openExpenseViewTab('expense-summary');if(target.id==='view-checklist-btn')this.renderChecklistView('view-checklist');if(target.id==='customize-checklist-btn')this.renderChecklistView('customize-checklist');if(target.id==='promo-btn')this.handlePromoClick();if(target.id==='promo-tech-btn')this.handlePromoClick();if(target.id==='add-location-btn')this.captureLocation();if(target.id==='reset-btn')this.resetExpenseForm();if(target.id==='export-data-btn')this.exportData();if(target.id==='manual-sync-btn')this.handleManualSync();if(target.id==='fetch-rates-btn')this.fetchExchangeRates();if(target.id==='summary-tab-local')this.switchSummaryMode('local');if(target.id==='summary-tab-base')this.switchSummaryMode('base');if(target.classList.contains('quick-select-btn'))this.handleQuickSelect(target);if(target.classList.contains('question-option'))this.handleQuestionOptionSelect(target);if(target.classList.contains('start-trip-btn'))this.startTrip(target.dataset.tripId);if(target.classList.contains('delete-trip-btn'))this.deleteTrip(target.dataset.tripId);});appArea.addEventListener('submit',(e)=>{if(e.target.id==='add-trip-form-step1'){e.preventDefault();this.handleTripBasicInfoSubmit();}
if(e.target.id==='questions-form'){e.preventDefault();this.handleQuestionsSubmit();}
if(e.target.id==='expense-form'){e.preventDefault();this.handleAddExpense();}});appArea.addEventListener('input',(e)=>{if(e.target.matches('#base-inputs input[data-currency]')){this.handleRateChange(e.target);}
if(e.target.matches('.question-textarea')){const questionId=e.target.id.replace('question-','');this.userResponses[questionId]=e.target.value;if(this.currentTripData?.id){this.saveQuestionResponse(this.currentTripData.id,questionId,e.target.value);}}});appArea.addEventListener('change',(e)=>{if(e.target.id==='new-trip-currencies'||e.target.id==='new-trip-currencies-hidden'){const hiddenInput=document.getElementById('new-trip-currencies-hidden');const baseCurrencySelect=document.getElementById('new-trip-base-currency');let selectedCurrencies=[];if(hiddenInput&&hiddenInput.value){selectedCurrencies=hiddenInput.value.split(',').filter(Boolean);}else{const tripCurrenciesSelect=document.getElementById('new-trip-currencies');if(tripCurrenciesSelect&&tripCurrenciesSelect.tagName==='SELECT'&&tripCurrenciesSelect.selectedOptions){selectedCurrencies=Array.from(tripCurrenciesSelect.selectedOptions).map(opt=>opt.value);}}
const user=ProfileManager?ProfileManager.getCurrentUser():null;const homeCurrency=user&&user.homeCurrency?user.homeCurrency:null;if(homeCurrency&&!selectedCurrencies.includes(homeCurrency)){selectedCurrencies.push(homeCurrency);}
baseCurrencySelect.innerHTML=`
                    <option value="" disabled ${!this.currentTripData?.baseCurrency ? 'selected' : ''}>Select a base currency</option>
                    ${selectedCurrencies.map(currency => {
                        const name = AppConfig.config.currencyNames[currency] || currency;
                        const selected = this.currentTripData && this.currentTripData.baseCurrency === currency ? 'selected' : '';
                        return `<option value="${currency}"${selected}>${currency}-${name}</option>`;
                    }).join('')}
                `;}});},initMultiSelect:function(containerId,options,hiddenInputId){const container=document.getElementById(containerId);if(!container){console.warn('initMultiSelect: container not found',containerId);return;}
options=Array.isArray(options)?options:[];console.log('[initMultiSelect] START',{containerId,hiddenInputId,optionsCount:options.length});container.innerHTML=`
        <div class="ms-input">
            <input type="text" class="ms-search" placeholder="Search or type to filter...">
            <div class="ms-dropdown hidden"></div>
        </div>
        <div class="ms-selected"></div>
        <input type="hidden" id="${hiddenInputId}" value="">
    `;const search=container.querySelector('.ms-search');const dropdown=container.querySelector('.ms-dropdown');const selectedWrap=container.querySelector('.ms-selected');let hidden=container.querySelector(`#${hiddenInputId}`);if(!hidden){console.warn('initMultiSelect: hidden input not found, creating',hiddenInputId);hidden=document.createElement('input');hidden.type='hidden';hidden.id=hiddenInputId;container.appendChild(hidden);}
let selected=(hidden.value&&typeof hidden.value==='string')?hidden.value.split(',').filter(Boolean):[];console.log('[initMultiSelect] initial selected array:',selected);function renderDropdown(filter=''){console.log('[renderDropdown] filter',filter);dropdown.innerHTML=options.filter(opt=>(opt.label||'').toLowerCase().includes(filter.toLowerCase())).map(opt=>`<div class="ms-option" data-value="${opt.value}">${opt.label}</div>`).join('');}
function renderSelected(){console.log('[renderSelected] ENTER',{selected,hiddenVal:hidden.value,optionsSample:options.slice(0,3)});try{selectedWrap.innerHTML=selected.map(val=>{const opt=options.find(o=>o.value===val)||{label:val};return`<span class="ms-tag" data-value="${val}">${opt.label}<button type="button" class="ms-remove" data-value="${val}">&times;</button></span>`;}).join('');hidden.value=selected.join(',');console.log('[renderSelected] hidden.value updated',hidden.value);hidden.dispatchEvent(new Event('change',{bubbles:true}));}catch(err){console.error('[renderSelected] ERROR',err,{selected,hidden,options});throw err;}}
search.addEventListener('focus',()=>{dropdown.classList.remove('hidden');renderDropdown();});search.addEventListener('input',(e)=>renderDropdown(e.target.value));dropdown.addEventListener('click',(e)=>{const option=e.target.closest('.ms-option');if(!option)return;const value=option.dataset.value;if(!selected.includes(value)){selected.push(value);console.log('[dropdown click] added',value,'selected now',selected);renderSelected();}});selectedWrap.addEventListener('click',(e)=>{const removeBtn=e.target.closest('.ms-remove');if(!removeBtn)return;const value=removeBtn.dataset.value;selected=selected.filter(v=>v!==value);console.log('[selectedWrap click] removed',value,'selected now',selected);renderSelected();});document.addEventListener('click',(e)=>{if(!container.contains(e.target))dropdown.classList.add('hidden');});container.getSelectedValues=()=>selected.slice();renderDropdown();renderSelected();console.log('[initMultiSelect] COMPLETE for',containerId);},enhanceDateInputs:function(ids){if(!Array.isArray(ids))ids=[ids];ids.forEach(id=>{const el=document.getElementById(id);if(!el||typeof el.showPicker!=='function')return;const showPicker=(event)=>{if(event&&event.isTrusted){try{el.showPicker();}catch(e){if(e&&e.name!=='NotAllowedError'){console.warn(`Failed to show picker for ${id}:`,e);}}}};if(el._showPickerHandler){el.removeEventListener('focus',el._showPickerHandler);el.removeEventListener('click',el._showPickerHandler);}
el._showPickerHandler=showPicker;el.addEventListener('focus',showPicker);el.addEventListener('click',showPicker);});},initTripBasicFormWidgets:function(){const currencyOpts=(this._pendingTripCurrencyOptions&&this._pendingTripCurrencyOptions.length)?this._pendingTripCurrencyOptions:(AppConfig?.config?.currencies||[]).map(c=>({value:c,label:`${c} - ${(AppConfig?.config?.currencyNames?.[c] || c)}`}));const countryOpts=(this._pendingTripCountryOptions&&this._pendingTripCountryOptions.length)?this._pendingTripCountryOptions:(AppConfig?.config?.countries||[]).map(c=>{if(typeof c==='string')return{value:c,label:c};const val=c.code||c.id||c.value||c.name||c.label;const name=c.name||c.label||c.text||val;if(!val)return null;return{value:val,label:`${val} - ${name}`};}).filter(Boolean);this.initMultiSelect('new-trip-currencies',currencyOpts,'new-trip-currencies-hidden',(selected)=>{const baseSelect=document.getElementById('new-trip-base-currency');if(baseSelect){const currentBase=this.currentTripData?.baseCurrency||'';const user=ProfileManager?ProfileManager.getCurrentUser():null;const homeCurrency=user&&user.homeCurrency&&!selected.includes(user.homeCurrency)?user.homeCurrency:null;const finalCurrencies=homeCurrency?[...selected,homeCurrency]:selected;baseSelect.innerHTML=`
                <option value="" disabled ${!currentBase ? 'selected' : ''}>Choose a base currency</option>
                ${finalCurrencies.sort().map(code => {
                    const found = currencyOpts.find(o => o.value === code);
                    const name = found ? found.label : `${code}-${AppConfig?.config?.currencyNames?.[code]||code}`;
                    const selectedAttr = currentBase === code ? 'selected' : '';
                    return `<option value="${code}"${selectedAttr}>${name}</option>`;
                }).join('')}
            `;}});this.initMultiSelect('new-trip-countries',countryOpts,'new-trip-countries-hidden');this.enhanceDateInputs(['new-trip-start','new-trip-end']);const form=document.getElementById('add-trip-form-step1');if(form){form.addEventListener('submit',(e)=>{e.preventDefault();this.handleTripBasicInfoSubmit();});}
const cancelBtn=document.getElementById('cancel-trip-btn');if(cancelBtn){cancelBtn.addEventListener('click',()=>{this.tripCreationStep=1;this.currentTripData=null;this.userResponses={};document.getElementById('trip-creation-container').classList.add('hidden');document.getElementById('trip-list').classList.remove('hidden');this.renderApp();});}
const hiddenCurrencies=document.getElementById('new-trip-currencies-hidden');const selectedCurrencies=hiddenCurrencies&&hiddenCurrencies.value?hiddenCurrencies.value.split(',').filter(Boolean):(this.currentTripData?.currencies||[]);const baseSelect=document.getElementById('new-trip-base-currency');if(baseSelect&&selectedCurrencies.length){const user=ProfileManager?ProfileManager.getCurrentUser():null;const homeCurrency=user&&user.homeCurrency&&!selectedCurrencies.includes(user.homeCurrency)?user.homeCurrency:null;const finalCurrencies=homeCurrency?[...selectedCurrencies,homeCurrency]:selectedCurrencies;const currentBase=this.currentTripData?.baseCurrency||'';baseSelect.innerHTML=`
            <option value="" disabled ${!currentBase ? 'selected' : ''}>Choose a base currency</option>
            ${finalCurrencies.sort().map(code => {
                const found = currencyOpts.find(o => o.value === code);
                const name = found ? found.label : `${code}-${AppConfig?.config?.currencyNames?.[code]||code}`;
                const selectedAttr = currentBase === code ? 'selected' : '';
                return `<option value="${code}"${selectedAttr}>${name}</option>`;
            }).join('')}
        `;}},showTripCreationForm:async function(){const user=ProfileManager.getCurrentUser();const creditCheck=TripCreditManager.checkCreationAllowed(user);if(!creditCheck.canCreate){this.showMessage('Trip Limit Reached',`<div style="text-align: center;">
        <p style="color: var(--text-light); margin-bottom: 1rem;">You've used all 3 free trip credits.</p>
        <p style="color: var(--text-dark); font-weight: 600; margin-bottom: 1.5rem;">Upgrade to unlock unlimited trips.</p>
        <a href="https://rzp.io/rzp/NiFP60q" target="_blank" class="btn btn-primary" style="text-decoration: none;">
          Upgrade to Pro
        </a>
      </div>`,false,true);return;}
this.tripCreationStep=1;this.currentTripData=null;this.questionsData=null;this.currentQuestionPage=0;this.userResponses={};const container=document.getElementById('trip-creation-container');const addBtn=document.getElementById('add-trip-btn');const tripList=document.getElementById('trip-list');if(container)container.classList.remove('hidden');if(addBtn)addBtn.classList.add('hidden');if(tripList)tripList.classList.add('hidden');const ok=await this.loadQuestionsDataset();if(!ok){console.error('Failed to load questions dataset');alert('Could not load trip questions. The form will still be shown with default values.');if(container)container.innerHTML=this.renderTripCreationForm();this.initTripBasicFormWidgets();return;}
if(container)container.innerHTML=this.renderTripCreationForm();this.initTripBasicFormWidgets();},cancelTripCreation:function(){this.tripCreationStep=1;this.currentTripData=null;this.questionsData=null;this.currentQuestionPage=0;this.userResponses={};document.getElementById('trip-creation-container').classList.add('hidden');document.getElementById('add-trip-btn').classList.remove('hidden');document.getElementById('trip-list').classList.remove('hidden');},async handleTripBasicInfoSubmit(){if(this.isSubmitting)return;this.isSubmitting=true;try{const tripName=document.getElementById('new-trip-name').value.trim();let currencies=[];const hiddenCurrencies=document.getElementById('new-trip-currencies-hidden');if(hiddenCurrencies&&hiddenCurrencies.value){currencies=hiddenCurrencies.value.split(',').filter(Boolean);}else{const currencySelect=document.getElementById('new-trip-currencies');if(currencySelect&&currencySelect.tagName==='SELECT'&&currencySelect.selectedOptions){currencies=Array.from(currencySelect.selectedOptions).map(opt=>opt.value);}}
let countries=[];const hiddenCountries=document.getElementById('new-trip-countries-hidden');if(hiddenCountries&&hiddenCountries.value){countries=hiddenCountries.value.split(',').filter(Boolean);}
const baseCurrency=document.getElementById('new-trip-base-currency').value;const startDate=document.getElementById('new-trip-start').value;const endDate=document.getElementById('new-trip-end').value;if(!tripName||!currencies.length||!baseCurrency||!startDate||!endDate){this.showError('Please fill in all required fields.');this.isSubmitting=false;return;}
if(new Date(startDate)>new Date(endDate)){this.showError('End date must be on or after the start date.');this.isSubmitting=false;return;}
if(!currencies.includes(baseCurrency)){this.showError('Base currency must be one of the selected trip currencies.');this.isSubmitting=false;return;}
const user=ProfileManager?ProfileManager.getCurrentUser():null;const userId=user?user.userId:null;this.currentTripData={id:`trip-${Date.now()}-${Math.random().toString(36).slice(2)}`,userId:userId,name:tripName,currencies:currencies,baseCurrency:baseCurrency,countries:countries,start:startDate,end:endDate,createdAt:new Date().toISOString()};this.saveDataLocally(this.currentTripData,'trips');const datasetInitialized=await this.initializeDatasetManager();if(!datasetInitialized){this.showError('Failed to initialize data system. Proceeding without questions.');this.completeTripCreation();this.isSubmitting=false;return;}
await this.initUserTripDatabase(this.currentTripData.id);this.userResponses=await this.loadQuestionResponses(this.currentTripData.id);const hasQuestions=this.getFilteredQuestions().length>0;if(hasQuestions){this.tripCreationStep=2;this.currentQuestionPage=0;document.getElementById('trip-creation-container').innerHTML=this.renderTripCreationForm();}else{this.completeTripCreation();}}catch(error){this.showError('An error occurred during trip creation: '+error.message);console.error('Error in handleTripBasicInfoSubmit:',error);}finally{this.isSubmitting=false;}},handleQuestionOptionSelect:async function(button){const questionId=button.dataset.questionId;const value=button.dataset.value;const questionItem=button.closest('.question-item');const type=questionItem?questionItem.dataset.type:'single';if(type==='multi'){let current=this.userResponses[questionId]||[];if(!Array.isArray(current))current=[];if(current.includes(value)){current=current.filter(v=>v!==value);}else{current.push(value);}
this.userResponses[questionId]=current;const buttons=questionItem.querySelectorAll('.question-option');buttons.forEach(btn=>{if(current.includes(btn.dataset.value)){btn.classList.add('active');}else{btn.classList.remove('active');}});}else{const siblings=button.parentElement.querySelectorAll('.question-option');siblings.forEach(btn=>btn.classList.remove('active'));button.classList.add('active');this.userResponses[questionId]=value;}
if(this.currentTripData?.id){await this.saveQuestionResponse(this.currentTripData.id,questionId,this.userResponses[questionId]);}},prevQuestionsPage:function(){if(this.currentQuestionPage>0){this.currentQuestionPage--;document.getElementById('trip-creation-container').innerHTML=this.renderTripCreationForm();}},async handleQuestionsSubmit(){const currentQuestions=this.getCurrentPageQuestions();for(const question of currentQuestions){const questionId=question.id||`q_${this.getCurrentPageStartIndex() + currentQuestions.indexOf(question)}`;const response=this.userResponses[questionId]||'';if(response){await this.saveQuestionResponse(this.currentTripData.id,questionId,response);}}
const filteredQuestions=this.getFilteredQuestions();const totalQuestions=filteredQuestions.length;const totalPages=Math.ceil(totalQuestions/this.questionsPerPage);const isLastPage=this.currentQuestionPage>=totalPages-1;if(isLastPage){this.completeTripCreation();}else{this.currentQuestionPage++;document.getElementById('trip-creation-container').innerHTML=this.renderTripCreationForm();}},getCurrentPageQuestions:function(){const filteredQuestions=this.getFilteredQuestions();const startIdx=this.currentQuestionPage*this.questionsPerPage;const endIdx=Math.min(startIdx+this.questionsPerPage,filteredQuestions.length);return filteredQuestions.slice(startIdx,endIdx);},getCurrentPageStartIndex:function(){return this.currentQuestionPage*this.questionsPerPage;},completeTripCreation:async function(){try{await this.saveQuestionResponses();this.tripCreationStep=1;const newTripData=this.currentTripData;this.currentTripData=null;this.currentQuestionPage=0;this.userResponses={};document.getElementById('trip-creation-container').classList.add('hidden');document.getElementById('trip-list').classList.remove('hidden');const user=ProfileManager.getCurrentUser();if(user&&user.plan!=='pro'){const creditConsumed=await TripCreditManager.consumeCredit(user);if(!creditConsumed){console.warn('Failed to record credit consumption (offline or Firebase error)');}}
await this.runTripOnboarding(newTripData.id);this.renderApp();this.showSuccess('Trip created with starter itinerary and checklist!');}catch(error){this.showError('Failed to complete trip creation: '+error.message);console.error('Error in completeTripCreation:',error);}},runTripOnboarding:async function(tripId){console.log('ðŸš€ Running trip onboarding for:',tripId);try{const trips=this.getLocalData('trips');const trip=trips.find(t=>t.id===tripId);if(!trip){console.error('Trip not found for onboarding');return;}
const responses=await this.loadQuestionResponses(tripId);await this.generateBasicItinerary(trip);await this.generateSmartChecklist(trip,responses);console.log('Trip onboarding completed');return true;}catch(error){console.error('Trip onboarding failed:',error);return false;}},generateBasicItinerary:async function(trip){const tripDays=this.calculateTripDaysForTrip(trip);const baseCurrency=trip.baseCurrency;const countries=trip.countries||[];const mainCountry=countries[0]||'destination';const activities=[];activities.push({id:`act-onboard-${Date.now()}-1`,day:0,name:`Arrive at ${mainCountry}`,type:'<i class="fas fa-car"></i> Transport',plannedCost:0,plannedCurrency:baseCurrency,url:'',notes:'Check-in to accommodation, freshen up',status:'planned',createdAt:new Date().toISOString()});activities.push({id:`act-onboard-${Date.now()}-2`,day:0,name:'Welcome dinner',type:'<i class="fas fa-utensils"></i> Food',plannedCost:0,plannedCurrency:baseCurrency,url:'',notes:'Try local cuisine',status:'planned',createdAt:new Date().toISOString()});const activityTemplates=[{name:'Morning sightseeing',type:'<i class="fas fa-landmark"></i> Sightseeing',notes:'Visit popular attractions'},{name:'Lunch at local restaurant',type:'<i class="fas fa-utensils"></i> Food',notes:'Try recommended dishes'},{name:'Afternoon exploration',type:'<i class="fas fa-landmark"></i> Sightseeing',notes:'Explore neighborhoods'},{name:'Shopping for souvenirs',type:'<i class="fas fa-shopping-bag"></i> Shopping',notes:'Visit local markets'},{name:'Evening entertainment',type:'<i class="fas fa-landmark"></i> Sightseeing',notes:'Cultural activities'},{name:'Dinner experience',type:'<i class="fas fa-utensils"></i> Food',notes:'Special dining'}];for(let day=1;day<tripDays.length-1;day++){const template1=activityTemplates[(day*2)%activityTemplates.length];const template2=activityTemplates[(day*2+1)%activityTemplates.length];activities.push({id:`act-onboard-${Date.now()}-${activities.length + 1}`,day:day,name:template1.name,type:template1.type,plannedCost:0,plannedCurrency:baseCurrency,url:'',notes:template1.notes,status:'planned',createdAt:new Date().toISOString()});activities.push({id:`act-onboard-${Date.now()}-${activities.length + 1}`,day:day,name:template2.name,type:template2.type,plannedCost:0,plannedCurrency:baseCurrency,url:'',notes:template2.notes,status:'planned',createdAt:new Date().toISOString()});}
if(tripDays.length>1){const lastDay=tripDays.length-1;activities.push({id:`act-onboard-${Date.now()}-${activities.length + 1}`,day:lastDay,name:'Check-out and departure',type:'<i class="fas fa-car"></i> Transport',plannedCost:0,plannedCurrency:baseCurrency,url:'',notes:'Head to airport/station',status:'planned',createdAt:new Date().toISOString()});activities.push({id:`act-onboard-${Date.now()}-${activities.length + 1}`,day:lastDay,name:'Last meal',type:'<i class="fas fa-utensils"></i> Food',plannedCost:0,plannedCurrency:baseCurrency,url:'',notes:'Final local food experience',status:'planned',createdAt:new Date().toISOString()});}
const storageKey=`lipikit_itinerary_${trip.id}`;localStorage.setItem(storageKey,JSON.stringify(activities));console.log(`Generated ${activities.length} activities for ${tripDays.length} days`);return activities;},calculateTripDaysForTrip:function(trip){const start=new Date(trip.start||trip.startDate);const end=new Date(trip.end||trip.endDate);const days=[];let current=new Date(start);let dayNum=0;while(current<=end){days.push({number:dayNum,date:new Date(current),label:`Day ${dayNum}`});current.setDate(current.getDate()+1);dayNum++;}
return days;},generateSmartChecklist:async function(trip,responses){if(!this.checklistMasterData||this.checklistMasterData.length===0){console.warn('Checklist master data not loaded, skipping smart checklist');return;}
const selectedItems=[];this.checklistMasterData.forEach(item=>{let shouldInclude=false;if(item.tripType){const tripTypes=Array.isArray(item.tripType)?item.tripType:[item.tripType];const isInternational=trip.countries&&trip.countries.length>0;const isMultiCountry=trip.countries&&trip.countries.length>1;if(tripTypes.includes('international')&&isInternational)shouldInclude=true;if(tripTypes.includes('multi_country')&&isMultiCountry)shouldInclude=true;}
if(item.needsVisa){const needsVisa=this.checkIfVisaNeeded(trip,responses);if(needsVisa)shouldInclude=true;}
if(item.arrivalMode){const arrivalModes=Array.isArray(item.arrivalMode)?item.arrivalMode:[item.arrivalMode];const userArrivalMode=this.getResponseValue(responses,'arrivalMode')||'flight';if(arrivalModes.includes(userArrivalMode))shouldInclude=true;}
if(item.duration){const durations=Array.isArray(item.duration)?item.duration:[item.duration];const tripDuration=this.getTripDuration(trip);if(durations.includes(tripDuration))shouldInclude=true;}
if(item.season){const seasons=Array.isArray(item.season)?item.season:[item.season];const tripSeason=this.getTripSeason(trip);if(seasons.includes(tripSeason))shouldInclude=true;}
if(item.destType){const destTypes=Array.isArray(item.destType)?item.destType:[item.destType];const userDestType=this.getResponseValue(responses,'destType')||this.getResponseValue(responses,'destinationType');if(userDestType&&destTypes.includes(userDestType))shouldInclude=true;}
if(item.activities){const itemActivities=Array.isArray(item.activities)?item.activities:[item.activities];const userActivities=this.getResponseValue(responses,'activities')||[];const userActivitiesArray=Array.isArray(userActivities)?userActivities:[userActivities];const hasMatch=itemActivities.some(act=>userActivitiesArray.some(userAct=>userAct.toLowerCase().includes(act.toLowerCase())));if(hasMatch)shouldInclude=true;}
if(item.tripStyle){const tripStyles=Array.isArray(item.tripStyle)?item.tripStyle:[item.tripStyle];const userTripStyle=this.getResponseValue(responses,'tripStyle');if(userTripStyle&&tripStyles.includes(userTripStyle))shouldInclude=true;}
if(item.travelWith){const travelWithOptions=Array.isArray(item.travelWith)?item.travelWith:[item.travelWith];const userTravelWith=this.getResponseValue(responses,'travelWith')||this.getResponseValue(responses,'companions');if(userTravelWith&&travelWithOptions.includes(userTravelWith))shouldInclude=true;}
if(item.tags&&item.tags.includes('essential')){shouldInclude=true;}
if(shouldInclude){selectedItems.push({checklistId:item.id,status:'Not Done',addedAt:new Date().toISOString()});}});if(selectedItems.length>0){const db=await this.getChecklistDB(trip.id);const transaction=db.transaction(['checklist'],'readwrite');const store=transaction.objectStore('checklist');for(const item of selectedItems){await store.put(item);}
console.log(`Added ${selectedItems.length} checklist items`);}else{console.log('No checklist items matched criteria');}
return selectedItems;},checkIfVisaNeeded:function(trip,responses){const visaLikelyCountries=['USA','UK','China','India','Australia','Japan'];if(trip.countries){return trip.countries.some(country=>visaLikelyCountries.some(vc=>country.includes(vc)));}
return false;},getTripDuration:function(trip){const start=new Date(trip.start||trip.startDate);const end=new Date(trip.end||trip.endDate);const days=Math.ceil((end-start)/(1000*60*60*24))+1;if(days<=3)return'short';if(days<=7)return'medium';return'long';},getTripSeason:function(trip){const start=new Date(trip.start||trip.startDate);const month=start.getMonth();if(month>=2&&month<=4)return'spring';if(month>=5&&month<=7)return'summer';if(month>=8&&month<=10)return'fall';return'winter';},getResponseValue:function(responses,key){if(responses[key])return responses[key];const lowerKey=key.toLowerCase();for(const[respKey,value]of Object.entries(responses)){if(respKey.toLowerCase()===lowerKey){return value;}}
for(const[respKey,value]of Object.entries(responses)){if(respKey.toLowerCase().includes(lowerKey)||lowerKey.includes(respKey.toLowerCase())){return value;}}
return null;},saveQuestionResponses:async function(){if(!this.currentTripData||!this.currentTripData.id||!this.userResponses)return;try{const db=await this.getUserTripDatabase(this.currentTripData.id);const transaction=db.transaction(['responses'],'readwrite');const store=transaction.objectStore('responses');for(const[questionId,response]of Object.entries(this.userResponses)){await store.put({questionId,response,timestamp:new Date().toISOString()});}
await transaction.complete;}catch(error){console.error('Error saving question responses:',error);throw error;}},getUserTripDatabase:async function(tripId){if(!tripId)throw new Error('Trip ID is required');if(!this.databases)this.databases={};if(!this.databases[tripId]){const initSuccess=await this.initUserTripDatabase(tripId);if(!initSuccess)throw new Error('Failed to initialize user trip database');try{this.databases[tripId]=await this.openUserTripDB(`lipikit_user_${tripId}`);}catch(error){throw new Error(`Failed to open user trip database: ${error.message}`);}}
return this.databases[tripId];},handlePromoClick:function(){this.showMessage('Promotion','This link would take you to our affiliate partner for travel insurance. Thanks for your support!');},setupNetworkStatus:function(){const updateStatus=()=>{const isOnline=navigator.onLine;document.querySelectorAll('#status-dot').forEach(dot=>{dot.style.backgroundColor=isOnline?'var(--success-color)':'var(--danger-color)';});document.querySelectorAll('#status-text').forEach(text=>{text.textContent=isOnline?'Online':'Offline';});const offlineMessage=document.getElementById('offline-message');if(offlineMessage){offlineMessage.classList.toggle('hidden',isOnline);}};window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);updateStatus();},setupUserLoginListener:function(){if(typeof ProfileManager!=='undefined'){const originalRenderProfileSection=ProfileManager.renderProfileSection;ProfileManager.renderProfileSection=()=>{originalRenderProfileSection.apply(ProfileManager);this.isInitialized=false;this.init();};}},applyUserSettings:function(){},applyExpenseDefaults:function(){const defaultCategory=AppConfig.config.categories[0];const defaultCurrency=this.activeTrip?.currencies[0];const defaultMode=AppConfig.config.modes[0];if(defaultCategory){const categoryBtn=document.querySelector(`#quick-category-buttons .quick-select-btn[data-value="${defaultCategory}"]`);if(categoryBtn)this.handleQuickSelect(categoryBtn);}
if(defaultCurrency){const currencyBtn=document.querySelector(`#quick-currency-buttons .quick-select-btn[data-value="${defaultCurrency}"]`);if(currencyBtn)this.handleQuickSelect(currencyBtn);}
if(defaultMode){const modeBtn=document.querySelector(`#quick-mode-buttons .quick-select-btn[data-value="${defaultMode}"]`);if(modeBtn)this.handleQuickSelect(modeBtn);}},deleteTrip:function(tripId){const performDelete=()=>{const allTrips=this.getLocalData('trips',true).filter(trip=>trip.id!==tripId);localStorage.setItem(this.getStorageKey('trips'),JSON.stringify(allTrips));const allSyncedExpenses=this.getLocalData('syncedExpenses',true).filter(expense=>expense.tripId!==tripId);const allUnsyncedExpenses=this.getLocalData('unsyncedExpenses',true).filter(expense=>expense.tripId!==tripId);localStorage.setItem(this.getStorageKey('syncedExpenses'),JSON.stringify(allSyncedExpenses));localStorage.setItem(this.getStorageKey('unsyncedExpenses'),JSON.stringify(allUnsyncedExpenses));const allRates=JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates')))||{};delete allRates[tripId];localStorage.setItem(this.getStorageKey('conversionRates'),JSON.stringify(allRates));this.deleteUserTripDatabase(tripId);if(this.activeTrip?.id===tripId){this.activeTrip=null;localStorage.removeItem(this.getStorageKey('activeTrip'));}
this.renderApp();this.showSuccess('Trip deleted successfully!');};if(typeof showConfirmation!=='undefined'){showConfirmation('Delete Trip','Are you sure you want to delete this trip? All associated expenses and responses will be permanently deleted.',performDelete);}else{console.warn("showConfirmation modal not found, using native browser confirm.");if(confirm('Are you sure you want to delete this trip? This action cannot be undone.')){performDelete();}}},async deleteUserTripDatabase(tripId){if(!tripId)return;const dbName=`lipikit_user_${tripId}`;return new Promise((resolve,reject)=>{const deleteRequest=indexedDB.deleteDatabase(dbName);deleteRequest.onerror=()=>{console.error(`Failed to delete user trip database: ${dbName}`);resolve(false);};deleteRequest.onsuccess=()=>{console.log(`User trip database deleted: ${dbName}`);resolve(true);};deleteRequest.onblocked=()=>{console.warn(`Delete blocked for user trip database: ${dbName}`);resolve(false);};});},startTrip:function(tripId){const trips=this.getLocalData('trips');const selectedTrip=trips.find(trip=>trip.id===tripId);if(selectedTrip){this.activeTrip=selectedTrip;localStorage.setItem(this.getStorageKey('activeTrip'),JSON.stringify(selectedTrip));this.loadConversionRates();this.currentTripView='dashboard';this.renderApp();}},getCreditsStatus:function(){const user=ProfileManager.getCurrentUser();if(!user)return null;return TripCreditManager.checkCreationAllowed(user);},backToTrips:function(){this.activeTrip=null;localStorage.removeItem(this.getStorageKey('activeTrip'));this.renderApp();},renderTripsListView:function(){this.backToTrips();},handleQuickSelect:function(button){const type=button.dataset.type;const value=button.dataset.value;const siblings=button.parentElement.querySelectorAll('.quick-select-btn');siblings.forEach(btn=>btn.classList.remove('active'));button.classList.add('active');const hiddenInput=document.getElementById(`selected-${type}`);if(hiddenInput){hiddenInput.value=value;}},handleAddExpense:function(){const expenseData={tripId:this.activeTrip.id,expenseDate:document.getElementById('expense-date').value,amount:document.getElementById('amount').value,currency:document.getElementById('selected-currency').value,category:document.getElementById('selected-category').value,place:document.getElementById('place').value.trim(),notes:document.getElementById('notes').value.trim(),location:this.currentLocation?`${this.currentLocation.latitude},${this.currentLocation.longitude}`:'N/A',mode:document.getElementById('selected-mode').value,id:`exp-${Date.now()}`,createdAt:new Date().toISOString()};if(!expenseData.amount||parseFloat(expenseData.amount)<=0||!expenseData.currency||!expenseData.category||!expenseData.mode||!expenseData.expenseDate){this.showMessage('Error','Please fill in all required fields (Date, Amount, Currency, Category, Mode). Amount must be greater than zero.');return;}
this.saveDataLocally(expenseData,'unsyncedExpenses');this.resetExpenseForm();this.renderExpenses();this.showSuccess('Expense added successfully!');},resetExpenseForm:function(){const expenseForm=document.getElementById('expense-form');if(expenseForm){expenseForm.reset();}
document.querySelectorAll('.quick-select-btn.active').forEach(btn=>btn.classList.remove('active'));const locationDisplay=document.getElementById('location-display');if(locationDisplay){locationDisplay.classList.add('hidden');}
this.currentLocation=null;const expenseDateInput=document.getElementById('expense-date');if(expenseDateInput){expenseDateInput.valueAsDate=new Date();}
this.applyExpenseDefaults();},captureLocation:function(){if(!navigator.geolocation){this.showError('Geolocation is not supported by your browser.');return;}
const locationDisplay=document.getElementById('location-display');if(locationDisplay){locationDisplay.textContent='Capturing location...';locationDisplay.classList.remove('hidden');}
navigator.geolocation.getCurrentPosition(position=>{this.currentLocation={latitude:position.coords.latitude,longitude:position.coords.longitude};if(locationDisplay){locationDisplay.textContent=`Location Captured: ${this.currentLocation.latitude.toFixed(4)}, ${this.currentLocation.longitude.toFixed(4)}`;}},error=>{console.error("Geolocation error:",error);if(locationDisplay){locationDisplay.textContent="Unable to get location.";}
this.showMessage('Location Error',`Could not get location. Error: ${error.message}`);});},handleManualSync:function(){if(!navigator.onLine){this.showMessage('Offline','You are offline. Please connect to the internet to sync data.');return;}
const unsyncedData=this.getLocalData('unsyncedExpenses',true).filter(d=>d.tripId===this.activeTrip?.id);if(unsyncedData.length===0){this.showMessage("Sync Info","There is no new data for this trip to sync.");return;}
this.syncAttemptOrigin='manual';this.showPinModal();},showPinModal:function(){let pinModal=document.getElementById('pin-modal');if(!pinModal){pinModal=document.createElement('div');pinModal.id='pin-modal';pinModal.className='modal';pinModal.innerHTML=`
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
            `;document.body.appendChild(pinModal);pinModal.querySelector('.close-button').addEventListener('click',()=>pinModal.classList.add('hidden'));document.getElementById('pin-modal-form').addEventListener('submit',(e)=>{e.preventDefault();this.handlePinSubmission();});}
pinModal.classList.remove('hidden');document.getElementById('pin-modal-input').focus();},handlePinSubmission:function(){const pinInput=document.getElementById('pin-modal-input');const pinMessage=document.getElementById('pin-modal-message');const enteredPin=pinInput.value;if(AppConfig.validatePIN(enteredPin)){document.getElementById('pin-modal').classList.add('hidden');pinMessage.textContent='';pinInput.value='';if(this.syncAttemptOrigin==='manual'){this.startSync();}}else{pinMessage.textContent='Invalid PIN. Please try again.';pinInput.select();}},async startSync(){const tripUnsyncedData=this.getLocalData('unsyncedExpenses',true).filter(d=>d.tripId===this.activeTrip?.id);if(tripUnsyncedData.length===0)return;this.showMessage("Syncing...",`Attempting to sync ${tripUnsyncedData.length} expense(s). Please wait.`);let newlySyncedItems=[];let remainingUnsynced=this.getLocalData('unsyncedExpenses',true).filter(d=>d.tripId!==this.activeTrip?.id);for(const item of tripUnsyncedData){const formData=new FormData();const user=ProfileManager?ProfileManager.getCurrentUser():null;formData.append(AppConfig.config.googleForm.expenseFields.name,`${user?.userId || 'unknown'}:${user?.displayName || 'unknown'}`);formData.append(AppConfig.config.googleForm.expenseFields.tripName,`${item.tripId}:${this.activeTrip?.name || 'unknown'}`);Object.entries(AppConfig.config.googleForm.expenseFields).forEach(([key,fieldName])=>{if(key!=='name'&&key!=='tripName'&&item[key]!==undefined){formData.append(fieldName,item[key]);}});try{await fetch(AppConfig.config.googleForm.expenseActionUrl,{method:'POST',mode:'no-cors',body:formData});newlySyncedItems.push({...item,syncDate:new Date().toISOString()});}catch(error){console.error(`Failed to sync item with ID ${item.id}:`,error);remainingUnsynced.push(item);}}
if(newlySyncedItems.length>0){const currentSynced=this.getLocalData('syncedExpenses',true);localStorage.setItem(this.getStorageKey('syncedExpenses'),JSON.stringify([...currentSynced,...newlySyncedItems]));}
localStorage.setItem(this.getStorageKey('unsyncedExpenses'),JSON.stringify(remainingUnsynced));const modal=document.getElementById('message-modal');if(modal)modal.classList.add('hidden');if(newlySyncedItems.length>0){this.showMessage("Sync Complete",`${newlySyncedItems.length} expense(s) were successfully synced.`);this.renderExpenses();}
if(remainingUnsynced.length>this.getLocalData('unsyncedExpenses',true).filter(d=>d.tripId!==this.activeTrip?.id).length){this.showMessage("Sync Incomplete",`Successfully synced ${newlySyncedItems.length} items. Some items failed to sync. Please check your connection and try again.`);}},async fetchExchangeRates(){if(!navigator.onLine){this.showMessage('Offline','Cannot fetch rates while offline. Please enter them manually or connect to the internet.');return;}
if(!this.activeTrip)return;this.showMessage('Fetching Rates...','Please wait while we get the latest exchange rates.');try{const baseCurrency=this.activeTrip.baseCurrency.toLowerCase();const response=await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseCurrency}.json`);if(!response.ok)throw new Error(`Network response was not ok (${response.status})`);const data=await response.json();const rates=data[baseCurrency];this.activeTrip.currencies.forEach(curr=>{const lowerCurr=curr.toLowerCase();if(curr!==this.activeTrip.baseCurrency&&rates[lowerCurr]){this.conversionRates[curr]=rates[lowerCurr];}});this.lastRatesFetchDate=data.date;this.persistConversionRates();document.getElementById('base-inputs').innerHTML=this.renderConversionInputs();this.updateSummaryDisplay();const ratesFetchNote=document.getElementById('rates-fetch-note');if(ratesFetchNote){ratesFetchNote.textContent=`Rates updated as of ${this.lastRatesFetchDate}`;ratesFetchNote.classList.remove('hidden');}
const modal=document.getElementById('message-modal');if(modal)modal.classList.add('hidden');this.showSuccess('Exchange rates updated successfully!');}catch(error){console.error('Failed to fetch exchange rates:',error);this.showMessage('Error',`Failed to fetch exchange rates. Please enter them manually. Error: ${error.message}`);}},handleRateChange:function(input){const currency=input.getAttribute('data-currency');const value=input.value.trim();if(value===''||isNaN(parseFloat(value))){delete this.conversionRates[currency];}else{const num=parseFloat(value);if(num>=0){this.conversionRates[currency]=num;}}
this.persistConversionRates();if(this.summaryMode==='base'){this.updateSummaryDisplay();}},persistConversionRates:function(){if(!this.activeTrip)return;try{const allRates=JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates')))||{};allRates[this.activeTrip.id]={...this.conversionRates,lastFetchDate:this.lastRatesFetchDate};localStorage.setItem(this.getStorageKey('conversionRates'),JSON.stringify(allRates));}catch(e){console.error('Failed to persist conversion rates:',e);}},switchSummaryMode:function(mode){if(this.summaryMode===mode)return;this.summaryMode=mode;document.getElementById('summary-tab-local')?.classList.toggle('active',mode==='local');document.getElementById('summary-tab-base')?.classList.toggle('active',mode==='base');document.getElementById('base-conversion-panel')?.classList.toggle('hidden',mode!=='base');this.updateSummaryDisplay();},updateSummaryDisplay:function(){const totalSummary=document.getElementById('total-expenses-summary');const categorySummary=document.getElementById('category-expenses-summary');if(totalSummary)totalSummary.innerHTML=this.renderTotalsSummary();if(categorySummary)categorySummary.innerHTML=this.renderCategorySummary();},renderExpenses:function(){const syncedList=document.getElementById('synced-list');const unsyncedList=document.getElementById('unsynced-list');if(!syncedList||!unsyncedList)return;const syncedData=this.getLocalData('syncedExpenses',true).filter(e=>e.tripId===this.activeTrip.id).sort((a,b)=>new Date(b.expenseDate)-new Date(a.expenseDate));const unsyncedData=this.getLocalData('unsyncedExpenses',true).filter(e=>e.tripId===this.activeTrip.id).sort((a,b)=>new Date(b.expenseDate)-new Date(a.expenseDate));syncedList.innerHTML=syncedData.map(item=>`<li>${item.amount} ${item.currency} for ${item.category} on ${item.expenseDate} (Synced)</li>`).join('');unsyncedList.innerHTML=unsyncedData.map(item=>`<li>${item.amount} ${item.currency} for ${item.category} on ${item.expenseDate} (Unsynced)</li>`).join('');document.getElementById('synced-header').style.display=syncedData.length>0?'block':'none';document.getElementById('unsynced-header').style.display=unsyncedData.length>0?'block':'none';this.updateSummaryDisplay();},exportData:function(){const user=ProfileManager?ProfileManager.getCurrentUser():null;if(!user){this.showMessage('Error','You must be logged in to export data.');return;}
const allData={user:{userId:user.userId,displayName:user.displayName},trips:this.getLocalData('trips'),syncedExpenses:this.getLocalData('syncedExpenses',true),unsyncedExpenses:this.getLocalData('unsyncedExpenses',true),conversionRates:JSON.parse(localStorage.getItem(this.getStorageKey('conversionRates')))||{}};const jsonData=JSON.stringify(allData,null,2);const blob=new Blob([jsonData],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`trip_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);this.showSuccess('Data export started!');},getStorageKey:function(key){return`lipikit_${key}`;},getLocalData:function(key,allUsers=false){try{const data=JSON.parse(localStorage.getItem(this.getStorageKey(key)))||[];if(!Array.isArray(data))return[];if(allUsers||key!=='trips'){return data;}
const user=ProfileManager?ProfileManager.getCurrentUser():null;const userId=user?user.userId:null;return data.filter(item=>item.userId===userId);}catch(e){console.error(`Failed to parse data from localStorage for key ${key}:`,e);localStorage.removeItem(this.getStorageKey(key));return[];}},saveDataLocally:function(data,key){try{const currentData=this.getLocalData(key,true);currentData.push(data);localStorage.setItem(this.getStorageKey(key),JSON.stringify(currentData));}catch(e){console.error(`Failed to save data to localStorage for key ${key}:`,e);this.showMessage('Storage Error','Could not save data. Your browser storage might be full.');}},getAllExpenses:function(){if(!this.activeTrip)return[];const synced=this.getLocalData('syncedExpenses',true).filter(e=>e.tripId===this.activeTrip.id);const unsynced=this.getLocalData('unsyncedExpenses',true).filter(e=>e.tripId===this.activeTrip.id);return[...synced,...unsynced];},showMessage:function(title,message,isConfirmation=false,isHtml=false){return new Promise((resolve)=>{let modal=document.getElementById('message-modal');if(!modal){modal=document.createElement('div');modal.id='message-modal';modal.className='modal';modal.innerHTML=`
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2 id="message-modal-title"></h2>
                    <div id="message-modal-body"></div>
                    <div id="message-modal-actions" class="form-actions">
                        <button id="message-modal-close" class="btn btn-primary btn-full mt-4">OK</button>
                    </div>
                </div>
            `;document.body.appendChild(modal);}
document.getElementById('message-modal-title').textContent=title;const bodyElement=document.getElementById('message-modal-body');if(isHtml){bodyElement.innerHTML=message;}else{bodyElement.textContent=message;}
const actionsDiv=document.getElementById('message-modal-actions');if(isConfirmation){actionsDiv.innerHTML=`
                <button id="message-modal-cancel" class="btn btn-secondary">Cancel</button>
                <button id="message-modal-confirm" class="btn btn-primary">Confirm</button>
            `;}else{if(title==='Helpful Resources'||title==='Item Help'){actionsDiv.style.display='none';}else{actionsDiv.style.display='block';actionsDiv.innerHTML=`
                    <button id="message-modal-close" class="btn btn-primary btn-full mt-4">OK</button>
                `;}}
modal.classList.remove('hidden');if(isConfirmation){const confirmBtn=document.getElementById('message-modal-confirm');const cancelBtn=document.getElementById('message-modal-cancel');const closeBtn=modal.querySelector('.close-button');const confirmHandler=()=>{modal.classList.add('hidden');confirmBtn.removeEventListener('click',confirmHandler);cancelBtn.removeEventListener('click',cancelHandler);closeBtn.removeEventListener('click',cancelHandler);resolve(true);};const cancelHandler=()=>{modal.classList.add('hidden');confirmBtn.removeEventListener('click',confirmHandler);cancelBtn.removeEventListener('click',cancelHandler);closeBtn.removeEventListener('click',cancelHandler);resolve(false);};confirmBtn.addEventListener('click',confirmHandler);cancelBtn.addEventListener('click',cancelHandler);closeBtn.addEventListener('click',cancelHandler);}else{const closeBtn=modal.querySelector('.close-button');const okBtn=document.getElementById('message-modal-close');const closeHandler=()=>{modal.classList.add('hidden');if(okBtn)okBtn.removeEventListener('click',closeHandler);closeBtn.removeEventListener('click',closeHandler);actionsDiv.style.display='block';resolve(false);};if(okBtn)okBtn.addEventListener('click',closeHandler);closeBtn.addEventListener('click',closeHandler);if(title==='Helpful Resources'||title==='Item Help'){const outsideClickHandler=(e)=>{if(e.target===modal){modal.classList.add('hidden');modal.removeEventListener('click',outsideClickHandler);closeBtn.removeEventListener('click',closeHandler);actionsDiv.style.display='block';resolve(false);}};modal.addEventListener('click',outsideClickHandler);}}});},showSuccess:function(message){const notification=document.createElement('div');notification.className='notification success';notification.textContent=message;document.body.appendChild(notification);setTimeout(()=>notification.classList.add('show'),10);setTimeout(()=>{notification.classList.remove('show');notification.addEventListener('transitionend',()=>notification.remove());},3000);},showError:function(message){const errorDiv=document.getElementById('trip-date-message')||document.querySelector('#pin-modal-message');if(errorDiv&&!errorDiv.closest('.hidden')){errorDiv.textContent=message;errorDiv.classList.remove('hidden');}else{this.showMessage('Error',message);}},updateNetworkStatus:function(){const updateStatus=()=>{const isOnline=navigator.onLine;document.querySelectorAll('#status-dot').forEach(dot=>{dot.style.backgroundColor=isOnline?'var(--success-color)':'var(--danger-color)';});document.querySelectorAll('#status-text').forEach(text=>{text.textContent=isOnline?'Online':'Offline';});};window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);updateStatus();},formatDateForDisplay:function(dateString){if(!dateString)return'N/A';try{const date=new Date(dateString);const now=new Date();const isCurrentYear=date.getFullYear()===now.getFullYear();const options={month:'short',day:'numeric'};if(!isCurrentYear){options.year='numeric';}
return date.toLocaleDateString('en-US',options);}catch(e){return dateString;}},calculateTripDuration:function(startDate,endDate){if(!startDate||!endDate)return'Duration unknown';try{const start=new Date(startDate);const end=new Date(endDate);const diffTime=Math.abs(end-start);const diffDays=Math.ceil(diffTime/(1000*60*60*24))+1;if(diffDays===1)return'1 day';if(diffDays<7)return`${diffDays} days`;if(diffDays<14)return`${Math.floor(diffDays / 7)} week`;if(diffDays<30)return`${Math.floor(diffDays / 7)} weeks`;if(diffDays<60)return`${Math.floor(diffDays / 30)} month`;return`${Math.floor(diffDays / 30)} months`;}catch(e){return'Duration unknown';}},formatCountriesDisplay:function(countries){if(!countries||!Array.isArray(countries)||countries.length===0){return'';}
if(countries.length===1){return`<span class="currency-name"><i class="fas fa-globe"></i> ${countries[0]}</span>`;}
if(countries.length<=3){return`<span class="currency-name"><i class="fas fa-globe"></i> ${countries.join(', ')}</span>`;}
return`<span class="currency-name"><i class="fas fa-globe"></i> ${countries.slice(0, 2).join(', ')} +${countries.length - 2} more</span>`;},getAllExpensesForTrip:function(tripId){if(!tripId)return[];const synced=this.getLocalData('syncedExpenses',true).filter(e=>e.tripId===tripId);const unsynced=this.getLocalData('unsyncedExpenses',true).filter(e=>e.tripId===tripId);return[...synced,...unsynced];},escapeHtml:function(text){if(!text)return'';const div=document.createElement('div');div.textContent=text;return div.innerHTML;},formatTripDates:function(){if(!this.activeTrip)return'';const start=this.formatDateForDisplay(this.activeTrip.start||this.activeTrip.startDate);const end=this.formatDateForDisplay(this.activeTrip.end||this.activeTrip.endDate);const duration=this.calculateTripDuration(this.activeTrip.start||this.activeTrip.startDate,this.activeTrip.end||this.activeTrip.endDate);return`${start} - ${end} (${duration})`;},calculateTripTotal:function(){const expenses=this.getAllExpenses();if(expenses.length===0)return'0';const totalsByCurrency={};expenses.forEach(expense=>{const amount=parseFloat(expense.amount)||0;const currency=expense.currency;if(amount>0&&currency){totalsByCurrency[currency]=(totalsByCurrency[currency]||0)+amount;}});const currencies=Object.keys(totalsByCurrency);if(currencies.length===0)return'0';if(currencies.length===1){const currency=currencies[0];return`${totalsByCurrency[currency].toLocaleString()} ${currency}`;}
return`${currencies.length} currencies`;},renderAdsenseBlock:function(){const adTag=AppSettingsManager?.appSettings?.adtag||AppSettingsManager?.getDefaultSettings?.()?.adtag||'';console.log('renderAdsenseBlock called, adTag:',adTag.substring(0,100)+'...');if(adTag.trim()!==''){return`
            <div class="adsense-container" data-ad-initialized="false" style="margin: 1rem 0;">
                ${adTag}
            </div>
        `;}
console.warn('No AdSense tag configured');return`
        <div class="adsense-container" data-ad-initialized="false" style="margin: 1rem 0;">
            <div style="min-height:90px; background:#f9f9f9; border:2px dashed #ddd; 
                        display:flex; align-items:center; justify-content:center; 
                        color:#888; font-size:14px; border-radius:8px;">
                [No Configuration Found]
            </div>
        </div>
    `;},initializeAds:function(){console.log('initializeAds called');const adContainers=document.querySelectorAll('.adsense-container[data-ad-initialized="false"]');console.log('Found ad containers:',adContainers.length);adContainers.forEach((container,index)=>{console.log(`Processing ad container ${index + 1}:`,container);try{if(typeof window.adsbygoogle!=='undefined'&&window.adsbygoogle){console.log('AdSense script found, initializing ad...');const adElement=container.querySelector('ins.adsbygoogle');if(adElement){console.log('Found ad element, pushing to adsbygoogle queue');(window.adsbygoogle=window.adsbygoogle||[]).push({});container.dataset.adInitialized='true';console.log('Ad initialized successfully');}else{console.warn('No ins.adsbygoogle element found in container');}}else{console.warn('AdSense script not available, using minimal container');container.innerHTML=`
                        <div style="height:1px; width:1px; overflow:hidden; position:absolute; opacity:0;">
                            <ins class="adsbygoogle" style="display:inline-block; width:1px; height:1px;"></ins>
                        </div>
                    `;container.dataset.adInitialized='true';}}catch(error){console.error('Error initializing AdSense ad:',error);container.innerHTML=`
                    <div style="min-height:90px; background:#ffebee; border:2px dashed #f44336; 
                                display:flex; align-items:center; justify-content:center; 
                                color:#d32f2f; font-size:14px; border-radius:8px;">
                        [AdSense Error: ${error.message}]
                    </div>
                `;container.dataset.adInitialized='true';}});},async loadChecklistMaster(){if(typeof DatasetManager==='undefined'){console.error('DatasetManager not available');return false;}
try{if(typeof AppSettings==='undefined'&&typeof AppSettingsManager!=='undefined'){window.AppSettings={datasets:AppSettingsManager.appSettings?.datasets||AppSettingsManager.getDefaultSettings().datasets};}
const checklistKey='checklist';console.log(`Loading checklist dataset with key: ${checklistKey}`);const loadResult=await DatasetManager.load_dataset_with_check(checklistKey,{skipRemote:true});if(!loadResult.ok){console.error('Failed to load checklist dataset:',loadResult.error);return false;}
const datasetResult=await DatasetManager.getDataset(checklistKey);if(!datasetResult.ok){console.error('Failed to get checklist dataset:',datasetResult.error);return false;}
const rawData=datasetResult.data;if(rawData&&rawData.items&&Array.isArray(rawData.items)){this.checklistMasterData=rawData.items;}else{console.error('Checklist dataset has unexpected format:',rawData);return false;}
console.log('Checklist dataset loaded successfully:',this.checklistMasterData);return true;}catch(error){console.error('Error loading checklist dataset:',error);return false;}},async initChecklistDB(tripId){if(!tripId)return false;const dbName=`lipikit_check_${tripId}`;try{const db=await this.openChecklistDB(dbName);console.log(`Checklist database initialized: ${dbName}`);return true;}catch(error){console.error('Failed to initialize checklist database:',error);return false;}},async openChecklistDB(dbName){return new Promise((resolve,reject)=>{const request=indexedDB.open(dbName,1);request.onerror=()=>reject(new Error(`IndexedDB open failed: ${request.error}`));request.onsuccess=()=>resolve(request.result);request.onupgradeneeded=(event)=>{const db=event.target.result;if(!db.objectStoreNames.contains('checklist')){const store=db.createObjectStore('checklist',{keyPath:'checklistId'});store.createIndex('checklistId','checklistId',{unique:true});store.createIndex('status','status',{unique:false});}};});},async getChecklistDB(tripId){if(!tripId)throw new Error('Trip ID is required');if(!this.checklistDatabases)this.checklistDatabases={};if(!this.checklistDatabases[tripId]){try{this.checklistDatabases[tripId]=await this.openChecklistDB(`lipikit_check_${tripId}`);}catch(error){throw new Error(`Failed to open checklist database: ${error.message}`);}}
return this.checklistDatabases[tripId];},async loadTripChecklist(tripId){try{const db=await this.getChecklistDB(tripId);return new Promise((resolve,reject)=>{const transaction=db.transaction(['checklist'],'readonly');const store=transaction.objectStore('checklist');const request=store.getAll();request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});}catch(error){console.error('Error loading trip checklist:',error);return[];}},async toggleChecklistItem(tripId,checklistId,isDone){try{const db=await this.getChecklistDB(tripId);return new Promise((resolve,reject)=>{const transaction=db.transaction(['checklist'],'readwrite');const store=transaction.objectStore('checklist');const request=store.put({checklistId,status:isDone?'Done':'Not Done',updatedAt:new Date().toISOString()});request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(true);});}catch(error){console.error('Error toggling checklist item:',error);return false;}},pendingChecklistChanges:{additions:new Set(),removals:new Set()},async applyChecklistChanges(tripId){try{const db=await this.getChecklistDB(tripId);const transaction=db.transaction(['checklist'],'readwrite');const store=transaction.objectStore('checklist');for(const checklistId of this.pendingChecklistChanges.removals){await store.delete(checklistId);}
for(const checklistId of this.pendingChecklistChanges.additions){await store.put({checklistId,status:'Not Done',updatedAt:new Date().toISOString()});}
this.pendingChecklistChanges.additions.clear();this.pendingChecklistChanges.removals.clear();return true;}catch(error){console.error('Error applying checklist changes:',error);return false;}},async checkChecklistExists(tripId){try{const db=await this.getChecklistDB(tripId);return new Promise((resolve)=>{const transaction=db.transaction(['checklist'],'readonly');const store=transaction.objectStore('checklist');const countRequest=store.count();countRequest.onsuccess=()=>resolve(countRequest.result>0);countRequest.onerror=()=>resolve(false);});}catch(error){console.error('Error checking checklist existence:',error);return false;}},renderChecklistView:async function(defaultTab='view-checklist'){const appArea=document.getElementById('app-area');if(!this.activeTrip)return;if(!this.checklistMasterData){const loaded=await this.loadChecklistMaster();if(!loaded){this.showError('Failed to load checklist data');return;}}
const status=this.getTripStatusTag(this.activeTrip);const statusHtml=status?`<span class="trip-tag ${status.className}">${status.label}</span>`:"";appArea.innerHTML=`
        <div class="card checklist-view">
            <div class="trip-header-bar">
                <button type="button" id="back-to-dashboard-btn" class="btn btn-secondary"><span class="btn-icon"><i class="fas fa-arrow-left"></i></span> Back to Dashboard</button>
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
    `;this.bindChecklistEvents();this.scrollToTop();this.initializeAds();},scrollToTop:function(){window.scrollTo({top:0,behavior:'smooth'});},async renderViewChecklistTab(){const exists=await this.checkChecklistExists(this.activeTrip.id);if(!exists){return`
            <div class="empty-state">
                <h3>No Checklist Items Yet</h3>
                <p>You haven't customized your checklist yet. Switch to the Customize tab to add items to your checklist.</p>
            </div>
        `;}
const tripChecklist=await this.loadTripChecklist(this.activeTrip.id);const categorizedItems=this.categorizeMasterChecklist(tripChecklist);this.checklistLinksData={};return`
        <p class="currency-name mb-4">Check off items as you complete them</p>
        <div class="checklist-container">
            ${Object.entries(categorizedItems).map(([category, items]) => `<div class="checklist-category"><h3>${category}</h3><div class="checklist-table">${items.map(item=>{const itemId=item.checklistId||item.id;const links=item.links||[];const tags=Array.isArray(item.tags)?item.tags.join(', '):(item.tags||'');this.checklistLinksData[itemId]={tags:tags,description:item.description||'',links:links};return`
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
                                            <i class="fas fa-lightbulb"></i> Resources
                                        </button>
                                    </div>
                                </div>
                            `;}).join('')}</div></div>`).join('')}
        </div>
    `;},async renderCustomizeChecklistTab(){const tripChecklist=await this.loadTripChecklist(this.activeTrip.id);const existingIds=new Set(tripChecklist.map(item=>item.checklistId));const categorizedItems=this.categorizeMasterChecklist(this.checklistMasterData,existingIds);this.checklistLinksData={};return`
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
            ${Object.entries(categorizedItems).map(([category, items]) => `<div class="checklist-category"><h3>${category}</h3><div class="checklist-table">${items.map(item=>{const links=item.links||[];const tags=Array.isArray(item.tags)?item.tags.join(', '):(item.tags||'');this.checklistLinksData[item.id]={tags:tags,description:item.description||'',links:links};return`
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
                            `;}).join('')}</div></div>`).join('')}
        </div>
    `;},categorizeMasterChecklist(items,existingIds=null){const categorized={};const masterItems=this.checklistMasterData||[];let processedItems;if(existingIds){processedItems=masterItems;}else{processedItems=items.map(item=>{const masterItem=masterItems.find(mi=>mi.id===item.checklistId);if(masterItem){return{...masterItem,...item,links:masterItem.links,tags:masterItem.tags,description:masterItem.description};}
return item;});}
processedItems.forEach(item=>{if(!item)return;const category=item.category||'Uncategorized';if(!categorized[category]){categorized[category]=[];}
categorized[category].push(item);});const sortedCategorized={};Object.keys(categorized).sort().forEach(category=>{sortedCategorized[category]=categorized[category].sort((a,b)=>{const textA=(a.text||'').toLowerCase();const textB=(b.text||'').toLowerCase();return textA.localeCompare(textB);});});return sortedCategorized;},bindChecklistEvents(){const appArea=document.getElementById('app-area');if(!appArea)return;if(!this._checklistClickHandler){this._checklistClickHandler=async(e)=>{const checklistViewRoot=e.target.closest('.checklist-view');if(!checklistViewRoot)return;const tabBtn=e.target.closest('.tab-btn');if(tabBtn&&checklistViewRoot.contains(tabBtn)){const currentActiveBtn=checklistViewRoot.querySelector('.tab-btn.active');const currentTab=currentActiveBtn?currentActiveBtn.dataset.tab:null;if(currentTab==='customize-checklist'&&tabBtn.dataset.tab!=='customize-checklist'&&this.pendingChecklistChanges.additions.size+this.pendingChecklistChanges.removals.size>0){const confirmed=await this.showMessage('Unsaved Changes','You have unsaved changes. Are you sure you want to discard them?',true);if(!confirmed){return;}
this.pendingChecklistChanges.additions.clear();this.pendingChecklistChanges.removals.clear();}
checklistViewRoot.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));checklistViewRoot.querySelectorAll('.tab-content').forEach(content=>content.classList.remove('active'));tabBtn.classList.add('active');const content=document.getElementById(tabBtn.dataset.tab);if(content){if(tabBtn.dataset.tab==='customize-checklist'){content.classList.add('active');content.innerHTML=await this.renderCustomizeChecklistTab();}else if(tabBtn.dataset.tab==='view-checklist'){content.classList.add('active');content.innerHTML=await this.renderViewChecklistTab();}else{content.classList.add('active');}}
return;}
const toggleBtn=e.target.closest('.toggle-item-btn');if(toggleBtn&&checklistViewRoot.contains(toggleBtn)){const checklistId=toggleBtn.dataset.checklistId;const isCurrentlyAdded=toggleBtn.classList.contains('btn-danger');if(isCurrentlyAdded){this.pendingChecklistChanges.removals.add(checklistId);this.pendingChecklistChanges.additions.delete(checklistId);toggleBtn.classList.remove('btn-danger');toggleBtn.classList.add('btn-success');toggleBtn.textContent='Add';}else{this.pendingChecklistChanges.additions.add(checklistId);this.pendingChecklistChanges.removals.delete(checklistId);toggleBtn.classList.remove('btn-success');toggleBtn.classList.add('btn-danger');toggleBtn.textContent='Remove';}
return;}
const helpBtn=e.target.closest('.help-btn');if(helpBtn&&checklistViewRoot.contains(helpBtn)){const itemId=helpBtn.dataset.itemId;console.log('Help button clicked for item:',itemId);const itemData=this.checklistLinksData[itemId];if(itemData){console.log('Found item data:',itemData);this.showChecklistHelp(itemData.tags,itemData.description,itemData.links);}else{console.warn('No data found for item:',itemId);this.showChecklistHelp('','',[]);}
return;}
const saveBtn=e.target.closest('#save-checklist-changes');if(saveBtn&&checklistViewRoot.contains(saveBtn)){const success=await this.applyChecklistChanges(this.activeTrip.id);if(success){this.showSuccess('Checklist updated successfully!');this.pendingChecklistChanges.additions.clear();this.pendingChecklistChanges.removals.clear();const viewTab=document.getElementById('view-checklist');const customizeTab=document.getElementById('customize-checklist');if(viewTab)viewTab.innerHTML=await this.renderViewChecklistTab();if(customizeTab&&customizeTab.classList.contains('active')){customizeTab.innerHTML=await this.renderCustomizeChecklistTab();}}else{this.showError('Failed to update checklist. Please try again.');}
return;}
const refreshBtn=e.target.closest('#refresh-checklist');if(refreshBtn&&checklistViewRoot.contains(refreshBtn)){try{const checklistKey='checklist';console.log(`Loading checklist dataset with key: ${checklistKey}`);const loadResult=await DatasetManager.load_dataset_with_check(checklistKey);if(!loadResult.ok){console.error('Failed to load checklist dataset:',loadResult.error);return false;}
this.showSuccess('Got more suggestions from our servers');this.renderChecklistView('customize-checklist');const customizeTab=document.getElementById('customize-checklist');if(customizeTab&&customizeTab.classList.contains('active')){customizeTab.innerHTML=await this.renderCustomizeChecklistTab();}}catch(err){console.error('Refresh failed:',err);this.showError('Could not fetch new suggestions. Please try again later.');}
return;}
const backBtn=e.target.closest('#back-to-dashboard-btn');if(backBtn&&checklistViewRoot.contains(backBtn)){if(this.pendingChecklistChanges.additions.size+this.pendingChecklistChanges.removals.size>0){const confirmed=await this.showMessage('Unsaved Changes','You have unsaved changes. Are you sure you want to discard them?',true);if(!confirmed){return;}}
this.pendingChecklistChanges.additions.clear();this.pendingChecklistChanges.removals.clear();this.currentTripView='dashboard';this.renderApp();return;}};appArea.addEventListener('click',this._checklistClickHandler);}
if(!this._checklistChangeHandler){this._checklistChangeHandler=async(e)=>{if(e.target.matches('.checklist-view input[type="checkbox"][data-checklist-id]')){const checklistId=e.target.dataset.checklistId;const success=await this.toggleChecklistItem(this.activeTrip.id,checklistId,e.target.checked);if(!success){e.target.checked=!e.target.checked;this.showError('Failed to update checklist item. Please try again.');}}};appArea.addEventListener('change',this._checklistChangeHandler);}},debugChecklistMaster(){console.log('=== CHECKLIST DEBUG ===');console.log('checklistMasterData:',this.checklistMasterData);if(this.checklistMasterData&&this.checklistMasterData.length>0){console.log('First item sample:',this.checklistMasterData[0]);console.log('Items with links:');this.checklistMasterData.forEach(item=>{if(item.links&&item.links.length>0){console.log(`  ${item.id}: ${item.links.length} links`);}});}else{console.log('No master data loaded!');}
console.log('=== END DEBUG ===');},showChecklistHelp(tags,description,links=[]){let content='';if(tags&&tags.trim()){content+=`<p class="help-tags" style="font-weight: bold; color: var(--primary-color); margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-light); border-radius: 4px; border-left: 4px solid var(--primary-color);">${tags}</p>`;}
if(description&&description.trim()){const urlRegex=/(https?:\/\/[^\s]+)/g;const descWithLinks=description.replace(urlRegex,'<a href="$1" target="_blank">$1</a>');content+=`<p class="help-description" style="margin-bottom: 1.5rem; line-height: 1.6; color: var(--text-medium);">${descWithLinks}</p>`;}
if(Array.isArray(links)&&links.length>0){content+='<div class="help-links" style="margin-bottom: 1rem;">';content+='<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">';links.forEach(link=>{if(link&&link.url&&link.label){content+=`<a href="${link.url}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; 
                          background: var(--primary-color); color: white; text-decoration: none; 
                          border-radius: 6px; font-size: 0.9rem; font-weight: 500; 
                          transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                   onmouseover="this.style.backgroundColor='var(--primary-hover)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                   onmouseout="this.style.backgroundColor='var(--primary-color)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                    ${this.escapeHtml(link.label)} <span style="font-size: 0.8rem;"><i class="fas fa-external-link-alt"></i></span>
                </a>`;}});content+='</div>';content+='</div>';}
if(!content.trim()){content='<p style="text-align: center; color: var(--text-light); font-style: italic; padding: 2rem;">No additional resources available for this item.</p>';}
this.showMessage('Helpful Resources',content,false,true);},renderItineraryView:function(defaultTab='plan'){const appArea=document.getElementById('app-area');if(!this.activeTrip)return;const status=this.getTripStatusTag(this.activeTrip);const statusHtml=status?`<span class="trip-tag ${status.className}">${status.label}</span>`:"";appArea.innerHTML=`
        <div class="card expense-view">
            <div class="trip-header-bar">
                <button type="button" id="back-to-dashboard-btn" class="btn btn-secondary btn-with-icon">
                    <span class="btn-icon"><i class="fas fa-arrow-left"></i></span> Back to Dashboard
                </button>
            </div>
            
            <h1 class="trip-view-title">
                Trip: <span style="color: var(--primary-color);">${this.activeTrip.name}</span>
                ${statusHtml}
            </h1>

            <div class="tab-header">
                <button class="tab-btn ${defaultTab === 'plan' ? 'active' : ''}" data-tab="plan-itinerary">
                    <i class="fa-solid fa-book" style="margin-right: 4px;"></i> Plan
                </button>

                <button class="tab-btn ${defaultTab === 'track' ? 'active' : ''}" data-tab="track-itinerary">
                    <i class="fa-solid fa-check" style="margin-right: 4px;"></i> Track
                </button>

            </div>

            <div id="plan-itinerary" class="tab-content ${defaultTab === 'plan' ? 'active' : ''}">
                ${this.renderPlanItineraryTab()}
            </div>

            <div id="track-itinerary" class="tab-content ${defaultTab === 'track' ? 'active' : ''}">
                ${this.renderTrackItineraryTab()}
            </div>
        </div>
    `;document.querySelectorAll('.expense-view .tab-header .tab-btn').forEach(button=>{button.addEventListener('click',()=>{const card=button.closest('.card');card.querySelectorAll('.tab-header .tab-btn').forEach(btn=>btn.classList.remove('active'));card.querySelectorAll('.tab-content').forEach(content=>content.classList.remove('active'));button.classList.add('active');const tabContentId=button.dataset.tab;const tabContent=document.getElementById(tabContentId);if(tabContent)tabContent.classList.add('active');});});document.getElementById('back-to-dashboard-btn').addEventListener('click',()=>{this.currentTripView='dashboard';this.renderApp();});this.bindItineraryEvents();this.scrollToTop();},renderPlanItineraryTab:function(){const activities=this.getItineraryActivities();const tripDays=this.calculateTripDays();return`
        <p class="currency-name mb-4">Plan your daily activities</p>
        
        <form id="itinerary-form">
            <input type="hidden" id="editing-activity-id">
            <input type="hidden" id="selected-activity-type">
            
            <div class="form-group">
                <label for="activity-day"><i class="fas fa-calendar"></i> Day</label>
                <select id="activity-day" required>
                    ${tripDays.map((day, idx) => `<option value="${idx}">${day.label}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="activity-name">Activity Name *</label>
                <input type="text" id="activity-name" placeholder="e.g., Visit Sensoji Temple" required>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-tag"></i> Type *</label>
                <div id="quick-activity-type-buttons">
                    ${this.renderQuickSelectButtons([' Sightseeing', ' Food', ' Transport', ' Stay', ' Shopping', ' Other'], 'activity-type')}
                </div>
            </div>
            
            <div class="form-grid-2">
                <div class="form-group">
                    <label for="planned-cost"><i class="fas fa-money-bill"></i> Planned Cost</label>
                    <input type="number" id="planned-cost" step="0.01" min="0" placeholder="0">
                </div>
                <div class="form-group">
                    <label for="planned-currency"><i class="fas fa-coins"></i> Currency</label>
                    <select id="planned-currency">
                        ${this.activeTrip.currencies.map(curr => `<option value="${curr}"${curr===this.activeTrip.baseCurrency?'selected':''}>${curr}-${AppConfig.config.currencyNames[curr]||curr}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="activity-url"><i class="fas fa-link"></i> URL (Optional)</label>
                <input type="url" id="activity-url" placeholder="https://...">
            </div>
            
            <div class="form-group">
                <label for="activity-notes"><i class="fas fa-note-sticky"></i> Notes (Optional)</label>
                <textarea id="activity-notes" rows="2" placeholder="Any details or reminders..."></textarea>
            </div>
            
            <div class="expense-form-reset">
                <button type="submit" class="btn btn-primary btn-with-icon" id="save-activity-btn">
                    <span class="btn-icon">+</span> Add Activity
                </button>
                <button type="button" id="reset-itinerary-btn" class="btn btn-secondary">Reset</button>
            </div>
        </form>
        
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--border-color);">
        
        <h3 style="margin-bottom: 1rem;">Planned Activities</h3>
        <div id="activities-list">
            ${this.renderActivitiesByDay(activities, 'plan')}
        </div>
    `;},renderTrackItineraryTab:function(){const activities=this.getItineraryActivities();if(activities.length===0){return`
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3 class="empty-state-title">No Activities Planned</h3>
                <p class="empty-state-message">Switch to the Plan tab to add activities to your itinerary first.</p>
            </div>
        `;}
return`
        <p class="currency-name mb-4">Track your activities and create expenses</p>
        <div id="track-activities-list">
            ${this.renderActivitiesByDay(activities, 'track')}
        </div>
    `;},renderActivitiesByDay:function(activities,mode='plan'){if(activities.length===0){return`
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3 class="empty-state-title">No Activities Yet</h3>
                <p class="empty-state-message">Start planning by adding your first activity above!</p>
            </div>
        `;}
const tripDays=this.calculateTripDays();const activitiesByDay={};activities.forEach(activity=>{if(!activitiesByDay[activity.day]){activitiesByDay[activity.day]=[];}
activitiesByDay[activity.day].push(activity);});let html='';Object.keys(activitiesByDay).sort((a,b)=>parseInt(a)-parseInt(b)).forEach(dayNum=>{const dayActivities=activitiesByDay[dayNum];const dayInfo=tripDays[parseInt(dayNum)];const completedCount=dayActivities.filter(a=>a.status==='completed').length;html+=`
            <div class="day-section">
                <h3 class="day-header" data-day="${dayNum}">
                    ${dayInfo.label}
                    ${mode === 'track' ? `<span style="font-size: 0.85rem; font-weight: 400; color: var(--text-light);">(${completedCount}/${dayActivities.length} done)</span>` : ''}
                   <span class="day-toggle"><i class="fas fa-chevron-down"></i></span>
                </h3>
                <div class="day-activities">
                    ${dayActivities.map(activity => this.renderActivityCard(activity, mode)).join('')}
                </div>
            </div>
        `;});return html;},renderActivityCard:function(activity,mode='plan'){const typeIcon=activity.type.split(' ')[0];const typeName=activity.type.substring(activity.type.indexOf('>')+1);const getDomain=(url)=>{if(!url)return null;try{const urlObj=new URL(url);return urlObj.hostname.replace('www.','');}catch(e){return url;}};const domain=getDomain(activity.url);if(mode==='plan'){return`
            <div class="activity-card" data-activity-id="${activity.id}">
                <div class="activity-header">
                    <div>
                        <span class="activity-icon">${typeIcon}</span>
                        <strong>${this.escapeHtml(activity.name)}</strong>
                    </div>
                    <div class="activity-actions">
                        <button class="btn-icon-small edit-activity-btn" data-id="${activity.id}" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="btn-icon-small delete-activity-btn" data-id="${activity.id}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="activity-details">
                    <div>Type: ${typeName}</div>
                    <div>Planned: ${activity.plannedCost || 0} ${activity.plannedCurrency}</div>
                    ${activity.url ? `<div><a href="${activity.url}"target="_blank"rel="noopener"><i class="fas fa-link"></i>${domain}</a></div>` : ''}
                    ${activity.notes ? `<div class="activity-notes">${this.escapeHtml(activity.notes)}</div>` : ''}
                </div>
            </div>
        `;}else{const isCompleted=activity.status==='completed';const isSkipped=activity.status==='skipped';return`
            <div class="activity-card ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''}" data-activity-id="${activity.id}">
                <div class="activity-header">
                    <div>
                        <span class="activity-icon">${isCompleted ? '<i class="fas fa-check-circle"></i>' : isSkipped ? '<i class="fas fa-minus-circle"></i>' : typeIcon}</span>
                        <strong>${this.escapeHtml(activity.name)}</strong>
                        ${isCompleted ? '<span class="status-badge completed">Completed</span>' : ''}
                        ${isSkipped ? '<span class="status-badge skipped">Skipped</span>' : ''}
                    </div>
                </div>
                <div class="activity-details">
                    <div>Type: ${typeName} | Planned: ${activity.plannedCost || 0} ${activity.plannedCurrency}</div>
                    ${activity.url ? `<div><a href="${activity.url}"target="_blank"rel="noopener"><i class="fas fa-link"></i>${domain}</a></div>` : ''}
                    ${activity.notes ? `<div class="activity-notes">${this.escapeHtml(activity.notes)}</div>` : ''}
                    ${isCompleted && activity.completionNotes ? `<div class="activity-notes">Completion:${this.escapeHtml(activity.completionNotes)}</div>` : ''}
                </div>
                ${!isCompleted && !isSkipped ? `<div class="activity-tracking"><button class="btn btn-success btn-full complete-activity-btn"data-id="${activity.id}"><i class="fas fa-check"></i>Mark Complete&Add Expense</button><button class="btn btn-secondary btn-full skip-activity-btn"data-id="${activity.id}">Skip Activity</button></div>` : ''}
                ${isCompleted && activity.rating ? `<div class="activity-rating">Rating:${'<i class="fas fa-star"></i>'.repeat(activity.rating)}</div>` : ''}
            </div>
        `;}},calculateTripDays:function(){const start=new Date(this.activeTrip.start||this.activeTrip.startDate);const end=new Date(this.activeTrip.end||this.activeTrip.endDate);const days=[];let current=new Date(start);let dayNum=0;while(current<=end){days.push({number:dayNum,date:new Date(current),label:`Day ${dayNum} - ${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`});current.setDate(current.getDate()+1);dayNum++;}
return days;},getItineraryStorageKey:function(){return`lipikit_itinerary_${this.activeTrip.id}`;},getItineraryActivities:function(){try{const data=localStorage.getItem(this.getItineraryStorageKey());return data?JSON.parse(data):[];}catch(e){console.error('Failed to load itinerary:',e);return[];}},saveItineraryActivities:function(activities){try{localStorage.setItem(this.getItineraryStorageKey(),JSON.stringify(activities));return true;}catch(e){console.error('Failed to save itinerary:',e);this.showError('Failed to save activity. Storage might be full.');return false;}},saveActivity:function(){const editingId=document.getElementById('editing-activity-id').value;const isEditing=!!editingId;const activityData={id:isEditing?editingId:`act-${Date.now()}-${Math.random().toString(36).slice(2)}`,day:parseInt(document.getElementById('activity-day').value),name:document.getElementById('activity-name').value.trim(),type:document.getElementById('selected-activity-type').value,plannedCost:parseFloat(document.getElementById('planned-cost').value)||0,plannedCurrency:document.getElementById('planned-currency').value,url:document.getElementById('activity-url').value.trim(),notes:document.getElementById('activity-notes').value.trim(),status:'planned',createdAt:isEditing?null:new Date().toISOString()};if(!activityData.name||!activityData.type){this.showError('Please fill in activity name and type');return;}
const activities=this.getItineraryActivities();if(isEditing){const index=activities.findIndex(a=>a.id===editingId);if(index>=0){activityData.status=activities[index].status;activityData.actualCost=activities[index].actualCost;activityData.actualCurrency=activities[index].actualCurrency;activityData.rating=activities[index].rating;activityData.completionNotes=activities[index].completionNotes;activityData.completedAt=activities[index].completedAt;activityData.linkedExpenseId=activities[index].linkedExpenseId;activityData.createdAt=activities[index].createdAt;activities[index]=activityData;}}else{activities.push(activityData);}
if(this.saveItineraryActivities(activities)){this.showSuccess(isEditing?'Activity updated!':'Activity added!');this.resetItineraryForm();this.renderItineraryView('plan');}},editActivity:function(activityId){const activities=this.getItineraryActivities();const activity=activities.find(a=>a.id===activityId);if(!activity)return;document.getElementById('editing-activity-id').value=activity.id;document.getElementById('activity-day').value=activity.day;document.getElementById('activity-name').value=activity.name;document.getElementById('planned-cost').value=activity.plannedCost||'';document.getElementById('planned-currency').value=activity.plannedCurrency;document.getElementById('activity-url').value=activity.url||'';document.getElementById('activity-notes').value=activity.notes||'';document.getElementById('selected-activity-type').value=activity.type;document.querySelectorAll('#quick-activity-type-buttons .quick-select-btn').forEach(btn=>{if(btn.dataset.value===activity.type){btn.classList.add('active');}else{btn.classList.remove('active');}});document.getElementById('save-activity-btn').innerHTML='<span class="btn-icon">ðŸ’¾</span> Update Activity';document.getElementById('itinerary-form').scrollIntoView({behavior:'smooth',block:'start'});},deleteActivity:function(activityId){if(!confirm('Are you sure you want to delete this activity?'))return;const activities=this.getItineraryActivities().filter(a=>a.id!==activityId);if(this.saveItineraryActivities(activities)){this.showSuccess('Activity deleted');this.renderItineraryView('plan');}},resetItineraryForm:function(){const form=document.getElementById('itinerary-form');if(form)form.reset();document.getElementById('editing-activity-id').value='';document.getElementById('selected-activity-type').value='';document.querySelectorAll('.quick-select-btn.active').forEach(btn=>btn.classList.remove('active'));document.getElementById('save-activity-btn').innerHTML='<span class="btn-icon">+</span> Add Activity';document.getElementById('planned-currency').value=this.activeTrip.baseCurrency;},showCompleteActivityModal:function(activityId){const activities=this.getItineraryActivities();const activity=activities.find(a=>a.id===activityId);if(!activity)return;const tripDays=this.calculateTripDays();const dayInfo=tripDays[activity.day];const expenseDate=dayInfo.date.toISOString().split('T')[0];const typeToCategory={'ðŸ›ï¸ Sightseeing':'Activities','ðŸœ Food':'Food','ðŸš‡ Transport':'Transport','ðŸ¨ Stay':'Accommodation','ðŸ›ï¸ Shopping':'Shopping','ðŸ“Œ Other':'Other'};const category=typeToCategory[activity.type]||'Other';const modal=document.createElement('div');modal.className='modal';modal.id='complete-activity-modal';modal.innerHTML=`
        <div class="modal-content">
            <h2>Complete Activity & Add Expense</h2>
            <p style="color: var(--text-light); margin-bottom: 1.5rem;">
                <strong>${this.escapeHtml(activity.name)}</strong><br>
                Day ${activity.day} | Planned: ${activity.plannedCost || 0} ${activity.plannedCurrency}
            </p>
            
            <form id="complete-activity-form">
                <input type="hidden" id="completing-activity-id" value="${activityId}">
                <input type="hidden" id="expense-date-hidden" value="${expenseDate}">
                <input type="hidden" id="expense-category-hidden" value="${category}">
                <input type="hidden" id="selected-expense-mode">
                
                <div class="form-grid-2">
                    <div class="form-group">
                        <label for="actual-cost"><i class="fas fa-money-bill"></i> Actual Cost *</label>
                        <input type="number" id="actual-cost" step="0.01" min="0" value="${activity.plannedCost || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="actual-currency"><i class="fas fa-coins"></i> Currency</label>
                        <select id="actual-currency">
                            ${this.activeTrip.currencies.map(curr => `<option value="${curr}"${curr===activity.plannedCurrency?'selected':''}>${curr}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-credit-card"></i> Payment Mode *</label>
                    <div id="quick-expense-mode-buttons">
                        ${this.renderQuickSelectButtons(AppConfig.config.modes, 'expense-mode')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-star"></i> Rating (Optional)</label>
                    <div class="rating-buttons">
                        ${[1,2,3,4,5].map(star => `<button type="button"class="rating-btn"data-rating="${star}"><i class="fas fa-star"style="color: gold;"></i></button>`).join('')}
                    </div>
                    <input type="hidden" id="activity-rating" value="0">
                </div>
                
                <div class="form-group">
                    <label for="completion-notes"><i class="fas fa-note-sticky"></i> Notes (Optional)</label>
                    <textarea id="completion-notes" rows="2" placeholder="How was it?"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('complete-activity-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-success btn-with-icon">
                        <span class="btn-icon"><i class="fas fa-check"></i></span> Complete & Add Expense
                    </button>
                </div>
            </form>
        </div>
    `;document.body.appendChild(modal);modal.querySelectorAll('.rating-btn').forEach((btn,idx)=>{btn.addEventListener('click',()=>{modal.querySelectorAll('.rating-btn').forEach((b,i)=>{b.style.opacity=i<=idx?'1':'0.3';});document.getElementById('activity-rating').value=idx+1;});});modal.querySelectorAll('#quick-expense-mode-buttons .quick-select-btn').forEach(btn=>{btn.addEventListener('click',()=>{modal.querySelectorAll('#quick-expense-mode-buttons .quick-select-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('selected-expense-mode').value=btn.dataset.value;});});modal.querySelector('form').addEventListener('submit',(e)=>{e.preventDefault();this.completeActivity(activityId);});modal.addEventListener('click',(e)=>{if(e.target===modal)modal.remove();});},completeActivity:function(activityId){const activities=this.getItineraryActivities();const activity=activities.find(a=>a.id===activityId);if(!activity)return;const actualCost=parseFloat(document.getElementById('actual-cost').value);const actualCurrency=document.getElementById('actual-currency').value;const paymentMode=document.getElementById('selected-expense-mode').value;const rating=parseInt(document.getElementById('activity-rating').value)||0;const completionNotes=document.getElementById('completion-notes').value.trim();if(!actualCost||actualCost<0||!paymentMode){this.showError('Please enter actual cost and select payment mode');return;}
const tripDays=this.calculateTripDays();const dayInfo=tripDays[activity.day];const expenseDate=dayInfo.date.toISOString().split('T')[0];const structuredNotes=this.buildItineraryExpenseNotes(activity,{rating,completionNotes,completedAt:new Date().toISOString()});const expenseData={tripId:this.activeTrip.id,expenseDate:expenseDate,amount:actualCost,currency:actualCurrency,category:document.getElementById('expense-category-hidden').value,place:activity.name,notes:structuredNotes,location:'N/A',mode:paymentMode,id:`exp-${Date.now()}`,createdAt:new Date().toISOString(),linkedActivityId:activityId};this.saveDataLocally(expenseData,'unsyncedExpenses');activity.status='completed';activity.actualCost=actualCost;activity.actualCurrency=actualCurrency;activity.rating=rating;activity.completionNotes=completionNotes;activity.completedAt=new Date().toISOString();activity.linkedExpenseId=expenseData.id;this.saveItineraryActivities(activities);document.getElementById('complete-activity-modal').remove();this.showSuccess('Activity completed and expense added!');this.renderItineraryView('track');},skipActivity:function(activityId){if(!confirm('Skip this activity? You can still mark it complete later.'))return;const activities=this.getItineraryActivities();const activity=activities.find(a=>a.id===activityId);if(activity){activity.status='skipped';this.saveItineraryActivities(activities);this.showSuccess('Activity marked as skipped');this.renderItineraryView('track');}},buildItineraryExpenseNotes:function(activity,trackingData){const lines=['ðŸŽ¯ ITINERARY ACTIVITY',`Activity: ${activity.name}`,`Day: ${activity.day}`,`Type: ${activity.type}`,`URL: ${activity.url || 'N/A'}`,`Planned: ${activity.plannedCost || 0} ${activity.plannedCurrency}`,`Rating: ${trackingData.rating ? '<i class="fas fa-star"></i>'.repeat(trackingData.rating) : 'Not rated'}`,`Notes: ${trackingData.completionNotes || 'None'}`,`Completed: ${new Date(trackingData.completedAt).toLocaleString()}`];return lines.join('\n');},bindItineraryEvents:function(){const appArea=document.getElementById('app-area');if(!appArea)return;const form=document.getElementById('itinerary-form');if(form){form.addEventListener('submit',(e)=>{e.preventDefault();this.saveActivity();});}
const resetBtn=document.getElementById('reset-itinerary-btn');if(resetBtn){resetBtn.addEventListener('click',()=>this.resetItineraryForm());}
appArea.querySelectorAll('#quick-activity-type-buttons .quick-select-btn').forEach(btn=>{btn.addEventListener('click',()=>{appArea.querySelectorAll('#quick-activity-type-buttons .quick-select-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('selected-activity-type').value=btn.dataset.value;});});appArea.querySelectorAll('.edit-activity-btn').forEach(btn=>{btn.addEventListener('click',()=>this.editActivity(btn.dataset.id));});appArea.querySelectorAll('.delete-activity-btn').forEach(btn=>{btn.addEventListener('click',()=>this.deleteActivity(btn.dataset.id));});appArea.querySelectorAll('.complete-activity-btn').forEach(btn=>{btn.addEventListener('click',()=>this.showCompleteActivityModal(btn.dataset.id));});appArea.querySelectorAll('.skip-activity-btn').forEach(btn=>{btn.addEventListener('click',()=>this.skipActivity(btn.dataset.id));});appArea.querySelectorAll('.day-header').forEach(header=>{header.addEventListener('click',()=>{const daySection=header.closest('.day-section');const activities=daySection.querySelector('.day-activities');const toggle=header.querySelector('.day-toggle');if(activities.style.display==='none'){activities.style.display='block';toggle.innerHTML='<i class="fas fa-chevron-up"></i>';}else{activities.style.display='none';toggle.innerHTML='<i class="fas fa-chevron-down"></i>';}});});},renderDocumentManagerView:function(){const appArea=document.getElementById('app-area');if(!this.activeTrip)return;const status=this.getTripStatusTag(this.activeTrip);const statusHtml=status?`<span class="trip-tag ${status.className}">${status.label}</span>`:"";appArea.innerHTML=`
        <div class="card document-manager-view">
            <div class="trip-header-bar">
                <button type="button" id="back-to-dashboard-btn" class="btn btn-secondary btn-with-icon">
                    <span class="btn-icon"><i class="fas fa-arrow-left"></i></span> Back to Dashboard
                </button>
            </div>
            
            <h1 class="trip-view-title">
                Trip: <span style="color: var(--primary-color);">${this.escapeHtml(this.activeTrip.name)}</span>
                ${statusHtml}
            </h1>

            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <button id="add-document-btn" class="btn btn-primary btn-with-icon">
                    <span class="btn-icon">+</span> Add Document
                </button>
            </div>

            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
                <input type="text" 
                       id="document-search" 
                       placeholder="🔍 Search documents..." 
                       value="${this.currentDocumentSearch}"
                       style="flex: 1; min-width: 200px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm);">
                
                <select id="document-type-filter" style="min-width: 150px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm);">
                    <option value="all">All Types</option>
                    ${this.documentTypes.map(type => `<option value="${type}"${this.currentDocumentFilter===type?'selected':''}>${type}</option>`).join('')}
                </select>
            </div>

            <div id="documents-list" style="display: grid; gap: 1rem;">
                ${this.renderDocumentsList()}
            </div>
        </div>
    `;document.getElementById('back-to-dashboard-btn').addEventListener('click',()=>{this.currentTripView='dashboard';this.renderApp();});document.getElementById('add-document-btn').addEventListener('click',()=>{this.showAddDocumentModal();});document.getElementById('document-search').addEventListener('input',(e)=>{this.currentDocumentSearch=e.target.value;this.refreshDocumentsList();});document.getElementById('document-type-filter').addEventListener('change',(e)=>{this.currentDocumentFilter=e.target.value;this.refreshDocumentsList();});this.bindDocumentEvents();this.scrollToTop();this.initializeAds();},renderDocumentsList:function(){const documents=this.getFilteredDocuments();if(documents.length===0){return`
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-light); border-radius: var(--border-radius); border: 2px dashed var(--border-color);">
                <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;">📄</div>
                <h3 style="color: var(--text-medium); margin-bottom: 0.5rem; font-weight: 600;">No Documents Found</h3>
                <p style="color: var(--text-light); font-size: 0.9rem;">
                    ${this.currentDocumentSearch || this.currentDocumentFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'Start by clicking "Add Document" to upload your first travel document.'}
                </p>
            </div>
        `;}
return documents.map(doc=>this.renderDocumentCard(doc)).join('');},renderDocumentCard:function(doc){const typeIcon=this.getDocumentTypeIcon(doc.type);const isInVault=doc.vaultStatus==='copied';const statusBadge=isInVault?'<span class="document-status-badge secured"><i class="fas fa-lock"></i> SECURED</span>':'<span class="document-status-badge unsecured"><i class="fas fa-exclamation-triangle"></i> ON DEVICE</span>';let thumbnailContent='';if(doc.fileType&&doc.fileType.startsWith('image/')&&doc.thumbnailUrl){thumbnailContent=`
            <div class="document-thumbnail" style="background-image: url('${doc.thumbnailUrl}');">
                <div class="document-thumbnail-overlay">
                    <i class="fas fa-search-plus"></i>
                </div>
            </div>
        `;}else if(doc.fileType==='application/pdf'){thumbnailContent=`
            <div class="document-thumbnail pdf-thumbnail">
                <i class="fas fa-file-pdf"></i>
                <span>PDF</span>
            </div>
        `;}else{thumbnailContent=`
            <div class="document-icon">
                ${typeIcon}
            </div>
        `;}
return`
        <div class="document-card" data-doc-id="${doc.id}">
            ${thumbnailContent}
            
            <div class="document-details">
                <div class="document-name">${this.escapeHtml(doc.name)}</div>
                <div class="document-meta">
                    ${doc.type} • ${this.formatFileSize(doc.fileSize)} • ${new Date(doc.addedAt).toLocaleDateString()}
                </div>
                ${doc.tags ? `<div class="document-tags">Tags:${this.escapeHtml(doc.tags)}</div>` : ''}
                <div class="document-status">
                    ${statusBadge}
                </div>
                ${!isInVault ? `<div class="document-warning"><i class="fas fa-info-circle"></i>Stored on your device</div>` : ''}
            </div>
            
            <div class="document-actions">
                <button class="btn btn-sm btn-primary view-doc-btn" 
                        data-doc-id="${doc.id}"
                        title="View document details">
                    <i class="fas fa-eye"></i> View
                </button>
                
                <button class="btn btn-sm btn-secondary replace-vault-btn" 
                        data-doc-id="${doc.id}"
                        title="Update document">
                    <i class="fas fa-sync"></i> Update
                </button>
                
                <button class="btn btn-sm btn-danger delete-doc-btn" 
                        data-doc-id="${doc.id}"
                        title="Delete document">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;},showAddDocumentModal:function(){document.body.insertAdjacentHTML('beforeend',`
        <div class="modal" id="add-document-modal">
            <div class="modal-content">
                <span class="close-button" style="position: absolute; top: 1rem; right: 1rem; cursor: pointer; font-size: 1.5rem; line-height: 1;">&times;</span>
                
                <h2>Add Travel Document</h2>
                <p style="color: var(--text-light); margin-bottom: 1.5rem;">
                    Upload and organize your travel documents. Documents on your device show their location.
                </p>
                
                <form id="add-document-form">
                    <div class="form-group">
                        <label for="doc-name">Document Name *</label>
                        <input type="text" id="doc-name" placeholder="e.g., US Passport, Visa Approval" required>
                        <small class="currency-name">Give your document a memorable name</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="doc-type">Document Type *</label>
                        <select id="doc-type" required>
                            <option value="">Select type...</option>
                            ${this.documentTypes.map(type => `<option value="${type}">${this.getDocumentTypeIcon(type)}${type}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="doc-tags">Tags (Optional)</label>
                        <input type="text" id="doc-tags" placeholder="e.g., important, visa, 2025">
                        <small class="currency-name">Separate multiple tags with commas</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="doc-file">Select File *</label>
                        <input type="file" id="doc-file" accept="image/*,.pdf,.doc,.docx" required>
                        <small class="currency-name">
                            <i class="fas fa-info-circle"></i> Supported: Images, PDF, DOC files. 
                            The file's location will be saved for easy access.
                        </small>
                    </div>
                    
                    <div class="form-group" style="background: rgba(34, 197, 94, 0.1); padding: 0.75rem; border-radius: 8px; border-left: 3px solid var(--success-color);">
                        <p style="margin: 0; color: var(--success-color); font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-shield-alt"></i> Documents are securely encrypted and stored in your local vault.
                        </p>
                        <small class="currency-name" style="color: var(--text-medium);">
                            Your files are protected with strong encryption and available offline.
                        </small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary close-modal-btn">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            + Add Document
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `);const modal=document.getElementById('add-document-modal');const form=document.getElementById('add-document-form');const closeBtn=modal.querySelector('.close-button');const cancelBtn=modal.querySelector('.close-modal-btn');const closeModal=()=>{if(modal&&modal.parentNode)modal.remove();};form.addEventListener('submit',(e)=>{e.preventDefault();this.handleAddDocument();});closeBtn.addEventListener('click',closeModal);cancelBtn.addEventListener('click',closeModal);modal.addEventListener('click',(e)=>{if(e.target===modal)closeModal();});},handleAddDocument:async function(){const modal=document.getElementById('add-document-modal');if(!modal)return;const nameInput=modal.querySelector('#doc-name');const typeSelect=modal.querySelector('#doc-type');const tagsInput=modal.querySelector('#doc-tags');const fileInput=modal.querySelector('#doc-file');const name=nameInput.value.trim();const type=typeSelect.value;const tags=tagsInput.value.trim();const file=fileInput.files[0];const copyToVault=true;if(!name||!type||!file){this.showError('Please fill in all required fields');return;}
const doc={id:`doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,tripId:this.activeTrip.id,name,type,tags,path:file.name,fileName:file.name,fileSize:file.size,fileType:file.type,webkitPath:file.webkitRelativePath||file.name,lastModified:file.lastModified,vaultStatus:copyToVault?'copying':'not-copied',addedAt:new Date().toISOString(),lastModified:new Date().toISOString(),fileHandle:null};try{if(file.type.startsWith('image/')){const thumbnail=await this.generateThumbnail(file);doc.thumbnailUrl=thumbnail;}
if('showOpenFilePicker'in window){doc.fileHandle=await this.getFileHandle(file);}
await this.saveDocument(doc);if(copyToVault){await this.copyDocumentToVault(doc.id,file);}
if(modal.parentNode)modal.remove();this.showSuccess(`Document "${name}" added successfully!`);this.refreshDocumentsList();}catch(error){console.error('Error adding document:',error);this.showError('Failed to add document: '+error.message);}},generateThumbnail:function(file){return new Promise((resolve)=>{if(!file.type.startsWith('image/')){resolve(null);return;}
const reader=new FileReader();reader.onload=(e)=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const maxSize=200;let width=img.width;let height=img.height;if(width>height){if(width>maxSize){height*=maxSize/width;width=maxSize;}}else{if(height>maxSize){width*=maxSize/height;height=maxSize;}}
canvas.width=width;canvas.height=height;ctx.drawImage(img,0,0,width,height);const dataUrl=canvas.toDataURL('image/jpeg',0.8);resolve(dataUrl);};img.src=e.target.result;};reader.readAsDataURL(file);});},getFileHandle:async function(file){try{if(file.handle){return file.handle;}
return null;}catch(e){console.warn('File handle not available:',e);return null;}},handleAddToVault:async function(documentId){const documents=this.getTripDocuments();const doc=documents.find(d=>d.id===documentId);if(!doc){this.showError('Document not found');return;}
const fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='image/*,.pdf,.doc,.docx';fileInput.addEventListener('change',async(e)=>{const file=e.target.files[0];if(!file)return;try{await this.copyDocumentToVault(documentId,file);this.showSuccess('Document secured in vault!');this.refreshDocumentsList();}catch(error){this.showError('Failed to secure document: '+error.message);}});fileInput.click();},handleReplaceInVault:async function(documentId){const documents=this.getTripDocuments();const doc=documents.find(d=>d.id===documentId);if(!doc||doc.vaultStatus!=='copied'){this.showError('Document not in vault');return;}
const fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='image/*,.pdf,.doc,.docx';fileInput.addEventListener('change',async(e)=>{const file=e.target.files[0];if(!file)return;try{await this.copyDocumentToVault(documentId,file);this.showSuccess('Vault copy replaced!');this.refreshDocumentsList();}catch(error){this.showError('Failed to replace vault copy: '+error.message);}});fileInput.click();},initDocumentVaultDB:async function(tripId){const dbName=`lipikit_vault_${tripId}`;return new Promise((resolve,reject)=>{const request=indexedDB.open(dbName,1);request.onerror=()=>reject(new Error(`Vault DB open failed: ${request.error}`));request.onsuccess=()=>resolve(request.result);request.onupgradeneeded=(event)=>{const db=event.target.result;if(!db.objectStoreNames.contains('vault')){const store=db.createObjectStore('vault',{keyPath:'documentId'});store.createIndex('tripId','tripId',{unique:false});}};});},copyDocumentToVault:async function(documentId,file){const documents=this.getTripDocuments();const doc=documents.find(d=>d.id===documentId);if(!doc){throw new Error('Document not found');}
try{const arrayBuffer=await file.arrayBuffer();const db=await this.getVaultDB(this.activeTrip.id);return new Promise((resolve,reject)=>{const tx=db.transaction(['vault'],'readwrite');const store=tx.objectStore('vault');const vaultEntry={documentId:documentId,tripId:this.activeTrip.id,fileName:file.name,fileType:file.type,fileData:arrayBuffer,copiedAt:new Date().toISOString()};const request=store.put(vaultEntry);request.onerror=()=>reject(new Error(`Vault save failed: ${request.error}`));request.onsuccess=()=>{doc.vaultStatus='copied';doc.lastVaultCopy=new Date().toISOString();this.updateDocument(doc);resolve(true);};});}catch(error){console.error('Error copying to vault:',error);throw error;}},retrieveFromVault:async function(documentId){try{const db=await this.getVaultDB(this.activeTrip.id);return new Promise((resolve,reject)=>{const tx=db.transaction(['vault'],'readonly');const store=tx.objectStore('vault');const request=store.get(documentId);request.onerror=()=>reject(new Error(`Vault retrieve failed: ${request.error}`));request.onsuccess=()=>resolve(request.result);});}catch(error){console.error('Error retrieving from vault:',error);throw error;}},getVaultDB:async function(tripId){if(!this.vaultDatabases)this.vaultDatabases={};if(!this.vaultDatabases[tripId]){this.vaultDatabases[tripId]=await this.initDocumentVaultDB(tripId);}
return this.vaultDatabases[tripId];},getDocumentStorageKey:function(){return`lipikit_documents_${this.activeTrip.id}`;},getTripDocuments:function(){try{const data=localStorage.getItem(this.getDocumentStorageKey());return data?JSON.parse(data):[];}catch(e){console.error('Failed to load documents:',e);return[];}},saveDocument:function(document){try{const documents=this.getTripDocuments();documents.push(document);localStorage.setItem(this.getDocumentStorageKey(),JSON.stringify(documents));return true;}catch(e){console.error('Failed to save document:',e);throw new Error('Storage error: '+e.message);}},updateDocument:function(updatedDoc){try{const documents=this.getTripDocuments();const index=documents.findIndex(d=>d.id===updatedDoc.id);if(index>=0){documents[index]=updatedDoc;localStorage.setItem(this.getDocumentStorageKey(),JSON.stringify(documents));return true;}
return false;}catch(e){console.error('Failed to update document:',e);throw new Error('Storage error: '+e.message);}},deleteDocument:async function(documentId){try{const documents=this.getTripDocuments();const filtered=documents.filter(d=>d.id!==documentId);localStorage.setItem(this.getDocumentStorageKey(),JSON.stringify(filtered));try{const db=await this.getVaultDB(this.activeTrip.id);const tx=db.transaction(['vault'],'readwrite');const store=tx.objectStore('vault');store.delete(documentId);}catch(e){console.warn('Document not in vault:',e);}
return true;}catch(e){console.error('Failed to delete document:',e);throw new Error('Delete error: '+e.message);}},getFilteredDocuments:function(){let documents=this.getTripDocuments();if(this.currentDocumentFilter!=='all'){documents=documents.filter(doc=>doc.type===this.currentDocumentFilter);}
if(this.currentDocumentSearch){const search=this.currentDocumentSearch.toLowerCase();documents=documents.filter(doc=>doc.name.toLowerCase().includes(search)||doc.type.toLowerCase().includes(search)||(doc.tags&&doc.tags.toLowerCase().includes(search)));}
documents.sort((a,b)=>new Date(b.addedAt)-new Date(a.addedAt));return documents;},refreshDocumentsList:function(){const listContainer=document.getElementById('documents-list');if(listContainer){listContainer.innerHTML=this.renderDocumentsList();this.bindDocumentEvents();}},bindDocumentEvents:function(){document.querySelectorAll('.view-doc-btn').forEach(btn=>{btn.removeEventListener('click',this._viewDocHandler);this._viewDocHandler=()=>this.viewDocument(btn.dataset.docId);btn.addEventListener('click',this._viewDocHandler);});document.querySelectorAll('.add-to-vault-btn').forEach(btn=>{btn.removeEventListener('click',this._addToVaultHandler);this._addToVaultHandler=()=>this.handleAddToVault(btn.dataset.docId);btn.addEventListener('click',this._addToVaultHandler);});document.querySelectorAll('.replace-vault-btn').forEach(btn=>{btn.removeEventListener('click',this._replaceVaultHandler);this._replaceVaultHandler=()=>this.handleReplaceInVault(btn.dataset.docId);btn.addEventListener('click',this._replaceVaultHandler);});document.querySelectorAll('.delete-doc-btn').forEach(btn=>{btn.removeEventListener('click',this._deleteDocHandler);this._deleteDocHandler=async()=>{const confirmed=await this.showMessage('Delete Document','Are you sure you want to delete this document? It will also be removed from vault if present.',true);if(confirmed){try{await this.deleteDocument(btn.dataset.docId);this.showSuccess('Document deleted');this.refreshDocumentsList();}catch(error){this.showError('Failed to delete: '+error.message);}}};btn.addEventListener('click',this._deleteDocHandler);});},viewDocument:async function(documentId){const documents=this.getTripDocuments();const doc=documents.find(d=>d.id===documentId);if(!doc){this.showError('Document not found');return;}
try{if(doc.vaultStatus==='copied'){const vaultEntry=await this.retrieveFromVault(documentId);if(vaultEntry&&vaultEntry.fileData){const blob=new Blob([vaultEntry.fileData],{type:vaultEntry.fileType});const url=URL.createObjectURL(blob);window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),5000);}else{this.showError('Document not found in vault');}}else{this.showUnsecuredDocumentModal(doc);}}catch(error){console.error('Error viewing document:',error);this.showError('Failed to open document: '+error.message);}},showUnsecuredDocumentModal:function(doc){const modal=document.createElement('div');modal.className='modal';modal.id='unsecured-doc-modal';modal.innerHTML=`
        <div class="modal-content" style="max-width: 600px;">
            <h2 style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                <span style="font-size: 2rem;">${this.getDocumentTypeIcon(doc.type)}</span>
                ${this.escapeHtml(doc.name)}
            </h2>
            
            <div style="background: var(--bg-light); padding: 1.5rem; border-radius: var(--border-radius-sm); margin-bottom: 1.5rem;">
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Type</strong>
                        <div>${doc.type}</div>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">File Name</strong>
                        <div style="word-break: break-all; font-family: monospace; font-size: 0.9rem;">${this.escapeHtml(doc.fileName)}</div>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">File Size</strong>
                        <div>${this.formatFileSize(doc.fileSize)}</div>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Full Path on System</strong>
                        <div style="background: white; padding: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); word-break: break-all; font-family: monospace; font-size: 0.85rem; color: #666;">
                            ${this.escapeHtml(doc.webkitPath || doc.path || 'Path not available')}
                        </div>
                        <button id="copy-path-btn" class="btn btn-sm btn-secondary" style="margin-top: 0.5rem;">
                            <i class="fas fa-copy"></i> Copy Path
                        </button>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Added</strong>
                        <div>${new Date(doc.addedAt).toLocaleString()}</div>
                    </div>
                    
                    ${doc.tags ? `<div><strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Tags</strong><div>${this.escapeHtml(doc.tags)}</div></div>` : ''}
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Status</strong>
                        <div>
                            <span style="background: #f97316; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block; font-size: 0.85rem;">
                                <i class="fas fa-exclamation-triangle"></i> Not Secured in Vault
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
                <p style="margin: 0; font-size: 0.9rem; color: #92400e;">
                    <strong><i class="fas fa-info-circle"></i> Note:</strong> This document is stored on your local device. 
                    Use the path above to locate it in your file system. To access it securely from any device, 
                    <strong>add it to the vault</strong>.
                </p>
            </div>

            <div class="form-actions">
                <button class="btn btn-secondary" onclick="document.getElementById('unsecured-doc-modal').remove()">
                    Close
                </button>
                <button class="btn btn-success" id="open-in-explorer-btn">
                    <i class="fas fa-folder-open"></i> Open Location
                </button>
                <button class="btn btn-primary" id="add-to-vault-from-modal-btn">
                    <i class="fas fa-lock"></i> Add to Vault
                </button>
            </div>
        </div>
    `;document.body.appendChild(modal);const copyPathBtn=modal.querySelector('#copy-path-btn');if(copyPathBtn){copyPathBtn.addEventListener('click',()=>{const pathText=doc.webkitPath||doc.path||'Path not available';navigator.clipboard.writeText(pathText).then(()=>{this.showSuccess('Path copied to clipboard!');}).catch(()=>{this.showError('Failed to copy path');});});}
const openBtn=modal.querySelector('#open-in-explorer-btn');if(openBtn){openBtn.addEventListener('click',()=>{this.showFileLocationInstructions(doc);});}
const addToVaultBtn=modal.querySelector('#add-to-vault-from-modal-btn');if(addToVaultBtn){addToVaultBtn.addEventListener('click',async()=>{modal.remove();await this.handleAddToVault(doc.id);});}
modal.addEventListener('click',(e)=>{if(e.target===modal)modal.remove();});},showFileLocationInstructions:function(doc){const isWindows=navigator.platform.indexOf('Win')>-1;const isMac=navigator.platform.indexOf('Mac')>-1;let instructions='';if(isWindows){instructions=`
            <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Windows Instructions:</h4>
            <ol style="margin-left: 1.5rem;">
                <li>Press <strong>Windows + E</strong> to open File Explorer</li>
                <li>Press <strong>Ctrl + L</strong> to open the address bar</li>
                <li>Paste the path you copied above and press <strong>Enter</strong></li>
                <li>The file will be highlighted in the folder</li>
            </ol>
        `;}else if(isMac){instructions=`
            <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Mac Instructions:</h4>
            <ol style="margin-left: 1.5rem;">
                <li>Open <strong>Finder</strong></li>
                <li>Press <strong>Cmd + Shift + G</strong> to open "Go to Folder"</li>
                <li>Paste the path you copied above and press <strong>Enter</strong></li>
                <li>The file will open in Finder</li>
            </ol>
        `;}else{instructions=`
            <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">File Location:</h4>
            <p>The full path to your file has been copied to your clipboard. 
            Use your system's file manager to navigate to this location.</p>
        `;}
const pathText=doc.webkitPath||doc.path||'Path not available';const helpModal=document.createElement('div');helpModal.className='modal';helpModal.id='file-location-help-modal';helpModal.innerHTML=`
        <div class="modal-content" style="max-width: 600px;">
            <h2><i class="fas fa-folder-open"></i> How to Find Your File</h2>
            
            <div style="background: #f0f9ff; border: 1px solid #bfdbfe; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <p style="margin: 0; font-size: 0.9rem;">
                    <strong>File Path:</strong><br>
                    <code style="display: block; background: white; padding: 0.5rem; margin-top: 0.5rem; border-radius: 4px; word-break: break-all; font-family: monospace;">
                        ${this.escapeHtml(pathText)}
                    </code>
                </p>
            </div>

            ${instructions}

            <div style="background: #f3e8ff; border: 1px solid #ddd6fe; padding: 1rem; border-radius: 4px; margin-top: 1.5rem;">
                <p style="margin: 0; font-size: 0.85rem; color: #6b21a8;">
                    <strong><i class="fas fa-lightbulb"></i> Tip:</strong> Consider adding this document to the Vault 
                    so you can access it securely from any device without needing to locate it manually.
                </p>
            </div>

            <div class="form-actions" style="margin-top: 1.5rem;">
                <button class="btn btn-primary" onclick="document.getElementById('file-location-help-modal').remove()">
                    Got It
                </button>
            </div>
        </div>
    `;document.body.appendChild(helpModal);helpModal.addEventListener('click',(e)=>{if(e.target===helpModal)helpModal.remove();});},showDocumentDetailsModal:function(doc){const modal=document.createElement('div');modal.className='modal';modal.id='doc-details-modal';modal.innerHTML=`
        <div class="modal-content" style="max-width: 500px;">
            <h2 style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                <span style="font-size: 2rem;">${this.getDocumentTypeIcon(doc.type)}</span>
                ${this.escapeHtml(doc.name)}
            </h2>
            
            <div style="background: var(--bg-light); padding: 1.5rem; border-radius: var(--border-radius-sm); margin-bottom: 1.5rem;">
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Type</strong>
                        <div>${doc.type}</div>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">File Name</strong>
                        <div style="word-break: break-all; font-family: monospace; font-size: 0.9rem;">${this.escapeHtml(doc.fileName)}</div>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">File Size</strong>
                        <div>${this.formatFileSize(doc.fileSize)}</div>
                    </div>
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Added</strong>
                        <div>${new Date(doc.addedAt).toLocaleString()}</div>
                    </div>
                    
                    ${doc.tags ? `<div><strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Tags</strong><div>${this.escapeHtml(doc.tags)}</div></div>` : ''}
                    
                    <div>
                        <strong style="display: block; color: var(--text-light); font-size: 0.85rem; margin-bottom: 0.25rem;">Status</strong>
                        <div>
                            ${doc.vaultStatus === 'copied' 
                                ? '<span style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block; font-size: 0.85rem;">🔒 Secured in Vault</span>'
                                : '<span style="background: #f97316; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block; font-size: 0.85rem;">⚠️ Not Secured</span>'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="document.getElementById('doc-details-modal').remove()">
                    Close
                </button>
                ${doc.vaultStatus === 'copied' ? `<button class="btn btn-success download-from-vault-btn"data-doc-id="${doc.id}">⬇️ Download from Vault</button>` : ''}
            </div>
        </div>
    `;document.body.appendChild(modal);const downloadBtn=modal.querySelector('.download-from-vault-btn');if(downloadBtn){downloadBtn.addEventListener('click',async()=>{try{const vaultEntry=await this.retrieveFromVault(doc.id);const blob=new Blob([vaultEntry.fileData],{type:vaultEntry.fileType});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=vaultEntry.fileName;a.click();URL.revokeObjectURL(url);this.showSuccess('Document downloaded');}catch(error){this.showError('Download failed: '+error.message);}});}
modal.addEventListener('click',(e)=>{if(e.target===modal)modal.remove();});},handleVaultAction:function(documentId){const documents=this.getTripDocuments();const doc=documents.find(d=>d.id===documentId);if(!doc)return;const isInVault=doc.vaultStatus==='copied';const action=isInVault?'replace':'copy';document.body.insertAdjacentHTML('beforeend',`
        <div class="modal" id="vault-action-modal">
            <div class="modal-content">
                <h2>${isInVault ? 'Replace in Vault' : 'Copy to Vault'}</h2>
                <p style="color: var(--text-light); margin-bottom: 1.5rem;">
                    ${isInVault 
                        ? 'Upload a new version to replace the existing vault copy.' 
                        : 'Copy this document to the secure vault for safe storage.'}
                </p>
                
                <form id="vault-action-form">
                    <div class="form-group">
                        <label for="vault-file">Select File *</label>
                        <input type="file" 
                               id="vault-file" 
                               accept="image/*,.pdf,.doc,.docx" 
                               required>
                        <small class="currency-name">Current: ${doc.fileName}</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="cancel-vault-action" class="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isInVault ? 'Replace in Vault' : 'Copy to Vault'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `);const modal=document.getElementById('vault-action-modal');const form=document.getElementById('vault-action-form');form.addEventListener('submit',async(e)=>{e.preventDefault();const fileInput=modal.querySelector('#vault-file');if(!fileInput||!fileInput.files[0]){this.showError('Please select a file');return;}
try{await this.copyDocumentToVault(documentId,fileInput.files[0]);modal.remove();this.showSuccess(`Document ${isInVault ? 'replaced' : 'copied'} to vault!`);this.refreshDocumentsList();}catch(error){this.showError('Vault operation failed: '+error.message);}});document.getElementById('cancel-vault-action').addEventListener('click',()=>{modal.remove();});modal.addEventListener('click',(e)=>{if(e.target===modal)modal.remove();});},handleDeleteDocument:async function(documentId){const documents=this.getTripDocuments();const doc=documents.find(d=>d.id===documentId);if(!doc)return;const confirmed=await this.showMessage('Delete Document',`Are you sure you want to delete "${doc.name}"? This will also remove it from the vault if present.`,true);if(!confirmed)return;try{await this.deleteDocument(documentId);this.showSuccess('Document deleted successfully');this.refreshDocumentsList();}catch(error){this.showError('Failed to delete document: '+error.message);}},getDocumentTypeIcon:function(type){const icons={'ID Proof':'<i class="fas fa-id-card"></i>','Passport':'<i class="fas fa-passport"></i>','Visa':'<i class="fas fa-file-contract"></i>','Flight Ticket':'<i class="fas fa-plane"></i>','Hotel Booking':'<i class="fas fa-hotel"></i>','Train Ticket':'<i class="fas fa-train"></i>','Insurance':'<i class="fas fa-shield"></i>','Vaccination Certificate':'<i class="fas fa-syringe"></i>','Receipt':'<i class="fas fa-receipt"></i>','Itinerary':'<i class="fas fa-calendar-alt"></i>','Other':'<i class="fas fa-paperclip"></i>'};return icons[type]||'<i class="fas fa-file"></i>';},formatFileSize:function(bytes){if(!bytes)return'0 B';const k=1024;const sizes=['B','KB','MB','GB'];const i=Math.floor(Math.log(bytes)/Math.log(k));return Math.round(bytes/Math.pow(k,i)*100)/100+' '+sizes[i];},truncatePath:function(path,maxLength=40){if(!path||path.length<=maxLength)return path;return'...'+path.slice(-maxLength);}};