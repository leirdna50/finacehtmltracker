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
}