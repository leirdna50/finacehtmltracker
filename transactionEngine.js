import { store } from './store.js';
import { AccountManager } from './accountManager.js';

export const TransactionEngine = {
    
    // Add standard Income/Expense
    addTransaction(data) {
        const tx = {
            id: 'tx_' + Date.now(),
            accountId: data.accountId,
            type: data.type, // 'income' or 'expense'
            amount: parseFloat(data.amount),
            category: data.category,
            date: data.date, // ISO string
            note: data.note || '',
            isTransfer: false
        };

        // Update Wallet Balance
        const account = AccountManager.getAccountById(data.accountId);
        let newBalance = account.balance;
        if (data.type === 'income') newBalance += tx.amount;
        else newBalance -= tx.amount;

        store.updateAccountBalance(data.accountId, newBalance);
        store.addTransaction(tx);
        
        return tx;
    },

    // Handle Transfer (Debit A, Credit B)
    executeTransfer(fromId, toId, amount, date, note) {
        // Outgoing
        this.addTransaction({
            accountId: fromId,
            type: 'expense',
            amount: amount,
            category: 'Transfer',
            date: date,
            note: `Transfer to ${AccountManager.getAccountById(toId).name}: ${note}`
        });

        // Incoming
        this.addTransaction({
            accountId: toId,
            type: 'income',
            amount: amount,
            category: 'Transfer',
            date: date,
            note: `Transfer from ${AccountManager.getAccountById(fromId).name}: ${note}`
        });
    },

    // Manual Balance Adjustment (Creates a "Balance Correction" transaction)
    adjustBalance(accountId, newBalance) {
        const account = AccountManager.getAccountById(accountId);
        const diff = newBalance - account.balance;

        if (diff === 0) return;

        const type = diff > 0 ? 'income' : 'expense';
        const amount = Math.abs(diff);

        this.addTransaction({
            accountId: accountId,
            type: type,
            amount: amount,
            category: 'Adjustment',
            date: new Date().toISOString(),
            note: 'Manual Balance Correction'
        });
    }
};