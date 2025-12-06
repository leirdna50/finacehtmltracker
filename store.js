// Initial Seed Data to populate the app on first load
const SEED_DATA = {
    accounts: [
        { id: 'acc_1', name: 'Westpac Spend', type: 'Checking', balance: 450.50, color: 'emerald', isDefault: true },
        { id: 'acc_2', name: 'Westpac Vault', type: 'Bills', balance: 125.00, color: 'rose', isDefault: false },
        { id: 'acc_3', name: 'BNZ Rapid Save', type: 'Savings', balance: 2500.00, color: 'indigo', isDefault: false }
    ],
    transactions: [
        { id: 'tx_1', accountId: 'acc_1', type: 'expense', amount: 25.50, category: 'Food', date: new Date().toISOString(), note: 'Uber Eats' },
        { id: 'tx_2', accountId: 'acc_1', type: 'income', amount: 850.00, category: 'Salary', date: new Date().toISOString(), note: 'Weekly Pay' }
    ],
    recurring: [
        { id: 'rec_1', accountId: 'acc_2', type: 'expense', amount: 225.00, category: 'Rent', frequency: 'weekly', nextDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString() },
        { id: 'rec_2', accountId: 'acc_1', type: 'expense', amount: 14.40, category: 'Gym', frequency: 'weekly', nextDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString() }
    ]
};

class Store {
    constructor() {
        this.data = this.load();
    }

    load() {
        const stored = localStorage.getItem('finance_tracker_data');
        if (stored) return JSON.parse(stored);
        return SEED_DATA;
    }

    save() {
        localStorage.setItem('finance_tracker_data', JSON.stringify(this.data));
    }

    // CRUD Ops
    addTransaction(tx) {
        this.data.transactions.push(tx);
        this.save();
    }

    addAccount(acc) {
        this.data.accounts.push(acc);
        this.save();
    }

    updateAccountBalance(id, newBalance) {
        const acc = this.data.accounts.find(a => a.id === id);
        if (acc) {
            acc.balance = parseFloat(newBalance);
            this.save();
        }
    }

    deleteAccount(id) {
        this.data.accounts = this.data.accounts.filter(a => a.id !== id);
        this.save();
    }
}

export const store = new Store();