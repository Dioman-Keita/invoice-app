# Invoice App Project Structure

## Overview

Electron invoice management application for CMDT (Compagnie Malienne pour le Développement des Textiles).

**Architecture:** Monorepo with React client, Node.js/Express server, and Electron wrapper.

**Key Technologies:**
- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Node.js, Express 5, TypeScript
- **Desktop:** Electron 39
- **Database:** MySQL 8.2 (Docker)
- **Build:** Electron Builder

---

## Root Structure

```
invoice-app/
├── main.js                    # Electron Entry Point (1053 lines)
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
│
├── client/                    # React Frontend Application
├── server/                    # Express/TypeScript Backend API
├── common/                    # Shared code between client/server
├── dist/                      # Compiled builds
├── architechture/             # Architecture diagrams
└── node_modules/
```

---

## 📁 Client (React Frontend)

```
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

```
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
├── controllers/              # Controllers (Business Logic)
│   ├── invoice.controller.ts
│   └── ...
│
├── routes/                   # Express Routes
│   ├── invoice.routes.ts
│   └── ...
│
├── middleware/               # Express Middlewares
│   ├── authGuard.ts          # JWT Auth
│   ├── roleGuard.ts          # Role Check
│   ├── validator.ts          # Data Validation
│   └── ...
│
├── models/                   # Data Models
│   ├── User.ts
│   ├── Invoice.ts
│   └── Supplier.ts
│
├── services/                 # Business Services
│   ├── emailService.ts       
│   ├── userToken.ts          
│   └── export/               # Data Export Service
│
├── utils/                    # Utilities
│   ├── Logger.ts             # Winston logger
│   └── ...
│
├── mysql/                    # MySQL Configuration
│   ├── conf/
│   └── db/
│
├── templates/                # Export Templates
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

**Main File:** `main.js` (1053 lines)

**Responsibilities:**
- ✅ Single Instance Lock
- ✅ Backend Start/Stop (Child Process fork)
- ✅ Docker Management (docker compose up/down)
- ✅ Window Creation
- ✅ Logging (electron-log)
- ✅ Error Handling
- ✅ Application Lifecycle

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
2. **Electron**: Desktop wrapper for web app
3. **Docker**: MySQL in container, managed automatically by Electron
4. **Logging**: electron-log for main.js, Winston for backend
5. **Build**: TypeScript → JavaScript in `dist/`
6. **Authentication**: JWT via HttpOnly cookies
7. **Validation**: Zod client-side and server-side

---

**Version:** 0.0.0  
**Author:** Dioman Keita  
**Organization:** CMDT - Compagnie Malienne pour le Développement des Textiles
