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
export type User = UserType & { id: string, create_at: string, update_at: string, isVerified: 0 | 1, isActive: 0 | 1 };
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

    constructor(entity: EntityType) {
        this.entity = entity;
    }

    private async sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
        if (!this.email || !this.firstName || !this.lastName) {
            return { success: false, error: 'Données utilisateur manquantes' };
        }
    
        try {
            const token = generateUserToken({
                sup: this.id as string,
                email: this.email,
                role: this.role as UserRole,
            });
            
            const verifyLinkBase = process.env.APP_URL || "http://localhost:5173";
            const verifyLink = `${verifyLinkBase}/verify?token=${encodeURIComponent(token)}`;
            
            const template = NotificationFactory.create('register', {
                name: `${this.firstName} ${this.lastName}`,
                email: this.email,
                link: verifyLink,
                token,
            });
    
            const sender = new GmailEmailSender();
            
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    logger.info(`Tentative d'envoi d'email #${attempt}`, { email: this.email });
                    
                    // ✅ Timeout court pour éviter les blocages
                    await Promise.race([
                        sender.send({ to: this.email, name: `${this.firstName} ${this.lastName}` }, template),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout email')), 20000))
                    ]);
                    
                    logger.info('Email envoyé avec succès', { email: this.email, attempt });
                    return { success: true };
                    
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                    
                    // ✅ Message d'erreur plus user-friendly
                    let userFriendlyError = "Problème de connexion";
                    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('smtp')) {
                        userFriendlyError = "Connexion lente ou instable";
                    } else if (errorMessage.includes('Timeout')) {
                        userFriendlyError = "Temps d'attente dépassé";
                    }
    
                    logger.warn(`Échec tentative #${attempt} d'envoi d'email`, {
                        email: this.email,
                        error: errorMessage,
                        attempt
                    });
    
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    } else {
                        throw new Error(userFriendlyError);
                    }
                }
            }
            
            return { success: false, error: 'Échec après plusieurs tentatives' };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.error('Erreur lors de l\'envoi d\'email', {
                email: this.email,
                error: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    }

    private async cleanupUserAfterEmailFailure(userId: string): Promise<boolean> {
        const conn = await database.getConnection();
        
        try {
            await conn.beginTransaction();
            
            // Désactiver les contraintes FK pour cette session
            await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
            
            // 1. Supprimer les logs d'audit associés
            await conn.execute(
                "DELETE FROM audit_log WHERE performed_by = ? OR record_id = ?",
                [userId, userId]
            );
            
            // 2. Supprimer l'utilisateur
            await conn.execute(
                "DELETE FROM employee WHERE id = ?",
                [userId]
            );
            
            // Réactiver les contraintes
            await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
            
            await conn.commit();
            
            logger.info("Nettoyage utilisateur réussi après échec email", { userId });
            return true;
            
        } catch (error) {
            await conn.rollback();
            
            // S'assurer que FOREIGN_KEY_CHECKS est réactivé
            try {
                await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
            } catch (fkError) {
                logger.error("Erreur réactivation contraintes FK", {
                    error: fkError instanceof Error ? fkError.message : 'Unknown error'
                });
            }
            
            logger.error("Échec nettoyage utilisateur après échec email", {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            return false;
        } finally {
            await conn.release();
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
                return { success: false, message: "Email invalide", field: "email" };
            }
    
            if (!isValidPasswordStrength(password)) {
                await conn.rollback();
                return { success: false, message: "Mot de passe trop faible", field: "password" };
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
    
            // ✅ Vérification d'unicité d'abord (rapide)
            const [existingUserRows]: [any[], any] = await conn.execute(
                "SELECT id FROM employee WHERE email = ? OR employee_cmdt_id = ?",
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
    
            // ✅ Insertion avant l'envoi d'email (pour avoir l'ID)
            await conn.execute(
                "INSERT INTO employee(id, firstname, lastname, email, password, employee_cmdt_id, role, phone) VALUES(?,?,?,?,?,?,?,?)",
                [this.id, this.firstName, this.lastName, this.email, this.hash, this.employeeId, this.role, this.phone]
            );
    
            // ✅ COMMIT IMMÉDIAT pour libérer le lock
            await conn.commit();
    
            // ✅ Envoi d'email APRÈS le commit
            const emailResult = await this.sendVerificationEmail();
            
            if (!emailResult.success) {
                const cleanupSuccess = await this.cleanupUserAfterEmailFailure(this.id as string);
                
                if (!cleanupSuccess) {
                    // Fallback: marquer comme inactif
                    try {
                        await database.execute(
                            "UPDATE employee SET isVerified = 0, isActive = 0 WHERE id = ?",
                            [this.id]
                        );
                        logger.warn("Utilisateur marqué comme inactif après échec nettoyage", {
                            userId: this.id
                        });
                    } catch (fallbackError) {
                        logger.error("Échec marquage utilisateur inactif", {
                            userId: this.id,
                            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
                        });
                    }
                }
                
                return {
                    success: false,
                    message: `Échec de l'envoi de l'email de vérification: ${emailResult.error}`,
                    field: "email"
                };
            }
    
            // ✅ Audit log (hors transaction)
            try {
                await auditLog({
                    action: 'INSERT',
                    table_name: 'employee',
                    record_id: this.id,
                    description: `Création de l'employé ${this.firstName} ${this.lastName}`,
                    performed_by: this.id,
                });
            } catch (auditError) {
                logger.warn("Échec audit log après création utilisateur", {
                    userId: this.id,
                    error: auditError instanceof Error ? auditError.message : 'Unknown error'
                });
            }
    
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
            let query: string;
            let params: any[];
            
            if (findType === 'email') {
                query = "SELECT * FROM employee WHERE email = ? LIMIT 1";
                params = [target];
            } else {
                query = "SELECT * FROM employee WHERE id = ? LIMIT 1";
                params = [target];
            }
            
            const result = await database.execute(query, params);
            let userRows = result[0] as any[];
            
            // ✅ GARANTIR que c'est toujours un tableau
            if (!Array.isArray(userRows)) {
                if (userRows && typeof userRows === 'object') {
                    userRows = [userRows]; // Convertir l'objet en tableau
                } else {
                    userRows = [];
                }
            }
            
            await auditLog({
                action: 'SELECT',
                table_name: 'employee',
                performed_by: target,
                record_id: target
            });
            
            return userRows;
            
        } catch (error) {
            logger.error("Erreur dans findUser", {
                target,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    async verifyCredentials(data: LoginType): Promise<{id: string, email: string, role: UserRole} | null> {
        try {
            // Validation basique
            if (!data.email || !data.password) {
                return null;
            }
    
            if (!isValidEmail(data.email) || !isValidPasswordStrength(data.password)) {
                return null;
            }
    
            // Requête sécurisée - comparaison insensible à la casse
            const [rows]: [any[], any] = await database.execute(
                "SELECT id, email, password, role, isVerified FROM employee WHERE LOWER(email) = LOWER(?) AND isVerified = 1 AND isActive = 1 LIMIT 1",
                [data.email.trim()]
            );
            
            // Convertir l'objet en tableau si nécessaire
            let userRows = rows;
            if (!Array.isArray(rows)) {
                if (rows && typeof rows === 'object') {
                    userRows = [rows]; // Convertir l'objet en tableau
                } else {
                    userRows = [];
                }
            }
    
            // Vérification robuste des résultats
            if (!Array.isArray(userRows) || userRows.length === 0) {
                logger.warn("Tentative de connexion - utilisateur non trouvé", { email: data.email });
                return null;
            }
    
            const user = userRows[0];
            
            if (!user || typeof user !== 'object') {
                logger.warn("Format de données utilisateur invalide", { email: data.email });
                return null;
            }
    
            // Vérification que tous les champs nécessaires existent
            if (!user.password || !user.id || !user.email || !user.role) {
                logger.warn("Données utilisateur incomplètes", { 
                    email: data.email,
                    hasPassword: !!user.password,
                    hasId: !!user.id,
                    hasEmail: !!user.email,
                    hasRole: !!user.role
                });
                return null;
            }
    
            // Vérification du mot de passe
            const isPasswordValid = await BcryptHasher.verify(data.password, user.password);
            if (!isPasswordValid) {
                logger.warn("Tentative de connexion - mot de passe incorrect", { email: data.email });
                
                // Audit log avec l'ID utilisateur cette fois
                await auditLog({
                    action: 'SELECT',
                    table_name: 'employee',
                    record_id: user.id, // Utilisez l'ID
                    performed_by: user.id, // Utilisez l'ID au lieu de l'email
                    description: `Tentative de connexion avec mauvais mot de passe pour ${data.email}`
                });
                
                return null;
            }
    
            // Audit log de succès
            await auditLog({
                action: 'SELECT',
                table_name: 'employee',
                record_id: user.id,
                performed_by: user.id, // Utilisez l'ID au lieu de l'email
                description: `Connexion réussie pour ${data.email}`
            });
    
            logger.info("Connexion réussie", { userId: user.id, email: user.email });
            return {
                id: user.id,
                email: user.email,
                role: user.role
            };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorCode = (error as any)?.code || (error as any)?.errno;
            
            console.log('🔧 ERREUR - Message:', errorMessage);
            console.log('🔧 ERREUR - Code:', errorCode);
            
            // Vérifier si c'est une erreur de connexion à la base de données
            if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ETIMEDOUT' || 
                errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
                console.log('🔧 ERREUR - Erreur de connexion DB détectée');
                logger.error("Erreur de connexion à la base de données", { 
                    email: data.email, 
                    error: errorMessage,
                    code: errorCode
                });
                // Retourner un objet spécial pour indiquer une erreur de connexion
                return { error: 'DATABASE_CONNECTION_ERROR' } as any;
            }
            
            logger.error("Erreur critique dans verifyCredentials", { 
                email: data.email, 
                error: errorMessage,
                code: errorCode
            });
            return null;
        }
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