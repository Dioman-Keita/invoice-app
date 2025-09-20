import database from "../config/database";
import generateId, { EntityType } from "../services/generateId";
import { isValidEmail, isValidPasswordStrength } from "../middleware/validator";
import { BcryptHasher } from "../utils/PasswordHasher";
import { generateUserToken } from "../services/userToken";
import { GmailEmailSender } from "../services/emailService";
import { NotificationFactory } from "../services/notificationFactory";
import logger from "../utils/Logger";
import { auditLog } from "../utils/auditLogger";

export type UserType = {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    employeeId: string,
    role: UserRole,
    phone: string,
    department: string,
}

export type LoginType = {
    email: string,
    password: string,
}
export type User = UserType & { id: string, create_at: string, update_at: string, isVerified: 0 | 1 };
export type UserRole = 'invoice_manager' | 'admin' | 'dfc_agent';

// Configuration des tentatives d'envoi d'email
const EMAIL_CONFIG = {
    MAX_ATTEMPTS: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 10000,
};

export class UserModel {
    private id: string | null = null;
    private firstName: string | null = null;
    private lastName: string | null = null;
    private email: string | null = null;
    private hash: string | null = null;
    private employeeId: string | null = null;
    private role: UserRole | null = null;
    private phone: string | null = null;
    private entity: EntityType;
    public static token: string | null = null;

    constructor(entity: EntityType) {
        this.entity = entity;
    }

    private async sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
        if (!this.email || !this.firstName || !this.lastName) {
            return { success: false, error: 'Données utilisateur manquantes pour l\'envoi d\'email' };
        }

        try {
            const token = generateUserToken({
                sup: this.id as string,
                email: this.email,
                role: this.role as UserRole,
            });

            UserModel.token = token;

            const verifyLinkBase = process.env.APP_URL || "http://localhost:5173";
            const verifyLink = `${verifyLinkBase}/verify?token=${encodeURIComponent(token)}`;
            
            const template = NotificationFactory.create('register', {
                name: `${this.firstName} ${this.lastName}`,
                email: this.email,
                link: verifyLink,
                token,
            });

            const sender = new GmailEmailSender();
            
            for (let attempt = 1; attempt <= EMAIL_CONFIG.MAX_ATTEMPTS; attempt++) {
                try {
                    logger.info(`Tentative d'envoi d'email #${attempt}`, { email: this.email });
                    
                    const emailPromise = sender.send(
                        { to: this.email, name: `${this.firstName} ${this.lastName}` }, 
                        template
                    );
                    
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout lors de l\'envoi d\'email')), EMAIL_CONFIG.TIMEOUT)
                    );

                    await Promise.race([emailPromise, timeoutPromise]);
                    
                    logger.info('Email envoyé avec succès', { email: this.email, attempt });
                    return { success: true };
                    
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                    logger.warn(`Échec tentative #${attempt} d'envoi d'email`, {
                        email: this.email,
                        error: errorMessage,
                        attempt
                    });

                    if (attempt < EMAIL_CONFIG.MAX_ATTEMPTS) {
                        await new Promise(resolve => setTimeout(resolve, EMAIL_CONFIG.RETRY_DELAY * attempt));
                    } else {
                        throw new Error(`Échec après ${EMAIL_CONFIG.MAX_ATTEMPTS} tentatives: ${errorMessage}`);
                    }
                }
            }
            
            return { success: false, error: 'Toutes les tentatives ont échoué' };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi d\'email';
            logger.error('Erreur critique lors de l\'envoi d\'email', {
                email: this.email,
                error: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    }

    async create(userData: UserType): Promise<{success: boolean, message: string, field?: string, userId?: string}> {
        const conn = await database.getConnection();
        
        try {
            await conn.beginTransaction();
            
            const {firstName, lastName, email, password, employeeId, role, phone} = userData;

            // Validation des données
            if (!isValidEmail(email)) {
                await conn.rollback();
                return {
                    success: false,
                    message: "Email invalide",
                    field: "email"
                };
            }

            if (!isValidPasswordStrength(password)) {
                await conn.rollback();
                return {
                    success: false,
                    message: "Mot de passe trop faible",
                    field: "password",
                };
            }

            // Génération de l'ID
            this.id = await generateId(this.entity);
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.hash = await BcryptHasher.hash(password);
            this.employeeId = employeeId;
            this.role = role || 'invoice_manager';
            this.phone = phone;

            // Vérifications d'unicité - CORRECTION ICI
            const [existingUserRows]: [any[], any] = await conn.execute(
                "SELECT id FROM employee WHERE email = ? OR employee_cmdt_id = ? FOR UPDATE",
                [email, employeeId]
            );

            if (existingUserRows.length > 0) {
                const [existingEmailRows]: [any[], any] = await conn.execute(
                    "SELECT id FROM employee WHERE email = ?",
                    [email]
                );
                
                if (existingEmailRows.length > 0) {
                    await conn.rollback();
                    return {
                        success: false,
                        message: "Cet email est déjà utilisé",
                        field: "email",
                        userId: this.id
                    };
                }

                const [existingEmployeeIdRows]: [any[], any] = await conn.execute(
                    "SELECT id FROM employee WHERE employee_cmdt_id = ?",
                    [employeeId]
                );

                if (existingEmployeeIdRows.length > 0) {
                    await conn.rollback();
                    return {
                        success: false,
                        message: "Cet identifiant CMDT est déjà utilisé",
                        field: "employeeId",
                        userId: this.id
                    };
                }
            }

            // Tentative d'envoi d'email AVANT l'insertion en base
            const emailResult = await this.sendVerificationEmail();
            
            if (!emailResult.success) {
                await conn.rollback();
                return {
                    success: false,
                    message: `Échec de l'envoi de l'email de vérification: ${emailResult.error}`,
                    field: "email"
                };
            }

            // Insertion en base seulement si l'email est envoyé avec succès
            await conn.execute(
                "INSERT INTO employee(id, firstname, lastname, email, password, employee_cmdt_id, role, phone) VALUES(?,?,?,?,?,?,?,?)",
                [this.id, this.firstName, this.lastName, this.email, this.hash, this.employeeId, this.role, this.phone]
            );

            await auditLog({
                action: 'INSERT',
                table_name: 'employee',
                record_id: this.id,
                description: `Création de l'employé ${this.firstName} ${this.lastName}`,
                performed_by: this.id,
            });

            await conn.commit();
            
            logger.info('Utilisateur créé avec succès', {
                userId: this.id,
                email: this.email,
                role: this.role
            });

            return {
                success: true,
                message: "Utilisateur créé et email de vérification envoyé avec succès.",
                userId: this.id
            };
            
        } catch (error) {
            await conn.rollback();
            
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            
            logger.error("Erreur lors de la création de l'utilisateur", {
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                employeeId: this.employeeId,
                error: errorMessage
            });

            return {
                success: false,
                message: "Une erreur interne est survenue. Veuillez réessayer plus tard."
            };
        } finally {
            await conn.release();
        }
    }

    async findUser(target: string, findType: 'email' | 'id' = 'id'): Promise<User[]> {
        try {
            const focus = findType === 'email' ? 'email' : 'id'
            const [userRows]: [any[], any] = await database.execute(`SELECT * FROM employee WHERE ${focus} = ? LIMIT 1`, [target]);
            await auditLog({
                action: 'SELECT',
                table_name: 'employee',
                performed_by: target,
                record_id: target
            })
            return userRows;
        } catch (error) {
            console.log("Une erreur inatendue est survenue");
            throw error;
        }
    }

    async verifyCredentials(data: LoginType): Promise<{id: string, email: string, role: UserRole} | null> {
        if (!isValidEmail(data.email) && !isValidPasswordStrength(data.password)) return null;

        const [rows]: [any[], any] = await database.execute(
            "SELECT id, email, password, role FROM employee WHERE email = ? LIMIT 1",
            [data.email]
        );

        await auditLog({
            action: 'SELECT',
            table_name: 'employee',
            record_id: data.email,
            performed_by: data.email
        })

        if (!rows || rows.length === 0) return null;
        const user = rows[0];

        const ok = await BcryptHasher.verify(data.password, user.password);
        if (!ok) return null;

        return {id: user.id, email: user.email, role: user.role}
    }

    async updateVerificationStatus(userId: string, isVerified: 1 | 0): Promise<{ success: boolean, error?: Error | unknown }> {
        try {
            await database.execute(
                "UPDATE employee SET isVerified = ? WHERE id = ?",
                [isVerified, userId]
            );
            await auditLog({
                table_name: 'employee',
                action: 'UPDATE',
                description: `Mise à jour du status de verification de l'utilisateur ${userId} à ${isVerified}`,
                record_id: userId,
                performed_by: userId
            })
            return { success: true };
        } catch (error) {
            logger.error("Erreur lors de la mise à jour du statut de vérification", { error });
            return { success: false, error };
        }
    }
}

const User = new UserModel('employee');
export default User;