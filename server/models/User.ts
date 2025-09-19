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
export type User = UserType & { id: string, create_at: string, update_at: string};
export type UserRole = 'invoice_manager' | 'admin' | 'dfc_agent';



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

    constructor (entity: EntityType) {
        this.entity = entity;
    }

    async create(userData: UserType): Promise<{success: boolean, message: string, field?: string, userId?: string}> {
        const conn = await database.getConnection();
        await conn.beginTransaction();
        const {firstName, lastName, email, password, employeeId, role, phone} = userData;
        try {

            this.id = await generateId(this.entity);
            if (!isValidEmail(email) || !isValidPasswordStrength(password)) {
                return {
                    success: false,
                    message: "Email ou mot de passe invalide",
                    field: "email or password",
                    userId: this.id
                };
            }

            const existingUser: User[] = await database.execute("SELECT * FROM employee WHERE email = ? LIMIT 1", [email]);
            if(existingUser && existingUser.length > 0) {
                return {
                    success: false,
                    message: "Cet email est déjà utilisé",
                    field: "email",
                    userId: this.id
                };
            }

            const existingEmployeeId: User[] = await database.execute(
                "SELECT * FROM employee WHERE employee_cmdt_id = ? LIMIT 1",
                [employeeId]
            );

            if(existingEmployeeId && existingEmployeeId.length > 0) {
                return {
                    success: false,
                    message: "Cet identifiant CMDT est déjà utilisé",
                    field: "empployeeId",
                    userId: this.id
                }
            }

            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.hash = await BcryptHasher.hash(password);
            this.employeeId = employeeId;
            this.role = role || 'invoice_manager';
            this.phone = phone;

            const token = generateUserToken({
                sup: this.id as string,
                email: this.email as string,
                role: this.role as UserRole,
            });

            UserModel.token = token ?? null;

            const verifyLinkBase = process.env.APP_URL || "http://localhost:5173";
            const verifyLink = `${verifyLinkBase}/verify?token=${encodeURIComponent(token)}`;
            const template = NotificationFactory.create('register', {
                name: `${this.firstName} ${this.lastName}`,
                email: this.email as string,
                link: verifyLink,
                token,
            });

            // Tentative d'envoi d'email
            const sender = new GmailEmailSender();
            let emailSent = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    await sender.send({ to: this.email as string, name: `${this.firstName} ${this.lastName}` }, template);
                    emailSent = true;
                    break;
                } catch (err) {
                    logger.warn("L'utilisateur a été créé  mais l'envoie d'e-mail a échoué", {
                        email: this.email,
                        error: err instanceof Error ? err.message : err
                    });
                    await new Promise(res => setTimeout(res, 2000)); // pause 2s
                }
            }

            if(!emailSent) {
                await conn.rollback();
                return {
                    success: false,
                    message: "L'envoi de l'e-mail a échoué après plusieurs tentatives. L'utilisateur n'a pas été enregistré."
                }
            }

            // Enregistrement en base après succès de l'email
            await database.execute(
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
            logger.info(`Envoie d'un email de connexion à l'utilisateur ${firstName} ${lastName}`);
            return {
                success: true,
                message: "Utilisateur créé et email envoyé avec succès.",
                userId: this.id
            };
            
        } catch (error) {
            await conn.rollback();
            logger.error("Erreur lors de la création de l'utilisateur", {
                firstName: this.firstName,
                lastName: this.lastName,
                id: this.id,
                employeeId: this.employeeId,
                error
            });
            return {
                success: false,
                message: "Une erreur interne est survenue. Veuillez réessayer plus tard."
            };
        }
        
    }

    async findUser(target: string, findType: 'email' | 'id' = 'id'): Promise<User[]> {
        try {
            const focus = findType === 'email' ? 'email' : 'id'
            const user = await database.execute(`SELECT * FROM employee WHERE ${focus} = ? LIMIT 1`, [target]);
            await auditLog({
                action: 'SELECT',
                table_name: 'employee',
                performed_by: target,
                record_id: target
            })
            return user;
        } catch (error) {
            console.log("Une erreur inatendue est survenue");
            throw error;
        }
    }
    async verifyCredentials(data: LoginType): Promise<{id: string, email: string, role: UserRole} | null> {
        if (!isValidEmail(data.email) && !isValidPasswordStrength(data.password)) return null;

        const rows = await database.execute(
            "SELECT id, email, password, role FROM employee WHERE email = ? LIMIT 1",
            [data.email]
        ) as any[];

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

}

const User = new UserModel('employee');
export default User;