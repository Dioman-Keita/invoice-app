import jwt, { Secret, SignOptions } from "jsonwebtoken";

export type ActivityType = 
| 'SIGN_UP'
| 'LOGIN' 
| 'LOGOUT'
| 'UPDATE_PASSWORD'
| 'RESET_PASSWORD'
| 'SEND_PASSWORD_RESET_EMAIL'
| 'REFRESH_SESSION'
| 'SUBMIT_INVOICE'
| 'VALIDATE_INVOICE'
| 'UPDATE_EMPLOYEE_ID'
| 'VIEW_PROFILE'
| 'UPDATE_PROFILE'
| 'REFRESH_PROFILE';

export type TokenPlayload = {
    sup: string, // identifiant de l'utilisateur
    email: string,
    role: 'invoice_manager' | 'dfc_agent' | 'admin',
    activity: ActivityType,
    exp?: number, // Date d'expiration du token
    iat?: number, // Date d'emission du token
}


if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not set");
}

const JWT_SECRET: Secret = process.env.JWT_SECRET_KEY;

export function generateUserToken(playload: TokenPlayload, option: SignOptions = { expiresIn: '1h' }): string {
    return jwt.sign(playload, JWT_SECRET, option);
}

export function verifyUserToken(playload: string): TokenPlayload {
    return jwt.verify(playload, JWT_SECRET) as TokenPlayload;
}


export function generateRefreshToken(playload: { id: string }): string {
    return jwt.sign(playload, JWT_SECRET, { expiresIn: '7d'});
}
