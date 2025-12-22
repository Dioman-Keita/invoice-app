# Architecture & Conception Technique 🏗️

Ce document détaille l'architecture unique "Masterclass" de projet **Invoice App**. Il s'agit d'une **application hybride Desktop/Web** conçue pour fonctionner hors-ligne avec une puissance de calcul locale (Docker).

## 📐 Vue d'ensemble : L'Approche "Client-Serveur Embarqué"

Contrairement à une application Electron classique qui n'est qu'un navigateur web encapsulé, **Invoice App** embarque sa propre infrastructure backend complète.

### Le Trio Technologique
1.  **Electron (Le Chef d'Orchestre)** : Ne gère PAS la logique métier. Il sert uniquement de :
    *   Conteneur de fenêtre (BrowserWindow).
    *   Gestionnaire de processus (lance/arrête le serveur Node.js).
    *   Passerelle OS (Deep Linking, Docker check).
2.  **Express + TypeScript (Le Cerveau)** : Une API REST complète, identique à un serveur de production cloud, mais exécutée localement sur `localhost:3000`.
3.  **Docker + MySQL (La Mémoire)** : La base de données tourne dans un conteneur isolé, piloté par l'application.

---

## 🔄 Flux de Données et Séquences

### 1. Démarrage de l'Application (Cold Start)
Le fichier `main.js` orchestre une séquence de démarrage complexe pour garantir la stabilité :

1.  **Single Instance Lock** : Empêche l'ouverture multiple de l'application.
2.  **Docker Check** : Vérifie si le démon Docker tourne (`docker compose up`).
3.  **Backend Fork** : Lance le script `server/dist/server.js` en processus enfant.
4.  **Health Check Loop** : `waitForServer()` ping `http://127.0.0.1:3000/api/health` toutes les secondes.
5.  **UI Load** : Une fois le serveur prêt, Electron charge l'URL (locale ou prod).

### 2. Deep Linking (Protocole `invoice-app://`)
L'application gère les liens profonds pour l'authentification par email.

*   **Proflux** : Email -> Clic lien -> OS -> Electron Main -> IPC -> React Renderer.
*   **Complexité** : Gestion du "Warm Start" (app déjà ouverte) vs "Cold Start" (app fermée).

---

##  diagrams 📊

### Flux d'Authentification (Login)
![Login Flow](architechture/flows/login_flow.svg)

### Flux d'Enregistrement
![Register Flow](architechture/flows/register_flow.svg)

### Cycle de Vie d'une Facture
![Invoice Flow](architechture/flows/invoice_flow.svg)

---

## 🛠️ Défis Techniques Résolus

### 1. Le "Build Hell" (Packaging)
Packager une app Node.js complexe (avec dépendances natives) dans un exe Electron est notoirement difficile.
*   **Solution** : Utilisation de `extraResources` dans `electron-builder` pour copier le dossier `node_modules` du serveur et le build du front séparément.
*   **Indépendance** : Le backend est traité comme un binaire externe autonome.

### 2. La Synchronisation des Ports
*   **Problème** : Si l'app crash, le port 3000 reste occupé (zombie).
*   **Solution** : Gestion agressive du `SIGINT`/`SIGTERM` dans `main.js` et `server.ts` pour tuer proprement les processus enfants.

### 3. La "Tenaille" Fiscale
*   **Règle** : Les données sont cloisonnées par `fiscal_year`.
*   **Implémentation** : Middleware et Services vérifient systématiquement l'année fiscale courante dans les compteurs et les requêtes SQL, garantissant une étanchéité comptable parfaite.

---

## 🎥 Démonstration

Une vidéo de démonstration du flux complet est disponible :
[Voir la démo vidéo](architechture/video/demo.mp4)

---

*Document généré automatiquement à partir de l'analyse du code source.*
