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

    async create(userData: UserType): Promise<unknown> {
        const {firstName, lastName, email, password, employeeId, role, phone} = userData;
        try {

            this.id = await generateId(this.entity);
            if (!isValidEmail(email) || !isValidPasswordStrength(password)) {
                return null;
            }
            const ok = true;
            if(ok) {
                const user: User[] = await database.execute("SELECT * FROM employee WHERE email = ? LIMIT 1", [email]);
                if(user && user.length > 0) {
                    return null;
                }
            }
            if (this.id && this.id.length > 0 && ok) {

                this.firstName = firstName;
                this.lastName = lastName;
                this.email = email;
                this.hash = await BcryptHasher.hash(password);
                this.employeeId = employeeId;
                this.role = role || 'invoice_manager';
                this.phone = phone;
                const result: unknown = await database.execute(
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

                const token = generateUserToken({
                    sup: this.id as string,
                    email: this.email as string,
                    role: this.role as UserRole,
                });

                UserModel.token = token ? token : null;

                const verifyLinkBase = process.env.APP_URL || "http://localhost:5173";
                const verifyLink = `${verifyLinkBase}/verify?token=${encodeURIComponent(token)}`;
                const template = NotificationFactory.create('register', {
                    name: `${this.firstName} ${this.lastName}`,
                    email: this.email as string,
                    link: verifyLink,
                    token,
                });

                const sender = new GmailEmailSender();
                await sender.send({ to: this.email as string, name: `${this.firstName} ${this.lastName}` }, template);

                logger.info(`Envoie d'un email de connexion à l'utilisateur ${firstName} ${lastName}`);
                return result;
            } else {
                console.log("Une erreur interne est survenue");
                return;
            }
            
        } catch (error) {
            logger.error("Erreur lors de la création de l'utilisateur", { firstName: this.firstName, lastName: this.lastName, id: this.id, employeeId: this.employeeId, error });
            throw error;
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