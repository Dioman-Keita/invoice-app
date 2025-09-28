# Documentation des Routes API

## 🚀 **Base URL**
```
http://localhost:3000/api
```

## 🔐 **Routes d'Authentification**

### **POST** `/auth/login`
- **Description** : Connexion utilisateur avec gestion rememberMe
- **Body** : `{ email, password, role, rememberMe }`
- **Response** : Cookie `auth_token` + données utilisateur + tracking d'activité
- **Protection** : Aucune
- **Tracking** : `LOGIN` automatique

### **POST** `/auth/register`
- **Description** : Inscription utilisateur avec validation
- **Body** : `{ email, password, firstName, lastName, role, terms }`
- **Response** : Email de vérification envoyé
- **Protection** : Aucune
- **Validation** : Email valide, termes acceptés, mots de passe identiques

### **POST** `/auth/forgot-password`
- **Description** : Demande de réinitialisation de mot de passe
- **Body** : `{ email }`
- **Response** : Email de réinitialisation envoyé
- **Protection** : Aucune
- **Tracking** : `SEND_PASSWORD_RESET_EMAIL`

### **POST** `/auth/reset-password`
- **Description** : Réinitialisation du mot de passe avec token
- **Body** : `{ token, newPassword }`
- **Response** : Mot de passe mis à jour
- **Protection** : Aucune
- **Tracking** : `RESET_PASSWORD`

### **GET** `/auth/status`
- **Description** : Statut d'authentification avec gestion d'inactivité
- **Headers** : Cookie `auth_token`
- **Response** : `{ isAuthenticated, user, shouldRefresh, expiresIn, rememberMe }`
- **Protection** : `authGuard`
- **Fonctionnalité** : Vérification d'inactivité (5min/30min)

### **POST** `/auth/silent-refresh`
- **Description** : Rafraîchissement silencieux du token
- **Headers** : Cookie `auth_token`
- **Response** : Nouveau token si session valide
- **Protection** : `authGuard`
- **Tracking** : `REFRESH_SESSION`

### **GET** `/auth/profile`
- **Description** : Profil de l'utilisateur connecté
- **Headers** : Cookie `auth_token`
- **Response** : Données complètes de l'utilisateur
- **Protection** : `authGuard`
- **Tracking** : `VIEW_PROFILE`

### **POST** `/auth/logout`
- **Description** : Déconnexion avec nettoyage des activités
- **Headers** : Cookie `auth_token`
- **Response** : Suppression des cookies + nettoyage BDD
- **Protection** : Aucune
- **Tracking** : `LOGOUT` + suppression des activités

### **GET** `/auth/token`
- **Description** : Vérification du token actuel
- **Headers** : Cookie `auth_token`
- **Response** : `{ token, payload }`
- **Protection** : Aucune

### **POST** `/auth/admin/create-user`
- **Description** : Création d'utilisateur (admin seulement)
- **Body** : Données utilisateur
- **Response** : Utilisateur créé
- **Protection** : `authGuard` + `requireAdmin`

## 📄 **Routes de Factures**

### **POST** `/invoices`
- **Description** : Créer une facture avec traçabilité
- **Body** : Données de la facture
- **Response** : Facture créée avec métadonnées utilisateur
- **Protection** : `authGuard`
- **Traçabilité** : `SUBMIT_INVOICE` + association automatique à l'utilisateur
- **Validation** : Numéro de facture (12 chiffres max), montant (100M max)

### **GET** `/invoices`
- **Description** : Lister les factures avec filtrage par rôle
- **Response** : Liste des factures (ses propres factures, ou toutes si admin)
- **Protection** : `authGuard`
- **Filtrage** : Automatique selon le rôle (admin voit tout, autres voient leurs factures)

### **GET** `/invoices/:id`
- **Description** : Récupérer une facture spécifique
- **Response** : Détails de la facture
- **Protection** : `authGuard` + vérification des permissions
- **Vérification** : L'utilisateur doit être propriétaire ou admin

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

### **Configuration Axios avec gestion d'inactivité**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Important pour les cookies
});

// Intercepteur pour gérer les erreurs d'auth et l'inactivité
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Rediriger vers login
      window.location.href = '/login';
    }
    if (error.response?.data?.message?.includes('inactivité')) {
      // Gérer la déconnexion automatique
      localStorage.clear();
      window.location.href = '/login?reason=inactivity';
    }
    return Promise.reject(error);
  }
);
```

### **Exemple d'utilisation avec nouvelles fonctionnalités**
```javascript
// Connexion avec rememberMe
const login = async (email, password, role, rememberMe) => {
  const response = await api.post('/auth/login', { 
    email, password, role, rememberMe 
  });
  return response.data;
};

// Inscription avec validation
const register = async (userData) => {
  const response = await api.post('/auth/register', {
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    terms: userData.terms
  });
  return response.data;
};

// Vérification du statut avec gestion d'inactivité
const checkAuthStatus = async () => {
  const response = await api.get('/auth/status');
  return response.data;
};

// Rafraîchissement silencieux
const silentRefresh = async () => {
  const response = await api.post('/auth/silent-refresh');
  return response.data;
};

// Créer une facture avec traçabilité
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
5. **Gestion d'inactivité** : Déconnexion automatique après 5min (30min avec rememberMe)
6. **Tracking d'activité** : Toutes les actions sont enregistrées dans `user_activity`
7. **Rafraîchissement** : Tokens renouvelés automatiquement avant expiration
8. **Validation** : React Hook Form + Zod côté client, validation serveur stricte
