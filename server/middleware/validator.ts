import isEmail from 'validator/lib/isEmail';

export function isValidEmail(email: string): boolean {
    return isEmail(email);
}

export function isValidPassword(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
}

export function isValidPasswordStrength(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[0-9]/.test(password) &&
           /[@$!%*?&]/.test(password);
}