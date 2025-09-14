# Comment exploiter `req.user` dans votre application

## 🎯 **Résumé de ce qui a été implémenté**

### 1. **Endpoint `/auth/me`** 
```typescript
// Récupère le profil de l'utilisateur connecté
GET /auth/me
Headers: Cookie: auth_token=...
Response: { id, email, firstName, lastName, role, ... }
```

### 2. **Contrôleur de factures sécurisé**
```typescript
// Création de facture avec traçabilité
POST /invoices
Headers: Cookie: auth_token=...
Body: { supplierId, amount, ... }
// Automatiquement ajoute: createdBy, createdByEmail, createdByRole
```

### 3. **Système d'autorisation par rôles**
```typescript
// Seuls les admins peuvent créer des utilisateurs
POST /auth/admin/create-user
Headers: Cookie: auth_token=... (avec role: 'admin')
```

## 🔧 **Comment utiliser `req.user` dans vos contrôleurs**

### **Exemple 1: Récupérer l'utilisateur connecté**
```typescript
export async function maFonction(req: Request, res: Response) {
    const user = (req as any).user;
    
    if (!user) {
        return ApiResponder.unauthorized(res, 'Non authentifié');
    }
    
    console.log('Utilisateur connecté:', {
        id: user.sup,
        email: user.email,
        role: user.role
    });
}
```

### **Exemple 2: Vérifier les permissions**
```typescript
export async function fonctionAdmin(req: Request, res: Response) {
    const user = (req as any).user;
    
    if (user.role !== 'admin') {
        return ApiResponder.forbidden(res, 'Accès refusé');
    }
    
    // Logique admin...
}
```

### **Exemple 3: Filtrer les données par utilisateur**
```typescript
export async function mesDonnees(req: Request, res: Response) {
    const user = (req as any).user;
    
    // Récupérer seulement les données de cet utilisateur
    const mesDonnees = await MaTable.findByUserId(user.sup);
    
    return ApiResponder.success(res, mesDonnees);
}
```

## 🛡️ **Protection des routes**

### **Authentification simple**
```typescript
router.get('/protected', authGuard, maFonction);
```

### **Authentification + Autorisation**
```typescript
router.post('/admin-only', authGuard, requireAdmin, maFonctionAdmin);
router.get('/manager-or-admin', authGuard, requireManagerOrAdmin, maFonction);
```

## 📊 **Traçabilité et audit**

Chaque action est maintenant tracée :
- **Qui** a fait l'action (`user.sup`)
- **Quand** (timestamp automatique)
- **Quel rôle** (`user.role`)
- **Quel email** (`user.email`)

## 🚀 **Prochaines étapes**

1. **Tester les endpoints** avec Postman/Thunder Client
2. **Ajouter `req.user`** dans d'autres contrôleurs
3. **Créer des vues** côté client qui utilisent ces données
4. **Implémenter la gestion des rôles** dans l'interface

## 💡 **Conseils d'utilisation**

- **Toujours vérifier** `req.user` avant utilisation
- **Logger les actions** importantes avec l'ID utilisateur
- **Utiliser les rôles** pour contrôler l'accès aux fonctionnalités
- **Associer les données** à l'utilisateur qui les crée
