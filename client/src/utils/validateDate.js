
/**
 * Cette fonction valide les dates au format JJ/MM/AAAA 
 * Elle n'accepte pas les dates dans le futur sauf si l'option allowedFutur est activéeS
 * 
 * @param {string} dateStr - date au format JJ/MM/AAAA
 * @param {object} option - {allowedFutur: boolean}
 * @returns {boolean}
 * @package cmdt
 * @author Niam
 */
export default function isValidateDate(dateStr, {allowedFutur = false} = {}) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if(!match) return false;

    const [, dayStr, monthStr, yearSrt] = match;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearSrt);

    const date = new Date(year, month - 1, day);
    const now = new Date();

    if(date.getDate() !== day || 
    date.getMonth() + 1 !== month || 
    date.getFullYear() !== year) return false;

    return allowedFutur ? true : date <= now;
}

export function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
}

// Normalise une saisie de date potentiellement collée (espaces, NBSP, tirets, points)
// et la reformate en JJ/MM/AAAA si possible, sinon renvoie la chaîne trimée.
export function normalizeDateInput(input) {
    if (typeof input !== 'string') return input;
    let s = input.replace(/\u00A0/g, ' ').trim();
    // Remplacer toute séquence non numérique par un slash
    s = s.replace(/[^0-9]+/g, '/');
    // Extraire 
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!m) return input.trim();
    let [, d, mth, y] = m;
    // Ne pas étendre l'année si elle n'a pas 4 chiffres pour éviter de valider trop tôt
    if (y.length !== 4) return input.trim();
    const day = String(parseInt(d, 10)).padStart(2, '0');
    const month = String(parseInt(mth, 10)).padStart(2, '0');
    const year = String(parseInt(y, 10));
    return `${day}/${month}/${year}`;
}
  