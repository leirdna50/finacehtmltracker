import { AccountManager } from './modules/accountManager.js';
import { DashboardView } from './views/dashboardView.js';
import { CalendarView } from './views/calendarView.js';
import { ForecastView } from './views/forecastView.js';
import { ModalView } from './views/modalView.js';
import { WalletView } from './views/walletview.js';
import { formatCurrency } from './utils.js';
import { store } from './modules/store.js';

export const app = {
    currentTab: 'dashboard',

    init() {
        this.refresh();
    },

    refresh() {
        // Update Net Worth Sidebar
        const netWorth = AccountManager.getTotalNetWorth();
        document.getElementById('global-net-worth').innerText = formatCurrency(netWorth);

        // Render Current Tab
        if (this.currentTab === 'dashboard') DashboardView.render();
        if (this.currentTab === 'calendar') CalendarView.render();
        if (this.currentTab === 'forecast') ForecastView.render();
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
    },

    viewWallet(id) {
        this.currentTab = 'wallet';
        
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById('view-wallet').classList.remove('hidden');
        
        // Hide nav items and title updates (wallet view has custom header)
        document.getElementById('page-title').innerText = 'Wallet Details';
        
        // Render the specific wallet view
        WalletView.render(id);
    },

    // Expose for global onclicks
    deleteAccount(id) {
    if(confirm('Delete this wallet?')) {
        store.deleteAccount(id); // Actually delete it
        this.refresh();
    }
}
};



// Start App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Make app global for HTML onclicks
window.app = app;

// Event Listeners
document.getElementById('nav-dashboard').addEventListener('click', () => app.switchTab('dashboard'));
document.getElementById('nav-calendar').addEventListener('click', () => app.switchTab('calendar'));
document.getElementById('nav-forecast').addEventListener('click', () => app.switchTab('forecast'));
document.getElementById('btn-add-transaction').addEventListener('click', () => ModalView.openTransactionModal());
document.getElementById('btn-new-wallet').addEventListener('click', () => ModalView.openAccountModal());
document.getElementById('btn-prev-month').addEventListener('click', () => CalendarView.changeMonth(-1));
document.getElementById('btn-next-month').addEventListener('click', () => CalendarView.changeMonth(1));
document.getElementById('btn-close-cal').addEventListener('click', () => CalendarView.clearSelection());
document.getElementById('forecast-range').addEventListener('change', () => ForecastView.render());
document.getElementById('toggle-avg-spend').addEventListener('change', () => ForecastView.render());
document.getElementById('btn-back-to-dashboard').addEventListener('click', () => app.switchTab('dashboard'));