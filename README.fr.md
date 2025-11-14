# Système de gestion de factures (CMDT) 🚀

Système de gestion de factures prêt pour l'entreprise, conçu pour une capacité extrême : jusqu'à **999 999 999 999 factures par an**, audit complet, sécurité avancée, et interface moderne.

---

## 🎯 Sommaire

* [Aperçu](#apercu)
* [Fonctionnalités-clés](#fonctionnalites-cles)
* [Technologies](#technologies)
* [Prérequis](#prerequis)
* [Installation rapide](#installation-rapide)
* [Configuration](#configuration)
* [Développement](#developpement)
* [Documentation API](#documentation-api)
* [Architecture grande échelle](#architecture-grande-echelle)
* [Sécurité & Authentification](#securite-authentification)
* [Mises à jour récentes](#mises-a-jour-recentes)
* [Feuille de route](#feuille-de-route)
* [Contribution](#contribution)
* [Licence](#licence)
* [Support](#support)

---

## 📋 Aperçu

<a id="apercu"></a>

Invoice Manager est un système de gestion de factures complet, pensé pour les entreprises exigeantes.

**Points forts :**

* Grande capacité : jusqu'à 999 999 999 999 factures/an (aucune confusion avec 1 milliard)
* Sécurité : JWT HttpOnly, traçabilité complète, droits granulaires
* Expérience utilisateur moderne : React + Tailwind, validation temps réel, interface responsive
* Export avancé : PDF, Excel avec historique détaillé
* Workflow : CRUD factures et fournisseurs, processus DFC
* Gestion d'exercice fiscal : bascule automatique et planification jusqu'à deux ans d'avance

---

## ✨ Fonctionnalités-clés

<a id="fonctionnalites-cles"></a>

### 🚀 Architecture Grande Échelle

* Format d'identifiant optimisé : `INV-000000000001` (12 chiffres séquentiels)
* Performances élevées : indexation, compteur dédié `BIGINT`
* Anti-duplication : vérification des ID existants & synchronisation automatique

### 🔐 Sécurité & Authentification

* JWT HttpOnly cookies (protection XSS)
* Gestion des sessions (durée dynamique côté backend suivant le "remember me")
* Contrôle des accès par rôles : admin, gestionnaire de factures, agent DFC
* Traçabilité complète de toutes les actions
* Hachage des mots de passe (bcrypt) & validation robuste

### 📊 Gestion des factures

* CRUD complet avec validation avancée
* Recherche multi-critères par fournisseur
* Workflow DFC (validation/refus) avec commentaires
* Numérotation intelligente et séquentielle

### 💼 Gestion des fournisseurs

* Numéro de compte : TOUS les formats valides sont acceptés (ne se limite PAS à 12 chiffres)
* Vérification des conflits (compte/fournisseur/téléphone)
* Recherche flexible multi-critères
* Interface moderne et dynamique

### 📤 Export & Rapports

* Export PDF & Excel uniquement (plus de TXT)
* Filtrage avancé par période
* Historique complet et traçable

---

## 🛠 Technologies

<a id="technologies"></a>

### Frontend

```
React 18 + Vite
├── UI : Tailwind CSS + Heroicons
├── Forms : React Hook Form + Zod
├── State : React Context + Hooks
├── Routing : React Router
└── Build : Vite (HMR, optimisation)
```

### Backend

```
Node.js + Express + TypeScript
├── Auth : JWT HttpOnly + bcrypt
├── DB : MySQL 8.2 (Docker)
├── Validation : Custom
├── Logging : Logger personnalisé
├── Audit : traçabilité complète
└── API : RESTful + Express Router
```

### Base de données

```
MySQL 8.2 via Docker
├── Tables : invoice, supplier, employee, audit_log
├── Indexation optimisée pour la performance
├── Contraintes : clés étrangères et uniques
└── Scalabilité : prêt pour le partitionnement
```

---

## ⚡ Prérequis

<a id="prerequis"></a>

* Node.js 18+ et npm 9+
* MySQL 8.2 (via Docker)
* Navigateur moderne (Chrome 90+, Firefox 88+)
* Docker + Docker Compose

---

## 🚀 Installation rapide

<a id="installation-rapide"></a>

```bash
# Cloner le dépôt
git clone https://github.com/Dioman-Keita/invoice-app.git
cd invoice-app

# Installer les dépendances
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### ⚠️ Attention : Initialisation Docker

> Les scripts d'initialisation Docker (`server/manage-task.sh` ou `server/manage-task.bash`) effectuent un **reset complet du moteur Docker** :  
> Cela signifie qu'ils suppriment non seulement les conteneurs et images liés au projet invoice-app, mais peuvent réinitialiser tout le moteur Docker (tous les conteneurs/images présents localement).  
> **Utilisez-les avec précaution** si vous avez d'autres projets sur votre Docker local.

---

## ⚙️ Configuration

<a id="configuration"></a>

Créer le fichier `server/.env` :

```bash
# Authentification
JWT_SECRET_KEY=super_secret_key_change_me

# Environnement
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cmdt_invoice_db
```
> Les durées d’expiration JWT sont gérées automatiquement côté backend. Inutile de les définir dans `.env`.

---

## 👨‍💻 Développement

<a id="developpement"></a>

```bash
# Lancer le frontend :
cd invoice-app
npm run dev

# Lancer le backend :
cd server
npm run dev
```

**URLs par défaut** :

* Frontend : [http://localhost:5173](http://localhost:5173)
* Backend API : [http://localhost:3000](http://localhost:3000)

---

## 📡 Documentation API

<a id="documentation-api"></a>

### Authentification

* POST /auth/login
* POST /auth/register
* POST /auth/forgot-password
* POST /auth/reset-password
* POST /auth/silent-refresh
* GET /auth/status
* GET /auth/profile
* POST /auth/logout
* POST /auth/admin/create-user

### Factures

* CRUD complet (GET, POST, update, delete)
* Workflow DFC : acceptation/refus, commentaires
* Recherche multi-critères

### Fournisseurs

* CRUD, recherche avancée, validation des conflits

### Export

* PDF, Excel (pas de TXT)
* Historique et suivi des exports

---

## 🌟 Architecture grande échelle

<a id="architecture-grande-echelle"></a>

* Capacité extrême : jusqu'à 999 999 999 999 factures/an
* ID facture : `INV-000000000001` (12 chiffres)
* Compteur sur BIGINT pour garantir performance et atomicité
* Optimisations : indexation par séquence, pas de `SELECT MAX()`, prévention des doublons

---

## 🔐 Sécurité & Authentification

<a id="securite-authentification"></a>

* JWT + cookies HttpOnly, protections CSRF & XSS
* Contrôle d’accès par rôle : admin / gestionnaire de factures / agent DFC
* Audit trail : toutes les actions sont tracées
* Suivi d’activité : exports et opérations

---

## 🚀 Mises à jour récentes

<a id="mises-a-jour-recentes"></a>

* Migration vers **Docker + MySQL 8.2**
* Backend strictement typé en TypeScript
* Optimisation de l’export PDF, Excel
* Nouveaux scripts pour initialisation Docker
* Corrections de bugs et améliorations de performance

---

## 🗺 Feuille de route

<a id="feuille-de-route"></a>

### Phase 1 (actuelle)

* Architecture billion-scale
* Système d’export moderne
* Audit logging enrichi
* Couverture TypeScript complète
* Améliorations UX Responsive

### Phase 2 (prochaine)

* Notifications en temps réel (WebSocket)
* Analytics avancé (dashboard)
* Opérations en masse
* Limitation de débit API
* Tests d’intégration

### Phase 3 (futur)

* Microservices (découpage Invoice + Auth)
* Queue system (traitement asynchrone)
* Application mobile (React Native)
* Modèle multi-tenant
* IA (détection doublons, OCR…)

---

## 🤝 Contribution

<a id="contribution"></a>

1. Forkez le dépôt
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commitez vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. Pushez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request sur GitHub

---

## 📄 Licence

<a id="licence"></a>

Licence MIT — voir [LICENSE](LICENSE)

---

## 📞 Support

<a id="support"></a>

* Email : [diomankeita001@gmail.com](mailto:diomankeita001@gmail.com)

---

Ce logiciel est fourni dans une démarche professionnelle de robustesse et de performance pour la gestion volumique des factures.

*Dernière mise à jour : novembre 2025*
