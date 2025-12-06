import { AccountManager } from './modules/accountManager.js';
import { DashboardView } from './views/dashboardView.js';
import { CalendarView } from './views/calendarView.js';
import { ForecastView } from './views/forecastView.js';
import { HistoryView } from './views/historyView.js';
import { ModalView } from './views/modalView.js';
import { WalletView } from './views/walletview.js';
import { formatCurrency } from './utils.js';
import { store } from './modules/store.js';

export const app = {
    currentTab: 'dashboard',

    init() {
        this.initializeSettings();
        this.loadTabs(); // Load the saved tab
    },

    refresh() {
        // Update Net Worth Sidebar
        const netWorth = AccountManager.getTotalNetWorth();
        document.getElementById('global-net-worth').innerText = formatCurrency(netWorth);

        // Render Current Tab
        if (this.currentTab === 'dashboard') DashboardView.render();
        if (this.currentTab === 'calendar') CalendarView.render();
        if (this.currentTab === 'forecast') {
            ForecastView.render();
            HistoryView.render();
        }
        if (this.currentTab === 'wallet') {
            // For wallet view, we'll call smartRefresh instead
            return;
        }
    },

    smartRefresh() {
        // Update Net Worth Sidebar
        const netWorth = AccountManager.getTotalNetWorth();
        document.getElementById('global-net-worth').innerText = formatCurrency(netWorth);

        // Only refresh the current view, not the whole page
        if (this.currentTab === 'dashboard') {
            DashboardView.render();
        } else if (this.currentTab === 'calendar') {
            CalendarView.render();
        } else if (this.currentTab === 'forecast') {
            ForecastView.render();
            HistoryView.render();
        } else if (this.currentTab === 'wallet') {
            // For wallet view, just re-render the wallet without changing tabs
            const walletView = document.getElementById('view-wallet');
            if (!walletView.classList.contains('hidden')) {
                // Extract wallet ID from the header or store it
                const walletId = this.currentWalletId;
                if (walletId) {
                    WalletView.render(walletId);
                }
            }
        }
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // UI Updates
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${tabName}`).classList.remove('hidden');
        
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${tabName}`).classList.add('active');
        
        document.getElementById('page-title').innerText = tabName.charAt(0).toUpperCase() + tabName.slice(1);

        this.refresh();
        this.saveTabs(); // Save the current tab
    },

    viewWallet(id) {
        this.currentTab = 'wallet';
        this.currentWalletId = id;
        
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById('view-wallet').classList.remove('hidden');
        
        document.getElementById('page-title').innerText = 'Wallet Details';
        
        WalletView.render(id);
        this.saveTabs(); // Save the wallet tab and ID
    },

    saveTabs() {
        localStorage.setItem('currentTab', this.currentTab);
        if (this.currentWalletId) {
            localStorage.setItem('currentWalletId', this.currentWalletId);
        }
        console.log('Saved tab:', this.currentTab, 'to localStorage');
    },

    loadTabs() {
        const savedTab = localStorage.getItem('currentTab');
        const savedWalletId = localStorage.getItem('currentWalletId');
        
        if (savedTab === 'wallet' && savedWalletId) {
            this.viewWallet(savedWalletId);
        } else if (savedTab) {
            this.switchTab(savedTab);
        } else {
            // Default to dashboard if nothing saved
            this.switchTab('dashboard');
        }
    },

    trackTabInteraction(tabName) {
        // Always update and save the current tab when user interacts with a view
        this.currentTab = tabName;
        // Update nav UI to reflect current tab
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${tabName}`).classList.add('active');
        this.saveTabs();
    },

    // Expose for global onclicks
    deleteAccount(id) {
        if(confirm('Delete this wallet?')) {
            store.deleteAccount(id); // Actually delete it
            this.refresh();
        }
    },

    togglePrivacyMode() {
        store.data.settings.privacyMode = !store.data.settings.privacyMode;
        store.save();
        this.refresh();
        
        // Update button appearance
        const btn = document.getElementById('btn-toggle-privacy');
        if (store.data.settings.privacyMode) {
            btn.classList.add('bg-indigo-100', 'text-indigo-600');
        } else {
            btn.classList.remove('bg-indigo-100', 'text-indigo-600');
        }
    },

    toggleDarkMode() {
        store.data.settings.darkMode = !store.data.settings.darkMode;
        store.save();
        
        // Apply dark mode to document
        if (store.data.settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Update button appearance
        const btn = document.getElementById('btn-toggle-dark');
        if (store.data.settings.darkMode) {
            btn.classList.add('bg-indigo-100', 'text-indigo-600');
        } else {
            btn.classList.remove('bg-indigo-100', 'text-indigo-600');
        }
    },

    initializeSettings() {
        // Apply dark mode if enabled
        if (store.data.settings?.darkMode) {
            document.documentElement.classList.add('dark');
            document.getElementById('btn-toggle-dark').classList.add('bg-indigo-100', 'text-indigo-600');
        }
        
        // Apply privacy mode button state
        if (store.data.settings?.privacyMode) {
            document.getElementById('btn-toggle-privacy').classList.add('bg-indigo-100', 'text-indigo-600');
        }
    }
};



// Start App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    
    // Track interactions in each view section to remember the tab user is on
    const dashboardSection = document.getElementById('view-dashboard');
    const calendarSection = document.getElementById('view-calendar');
    const forecastSection = document.getElementById('view-forecast');
    const walletSection = document.getElementById('view-wallet');
    
    if (dashboardSection) dashboardSection.addEventListener('click', () => app.trackTabInteraction('dashboard'), true);
    if (calendarSection) calendarSection.addEventListener('click', () => app.trackTabInteraction('calendar'), true);
    if (forecastSection) forecastSection.addEventListener('click', () => app.trackTabInteraction('forecast'), true);
    if (walletSection) walletSection.addEventListener('click', () => app.trackTabInteraction('wallet'), true);
    
    // Event Listeners
    document.getElementById('nav-dashboard').addEventListener('click', () => app.switchTab('dashboard'));
    document.getElementById('nav-calendar').addEventListener('click', () => app.switchTab('calendar'));
    document.getElementById('nav-forecast').addEventListener('click', () => app.switchTab('forecast'));
    document.getElementById('btn-add-transaction').addEventListener('click', () => ModalView.openTransactionModal());
    document.getElementById('btn-wallet-add-tx').addEventListener('click', () => {
        const walletId = app.currentWalletId;
        if (walletId) {
            ModalView.openTransactionModal(walletId);
        } else {
            ModalView.openTransactionModal();
        }
    });
    document.getElementById('btn-new-wallet').addEventListener('click', () => ModalView.openAccountModal());
    document.getElementById('btn-prev-month').addEventListener('click', () => CalendarView.changeMonth(-1));
    document.getElementById('btn-next-month').addEventListener('click', () => CalendarView.changeMonth(1));
    document.getElementById('btn-close-cal').addEventListener('click', () => CalendarView.clearSelection());
    document.getElementById('forecast-range').addEventListener('change', () => ForecastView.render());
    document.getElementById('forecast-spacing').addEventListener('input', () => ForecastView.render());
    document.getElementById('toggle-avg-spend').addEventListener('change', () => ForecastView.render());
    document.getElementById('history-range').addEventListener('change', (e) => {
        const customPickers = document.getElementById('custom-date-pickers');
        if (e.target.value === 'custom') {
            customPickers.classList.remove('hidden');
        } else {
            customPickers.classList.add('hidden');
        }
        HistoryView.render();
    });
    document.getElementById('history-spacing').addEventListener('input', () => HistoryView.render());
    document.getElementById('history-start-date').addEventListener('change', () => HistoryView.render());
    document.getElementById('history-end-date').addEventListener('change', () => HistoryView.render());
    document.getElementById('btn-back-to-dashboard').addEventListener('click', () => app.switchTab('dashboard'));
    document.getElementById('btn-toggle-privacy').addEventListener('click', () => app.togglePrivacyMode());
    document.getElementById('btn-toggle-dark').addEventListener('click', () => app.toggleDarkMode());
    
    // Cash flow spacing buttons
    document.querySelectorAll('.cashflow-spacing-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const spacing = parseInt(e.target.dataset.spacing);
            DashboardView.setCashFlowSpacing(spacing);
        });
    });
});

// Make app global for HTML onclicks
window.app = app;