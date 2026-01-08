// ----------------------
// Helpers for account number validation
// ----------------------
export function normalizeAccountNumber(input: string): string {
    return input.replace(/[\s\-_]+/g, '').toUpperCase().trim();
}

export function isValidAccountNumber(input: string): boolean {
    const s = normalizeAccountNumber(input);
    if (!s) return false;

    // Alphanumeric only
    if (!/^[A-Z0-9]+$/.test(s)) return false;

    // Reasonable length: 6 to 34 characters
    if (s.length < 6 || s.length > 34) return false;

    // Avoid repetitive strings (e.g., 111111, 000000)
    if (/^([0-9A-Z])\1{5,}$/.test(s)) return false;

    return true;
}

export function formatAccountCanonical(input: string): string {
    return normalizeAccountNumber(input);
}