import { store } from '../modules/store.js';
import { AccountManager } from '../modules/accountManager.js';
import { Analytics } from '../modules/analytics.js';
import { formatCurrency, escapeHTML } from '../utils.js';
import { ModalView } from './modalView.js';
import { TransactionEngine } from '../modules/transactionEngine.js';
import { app } from '../app.js';

export const WalletView = {
    render(walletId) {
        const account = AccountManager.getAccountById(walletId);
        if(!account) return;

        // 1. Update Header
        document.getElementById('wallet-title').innerText = escapeHTML(account.name);
        document.getElementById('wallet-balance').innerText = `Current Balance: ${formatCurrency(account.balance)}`;

        // 2. Render Transactions organized by date
        const txList = document.getElementById('wallet-tx-list');
        // Get transactions for this wallet, sorted new -> old
        const txs = store.data.transactions
            .filter(t => t.accountId === walletId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (txs.length === 0) {
            txList.innerHTML = '<p class="text-slate-400 italic text-sm">No transactions found.</p>';
        } else {
            // Group transactions by date
            const grouped = {};
            txs.forEach(t => {
                const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(t);
            });

            let html = '';
            Object.entries(grouped).forEach(([date, dayTxs]) => {
                // Date header
                html += `<div class="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">${date}</div>`;
                
                // Transactions for this date
                dayTxs.forEach(t => {
                    const isIncome = t.type === 'income';
                    const amountColor = isIncome ? 'text-emerald-600' : 'text-rose-600';
                    const icon = isIncome ? 'ph-arrow-up' : 'ph-arrow-down';
                    const isTransfer = t.category === 'Transfer';
                    const iconBg = isTransfer ? 'bg-indigo-100 text-indigo-600' : (isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600');

                    html += `
                    <div class="flex items-center justify-between p-2 hover:bg-slate-50 transition-colors rounded tx-item text-xs wallet-tx-item" data-tx-id="${t.id}" data-tx-type="${t.type}">
                        <div class="flex items-center gap-2 flex-1 min-w-0">
                            <div class="w-6 h-6 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0">
                                <i class="ph-bold ${icon}"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-bold text-slate-700 truncate">${escapeHTML(t.category)}</p>
                                <p class="text-slate-400 truncate">${escapeHTML(t.note)}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            <span class="font-bold ${amountColor}">
                                ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                            </span>
                            <button class="tx-edit-btn p-0.5 text-slate-400 hover:text-slate-600 rounded" title="Edit">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button class="tx-delete-btn p-0.5 text-slate-400 hover:text-rose-600 rounded" title="Delete">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </div>
                    `;
                });
            });

            txList.innerHTML = html;

            // Add event listeners for edit/delete buttons
            txList.addEventListener('click', (e) => {
                const txItem = e.target.closest('.tx-item');
                const txId = txItem?.dataset.txId;

                if (e.target.closest('.tx-edit-btn')) {
                    ModalView.openEditTransactionModal(txId);
                } else if (e.target.closest('.tx-delete-btn')) {
                    if (confirm('Delete this transaction?')) {
                        TransactionEngine.deleteTransaction(txId);
                        app.smartRefresh();
                    }
                }
            });
        }

        // 3. Render wallet history and category charts
        this.renderHistoryChart(walletId);
        this.renderCategoryChart(walletId);
    },

    renderHistoryChart(walletId) {
        const ctx = document.getElementById('chart-wallet-history').getContext('2d');
        
        // Get all transactions for this wallet sorted by date
        const txs = store.data.transactions
            .filter(t => t.accountId === walletId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (txs.length === 0) {
            // Show empty state
            ctx.fillStyle = '#94A3B8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No transaction history', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        // Calculate balance at each transaction
        const labels = [];
        const data = [];
        let balance = 0;

        txs.forEach(t => {
            if (t.type === 'income') {
                balance += t.amount;
            } else if (t.type === 'expense') {
                balance -= t.amount;
            }
            // transfers don't affect wallet balance
            
            labels.push(new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(balance / 100); // Convert cents to dollars
        });

        if (window.walletHistoryChart) window.walletHistoryChart.destroy();

        window.walletHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Wallet Balance Over Time',
                    data,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#4F46E5'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    },

    renderCategoryChart(walletId) {
        const catData = Analytics.getCategoryData(walletId);
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