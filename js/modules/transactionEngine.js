import { store } from './store.js';
import { AccountManager } from './accountManager.js';

export const TransactionEngine = {
    
    // Add standard Income/Expense
    addTransaction(data) {
        const tx = {
            id: 'tx_' + Date.now(),
            accountId: data.accountId,
            type: data.type, // 'income' or 'expense'
            amount: Math.round(parseFloat(data.amount) * 100), // Convert to cents
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

    // Manual Balance Adjustment (Sets balance directly)
    adjustBalance(accountId, newBalanceInDollars) {
        const account = AccountManager.getAccountById(accountId);
        // Convert to cents
        const newBalanceInCents = Math.round(newBalanceInDollars * 100);
        
        // Directly set the balance without creating a transaction
        store.updateAccountBalance(accountId, newBalanceInCents);
    },

    // Edit existing transaction
    editTransaction(txId, data) {
        const tx = store.data.transactions.find(t => t.id === txId);
        if (!tx) return;

        const oldAmount = tx.amount;
        const oldType = tx.type;
        const newAmount = Math.round(parseFloat(data.amount) * 100);
        const newType = data.type;

        // Update transaction details
        tx.type = newType;
        tx.amount = newAmount;
        tx.category = data.category;
        tx.date = data.date;
        tx.note = data.note || '';

        // Recalculate account balance if amount or type changed
        if (oldAmount !== newAmount || oldType !== newType) {
            const account = AccountManager.getAccountById(tx.accountId);
            let newBalance = account.balance;

            // Reverse the old transaction
            if (oldType === 'income') newBalance -= oldAmount;
            else newBalance += oldAmount;

            // Apply the new transaction
            if (newType === 'income') newBalance += newAmount;
            else newBalance -= newAmount;

            store.updateAccountBalance(tx.accountId, newBalance);
        }

        store.save();
    },

    // Delete transaction
    deleteTransaction(txId) {
        const tx = store.data.transactions.find(t => t.id === txId);
        if (!tx) return;

        // Reverse the transaction's impact on balance
        const account = AccountManager.getAccountById(tx.accountId);
        let newBalance = account.balance;
        if (tx.type === 'income') newBalance -= tx.amount;
        else newBalance += tx.amount;

        store.updateAccountBalance(tx.accountId, newBalance);
        store.deleteTransaction(txId);
    }
};