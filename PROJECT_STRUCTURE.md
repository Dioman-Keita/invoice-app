# Structure du Projet Invoice App

## Vue d'ensemble

Application Electron de gestion de factures pour la CMDT (Compagnie Malienne pour le Développement des Textiles).

**Architecture :** Monorepo avec client React, serveur Node.js/Express, et wrapper Electron

**Technologies principales :**
- **Frontend :** React 19, Vite, Tailwind CSS
- **Backend :** Node.js, Express 5, TypeScript
- **Desktop :** Electron 39
- **Base de données :** MySQL 8.2 (Docker)
- **Build :** Electron Builder

---

## Structure Racine

```
invoice-app/
├── main.js                    # Point d'entrée Electron (1053 lignes)
├── package.json               # Configuration racine + Electron Builder
├── package-lock.json
├── tsconfig.json              # TypeScript config racine
├── eslint.config.js           # Configuration ESLint
│
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
│
├── client/                    # Application React Frontend
├── server/                    # API Backend Express/TypeScript
├── common/                    # Code partagé entre client/serveur
├── dist/                      # Builds compilés
├── architechture/             # Diagrammes d'architecture
└── node_modules/
```

---

## 📁 Client (Frontend React)

```
client/
├── package.json              # Dependencies React, Vite, Tailwind
├── vite.config.js            # Configuration Vite
├── tailwind.config.js        # Configuration Tailwind CSS
├── postcss.config.mjs        # PostCSS config
├── tsconfig.json
│
├── index.html                # Point d'entrée HTML
├── public/                   # Assets statiques
│   ├── cmdt_icone.png
│   ├── cmdt_logo.jpg
│   ├── image-coton-*.jpg     # Images (8 fichiers)
│   └── vite.svg
│
├── src/
│   ├── main.jsx              # Point d'entrée React
│   ├── App.jsx               # Composant principal
│   │
│   ├── pages/                # Pages de l'application
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Stats.jsx
│   │   │   └── Messaging.jsx
│   │   │
│   │   ├── agent/
│   │   │   ├── dfc/
│   │   │   │   └── DfcFormular.jsx
│   │   │   └── manager/
│   │   │       └── Invoice.jsx
│   │   │
│   │   └── global/
│   │       ├── Home.jsx
│   │       ├── Profile.jsx
│   │       ├── Search.jsx
│   │       ├── StatsSimple.jsx
│   │       ├── Help.jsx
│   │       ├── Verify.jsx
│   │       ├── RoleMigration.jsx
│   │       ├── NotFound.jsx
│   │       └── Unauthorized.jsx
│   │
│   ├── components/           # Composants réutilisables
│   │   ├── form/
│   │   │   ├── FormContainer.jsx
│   │   │   ├── FormSection.jsx
│   │   │   └── SubmitBtn.jsx
│   │   │
│   │   ├── validation/       # Composants de validation
│   │   │   ├── ValidateTextInput.jsx
│   │   │   ├── ValidatedTextarea.jsx
│   │   │   ├── ValidatedCodeInput.jsx
│   │   │   ├── ValidatedAmountInput.jsx
│   │   │   ├── ValidatedInvoiceNumberInput.jsx
│   │   │   ├── ValidateDateInput.jsx
│   │   │   ├── ValidateSelectInput.jsx
│   │   │   ├── ValidateSupplierInput.jsx
│   │   │   ├── ValidateCheckboxGroup.jsx
│   │   │   └── ValidateRadioGroup.jsx
│   │   │
│   │   ├── global/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Banner.jsx
│   │   │   └── PrivateRoute.jsx
│   │   │
│   │   ├── navbar/
│   │   │   ├── Navbar.jsx
│   │   │   └── NavbarPanel.jsx
│   │   │
│   │   └── notification/
│   │       ├── CMDTNotification.jsx
│   │       ├── NotificationManager.jsx
│   │       └── Toast.jsx
│   │
│   ├── features/             # Features métier
│   │   └── invoices/
│   │       ├── InvoiceForm.jsx
│   │       └── InvoiceLastNumber.jsx
│   │
│   ├── hooks/                # React Hooks personnalisés
│   │   ├── auth/
│   │   │   └── useAuth.js
│   │   │
│   │   ├── api/
│   │   │   └── useSearch.js
│   │   │
│   │   ├── features/
│   │   │   ├── useInvoice.js
│   │   │   └── useFiscalSettings.js
│   │   │
│   │   └── ui/
│   │       ├── useToastFeedBack.js
│   │       ├── useTitle.js
│   │       ├── useSupplierAutoComplete.js
│   │       ├── useProgressiveValidation.js
│   │       ├── useInputFilter.js
│   │       ├── useDateValidation.js
│   │       └── useBackground.js
│   │
│   ├── context/              # React Context
│   │   ├── NotificationContext.jsx
│   │   └── useNotification.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx     # Configuration des routes
│   │
│   ├── services/
│   │   └── api.js            # Client API Axios
│   │
│   ├── utils/                # Utilitaires
│   │   ├── formatDate.js
│   │   ├── formatDate.d.ts
│   │   ├── validateDate.js
│   │   └── validateDate.d.ts
│   │
│   ├── shema/                # Schémas de validation (Zod)
│   │   ├── loginShema.ts
│   │   └── InvoiceShema.ts
│   │
│   ├── css/                  # Styles CSS
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Header.css
│   │   ├── Banner.css
│   │   └── custom-toastify.css
│   │
│   └── assets/
│       └── react.svg
│
└── dist/                     # Build production
    ├── index.html
    ├── assets/
    │   ├── index-*.css
    │   └── index-*.js
    └── [assets publics]
```

**Dependencies principales :**
- React 19.1.1
- React Router DOM 7.8.2
- React Hook Form 7.62.0
- Axios 1.12.2
- Zod 4.1.1 (validation)
- Tailwind CSS 4.1.12
- Chart.js 4.5.1 (graphiques)
- React Toastify 11.0.5

---

## 🖥️ Server (Backend Express/TypeScript)

```
server/
├── package.json              # Dependencies Express, MySQL, etc.
├── tsconfig.json             # TypeScript config
├── server.ts                 # Point d'entrée serveur
├── app.ts                    # Configuration Express app
│
├── docker-compose.yml        # Configuration Docker (MySQL)
├── manage-stack.bat          # Script Windows pour Docker
├── manage-stack.sh           # Script Linux/Mac pour Docker
│
├── config/                   # Configuration
│   ├── database.ts           # Pool de connexions MySQL
│   └── carbone.config.ts     # Config génération de documents
│
├── controllers/              # Controllers (logique métier)
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── users.controller.ts
│   ├── invoice.controller.ts
│   ├── supplier.controller.ts
│   ├── settings.controller.ts
│   ├── search.controller.ts
│   ├── stats.controller.ts
│   ├── export.controller.ts
│   └── migration.controller.ts
│
├── routes/                   # Routes Express
│   ├── auth.route.ts
│   ├── users.route.ts
│   ├── invoice.routes.ts
│   ├── supplier.route.ts
│   ├── settings.route.ts
│   ├── search.route.ts
│   ├── stats.route.ts
│   ├── export.route.ts
│   └── migration.route.ts
│
├── middleware/               # Middlewares Express
│   ├── authGuard.ts          # Authentification JWT
│   ├── roleGuard.ts          # Vérification des rôles
│   ├── validator.ts          # Validation des données
│   ├── requestIdMiddleware.ts # Génération ID de requête
│   ├── debugCookie.ts        # Debug cookies (dev)
│   └── autoTrackActivity.ts  # Tracking automatique activité
│
├── models/                   # Modèles de données
│   ├── User.ts
│   ├── Invoice.ts
│   └── Supplier.ts
│
├── services/                 # Services métier
│   ├── emailService.ts       # Envoi d'emails (Nodemailer)
│   ├── userToken.ts          # Génération tokens JWT
│   ├── notificationFactory.ts # Factory notifications
│   │
│   └── export/               # Service d'export de données
│       ├── generator.ts
│       ├── mappers.ts
│       ├── schemas.ts
│       ├── providers.ts
│       ├── enrichment.ts
│       ├── dateRange.service.ts
│       ├── templateRegistry.ts
│       ├── types.ts
│       └── validateExportMappings.ts
│
├── utils/                    # Utilitaires
│   ├── Logger.ts             # Winston logger
│   ├── ApiResponder.ts       # Réponses API standardisées
│   ├── PasswordHasher.ts     # Hash de mots de passe
│   ├── ActivityTracker.ts    # Suivi des activités utilisateur
│   ├── UserDataValidator.ts  # Validation données utilisateur
│   ├── QueryBuilder.ts       # Builder de requêtes SQL
│   ├── Formatters.ts         # Formatage de données
│   ├── InvoiceRuleInput.ts   # Règles de numérotation factures
│   ├── auditLogger.ts        # Logs d'audit
│   └── json-structure-loader.ts
│
├── helpers/                  # Helpers métier
│   ├── cmdtFormat.ts
│   ├── fiscalYearCounter.ts
│   ├── databaseCreationDate.ts
│   ├── statsDateRange.ts
│   └── settings.ts
│
├── core/                     # Logique métier core
│   ├── generators/
│   │   └── IdGenerator.ts
│   │
│   ├── managers/
│   │   ├── InvoiceCounterManager.ts
│   │   ├── FiscalCounterManager.ts
│   │   └── EmployeeCounterManager.ts
│   │
│   └── rules/
│       └── InvoiceNumberRule.ts
│
├── types/                    # Types TypeScript
│   ├── index.ts
│   │
│   ├── domain/               # Types domain
│   │   ├── User.ts
│   │   ├── Invoice.ts
│   │   └── Supplier.ts
│   │
│   ├── dto/                  # Data Transfer Objects
│   │   ├── AuthDto.ts
│   │   ├── UserDto.ts
│   │   ├── InvoiceDto.ts
│   │   └── SupplierDto.ts
│   │
│   ├── api/                  # Types API
│   │   └── ApiResponse.ts
│   │
│   ├── express/              # Extensions Express
│   │   └── request.ts        # AuthenticatedRequest
│   │
│   ├── responses/            # Types de réponses
│   │   └── auth.ts
│   │
│   ├── errors/               # Types d'erreurs
│   │   └── DbError.ts
│   │
│   ├── common/               # Types communs
│   │   ├── index.ts
│   │   ├── Nullable.ts
│   │   └── Fn.ts
│   │
│   ├── export.ts
│   └── carbone.d.ts
│
├── jobs/                     # Tâches planifiées
│   └── cleanupUnverified.ts  # Nettoyage comptes non vérifiés
│
├── mysql/                    # Configuration MySQL
│   ├── conf/
│   │   └── my.cnf            # Configuration MySQL
│   └── db/
│       └── db.sql            # Scripts SQL init
│
├── templates/                # Templates d'export
│   └── odt_excel_carbone_data.json
│
├── docs/                     # Documentation
│   ├── API_ROUTES.md         # Documentation API
│   └── openapi.yaml          # Spec OpenAPI
│
├── logs/                     # Logs de l'application
│   └── app-YYYY-MM-DD.log
│
└── dist/                     # Build TypeScript compilé
    └── server/
        ├── server.js
        └── app.js
```

**Dependencies principales :**
- Express 5.2.1
- MySQL2 3.14.5
- TypeScript
- JWT 9.0.2 (authentification)
- Bcrypt 6.0.0 (hash passwords)
- Nodemailer 7.0.6 (emails)
- Winston 3.19.0 (logging)
- Carbone 3.5.6 (génération documents)
- Zod 4.1.12 (validation)

---

## 🔧 Common (Code Partagé)

```
common/
├── assets/
│   └── cmdt_icone.png
│
└── helpers/
    ├── formatAccountNumber.js
    └── formatAccountNumber.ts
```

---

## ⚡ Main.js (Electron Process)

**Fichier principal :** `main.js` (1053 lignes)

**Responsabilités :**
- ✅ Gestion instance unique (single instance lock)
- ✅ Démarrage/arrêt du backend (child process avec fork)
- ✅ Gestion Docker (docker compose up/down)
- ✅ Création fenêtre Electron
- ✅ Configuration logging (electron-log)
- ✅ Gestion des erreurs avec dialogs
- ✅ Cycle de vie de l'application

**Configuration Electron Builder :**
- App ID: `com.invoice-app.app`
- Product Name: `Invoice App`
- Target: NSIS (Windows installer)
- Resources: `server/`, `server/node_modules/`, `server/dist/`, `client/dist/`

---

## 🏗️ Architecture

```
architechture/
├── invoice_flow.svg
├── login_flow.svg
└── register_flow.svg
```

---

## 📦 Build & Distribution

```
dist/                         # Builds compilés
├── client/                   # Build client Vite
├── common/                   # Build common
└── server/                   # Build server TypeScript
    └── server/
        ├── app.js
        └── server.js
```

**Commandes disponibles :**
- `npm run dev` - Démarre le client en mode dev
- `npm run build` - Build le client
- `npm run dist` - Build complet + package Electron
- `npm run electron:dev` - Lance Electron en dev

---

## 🗄️ Base de Données

**MySQL 8.2** via Docker Compose

**Configuration :**
- Port: 3306
- Volume persistant: `final-mysql-data`
- Init scripts: `server/mysql/db/db.sql`
- Config: `server/mysql/conf/my.cnf`

---

## 🔐 Rôles Utilisateurs

1. **admin** - Accès complet
2. **invoice_manager** - Gestion factures et fournisseurs
3. **dfc_agent** - Gestion factures DFC

---

## 📝 Notes Importantes

1. **Monorepo** : Client et serveur dans le même repo
2. **Electron** : Wrapper desktop de l'application web
3. **Docker** : MySQL en conteneur, géré automatiquement par Electron
4. **Logging** : electron-log pour main.js, Winston pour backend
5. **Build** : TypeScript → JavaScript dans `dist/`
6. **Authentification** : JWT via cookies HttpOnly
7. **Validation** : Zod côté client et serveur

---

## 🔄 Workflow de Développement

1. **Dev Backend :** `cd server && npm run dev` (tsx watch)
2. **Dev Frontend :** `cd client && npm run dev` (Vite)
3. **Dev Electron :** `npm run electron:dev`
4. **Build Production :** `npm run dist`

---

**Version :** 0.0.0  
**Auteur :** Dioman Keita  
**Organisation :** CMDT - Compagnie Malienne pour le Développement des Textiles

