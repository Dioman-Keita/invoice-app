# Guide de Démarrage Rapide

## **1. Installation des dépendances**
```bash
# Dans le dossier server/
npm install
```

## **2. Configuration de l'environnement**
Créer un fichier `.env` dans `server/` :
```env
JWT_SECRET_KEY=votre_cle_secrete_ici
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000

# Configuration base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=cmdt_invoice_db
```

## **3. Configuration de la base de données**
```bash
# 1. Créer la base de données
mysql -u root -p < server/db/cmdt_invoice_db.sql

# 2. Ajouter la traçabilité utilisateur
mysql -u root -p cmdt_invoice_db < server/db/add_user_tracking_to_invoice.sql
```

## **4. Démarrage du serveur**
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm run build
npm start
```

## **5. Test des routes**
```bash
# Test de santé
curl http://localhost:3000/api/health

# Test d'inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cmdt.com","password":"motdepasse","firstName":"Test","lastName":"User","role":"dfc_agent","terms":true}'

# Test de connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cmdt.com","password":"motdepasse","role":"dfc_agent","rememberMe":false}'

# Test du statut d'authentification
curl http://localhost:3000/api/auth/status \
  -H "Cookie: auth_token=VOTRE_TOKEN_ICI"

# Test du profil (avec cookie)
curl http://localhost:3000/api/auth/profile \
  -H "Cookie: auth_token=VOTRE_TOKEN_ICI"
```

## **6. Structure des routes**
```
http://localhost:3000/api/
├── auth/
│   ├── login              (POST) - Connexion avec gestion rememberMe
│   ├── register           (POST) - Inscription avec validation
│   ├── forgot-password   (POST) - Demande de réinitialisation
│   ├── reset-password     (POST) - Réinitialisation avec token
│   ├── status            (GET) - Statut avec gestion d'inactivité
│   ├── silent-refresh    (POST) - Rafraîchissement silencieux
│   ├── profile           (GET) - Profil utilisateur (protégé)
│   ├── logout            (POST) - Déconnexion avec nettoyage
│   ├── token             (GET) - Vérification token
│   └── admin/create-user (POST) - Création utilisateur (admin)
├── invoices/
│   ├── last-num            (GET)  - Dernier numéro enregistré (agent, manager)
│   ├── next-num            (GET)  - Prochain numéro attendu (manager, admin)
│   ├── /                   (GET, POST) - Lister / Créer (protégé, traçabilité)
│   ├── /:id                (GET)  - Détail avec vérification permissions
│   ├── update/:id          (POST) - Mise à jour (manager, admin)
│   ├── delete/:id          (POST) - Suppression (admin)
│   ├── dfc/pending         (GET)  - Factures DFC en attente (agent, manager)
│   ├── :id/dfc/approve     (POST) - Approuver facture DFC (agent, manager)
│   └── :id/dfc/reject      (POST) - Rejeter facture DFC (agent, manager)
├── supplier/
│   ├── (POST)               - Créer fournisseur (manager, admin)
│   ├── delete/:id (POST)    - Supprimer fournisseur (admin)
│   ├── (GET)                - Lister fournisseurs (agent, manager)
│   ├── phone (GET)          - Recherche par téléphone (agent, manager)
│   └── :id (GET)            - Détail fournisseur (agent, manager)
├── suppliers/
│   ├── search (GET)         - Recherche flexible (manager, admin)
│   ├── find (GET)           - Recherche multi-champs (manager, admin)
│   └── verify-conflicts (GET) - Vérifier conflits (agent, manager)
├── search/
│   ├── invoices (GET)       - Recherche avancée de factures (agent, manager)
│   ├── suppliers (GET)      - Recherche avancée de fournisseurs (agent, manager)
│   └── relational (GET)     - Recherche relationnelle (agent, manager)
├── export/
│   ├── advanced (GET)       - Export avancé selon filtres (agent, manager)
│   └── history (GET)        - Historique des exports (agent, manager)
├── fiscal-years        (GET) - Années fiscales disponibles (agent, manager)
├── protected          (GET) - test auth
└── health             (GET) - test serveur
```

## **7. Démarrage complet du projet**
```bash
# Terminal 1 - Serveur
cd server && npm run dev

# Terminal 2 - Client (si vous avez le frontend)
cd client && npm run dev
```

## **8. Vérification**
- ✅ Serveur : http://localhost:3000/api/health
- ✅ Frontend : http://localhost:5173 (si configuré)
- ✅ Base de données : Tables créées avec traçabilité

## **🔧 Dépannage**

### **Erreur de connexion DB**
- Vérifier les credentials dans `.env`
- S'assurer que MySQL est démarré
- Vérifier que la base `cmdt_invoice_db` existe
- Exécuter les scripts SQL dans l'ordre : `cmdt_invoice_db.sql` puis `add_user_tracking_to_invoice.sql`

### **Erreur CORS**
- Vérifier que l'origine frontend est `http://localhost:5173` (ou la valeur de `FRONTEND_URL`)
- S'assurer que `credentials: true` est configuré
- Vérifier la configuration CORS dans `app.ts`
- En dev, vous pouvez appeler `/api/...` côté client (proxy Vite configuré dans `vite.config.js`)

### **Erreur d'authentification**
- Vérifier que `JWT_SECRET_KEY` est défini
- S'assurer que les cookies sont envoyés avec `withCredentials: true`
- Vérifier la table `user_activity` pour le tracking d'inactivité

### **Erreur de déconnexion automatique**
- Vérifier que la table `user_activity` existe
- S'assurer que les activités sont bien trackées
- Vérifier les seuils d'inactivité (5min/30min)

## **📚 Documentation**
- Routes API : `server/docs/API_ROUTES.md`
- Utilisation req.user : `server/examples/req-user-usage.md`
- Utilisation roleGuard : `server/examples/role-guard-usage.md`
