# Invoice Management System (CMDT) 🚀

**Enterprise-level Invoice Management System** designed for scalability and offline-first usage.  
*Hybrid Architecture: Electron + Express + Docker.*

---

## 🎯 Table of Contents

* [📋 Overview](#-overview)
* [🎥 Demo & Visuals](#-demo--visuals)
* [🏗️ Architecture](#️-architecture)
* [✨ Key Features](#-key-features)
* [🛠 Tech Stack](#-tech-stack)
* [⚡ Installation & Setup](#-installation--setup)
* [🔗 Deep Linking](#-deep-linking)
* [📡 API Documentation](#-api-documentation)
* [🗺 Roadmap](#-roadmap)
* [🤝 Contributing](#-contributing)

---

## 📋 Overview

**Invoice App** `v0.0.0` is a robust, offline-first desktop application that brings the power of a full-stack web server to the desktop. Use it to manage invoices, suppliers, and fiscal workflows with enterprise-grade security.

**Unique Selling Point**: Unlike standard Electron apps, this project runs a **real Node.js/Express server** and a **Dockerized MySQL database** locally on the user's machine, packaged into a single `.exe`.

> [!IMPORTANT]
> This project depends on **Docker Desktop** (for the database) and **LibreOffice** (for PDF generation via Carbone.io). Both components must be installed and functional.

---

## 🎥 Demo & Visuals

### Video Demonstration

See the application in action:

![Invoice App Demo](architecture/video/demo.mp4)

> [!NOTE]
> If the video does not play above, you can [download it here](architecture/video/demo.mp4?raw=true).

### Workflow Visualizations

To understand the core business logic, refer to our detailed flow diagrams:

| Login Flow                                                                                   | Register Flow                                                                                      | Invoice Lifecycle                                                                                  |
|:--------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------:|
| [![Login](architecture/flows/login_flow.svg)](architecture/flows/login_flow.svg)           | [![Register](architecture/flows/register_flow.svg)](architecture/flows/register_flow.svg)        | [![Invoice](architecture/flows/invoice_flow.svg)](architecture/flows/invoice_flow.svg)           |

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

The application is designed to manage its own infrastructure. You don't need to manually start Docker containers or the backend server.

```bash
# 1. Clone the repository
git clone https://github.com/Dioman-Keita/invoice-app.git
cd invoice-app

# 2. Install dependencies
npm install
npm install --prefix client
npm install --prefix server

# 3. Build the backend (CRITICAL)
# This must be run every time you modify TypeScript code in the server folder
npm run build --prefix server

# 4. Start the application
npm run electron:dev
```

> [!CAUTION]
> Unlike the frontend (Vite), the backend does **not** hot-reload inside Electron. You **must** re-run `npm run build --prefix server` (or `cd server && npm run build`) for your changes to be reflected in the app.

---

> [!TIP]
> `npm run electron:dev` will automatically:
>
> 1. Start the Docker MySQL container (via `docker compose up -d`).
> 2. Spin up the Vite dev server for the frontend.
> 3. Fork and launch the Express backend.

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

*Output: `release/Invoice App Setup 0.0.0.exe`*

---

## 🔗 Deep Linking

The app registers `invoice-app://` in the Windows Registry.

* **Warm Start**: If the app is open, the renderer receives the link instantly via `IPC`.
* **Cold Start**: If closed, Electron launches, waits for the server to boot (health check), and *then* processes the pending link.

---

## 📡 API Documentation

The embedded server exposes a full REST API at `http://localhost:3000/api`.

* **Auth**: `/api/auth/login`, `/api/auth/register`
* **Invoices**: `/api/invoices` (CRUD), `/api/invoices/:id/dfc/approve`
* **Stats**: `/api/stats/dashboard`

---

## 🗺 Roadmap

* [x] **Phase 1**: Hybrid Architecture & Docker Integration
* [x] **Phase 2**: Deep Linking & Asset Protection
* [ ] **Phase 3**: Auto-updater
* [ ] **Phase 4**: Multi-machine sync (Remote DB option)
* [ ] **Phase 5**: Turborepo integration for better monorepo management (Planned)
* [ ] **Phase 6**: Complete Frontend migration to TypeScript (TSX)
* [ ] **Phase 7**: Comprehensive code reorganization and architectural refactoring (Client & Server)
* [ ] **Phase 8**: Systematic Jest integration for comprehensive pre-launch testing

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork & Clone
2. `git checkout -b my-feature`
3. Submit PR

---

**License**: MIT
