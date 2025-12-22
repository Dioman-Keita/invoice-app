# Invoice Management System (CMDT) 🚀

**Enterprise-level Invoice Management System** designed for scalability and offline-first usage.  
*Hybrid Architecture: Electron + Express + Docker.*

![App Banner](architechture/banner.png)

---

## 🎯 Table of Contents

* [Overview](#overview)
* [🎥 Demo & Visuals](#-demo--visuals)
* [🏗️ Architecture](#architecture)
* [Key Features](#key-features)
* [Tech Stack](#tech-stack)
* [Installation & Setup](#installation--setup)
* [Deep Linking](#-deep-linking)
* [API Documentation](#api-documentation)
* [Roadmap](#roadmap)
* [Contributing](#contributing)

---

## 📋 Overview

<a id="overview"></a>

**Invoice App** `v0.0.0` is a robust, offline-first desktop application that brings the power of a full-stack web server to the desktop. Use it to manage invoices, suppliers, and fiscal workflows with enterprise-grade security.

**Unique Selling Point**: Unlike standard Electron apps, this project runs a **real Node.js/Express server** and a **Dockerized MySQL database** locally on the user's machine, packaged into a single `.exe`.

---

## 🎥 Demo & Visuals

<a id="demo-visuals"></a>

### Video Demonstration

See the application in action:
**[▶️ Watch the Demo Video](architechture/video/demo.mp4)**

### Workflow Visualizations

To understand the core business logic, refer to our detailed flow diagrams:

| Login Flow | Register Flow | Invoice Lifecycle |
|:---:|:---:|:---:|
| [![Login](architechture/flows/login_flow.svg)](architechture/flows/login_flow.svg) | [![Register](architechture/flows/register_flow.svg)](architechture/flows/register_flow.svg) | [![Invoice](architechture/flows/invoice_flow.svg)](architechture/flows/invoice_flow.svg) |

---

## 🏗️ Architecture

<a id="architecture"></a>

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

<a id="key-features"></a>

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

<a id="tech-stack"></a>

**Dual-Stack Monorepo:**

| Frontend (Client) | Backend (Server) | Infrastructure |
| ----------------- | ---------------- | -------------- |
| **React 18**      | **Node.js**      | **Electron 39** (Wrapper) |
| Vite              | Express 5        | **Docker** (Database) |
| Tailwind CSS      | TypeScript       | MySQL 8.2 |
| HashRouter        | Carbone.io (PDF) | Electron Builder |

---

## ⚡ Installation & Setup

<a id="installation--setup"></a>

### Prerequisites

* **Docker Desktop** (Must be running)
* Node.js 18+

### Quick Start (Development)

```bash
# 1. Start Docker container (MySQL)
cd server
./manage-stack.bat # (or .sh on Mac/Linux)

# 2. Start Backend
npm run dev

# 3. Start Frontend (in new terminal)
cd ../client
npm run dev

# 4. Start Electron (Optional, invokes the above)
npm run electron:dev
```

### Build for Production (`.exe`)

This command compiles the React app, the TS server, and bundles everything into an installer:

```bash
npm run dist
```

*Output: `release/Invoice App Setup 0.0.0.exe`*

---

## 🔗 Deep Linking

<a id="deep-linking"></a>

The app registers `invoice-app://` in the Windows Registry.

* **Warm Start**: If the app is open, the renderer receives the link instantly via `IPC`.
* **Cold Start**: If closed, Electron launches, waits for the server to boot (health check), and *then* processes the pending link.

---

## 📡 API Documentation

<a id="api-documentation"></a>

The embedded server exposes a full REST API at `http://localhost:3000/api`.

* **Auth**: `/api/auth/login`, `/api/auth/register`
* **Invoices**: `/api/invoices` (CRUD), `/api/invoices/:id/dfc/approve`
* **Stats**: `/api/stats/dashboard`

---

## 🗺 Roadmap

<a id="roadmap"></a>

* [x] **Phase 1**: Hybrid Architecture & Docker Integration
* [x] **Phase 2**: Deep Linking & Asset Protection
* [ ] **Phase 3**: Auto-updater
* [ ] **Phase 4**: Multi-machine sync (Remote DB option)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork & Clone
2. `git checkout -b my-feature`
3. Submit PR

---

**Author**: Dioman Keita  
**License**: MIT
