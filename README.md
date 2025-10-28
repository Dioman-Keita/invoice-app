# Invoice Management System (CMDT) 🚀

Application de gestion de factures enterprise-ready avec support pour **1 milliard de factures par année fiscale**, système d'audit complet, et interface moderne.

## 🎯 Sommaire
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Quick Installation](#quick-installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Billion-Scale System](#billion-scale-system)
- [Authentication & Security](#authentication--security)
- [Recent Updates](#recent-updates)
- [Roadmap](#roadmap)

---

## 📋 Overview

Système complet de gestion de factures CMDT avec :
- **Scalability extrême** : Support 1 milliard de factures/an par année fiscale
- **Sécurité renforcée** : JWT HttpOnly, audit trail complet, rôles granulaires
- **UX moderne** : React + Tailwind, validation temps réel, interface responsive
- **Gestion fiscale** : Système d'année fiscale flexible avec auto-switch
- **Export avancé** : PDF, Excel, CSV, TXT, JSON avec historique complet

---

## ✨ Key Features

### 🚀 **Billion-Scale Architecture**
- **Format ID scalable** : `INV-FY2025-000000001` (12 chiffres séquentiels)
- **Gestion année fiscale** : Bascule automatique, compteur dédié `BIGINT`
- **Performance optimisée** : Index par année fiscale, pas de `SELECT MAX()`
- **Anti-duplicata** : Vérification IDs existants + synchronisation automatique

### 🔐 **Security & Authentication**
- JWT HttpOnly cookies (mitigation XSS)
- Session management avec inactivité (5min/30min)
- Role-based access control (admin/manager/agent)
- Activity tracking & audit trail complet
- Password hashing bcrypt, validation Zod

### 📊 **Invoice Management**
- CRUD complet avec validation avancée
- Recherche multi-critères par fournisseur
- Filtrage par année fiscale automatique
- Workflow DFC (approve/reject) avec commentaires
- Système de numérotation intelligent

### 💼 **Supplier Management**
- Numéro de compte unique (12 chiffres)
- Validation conflicts (téléphone/compte)
- Recherche flexible multi-critères
- Interface moderne avec feedback temps réel

### 📤 **Export & Reports**
- Export PDF, Excel, CSV, TXT, JSON
- Filtrage temporel + année fiscale
- Historique des exports avec tracking
- Interface moderne avec états de chargement

---

## 🛠 Tech Stack

### Frontend
```
React 18 + Vite
├── UI: Tailwind CSS + Heroicons
├── Forms: React Hook Form + Zod
├── State: React Context + Hooks
├── Routing: React Router v6
├── Validation: Temps réel + progressive
└── Build: Vite (HMR, optimization)
```

### Backend
```
Node.js + Express + TypeScript
├── Auth: JWT HttpOnly + bcrypt
├── DB: MySQL 8+ avec connection pooling
├── Validation: Joi + Zod schemas
├── Logging: Winston custom logger
├── Audit: Activity tracking complet
└── API: RESTful + Express Router
```

### Database
```
MySQL 8+ enterprise-ready
├── Tables: invoice, supplier, employee, audit_log
├── Indexing: Année fiscale optimisée
├── Constraints: Clés étrangères + uniques
├── Types: VARCHAR(30), BIGINT, JSON
└── Scaling: Prêt pour partitionnement
```

---

## 🏗 Project Architecture

```
invoice-app/
├── 📱 client/                    # Frontend React
│   ├── src/
│   │   ├── features/            # Domain logic
│   │   │   ├── invoices/        # Invoice components
│   │   │   ├── suppliers/       # Supplier management
│   │   │   ├── auth/           # Authentication flow
│   │   │   └── export/         # Export interface
│   │   ├── components/         # Shared UI
│   │   │   ├── validation/     # Form validation
│   │   │   ├── form/          # Form containers
│   │   │   └── global/        # Layout components
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Helpers
│   └── package.json
├── 🔧 server/                   # Backend Express
│   ├── controllers/           # Business logic
│   │   ├── invoice.controller.ts
│   │   ├── auth.controller.ts
│   │   └── export.controller.ts
│   ├── middleware/           # Auth, validation
│   ├── routes/               # API endpoints
│   ├── services/             # GenerateId, audit, email
│   ├── models/               # Database models
│   ├── utils/                # Helpers, validators
│   └── db/                   # Schema & migrations
├── 📚 common/                 # Shared utilities
├── 📄 docs/                  # API documentation
└── 📋 README.md
```

---

## ⚡ Prerequisites

- **Node.js** 18+ et npm 9+
- **MySQL** 8+ (support VARCHAR(30), BIGINT)
- **Navigateur moderne** (Chrome 90+, Firefox 88+)

---

## 🚀 Quick Installation

```bash
# Clone repository
git clone <repository-url>
cd invoice-app

# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Database setup
mysql -u root -p < server/db/db.sql
```

---

## ⚙️ Configuration

Créer `server/.env` :

```bash
# Authentication
JWT_SECRET_KEY=super_secret_key_change_me_in_production
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

# Fiscal Year Settings
FISCAL_YEAR=2025
AUTO_YEAR_SWITCH=true
```

---

## 🗄 Database Setup

### Import Schema
```bash
# Import complete schema with billion-scale support
mysql -u root -p < server/db/db.sql
```

### Key Schema Updates (Oct 2025)
```sql
-- Invoice IDs: 15 -> 30 characters (support INV-FY2025-000000001)
ALTER TABLE invoice MODIFY COLUMN id VARCHAR(30) PRIMARY KEY;

-- Fiscal Year: 4 -> 7 characters (support FY2025)
ALTER TABLE invoice MODIFY COLUMN fiscal_year VARCHAR(7) NOT NULL;

-- Counter: INT -> BIGINT (support 1 billion+)
ALTER TABLE fiscal_year_counter MODIFY COLUMN last_cmdt_number BIGINT NOT NULL;

-- num_cmdt: VARCHAR(10) -> VARCHAR(12) (support 12 chiffres)
ALTER TABLE invoice MODIFY COLUMN num_cmdt VARCHAR(12) NOT NULL;

-- created_by: VARCHAR(15) -> VARCHAR(30) (support IDs employés comme EMP-2025-000000001)
ALTER TABLE invoice MODIFY COLUMN created_by VARCHAR(30);

-- Export Log: Support TXT format + longer IDs
ALTER TABLE export_log MODIFY COLUMN invoice_id VARCHAR(30);
ALTER TABLE export_log MODIFY COLUMN format ENUM('PDF', 'Excel', 'CSV', 'JSON', 'TXT');
```

### Migration pour existant
```sql
-- Pour bases existantes avec anciens IDs
UPDATE invoice SET id = CONCAT('INV-FY', fiscal_year, '-', LPAD(SUBSTRING_INDEX(id, '-', -1), 12, '0')) 
WHERE id NOT LIKE 'INV-FY%';
```

---

## 👨‍💻 Development

```bash
# Terminal 1: Backend (Express + TypeScript)
cd server && npm run dev

# Terminal 2: Frontend (React + Vite)  
cd client && npm run dev

# Terminal 3: Database (optional)
mysql -u root -p cmdt_invoice_db
```

**URLs**: 
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

---

## 📡 API Documentation

### Authentication Endpoints
```http
POST /auth/login           # Login avec remember me
POST /auth/register        # Inscription
POST /auth/logout          # Déconnexion
GET  /auth/status          # Statut session
GET  /auth/profile         # Profil utilisateur
POST /auth/admin/create    # Création utilisateur (admin)
```

### Invoice Endpoints (Billion-Scale Ready)
```http
GET  /invoices/last-num    # Dernier numéro (12 chiffres)
GET  /invoices/next-num    # Prochain numéro attendu
GET  /invoices?fy=2025     # Liste par année fiscale
GET  /invoices/:id         # Détail facture
POST /invoices             # Création (ID auto-généré)
PUT  /invoices/:id         # Mise à jour
DEL  /invoices/:id         # Suppression (admin)

# DFC Workflow
GET  /invoices/dfc/pending # Factures en attente DFC
POST /invoices/:id/dfc/approve # Approuver
POST /invoices/:id/dfc/reject   # Rejeter
```

### Export Endpoints
```http
POST /export/advanced      # Export multi-format (PDF, Excel, CSV, TXT, JSON)
GET  /export/history       # Historique exports utilisateur
GET  /fiscal-years         # Années fiscales disponibles
```

### Supplier Endpoints  
```http
GET  /suppliers            # Liste fournisseurs
POST /suppliers            # Création fournisseur
GET  /suppliers/search     # Recherche multi-critères
POST /suppliers/verify     # Vérification conflits
```

---

## 🌟 Billion-Scale System

### 📊 Capacité du Système

Le système peut enregistrer **jusqu'à 999 999 999 999 factures par année fiscale** :

**Champ `num_cmdt` (numéro CMDT courrier)**:
- **Format** : 12 chiffres (000000000001 à 999999999999)
- **Base de données** : `VARCHAR(12)` (mis à jour de VARCHAR(10))
- **Validation client** : Exactement 12 chiffres requis
- **Compteur** : `BIGINT` dans `fiscal_year_counter`

**Configuration technique**:
```json
{
  "cmdt_format": {
    "padding": 12, 
    "max": 999999999999
  }
}
```

**Flux de validation complet**:
- **Statut de facture** : `Non` (en attente) → `Oui` (validée)
- **Décision DFC** : `pending` → `approved`/`rejected`
- **Capacité par statut** : Illimité (même limite de 999B par statut)

**Capacité totale**:
- **Par année fiscale** : 999 999 999 999 factures
- **Multi-années** : Illimité (basculement automatique d'année fiscale)
- **Tous flux confondus** : 999 999 999 999 × nombre d'années

**Alertes et monitoring**:
- **Seuil d'avertissement** : 100 000 000 factures (10% capacité)
- **Basculement automatique** : Nouvelle année fiscale
- **Tracking en temps réel** : Compteur disponible dans les paramètres

### ID Generation System
**Format**: `INV-FY{YEAR}-{SEQUENCE_12_DIGITS}`

**Exemples**:
- `INV-FY2025-000000001` (Première facture 2025)
- `INV-FY2025-000999999999` (999 millionième facture)
- `INV-FY2026-000000001` (Reset année fiscale)

### Performance Optimizations
- **No SELECT MAX()**: Compteur dédié `fiscal_year_counter`
- **Atomic operations**: Mise à jour en une seule requête
- **Index optimization**: Par année fiscale + séquence
- **Duplicate prevention**: Vérification IDs existants

### Fiscal Year Management
- **Auto-switch**: Basculement automatique au 1er janvier
- **Manual override**: Administration possible
- **Counter isolation**: Chaque année a son compteur
- **Data integrity**: Contraintes + transactions

### Scale Validation
```sql
-- Support vérifié pour 1 milliard+ factures/an
SELECT COUNT(*) as invoices_per_year 
FROM invoice 
WHERE fiscal_year = 'FY2025';  -- Jusqu'à 999,999,999,999

-- Performance indexée
EXPLAIN SELECT * FROM invoice 
WHERE fiscal_year = 'FY2025' 
ORDER BY create_at DESC;
```

---

## 🔐 Authentication & Security

### JWT + HttpOnly Cookies
- **XSS Protection**: Tokens non accessibles en JavaScript
- **CSRF Mitigation**: SameSite + Secure en production
- **Session Management**: Inactivity timeout configurable
- **Silent Refresh**: Renouvellement transparent tokens

### Role-Based Access Control
```
admin:           # Accès complet
├── CRUD utilisateurs
├── Suppression factures  
├── Paramètres système
└── Export illimité

invoice_manager: # Gestion factures
├── CRUD factures + fournisseurs
├── Validation workflow
├── Export limité
└── Vue statistiques

dfc_agent:       # Validation DFC
├── Approuver/rejeter factures
├── Commentaires décisions
├── Vue limitée
└── Export historique perso
```

### Audit Trail & Activity Tracking
```sql
-- Toutes les actions tracées
INSERT INTO audit_log (
  action, table_name, record_id, 
  performed_by, description, performed_at
) VALUES (...);

-- Exports individuellement tracés  
INSERT INTO export_log (
  invoice_id, format, exported_at, exported_by
) VALUES (...);
```

---

## 🚀 Recent Updates (Oct 2025)

### 🎯 **Billion-Scale Refactor**
- ✅ **ID Format**: `INV-FY2025-000000001` (12 digits)
- ✅ **Database**: VARCHAR(30), BIGINT, indexing optimisé
- ✅ **Counter System**: Atomic, no race conditions
- ✅ **Fiscal Year Logic**: Correct implementation
- ✅ **Duplicate Prevention**: Real-world ID checking

### 🔧 **Database Fix (Oct 2025)**
- ✅ **num_cmdt Column**: VARCHAR(10) → VARCHAR(12) (compatibilité 12 chiffres)
- ✅ **created_by Column**: VARCHAR(15) → VARCHAR(30) (support IDs employés)
- ✅ **Migration Script**: `fix_num_cmdt_length.sql` fourni et mis à jour
- ✅ **Error Resolution**: "Data too long" corrigé pour num_cmdt et created_by
- ✅ **Schema Update**: `db.sql` mis à jour pour nouvelles installations

### 🎨 **UX/UI Improvements**  
- ✅ **12-digit Input**: Validation temps réel
- ✅ **Smart Formatting**: Auto-zéro padding
- ✅ **Export Interface**: Modern with history
- ✅ **Fiscal Year UI**: Dynamic loading + display
- ✅ **Error Handling**: User-friendly messages

### 🔧 **Backend Enhancements**
- ✅ **Export Logging**: Automatic DB tracking
- ✅ **API Consistency**: RESTful patterns
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Performance**: Optimized queries + indexes
- ✅ **Validation**: Zod + Joi schemas aligned

### 📊 **Export System**
- ✅ **Multi-format**: PDF, Excel, CSV, TXT, JSON
- ✅ **Advanced Filters**: Date range + fiscal year
- ✅ **History Tracking**: Personal export logs
- ✅ **File Generation**: Proper streaming + headers

---

## 🗺 Roadmap

### 🎯 Phase 1 (Current)
- [x] Billion-scale architecture
- [x] Modern export system
- [x] Enhanced audit logging
- [x] TypeScript coverage
- [x] Responsive UX improvements

### 🚀 Phase 2 (Next)
- [ ] **Real-time Notifications**: WebSocket updates
- [ ] **Advanced Analytics**: Dashboard + charts
- [ ] **Bulk Operations**: Mass import/export
- [ ] **API Rate Limiting**: Production security
- [ ] **Integration Tests**: Complete coverage

### 🔮 Phase 3 (Future)
- [ ] **Microservices**: Invoice + Auth分离
- [ ] **Queue System**: Background processing
- [ ] **Mobile App**: React Native
- [ ] **Multi-tenant**: Company isolation
- [ ] **AI Features**: Duplicate detection, OCR

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- 📧 Email: support@invoice-app.com
- 💬 Discord: [Community Server]
- 📖 Docs: [Documentation Site]
- 🐛 Issues: [GitHub Issues]

---

**Built with ❤️ for enterprise-scale invoice management**

*Last updated: October 2025 - Billion-Scale Architecture Ready*
