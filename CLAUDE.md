# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Application web de gestion de stock pour une boutique artisanale fait main ("Les Pépites de G&A"). Stock, ventes, marges, tableau de bord — utilisée par une non-développeure.

- **Production** : `magasin-app.vercel.app`
- **GitHub** : `https://github.com/28gaellellorca-alt/magasin-app`
- **Stack** : Next.js 14 App Router · Supabase (PostgreSQL + Storage) · Vercel

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

- **Pages serveur** (`app/*/page.tsx`) : fetching Supabase côté serveur, pas de `'use client'`
- **Composants client** (`components/*.tsx`) : interactions utilisateur, `'use client'` obligatoire, état local avec `useState`
- **Client Supabase unique** : `lib/supabase.ts` — importé partout

Les pages serveur chargent les données puis les passent en props aux composants client. Les mutations (INSERT, UPDATE, DELETE) se font depuis les composants client via le client Supabase JS.

### Pages

| Route | Fichier | Rôle |
|---|---|---|
| `/` | `app/page.tsx` | Tableau de bord (CA par période, URSSAF, TVA) |
| `/produits` | `app/produits/page.tsx` | Liste des articles avec recherche et filtres |
| `/produits/[id]` | `app/produits/[id]/page.tsx` | Fiche produit + historique ventes |
| `/produits/[id]/modifier` | `app/produits/[id]/modifier/page.tsx` | Formulaire de modification |
| `/ajouter` | `app/ajouter/page.tsx` | Formulaire d'ajout avec upload photo |
| `/ventes` | `app/ventes/page.tsx` | Historique de toutes les ventes avec filtre période |
| `/stats` | `app/stats/page.tsx` | Stats par catégorie, sous-catégorie, produit, lieu de vente |
| `/parametres` | `app/parametres/page.tsx` | Catégories et lieux de vente |

### Composants clés

- `Navigation.tsx` — sidebar desktop + header mobile + nav bottom mobile. Contient les SVG du logo inline.
- `CartesProduits.tsx` — grille de produits avec recherche par mot-clé et filtres (catégorie, état)
- `BoutonVente.tsx` — formulaire de vente complet (prix, quantité, remise %, mode paiement, canal, lieu de vente, acheteur, notes). Calcule la marge et décrémente le stock. Auto-applique la remise_defaut du lieu sélectionné.
- `BoutonAnnulerVente.tsx` — annulation d'une vente avec remise en stock automatique. Gère le cas produit supprimé (produit_id null).
- `BoutonSupprimerProduit.tsx` — suppression produit avec confirmation, navigue via `window.location.href` (pas `router.push`)
- `BoutonExportCSV.tsx` — export CSV des ventes filtré par période (format français : `;` et `,`)
- `ListeVentes.tsx` — liste des ventes avec filtre période (semaine/mois/trimestre/année/tout) et bouton annuler par ligne
- `StatsVentes.tsx` — statistiques avec filtre période : par lieu de vente (bénéfice net), catégorie, sous-catégorie, top produits
- `FormulaireAjout.tsx` / `FormulaireModifier.tsx` — upload photo vers Supabase Storage avec compression automatique (max 1200px, JPEG 82%) via `lib/compresserImage.ts`
- `GestionCategories.tsx` / `GestionRevendeurs.tsx` — CRUD dans les réglages (GestionRevendeurs gère les "lieux de vente" malgré le nom du fichier)

### Base de données Supabase

Tables : `produits`, `categories`, `sous_categories`, `revendeurs`, `ventes`

Colonnes importantes de `ventes` (dont certaines ajoutées en migration) :
- `photo_url text` — copie de la photo au moment de la vente (survive à la suppression du produit)
- `acheteur text` — nom acheteur optionnel
- `mode_paiement text` — `'especes'` ou `'carte'`
- `remise numeric` — pourcentage de réduction appliqué
- `canal text` — `'direct'` ou `'revendeur'`
- Contrainte FK `ventes.produit_id → produits.id ON DELETE SET NULL` (pas CASCADE)

Colonnes importantes de `revendeurs` (= lieux de vente) :
- `commission_type text` — `'pourcentage'` / `'fixe'` / `'entree'`
- `commission_valeur numeric` — taux ou montant selon le type
- `remise_defaut numeric` — % de remise auto-appliqué lors d'une vente sur ce lieu

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
- **Photos** : l'URL de la photo est copiée dans `ventes.photo_url` à chaque vente pour qu'elle reste visible même si le produit est supprimé
- **TypeScript + Map** : utiliser `Array.from(map.values())` et non `[...map.values()]` — le spread sur les itérateurs Map n'est pas supporté sans `downlevelIteration`
