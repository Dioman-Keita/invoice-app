// core/managers/EmployeeCounterManager.ts
import { FiscalCounterManager } from "./FiscalCounterManager";

export class EmployeeCounterManager extends FiscalCounterManager {
    protected getCounterTable(): string {
        return "employee_fiscal_year_counter";
    }

    protected getCounterField(): string {
        return "last_employee_number";
    }

    protected getEntityName(): string {
        return "employés";
    }

    /**
     * Récupère le dernier numéro d'employé utilisé pour une année fiscale
     */
    async getLastEmployeeNumber(fiscalYear: string): Promise<number> {
        return this.getCurrentCounter(fiscalYear);
    }
}