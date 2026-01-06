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

The application handles deep links for email authentication.

* **Flow**: Email -> Link Click -> OS -> Electron Main -> IPC -> React Renderer.
* **Complexity**: Handling "Warm Start" (app already open) vs "Cold Start" (app closed).

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

## 🎥 Demonstration

A video demonstration of the full flow is available:
[Watch the demo video](architecture/video/demo.mp4)

---

*Document automatically generated from source code analysis.*
