# Invoice Management System (CMDT) 🚀

Système de gestion de factures **enterprise-ready** avec support pour **1 milliard de factures par an**, audit complet, sécurité renforcée, et interface moderne.

---

## 🎯 Sommaire

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

Invoice Manager est un système complet de gestion de factures conçu pour les entreprises exigeantes.

**Points forts :**

* **Scalabilité** : 1 milliard de factures/an
* **Sécurité** : JWT HttpOnly, audit trail complet, rôles granulaires
* **UX moderne** : React + Tailwind, validation temps réel, interface responsive
* **Export avancé** : PDF, Excel, TXT, JSON avec historique complet
* **Workflow** : CRUD factures et fournisseurs, validation DFC
* **Fiscal Year Management** : bascule automatique d’année fiscale et support pour programmation jusqu’à +2 ans par rapport à l’année réelle


---

## ✨ Key Features

<a id="key-features"></a>

### 🚀 Billion-Scale Architecture

* Format ID scalable : `INV-000000000001` (12 chiffres séquentiels)
* Performance optimisée : indexation et compteur dédié `BIGINT`
* Anti-duplicata : vérification IDs existants + synchronisation automatique

### 🔐 Security & Authentication

* JWT HttpOnly cookies (mitigation XSS)
* Session management avec timeout configurable
* Role-based access control : admin, invoice_manager, dfc_agent
* Activity tracking & audit trail complet
* Password hashing bcrypt et validation Zod

### 📊 Invoice Management

* CRUD complet avec validation avancée
* Recherche multi-critères par fournisseur
* Workflow DFC (approve/reject) avec commentaires
* Numérotation intelligente et séquentielle

### 💼 Supplier Management

* Numéro de compte unique (12 chiffres)
* Validation des conflits (téléphone/compte)
* Recherche flexible multi-critères
* Interface moderne avec feedback temps réel

### 📤 Export & Reports

* Export PDF, Excel, TXT, JSON
* Filtrage temporel
* Historique des exports avec tracking
* Interface moderne avec états de chargement

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
├── Audit: Activity tracking complet
└── API: RESTful + Express Router
```

### Database

```
MySQL 8.2 via Docker
├── Tables: invoice, supplier, employee, audit_log
├── Indexing optimisé pour performances
├── Constraints: Clés étrangères + uniques
└── Scaling: Prêt pour partitionnement
```

---

## ⚡ Prerequisites

<a id="prerequisites"></a>

* Node.js 18+ et npm 9+
* MySQL 8.2 via Docker
* Navigateur moderne (Chrome 90+, Firefox 88+)
* Docker + Docker Compose installés

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

### 🔹 Docker Initialization

* **Windows** : `invoice-app/server/manage-task.bat`
* **Linux/macOS** : `invoice-app/server/manage-task.sh`

Ces scripts gèrent le lancement de Docker, la création des volumes MySQL et la configuration initiale.

---

## ⚙️ Configuration

<a id="configuration"></a>

Créer `server/.env` :

```bash
# Authentication
JWT_SECRET_KEY=super_secret_key_change_me
JWT_EXPIRES_IN=5m
JWT_REFRESH_EXPIRES_IN=30m

# Environment
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cmdt_invoice_db
```

---

## 👨‍💻 Development

<a id="development"></a>

```bash
# Terminal 1: Backend (Express + TypeScript)
cd server && npm run dev

# Terminal 2: Frontend (React + Vite)
cd client && npm run dev
```

**URLs par défaut** :

* Frontend : [http://localhost:5173](http://localhost:5173)
* Backend API : [http://localhost:3000](http://localhost:3000)
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

* CRUD complet (GET, POST, update, delete)
* Workflow DFC : approve/reject
* Recherche multi-critères

### Supplier

* CRUD, recherche multi-champs, validation conflits

### Export

* PDF, Excel, TXT, JSON
* Historique et suivi des exports

---

## 🌟 Billion-Scale System

<a id="billion-scale-system"></a>

* Capacité : **jusqu'à 999 999 999 999 factures/an**
* ID facture : `INV-000000000001` (12 chiffres)
* Counter : BIGINT pour performance et atomicité
* Optimisations : indexation par séquence, pas de `SELECT MAX()`, prevention duplicata

---

## 🔐 Authentication & Security

<a id="authentication--security"></a>

* JWT + HttpOnly cookies, CSRF & XSS protection
* Role-Based Access Control : admin / invoice_manager / dfc_agent
* Audit trail : toutes les actions tracées
* Activity tracking : exports et opérations suivis

---

## 🚀 Recent Updates

<a id="recent-updates"></a>

* Migration vers **Docker + MySQL 8.2** pour stabilité
* Typage strict TypeScript backend
* Optimisation des exports PDF, Excel, TXT, JSON
* Scripts `manage-task.bat` / `manage-task.sh` pour init Docker
* Correction des erreurs et amélioration de la performance

---

## 🗺 Roadmap

<a id="roadmap"></a>

### Phase 1 (Current)

* Billion-scale architecture
* Modern export system
* Enhanced audit logging
* TypeScript coverage
* Responsive UX improvements

### Phase 2 (Next)

* Real-time Notifications (WebSocket)
* Advanced Analytics (Dashboard)
* Bulk Operations
* API Rate Limiting
* Integration Tests

### Phase 3 (Future)

* Microservices (Invoice + Auth separation)
* Queue System (Background processing)
* Mobile App (React Native)
* Multi-tenant
* AI Features (Duplicate detection, OCR)

---

## 🤝 Contributing

<a id="contributing"></a>

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

<a id="license"></a>

MIT License - see [LICENSE](LICENSE)

---

## 📞 Support

<a id="support"></a>

* 📧 Email: [diomankeita@example.com](mailto:diomankeita@example.com)
* 🌐 Site officiel : [https://www.cmdt-invoice.com](https://www.cmdt-invoice.com)
* 💬 Discord: Community Server
* 🐛 GitHub Issues: [Issues](https://github.com/Dioman-Keita/invoice-app.git/issues)

---

**Built with ❤️ for enterprise-scale invoice management**

*Last updated: November 2025 – Billion-Scale Architecture Ready*
