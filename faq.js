// faq.js - Enhanced FAQ Manager with Collapsible Section
const FAQManager = {
faqs: [
    // Pricing and Plans FAQs
    {
        question: "What's the difference between Free and Pro plans?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>LipiKit offers two distinct plans to suit different travel needs:</p>
                <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin: 1rem 0;">
                    <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 1px solid var(--border-color);">
                        <h3 style="color: var(--primary-color); margin-top: 0; margin-bottom: 0.75rem;">Free Plan</h3>
                        <ul style="padding-left: 1.25rem; margin: 0;">
                            <li>Create up to 3 trips</li>
                            <li>Basic expense tracking</li>
                            <li>Standard checklists</li>
                            <li>Community support</li>
                            <li>Access to basic features</li>
                        </ul>
                    </div>
                    <div style="background: #f0fdfa; border-radius: 8px; padding: 1.25rem; border: 1px solid var(--primary-color);">
                        <h3 style="color: var(--primary-color); margin-top: 0; margin-bottom: 0.75rem;">Pro Plan <span style="background: var(--primary-color); color: white; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 12px; margin-left: 0.5rem;">RECOMMENDED</span></h3>
                        <ul style="padding-left: 1.25rem; margin: 0;">
                            <li><strong>Unlimited trips</strong> - Plan as many adventures as you want</li>
                            <li><strong>Advanced expense tracking</strong> with custom categories</li>
                            <li><strong>Premium checklists</strong> with smart suggestions</li>
                            <li><strong>Priority support</strong> - Get help when you need it</li>
                            <li><strong>Early access</strong> to new features</li>
                            <li><strong>Offline access</strong> to all your trip data</li>
                        </ul>
                    </div>
                </div>
                <p style="margin-top: 1rem;">Upgrade to Pro to unlock the full potential of LipiKit and support our mission to create free, ad-free travel tools!</p>
            </div>
        `
    },
    {
        question: "How many trips can I create with the Free plan?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>With the Free plan, you can create up to <strong>3 trips</strong> in total. This limit applies to both active and archived trips combined.</p>
                <p>If you need to create more trips, you'll need to either:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li><strong>Delete existing trips</strong> you no longer need (you can export them first if you want to keep the data)</li>
                    <li><strong>Upgrade to Pro</strong> for unlimited trips and additional premium features</li>
                </ul>
                <p>To upgrade, simply click on the <strong>'Get Pro'</strong> button in the app or visit our support page for more information.</p>
            </div>
        `
    },
    {
        question: "What payment methods do you accept for Pro?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>We accept various payment methods for your convenience:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li><strong>Credit/Debit Cards</strong> (Visa, Mastercard, American Express, etc.)</li>
                    <li><strong>UPI</strong> (For users in India)</li>
                    <li><strong>Net Banking</strong> (Available in supported countries)</li>
                    <li><strong>Digital Wallets</strong> (Google Pay, PhonePe, etc. where available)</li>
                </ul>
                <p>All payments are securely processed through our payment partner, Razorpay, ensuring your financial information is protected with bank-level security.</p>
                <p>If you prefer alternative payment methods or need assistance, please contact us at <a href="mailto:connect@sparkyminis.com" style="color: var(--primary-color); text-decoration: none;">connect@sparkyminis.com</a>.</p>
            </div>
        `
    },
    {
        question: "How do I upgrade to the Pro plan?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Upgrading to LipiKit Pro is quick and easy:</p>
                <ol style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Click on the <strong>'Get Pro'</strong> button in the app (usually found in the settings or main menu)</li>
                    <li>Choose your preferred payment method</li>
                    <li>Complete the secure checkout process</li>
                    <li>Your account will be upgraded immediately after successful payment</li>
                </ol>
                <p>Alternatively, you can upgrade directly through our website or by contacting our support team at <a href="mailto:connect@sparkyminis.com" style="color: var(--primary-color); text-decoration: none;">connect@sparkyminis.com</a>.</p>
                <div style="background: #f0fdf4; border-left: 4px solid var(--success-color); padding: 0.75rem; margin-top: 1rem; border-radius: 0 4px 4px 0;">
                    <p style="margin: 0;">💡 <strong>Pro Tip:</strong> Check for any ongoing promotions or discounts before upgrading!</p>
                </div>
            </div>
        `
    },
    {
        question: "What happens to my data if I don't renew my Pro subscription?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>If your Pro subscription expires:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>You'll automatically revert to the Free plan</li>
                    <li>All your existing trips and data will remain accessible</li>
                    <li>You won't be able to create new trips beyond the Free plan limit (3 trips total)</li>
                    <li>Premium features will be disabled</li>
                    <li>You'll still be able to view and export your existing trip data</li>
                </ul>
                <p>If you choose to renew your Pro subscription in the future, all your premium features will be immediately restored.</p>
                <p>We recommend exporting your trip data regularly as a backup, regardless of your subscription status.</p>
            </div>
        `
    },
    {
        question: "How can I support LipiKit without upgrading to Pro?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>We appreciate your support in any form! Here are ways you can help LipiKit grow:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li><strong>Spread the word</strong> - Tell your friends and fellow travelers about LipiKit</li>
                    <li><strong>Leave a review</strong> - Share your experience in the app store</li>
                    <li><strong>Follow us on social media</strong> - Stay updated and help us reach more travelers</li>
                    <li><strong>Provide feedback</strong> - Your suggestions help us improve the app</li>
                    <li><strong>One-time donation</strong> - Support our development with a contribution of any amount</li>
                </ul>
                <p>Every bit of support helps us keep LipiKit free and ad-free for everyone. Thank you for being part of our community!</p>
                <div style="margin-top: 1rem; text-align: center;">
                    <a href="https://razorpay.me/@dhanesh123" class="btn btn-primary" target="_blank" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.5rem; border-radius: 50px; background: var(--primary-color); color: white; text-decoration: none; font-weight: 500;">
                        <i class="fas fa-heart" style="color: #ff6b6b;"></i> Make a Donation
                    </a>
                </div>
            </div>
        `
    },
    // App-Specific FAQs
    {
        question: "How do I create a new trip?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Start planning your adventure by following these steps:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, locate and click the <strong style="color: var(--primary-color);">'Add New Trip'</strong> button, typically found at the top of the trip list.</li>
                    <li>Complete the <strong>two-step trip creation process</strong>:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Step 1: Basic Info</strong> - Enter details like the trip name (e.g., "Tokyo Adventure 2025"), select currencies you'll use, choose countries you'll visit, and set start and end dates. Click <strong style="color: var(--primary-color);">'Next'</strong> to proceed.</li>
                            <li><strong>Step 2: Questions</strong> - Answer optional questions to customize your trip setup, tailoring checklists and itineraries to your preferences. Click <strong style="color: var(--primary-color);">'Complete Trip Setup'</strong> to save and view your trip dashboard.</li>
                        </ul>
                    </li>
                </ul>
                <p>Once created, your trip appears in the Trips list, where you can select it to access the dashboard for managing expenses, checklists, and more.</p>
            </div>
        `
    },
    {
        question: "What are the trip creation questions for?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>The questions help tailor your trip experience by personalizing your planning tools. They filter relevant <strong>checklists</strong>, <strong>attractions</strong>, and <strong>itineraries</strong> based on your responses (e.g., travel style, interests).</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>During <strong>trip creation</strong>, after entering basic info, you'll see these questions in Step 2 of the creation form.</li>
                    <li>You can <strong>skip</strong> them by clicking <strong style="color: var(--primary-color);">'Complete Trip Setup'</strong>, but this may limit personalized recommendations and features.</li>
                    <li>To revisit or update answers, go to the <strong>trip dashboard</strong> (select your trip from the Trips screen), then navigate to the <strong>Settings</strong> section to modify preferences.</li>
                </ul>
                <p>Skipping questions reduces tailored suggestions, such as curated packing lists or activity recommendations.</p>
            </div>
        `
    },
    {
        question: "How do I add an expense to a trip?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Track your spending by adding expenses to your active trip:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, click on a trip in the list to make it active and open its <strong>trip dashboard</strong>.</li>
                    <li>Navigate to the <strong>Expenses tab</strong> using the tab navigation in the dashboard.</li>
                    <li>Click the <strong style="color: var(--primary-color);">'Add Expense'</strong> button.</li>
                    <li>Fill in details:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Amount</strong>: Enter the expense amount.</li>
                            <li><strong>Currency</strong>: Select the currency used.</li>
                            <li><strong>Category</strong>: Choose from options like Food, Transport, or others.</li>
                            <li><strong>Payment Mode</strong>: Select Cash, Credit Card, etc.</li>
                            <li><strong>Date</strong>: Pick the expense date.</li>
                        </ul>
                    </li>
                    <li>Click <strong style="color: var(--primary-color);">'Save'</strong> to record the expense.</li>
                </ul>
                <p>The app supports multiple currencies, automatically converting them to your trip's base currency for summaries, which you can view in the dashboard's Summary tab.</p>
            </div>
        `
    },
    {
        question: "How does currency conversion work?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Manage expenses across multiple currencies with ease:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>During <strong>trip creation</strong> (from the main Trips screen, click 'Add New Trip'), set a <strong>base currency</strong> in Step 1 of the form.</li>
                    <li>In the <strong>trip dashboard</strong> (accessible by selecting your trip), go to the <strong>Currency Conversion panel</strong>:
                        <ul style="padding-left: var(--space-md);">
                            <li>If online, click <strong style="color: var(--primary-color);">'Fetch Rates'</strong> to retrieve real-time exchange rates.</li>
                            <li>If offline, manually enter rates in the input fields provided.</li>
                        </ul>
                    </li>
                    <li>Expenses entered in other currencies are automatically converted to the base currency for <strong>totals</strong> and <strong>reports</strong>.</li>
                    <li>In the <strong>Summary tab</strong> of the trip dashboard, switch between:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Local currency view</strong>: Shows individual expense amounts in their original currencies.</li>
                            <li><strong>Base currency view</strong>: Shows all expenses converted to the base currency.</li>
                        </ul>
                    </li>
                </ul>
                <p>Access the Summary tab from the trip dashboard to view converted totals and detailed reports.</p>
            </div>
        `
    },
    {
        question: "How do I manage checklists for my trip?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Stay organized with trip-specific checklists:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, select your trip to open the <strong>trip dashboard</strong>.</li>
                    <li>Navigate to the <strong>Checklist tab</strong> using the tab navigation.</li>
                    <li>For first-time setup:
                        <ul style="padding-left: var(--space-md);">
                            <li>Go to the <strong>Customize checklist page</strong> within the Checklist tab.</li>
                            <li>Add relevant checklists (e.g., Packing, Documents) to make them available in the View tab.</li>
                        </ul>
                    </li>
                    <li>In the <strong>View tab</strong> of the Checklist section:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Items are auto-generated</strong> based on your trip creation answers (from Step 2 of trip setup).</li>
                            <li><strong>Mark items as done</strong> by checking them off.</li>
                            <li>Click <strong style="color: var(--primary-color);">'Resources'</strong> next to each item for additional help or links (if available).</li>
                        </ul>
                    </li>
                </ul>
                <p>Switch to the Customize page anytime from the Checklist tab to add or edit items.</p>
            </div>
        `
    },
    {
        question: "Is this app free to use?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p><strong>Yes!</strong> The app is completely free with no hidden charges, subscriptions, or premium features. All functionality is accessible to everyone.</p>
            </div>
        `
    },
    {
        question: "Does the app work offline?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p><strong>Absolutely!</strong> As a Progressive Web App (PWA), the app works fully offline after your first visit.</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Use all features (trip creation, expense tracking, checklists) without an internet connection.</li>
                    <li>No data leaves your device when online, ensuring privacy.</li>
                </ul>
                <p>Access the main Trips screen or any trip dashboard to use the app offline seamlessly.</p>
            </div>
        `
    },
    {
        question: "How is my data protected?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Your data privacy is a priority:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>All data is stored <strong>locally on your device</strong> first.</li>
                    <li>We collect only <strong>anonymous usage statistics</strong> to improve the app.</li>
                    <li>If you have a <strong>shared PIN</strong> for syncing (for limited users), data is transmitted securely.</li>
                    <li>From the <strong>main Trips screen</strong>, go to <strong>Settings > Data Management</strong> to:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Export</strong> all your data as a JSON file.</li>
                            <li><strong>Delete</strong> all local data if needed.</li>
                        </ul>
                    </li>
                </ul>
                <p>Navigate to Settings from the main screen to manage your data securely.</p>
            </div>
        `
    },
    {
        question: "Can I install this app on my phone?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p><strong>Yes!</strong> Install the app for a native-like experience:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Open the app in your mobile browser (e.g., Chrome, Safari).</li>
                    <li>Use the browser's <strong>'Add to Home Screen'</strong> or <strong>'Install App'</strong> option (found in the browser menu).</li>
                    <li>The app will install as a Progressive Web App (PWA), working offline and providing a seamless experience.</li>
                </ul>
                <p>Access the installed app from your phone's home screen, opening directly to the main Trips screen.</p>
            </div>
        `
    },
    {
        question: "How do I backup my data?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Keep your data safe with backups:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, click the <strong>menu icon</strong> to open <strong>Settings</strong>.</li>
                    <li>Go to the <strong>Data Management</strong> section.</li>
                    <li>Click <strong style="color: var(--primary-color);">'Export My Data'</strong> to download a JSON backup file.</li>
                    <li>Optionally, enable <strong>sync</strong> (if you have a shared PIN) to back up data to our secure servers when online.</li>
                </ul>
                <p>Store the exported file securely and return to the main screen to continue using the app.</p>
            </div>
        `
    },
    {
        question: "Who can I contact for support?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>For help, reach out to our support team:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Email <strong style="color: var(--primary-color);">connect@sparkyminis.com</strong> for support, feature requests, or bug reports.</li>
                    <li>Expect a response within <strong>24-48 hours</strong>.</li>
                </ul>
                <p>From the main Trips screen, continue using the app while awaiting a response.</p>
            </div>
        `
    },
    {
        question: "What new features are coming soon?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>We're excited to roll out exciting updates! Here's a preview:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li><strong>Auto Checklist Creation:</strong> AI-powered generation of personalized checklists based on your trip details and preferences.</li>
                    <li><strong>Itinerary Creator:</strong> A built-in planner to craft dynamic daily schedules with real-time adjustments.</li>
                    <li><strong>Files Manager:</strong> Secure upload and organization of trip documents with OCR scanning for auto-expense entry.</li>
                </ul>
                <p>Stay tuned via app notifications or our support email for release dates!</p>
            </div>
        `
    }
],
    
    init: function() {
        this.renderFAQs();
        this.bindEvents();
        this.initCollapsible();
    },
    
    initCollapsible: function() {
        const faqSection = document.querySelector('.faq-section');
        if (!faqSection) return;
        
        // Start collapsed by default
        faqSection.classList.add('collapsed');
        
        // Add click handler to header
        const header = faqSection.querySelector('h2');
        if (header) {
            header.addEventListener('click', () => {
                faqSection.classList.toggle('collapsed');
            });
        }
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
        
        const resultHeader = document.createElement('div');
        resultHeader.style.cssText = 'margin-bottom: 1rem; padding: 0.75rem; background: #f0f9ff; border-radius: 6px; font-size: 0.875rem;';
        resultHeader.innerHTML = `
            <span style="color: var(--primary-color); font-weight: 500;">Search Results:</span> 
            Found ${faqs.length} FAQ${faqs.length !== 1 ? 's' : ''} matching "${searchTerm}"
            <button onclick="FAQManager.clearSearch()" style="float: right; background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 0.75rem;">Clear Search</button>
        `;
        faqContainer.parentNode.insertBefore(resultHeader, faqContainer);
        
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
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\                    <li>From the <strong>main Trips screen</strong>, go to <strong');
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