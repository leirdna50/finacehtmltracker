import { app } from './app.js';
import { ModalView } from './views/modalView.js';
import { CalendarView } from './views/calendarView.js';
import { ForecastView } from './views/forecastView.js';

export function initEventListeners() {
    // Navigation
    document.getElementById('nav-dashboard').addEventListener('click', () => app.switchTab('dashboard'));
    document.getElementById('nav-calendar').addEventListener('click', () => app.switchTab('calendar'));
    document.getElementById('nav-forecast').addEventListener('click', () => app.switchTab('forecast'));

    // Buttons
    document.querySelector('button[aria-label="Add Transaction"]').addEventListener('click', () => ModalView.openTransactionModal());
    document.querySelector('button.text-indigo-600').addEventListener('click', () => ModalView.openAccountModal());

    // Calendar
    document.querySelector('[aria-label="Previous Month"]').addEventListener('click', () => CalendarView.changeMonth(-1));
    document.querySelector('[aria-label="Next Month"]').addEventListener('click', () => CalendarView.changeMonth(1));

    // Forecast
    document.getElementById('forecast-range').addEventListener('change', () => ForecastView.render());
    document.getElementById('toggle-avg-spend').addEventListener('change', () => ForecastView.render());

    document.getElementById('btn-back-to-dashboard').addEventListener('click', () => app.switchTab('dashboard'));

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
}