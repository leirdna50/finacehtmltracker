// Initial Seed Data to populate the app on first load
const SEED_DATA = {
    accounts: [
        { id: 'acc_1', name: 'My Account', type: 'Checking', balance: 0, color: 'emerald', isDefault: true }
    ],
    transactions: [],
    recurring: []
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