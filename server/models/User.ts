import database from "../config/database";
import generateId from "../services/generateId";
import { isValidEmail } from "../middleware/validator";
import { BcryptHasher } from "../utils/PasswordHasher";


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
        const {firstName, lastName, email, password, employeeId, role} = userData;
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
                const result: User = await database.execute("INSERT INTO employee(id, firstname, lastname, email, password, employee_cmdt_id, role", 
                                                    [this.id, this.firstName, this.lastName, this.email, this.password, this.employeeId, this.role]);
                return result;
            } else {
                console.log("Une erreur interne est survenue");
                return;
            }
            
        } catch (error) {
            console.log("Erreur lors de la création de l'utilisateur " + `${this.firstName} ${this.lastName} id : ${this.id} employeeId : ${this.employeeId}`);
            throw error;
        }
        
    }

    async findUser(target: string, findType: 'email' | 'id' = 'id') {
        try {
            const focus = findType === 'email' ? 'email' : 'id'
            const user: UserType[] = await database.execute(`SELECT * FROM employee WHERE ${focus} = ? `, [target]);
            return user;
        } catch (error) {
            console.log("Une erreur inatendue est survenue");
            throw error;
        }
        
    }

    
}