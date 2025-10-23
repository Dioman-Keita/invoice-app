 export default function isValidateDate(
    dateStr: string,
    options?: { allowedFutur?: boolean }
): boolean;

export function parseDate(dateStr: string): Date | null;

export function normalizeDateInput(input: string): string;
