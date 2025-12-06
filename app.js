import { AccountManager } from './modules/accountManager.js';
import { DashboardView } from './views/dashboardView.js';
import { CalendarView } from './views/calendarView.js';
import { ForecastView } from './views/forecastView.js';
import { ModalView } from './views/modalView.js';
import { formatCurrency } from './utils.js';

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

    // Expose for global onclicks
    deleteAccount(id) {
        if(confirm('Delete this wallet?')) {
            // In real app, call store.deleteAccount(id)
            alert('Deleted ' + id);
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