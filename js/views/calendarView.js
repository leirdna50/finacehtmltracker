import { store } from '../modules/store.js';
import { formatCurrency } from '../utils.js';

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
        const startingDay = firstDay.getDay(); // 0 is Sunday

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        // Padding Days
        for (let i = 0; i < startingDay; i++) {
            grid.innerHTML += `<div class="cal-day other-month"></div>`;
        }

        // Real Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toISOString().split('T')[0];
            
            // Find transactions for this day
            const txs = store.data.transactions.filter(t => t.date.startsWith(dateStr));
            
            // Determine dots
            let dotsHtml = '<div class="flex gap-1 mt-auto justify-end">';
            if (txs.some(t => t.type === 'income')) dotsHtml += `<div class="dot dot-income"></div>`;
            if (txs.some(t => t.type === 'expense')) dotsHtml += `<div class="dot dot-expense"></div>`;
            if (txs.some(t => t.category === 'Transfer')) dotsHtml += `<div class="dot dot-transfer"></div>`;
            dotsHtml += '</div>';

            const div = document.createElement('div');
            div.className = 'cal-day bg-white';
            div.innerHTML = `<span class="text-xs font-bold text-slate-500">${i}</span>${dotsHtml}`;
            div.onclick = () => this.selectDate(dateStr, txs);
            
            grid.appendChild(div);
        }

        // Calculate Infographics
        this.updateInfographics(month, year);
    },

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    },

    selectDate(dateStr, txs) {
        // Switch Side Panel to Transaction List
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
                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <p class="text-sm font-bold text-slate-700">${t.category}</p>
                        <p class="text-xs text-slate-500">${t.note}</p>
                    </div>
                    <span class="font-bold ${color}">${sign}${formatCurrency(t.amount)}</span>
                </div>
            `;
        }).join('');
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