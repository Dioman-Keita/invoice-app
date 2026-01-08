
/**
 * This function validates dates in DD/MM/YYYY format
 * It does not accept future dates unless allowedFutur option is enabled
 * 
 * @param {string} dateStr - date in DD/MM/YYYY format
 * @param {object} option - {allowedFutur: boolean}
 * @returns {boolean}
 * @package cmdt
 * @author Niam
 */
export default function isValidateDate(dateStr, { allowedFutur = false } = {}) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return false;

    const [, dayStr, monthStr, yearSrt] = match;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearSrt);

    const date = new Date(year, month - 1, day);
    const now = new Date();

    if (date.getDate() !== day ||
        date.getMonth() + 1 !== month ||
        date.getFullYear() !== year) return false;

    if (!allowedFutur) return date <= now;

    const maxYearAllowed = now.getFullYear() + 2;
    const maxDateAllowed = new Date(maxYearAllowed, 11, 31, 23, 59, 59, 999);
    return date <= maxDateAllowed;
}

export function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
}

// Normalizes date input potentially pasted (spaces, NBSP, dashes, dots)
// and reformats it to DD/MM/YYYY if possible, otherwise returns the trimmed string.
export function normalizeDateInput(input) {
    if (typeof input !== 'string') return input;
    let s = input.replace(/\u00A0/g, ' ').trim();
    // Replace any non-numeric sequence with a slash
    s = s.replace(/[^0-9]+/g, '/');
    // Extraire 
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!m) return input.trim();
    let [, d, mth, y] = m;
    // Do not expand the year if it doesn't have 4 digits to avoid early validation
    if (y.length !== 4) return input.trim();
    const day = String(parseInt(d, 10)).padStart(2, '0');
    const month = String(parseInt(mth, 10)).padStart(2, '0');
    const year = String(parseInt(y, 10));
    return `${day}/${month}/${year}`;
}
