// faq.js - FAQ Manager
const FAQManager = {
faqs: [
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
        question: "What if I can't fetch exchange rates?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>If exchange rates can't be fetched, you can still manage conversions:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, select your trip to open the <strong>trip dashboard</strong>.</li>
                    <li>Go to the <strong>Currency Conversion panel</strong> in the dashboard.</li>
                    <li>Manually enter exchange rates in the input fields for each currency used in your trip.</li>
                    <li>The app <strong>saves your last fetched or manually entered rates</strong> locally, allowing overrides as needed.</li>
                    <li>Rates are <strong>trip-specific</strong>, so changes only affect the active trip.</li>
                </ul>
                <p>View converted expenses in the <strong>Summary tab</strong> of the trip dashboard, ensuring accurate totals even offline.</p>
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
        question: "Can I switch between multiple trips?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Easily manage multiple trips:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, view all your trips in the trip list.</li>
                    <li>Click on any <strong>trip card</strong> to make it the active trip and open its <strong>trip dashboard</strong>.</li>
                    <li>In the dashboard, manage <strong>expenses</strong>, <strong>checklists</strong>, and <strong>summaries</strong> specific to that trip.</li>
                    <li>Return to the main Trips screen by clicking the <strong>back arrow</strong> or navigating via the app menu to select another trip.</li>
                </ul>
                <p>All trip data is stored <strong>locally on your device</strong>, ensuring access even offline.</p>
            </div>
        `
    },
    {
        question: "How do I edit or delete a trip?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Manage your trips as follows:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, locate the trip in the trip list.</li>
                    <li>Note: <strong>Editing a trip</strong> is not currently supported.</li>
                    <li>To <strong>delete a trip</strong>:
                        <ul style="padding-left: var(--space-md);">
                            <li>Click the <strong style="color: var(--danger-color);">'Delete'</strong> button on the trip card.</li>
                            <li>Confirm the deletion by clicking the <strong style="color: var(--danger-color);">'Confirm'</strong> button in the prompt.</li>
                        </ul>
                    </li>
                </ul>
                <p>Deleting a trip removes it and all associated <strong>expenses</strong> and <strong>checklists</strong> from local storage. Return to the main Trips screen to manage other trips.</p>
            </div>
        `
    },
    {
        question: "How do I sync my expenses and trips?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Sync your data securely (available to a limited group with a shared PIN):</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Ensure you're <strong>online</strong> and have the required <strong>shared PIN</strong> for syncing.</li>
                    <li>From the <strong>main Trips screen</strong>, click the <strong>menu icon</strong> to open <strong>Settings</strong>.</li>
                    <li>Navigate to the <strong>Data Management</strong> section in Settings.</li>
                    <li>Click the <strong style="color: var(--primary-color);">'Sync'</strong> button to upload unsynchronized <strong>expenses</strong> and <strong>trip data</strong> securely.</li>
                    <li>Offline additions are <strong>queued</strong> and will sync when you reconnect.</li>
                </ul>
                <p>Always <strong>export your data</strong> as a backup (via Settings > Data Management > 'Export My Data') before syncing to prevent data loss. Return to the main screen or trip dashboard after syncing.</p>
            </div>
        `
    },
    {
        question: "How do I view trip summaries and reports?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Monitor your trip finances in the trip dashboard:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>From the <strong>main Trips screen</strong>, select a trip to open its <strong>trip dashboard</strong>.</li>
                    <li>Go to the <strong>Summary tab</strong> using the tab navigation.</li>
                    <li>View:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Totals by currency</strong>: Total expenses in each currency used.</li>
                            <li><strong>Category breakdowns</strong>: Expenses grouped by categories like Food or Transport.</li>
                            <li><strong>Charts</strong>: Visual representations of spending.</li>
                        </ul>
                    </li>
                    <li>Switch between:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Local currency view</strong>: Shows individual expense amounts in their original currencies.</li>
                            <li><strong>Base currency view</strong>: Shows all expenses converted to the trip's base currency.</li>
                        </ul>
                    </li>
                    <li>To export, go to <strong>Settings</strong> from the main screen, select <strong>Data Management</strong>, and click <strong style="color: var(--primary-color);">'Export My Data'</strong> to download summaries as a JSON file.</li>
                </ul>
                <p>Navigate back to the main Trips screen or other tabs to continue managing your trip.</p>
            </div>
        `
    },
    {
        question: "How do I get started with this app?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Begin your travel planning journey with these steps:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Open the app and <strong>create a user profile</strong> by entering a unique username on the initial login screen.</li>
                    <li>From the <strong>main Trips screen</strong>, click <strong style="color: var(--primary-color);">'Add New Trip'</strong> to create your first trip.</li>
                    <li>Complete the trip creation form with details like trip name, currencies, countries, and dates.</li>
                    <li>Start managing your trip:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Checklists</strong>: Go to the Checklist tab in the trip dashboard to set up and track tasks.</li>
                            <li><strong>Expenses</strong>: Go to the Expenses tab to add and monitor spending.</li>
                        </ul>
                    </li>
                </ul>
                <p>Access the trip dashboard by selecting your trip from the main Trips screen to start planning.</p>
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
                <p>Access the installed app from your phone’s home screen, opening directly to the main Trips screen.</p>
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
        question: "Can I use this app on multiple devices?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p><strong>No!</strong> To protect your privacy and data, the app currently stores data only on your device.</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>There is no built-in way to sync or transfer data to another device through the app.</li>
                    <li>To migrate data, <strong>contact support</strong> at connect@sparkyminis.com. We’ll work with you to securely sync and transfer your data to a new device.</li>
                </ul>
                <p>From the main Trips screen, export your data regularly to avoid loss when switching devices.</p>
            </div>
        `
    },
    {
        question: "What happens if I clear my browser data?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Clearing browser data will delete your app data, but you can prevent loss:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Before clearing, go to the <strong>main Trips screen</strong>, open <strong>Settings</strong> via the menu icon, and select <strong>Data Management</strong>.</li>
                    <li>Click <strong style="color: var(--primary-color);">'Export My Data'</strong> to save a JSON backup file.</li>
                    <li>Enable <strong>sync</strong> (if you have a shared PIN) to back up data to our secure servers.</li>
                    <li>Store the exported file on your own cloud or device for safekeeping.</li>
                </ul>
                <p>After clearing browser data, reinstall the app and import your backup from the main screen’s Settings to restore your trips.</p>
            </div>
        `
    },
    {
        question: "How do I update the app?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>The app updates automatically when online:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Ensure you’re connected to the internet, and the app will fetch updates on load.</li>
                    <li>If issues occur, from the <strong>main Trips screen</strong>:
                        <ul style="padding-left: var(--space-md);">
                            <li><strong>Refresh</strong> the page using your browser’s refresh button.</li>
                            <li>Clear the browser cache for this site via browser settings.</li>
                        </ul>
                    </li>
                </ul>
                <p>Return to the main Trips screen to continue using the updated app.</p>
            </div>
        `
    },
    {
        question: "Can I change my username?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>Usernames cannot be changed to maintain data consistency:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>To use a different username, go to the <strong>main Trips screen</strong>, open <strong>Settings</strong> via the menu icon, and select <strong>Data Management</strong>.</li>
                    <li>Choose <strong>Reset All App Data</strong> to clear existing data.</li>
                    <li>Create a <strong>new profile</strong> with a new username on the initial login screen.</li>
                </ul>
                <p>Export your data first from Settings to avoid losing trips, then return to the main screen to set up the new profile.</p>
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
        question: "What browsers are supported?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>The app is compatible with modern browsers:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li>Supported browsers include <strong>Chrome</strong>, <strong>Firefox</strong>, <strong>Safari</strong>, and <strong>Edge</strong>.</li>
                    <li>For the best experience, update your browser to the latest version.</li>
                </ul>
                <p>Access the app from the main Trips screen in any supported browser.</p>
            </div>
        `
    },
    {
        question: "What new features are coming soon to the app?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>We're excited to roll out exciting updates in the coming months! Based on user feedback and industry trends, here's a preview of what's in development:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li><strong>Auto Checklist Creation:</strong> AI-powered generation of personalized checklists based on your trip details, destinations, and preferences—think smart suggestions for packing, safety tips, and local essentials.</li>
                    <li><strong>Itinerary Creator:</strong> A built-in planner to craft dynamic daily schedules, integrating attractions, transport, and reservations with real-time adjustments for weather or delays.</li>
                    <li><strong>Files Manager:</strong> Secure upload and organization of trip documents like receipts, tickets, and photos, with OCR scanning for auto-expense entry and cloud backups.</li>
                </ul>
                <p>These will enhance your travel planning and tracking. Stay tuned via app notifications or our support email for release dates!</p>
            </div>
        `
    },
     {
        question: "How does the app display Google ads or Affiliate Links?",
        answer: `
            <div style="color: var(--text-dark); line-height: 1.6; font-size: 0.9rem;">
                <p>The app shows non-intrusive Google ads to support development, but only under specific conditions:</p>
                <ul style="padding-left: var(--space-md); margin-bottom: var(--space-md);">
                    <li><strong>Online Status:</strong> Ads appear only when your device is connected to the internet. If offline, no ads are displayed to keep the app fully functional without interruptions.</li>
                    <li><strong>Ad Location:</strong> Ads are placed at the bottom of the <strong>main Trips screen</strong> only, ensuring they don't interfere with core functionalities like expense tracking or checklists.</li>
                    <li><strong>Ad Type:</strong> We use Google AdSense for relevant, non-personalized ads (no cross-site tracking). Ads comply with privacy standards and NO DATA IS SENT OVER THE NETWORK.</li>
                   <li><strong>Affiliate Links:</strong> In addition to ads, we may include affiliate links within the app. These links help us earn a commission on qualifying purchases without affecting your experience.</li>
                </ul>
            </div>
        `
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