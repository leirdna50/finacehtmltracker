import { AccountManager } from '../modules/accountManager.js';
import { Analytics } from '../modules/analytics.js';
import { store } from '../modules/store.js';
import { formatCurrency } from '../utils.js';
import { escapeHTML } from '../utils.js';
import { ModalView } from './modalView.js';
import { app } from '../app.js';

export const DashboardView = {
    currentCashFlowSpacing: 7,

    render() {
        this.renderAccounts();
        this.renderCharts();
    },

    renderAccounts() {
        const container = document.getElementById('accounts-grid');
        const accounts = AccountManager.getAccounts();
        
        container.innerHTML = accounts.map(acc => {
            const balances = AccountManager.getAvailableBalance(acc.id);
            // Ghost Balance Logic
            const ghostHtml = balances.pending > 0 
                ? `<div class="text-xs text-slate-500 mt-1 flex items-center gap-1"><i class="ph-bold ph-ghost"></i> Avail: ${formatCurrency(balances.available)}</div>`
                : `<div class="text-xs text-slate-400 mt-1">No pending bills (7d)</div>`;

            // Color classes
            const colorMap = {
                emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                rose: 'bg-rose-50 border-rose-200 text-rose-700',
                indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                amber: 'bg-amber-50 border-amber-200 text-amber-700'
            };
            const theme = colorMap[acc.color] || colorMap.indigo;

            return `
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative group transition-all hover:shadow-md cursor-pointer wallet-card" data-wallet-id="${acc.id}" draggable="true">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2 rounded-lg ${theme}">
                            <i class="ph-fill ph-wallet text-xl"></i>
                        </div>
                        
                        <div class="relative">
                            <button class="menu-trigger p-1 text-slate-400 hover:text-slate-600 rounded">
                                <i class="ph-bold ph-dots-three text-xl"></i>
                            </button>
                            <div class="menu-dropdown">
                                <button class="menu-item menu-rename" data-account-id="${acc.id}"><i class="ph ph-pencil"></i> Rename</button>
                                <button class="menu-item menu-edit-balance" data-account-id="${acc.id}"><i class="ph ph-pencil-simple"></i> Adjust Balance</button>
                                <button class="menu-item menu-quick-add" data-account-id="${acc.id}"><i class="ph ph-plus"></i> Quick Add</button>
                                <button class="menu-item menu-delete text-rose-600" data-account-id="${acc.id}"><i class="ph ph-trash"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                    
                    <h4 class="font-bold text-slate-700 mb-1">${escapeHTML(acc.name)}</h4>
                    <p class="text-2xl font-bold text-slate-800">${formatCurrency(acc.balance)}</p>
                    ${ghostHtml}
                </div>
            `;
        }).join('');

        // Drag and drop functionality
        let draggedElement = null;

        container.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.wallet-card');
            if (card) {
                draggedElement = card;
                card.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.style.opacity = '1';
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const card = e.target.closest('.wallet-card');
            if (card && card !== draggedElement) {
                const rect = card.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    card.parentNode.insertBefore(draggedElement, card);
                } else {
                    card.parentNode.insertBefore(draggedElement, card.nextSibling);
                }
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement) {
                // Get new order of wallet IDs
                const newOrder = Array.from(container.querySelectorAll('.wallet-card')).map(card => card.dataset.walletId);
                store.reorderAccounts(newOrder);
            }
        });

        // Event delegation for menu buttons
        container.addEventListener('click', (e) => {
            const accountId = e.target.closest('[data-account-id]')?.dataset.accountId;
            
            if (e.target.closest('.menu-rename')) {
                ModalView.openRenameWallet(accountId);
            } else if (e.target.closest('.menu-edit-balance')) {
                ModalView.openEditBalance(accountId);
            } else if (e.target.closest('.menu-quick-add')) {
                ModalView.openTransactionModal(accountId);
            } else if (e.target.closest('.menu-delete')) {
                if (confirm('Delete this wallet?')) {
                    store.deleteAccount(accountId);
                    app.refresh();
                }
            }
        });

        // Event delegation for wallet card clicks
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.wallet-card');
            const menu = e.target.closest('.menu-trigger, .menu-dropdown, .menu-item');
            
            // Only open wallet if clicking the card itself, not the menu
            if (card && !menu) {
                app.viewWallet(card.dataset.walletId);
            }
        });
    },

    renderCharts() {
        const flowData = Analytics.getCashFlowData(this.currentCashFlowSpacing);
        const catData = Analytics.getCategoryData();

        const ctx1 = document.getElementById('chart-cashflow').getContext('2d');
        if (window.cashFlowChart) window.cashFlowChart.destroy();
        
        window.cashFlowChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: flowData.labels,
                datasets: [
                    { label: 'In', data: flowData.income, backgroundColor: '#10B981', borderRadius: 4 },
                    { label: 'Out', data: flowData.expense, backgroundColor: '#F43F5E', borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        const ctx2 = document.getElementById('chart-categories').getContext('2d');
        if (window.catChart) window.catChart.destroy();

        const hasData = catData.data.length > 0;
        const dataValues = hasData ? catData.data : [1]; 
        const dataLabels = hasData ? catData.labels : ['No Data'];
        const dataColors = hasData 
            ? ['#F43F5E', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#EC4899'] 
            : ['#E2E8F0']; 

        window.catChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: dataLabels,
                datasets: [{ 
                    data: dataValues, 
                    backgroundColor: dataColors, 
                    borderWidth: 0 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
    },

    setCashFlowSpacing(days) {
        this.currentCashFlowSpacing = days;
        
        // Update button states
        document.querySelectorAll('.cashflow-spacing-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.spacing) === days) {
                btn.classList.add('active');
            }
        });
        
        // Re-render the chart
        this.renderCharts();
    }
};