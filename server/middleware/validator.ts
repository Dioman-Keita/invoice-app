import isEmail from 'validator/lib/isEmail';

export function isValidEmail(email: string): boolean {
    return isEmail(email);
}