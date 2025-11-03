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
- **Rôles** : Tous

### **POST** `/auth/forgot-password`
- **Description** : Demande de réinitialisation de mot de passe
- **Body** : `{ email }`
- **Response** : Email de réinitialisation envoyé
- **Protection** : Aucune

### **POST** `/auth/reset-password`
- **Description** : Réinitialisation du mot de passe
- **Body** : `{ token, password }`
- **Response** : Confirmation de réinitialisation
- **Protection** : Aucune

### **POST** `/auth/logout`
- **Description** : Déconnexion de l'utilisateur
- **Response** : Confirmation de déconnexion
- **Protection** : `authGuard`

### **POST** `/auth/silent-refresh`
- **Description** : Rafraîchissement silencieux du token
- **Response** : Nouveau token
- **Protection** : `authGuard`

### **GET** `/auth/status`
- **Description** : Vérification de l'état d'authentification
- **Response** : Statut de l'utilisateur
- **Protection** : `authGuard`
- **Tracking** : `REFRESH_PROFILE`

### **POST** `/auth/admin/create-user`
- **Description** : Création d'utilisateur (admin uniquement)
- **Body** : `{ email, password, firstName, lastName, role }`
- **Response** : Détails de l'utilisateur créé
- **Protection** : `authGuard` + `requireAdmin`
- **Rôles** : `admin`

## 📄 **Gestion des Factures**

### **GET** `/invoices`
- **Description** : Lister les factures
- **Query Params** : `status`, `supplierId`, `dateFrom`, `dateTo`
- **Response** : Liste des factures
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/invoices/last-num`
- **Description** : Récupérer le dernier numéro de facture
- **Response** : `{ lastNumber: string }`
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/invoices/next-num`
- **Description** : Récupérer le prochain numéro de facture attendu
- **Response** : `{ nextNumber: string }`
- **Protection** : `authGuard` + `requireManagerOrAdmin`
- **Rôles** : `invoice_manager`, `admin`

### **GET** `/invoices/dfc/pending`
- **Description** : Lister les factures en attente DFC
- **Response** : Liste des factures en attente
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **POST** `/invoices`
- **Description** : Créer une nouvelle facture
- **Body** : Données de la facture
- **Response** : Facture créée
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **POST** `/invoices/:id/dfc/approve`
- **Description** : Approuver une facture DFC
- **Response** : Confirmation d'approbation
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **POST** `/invoices/:id/dfc/reject`
- **Description** : Rejeter une facture DFC
- **Body** : `{ comments?: string }`
- **Response** : Confirmation de rejet
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/invoices/:id`
- **Description** : Récupérer une facture spécifique
- **Response** : Détails de la facture
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **POST** `/invoices/update/:id`
- **Description** : Mettre à jour une facture
- **Body** : Données mises à jour de la facture
- **Response** : Facture mise à jour
- **Protection** : `authGuard` + `requireManagerOrAdmin`
- **Rôles** : `invoice_manager`, `admin`

### **POST** `/invoices/delete/:id`
- **Description** : Supprimer une facture
- **Response** : Confirmation de suppression
- **Protection** : `authGuard` + `requireAdmin`
- **Rôles** : `admin`

## 👥 **Gestion des Fournisseurs**

### **POST** `/supplier`
- **Description** : Créer un fournisseur
- **Protection** : `authGuard` + `requireManagerOrAdmin`
- **Rôles** : `invoice_manager`, `admin`

### **POST** `/supplier/delete/:id`
- **Description** : Supprimer un fournisseur (simulation DELETE)
- **Protection** : `authGuard` + `requireAdmin`
- **Rôles** : `admin`

### **GET** `/supplier`
- **Description** : Lister tous les fournisseurs
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/supplier/phone`
- **Description** : Rechercher un fournisseur par téléphone (`?phone=`)
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/supplier/:id`
- **Description** : Récupérer un fournisseur spécifique
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/suppliers/search`
- **Description** : Recherche flexible par champ (`?field=&value=`)
- **Protection** : `authGuard` + `requireManagerOrAdmin`
- **Rôles** : `invoice_manager`, `admin`

### **GET** `/suppliers/find`
- **Description** : Recherche multi-champs (ex: `?name=ABC&account_number=123`)
- **Protection** : `authGuard` + `requireManagerOrAdmin`
- **Rôles** : `invoice_manager`, `admin`

### **GET** `/suppliers/verify-conflicts`
- **Description** : Vérifier les conflits (numéro de compte / téléphone)
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

## 🔍 **Recherche avancée et Export**

### **GET** `/search/invoices`
- **Description** : Recherche avancée de factures
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/search/suppliers`
- **Description** : Recherche avancée de fournisseurs
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/search/relational`
- **Description** : Recherche relationnelle (factures/fournisseurs)
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/export/advanced`
- **Description** : Export avancé (CSV/Excel) basé sur filtres
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/export/history`
- **Description** : Historique des exports effectués
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

### **GET** `/fiscal-years`
- **Description** : Récupérer les années fiscales disponibles
- **Protection** : `authGuard` + `requireAgentOrManager`
- **Rôles** : `dfc_agent`, `invoice_manager`

## ⚙️ **Paramètres fiscaux**

### **GET** `/settings/fiscal`
- **Description** : Informations fiscales courantes (année fiscale, format CMDT, compteur, seuils, alerte, etc.)
- **Protection** : `authGuard`
- **Rôles** : `dfc_agent`, `invoice_manager`, `admin`

### **POST** `/settings/auto-year-switch`
- **Description** : Activer/Désactiver la bascule automatique d'année fiscale
- **Body** : `{ enable: boolean }`
- **Protection** : `authGuard` + `requireAdmin`
- **Rôles** : `admin`

### **POST** `/settings/fiscal-year/switch`
- **Description** : Bascule manuelle d'année fiscale
- **Body** : `{ newYear: string }`
- **Protection** : `authGuard` + `requireAdmin`
- **Rôles** : `admin`



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

// Mettre à jour une facture
const updateInvoice = async (id, data) => {
  const response = await api.post(`/invoices/update/${id}`, data);
  return response.data;
};

// Supprimer une facture
const deleteInvoice = async (id) => {
  const response = await api.post(`/invoices/delete/${id}`);
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

1. **Cookies** : Toutes les requêtes protégées nécessitent le cookie `auth_token` (HttpOnly)
2. **CORS** : Configuré pour `http://localhost:5173` (ou `FRONTEND_URL`) avec `credentials: true`
3. **Traçabilité** : Toutes les actions sont automatiquement associées à l'utilisateur connecté
4. **Permissions** : Vérification automatique des rôles et de la propriété des ressources
5. **Gestion d'inactivité** : Déconnexion automatique après 5min (30min avec rememberMe)
6. **Tracking d'activité** : Toutes les actions sont enregistrées dans `user_activity`
7. **Rafraîchissement** : Tokens renouvelés automatiquement avant expiration
8. **Validation** : React Hook Form + Zod côté client, validation serveur stricte