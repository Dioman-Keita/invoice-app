import database from "../config/database";
import idGenerator, { EntityType } from "../core/generators/IdGenerator";
import { isValidEmail, isValidPasswordStrength } from "../middleware/validator";
import { BcryptHasher } from "../utils/PasswordHasher";
import { generateUserToken } from "../services/userToken";
import { GmailEmailSender } from "../services/emailService";
import { NotificationFactory } from "../services/notificationFactory";
import { getSetting } from "../helpers/settings";
import logger from "../utils/Logger";
import { auditLog } from "../utils/auditLogger";
import { UserType, LoginCredentials, User, UserRole, DBError } from "../types";
import { VerifyCredentialsResult } from "../types/responses/auth";


export class UserModel {
    private id: string | null = null;
    private firstName: string | null = null;
    private lastName: string | null = null;
    private email: string | null = null;
    private hash: string | null = null;
    private employeeId: string | null = null;
    private role: UserRole | null = null;
    private phone: string | null = null;
    private department: string | null = null;
    private entity: EntityType;

    constructor(entity: EntityType) {
        this.entity = entity;
    }

    private async sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
        if (!this.email || !this.firstName || !this.lastName) {
            logger.warn("Envoi email échoué : données manquantes", { email: this.email });
            return { success: false, error: 'Données utilisateur manquantes' };
        }

        const token = generateUserToken({
            sup: this.id as string,
            email: this.email,
            role: this.role as UserRole,
            activity: 'SIGN_UP'
        });


        const verifyLink = `http://localhost:3000/api/open-app?path=verify&token=${encodeURIComponent(token)}`;

        const template = NotificationFactory.create('register', {
            name: `${this.firstName} ${this.lastName}`,
            email: this.email,
            link: verifyLink,
            token,
        });

        const sender = new GmailEmailSender();

        const MAX_ATTEMPTS = 3;
        const RETRY_DELAY = 2000; // en ms
        const TIMEOUT = 20000; // en ms

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                logger.info(`Tentative d'envoi d'email #${attempt}`, { email: this.email });

                // Timeout explicite avec message clair
                await Promise.race([
                    sender.send({ to: this.email, name: `${this.firstName} ${this.lastName}` }, template),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout_email')), TIMEOUT)
                    )
                ]);

                logger.info('Email envoyé avec succès', { email: this.email, attempt });
                return { success: true };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

                // Messages user-friendly constants
                let userFriendlyError = 'Échec de l’envoi de l’email';
                if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('smtp')) {
                    userFriendlyError = 'Connexion réseau lente ou instable';
                } else if (errorMessage.includes('Timeout_email')) {
                    userFriendlyError = 'Délai d’attente dépassé pour l’email';
                }

                logger.warn(`Échec tentative #${attempt} d'envoi d'email`, {
                    email: this.email,
                    error: errorMessage,
                    attempt
                });

                if (attempt < MAX_ATTEMPTS) {
                    // Attente progressive avant la prochaine tentative
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
                } else {
                    // Dernière tentative échouée → rejet clair
                    logger.error('Échec définitif de l’envoi de l’email', { email: this.email });
                    return { success: false, error: userFriendlyError };
                }
            }
        }

        // Cas très improbable, mais couverture complète
        return { success: false, error: 'Échec de l’envoi après plusieurs tentatives' };
    }


    async create(userData: UserType): Promise<{ success: boolean; message: string; field?: string; userId?: string }> {
        const conn = await database.getConnection();
        try {
            await conn.beginTransaction();

            const { firstName, lastName, email, password, employeeId, role, phone, department } = userData;

            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.employeeId = employeeId;
            this.role = role;
            this.phone = phone;
            this.department = department;
            const fiscalYear = await getSetting('fiscal_year');

            if (!isValidEmail(this.email)) return { success: false, message: "Email invalide", field: "email" };
            if (!isValidPasswordStrength(password)) return { success: false, message: "Mot de passe trop faible", field: "password" };

            const isExistingUser = await database.execute(
                "SELECT 1 FROM employee WHERE email = ?",
                [this.email]
            );
            if (Array.isArray(isExistingUser) && isExistingUser.length > 0) {
                return {
                    success: false,
                    message: 'Cet email est déjà utiliser. Veuillez en choisir un autre.',
                    field: 'email',
                }
            }
            const isExistingEmployeeId = await database.execute(
                "SELECT 1 FROM employee WHERE employee_cmdt_id = ?",
                [this.employeeId]
            )
            if (Array.isArray(isExistingEmployeeId) && isExistingEmployeeId.length > 0) {
                return {
                    success: false,
                    message: 'Cet identifiant employé est déjà utiliser. Veuillez en choisir un autre.',
                    field: 'employeeId',
                }
            }
            const isExistingEmployeePhone = await database.execute(
                "SELECT 1 FROM employee WHERE phone = ?",
                [this.phone]
            )
            if (Array.isArray(isExistingEmployeePhone) && isExistingEmployeePhone.length > 0) {
                return {
                    success: false,
                    message: 'Ce numéro de téléphone est déjà utiliser. Veuillez en choisir un autre.',
                    field: 'phone',
                }
            }

            this.id = await idGenerator.generateId(this.entity);
            this.hash = await BcryptHasher.hash(password);

            // 1️⃣ Insertion dans pending_verification
            await conn.execute(
                "INSERT INTO pending_verification(id, firstname, lastname, email, password, employee_cmdt_id, role, phone, department, fiscal_year) VALUES(?,?,?,?,?,?,?,?,?,?)",
                [this.id, this.firstName, this.lastName, this.email, this.hash, this.employeeId, this.role, this.phone, this.department, fiscalYear]
            );

            // 2️⃣ Envoi de l'email
            const emailResult = await this.sendVerificationEmail();
            if (!emailResult.success) {
                await conn.execute("DELETE FROM pending_verification WHERE id = ?", [this.id]);
                await conn.commit();
                return { success: false, message: `Échec de l'envoi de l'email: ${emailResult.error}`, field: "email" };
            }

            // 3️⃣ Transfert vers employee
            await conn.execute(`
                INSERT INTO employee(id, firstname, lastname, email, password, employee_cmdt_id, role, phone, department, fiscal_year)
                SELECT id, firstname, lastname, email, password, employee_cmdt_id, role, phone, department, fiscal_year
                FROM pending_verification WHERE id = ?
            `, [this.id]);

            await conn.execute("DELETE FROM pending_verification WHERE id = ?", [this.id]);
            await conn.commit();

            return { success: true, message: "Utilisateur créé et email envoyé avec succès.", userId: this.id };

        } catch (error) {
            await conn.rollback();
            logger.error("Erreur création utilisateur", { error });
            return { success: false, message: "Erreur interne. Veuillez réessayer plus tard." };
        } finally {
            conn.release();
        }
    }



    async findUser(target: string, findType: 'email' | 'id' = 'id'): Promise<User[]> {
        try {
            let query: string;
            let params: unknown[];

            if (findType === 'email') {
                query = "SELECT * FROM employee WHERE email = ? LIMIT 1";
                params = [target];
            } else {
                query = "SELECT * FROM employee WHERE id = ? LIMIT 1";
                params = [target];
            }

            const result = await database.execute<User[] | User>(query, params);
            let userRows = (Array.isArray(result) ? result : (result ? [result] : [])) as User[];

            // ✅ GARANTIR que c'est toujours un tableau
            // userRows est déjà normalisé
            if (userRows.length > 0) {
                await auditLog({
                    action: 'SELECT',
                    table_name: 'employee',
                    performed_by: userRows[0].id,
                    record_id: userRows[0].id
                });
            }

            return userRows;

        } catch (error) {
            logger.error("Erreur dans findUser", {
                target,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    async verifyCredentials(data: LoginCredentials): Promise<VerifyCredentialsResult> {
        try {
            // Validation basique
            if (!data.email || !data.password) {
                return null;
            }

            if (!isValidEmail(data.email) || !isValidPasswordStrength(data.password)) {
                return null;
            }
            // Verification du statut de l'utilisateur
            const result = await database.execute<{ isActive: 0 | 1 | Array<{ isActive: 0 | 1 }> }>('SELECT isActive FROM employee WHERE LOWER(email) = LOWER(?) AND role = ? AND isVerified = 1 LIMIT 1', [data.email, data.role]);
            const isActive = Array.isArray(result) ? result[0].isActive : result.isActive;
            if (isActive === 0) {
                return { error: "Vous avez été desactivé par un administrateur" }
            }

            // Requête sécurisée - comparaison insensible à la casse
            const rows = await database.execute(
                "SELECT id, email, password, role, isVerified FROM employee WHERE LOWER(email) = LOWER(?) AND isVerified = 1 AND isActive = 1 AND role = ? LIMIT 1",
                [data.email.trim(), data.role]
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
            const dbError = error as DBError;
            const errorMessage = dbError.message || 'Unknown error';
            const errorCode = dbError.code || dbError.errno;

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
                return { error: 'DATABASE_CONNECTION_ERROR' };
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