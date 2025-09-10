import database from "../config/database";
import generateId from "../services/GenerateId";
import { isValidEmail } from "../middleware/validator";
import { BcryptHasher } from "../utils/PasswordHasher";
import { generateUserToken } from "../services/GenerateUserToken";
import { GmailEmailSender } from "../services/emailService";
import { NotificationFactory } from "../services/notificationFactory";
import logger from "../utils/Logger";


type UserType = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    employeeId: string,
    role: UserRole,
}

type UserRole = 'invoice_manager' | 'admin' | 'dfc_agent';

type EntityType = 'invoice' | 'employee';


class User {

    private id: string | null = null;
    private firstName: string | null = null;
    private lastName: string | null = null;
    private email: string | null = null;
    private password: string | null = null;
    private hash: string | null = null;
    private employeeId: string | null = null;
    private  role: UserRole = null;
    private entity: EntityType = null;

    constructor (entity: EntityType) {
        this.entity = entity;
    }

    async createUser(userData: User): Promise<unknown> {
        const {firstName, lastName, email, password, employeeId, role} = userData as unknown as {
            firstName: string,
            lastName: string,
            email: string,
            password: string,
            employeeId: string,
            role: UserRole,
        };
        try {

            this.id = await generateId(this.entity);

            if (this.id && this.id.length > 0 && isValidEmail(email)) {

                this.firstName = firstName;
                this.lastName = lastName;
                this.email = email;
                this.password = password;
                this.hash = await BcryptHasher.hash(password);
                this.employeeId = employeeId;
                this.role = role || 'invoice_manager';
                const result: unknown = await database.execute(
                    "INSERT INTO employee(id, firstname, lastname, email, password, employee_cmdt_id, role) VALUES(?,?,?,?,?,?,?)",
                    [this.id, this.firstName, this.lastName, this.email, this.hash, this.employeeId, this.role]
                );

                await logger.audit({
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

    async findUser(target: string, findType: 'email' | 'id' = 'id') {
        try {
            const focus = findType === 'email' ? 'email' : 'id'
            const user = await database.execute(`SELECT * FROM employee WHERE ${focus} = ? `, [target]);
            return user;
        } catch (error) {
            console.log("Une erreur inatendue est survenue");
            throw error;
        }
        
    }

    
}