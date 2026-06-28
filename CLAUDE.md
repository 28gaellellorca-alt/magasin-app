# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Application web de gestion de stock pour une boutique artisanale fait main ("Les Pépites de G&A"). Stock, ventes, marges, tableau de bord — utilisée par une non-développeure.

- **Production** : `magasin-app.vercel.app`
- **GitHub** : `https://github.com/28gaellellorca-alt/magasin-app`
- **Stack** : Next.js 14 App Router · Supabase (PostgreSQL + Storage) · Vercel

---

## Versions stables de référence

| Tag | Commit | Date | Contenu |
|---|---|---|---|
| `v1-stable` | `d569e81` | 28 juin 2026 | Première version fonctionnelle complète |
| `v2-stable` | `5a9f9bf` | 28 juin 2026 | Lieux de vente (édition, augmentation auto), catalogue par lieu, aperçu partageable, fournisseur, alertes stock bas, guide intégré |
| *(en cours)* | `2dceec6` | 28 juin 2026 | Marchés/événements, dépôt depuis le catalogue, annulation dépôt depuis catalogue, page Ventes enrichie (panier moyen, filtre lieu, répartitions), guide refondu + visible mobile, fix aperçu partageable |

En cas de régression grave, revenir à une version stable :

```bash
git checkout v2-stable   # version actuelle recommandée
git checkout v1-stable   # version de base si besoin
```

Pour revenir sur la version de développement :

```bash
git checkout main
```

---

## Reprendre le travail (même ordinateur)

Pour relancer le projet après une pause :

```bash
npm run dev
```

Ouvrir `http://localhost:3000`. Une fois les modifications terminées, envoyer en ligne :

```bash
git push origin main
```

L'application sur `magasin-app.vercel.app` se met à jour automatiquement en 1-2 minutes.

---

## Réactivation sur un nouvel ordinateur

Si tu reprends ce projet sur une nouvelle machine, voici les étapes dans l'ordre :

**1. Installer Node.js** (si pas déjà installé)
Télécharger sur [nodejs.org](https://nodejs.org) — version LTS. Redémarrer le terminal après.

**2. Récupérer le code** — deux options :

Option A — depuis GitHub (recommandé) :
```bash
git clone https://github.com/28gaellellorca-alt/magasin-app.git
cd magasin-app
```

Option B — copier le dossier `magasin-app` depuis l'ancien ordi (clé USB ou réseau).

**3. Installer les dépendances**
```bash
npm install
```

**4. Créer le fichier `.env.local`** à la racine du projet (`magasin-app/.env.local`) :
```
NEXT_PUBLIC_SUPABASE_URL=https://ktthghagczyuphdiwzbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copier la clé depuis cles-supabase.txt>
```

Le fichier `cles-supabase.txt` est dans le dossier parent `magasin/` — le copier aussi sur le nouvel ordi (ne jamais le mettre sur GitHub).

**5. Lancer le projet en local**
```bash
npm run dev
```
Ouvrir `http://localhost:3000` — l'application doit s'afficher et se connecter à Supabase.

**6. Pour déployer sur Vercel**
Le projet est déjà connecté à GitHub (`28gaellellorca-alt/magasin-app`). Chaque `git push origin main` redéploie automatiquement. Aucune action sur Vercel nécessaire.

> Les données (stock, ventes, photos) sont dans le cloud Supabase — elles ne sont pas dans ce dossier et ne se perdent jamais en changeant d'ordinateur.

---

## Commandes

```bash
npm run dev      # dev local sur http://localhost:3000
npm run build    # vérifier que tout compile avant de pousser
npm run lint     # ESLint
git push origin main  # déclenche le redéploiement Vercel automatiquement
```

Pas de tests automatisés. La vérification se fait visuellement sur `magasin-app.vercel.app` après chaque push.

---

## Variables d'environnement

Fichier `.env.local` (jamais sur GitHub) :
```
NEXT_PUBLIC_SUPABASE_URL=https://ktthghagczyuphdiwzbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<voir cles-supabase.txt dans le dossier parent>
```

---

## Architecture

### Pattern général

- **Pages serveur** (`app/*/page.tsx`) : fetching Supabase côté serveur, pas de `'use client'`. Toutes les pages ont `export const dynamic = 'force-dynamic'` en haut.
- **Composants client** (`components/*.tsx`) : interactions utilisateur, `'use client'` obligatoire, état local avec `useState`
- **Client Supabase unique** : `lib/supabase.ts` — importé partout, avec `cache: 'no-store'` pour contourner le cache Next.js

Les pages serveur chargent les données puis les passent en props aux composants client. Les mutations (INSERT, UPDATE, DELETE) se font depuis les composants client via le client Supabase JS.

### Pages

| Route | Fichier | Rôle |
|---|---|---|
| `/` | `app/page.tsx` | Tableau de bord (CA par période, URSSAF, TVA, alertes stock bas) |
| `/produits` | `app/produits/page.tsx` | Liste des articles par ordre alphabétique, filtres, vue par lieu, bouton "+ Ajouter" |
| `/produits/[id]` | `app/produits/[id]/page.tsx` | Fiche produit + historique ventes |
| `/produits/[id]/modifier` | `app/produits/[id]/modifier/page.tsx` | Formulaire de modification |
| `/ajouter` | `app/ajouter/page.tsx` | Formulaire d'ajout avec upload photo (accessible depuis /produits) |
| `/ventes` | `app/ventes/page.tsx` | Historique ventes avec filtre période + lieu, CA/marge/panier moyen, répartitions paiement/canal |
| `/evenements` | `app/evenements/page.tsx` | Page Marchés : vue d'ensemble des lieux de vente avec bilan CA/bénéfice |
| `/evenements/[lieu_id]` | `app/evenements/[lieu_id]/page.tsx` | Fiche lieu : stats globales, liste événements avec bilan, réglages lieu |
| `/stats` | `app/stats/page.tsx` | Stats par catégorie, sous-catégorie, produit, lieu de vente + dépôts en cours |
| `/urssaf` | `app/urssaf/page.tsx` | Récap mensuel : CA, marge, URSSAF, espèces/carte, suivi paiements |
| `/parametres` | `app/parametres/page.tsx` | Catégories et lieux de vente |
| `/catalogue/[lieu_id]` | `app/catalogue/[lieu_id]/page.tsx` | Gestion du catalogue d'un lieu (produits + prix spécifiques, dépôt direct, annulation dépôt) |
| `/catalogue/[lieu_id]/apercu` | `app/catalogue/[lieu_id]/apercu/page.tsx` | Aperçu partageable/imprimable du catalogue (sans prix d'achat) |
| `/guide` | `app/guide/page.tsx` | Guide utilisateur complet intégré dans l'app (visible desktop + mobile) |

### Composants clés

- `Navigation.tsx` — sidebar desktop + header mobile + nav bottom mobile. Contient les SVG du logo inline. 8 liens (Guide inclus dans mobile depuis juin 2026, `mobileOnly: false` pour tous).
- `CartesProduits.tsx` — grille de produits avec recherche, filtres (catégorie, état) et sélecteur "Voir les prix pour un lieu"
- `BoutonVente.tsx` — formulaire de vente complet (prix, quantité, réduction OU augmentation en % ou €, mode paiement, canal, lieu de vente, acheteur, notes). Calcule la marge et décrémente le stock. Auto-applique la remise_defaut du lieu sélectionné. Gère aussi le décrément du dépôt si la vente vient d'un lieu de dépôt.
- `BoutonDepot.tsx` — déposer une partie du stock dans un lieu de vente (quantité partielle). Bouton "Retour de dépôt" pour récupérer le stock.
- `BoutonAnnulerVente.tsx` — annulation d'une vente avec remise en stock automatique. Gère le cas produit supprimé (produit_id null).
- `BoutonSupprimerProduit.tsx` — suppression produit avec confirmation, navigue via `window.location.href` (pas `router.push`)
- `BoutonExportCSV.tsx` — export CSV des ventes filtré par période (format français : `;` et `,`)
- `BoutonImprimer.tsx` — bouton "Imprimer ce catalogue" (`'use client'`). Nécessaire car `onClick` est interdit dans les pages serveur.
- `ListeVentes.tsx` — liste des ventes avec filtre période (semaine/mois/trimestre/année/tout), filtre par lieu de vente, stat-cards CA/marge/panier moyen, répartitions espèces-carte et direct-lieu, bouton annuler par ligne
- `StatsVentes.tsx` — statistiques avec filtre période : par lieu de vente (bénéfice net), catégorie, sous-catégorie, top produits
- `SectionDepots.tsx` — affiche les produits actuellement en dépôt chez les lieux de vente (sur la page Stats)
- `SuiviURSSAF.tsx` — récap mensuel avec marquage des paiements URSSAF
- `PrixParLieu.tsx` — saisie des prix spécifiques par lieu de vente (sur la fiche produit)
- `FormulaireAjout.tsx` / `FormulaireModifier.tsx` — upload photo vers Supabase Storage avec compression automatique (max 1200px, JPEG 82%) via `lib/compresserImage.ts`
- `GestionCategories.tsx` / `GestionRevendeurs.tsx` — CRUD dans les réglages (GestionRevendeurs gère les "lieux de vente" malgré le nom du fichier). GestionRevendeurs inclut un mode édition inline (crayon) et un lien "Catalogue" vers `/catalogue/[lieu.id]`
- `GestionCatalogueLieu.tsx` — gestion du catalogue d'un lieu : ajouter/retirer des produits avec prix spécifiques, **déposer directement depuis le catalogue** (bouton "Déposer" + mini-formulaire `MiniFormDepot` défini HORS du parent), **annuler un dépôt depuis le catalogue** (bouton X), lien vers l'aperçu partageable. `MiniFormDepot` doit rester défini EN DEHORS du composant parent sinon il se re-monte à chaque render.

### Base de données Supabase

Tables : `produits`, `categories`, `sous_categories`, `revendeurs`, `ventes`, `urssaf_paiements`, `prix_lieu`

Colonnes importantes de `ventes` (dont certaines ajoutées en migration) :
- `photo_url text` — copie de la photo au moment de la vente (survive à la suppression du produit)
- `revendeur_nom text` — copie du nom du lieu au moment de la vente (survive à la suppression du lieu)
- `acheteur text` — nom acheteur optionnel
- `mode_paiement text` — `'especes'` ou `'carte'`
- `remise numeric` — pourcentage de réduction appliqué (positif = réduction, peut représenter une augmentation dans BoutonVente)
- `canal text` — `'direct'` ou `'revendeur'`
- Contrainte FK `ventes.produit_id → produits.id ON DELETE SET NULL` (pas CASCADE)

Colonnes importantes de `produits` (ajoutées en migration) :
- `lieu_depot_id uuid` — FK vers revendeurs(id) ON DELETE SET NULL
- `quantite_en_depot integer` — quantité actuellement en dépôt chez ce lieu
- `fournisseur text` — source/lieu d'achat de l'article (Vinted, brocante, etc.)
- `stock_min integer DEFAULT 0` — seuil d'alerte stock bas (0 = pas d'alerte)

Colonnes importantes de `revendeurs` (= lieux de vente) :
- `commission_type text` — `'pourcentage'` / `'fixe'` / `'entree'`
- `commission_valeur numeric` — taux ou montant selon le type
- `remise_defaut numeric` — ajustement auto lors d'une vente : **positif = remise**, **négatif = augmentation**

Table `urssaf_paiements` : colonnes `annee integer`, `mois integer` (1-12), `date_paiement date`. PRIMARY KEY (annee, mois).

Table `prix_lieu` : colonnes `produit_id uuid`, `revendeur_id uuid`, `prix_vente numeric`. PRIMARY KEY (produit_id, revendeur_id).

Bucket Storage : **`images de produits`** (nom exact avec espaces, en français — ne jamais changer)

### Calculs métier

```
prix_revient = prix_achat + frais_annexes
commission = prix_vente_reel * (commission_valeur / 100)  [si type 'pourcentage']
           = commission_valeur                             [si type 'fixe']
           = 0 par article                                 [si type 'entree' — frais global déduit du bilan]
marge_nette = prix_vente_reel - commission - prix_revient
```

La marge est **calculée et stockée au moment de la vente** — elle ne se recalcule pas si le prix du produit change ensuite.

Taux URSSAF vente de marchandises : **12,3%** du CA trimestriel.
Seuil franchise TVA : **85 000€** de CA annuel.

### Migrations SQL appliquées (à ne pas rejouer)

1. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS photo_url text;`
2. Contrainte FK ventes→produits changée de CASCADE à SET NULL
3. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS acheteur text;`
4. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS mode_paiement text DEFAULT 'especes';`
5. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS remise numeric DEFAULT 0;`
6. `ALTER TABLE revendeurs ADD COLUMN IF NOT EXISTS remise_defaut numeric DEFAULT 0;`
7. `ALTER TABLE produits ADD COLUMN IF NOT EXISTS lieu_depot_id uuid REFERENCES revendeurs(id) ON DELETE SET NULL;`
8. `ALTER TABLE produits ADD COLUMN IF NOT EXISTS quantite_en_depot integer DEFAULT 0;`
9. `CREATE TABLE urssaf_paiements (annee integer NOT NULL, mois integer NOT NULL, date_paiement date, PRIMARY KEY (annee, mois)); ALTER TABLE urssaf_paiements DISABLE ROW LEVEL SECURITY;`
10. `CREATE TABLE prix_lieu (produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE, revendeur_id uuid NOT NULL REFERENCES revendeurs(id) ON DELETE CASCADE, prix_vente numeric NOT NULL, PRIMARY KEY (produit_id, revendeur_id)); ALTER TABLE prix_lieu DISABLE ROW LEVEL SECURITY;`
11. `GRANT SELECT, INSERT, UPDATE, DELETE ON prix_lieu TO anon, authenticated;`
12. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS revendeur_nom text;`
13. `ALTER TABLE produits ADD COLUMN IF NOT EXISTS fournisseur text;`
14. `ALTER TABLE produits ADD COLUMN IF NOT EXISTS stock_min integer DEFAULT 0;`

---

## Design system

Fichier : `app/globals.css`

Polices : **Inter** (corps) + **EB Garamond** (titres, prix, noms d'articles)
Palette principale : `#C4953A` (or chaud) · `#2C2416` (bois foncé — sidebar) · `#8A9870` (sauge/succès)

Classes CSS utilitaires importantes : `.btn`, `.btn-primary`, `.btn-accent`, `.btn-secondary`, `.form-group`, `.form-input`, `.card`, `.badge-*`, `.stat-card`, `.page-container`, `.page-header`, `.page-title`, `.grid-products`

Navigation responsive : sidebar fixe à gauche sur desktop (≥ 768px), header + bottom nav sur mobile.

---

## Points d'attention

- **Navigation après mutation** : utiliser `window.location.href = '/...'` plutôt que `router.push()` pour forcer le rechargement et éviter les problèmes de cache Next.js
- **Migrations SQL** : toujours via le SQL Editor de Supabase dans Firefox (Chrome traduit les mots-clés SQL en français, ce qui casse les requêtes)
- **Pas de login** : l'application est accessible à quiconque possède le lien — décision assumée
- **Photos et nom lieu** : l'URL de la photo est copiée dans `ventes.photo_url` et le nom du lieu dans `ventes.revendeur_nom` à chaque vente — survivent à la suppression du produit ou du lieu. Fallback d'affichage : `v.revendeur?.nom || v.revendeur_nom || 'lieu supprimé'`
- **remise_defaut négatif** : dans `revendeurs`, une valeur négative de `remise_defaut` signifie une augmentation automatique (pas une remise). `BoutonVente` détecte le signe et applique reduction ou augmentation selon le cas.
- **TypeScript + Map** : utiliser `Array.from(map.values())` et non `[...map.values()]` — le spread sur les itérateurs Map n'est pas supporté sans `downlevelIteration`
- **RLS désactivé** sur toutes les tables — obligatoire sinon les écritures échouent silencieusement avec le client anon
- **Tables créées via SQL Editor** : nécessitent un `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO anon, authenticated;` explicite (contrairement au Table Editor qui l'accorde automatiquement)
- **NE PAS utiliser la jointure `lieu_depot:revendeurs(id, nom)` dans getProduit** : cette jointure cause des 404 sur toutes les fiches produit depuis la création de la table prix_lieu (rechargement du cache schema Supabase). A la place, récupérer lieu_depot manuellement depuis la liste revendeurs déjà chargée : `revendeurs.find(r => r.id === produit.lieu_depot_id)`
- **export const dynamic = 'force-dynamic'** : obligatoire sur toutes les pages serveur pour éviter la mise en cache Vercel
- **TypeScript + jointures Supabase** : les jointures sont inférées comme tableaux par TypeScript. Si tu as `p.categorie.nom` qui échoue à la compilation, caster avec `p.categorie as any`
- **onClick interdit dans les pages serveur** : un `onClick` dans un composant `async` (page serveur) provoque une erreur runtime "Application error" avec un digest opaque. Toujours extraire les boutons interactifs dans un composant client séparé (`'use client'`). Exemple : `BoutonImprimer.tsx` pour le bouton d'impression de l'aperçu catalogue.
- **Composants définis à l'intérieur d'un parent** : si un sous-composant est déclaré DANS le corps d'un autre composant, il est recréé à chaque render — les inputs perdent leur focus. Toujours déclarer les sous-composants EN DEHORS du parent (cf. `MiniFormDepot` dans `GestionCatalogueLieu.tsx`).

---

## Roadmap — fonctionnalités à venir

### 1. Dépenses générales
Frais non liés à une vente : emballages, matières premières, fournitures.
Table prévue : `depenses` (date, montant, categorie, description).
Impact attendu : marge globale réelle sur le tableau de bord et le récap URSSAF.

---

## Créer des fiches produit depuis des photos WhatsApp

Quand l'utilisatrice envoie un lot de photos pour créer des articles en masse, suivre cette procédure :

### Étape 1 — Redimensionner les photos
Les photos WhatsApp font ~3000-4000px. L'API refuse les images >2000px en contexte multi-images. Redimensionner à 800px max via PowerShell avant d'analyser.

```powershell
$src = "C:\chemin\vers\les\photos"
$dst = "C:\chemin\vers\photos_redim"
New-Item -ItemType Directory -Force $dst
Add-Type -AssemblyName System.Drawing
foreach ($f in Get-ChildItem "$src\*.jpg","$src\*.jpeg","$src\*.png") {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $ratio = [Math]::Min(800.0/$img.Width, 800.0/$img.Height)
  if ($ratio -lt 1) {
    $w = [int]($img.Width * $ratio); $h = [int]($img.Height * $ratio)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose(); $img.Dispose()
    $bmp.Save("$dst\$($f.Name)", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bmp.Dispose()
  } else { Copy-Item $f.FullName "$dst\$($f.Name)" }
}
```

### Étape 2 — Analyser les photos avec un Agent (contexte frais)
Si beaucoup de photos (>10), utiliser `Agent` avec un contexte frais pour ne pas saturer la session :

```
Agent({
  description: "Analyse photos produits",
  prompt: "Lis les images dans C:\\...\\photos_redim\\, liste chacune avec son nom de fichier, décris l'objet visible (type, matière, couleur), propose catégorie (Bijoux/Déco maison/Textile/Enfant-Bébé/Accessoires/Beauté), sous-catégorie, nom d'article et prix de vente suggéré. Retourne un tableau."
})
```

### Étape 3 — Script d'import `.mjs`
Créer `import-produits.mjs` à la racine de `magasin-app` (ES Module, pas CommonJS) :

```js
import { readFileSync, readdirSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(readFileSync('.env.local','utf8').trim().split('\n').map(l=>l.split('=')))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// 1. Récupérer les catégories au runtime
const { data: cats } = await supabase.from('categories').select('id,nom')
const catByName = Object.fromEntries(cats.map(c=>[c.nom, c.id]))

// 2. Liste des photos triées
const photos = readdirSync('C:\\...\\photos_redim').filter(f=>f.match(/\.(jpg|jpeg|png)$/i)).sort()

// 3. Tableau des produits (un objet par article)
const produits = [
  { nom: 'Nom article', prix_achat: 5, prix_vente_souhaite: 15, categorie: 'Bijoux', notes: '' },
  // ...
]

// 4. Import
for (let i = 0; i < produits.length; i++) {
  const p = produits[i]
  const photoPath = photos[i]
  // Upload photo
  const photoBytes = readFileSync(`C:\\...\\photos_redim\\${photoPath}`)
  const photoName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  await supabase.storage.from('images de produits').upload(photoName, photoBytes, { contentType: 'image/jpeg' })
  const { data: urlData } = supabase.storage.from('images de produits').getPublicUrl(photoName)
  // Insert produit
  const frais = p.frais_annexes || 0
  await supabase.from('produits').insert({
    nom: p.nom, prix_achat: p.prix_achat, frais_annexes: frais,
    prix_revient: p.prix_achat + frais, prix_vente_souhaite: p.prix_vente_souhaite,
    categorie_id: catByName[p.categorie], etat: 'disponible', quantite: p.quantite || 1,
    photo_url: urlData.publicUrl, notes: p.notes || null, fournisseur: p.fournisseur || null,
  })
  console.log(`[${i+1}/${produits.length}] ${p.nom}`)
  await new Promise(r => setTimeout(r, 250))
}
console.log('=== Terminé ===')
```

Lancer dans le terminal VS Code depuis le dossier `magasin-app` :
```bash
node import-produits.mjs
```

Supprimer le fichier après usage (ne jamais le committer).

### Points de vigilance
- Bucket Storage s'appelle exactement `images de produits` (avec espaces)
- Toujours utiliser `.mjs` (ESM), pas `.js` (CommonJS)
- Le script lit `.env.local` directement — ne pas hardcoder les clés
- Les photos WhatsApp sont souvent trop grandes pour être lues en masse dans la session principale → toujours passer par `Agent` ou redimensionner d'abord
- Si la session est saturée d'images (beaucoup de preview_screenshot), ouvrir une nouvelle conversation avant d'envoyer des photos à analyser

---

## Fonctionnalités livrées (historique)

- **Marchés & événements** (`/evenements`, `/evenements/[lieu_id]`) — bilan par lieu, enregistrement d'événements avec frais, rattachement automatique des ventes par date+lieu
- **Dépôt depuis le catalogue** — `GestionCatalogueLieu.tsx` : bouton "Déposer" inline sur chaque article hors catalogue
- **Annulation dépôt depuis catalogue** — bouton X dans la section "En dépôt ici"
- **Page Ventes enrichie** — panier moyen, filtre par lieu, répartitions espèces/carte et direct/lieu
- **Guide refondu** — toutes les fonctionnalités documentées, visible sur mobile
- **Sous-catégorie visible sur les cartes produit** — badge affiché directement sans ouvrir "Détails"
- **Édition inline sur la fiche produit** — `FicheEditable.tsx` : cliquer sur n'importe quelle valeur (nom, prix, quantité, état, notes, fournisseur) pour la modifier directement sans naviguer vers `/modifier`
