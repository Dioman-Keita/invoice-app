# Invoice Management System 🚀

**Enterprise-level Invoice Management System** designed for scalability and offline-first usage.  
*Hybrid Architecture: Electron + Express + Docker.*

---

## 🎯 Table of Contents

* [📋 Overview](#-overview)
* [🎥 Demo & Visuals](#-demo--visuals)
* [🏗️ Architecture](#️-architecture)
* [✨ Key Features](#-key-features)
* [⚠️ Known Limitations](#️-known-limitations--architecture-decisions)
* [🛠 Tech Stack](#-tech-stack)
* [⚡ Installation & Setup](#-installation--setup)
* [🔗 Deep Linking](#-deep-linking)
* [📡 API Documentation](#-api-documentation)
* [🗺 Roadmap](#-roadmap)
* [🤝 Contributing](#-contributing)

---

## 📋 Overview

**Invoice App** `v1.0.0` is a robust, offline-first desktop application that brings the power of a full-stack web server to the desktop. Use it to manage invoices, suppliers, and fiscal workflows with enterprise-grade security.

**Unique Selling Point**: Unlike standard Electron apps, this project runs a **real Node.js/Express server** and a **Dockerized MySQL database** locally on the user's machine, packaged into a single `.exe`.

> [!IMPORTANT]
> This project depends on **Docker Desktop** (for the database) and **LibreOffice** (for PDF generation via Carbone.io). Both components must be installed and functional.

---

## 🎥 Demo & Visuals

### Video Demonstration

See the application in action:

![Invoice App Demo](architecture/video/demo_lite.webp)

### Workflow Visualizations

To understand the core business logic, refer to our detailed flow diagrams:

| Login Flow | Register Flow | Invoice Lifecycle |
| :---: | :---: | :---: |
| [![Login](architecture/flows/login_flow.svg)](architecture/flows/login_flow.svg) | [![Register](architecture/flows/register_flow.svg)](architecture/flows/register_flow.svg) | [![Invoice](architecture/flows/invoice_flow.svg)](architecture/flows/invoice_flow.svg) |

---

## 🏗️ Architecture

> **[Read the detailed Technical Architecture Document (ARCHITECTURE.md)](ARCHITECTURE.md)**

This project solves the "Client-Server on Desktop" challenge through a hybrid design:

1. **Orchestrator (Electron)**: Manages the lifecycle of the entire stack. It silently forks a child process to run the backend and checks for Docker availability before launching the UI.
2. **Logic Core (Express + TypeScript)**: A standalone API providing REST endpoints, authentication (JWT), and PDF generation.
3. **Data Layer (MySQL @ Docker)**: Zero-config database deployment. The app controls the Docker Desktop daemon to ensure the DB is up.

### Key Technical Achievements

* **Deep Linking**: Integration of `invoice-app://` protocol for magic link authentication (Email -> Desktop).
* **Encapsulated Build**: The backend is compiled and bundled *inside* the Electron resource fork, creating a truly portable server.
* **Fiscal Isolation**: Strict data segregation by fiscal year at the SQL level.

---

## ✨ Key Features

### 🚀 High-Volume Capacity

* Optimized `INV-FY2025-000000000001` ID format.
* `BIGINT` atomic counters for collision-proof scaling.

### 🔐 Enterprise Security

* **Local Server Security**: Validates requests even if they come from localhost.
* **HttpOnly Cookies**: JWT storage safe from XSS.
* **Audit Trail**: Every `INSERT`/`UPDATE`/`DELETE` is logged with the user ID.

### 💼 DFC Workflow

* Dedicated interface for "Direction Financière et Comptable".
* Validation/Rejection workflow with mandatory comments.

---

## ⚠️ Known Limitations & Architecture Decisions

### Deep Linking (Cold Start)
The application supports deep linking (e.g., clicking a "Reset Password" link in an email) **only when the application is already running (Warm Start)**.

*   **Behavior:** If the app is fully closed, clicking a magic link will launch the application, but **the specific action (token validation) will fail**.
*   **Reason:** This is a deliberate architectural choice to maintain a strict **"Local First"** philosophy. We chose not to rely on external buffering servers or complex cloud relays. Since the local backend (Docker + Node) takes a few seconds to boot, it cannot validate the token immediately upon a cold launch.

---

## 🛠 Tech Stack

**Dual-Stack Monorepo:**

| Frontend (Client) | Backend (Server) | Infrastructure            |
| ----------------- | ---------------- | ------------------------- |
| **React 18**      | **Node.js**      | **Electron 39** (Wrapper) |
| Vite              | Express 5        | **Docker** (Database)     |
| Tailwind CSS      | TypeScript       | MySQL 8.2                 |
| HashRouter        | Carbone.io (PDF) | Electron Builder          |

---

## ⚡ Installation & Setup

### Prerequisites

* **Docker Desktop**: Must be installed and running.
* **LibreOffice**: Required for PDF generation (v24+ recommended).
* **Node.js**: v18 or later.

### Quick Start (Development)

> [!IMPORTANT]
> **In development mode**, you must manually start Docker. Only the production `.exe` can auto-start Docker containers.

```bash
# 1. Clone the repository
git clone https://github.com/Dioman-Keita/invoice-app.git
cd invoice-app

# 2. Install dependencies
npm install
npm install --prefix client
npm install --prefix server

# 3. Start Docker (REQUIRED for dev mode)
cd server
docker compose up -d
cd ..

# 4. Build the backend (CRITICAL)
# This must be run every time you modify TypeScript code in the server folder
npm run build --prefix server

# 5. Start the application
npm run electron:dev
```

> [!CAUTION]
> Unlike the frontend (Vite), the backend does **not** hot-reload inside Electron. You **must** re-run `npm run build --prefix server` (or `cd server && npm run build`) for your changes to be reflected in the app.

---

> [!TIP]
> **Development vs Production:**
>
> * **Dev mode** (`npm run electron:dev`): You must manually run `docker compose up -d` in the `server/` folder first.
> * **Production** (`.exe`): The application automatically manages Docker containers on startup.

#### 🛠️ Database Initialization (First Use)

If this is your first time using the app:

1. Run `npm run electron:dev` once to let Docker create the container.
2. Open your terminal and access the MySQL container:

    ```bash
    docker exec -it final_mysql mysql -u root -p
    ```

3. Execute the schema located at `server/mysql/db/db.sql` to initialize tables.

### Build for Production (`.exe`)

This command compiles the entire stack into a single standalone installer:

```bash
npm run dist
```

*Output: `release/Invoice App Setup 1.0.0.exe`*

---

## 🔗 Deep Linking

The app registers `invoice-app://` in the Windows Registry.

* **Warm Start**: If the app is open, the renderer receives the link instantly via `IPC`.
* **Cold Start**: If closed, Electron launches the application but **will not** trigger the deep link action (see *Known Limitations*).

---

## 📡 API Documentation

The embedded server exposes a full REST API at `http://localhost:3000/api`.

* **Auth**: `/api/auth/login`, `/api/auth/register`
* **Invoices**: `/api/invoices` (CRUD), `/api/invoices/:id/dfc/approve`
* **Stats**: `/api/stats/dashboard`

---

## 🗺 Roadmap

* [x] **Phase 1**: Hybrid Architecture & Docker Integration
* [x] **Phase 2**: Deep Linking (Warm Start) & Asset Protection
* [ ] **Phase 3**: Auto-updater
* [ ] **Phase 4**: **Future: Add "Lite Mode" using SQLite for users without Docker**
* [ ] **Phase 5**: Multi-machine sync (Remote DB option)
* [ ] **Phase 6**: Turborepo integration for better monorepo management
* [ ] **Phase 7**: Complete Frontend migration to TypeScript (TSX)
* [ ] **Phase 8**: Frontend architecture migration to feature-based design
* [ ] **Phase 9**: Backend model extraction and refactoring
* [ ] **Phase 10**: Progressive migration to Prisma ORM
* [ ] **Phase 11**: Systematic Jest integration for comprehensive pre-launch testing

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork & Clone
2. `git checkout -b my-feature`
3. Submit PR

---

**License**: MIT