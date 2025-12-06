export function formatCurrency(amountInCents) {
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