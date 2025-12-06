import { store } from '../modules/store.js';
import { AccountManager } from '../modules/accountManager.js';

export const ForecastView = {
    render() {
        const months = parseInt(document.getElementById('forecast-range').value);
        const includeAvg = document.getElementById('toggle-avg-spend').checked;
        
        const ctx = document.getElementById('chart-forecast').getContext('2d');
        
        // Simulation Logic
        const daysToSimulate = months * 30;
        let currentBalance = AccountManager.getTotalNetWorth();
        
        const labels = [];
        const baselineData = []; // Recurring only
        const realisticData = []; // Recurring + Avg Spend (Estimated at $30/day)

        const today = new Date();

        for (let i = 0; i <= daysToSimulate; i += 7) { // Weekly data points
            const simDate = new Date();
            simDate.setDate(today.getDate() + i);
            labels.push(simDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            // Apply Recurring
            store.data.recurring.forEach(rec => {
                // Determine if this bill hits in this week window (Simplified logic for demo)
                if (rec.frequency === 'weekly') {
                     if (rec.type === 'income') currentBalance += rec.amount;
                     else currentBalance -= rec.amount;
                }
            });

            baselineData.push(currentBalance);
            
            // Realistic (Subtract avg spend)
            if (includeAvg) {
                const avgSpend = 30 * 7; // $30/day * 7 days
                realisticData.push(currentBalance - (avgSpend * (i/7)));
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
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};