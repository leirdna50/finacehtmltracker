import { store } from './modules/store.js';

export function formatCurrency(amountInCents) {
    // Safely check if privacy mode is enabled
    try {
        if (store?.data?.settings?.privacyMode === true) {
            return '••••';
        }
    } catch (e) {
        // If store isn't ready, just format normally
    }
    
    return new Intl.NumberFormat('en-NZ', {
        style: 'currency',
        currency: 'NZD'
    }).format(amountInCents / 100);
}

export function formatDateInput(date) {
    return date.toISOString().split('T')[0];
}

export function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}