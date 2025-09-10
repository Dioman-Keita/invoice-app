import jwt, { Secret, SignOptions } from "jsonwebtoken";

type TokenPlayLoad = {
    sup: string, // identifiant de l'utilisateur
    email: string,
    role: 'invoice_manager' | 'dfc_agent' | 'admin',
    exp?: number, // Date d'expiration du token
    ait?: number, // Date d'emission du token
}

type JWTOption = {
    expiresIn: string
}

if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not set");
}

const JWT_SECRET: Secret = process.env.JWT_SECRET_KEY;

export function generateUserToken(playload: TokenPlayLoad, option: SignOptions = { expiresIn: '1h' }): string {
    return jwt.sign(playload, JWT_SECRET, option);
}

export function verifyUserToken(playload: string): TokenPlayLoad {
    return jwt.verify(playload, JWT_SECRET) as TokenPlayLoad;
}

export function generateRefreshToken(playload: { id: string }): string {
    return jwt.sign(playload, JWT_SECRET, { expiresIn: '1d' });
}
