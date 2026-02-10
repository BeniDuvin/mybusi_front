# MyDepot Frontend - Application Mobile de Gestion de Dépôt de Boisson 🇨🇬

Application mobile React Native développée avec Expo pour la gestion complète d'un dépôt de boissons au **Congo Brazzaville**.

## 🚀 Technologies

- **Framework**: Expo (React Native)
- **Langage**: TypeScript
- **Navigation**: Expo Router
- **UI Library**: React Native Paper
- **State Management**: Zustand
- **API Client**: TanStack Query (React Query)
- **Authentification**: JWT + Expo SecureStore
- **Icons**: Expo Symbols
- **Charts**: Victory Native (à venir)

## 📋 Fonctionnalités Implémentées

### ✅ Authentification
- [x] Connexion email/password
- [x] Inscription
- [x] Connexion OTP SMS
- [x] Mot de passe oublié
- [x] Gestion des tokens JWT
- [x] Auto-refresh des tokens

### ✅ Navigation
- [x] Structure Expo Router (App Router)
- [x] Navigation Drawer avec menu par rôle
- [x] Routes protégées par authentification
- [x] Navigation par rôle (ADMIN, GERANT, CAISSIER, CLIENT)

### ✅ Dashboard
- [x] Vue d'ensemble avec KPIs
- [x] Ventes du jour et du mois
- [x] Alertes de stock faible
- [x] Commandes en attente

### ✅ Gestion des Produits
- [x] Liste des produits avec recherche
- [x] Création de produits
- [x] Édition (structure prête)
- [x] Suppression avec confirmation
- [x] Filtres par catégorie, marque, dépôt
- [x] Gestion des catégories et marques

### ✅ Gestion des Ventes (Caisse)
- [x] Liste des ventes avec historique
- [x] Création de vente (interface de caisse)
- [x] Panier dynamique
- [x] Recherche de produits
- [x] Calcul automatique des totaux
- [x] Factures (structure prête)

### ✅ Composants UI Réutilisables
- [x] KPICard - Cartes de statistiques
- [x] EmptyState - État vide avec action
- [x] ErrorMessage - Affichage d'erreurs
- [x] LoadingOverlay - Overlay de chargement
- [x] SearchBar - Barre de recherche
- [x] StatusBadge - Badge de statut

### ✅ Services API
- [x] Auth Service
- [x] Depot Service
- [x] Product Service (+ Categories, Brands)
- [x] Stock Service
- [x] Sale Service
- [x] Payment Service
- [x] Client Service
- [x] Purchase Service
- [x] Supplier Service
- [x] Finance Service
- [x] Expense Service
- [x] Salary Service
- [x] Log Service
- [x] Invoice Service

## 📌 Référence API frontend (à copier)

### Auth
- Tous les endpoints (sauf auth) exigent `Authorization: Bearer <token>`.
- OTP téléphone: `POST /auth/otp/send` puis `POST /auth/otp/verify` (expire en 5 minutes).
- Login refusé si `isActive = false`.
- Register: `firstName`, `lastName` obligatoires.

### Dépôts
- ADMIN uniquement: CRUD dépôts + assignation users.
- `depotId` est la clé pour produits, stock, ventes, achats.

### Produits
- Création requiert: `name`, `categoryId`, `depotId`, `purchasePrice`, `sellingPrice`.
- `barcode` et `sku` sont uniques (peuvent être `null`).
- Le stock est créé à `0` automatiquement.
- `depotId` requis à la création, non modifiable ensuite.

### Stock
- Stock par dépôt: combinaison `productId + depotId`.
- `POST /stock/add` → + quantité.
- `POST /stock/remove` → - quantité (refus si insuffisant).
- `POST /stock/adjust` → fixe la quantité.
- Chaque mouvement crée un `StockMovement` (IN/OUT/ADJUSTMENT).

### Ventes
- `POST /sales` exige `depotId + lines[]`.
- Chaque ligne: `productId`, `quantity`, `unitPrice` optionnel.
- Vérifie stock avant vente, refuse si insuffisant.
- Vente ⇒ décrémente stock + crée `StockMovement` OUT.
- Paiements mettent à jour `remainingAmount` et le status devient `COMPLETED` quand `remainingAmount = 0`.
- `POST /sales/:id/cancel` restaure le stock.

### Achats
- `POST /purchases` exige `depotId`, `supplierId`, `lines[]`.
- Chaque ligne: `productId`, `quantity`, `unitPrice`.
- Achat ⇒ incrémente stock + `StockMovement` IN.
- Paiement achat met à jour `remainingAmount` et `supplier.totalDebt`.

### Paiements
- Paiement lié à `saleId` ou `clientId`.
- `amount` ne peut pas dépasser `remainingAmount`.
- `MOBILE_MONEY` reste `PENDING` jusqu’à vérification.
- `CASH` = `COMPLETED` direct.

### Clients / Fournisseurs
- `phone` unique, `email` unique si fourni.
- `totalDebt` géré par achats/paiements.

### Factures
- `GET /invoices/generate/:saleId?format=A4` (si déjà générée, on renvoie l’existante).
- `GET /invoices/:invoiceNumber` pour télécharger.

### Règles côté frontend (essentiel)
- Toujours envoyer le bon `depotId` pour stocks, ventes, achats, produits.
- Après achat/vente, rafraîchir stock via `GET /stock/depot/:depotId` ou produits.
- Vérifier stock côté UI avant vente pour éviter `400`.
- Utiliser les enums exacts (`PaymentStatus`, `PaymentMethod`, `MobileMoneyProvider`, `Role`).

### ✅ Hooks Custom
- [x] useAuth - Authentification
- [x] useProducts - Gestion produits
- [x] useDepots - Gestion dépôts
- [x] useSales - Gestion ventes
- [x] useFinance - Finance et rapports

### ✅ State Management
- [x] Cart Store (Zustand) - Panier de vente
- [x] App Store (Zustand) - État global de l'app
- [x] Auth Context - Contexte d'authentification

## 📱 Structure du Projet

```
mydepot-frontend/
├── app/                          # Expo Router
│   ├── _layout.tsx              # Layout racine
│   ├── index.tsx                # Page d'accueil
│   ├── (auth)/                  # Groupe d'authentification
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── otp-verification.tsx
│   │   └── forgot-password.tsx
│   └── (main)/                  # Groupe principal (après login)
│       ├── _layout.tsx          # Drawer navigation
│       ├── dashboard.tsx
│       ├── profile.tsx
│       ├── products/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   └── create.tsx
│       ├── sales/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   └── create.tsx
│       ├── depots.tsx
│       ├── purchases.tsx
│       ├── clients.tsx
│       └── finance.tsx
├── components/
│   └── ui/                      # Composants UI réutilisables
│       ├── KPICard.tsx
│       ├── EmptyState.tsx
│       ├── LoadingOverlay.tsx
│       ├── ErrorMessage.tsx
│       ├── SearchBar.tsx
│       └── StatusBadge.tsx
├── services/                    # Services API
│   ├── api.ts                   # Configuration Axios + interceptors
│   ├── auth.service.ts
│   ├── depot.service.ts
│   ├── product.service.ts
│   ├── stock.service.ts
│   ├── sale.service.ts
│   ├── client.service.ts
│   ├── purchase.service.ts
│   ├── finance.service.ts
│   ├── log.service.ts
│   └── invoice.service.ts
├── hooks/                       # Hooks custom
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useDepots.ts
│   ├── useSales.ts
│   └── useFinance.ts
├── stores/                      # Zustand stores
│   ├── cart.store.ts
│   └── app.store.ts
├── contexts/
│   └── AuthContext.tsx
├── types/
│   └── index.ts                 # Types TypeScript
├── utils/
│   ├── constants.ts
│   ├── format.ts
│   └── validation.ts
└── constants/
    └── theme.ts                 # Thème React Native Paper
```

## 🛠️ Installation

1. **Cloner le projet**
```bash
cd mydepot-frontend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'API**
Modifier l'URL de base dans `services/api.ts`:
```typescript
baseURL: 'http://YOUR_API_URL/api/v1',
```

4. **Lancer l'application**
```bash
# Développement
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 🧪 Comptes de Test

Pour tester rapidement l'application, utilisez les comptes de test :

### Connexion Rapide
Sur l'écran de login, cliquez sur **"Connexion test"** et sélectionnez :
- **Admin** : admin@mydepot.com / admin123
- **Gérant** : gerant@mydepot.com / gerant123
- **Caissier** : caissier@mydepot.com / caissier123
- **Client** : client@mydepot.com / client123

📄 Consultez [COMPTES_TEST.md](./COMPTES_TEST.md) pour plus de détails.

## 📝 Configuration Backend

L'application se connecte à l'API backend MyDepot. Assurez-vous que :

1. Le backend est démarré sur `http://localhost:3000`
2. Les endpoints API sont accessibles
3. Les comptes de test sont créés (voir [COMPTES_TEST.md](./COMPTES_TEST.md))

## 🌍 Configuration Congo Brazzaville

### Format Téléphone
- **Indicatif** : +242
- **Format** : +242 XX XXX XX XX
- **Exemple** : +242 06 123 45 67

### Devise
- **FCFA (XOF)** - Franc CFA
- Tous les montants sont formatés en FCFA

### Mobile Money
Support des opérateurs locaux :
- Orange Money
- MTN Money
- Moov Money
- Wave

## 🔐 Rôles et Permissions

### ADMIN
- Accès complet
- Gestion des utilisateurs et dépôts
- Tous les modules

### GERANT
- Gestion du dépôt assigné
- Ventes, achats, stocks
- Rapports financiers

### CAISSIER
- Création de ventes
- Gestion des paiements
- Consultation des stocks

### CLIENT
- Consultation de ses commandes
- Historique des achats

## 📦 Fonctionnalités à Compléter

### Produits
- [ ] Écran d'édition de produit
- [ ] Gestion du stock par produit
- [ ] Import/Export produits
- [ ] Scanner de code-barres

### Ventes
- [ ] Détails de facture
- [ ] Génération PDF facture (58mm, 80mm, A4)
- [ ] Impression Bluetooth
- [ ] Paiement Mobile Money
- [ ] Multi-paiements
- [ ] Gestion crédit client

### Achats
- [ ] Liste des achats
- [ ] Création d'achat
- [ ] Gestion fournisseurs
- [ ] Réception de stock

### Finance
- [ ] Dashboard financier
- [ ] Gestion dépenses
- [ ] Paiement salaires
- [ ] Rapports Excel/PDF
- [ ] Graphiques de trésorerie

### Clients
- [ ] Liste des clients
- [ ] Création/Édition client
- [ ] Historique commandes
- [ ] Statistiques client

### Dépôts
- [ ] Liste des dépôts
- [ ] Création/Édition dépôt
- [ ] Affectation utilisateurs
- [ ] Transferts inter-dépôts

### Avancées
- [ ] Mode offline partiel
- [ ] Notifications push
- [ ] Dark mode
- [ ] Multi-langue
- [ ] Export rapports
- [ ] Logs d'activité

## 🎨 Design System

### Couleurs
- **Primary**: #2196F3 (Bleu)
- **Secondary**: #4CAF50 (Vert)
- **Accent**: #FF9800 (Orange)
- **Error**: #F44336 (Rouge)

### Composants
Tous les composants utilisent React Native Paper pour une expérience cohérente Material Design.

## 🧪 Tests

Tests à implémenter :
- Tests unitaires (Jest)
- Tests d'intégration
- Tests E2E (Detox)

## 📄 License

Propriétaire - MyDepot 2024

## 👥 Contributeurs

- Votre équipe de développement

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Note**: Cette application est en cours de développement. Certaines fonctionnalités sont partiellement implémentées et nécessitent des améliorations.
