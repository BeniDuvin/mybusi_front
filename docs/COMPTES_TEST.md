# 🔐 Comptes de Test - MyDepot Congo 🇨🇬

## 📱 Format Téléphone Congo Brazzaville

L'application est maintenant configurée pour le **Congo Brazzaville** avec le format de téléphone :

```
+242 XX XXX XX XX
```

Exemple : `+242 06 123 45 67`

## 🧪 Comptes de Test Disponibles

Utilisez ces comptes pour tester l'application avec différents rôles :

### 1. 👑 Administrateur (Accès Complet)
```
Email    : admin@mydepot.com
Mot de passe : admin123
Rôle     : ADMIN
```
**Accès :** Tout

---

### 2. 👨‍💼 Gérant de Dépôt
```
Email    : gerant@mydepot.com
Mot de passe : gerant123
Rôle     : GERANT
```
**Accès :** 
- Gestion du dépôt
- Ventes et achats
- Stocks
- Rapports financiers

---

### 3. 💰 Caissier
```
Email    : caissier@mydepot.com
Mot de passe : caissier123
Rôle     : CAISSIER
```
**Accès :**
- Création de ventes
- Gestion des paiements
- Consultation des stocks

---

### 4. 👤 Client
```
Email    : client@mydepot.com
Mot de passe : client123
Rôle     : CLIENT
```
**Accès :**
- Consultation de ses commandes
- Historique des achats

---

## 🚀 Connexion Rapide

### Méthode 1 : Bouton "Connexion Test"
1. Sur l'écran de connexion, cliquez sur **"Connexion test"**
2. Sélectionnez le rôle que vous souhaitez tester
3. Vous serez connecté automatiquement !

### Méthode 2 : Saisie Manuelle
1. Entrez l'email du compte test
2. Entrez le mot de passe
3. Cliquez sur "Se connecter"

---

## 📋 Pages Accessibles par Rôle

### ADMIN 👑
- ✅ Dashboard
- ✅ Gestion des dépôts
- ✅ Gestion des produits
- ✅ Ventes et caisse
- ✅ Achats et fournisseurs
- ✅ Gestion des clients
- ✅ Finance et rapports
- ✅ Profil

### GERANT 👨‍💼
- ✅ Dashboard
- ✅ Gestion des dépôts
- ✅ Gestion des produits
- ✅ Ventes et caisse
- ✅ Achats et fournisseurs
- ✅ Gestion des clients
- ✅ Finance et rapports
- ✅ Profil

### CAISSIER 💰
- ✅ Dashboard
- ✅ Gestion des produits (consultation)
- ✅ Ventes et caisse
- ✅ Gestion des clients
- ✅ Profil

### CLIENT 👤
- ✅ Dashboard (limité)
- ✅ Ses commandes
- ✅ Profil

---

## 🔧 Configuration Backend Requise

Pour que ces comptes fonctionnent, assurez-vous que votre backend a créé ces utilisateurs.

### Script de création (à exécuter sur votre backend) :

```sql
-- Ou utilisez le seeder NestJS fourni avec le backend
npx prisma db seed
```

---

## 🌍 Spécificités Congo Brazzaville

### 💱 Devise
- **FCFA (XOF)** - Franc CFA
- Format : `1 000 FCFA`, `50 000 FCFA`

### 📱 Téléphone
- **Indicatif pays** : +242
- **Format** : +242 XX XXX XX XX
- **Opérateurs** : MTN, Airtel, etc.

### 💳 Paiements Mobile Money
L'application supporte :
- 🟠 **Orange Money**
- 🔴 **MTN Money**
- 🔵 **Moov Money**
- 🟢 **Wave**

---

## 🎯 Scénarios de Test Recommandés

### Scénario 1 : Vente Complète (Caissier)
1. Se connecter avec le compte **Caissier**
2. Aller dans "Ventes" → "Nouvelle vente"
3. Ajouter des produits au panier
4. Valider la vente
5. Voir la facture

### Scénario 2 : Gestion Produits (Admin)
1. Se connecter avec le compte **Admin**
2. Aller dans "Produits"
3. Créer un nouveau produit
4. Modifier un produit existant
5. Consulter les stocks

### Scénario 3 : Dashboard Finance (Gérant)
1. Se connecter avec le compte **Gérant**
2. Voir le dashboard
3. Consulter les KPIs
4. Vérifier les alertes de stock

---

## ⚠️ Important

- Ces comptes sont **uniquement pour le développement et les tests**
- **Ne les utilisez JAMAIS en production**
- Changez tous les mots de passe en production
- Créez de vrais comptes pour vos utilisateurs finaux

---

## 📞 Support

Pour toute question sur les comptes de test :
- Vérifiez que votre backend est démarré
- Vérifiez l'URL de l'API dans `services/api.ts`
- Consultez les logs du backend pour les erreurs d'authentification

---

**Bon test ! 🚀**
