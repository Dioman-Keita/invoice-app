import { z } from 'zod';

// Shared primitives (reusable and centralized)
const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{2,50}$/;
const createNameSchema = (label: string) =>
  z.string()
    .trim()
    .min(1, `${label} est réquis`)
    .min(2, `${label} doit contenir au moins 2 caractères`)
    .max(50, `${label} ne doit pas dépasser 50 caractères`)
    .regex(namePattern, {
    message: `${label} est invalide : seuls les lettres accentuées(êèéï), espaces( ), tirets(-) et apostrophes(') sont autorisés`,
});


const emailSchema = z
  .string()
  .min(1, "L'email est requis")
  .email("Adresse email invalide");

const employeeIdSchema = z
  .string()
  .min(1, "l'identifiant CMDT est requis")
  .regex(/^\d{5}$/, {
    message: "L'identifiant CMDT doit être au format XXXXXX ex.(56756)",
  }); 

const phoneSchema = z
  .string()
  .min(1, "Le numéro de téléphone est requis")
  .regex(/^\+223(\s\d{2}){0,4}$/, {
    message: "Le numéro doit être au format +223 XX XX XX XX",
  });

const userTypeShema = z
  .enum(['dfc_agent', 'invoice_manager'], {
  message: "Veuillez choisir le type d'agent"
});

const rememberMe = z
.boolean({
  message: "Veuillez arreter de jouer les hacker"
}).optional();

// Minimal password for login (no hints about real constraints)
const minimalPasswordSchema = z.string().min(1, "Le mot de passe est requis");

export const registerSchema = z.object({
  firstName: createNameSchema('Le prenom'),
  lastName: createNameSchema('Le nom'),
  email: emailSchema,
  employee_cmdt_id: employeeIdSchema,
  phone: phoneSchema,
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule.")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre.")
    .regex(/[@$!%*?&]/, "Le mot de passe doit contenir un caractère spécial."),
  confirm_password: z.string().min(1, "Vous devez confirmer le mot de passe"),
  department: z.string().min(1, "Le département est requis"),
  terms: z.boolean().refine((val) => val === true, {
    message: "L'acceptation des conditions est obligatoire."
  }),
  user_type: userTypeShema,
})
.superRefine((data, ctx) => {
  // Cross-field: confirm_password must match password
  if (data.password !== data.confirm_password) {
    ctx.addIssue({ 
      code: 'custom', 
      path: ['confirm_password'], 
      message: "Les mots de passe doivent être identiques" 
    });
  }

  // Validation conditionnelle par type d'utilisateur
  if (data.user_type === 'dfc_agent') {
    if (!['finance', 'comptabilité', 'contrôle_de_gestion', 'audit_interne'].includes(data.department)) {
      ctx.addIssue({ 
        code: 'custom', 
        path: ['department'], 
        message: 'Département DFC invalide' 
      });
    }
  } else if (data.user_type === 'invoice_manager') {
    if (!['facturation', 'comptabilité_client', 'gestion_factures'].includes(data.department)) {
      ctx.addIssue({ 
        code: 'custom', 
        path: ['department'], 
        message: 'Département Facturation invalide' 
      });
    }
  }
});


// Lightweight schema for login without revealing password rules
export const loginSchema = z.object({
  email: emailSchema,
  password: minimalPasswordSchema,
  user_type: userTypeShema,
  rememberMe: rememberMe,
});