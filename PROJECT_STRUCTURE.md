# Invoice App Project Structure

## Overview

Electron invoice management application for CMDT (Compagnie Malienne pour le Développement des Textiles).

**Architecture:** Monorepo with React client, Node.js/Express server, and Electron wrapper.

**Key Technologies:**
-**Frontend:** React 19, Vite, Tailwind CSS
-**Backend:** Node.js, Express 5, TypeScript
-**Desktop:** Electron 39
-**Database:** MySQL 8.2 (Docker)
-**Build:** Electron Builder

---

## Root Structure

```plaintext
invoice-app/
├── main.js                    # Electron Entry Point (~350 lines)
├── preload.js                 # Electron Preload Script (IPC Bridge)
├── package.json               # Root config + Electron Builder
├── package-lock.json
├── tsconfig.json              # Root TypeScript config
├── eslint.config.js           # ESLint configuration
│
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── ARCHITECTURE.md            # Detailed Architecture
├── PROJECT_STRUCTURE.md       # This file
│
├── client/                    # React Frontend Application
├── server/                    # Express/TypeScript Backend API
├── common/                    # Shared code between client/server
├── dist/                      # Compiled builds
├── architecture/             # Architecture diagrams
└── node_modules/
```

---

## 📁 Client (React Frontend)

```plaintext
client/
├── package.json              # React, Vite, Tailwind Dependencies
├── vite.config.js            # Vite Configuration
├── tailwind.config.js        # Tailwind CSS Configuration
├── postcss.config.mjs        # PostCSS config
├── tsconfig.json
│
├── index.html                # HTML Entry Point
├── public/                   # Static Assets
│   ├── cmdt_icone.png
│   ├── cmdt_logo.jpg
│   ├── image-coton-*.jpg     # Images (8 files)
│   └── vite.svg
│
├── src/
│   ├── main.jsx              # React Entry Point
│   ├── App.jsx               # Main Component
│   │
│   ├── pages/                # Application Pages
│   │   ├── auth/             # Authentication Pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   ├── admin/            # Admin Pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Stats.jsx
│   │   │   └── Messaging.jsx
│   │   │
│   │   ├── agent/            # Agent Pages
│   │   │   ├── dfc/
│   │   │   │   └── DfcFormular.jsx
│   │   │   └── manager/
│   │   │       └── Invoice.jsx
│   │   │
│   │   └── global/           # Global/Shared Pages
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
│   ├── components/           # Reusable Components
│   │   ├── form/
│   │   └── ...
│   │
│   ├── features/             # Business Features
│   │   └── invoices/
│   │
│   ├── hooks/                # Custom React Hooks
│   │   ├── auth/
│   │   │   └── useAuth.js
│   │   └── ...
│   │
│   ├── context/              # React Context
│   │   ├── NotificationContext.jsx
│   │   └── useNotification.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx     # Route Configuration
│   │
│   ├── services/
│   │   └── api.js            # Axios API Client
│   │
│   ├── utils/                # Utilities
│   │
│   ├── shema/                # Validation Schemas (Zod)
│   │   ├── loginShema.ts
│   │   └── InvoiceShema.ts
│   │
│   └── css/                  # CSS Styles
│
└── dist/                     # Production Build
```

**Main Dependencies:**

- React 19.1.1
- React Router DOM 7.8.2
- React Hook Form 7.62.0
- Axios 1.12.2
- Zod 4.1.1 (validation)
- Tailwind CSS 4.1.12
- Chart.js 4.5.1 (charts)
- React Toastify 11.0.5

---

## 🖥️ Server (Express/TypeScript Backend)

```plaintext
server/
├── package.json              # Express, MySQL, etc Dependencies
├── tsconfig.json             # TypeScript config
├── server.ts                 # Server Entry Point
├── app.ts                    # Express App Config
│
├── docker-compose.yml        # Docker Config (MySQL)
├── manage-stack.bat          # Windows Docker Script
├── manage-stack.sh           # Linux/Mac Docker Script
│
├── config/                   # Configuration
│   ├── database.ts           # MySQL Connection Pool
│   └── carbone.config.ts     # Document Generation Config
│
├── core/                     # Core Business Logic
│   ├── generators/           # ID Generators
│   │   └── IdGenerator.ts    # Unique ID generation (INV-FY2025-...)
│   ├── managers/             # Counter Managers
│   │   ├── FiscalCounterManager.ts    # Base fiscal counter
│   │   ├── InvoiceCounterManager.ts   # Invoice counter
│   │   └── EmployeeCounterManager.ts  # Employee counter
│   └── rules/                # Business Rules
│       └── InvoiceNumberRule.ts       # Invoice numbering rules
│
├── controllers/              # Controllers (Business Logic)
│   ├── auth.controller.ts
│   ├── invoice.controller.ts
│   ├── supplier.controller.ts
│   ├── users.controller.ts
│   ├── stats.controller.ts
│   ├── search.controller.ts
│   ├── export.controller.ts
│   ├── settings.controller.ts
│   ├── migration.controller.ts
│   └── system.controller.ts
│
├── routes/                   # Express Routes
│   ├── auth.route.ts
│   ├── invoice.routes.ts
│   ├── supplier.route.ts
│   ├── users.route.ts
│   ├── stats.route.ts
│   ├── search.route.ts
│   ├── export.route.ts
│   ├── settings.route.ts
│   ├── migration.route.ts
│   └── system.route.ts
│
├── middleware/               # Express Middlewares
│   ├── authGuard.ts          # JWT Authentication
│   ├── roleGuard.ts          # Role-based Access Control
│   ├── validator.ts          # Data Validation
│   ├── autoTrackActivity.ts  # Activity Tracking
│   ├── debugCookie.ts        # Cookie Debugging
│   └── requestIdMiddleware.ts # Request ID Tracking
│
├── models/                   # Data Models
│   ├── User.ts               # User Model
│   ├── Invoice.ts            # Invoice Model
│   └── Supplier.ts           # Supplier Model
│
├── services/                 # Business Services
│   ├── emailService.ts       # Email Service (Gmail)
│   ├── userToken.ts          # JWT Token Generation
│   ├── notificationFactory.ts # Email Templates
│   └── export/               # Data Export Service
│       ├── dateRange.service.ts
│       ├── enrichment.ts     # Data Enrichment
│       ├── generator.ts      # Carbone PDF/ODT/XLSX
│       ├── mappers.ts        # Data Mapping
│       ├── providers.ts      # Data Providers
│       ├── schemas.ts        # Export Schemas
│       ├── templateRegistry.ts
│       ├── types.ts
│       └── validateExportMappings.ts
│
├── helpers/                  # Helper Functions
│   ├── cmdtFormat.ts         # CMDT Number Formatting
│   ├── databaseCreationDate.ts
│   ├── fiscalYearCounter.ts  # Fiscal Year Counter
│   ├── settings.ts           # Settings Helper
│   └── statsDateRange.ts     # Stats Date Range
│
├── jobs/                     # Scheduled Jobs
│   ├── cleanupLogs.ts        # Log Cleanup Job
│   └── cleanupUnverified.ts  # Unverified Users Cleanup
│
├── utils/                    # Utilities
│   ├── Logger.ts             # Winston Logger
│   ├── ApiResponder.ts       # API Response Formatter
│   ├── ActivityTracker.ts    # User Activity Tracking
│   ├── QueryBuilder.ts       # SQL Query Builder
│   ├── PasswordHasher.ts     # Bcrypt Password Hashing
│   └── auditLogger.ts        # Audit Trail Logger
│
├── types/                    # TypeScript Types
│   ├── index.ts
│   ├── dto/
│   └── responses/
│
├── mysql/                    # MySQL Configuration
│   ├── conf/
│   │   └── my.cnf
│   └── db/
│       └── db.sql            # Database Schema
│
├── templates/                # Export Templates (Carbone)
│   ├── invoice_list.odt
│   ├── invoice_overview.odt
│   ├── supplier_list.odt
│   └── ...
│
├── logs/                     # Application Logs
│   └── app-*.log
│
├── docs/                     # API Documentation
│   ├── API_ROUTES.md
│   └── openapi.yaml
│
└── dist/                     # Compiled TypeScript Build
    └── server/
        ├── server.js
        └── app.js
```

**Main Dependencies:**

- Express 5.2.1
- MySQL2 3.14.5
- TypeScript
- JWT 9.0.2 (authentication)
- Bcrypt 6.0.0 (password hash)
- Nodemailer 7.0.6 (emails)
- Winston 3.19.0 (logging)
- Carbone 3.5.6 (document generation)
- Zod 4.1.12 (validation)

---

## ⚡ Main.js (Electron Process)

**Main File:** `main.js` (~350 lines)

**Responsibilities:**

- ✅ Single Instance Lock (prevents multiple app instances)
- ✅ Deep Linking (`invoice-app://` protocol handling)
- ✅ Backend Start/Stop (Child Process fork)
- ✅ Docker Management (docker compose up/down) - **Production only**
- ✅ Window Creation with Loading Screen
- ✅ Server Health Check (waits for backend readiness)
- ✅ Logging (electron-log)
- ✅ Graceful Shutdown with Confirmation Modal
- ✅ Error Handling
- ✅ Application Lifecycle Management

**Key Features:**

- **Cold Start**: Handles deep links when app is closed
- **Warm Start**: Handles deep links when app is already running
- **React Ready Detection**: Waits for React to hydrate before sending deep links
- **Confirmation Modal**: Custom styled modal for quit confirmation (when React is ready)
- **Fallback Dialog**: Native dialog for quit confirmation (during loading)

---

## 🔌 Preload.js (IPC Bridge)

**Preload File:** `preload.js` (~20 lines)

**Purpose:** Secure bridge between Electron main process and renderer (React)

**Exposed APIs:**

- **`window.electron.onDeepLink(callback)`**: Listen for deep link events
  - Returns cleanup function to remove listener
  - Handles `invoice-app://` protocol URLs
  - Used for email verification and password reset flows

**Security:**

- Uses `contextBridge` for secure IPC communication
- Prevents direct access to Node.js APIs from renderer
- Only exposes necessary functionality to frontend

---

## 🏗️ Architecture

```plaintext
architechture/
├── invoice_flow.svg
├── login_flow.svg
└── register_flow.svg
```

---

## 📦 Build & Distribution

```plaintext
dist/                         # Compiled Builds
├── client/                   # Client Vite Build
├── common/                   # Common Build
└── server/                   # Server TypeScript Build
```

**Available Commands:**

- `npm run dev` - Start client in dev mode
- `npm run build` - Build client
- `npm run dist` - Full build + Electron package
- `npm run electron:dev` - Run Electron in dev

---

## 🗄️ Database

**MySQL 8.2** via Docker Compose

**Configuration:**

- Port: 3306
- Persistent Volume: `final-mysql-data`
- Init Scripts: `server/mysql/db/db.sql`
- Config: `server/mysql/conf/my.cnf`

---

## 🔐 User Roles

1. **admin** - Full Access
2. **invoice_manager** - Invoice & Supplier Management
3. **dfc_agent** - DFC Invoice Management

---

## 📝 Important Notes

1. **Monorepo**: Client and server in the same repo
2. **Electron**: Desktop wrapper for web app with deep linking support
3. **Docker**: MySQL in container
   - **Dev mode**: Must be started manually with `docker compose up -d` in `server/`
   - **Production**: Managed automatically by Electron (.exe)
4. **Logging**: electron-log for main.js, Winston for backend
5. **Build**: TypeScript → JavaScript in `dist/`
6. **Authentication**: JWT via HttpOnly cookies with activity tracking
7. **Validation**: Zod client-side and server-side
8. **Deep Linking**: `invoice-app://` protocol for email verification and password reset
9. **Internationalization**: UI and API responses in French, internal code comments in English
10. **Fiscal Year Management**: Automatic or manual fiscal year switching with counter management

---

**Version:** 0.0.0  
**Author:** Dioman Keita  
**Organization:** CMDT - Compagnie Malienne pour le Développement des Textiles
