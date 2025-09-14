# Documentation des Routes API

## 🚀 **Base URL**
```
http://localhost:3000/api
```

## 🔐 **Routes d'Authentification**

### **POST** `/auth/login`
- **Description** : Connexion utilisateur
- **Body** : `{ email, password }`
- **Response** : Cookie `auth_token` + données utilisateur
- **Protection** : Aucune

### **GET** `/auth/me`
- **Description** : Profil de l'utilisateur connecté
- **Headers** : Cookie `auth_token`
- **Response** : Données complètes de l'utilisateur
- **Protection** : `authGuard`

### **GET** `/auth/token`
- **Description** : Vérification du token actuel
- **Headers** : Cookie `auth_token`
- **Response** : `{ token, payload }`
- **Protection** : Aucune

### **POST** `/auth/logout`
- **Description** : Déconnexion
- **Response** : Suppression du cookie
- **Protection** : Aucune

### **POST** `/auth/register`
- **Description** : Inscription utilisateur
- **Body** : Données utilisateur
- **Response** : Utilisateur créé
- **Protection** : Aucune

### **POST** `/auth/admin/create-user`
- **Description** : Création d'utilisateur (admin)
- **Body** : Données utilisateur
- **Response** : Utilisateur créé
- **Protection** : `authGuard` + `requireAdmin`

## 📄 **Routes de Factures**

### **POST** `/invoices`
- **Description** : Créer une facture
- **Body** : Données de la facture
- **Response** : Facture créée
- **Protection** : `authGuard`
- **Traçabilité** : Automatiquement associée à l'utilisateur connecté

### **GET** `/invoices`
- **Description** : Lister les factures
- **Response** : Liste des factures (ses propres factures, ou toutes si admin)
- **Protection** : `authGuard`

### **GET** `/invoices/:id`
- **Description** : Récupérer une facture spécifique
- **Response** : Détails de la facture
- **Protection** : `authGuard` + vérification des permissions

## 🛡️ **Routes de Test**

### **GET** `/protected`
- **Description** : Test d'authentification
- **Response** : `{ user: req.user }`
- **Protection** : `authGuard`

### **GET** `/health`
- **Description** : Vérification de l'état du serveur
- **Response** : `{ status: 'OK', message: 'Serveur fonctionnel' }`
- **Protection** : Aucune

## 🔧 **Utilisation côté Client**

### **Configuration Axios**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Important pour les cookies
});

// Intercepteur pour gérer les erreurs d'auth
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Rediriger vers login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### **Exemple d'utilisation**
```javascript
// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Récupérer le profil
const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Créer une facture
const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices', invoiceData);
  return response.data;
};
```

## 🚨 **Codes d'Erreur**

- **200** : Succès
- **201** : Créé avec succès
- **400** : Requête invalide
- **401** : Non authentifié
- **403** : Accès refusé (permissions insuffisantes)
- **404** : Ressource introuvable
- **500** : Erreur serveur

## 📝 **Notes Importantes**

1. **Cookies** : Toutes les requêtes protégées nécessitent le cookie `auth_token`
2. **CORS** : Configuré pour `http://localhost:5173` avec `credentials: true`
3. **Traçabilité** : Toutes les actions sont automatiquement associées à l'utilisateur connecté
4. **Permissions** : Vérification automatique des rôles et de la propriété des ressources
