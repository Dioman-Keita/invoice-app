/**
 * Formats an amount with smart decimals
 * - Whole numbers: no decimals (2000 → "2 000")
 * - Decimals: up to 3 decimals, no trailing zeros (2000.50 → "2 000,5")
 * 
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted amount string
 */
export function formatAmountSmart(amount) {
    if (amount === undefined || amount === null || amount === '') return '0';

    // CORRECTION : On s'assure de convertir en String, 
    // on vire les espaces ET on remplace la virgule par un point
    // pour que JavaScript puisse comprendre le nombre.
    const cleanString = amount.toString().replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleanString);

    if (isNaN(num)) return 'Invalid amount';

    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    }).format(num);
}