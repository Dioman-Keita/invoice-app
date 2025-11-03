# Utilisation du roleGuard mis à jour

## 🎯 **Rôles disponibles**
- `admin` : Accès complet à toutes les fonctionnalités + gestion des utilisateurs
- `invoice_manager` : Gestion des factures et accès aux données DFC
- `dfc_agent` : Agent DFC avec accès limité aux factures et profil

## 🛡️ **Middlewares de protection**

### **Protection des routes**
```typescript
import { requireAdmin, requireManagerOrAdmin, requireAgentOrManager } from '../middleware/roleGuard';

// Seuls les admins
router.post('/auth/admin/create-user', authGuard, requireAdmin, createUser);

// Admins et managers
router.get('/invoices/next-num', authGuard, requireManagerOrAdmin, getNextInvoiceNumber);

// Agents et managers
router.get('/invoices/dfc/pending', authGuard, requireAgentOrManager, getDfcPendingInvoices);
```

## 🔧 **Fonctions utilitaires dans les contrôleurs**

### **Vérification simple**
```typescript
import { isAdmin, isManagerOrAdmin, canAccessInvoice } from '../middleware/roleGuard';

export async function maFonction(req: Request, res: Response) {
    const user = (req as any).user;
    
    // Vérifications simples
    if (isAdmin(user)) {
        // Logique admin
    }
    
    if (isManagerOrAdmin(user)) {
        // Logique manager/admin
    }
    
    // Vérification d'accès à une ressource
    if (canAccessInvoice(user, invoiceOwnerId)) {
        // L'utilisateur peut accéder à cette facture
    }
}
```

## 📊 **Hiérarchie des permissions**

| Rôle | Créer factures | Voir toutes factures | Gérer utilisateurs | Accès DFC | Tracking activité |
|------|----------------|---------------------|-------------------|-----------|------------------|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `invoice_manager` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `dfc_agent` | ✅ | ❌ | ❌ | ✅ | ✅ |

### **Gestion d'inactivité par rôle**
- **Tous les rôles** : Déconnexion automatique après 5 minutes d'inactivité
- **Avec "Se souvenir de moi"** : 30 minutes d'inactivité pour tous les rôles
- **Tracking automatique** : Toutes les actions sont enregistrées dans `user_activity`

## 🚀 **Exemples concrets**

### **Route admin uniquement**
```typescript
router.post('/auth/admin/create-user', authGuard, requireAdmin, createUser);
```

### **Route pour managers et admins**
```typescript
router.get('/export/advanced', authGuard, requireManagerOrAdmin, advancedExport);
```

### **Vérification dans un contrôleur**
```typescript
export async function getInvoice(req: Request, res: Response) {
    const user = (req as any).user;
    const invoice = await Invoice.findById(req.params.id);
    
    // Vérifier l'accès
    if (!canAccessInvoice(user, invoice.created_by)) {
        return ApiResponder.forbidden(res, 'Accès refusé');
    }
    
    return ApiResponder.success(res, invoice);
}
```

## 💡 **Bonnes pratiques**

1. **Toujours utiliser `authGuard` avant `roleGuard`**
2. **Utiliser les fonctions utilitaires** pour des vérifications complexes
3. **Logger les tentatives d'accès** non autorisées
4. **Tester les permissions** dans les tests unitaires
5. **Utiliser le tracking d'activité** pour l'audit et la sécurité
6. **Gérer l'inactivité** avec les seuils appropriés selon le rôle
7. **Implémenter le rafraîchissement silencieux** pour une meilleure UX
