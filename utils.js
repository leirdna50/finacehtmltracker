export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NZ', {
        style: 'currency',
        currency: 'NZD'
    }).format(amount);
}

export function formatDateInput(date) {
    return date.toISOString().split('T')[0];
}