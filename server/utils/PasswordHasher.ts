import  bcrypt from 'bcrypt';

export interface PasswordHasher {
    hash(password: string): Promise<string>;
    verify(password: string, hash: string): Promise<boolean>;
}

export const BcryptHasher: PasswordHasher = {
    hash: async (password) => bcrypt.hash(password, 12),
    verify: async (password, hash) => bcrypt.compare(password, hash)
}

