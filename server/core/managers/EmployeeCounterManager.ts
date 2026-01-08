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
     * Retrieves the last employee number used for a fiscal year
     */
    async getLastEmployeeNumber(fiscalYear: string): Promise<number> {
        return this.getCurrentCounter(fiscalYear);
    }
}