import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { UserDto, ActivityType } from "../types/dto/UserDto";


if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not set");
}

const JWT_SECRET: Secret = process.env.JWT_SECRET_KEY;

export function generateUserToken(playload: UserDto, option: SignOptions = { expiresIn: '1h' }): string {
    return jwt.sign(playload, JWT_SECRET, option);
}

export function verifyUserToken(playload: string): UserDto {
    return jwt.verify(playload, JWT_SECRET) as UserDto;
}


export function generateRefreshToken(playload: { id: string }): string {
    return jwt.sign(playload, JWT_SECRET, { expiresIn: '7d'});
}
