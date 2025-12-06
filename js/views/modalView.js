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

                    <div id="transfer-to-container" class="hidden">
                        <label class="block text-xs font-bold text-slate-500 uppercase">Transfer To Wallet</label>
                        <select name="transferToId" class="w-full p-2 border border-slate-300 rounded-lg bg-white">
                            ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
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

                    <div class="border-t border-slate-200 pt-4">
                        <h4 class="text-sm font-bold text-slate-700 mb-3">Make Recurring?</h4>
                        <div class="space-y-2">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="isRecurring" class="accent-indigo-600 rounded" id="recurring-toggle">
                                <span class="text-sm text-slate-600">Yes, make this recurring</span>
                            </label>
                        </div>
                        
                        <div id="recurring-options" class="hidden mt-3 space-y-3 p-3 bg-slate-50 rounded-lg">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                                <select name="frequency" class="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Every 2 Weeks</option>
                                    <option value="monthly" selected>Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Repeat Until (Optional)</label>
                                <input type="date" name="recurringEndDate" class="w-full p-2 border border-slate-300 rounded-lg text-sm">
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg">Save Transaction</button>
                    <button type="button" id="modal-cancel-btn" class="w-full text-slate-400 py-2">Cancel</button>
                </form>
            </div>
        `;

        this.show(html);

        // Toggle recurring options
        document.getElementById('recurring-toggle').addEventListener('change', (e) => {
            document.getElementById('recurring-options').classList.toggle('hidden', !e.target.checked);
        });

        // Show/hide transfer wallet selector and category field
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const transferContainer = document.getElementById('transfer-to-container');
        const categoryContainer = document.getElementById('category-container');
        const categoryInput = document.querySelector('input[name="category"]');
        const sourceWallet = document.querySelector('select[name="accountId"]');
        const destWallet = document.querySelector('select[name="transferToId"]');
        
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'transfer') {
                    transferContainer.classList.remove('hidden');
                    categoryContainer.classList.add('hidden');
                    categoryInput.value = 'Transfer';
                    // Reset destination to first different wallet
                    if (destWallet && sourceWallet) {
                        const sourceId = sourceWallet.value;
                        const diffOption = Array.from(destWallet.options).find(opt => opt.value !== sourceId);
                        if (diffOption) destWallet.value = diffOption.value;
                    }
                } else {
                    transferContainer.classList.add('hidden');
                    categoryContainer.classList.remove('hidden');
                    categoryInput.value = '';
                }
            });
        });

        // Smart wallet selection - prevent same wallet selection
        if (sourceWallet && destWallet) {
            sourceWallet.addEventListener('change', () => {
                const sourceId = sourceWallet.value;
                // If destination is same, switch to different wallet
                if (destWallet.value === sourceId) {
                    const diffOption = Array.from(destWallet.options).find(opt => opt.value !== sourceId);
                    if (diffOption) destWallet.value = diffOption.value;
                }
            });

            destWallet.addEventListener('change', () => {
                const sourceId = sourceWallet.value;
                const destId = destWallet.value;
                // If user tries to select same wallet, auto-switch source
                if (destId === sourceId) {
                    const diffOption = Array.from(sourceWallet.options).find(opt => opt.value !== destId);
                    if (diffOption) sourceWallet.value = diffOption.value;
                }
            });
        }

        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.close());

        document.getElementById('tx-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // If transfer, process both wallets
            if (data.type === 'transfer' && data.transferToId) {
                const sourceWallet = accounts.find(a => a.id === data.accountId);
                const destWallet = accounts.find(a => a.id === data.transferToId);
                
                // Deduct from source wallet
                TransactionEngine.addTransaction({
                    id: 'tx_' + Date.now(),
                    type: 'transfer',
                    amount: parseFloat(data.amount) * 100, // Convert to cents
                    category: 'Transfer',
                    accountId: data.accountId,
                    date: data.date,
                    note: data.note || `Transfer to ${destWallet?.name || 'wallet'}`
                });
                
                // Add to destination wallet
                TransactionEngine.addTransaction({
                    id: 'tx_' + (Date.now() + 1),
                    type: 'transfer',
                    amount: parseFloat(data.amount) * 100, // Convert to cents
                    category: 'Transfer',
                    accountId: data.transferToId,
                    date: data.date,
                    note: data.note || `Transfer from ${sourceWallet?.name || 'wallet'}`
                });
            } else {
                TransactionEngine.addTransaction(data);
            }
            
            // If recurring, add the recurring transaction record
            if (data.isRecurring === 'on') {
                store.addRecurring({
                    id: 'rec_' + Date.now(),
                    txType: data.type,
                    accountId: data.accountId,
                    amount: data.amount,
                    category: data.category,
                    frequency: data.frequency,
                    startDate: data.date,
                    endDate: data.recurringEndDate || null,
                    note: data.note || '',
                    lastGenerated: data.date
                });
            }
            
            this.close();
            app.smartRefresh();
        };
    },

    openEditTransactionModal(txId) {
        const tx = store.data.transactions.find(t => t.id === txId);
        if (!tx) return;

        const accounts = AccountManager.getAccounts();
        
        const html = `
            <div class="p-6">
                <h3 class="text-xl font-bold mb-4">Edit Transaction</h3>
                <form id="tx-form" class="space-y-4">
                    <div class="flex bg-slate-100 p-1 rounded-lg">
                        <label class="flex-1 text-center py-2 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="type" value="expense" class="hidden" ${tx.type === 'expense' ? 'checked' : ''}>
                            <span class="text-sm font-bold text-rose-600">Expense</span>
                        </label>
                        <label class="flex-1 text-center py-2 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="type" value="income" class="hidden" ${tx.type === 'income' ? 'checked' : ''}>
                            <span class="text-sm font-bold text-emerald-600">Income</span>
                        </label>
                         <label class="flex-1 text-center py-2 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="type" value="transfer" class="hidden" ${tx.type === 'transfer' ? 'checked' : ''}>
                            <span class="text-sm font-bold text-indigo-600">Transfer</span>
                        </label>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Amount</label>
                        <input type="number" name="amount" step="0.01" value="${(tx.amount / 100).toFixed(2)}" class="w-full p-2 border border-slate-300 rounded-lg text-lg font-bold" required>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase">Wallet</label>
                        <select name="accountId" class="w-full p-2 border border-slate-300 rounded-lg bg-white">
                            ${accounts.map(a => `<option value="${a.id}" ${a.id === tx.accountId ? 'selected' : ''}>${a.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Category</label>
                            <input type="text" name="category" value="${tx.category}" class="w-full p-2 border border-slate-300 rounded-lg" list="cat-suggestions">
                            <datalist id="cat-suggestions">
                                <option value="Food"><option value="Rent"><option value="Transport"><option value="Salary">
                            </datalist>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Date</label>
                            <input type="date" name="date" value="${tx.date.split('T')[0]}" class="w-full p-2 border border-slate-300 rounded-lg">
                        </div>
                    </div>

                    <input type="text" name="note" placeholder="Add a note..." value="${tx.note}" class="w-full p-2 border border-slate-300 rounded-lg text-sm">

                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg">Update Transaction</button>
                    <button type="button" id="modal-cancel-btn" class="w-full text-slate-400 py-2">Cancel</button>
                </form>
            </div>
        `;

        this.show(html);

        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.close());

        document.getElementById('tx-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            TransactionEngine.editTransaction(txId, data);
            this.close();
            app.smartRefresh();
        };
    },

    openEditBalance(accountId) {
        const account = AccountManager.getAccountById(accountId);
        const balanceInDollars = (account.balance / 100).toFixed(2);
        const html = `
            <div class="p-6">
                 <h3 class="text-xl font-bold mb-4">Adjust Balance</h3>
                 <p class="text-sm text-slate-500 mb-4">Current: $${balanceInDollars}</p>
                 <form id="adj-form">
                    <input type="number" name="newBalance" step="0.01" class="w-full p-2 border border-slate-300 rounded-lg mb-4" value="${balanceInDollars}">
                    <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg">Update</button>
                    <button type="button" id="modal-cancel-btn" class="w-full text-slate-400 py-2">Cancel</button>
                 </form>
            </div>
        `;
        this.show(html);
        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.close());
        document.getElementById('adj-form').onsubmit = (e) => {
            e.preventDefault();
            const val = parseFloat(e.target.newBalance.value);
            TransactionEngine.adjustBalance(accountId, val);
            this.close();
            app.smartRefresh();
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
                    <button type="button" id="modal-cancel-btn" class="w-full text-slate-400 py-2">Cancel</button>
                </form>
            </div>
        `;

        this.show(html);

        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.close());

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
            app.smartRefresh();
        };
    },

    openRenameWallet(accountId) {
        const account = AccountManager.getAccountById(accountId);
        
        const html = `
            <div class="p-6">
                <h3 class="text-xl font-bold mb-4">Rename Wallet</h3>
                <form id="rename-form" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Wallet Name</label>
                        <input type="text" name="walletName" class="w-full p-2 border border-slate-300 rounded-lg" value="${escapeHTML(account.name)}" required>
                    </div>
                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">Save</button>
                    <button type="button" id="modal-cancel-btn" class="w-full text-slate-400 py-2">Cancel</button>
                </form>
            </div>
        `;
        this.show(html);
        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.close());
        document.getElementById('rename-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newName = formData.get('walletName').trim();
            if (newName) {
                store.updateAccountName(accountId, newName);
                this.close();
                app.smartRefresh();
            }
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