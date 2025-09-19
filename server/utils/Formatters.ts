export function formatDate(date: string): string {
    const [day, month, year] = date.split('/');
    const iso = new Date(`${year}-${month}-${day}`);
    if (isNaN(iso.getTime())) throw new Error("Date invalide");
    return iso.toISOString().split('T')[0]; // → "2025-09-18"
}
