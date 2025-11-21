# Invoice Management System (CMDT) 🚀

Enterprise-ready invoice management system, designed for extreme scale: supports up to **999,999,999,999 invoices per year**, full audit trail, strong security, and a modern UI.

---

## 🎯 Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Tech Stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Quick Installation](#quick-installation)
* [Configuration](#configuration)
* [Development](#development)
* [API Documentation](#api-documentation)
* [Billion-Scale System](#billion-scale-system)
* [Authentication & Security](#authentication--security)
* [Recent Updates](#recent-updates)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Support](#support)

---

## 📋 Overview

<a id="overview"></a>

Invoice Manager is a comprehensive platform built for rigorous enterprise environments.

**Highlights:**

* Massive scale: up to 999,999,999,999 invoices/year (no confusion with 1 billion)
* Security: JWT HttpOnly, complete audit trail, granular roles
* Modern UX: React + Tailwind, real-time validation, responsive UI
* Advanced export: PDF and Excel with full history tracking
* Workflow: Invoice and supplier CRUD, DFC validation process
* Fiscal year management: automatic switching and planning up to two years in advance

---

## ✨ Key Features

<a id="key-features"></a>

### 🚀 Billion-Scale Architecture

* Optimized ID format: `INV-000000000001` (12 sequential digits)
* High performance: indexed with a dedicated `BIGINT` counter
* Duplicate prevention: verified IDs and automatic synchronization

### 🔐 Security & Authentication

* JWT HttpOnly cookies (XSS mitigation)
* Dynamic session handling (backend-managed "remember me")
* Role-based access: admin, invoice manager, DFC agent
* Complete activity trail for all actions
* Bcrypt password hashing and robust validation

### 📊 Invoice Management

* Full CRUD with advanced validation
* Multi-criteria search by supplier
* DFC workflow (approve/reject with comments)
* Intelligent sequential numbering

### 💼 Supplier Management

* Account number: **all valid formats accepted** (not limited to 12 digits)
* Conflict validation (account/supplier/phone)
* Flexible, multi-criteria search
* Modern, dynamic user interface

### 📤 Export & Reports

* PDF and Excel export only (TXT format is not supported)
* Advanced time filtering
* Complete export history

---

## 🛠 Tech Stack

<a id="tech-stack"></a>

### Frontend

```
React 18 + Vite
├── UI: Tailwind CSS + Heroicons
├── Forms: React Hook Form + Zod
├── State: React Context + Hooks
├── Routing: React Router
└── Build: Vite (HMR, optimization)
```

### Backend

```
Node.js + Express + TypeScript
├── Auth: JWT HttpOnly + bcrypt
├── DB: MySQL 8.2 (Docker)
├── Validation: Custom
├── Logging: Custom logger
├── Audit: full activity traceability
└── API: RESTful + Express Router
```

### Database

```
MySQL 8.2 via Docker
├── Tables: invoice, supplier, employee, audit_log
├── Optimized indexing
├── Foreign and unique constraints
└── Partitioning ready
```

---

## ⚡ Prerequisites

<a id="prerequisites"></a>

* Node.js 18+ and npm 9+
* MySQL 8.2 (via Docker)
* Modern web browser (Chrome 90+, Firefox 88+)
* Docker + Docker Compose

---

## 🚀 Quick Installation

<a id="quick-installation"></a>

```bash
# Clone repository
git clone https://github.com/Dioman-Keita/invoice-app.git
cd invoice-app

# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

###  ⚠️ Warning: Docker Stack Management

> Use the stack helpers: `server/manage-stack.sh` (macOS/Linux) or `server/manage-stack.bat` (Windows).
>
> These scripts provide four options:
> 1) Restart only (no removal)
> 2) Restart with container removal (`docker compose down`, volumes preserved)
> 3) Safe reset (remove containers and the CMDT volume only)
> 4) Extreme clean (global `docker system prune -af --volumes`)
>
> Option 4 purges unused Docker images/containers/networks/volumes globally on your machine (not only this project).  
> Option 3 removes only this project's data volume. Options 1–2 keep your data.  
> **Use with caution**, especially if you run other Docker projects.

---

##  ⚙️ Configuration

<a id="configuration"></a>

Create `server/.env` with:

```bash
# Authentication
JWT_SECRET_KEY=super_secret_key_change_me

# Environment
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cmdt_invoice_db
```
> JWT expiration is backend-managed and dynamic; no need to define it in `.env`.

---

## 👨‍💻 Development

<a id="development"></a>

```bash
# Start frontend:
cd invoice-app
npm run dev

# Start backend:
cd server
npm run dev
```

**Default URLs**:

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend API: [http://localhost:3000](http://localhost:3000)

---

## 📡 API Documentation

<a id="api-documentation"></a>

### Authentication

* POST /auth/login
* POST /auth/register
* POST /auth/forgot-password
* POST /auth/reset-password
* POST /auth/silent-refresh
* GET /auth/status
* GET /auth/profile
* POST /auth/logout
* POST /auth/admin/create-user

### Invoice

* Full CRUD (GET, POST, update, delete)
* DFC workflow: approve/reject, comments
* Multi-criteria search

### Supplier

* CRUD, advanced search, conflict validation

### Export

* PDF, Excel (TXT not supported)
* Export history tracking

---

## 🌟 Billion-Scale System

<a id="billion-scale-system"></a>

* Extreme capacity: up to 999,999,999,999 invoices/year
* Invoice ID: `INV-000000000001` (12 digits)
* BIGINT counter for high performance & atomicity
* Sequence indexing, no `SELECT MAX()`, duplication prevention

---

## 🔐 Authentication & Security

<a id="authentication--security"></a>

* JWT & HttpOnly cookies, CSRF & XSS protection
* Role-Based Access: admin / invoice manager / DFC agent
* Full audit trail: all actions logged
* Export & operation tracking

---

## 🚀 Recent Updates

<a id="recent-updates"></a>

* Docker + MySQL 8.2 migration
* Strict TypeScript backend
* Enhanced PDF and Excel exports
* Updated Docker init scripts
* Performance and bug fixes

---

## 🗺 Roadmap

<a id="roadmap"></a>

### Phase 1 (Current)

* Billion-scale architecture
* Modernized export system
* Enhanced audit logging
* Complete TypeScript coverage
* Responsive UX improvements

### Phase 2 (Next)

* Real-time notifications (WebSocket)
* Advanced analytics (dashboard)
* Bulk operations
* API rate limiting
* Integration tests

### Phase 3 (Future)

* Microservices (invoice & auth separation)
* Background queue system
* Mobile app (React Native)
* Multi-tenant support
* AI features (duplicate detection, OCR etc.)

---

## 🤝 Contributing

<a id="contributing"></a>

1. Fork the repository
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

<a id="license"></a>

MIT License — see [LICENSE](LICENSE)

---

## 📞 Support

<a id="support"></a>

* Email: [diomankeita001@gmail.com](mailto:diomankeita001@gmail.com)

---

This solution is provided with a focus on robustness and high-volume performance for enterprise invoice management.

*Last updated: November 2025*