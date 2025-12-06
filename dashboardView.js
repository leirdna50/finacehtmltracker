import { AccountManager } from '../modules/accountManager.js';
import { Analytics } from '../modules/analytics.js';
import { store } from '../modules/store.js';
import { formatCurrency } from '../utils.js';

export const DashboardView = {
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
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative group transition-all hover:shadow-md">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2 rounded-lg ${theme}">
                            <i class="ph-fill ph-wallet text-xl"></i>
                        </div>
                        
                        <div class="relative">
                            <button class="menu-trigger p-1 text-slate-400 hover:text-slate-600 rounded">
                                <i class="ph-bold ph-dots-three text-xl"></i>
                            </button>
                            <div class="menu-dropdown">
                                <button onclick="modalView.openEditBalance('${acc.id}')" class="menu-item"><i class="ph ph-pencil-simple"></i> Adjust Balance</button>
                                <button onclick="modalView.openTransactionModal('${acc.id}')" class="menu-item"><i class="ph ph-plus"></i> Quick Add</button>
                                <button onclick="app.deleteAccount('${acc.id}')" class="menu-item text-rose-600"><i class="ph ph-trash"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                    
                    <h4 class="font-bold text-slate-700 mb-1">${acc.name}</h4>
                    <p class="text-2xl font-bold text-slate-800">${formatCurrency(acc.balance)}</p>
                    ${ghostHtml}
                </div>
            `;
        }).join('');
    },

    renderCharts() {
        const flowData = Analytics.getCashFlowData();
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
    }
};