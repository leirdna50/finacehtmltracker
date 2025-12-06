import { store } from '../modules/store.js';
import { AccountManager } from '../modules/accountManager.js';
import { formatCurrency } from '../utils.js';

const spacingOptions = ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days', 'weekly', '10 days', 'fortnightly', '15 days'];
const spacingDays = [1, 2, 3, 4, 5, 6, 7, 10, 14, 15];

export const ForecastView = {
    
    getSpacingLabel(index) {
        return spacingOptions[index] || 'Weekly';
    },

    getSpacingDays(index) {
        return spacingDays[index] || 7;
    },

    render() {
        const months = parseInt(document.getElementById('forecast-range').value);
        const spacingIndex = parseInt(document.getElementById('forecast-spacing').value);
        const includeAvg = document.getElementById('toggle-avg-spend').checked;
        
        // Update label
        document.getElementById('spacing-label').innerText = this.getSpacingLabel(spacingIndex);
        
        const ctx = document.getElementById('chart-forecast').getContext('2d');
        
        const daysToSimulate = months * 30;
        const interval = this.getSpacingDays(spacingIndex);
        let currentBalance = AccountManager.getTotalNetWorth();
        
        const labels = [];
        const baselineData = [];
        const realisticData = [];
        const today = new Date();

        for (let i = 0; i <= daysToSimulate; i += interval) {
            const simDate = new Date();
            simDate.setDate(today.getDate() + i);
            labels.push(simDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            store.data.recurring.forEach(rec => {
                if (rec.frequency === 'weekly') {
                     if (rec.txType === 'income') currentBalance += Math.round(parseFloat(rec.amount) * 100);
                     else currentBalance -= Math.round(parseFloat(rec.amount) * 100);
                }
            });

            baselineData.push(currentBalance / 100);
            
            if (includeAvg) {
                const avgSpend = 30 * interval;
                realisticData.push((currentBalance - (avgSpend * 100 * (i/interval))) / 100);
            }
        }

        if (window.forecastChart) window.forecastChart.destroy();

        const datasets = [
            {
                label: 'Baseline (Recurring Only)',
                data: baselineData,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }
        ];

        if (includeAvg) {
            datasets.push({
                label: 'Realistic (w/ Avg Spend)',
                data: realisticData,
                borderColor: '#F59E0B',
                borderDash: [5, 5],
                tension: 0.4
            });
        }

        window.forecastChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
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
    }
};

window.forecastView = ForecastView;
