import { store } from './store.js';

export const Analytics = {
    
    // Get Income vs Expense for the last 30 days (grouped by week)
    getCashFlowData() {
        const transactions = store.data.transactions;
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Initialize 4 weekly buckets
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const incomeData = [0, 0, 0, 0];
        const expenseData = [0, 0, 0, 0];

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate >= thirtyDaysAgo && txDate <= today) {
                // Determine which "week ago" this falls into (0-3)
                const diffTime = Math.abs(today - txDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const weekIndex = 3 - Math.floor(diffDays / 7); // 3 is current week, 0 is 4 weeks ago

                if (weekIndex >= 0 && weekIndex <= 3) {
                    if (tx.type === 'income') incomeData[weekIndex] += tx.amount;
                    if (tx.type === 'expense') expenseData[weekIndex] += tx.amount;
                }
            }
        });

        return { labels: weeks, income: incomeData, expense: expenseData };
    },

    // Get Spending grouped by Category
    getCategoryData() {
        const transactions = store.data.transactions.filter(t => t.type === 'expense');
        const categories = {};

        transactions.forEach(tx => {
            // Default to 'Uncategorized' if missing
            const cat = tx.category || 'Uncategorized';
            if (!categories[cat]) categories[cat] = 0;
            categories[cat] += tx.amount;
        });

        return {
            labels: Object.keys(categories),
            data: Object.values(categories)
        };
    }
};