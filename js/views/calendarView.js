import { store } from '../modules/store.js';
import { formatCurrency, escapeHTML } from '../utils.js';
import { ModalView } from './modalView.js';
import { TransactionEngine } from '../modules/transactionEngine.js';
import { app } from '../app.js';

export const CalendarView = {
    currentDate: new Date(),
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('cal-month-label').innerText = 
            this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        // Add previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            const dateStr = new Date(prevYear, prevMonth, dayNum).toISOString().split('T')[0];
            const txs = store.data.transactions.filter(t => t.date.startsWith(dateStr));
            
            const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const net = income - expense;
            
            let netColor = net > 0 ? 'text-emerald-600' : (net < 0 ? 'text-rose-600' : 'text-slate-500');
            let bgColor = net > 0 ? 'bg-emerald-50' : (net < 0 ? 'bg-rose-50' : 'bg-white');
            
            // Create dots for each transaction
            const MAX_DOTS = 8;
            const dots = [];
            txs.forEach(t => {
                if (t.type === 'income') {
                    dots.push('dot-income');
                } else if (t.type === 'expense') {
                    dots.push('dot-expense');
                } else if (t.category === 'Transfer') {
                    dots.push('dot-transfer');
                }
            });
            
            let visibleDots = dots.slice(-MAX_DOTS);
            let hiddenCount = Math.max(0, dots.length - MAX_DOTS);
            
            let dotsHtml = '<div class="cal-dots-container">';
            visibleDots.forEach(dotClass => {
                dotsHtml += `<div class="dot ${dotClass}"></div>`;
            });
            if (hiddenCount > 0) {
                dotsHtml += `<span class="cal-overflow">+${hiddenCount}</span>`;
            }
            dotsHtml += '</div>';
            
            const div = document.createElement('div');
            div.className = `cal-day other-month ${bgColor}`;
            const amountDisplay = net !== 0 ? `<span class="cal-amount ${netColor}">${formatCurrency(Math.abs(net))}</span>` : '';
            div.innerHTML = `
                <span class="cal-day-num">${dayNum}</span>
                ${amountDisplay}
                ${dotsHtml}
            `;
            div.onclick = () => {
                this.currentDate = new Date(prevYear, prevMonth, dayNum);
                this.render();
            };
            
            grid.appendChild(div);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toISOString().split('T')[0];
            const txs = store.data.transactions.filter(t => t.date.startsWith(dateStr));
            
            const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const net = income - expense;
            
            let netColor = net > 0 ? 'text-emerald-600' : (net < 0 ? 'text-rose-600' : 'text-slate-500');
            let bgColor = net > 0 ? 'bg-emerald-50' : (net < 0 ? 'bg-rose-50' : 'bg-white');
            
            // Create dots for each transaction with proper layout
            const MAX_DOTS = 8; // Maximum dots that fit in bottom row (4x2 grid)
            const dots = [];
            
            txs.forEach(t => {
                if (t.type === 'income') {
                    dots.push('dot-income');
                } else if (t.type === 'expense') {
                    dots.push('dot-expense');
                } else if (t.category === 'Transfer') {
                    dots.push('dot-transfer');
                }
            });
            
            // Show up to MAX_DOTS, hide oldest if overflow
            let visibleDots = dots.slice(-MAX_DOTS);
            let hiddenCount = Math.max(0, dots.length - MAX_DOTS);
            
            let dotsHtml = '<div class="cal-dots-container">';
            visibleDots.forEach(dotClass => {
                dotsHtml += `<div class="dot ${dotClass}"></div>`;
            });
            if (hiddenCount > 0) {
                dotsHtml += `<span class="cal-overflow">+${hiddenCount}</span>`;
            }
            dotsHtml += '</div>';
            
            const div = document.createElement('div');
            div.className = `cal-day ${bgColor}`;
            const amountDisplay = net !== 0 ? `<span class="cal-amount ${netColor}">${formatCurrency(Math.abs(net))}</span>` : '';
            div.innerHTML = `
                <span class="cal-day-num">${i}</span>
                ${amountDisplay}
                ${dotsHtml}
            `;
            div.onclick = () => this.selectDate(dateStr, txs);
            
            grid.appendChild(div);
        }

        // Add next month's days
        const totalCells = 42; // 6 rows × 7 days
        const filledCells = startingDay + daysInMonth;
        const remainingCells = totalCells - filledCells;
        
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            const dateStr = new Date(nextYear, nextMonth, i).toISOString().split('T')[0];
            const txs = store.data.transactions.filter(t => t.date.startsWith(dateStr));
            
            const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const net = income - expense;
            
            let netColor = net > 0 ? 'text-emerald-600' : (net < 0 ? 'text-rose-600' : 'text-slate-500');
            let bgColor = net > 0 ? 'bg-emerald-50' : (net < 0 ? 'bg-rose-50' : 'bg-white');
            
            // Create dots for each transaction
            const MAX_DOTS = 8;
            const dots = [];
            txs.forEach(t => {
                if (t.type === 'income') {
                    dots.push('dot-income');
                } else if (t.type === 'expense') {
                    dots.push('dot-expense');
                } else if (t.category === 'Transfer') {
                    dots.push('dot-transfer');
                }
            });
            
            let visibleDots = dots.slice(-MAX_DOTS);
            let hiddenCount = Math.max(0, dots.length - MAX_DOTS);
            
            let dotsHtml = '<div class="cal-dots-container">';
            visibleDots.forEach(dotClass => {
                dotsHtml += `<div class="dot ${dotClass}"></div>`;
            });
            if (hiddenCount > 0) {
                dotsHtml += `<span class="cal-overflow">+${hiddenCount}</span>`;
            }
            dotsHtml += '</div>';
            
            const div = document.createElement('div');
            div.className = `cal-day other-month ${bgColor}`;
            const amountDisplay = net !== 0 ? `<span class="cal-amount ${netColor}">${formatCurrency(Math.abs(net))}</span>` : '';
            div.innerHTML = `
                <span class="cal-day-num">${i}</span>
                ${amountDisplay}
                ${dotsHtml}
            `;
            div.onclick = () => {
                this.currentDate = new Date(nextYear, nextMonth, i);
                this.render();
            };
            
            grid.appendChild(div);
        }

        this.updateInfographics(month, year);
    },

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    },

    selectDate(dateStr, txs) {
        document.getElementById('cal-info-default').classList.add('hidden');
        document.getElementById('cal-info-active').classList.remove('hidden');
        document.getElementById('selected-date-label').innerText = new Date(dateStr).toDateString();
        
        const list = document.getElementById('day-transaction-list');
        if (txs.length === 0) {
            list.innerHTML = '<p class="text-sm text-slate-400 italic">No transactions.</p>';
            return;
        }

        list.innerHTML = txs.map(t => {
            const color = t.type === 'income' ? 'text-emerald-600' : 'text-rose-600';
            const sign = t.type === 'income' ? '+' : '-';
            return `
                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 tx-item" data-tx-id="${t.id}">
                    <div class="flex-1">
                        <p class="text-sm font-bold text-slate-700">${escapeHTML(t.category)}</p>
                        <p class="text-xs text-slate-500">${escapeHTML(t.note)}</p>
                    </div>
                    <span class="font-bold ${color} mr-2">${sign}${formatCurrency(t.amount)}</span>
                    <button class="tx-edit-btn p-1 text-slate-400 hover:text-slate-600 rounded transition-colors" title="Edit">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="tx-delete-btn p-1 text-slate-400 hover:text-rose-600 rounded transition-colors" title="Delete">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        list.addEventListener('click', (e) => {
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
    },

    clearSelection() {
        document.getElementById('cal-info-default').classList.remove('hidden');
        document.getElementById('cal-info-active').classList.add('hidden');
    },

    updateInfographics(month, year) {
        // Calculate monthly totals
        const txs = store.data.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });

        const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('cal-stat-income').innerText = formatCurrency(income);
        document.getElementById('cal-stat-expense').innerText = formatCurrency(expense);
        document.getElementById('cal-stat-net').innerText = formatCurrency(income - expense);
    }
};