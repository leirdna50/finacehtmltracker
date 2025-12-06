// Initial Seed Data to populate the app on first load
const SEED_DATA = {
    settings: { 
        privacyMode: false,
        darkMode: false
    },
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
        if (stored) {
            const data = JSON.parse(stored);
            // Ensure settings object exists
            if (!data.settings) {
                data.settings = SEED_DATA.settings;
            }
            return data;
        }
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

    deleteTransaction(txId) {
        this.data.transactions = this.data.transactions.filter(t => t.id !== txId);
        this.save();
    }

    addRecurring(recurring) {
        this.data.recurring.push(recurring);
        this.save();
    }

    deleteRecurring(recurringId) {
        this.data.recurring = this.data.recurring.filter(r => r.id !== recurringId);
        this.save();
    }

    updateRecurring(recurringId, updates) {
        const recurring = this.data.recurring.find(r => r.id === recurringId);
        if (recurring) {
            Object.assign(recurring, updates);
            this.save();
        }
    }

    updateAccountName(id, newName) {
        const acc = this.data.accounts.find(a => a.id === id);
        if (acc) {
            acc.name = newName;
            this.save();
        }
    }

    reorderAccounts(accountIds) {
        // Create a map of id to account
        const accountMap = {};
        this.data.accounts.forEach(acc => {
            accountMap[acc.id] = acc;
        });
        
        // Rebuild accounts array in the new order
        this.data.accounts = accountIds.map(id => accountMap[id]).filter(Boolean);
        this.save();
    }
}

export const store = new Store();