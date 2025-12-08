"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAccountNumber = normalizeAccountNumber;
exports.isValidAccountNumber = isValidAccountNumber;
exports.formatAccountCanonical = formatAccountCanonical;
// ----------------------
// Helpers for account number validation
// ----------------------
function normalizeAccountNumber(input) {
    return input.replace(/[\s\-_]+/g, '').toUpperCase().trim();
}
function isValidAccountNumber(input) {
    const s = normalizeAccountNumber(input);
    if (!s)
        return false;
    // Alphanumérique uniquement
    if (!/^[A-Z0-9]+$/.test(s))
        return false;
    // Longueur raisonnable : 6 à 34 caractères
    if (s.length < 6 || s.length > 34)
        return false;
    // Éviter chaînes répétitives (ex : 111111, 000000)
    if (/^([0-9A-Z])\1{5,}$/.test(s))
        return false;
    return true;
}
function formatAccountCanonical(input) {
    return normalizeAccountNumber(input);
}
