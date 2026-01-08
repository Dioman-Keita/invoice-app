import { FiscalCounterManager } from "./FiscalCounterManager";

export class InvoiceCounterManager extends FiscalCounterManager {
    protected getCounterTable(): string {
        return "fiscal_year_counter";
    }

    protected getCounterField(): string {
        return "last_cmdt_number";
    }

    protected getEntityName(): string {
        return "invoice";
    }

    /**
     * Retrieves the last invoice number used for a fiscal year
     */
    async getLastInvoiceNumber(fiscalYear: string): Promise<number> {
        return this.getCurrentCounter(fiscalYear);
    }

    /**
     * Checks if a sequence number is available
     */
    async isSequenceAvailable(fiscalYear: string, sequenceNumber: number): Promise<boolean> {
        const current = await this.getCurrentCounter(fiscalYear);
        return sequenceNumber > current;
    }
}