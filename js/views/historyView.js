import { store } from '../modules/store.js';
import { formatCurrency } from '../utils.js';

const spacingOptions = ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days', 'weekly', '10 days', 'fortnightly', '15 days'];
const spacingDays = [1, 2, 3, 4, 5, 6, 7, 10, 14, 15];

export const HistoryView = {
    currentStartDate: null,
    currentEndDate: null,
    
    getSpacingLabel(index) {
        return spacingOptions[index] || 'Weekly';
    },

    getSpacingDays(index) {
        return spacingDays[index] || 7;
    },

    render() {
        const range = document.getElementById('history-range').value;
        const spacing = parseInt(document.getElementById('history-spacing').value);
        const endDate = new Date();
        let startDate = new Date();

        // Update spacing label
        const spacingLabel = document.getElementById('history-spacing-label');
        if (spacingLabel) spacingLabel.innerText = this.getSpacingLabel(spacing);

        // Set start date based on range
        if (range === 'custom') {
            const startInput = document.getElementById('history-start-date').value;
            const endInput = document.getElementById('history-end-date').value;
            if (startInput && endInput) {
                startDate = new Date(startInput);
                endDate = new Date(endInput);
            }
        } else {
            const months = parseInt(range);
            startDate.setMonth(startDate.getMonth() - months);
        }

        this.currentStartDate = startDate;
        this.currentEndDate = endDate;

        const ctx = document.getElementById('chart-history').getContext('2d');
        const interval = this.getSpacingDays(spacing);
        const labels = [];
        const data = [];

        // Calculate balance at each interval
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Calculate balance up to this date
            const balance = this.calculateBalanceAtDate(currentDate);
            data.push(store.data.settings?.privacyMode ? 0 : balance / 100); // Convert to dollars

            currentDate.setDate(currentDate.getDate() + interval);
        }

        if (window.historyChart) window.historyChart.destroy();

        window.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Net Worth Over Time',
                    data,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
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
                                return store.data.settings?.privacyMode ? '••••' : '$' + value.toFixed(0);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return store.data.settings?.privacyMode ? '••••' : '$' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    },

    calculateBalanceAtDate(date) {
        let balance = 0;
        
        // Sum all transactions up to this date
        store.data.transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate <= date) {
                if (tx.type === 'income') {
                    balance += tx.amount;
                } else {
                    balance -= tx.amount;
                }
            }
        });

        return balance;
    }
};

window.historyView = HistoryView;
