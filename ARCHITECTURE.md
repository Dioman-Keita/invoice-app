# Architecture & Technical Design 🏗️

This document details the unique "Masterclass" architecture of **Invoice App**. It is a **Hybrid Desktop/Web Application** designed to operate offline with local computing power (Docker).

## 📐 Overview: "Embedded Client-Server" Approach

Unlike a standard Electron application which is just an encapsulated web browser, **Invoice App** embeds its own complete backend infrastructure.

### The Tech Trio

1. **Electron (The Orchestrator)**: Does NOT handle business logic. It serves solely as:
    * Window container (BrowserWindow).
    * Process manager (starts/stops the Node.js server).
    * OS Gateway (Deep Linking, Docker check).
2. **Express + TypeScript (The Brain)**: A full REST API, identical to a cloud production server, but running locally on `localhost:3000`.
3. **Docker + MySQL (The Memory)**: The database runs in an isolated container, controlled by the application.

---

## 🔄 Data Flows & Sequences

### 1. Application Startup (Cold Start)

The `main.js` file orchestrates a complex startup sequence to ensure stability:

1. **Single Instance Lock**: Prevents multiple instances of the application.
2. **Docker Check**: Verifies if the Docker daemon is running (`docker compose up`).
3. **Backend Fork**: Launches the `server/dist/server.js` script as a child process.
4. **Health Check Loop**: `waitForServer()` pings `http://127.0.0.1:3000/api/health` every second.
5. **UI Load**: Once the server is ready, Electron loads the URL (local or prod).

### 2. Deep Linking (`invoice-app://` Protocol)

The application handles deep links for email authentication (e.g., password reset links).

* **Flow**: Email -> Link Click -> OS -> Electron Main -> IPC -> React Renderer.
* **Complexity**: Handling "Warm Start" (app already open) vs "Cold Start" (app closed).

#### Deep Linking Behavior

The application registers the `invoice-app://` protocol in the Windows Registry, enabling magic link authentication from email clients.

**Warm Start (Application Already Running):**
* ✅ **Works perfectly**: If the application is already open when a deep link is clicked, the renderer receives the link instantly via `IPC` and can immediately process the action (e.g., token validation, password reset).

**Cold Start (Application Closed):**
* ❌ **Does not work**: If the application is completely closed, clicking a deep link **will not launch the application** because the server is completely shut down. The deep link cannot be processed when the backend is not running.

**Why This Limitation Exists:**
This is a deliberate architectural choice aligned with the **"Local First"** philosophy:
* The application does **not** rely on external buffering servers or cloud relays
* All authentication and token validation happens **locally** on the user's machine
* Since the local backend takes time to initialize (Docker container startup + Node.js server boot), immediate token validation during cold start is not feasible
* Implementing a workaround would require external infrastructure, which conflicts with the offline-first, local-only design principles

**User Impact:**
Users must ensure the application is **already running** (Warm Start) before clicking deep links from emails. If the application is closed, they must:
1. Launch the application first
2. Wait for it to fully initialize
3. Then click the deep link (or copy/paste the token manually)

---

## Diagrams 📊

### Authentication Flow (Login)

![Login Flow](architecture/flows/login_flow.svg)

### Registration Flow

![Register Flow](architecture/flows/register_flow.svg)

### Invoice Lifecycle

![Invoice Flow](architecture/flows/invoice_flow.svg)

---

## 🛠️ Solved Technical Challenges

### 1. "Build Hell" (Packaging)

Packaging a complex Node.js app (with native dependencies) into an Electron exe is notoriously difficult.

* **Solution**: Using `extraResources` in `electron-builder` to copy the server's `node_modules` folder and the frontend build separately.
* **Independence**: The backend is treated as an autonomous external binary.

### 2. Port Synchronization

* **Problem**: If the app crashes, port 3000 remains occupied (zombie).
* **Solution**: Aggressive handling of `SIGINT`/`SIGTERM` in `main.js` and `server.ts` to cleanly kill child processes.

### 3. The Fiscal "Vise"

* **Rule**: Data is strictly compartmentalized by `fiscal_year`.
* **Implementation**: Middleware and Services systematically check the current fiscal year in counters and SQL queries, ensuring perfect accounting watertightness.

---

## ⚠️ Known Limitations & Architecture Decisions

### Deep Linking Cold Start Limitation

**Status**: Known limitation, **Won't Fix** (by design)

**Description**: Deep linking (e.g., `invoice-app://reset-password?token=...`) only works when the application is already running (Warm Start). If the application is completely closed (Cold Start), clicking a deep link will not launch the application because the server is completely shut down.

**Architecture Decision Record (ADR)**:
This behavior is an intentional trade-off of the **"Local First"** architecture. The design prioritizes:
1. **Privacy**: No external servers handle sensitive tokens
2. **Offline-first operation**: Complete independence from internet connectivity
3. **Simplicity**: Avoids complex buffering mechanisms or cloud relays

**Alternative Solutions Considered**:
* External buffering server to hold tokens until the app is ready → **Rejected** (conflicts with Local First philosophy)
* Pre-start background service to keep backend ready → **Rejected** (increases resource usage, complexity)
* Cloud token validation relay → **Rejected** (privacy concerns, offline requirement)

**Documentation Requirements**:
* This limitation must be clearly documented in user-facing documentation (README, User Guide)
* Users should be informed that deep links work best when the application is already running

**Reference**: [GitHub Issue #3](https://github.com/Dioman-Keita/invoice-app/issues/5)

---

## 🎥 Demonstration

A video demonstration of the full flow is available:
[Watch the demo (WebP)](architecture/video/demo_lite.webp)

---

*Document automatically generated from source code analysis.*