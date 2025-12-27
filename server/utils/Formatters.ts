export function formatDate(date: string): string {
    if (!date) return '';

    // Si c'est déjà au format ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }

    // Si c'est au format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Fallback: essayer de parser avec Date
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    throw new Error("Date invalide: " + date);
}
