# 🚀 Guide de Démarrage Rapide

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
APP_URL=http://localhost:5173
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

# Test d'authentification (après création d'un utilisateur)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmdt.com","password":"motdepasse"}'

# Test du profil (avec cookie)
curl http://localhost:3000/api/auth/me \
  -H "Cookie: auth_token=VOTRE_TOKEN_ICI"
```

## **6. Structure des routes**
```
http://localhost:3000/api/
├── auth/
│   ├── login          (POST)
│   ├── me             (GET) - protégé
│   ├── token          (GET)
│   ├── logout         (POST)
│   ├── register       (POST)
│   └── admin/create-user (POST) - admin seulement
├── invoices/
│   ├── /              (GET, POST) - protégé
│   └── /:id           (GET) - protégé
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

### **Erreur CORS**
- Vérifier que l'origine frontend est `http://localhost:5173`
- S'assurer que `credentials: true` est configuré

### **Erreur d'authentification**
- Vérifier que `JWT_SECRET_KEY` est défini
- S'assurer que les cookies sont envoyés avec `withCredentials: true`

## **📚 Documentation**
- Routes API : `server/docs/API_ROUTES.md`
- Utilisation req.user : `server/examples/req-user-usage.md`
- Utilisation roleGuard : `server/examples/role-guard-usage.md`
