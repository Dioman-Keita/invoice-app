import isEmail from 'validator/lib/isEmail';
import type { Request } from 'express';

export function isValidEmail(email: string): boolean {
    return isEmail(email);
}

type PasswordType = {
    password: string,
    confirm_password: string,
}

export function isValidPassword(req: Request<unknown, unknown, PasswordType>): boolean {
    const { password, confirm_password } = req.body;
    return password === confirm_password;
}

export function isValidPasswordStrength(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[0-9]/.test(password) &&
           /[@$!%*?&]/.test(password);
}