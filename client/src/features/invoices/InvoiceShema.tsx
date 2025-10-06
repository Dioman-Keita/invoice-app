import isValidateDate, { parseDate, normalizeDateInput } from '../../utils/validateDate';
import { z } from 'zod';

const allowedDocument = [
    "Connaissement",
    "Attestation de prise en charge",
    "Lettre de voiture Inter-Etats"
] as const;

const supplierNameRegex = /^[\p{L}\d\s\-']+$/u;
const fourDigitCode = z
  .string()
  .min(1, "Champ requis")
  .regex(/^\d{4}$/, "Doit contenir exactement 4 chiffres (ex. 0001)");

export const invoiceSchema = z.object({
    // Numéro de facture: 1 à 12 chiffres, zéros en tête autorisés
    invoice_num: z
    .string()
    .min(1, "Champ requis")
    .regex(/^\d{1,12}$/, "Doit contenir 1 à 12 chiffres"),
    num_cmdt: fourDigitCode,
    invoice_date: z
    .string()
    .min(1, "La date réelle de la facture est requie")
    .transform((s) => normalizeDateInput(String(s ?? '')))
    .superRefine((val, ctx) => {
        if (!val) return; // déjà géré par .min
        if (val.length < 10) {
            ctx.addIssue({ code: 'custom', message: "Format requis: JJ/MM/AAAA" });
            return;
        }
        if (!isValidateDate(val)) {
            ctx.addIssue({ code: 'custom', message: "Date invalide ou dans le futur" });
        }
    }),

    invoice_arrival_date: z
    .string()
    .min(1, "La date d'arrivée de la facture est requie")
    .transform((s) => normalizeDateInput(String(s ?? '')))
    .superRefine((val, ctx) => {
        if (!val) return;
        if (val.length < 10) {
            ctx.addIssue({ code: 'custom', message: "Format requis: JJ/MM/AAAA" });
            return;
        }
        if (!isValidateDate(val)) {
            ctx.addIssue({ code: 'custom', message: "Date invalide ou dans le futur" });
        }
    }),

    invoice_amount: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? "") // transforme undefined en ""
    .refine((val) => val.trim() !== "", {
        message: "Le montant est requis",
    })
    .refine((val) => /^\d+$/.test(val), {
        message: "Le montant doit être un entier positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100_000_000_000, {
        message: "Montant maximum autorisé : 100 000 000 000",
    }),

    supplier_name: z.string().min(1, "Le nom du fournisseur est requis").regex(supplierNameRegex, "Nom invalide : seuls les lettres accentuées(êèéï), chiffres(1,3,8), espaces( ), tirets(-) et apostrophes(') sont autorisés"),
    // Remplacement de l'email par le numéro de compte
    supplier_account_number: z
    .string()
    .min(1, "Le numéro de compte est requis")
    .regex(/^\d{12}$/, "Le numéro de compte doit contenir exactement 12 chiffres"),
    supplier_phone: z
    .string()
    .min(1, "Le numéro de téléphone est requis")
    .transform(v => (v ?? '').trim())
    .refine((v) => {
        if (v === '+223' || v === '+223 ') return false; // Rejette explicitement
        const phoneRegex = /^\+223(\s\d{2}){4}$/;
        return phoneRegex.test(v);
    }, {
        message: "Numéro invalide. Format requis : +223 XX XX XX XX"
    }),
    invoice_object: z.string().min(1, "L'objet est requis")
    .max(100, "Maximum 100 caractères"),

    invoice_nature: z.enum(["Paiement", "Acompte", "Avoir"], {
        error: "Type de facture invalide"
    }),

    invoice_type: z.enum(["Ordinaire", "Transporteur", "Transitaire"], {error: "Nature de la facture obligatoire"}),

    // Statut par défaut "Non"
    invoice_status: z.enum(["Oui", "Non"], {
        error: "Etat de la facture requis"
    }).default('Non'),

    folio: z.enum(["1 copie", "Orig + 1 copie", "Orig + 2 copies", "Orig + 3 copies"], {
        error: "Folio invalide"
    }),
    documents: z.array(z.enum(allowedDocument)).optional().transform(val => val?.filter(Boolean))

})
.refine((data) => {
    if (!isValidateDate(data.invoice_date) || !isValidateDate(data.invoice_arrival_date)) return true;
    const invoiceDate = parseDate(data.invoice_date);
    const arrivalDate = parseDate(data.invoice_arrival_date);
    if (!invoiceDate || !arrivalDate) return true;
    return arrivalDate.getTime() >= invoiceDate.getTime();
}, {
    path: ["invoice_arrival_date"],
    message: "La date d'arrivée doit être postérieure ou égale à la date de facture",
})