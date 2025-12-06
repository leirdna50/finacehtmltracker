import { store } from './store.js';

export const Analytics = {
    
    // Get Income vs Expense for the last 30 days (grouped by day spacing)
    getCashFlowData(daySpacing = 7) {
        const transactions = store.data.transactions;
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Create buckets based on day spacing
        const buckets = [];
        const labels = [];
        let currentDate = new Date(thirtyDaysAgo);
        
        while (currentDate <= today) {
            const bucketEnd = new Date(currentDate);
            bucketEnd.setDate(bucketEnd.getDate() + daySpacing - 1);
            
            const effectiveEnd = bucketEnd > today ? today : bucketEnd;
            const label = daySpacing === 1 
                ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${effectiveEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            
            buckets.push({ income: 0, expense: 0, startDate: new Date(currentDate), endDate: new Date(bucketEnd) });
            labels.push(label);
            
            currentDate.setDate(currentDate.getDate() + daySpacing);
        }

        // Distribute transactions into buckets
        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate >= thirtyDaysAgo && txDate <= today) {
                const bucket = buckets.find(b => txDate >= b.startDate && txDate <= b.endDate);
                if (bucket) {
                    if (tx.type === 'income') bucket.income += tx.amount;
                    if (tx.type === 'expense') bucket.expense += tx.amount;
                }
            }
        });

        const incomeData = buckets.map(b => b.income);
        const expenseData = buckets.map(b => b.expense);

        return { labels, income: incomeData, expense: expenseData };
    },

    // Get Spending grouped by Category (optionally filtered by accountId)
    getCategoryData(accountId = null) {
        let transactions = store.data.transactions.filter(t => t.type === 'expense');

        // FILTER: If an ID is provided, only show that wallet's expenses
        if (accountId) {
            transactions = transactions.filter(t => t.accountId === accountId);
        }

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