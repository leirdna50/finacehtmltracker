import { store } from '../modules/store.js';
import { AccountManager } from '../modules/accountManager.js';
import { Analytics } from '../modules/analytics.js';
import { formatCurrency, escapeHTML } from '../utils.js';

export const WalletView = {
    render(walletId) {
        const account = AccountManager.getAccountById(walletId);
        if(!account) return;

        // 1. Update Header
        document.getElementById('wallet-title').innerText = escapeHTML(account.name);
        document.getElementById('wallet-balance').innerText = `Current Balance: ${formatCurrency(account.balance)}`;

        // 2. Render Transactions
        const txList = document.getElementById('wallet-tx-list');
        // Get transactions for this wallet, sorted new -> old
        const txs = store.data.transactions
            .filter(t => t.accountId === walletId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (txs.length === 0) {
            txList.innerHTML = '<p class="text-slate-400 italic">No transactions found.</p>';
        } else {
            txList.innerHTML = txs.map(t => {
                const isIncome = t.type === 'income';
                const color = isIncome ? 'text-emerald-600' : 'text-slate-800';
                const icon = isIncome ? 'ph-arrow-down-left' : 'ph-arrow-up-right';
                
                // Highlight Transfers specifically
                const isTransfer = t.category === 'Transfer';
                const iconBg = isTransfer ? 'bg-indigo-100 text-indigo-600' : (isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500');

                return `
                <div class="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full ${iconBg} flex items-center justify-center">
                            <i class="ph-bold ${icon}"></i>
                        </div>
                        <div>
                            <p class="font-bold text-slate-700">${escapeHTML(t.category)}</p>
                            <p class="text-xs text-slate-400">${new Date(t.date).toLocaleDateString()} &bull; ${escapeHTML(t.note)}</p>
                        </div>
                    </div>
                    <span class="font-bold ${color}">
                        ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                    </span>
                </div>
                `;
            }).join('');
        }

        // 3. Render Specific Chart
        this.renderChart(walletId);
    },

    renderChart(walletId) {
        const catData = Analytics.getCategoryData(walletId); // Use the new filter!
        const ctx = document.getElementById('chart-wallet-cat').getContext('2d');
        
        if (window.walletCatChart) window.walletCatChart.destroy();

        const hasData = catData.data.length > 0;
        const dataValues = hasData ? catData.data : [1];
        const dataLabels = hasData ? catData.labels : ['No Data'];
        const dataColors = hasData
            ? ['#F43F5E', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6']
            : ['#E2E8F0'];

        window.walletCatChart = new Chart(ctx, {
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