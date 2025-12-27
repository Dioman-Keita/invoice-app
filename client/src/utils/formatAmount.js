/**
 * Formats an amount with smart decimals
 * - Whole numbers: no decimals (2000 → "2 000")
 * - Decimals: up to 3 decimals, no trailing zeros (2000.50 → "2 000,5")
 * 
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted amount string
 */
export function formatAmountSmart(amount) {
    if (!amount && amount !== 0) return '0';

    const num = typeof amount === 'string'
        ? parseFloat(amount.replace(/\s/g, ''))
        : Number(amount);

    if (isNaN(num)) return 'Invalid amount';

    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    }).format(num);
}
