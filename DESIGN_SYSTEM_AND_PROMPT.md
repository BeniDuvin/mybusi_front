# AfroBnb — Design system & prompt de reproduction

## 1. Silhouette du projet

- **Type** : App React Native (Expo) type location courte durée (style Airbnb).
- **Rôles** : Voyageur, Propriétaire, Visiteur.
- **Stack** : React Navigation (stack + bottom tabs), SafeAreaView, thème centralisé dans `src/theme/colors.js`, icônes Feather + Lucide.

---

## 2. Checking couleurs et design

### 2.1 Palette (src/theme/colors.js)

| Rôle | Couleur | Usage |
|------|---------|--------|
| **Primary** | `#FF385C` | CTA, liens, onglets actifs, badges |
| **Primary dark** | `#D90B3E` | États pressés / hover |
| **Secondary** | `#FFB400` | Touches premium (optionnel) |
| **Background** | `#FFFFFF` | Fond principal |
| **Surface** | `#FFFFFF` | Cartes, inputs, header |
| **Surface alt** | `#F7F7F7` | Cartes secondaires, search bar, zones différenciées |
| **Text primary** | `#222222` | Titres, corps (jamais #000 pur) |
| **Text secondary** | `#717171` | Sous-titres, labels secondaires |
| **Text tertiary** | `#B0B0B0` | Placeholders, eyebrow, infos légères |
| **Text inverted** | `#FFFFFF` | Texte sur primary/error |
| **Border** | `#DDDDDD` | Bordures inputs, séparateurs |
| **Border light** | `#EBEBEB` | Séparateurs discrets, header |
| **Success** | `#008A05` | Statuts validés |
| **Error** | `#C13515` | Erreurs, danger |
| **Warning** | `#FFA800` | En attente, alerte |
| **Overlay** | `rgba(0,0,0,0.4)` | Modales (ConfirmModal utilise une variante plus foncée) |

### 2.2 Ombres (shadows)

- **small** : offset (0,2), opacity 0.1, radius 4, elevation 2 — inputs, search bar, cartes légères.
- **medium** : offset (0,4), opacity 0.12, radius 8, elevation 4 — boutons CTA.
- **large** : offset (0,6), opacity 0.15, radius 12, elevation 8 — modales / éléments flottants.

### 2.3 Spacing (espacements)

- `xs: 4`, `s: 8`, `m: 16`, `l: 24`, `xl: 32`, `xxl: 40`.
- Utiliser systématiquement ces valeurs (pas de valeurs magiques).

### 2.4 Typographie

- **h1** : 30px, bold (700).
- **h2** : 24px, semi-bold (600).
- **h3** : 20px, semi-bold (600).
- **body** : 16px, regular (400).
- **bodySmall** : 14px, regular, `textSecondary`.
- **caption** : 12px, regular, `textSecondary`.
- **button** : 16px, semi-bold (600), `textInverted` sur CTA.

Conventions : eyebrow en `caption` + uppercase + letterSpacing 1 + `textTertiary`. Liens/secondary actions en `primary` + fontWeight 600.

### 2.5 Composants type

- **Bouton principal** : `backgroundColor: primary`, `borderRadius: 12`, `paddingVertical: spacing.m`, `...shadows.medium`, texte `typography.button` / `textInverted`.
- **Bouton secondaire / outline** : `borderWidth: 1`, `borderColor: primary` ou `border`, `borderRadius: 999` (pill) ou 12, fond `surface` ou transparent.
- **Input** : `borderRadius: 12`, `borderColor: colors.border`, fond `surface`, `...shadows.small`, label en 14px fontWeight 600.
- **Carte listing** : image `aspectRatio: 1`, `borderRadius: 12`, fond placeholder `surfaceAlt`; infos en dessous avec `typography.body` / `bodySmall`, prix en bold.
- **Search bar** : fond `surfaceAlt`, `borderRadius: 20`, `borderColor: borderLight`, `...shadows.small`, icône dans un carré 34px `borderRadius: 12` fond `surface`.
- **Onglets horizontaux** : texte actif `textPrimary` + underline (height 2, `borderRadius: 999`, `backgroundColor: textPrimary`), inactif `textSecondary`.
- **Bottom tabs** : barre flottante (position absolute, `borderRadius: 20`), fond blur (iOS) ou `rgba(255,255,255,0.95)` (Android), `tabBarActiveTintColor: primary`, `tabBarInactiveTintColor: textSecondary`.
- **Modale de confirmation** : overlay semi-transparent, carte `borderRadius: 20`, bandeau d’accent (4px height, `primary`, `borderRadius: 999`) en haut, boutons pill `borderRadius: 999`.
- **Loader** : `ActivityIndicator` couleur `primary`, message en `typography.body` + `textSecondary`.

### 2.6 Layout

- **SafeAreaView** pour les écrans (edges selon le cas).
- **StatusBar** : `barStyle="dark-content"`, `backgroundColor` = `surface` ou `background`.
- Header type : fond `surface`, `borderBottomWidth: 1`, `borderBottomColor: borderLight`, ombre légère.
- Sections : titre de section avec eyebrow (caption uppercase) + `sectionTitle` (h3), lien “Tout voir” en `primary` + 600.
- Scroll horizontal des cartes : `paddingLeft: spacing.m`, `showsHorizontalScrollIndicator: false`.

### 2.7 Incohérences repérées

- **ConfirmModal** : overlay en `rgba(10, 10, 14, 0.6)` au lieu de `colors.overlay` — à harmoniser si tu veux tout centraliser.
- **Tab bar** : ombre en `#0f172a` au lieu du noir standard — acceptable pour un effet plus doux.

---

## 3. Prompt pour reproduire le design sur un autre projet

Tu peux copier-coller le bloc suivant (éventuellement en remplaçant le nom du projet) pour demander à un assistant ou à un LLM de recréer ce design system dans une autre app.

---

### Début du prompt à copier

**Reproduire le design system “AfroBnb” (style Airbnb minimaliste) dans ce projet**

1. **Thème centralisé**  
   Créer un fichier de thème (ex. `theme/colors.js` ou `constants/theme.js`) qui exporte :
   - **Couleurs** : primary `#FF385C`, primaryDark `#D90B3E`, secondary `#FFB400`, background/surface `#FFFFFF`, surfaceAlt `#F7F7F7`, textPrimary `#222222`, textSecondary `#717171`, textTertiary `#B0B0B0`, textInverted `#FFFFFF`, border `#DDDDDD`, borderLight `#EBEBEB`, success `#008A05`, error `#C13515`, warning `#FFA800`, overlay `rgba(0,0,0,0.4)`.
   - **Ombres** : small (elevation 2, offset Y 2, opacity 0.1), medium (elevation 4, offset Y 4, opacity 0.12), large (elevation 8, offset Y 6, opacity 0.15).
   - **Espacements** : xs 4, s 8, m 16, l 24, xl 32, xxl 40.
   - **Typo** : h1 (30, bold), h2 (24, 600), h3 (20, 600), body (16, 400), bodySmall (14), caption (12), button (16, 600). Couleurs de texte dérivées des couleurs du thème (primary pour titres, secondary pour sous-titres, tertiary pour placeholders).

2. **Style visuel**  
   - Fond général blanc, surfaces secondaires gris très clair (`#F7F7F7`). Pas de noir pur : texte principal en `#222222`.
   - Boutons principaux : fond primary, blanc, borderRadius 12, ombre medium, texte 16px semi-bold.
   - Boutons secondaires / outline : bordure 1px (primary ou border), borderRadius 12 ou 999 (pill).
   - Inputs : borderRadius 12, bordure grise, ombre small, labels 14px fontWeight 600.
   - Cartes : images avec borderRadius 12, aspect ratio carré si listing; fond surfaceAlt pour placeholders.
   - Barre de recherche type “champ unique” : fond surfaceAlt, borderRadius 20, bordure légère, ombre small.
   - Onglets : actif = texte primary/black + underline 2px arrondi; inactif = textSecondary.
   - Bottom tab bar : barre flottante arrondie (borderRadius 20), fond blur ou blanc semi-transparent, icônes actives en primary, inactives en textSecondary.
   - Modales : overlay semi-transparent, carte blanche borderRadius 20, fine barre d’accent primary en haut (4px, pill), boutons d’action en pill (borderRadius 999).
   - Loaders : indicateur couleur primary, message en body + textSecondary.

3. **Layout**  
   - Utiliser SafeAreaView pour les écrans. StatusBar en dark-content sur fond clair.
   - Headers : fond surface, bordure basse borderLight, ombre légère.
   - Sections listées : titre avec “eyebrow” (caption, uppercase, letterSpacing 1, tertiary) au-dessus du titre (h3); lien “Voir tout” en primary, fontWeight 600.
   - Listes horizontales de cartes : padding horizontal cohérent (ex. m), pas de scrollbar visible.

4. **Règles**  
   - Tous les écrans et composants doivent importer couleurs, espacements, typo et ombres depuis ce fichier de thème unique. Aucune couleur ou espacement en dur en dehors du thème.
   - Icônes : privilégier Feather ou Lucide, taille 18–20 pour la UI, stroke actif plus épais (2–2.2) pour l’état actif.

Applique ce design system à tous les écrans et composants existants ou nouveaux du projet, en gardant la même hiérarchie visuelle et le même rendu “minimaliste & chic” type Airbnb.

**Fin du prompt à copier**

---

## 4. Fichier de thème de référence (copie directe)

Pour recréer à l’identique le fichier `src/theme/colors.js` dans un autre projet, voici le contenu à reprendre (tel quel, en adaptant le chemin d’import si besoin) :

```javascript
// Palette de couleurs centralisée - Style "AfroBnb" Minimaliste & Chic
export const colors = {
  primary: '#FF385C',
  primaryDark: '#D90B3E',
  secondary: '#FFB400',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  textPrimary: '#222222',
  textSecondary: '#717171',
  textTertiary: '#B0B0B0',
  textInverted: '#FFFFFF',
  border: '#DDDDDD',
  borderLight: '#EBEBEB',
  icon: '#222222',
  iconSecondary: '#717171',
  success: '#008A05',
  successLight: '#E8F5E8',
  error: '#C13515',
  warning: '#FFA800',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 40,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  h2: { fontSize: 24, fontWeight: '600', color: colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400', color: colors.textPrimary },
  bodySmall: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },
  button: { fontSize: 16, fontWeight: '600', color: colors.textInverted },
};
```

---

Tu peux utiliser **DESIGN_SYSTEM_AND_PROMPT.md** comme référence interne et copier la section **“Prompt pour reproduire”** (début/fin du prompt) dans un autre projet pour obtenir le même rendu visuel et la même structure de thème.
