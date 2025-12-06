import { AccountManager } from '../modules/accountManager.js';
import { TransactionEngine } from '../modules/transactionEngine.js';
import { store } from '../modules/store.js';
import { app } from '../app.js';

export const ModalView = {
    openTransactionModal(preselectAccountId = null) {
        const accounts = AccountManager.getAccounts();
        const defaultId = preselectAccountId || AccountManager.getDefaultAccount().id;
        
        const html = `
            <div class="p-6">
                <h3 class="text-xl font-bold mb-4">Add Transaction</h3>
                <form id="tx-form" class="space-y-4">
                    <div class="flex bg-slate-100 p-1 rounded-lg">
                        <label class="flex-1 text-center py-2 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="type" value="expense" class="hidden" checked>
                            <span class="text-sm font-bold text-rose-600">Expense</span>
                        </label>
                        <label class="flex-1 text-center py-2 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="type" value="income" class="hidden">
                            <span class="text-sm font-bold text-emerald-600">Income</span>
                        </label>
                         <label class="flex-1 text-center py-2 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="type" value="transfer" class="hidden">
                            <span class="text-sm font-bold text-indigo-600">Transfer</span>
                        </label>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Amount</label>
                        <input type="number" name="amount" step="0.01" class="w-full p-2 border border-slate-300 rounded-lg text-lg font-bold" required>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Wallet</label>
                        <select name="accountId" class="w-full p-2 border border-slate-300 rounded-lg bg-white">
                            ${accounts.map(a => `<option value="${a.id}" ${a.id === defaultId ? 'selected' : ''}>${a.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Category</label>
                            <input type="text" name="category" class="w-full p-2 border border-slate-300 rounded-lg" list="cat-suggestions">
                            <datalist id="cat-suggestions">
                                <option value="Food"><option value="Rent"><option value="Transport"><option value="Salary">
                            </datalist>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Date</label>
                            <input type="date" name="date" class="w-full p-2 border border-slate-300 rounded-lg" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <input type="text" name="note" placeholder="Add a note..." class="w-full p-2 border border-slate-300 rounded-lg text-sm">

                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg">Save Transaction</button>
                    <button type="button" onclick="modalView.close()" class="w-full text-slate-400 py-2">Cancel</button>
                </form>
            </div>
        `;

        this.show(html);

        document.getElementById('tx-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            TransactionEngine.addTransaction(data);
            this.close();
            app.refresh();
        };
    },

    openEditBalance(accountId) {
        const account = AccountManager.getAccountById(accountId);
        const html = `
            <div class="p-6">
                 <h3 class="text-xl font-bold mb-4">Adjust Balance</h3>
                 <p class="text-sm text-slate-500 mb-4">Current: ${account.balance}</p>
                 <form id="adj-form">
                    <input type="number" name="newBalance" step="0.01" class="w-full p-2 border border-slate-300 rounded-lg mb-4" value="${account.balance}">
                    <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg">Update</button>
                 </form>
            </div>
        `;
        this.show(html);
        document.getElementById('adj-form').onsubmit = (e) => {
            e.preventDefault();
            const val = parseFloat(e.target.newBalance.value);
            TransactionEngine.adjustBalance(accountId, val);
            this.close();
            app.refresh();
        };
    },

    openAccountModal() {
        const html = `
            <div class="p-6">
                <h3 class="text-xl font-bold mb-4">Create New Wallet</h3>
                <form id="acc-form" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Wallet Name</label>
                        <input type="text" name="name" class="w-full p-2 border border-slate-300 rounded-lg" required placeholder="e.g. Vacation Fund">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Starting Balance</label>
                        <input type="number" name="balance" step="0.01" class="w-full p-2 border border-slate-300 rounded-lg" required value="0.00">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Color Theme</label>
                        <select name="color" class="w-full p-2 border border-slate-300 rounded-lg bg-white">
                            <option value="indigo">Indigo (Purple/Blue)</option>
                            <option value="emerald">Emerald (Green)</option>
                            <option value="rose">Rose (Red)</option>
                            <option value="amber">Amber (Orange)</option>
                        </select>
                    </div>
                    <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg">Create Wallet</button>
                    <button type="button" onclick="modalView.close()" class="w-full text-slate-400 py-2">Cancel</button>
                </form>
            </div>
        `;

        this.show(html);

        document.getElementById('acc-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            const newAcc = {
                id: 'acc_' + Date.now(),
                name: data.name,
                type: 'Checking',
                balance: parseFloat(data.balance),
                color: data.color,
                isDefault: false
            };

            store.addAccount(newAcc);
            this.close();
            app.refresh();
        };
    },

    show(html) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = html;
        overlay.classList.remove('hidden');
    },

    close() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
};

window.modalView = ModalView;