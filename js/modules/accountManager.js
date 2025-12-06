import { store } from './store.js';

export const AccountManager = {
    getAccounts() {
        return store.data.accounts;
    },

    getAccountById(id) {
        return store.data.accounts.find(a => a.id === id);
    },

    // Ghost Balance: Real Balance - Pending Recurring Bills (next 7 days)
    getAvailableBalance(accountId) {
        const account = this.getAccountById(accountId);
        if (!account) return 0;

        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        // Find recurring bills for this account due in next 7 days
        const pending = store.data.recurring.filter(rec => {
            const recDate = new Date(rec.nextDate);
            return rec.accountId === accountId && 
                   rec.type === 'expense' && 
                   recDate >= today && 
                   recDate <= nextWeek;
        });

        const pendingTotal = pending.reduce((sum, item) => sum + item.amount, 0);
        return {
            real: account.balance,
            available: account.balance - pendingTotal,
            pending: pendingTotal
        };
    },

    getTotalNetWorth() {
        return store.data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    },

    getDefaultAccount() {
        return store.data.accounts.find(a => a.isDefault) || store.data.accounts[0];
    }
};