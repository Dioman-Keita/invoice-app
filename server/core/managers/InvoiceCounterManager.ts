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
     * Récupère le dernier numéro de facture utilisé pour une année fiscale
     */
    async getLastInvoiceNumber(fiscalYear: string): Promise<number> {
        return this.getCurrentCounter(fiscalYear);
    }

    /**
     * Vérifie si un numéro de séquence est disponible
     */
    async isSequenceAvailable(fiscalYear: string, sequenceNumber: number): Promise<boolean> {
        const current = await this.getCurrentCounter(fiscalYear);
        return sequenceNumber > current;
    }
}