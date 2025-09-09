import jwt from "jsonwebtoken";

type TokenPlayLoad = {
    sup: string,
    email: string,
    role: 'invoice_manager' | 'dfc_agent' | 'admin',
    exp: number, // Date d'expiration du token
    ait: number, // Date d'emission du token
}

type JWTOption = {
    expireIn: string
}

const JWT_SECRET = process.env.JWT_SECRET_KEY;

export function generateUserToken(playload: TokenPlayLoad, option: JWTOption = {expireIn: '1h'}): string {
    return jwt.sign(playload, JWT_SECRET, option);
}

export function verifyUserToken(playload: TokenPlayLoad): TokenPlayLoad {
    return jwt.sign(playload, JWT_SECRET) as TokenPlayLoad;
}