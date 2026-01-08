export function formatDate(date: string): string {
    if (!date) return '';

    // If it's already in ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }

    // If it's in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Fallback: try to parse with Date
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    throw new Error("Invalid date: " + date);
}
