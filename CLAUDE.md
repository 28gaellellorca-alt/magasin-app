# CLAUDE.md — Application Gestion de Stock Magasin Artisanal

## 1. Résumé du projet

Nom du projet : Application de gestion de stock — Boutique artisanale fait main

Type de projet :
- [x] Application web

Objectif principal :
Permettre à une auto-entrepreneur de gérer son stock d'articles artisanaux achetés principalement sur Vinted (crochet, bijoux, déco, enfant, textile). L'application doit permettre d'enregistrer les produits à réception avec photos, de suivre le stock par catégorie et sous-catégorie, de calculer les marges selon le canal de vente, et de visualiser des prévisions et récapitulatifs.

Résultat attendu :
Une application web hébergée sur Vercel, accessible depuis téléphone et ordinateur, avec base de données et stockage photos sur Supabase. Plusieurs personnes peuvent y accéder simultanément pour consulter et mettre à jour le stock.

## 2. Contexte métier

Pourquoi ce projet existe :
La gestion du stock se faisait sans outil — articles perdus de vue, marges inconnues, stock mal suivi. Le projet permet de reprendre le contrôle du stock existant et de gérer les nouveaux achats dès la réception.

Qui va utiliser le résultat :
- [x] Moi uniquement (propriétaire principale)
- [x] Mon équipe (collaborateurs du magasin — accès partagé)

Niveau technique des utilisateurs finaux :
- [x] Non technique

Ce qui compte le plus :
- [x] Simplicité
- [x] Fiabilité
- [x] Coût faible
- [x] Facilité de maintenance

## 3. Périmètre du projet

Ce que le projet doit faire :
- [x] Enregistrer chaque produit à réception : photo(s), nom, catégorie, sous-catégorie, prix d'achat, frais annexes, prix de vente souhaité, quantité, état, notes
- [ ] Suggestion automatique de catégorie basée sur les mots-clés du nom du produit
- [x] Catégories et sous-catégories entièrement personnalisables (ajout, renommage, suppression)
- [x] Calcul automatique du prix de revient (achat + charges) en € et en %
- [x] Calcul de la marge nette selon le canal de vente (vente directe ou via revendeur avec commission paramétrable en € fixe ou en %)
- [x] Marquer un article vendu, noter le canal et le prix réel de vente
- [x] Tableau de bord : valeur du stock, CA potentiel, marges globales — CA par catégorie non fait
- [ ] Prévisions : tendances de vente, articles les plus vendus, stock vieillissant (alerte > 60j faite, tendances non faites)
- [x] Fiche produit complète avec photo et historique des ventes
- [x] Accès multi-collaborateurs via lien (pas de login — accès ouvert au lien)

Ce que le projet ne doit pas faire pour l'instant :
- Gestion de TVA (auto-entrepreneur sous le seuil de franchise)
- Intégration comptable ou logiciel de caisse
- Gestion de rôles complexes entre collaborateurs (accès identique pour tous)
- Synchronisation avec Vinted ou autre plateforme externe

Version souhaitée :
- [x] MVP simple mais utilisable (à construire en premier)
- [x] Version propre et présentable (objectif final)

Priorité principale :
Enregistrement des produits + calcul des marges + tableau de bord. Ce sont les trois besoins urgents pour reprendre le contrôle du stock existant.

## 4. Contraintes importantes

Contraintes de temps :
Pas de date limite fixe. On construit par étapes.

Contraintes de budget :
Hébergement gratuit ou très bon marché (usage personnel). Plan gratuit Supabase + plan gratuit Vercel.

Contraintes techniques :
- Application 100% dans le cloud (pas de local) — accessible partout
- Responsive obligatoire : fonctionne sur téléphone ET ordinateur
- Photos stockées dans Supabase Storage (pas de perte de données)
- Base de données Supabase PostgreSQL (pas de SQLite)
- Déploiement sur Vercel, connecté à GitHub (mise à jour automatique à chaque modification du code)

Contraintes de design :
Interface douce, chaleureuse, inspirée de l'artisanat fait main. Palette violet doux + corail chaud. Simple, claire, sans jargon. Utilisable sans formation. Appliquer la skill `ui-design` qui contient tout le design system du projet.

Contraintes légales, données ou confidentialité :
- Ne jamais stocker les clés Supabase dans le code — elles sont dans des variables d'environnement Vercel
- Les clés sont notées localement dans : `cles-supabase.txt` (ne pas versionner ce fichier)
- Pas de données clients : uniquement des données de stock personnelles

Contraintes d'usage :
L'utilisatrice doit pouvoir ajouter des produits, des catégories et consulter ses marges sans aide technique.

## 5. Outils, plateformes et technologies

Outils ou plateformes imposés :
- **Vercel** — hébergement de l'application (compte existant, déjà utilisé)
- **GitHub** — dépôt de code source (compte existant)
- **Supabase** — base de données + stockage photos (projet créé : `magasin-stock`, région West EU Ireland)

Outils ou plateformes préférés :
- **Next.js** (React) — framework principal
- **Supabase JS** — client officiel pour communiquer avec Supabase
- **Tailwind CSS** — styling (si pertinent selon le projet)

Outils ou plateformes à éviter :
- SQLite ou base de données locale
- Hébergements payants (AWS, Azure, GCP) pour cette version
- Solutions nécessitant une installation sur le poste de travail

## 6. Structure du projet

Le code de l'application est dans un dossier **séparé** de ce dossier.
Ce dossier `application magasin` sert de référence : photos, notes, clés de connexion.

Fichiers importants dans CE dossier :
- `CLAUDE.md` : ce fichier — contexte du projet pour Claude
- `cles-supabase.txt` : clés de connexion Supabase (NE PAS versionner, NE PAS partager)
- `fiche-mission-app-stock-v4.docx` : fiche de mission complète du projet
- Photos JPG : exemples de produits du stock (bocaux crochet, doudous, bijoux, etc.)

Fichiers à ne pas modifier sans prévenir :
- `cles-supabase.txt`
- `CLAUDE.md`

Fichiers ou dossiers à ignorer lors du développement :
- Les photos JPG (uniquement pour référence visuelle des produits)

Structure attendue du projet Next.js (à créer dans un dossier séparé) :
```
magasin-app/
├── app/                  — pages Next.js (App Router)
│   ├── layout.tsx        — layout global
│   ├── page.tsx          — tableau de bord
│   ├── produits/         — gestion du stock
│   ├── categories/       — gestion des catégories
│   └── ventes/           — historique des ventes
├── components/           — composants réutilisables
├── lib/
│   └── supabase.ts       — client Supabase
├── styles/
│   └── globals.css       — design system (skill ui-design)
├── .env.local            — variables d'environnement (jamais sur GitHub)
└── CLAUDE.md             — ce fichier (copier dans le projet)
```

## 7. Données, fichiers et contenus

Sources utilisées :
- [x] Images (photos produits — upload vers Supabase Storage)
- [x] Base de données (Supabase PostgreSQL)

Emplacement des données :
- Base de données : Supabase projet `magasin-stock` — URL : `https://ktthghagczyuphdiwzbe.supabase.co`
- Photos : Supabase Storage, bucket **`images de produits`** (avec espaces, en français — nom exact à utiliser dans le code)
- Clés de connexion : voir `cles-supabase.txt` dans ce dossier (jamais dans le code)

Format d'entrée :
Formulaire de saisie dans l'application — photo uploadée depuis téléphone ou ordinateur, champs texte et numériques.

Format de sortie attendu :
- Tableau de bord visuel avec indicateurs
- Fiches produit consultables
- Exports possibles en CSV (version future)

Règles de traitement :
- Prix de revient = prix d'achat + total des frais annexes
- Marge directe = prix de vente - prix de revient
- Marge via revendeur = prix de vente - prix de revient - commission revendeur (€ fixe ou %)
- Stock disponible = quantité initiale - quantité vendue

Données sensibles :
Aucune donnée client. Uniquement des données de stock personnelles. Pas de RGPD particulier.

## 8. Automatisations Make / n8n / Zapier

Non applicable pour l'instant.

## 9. Site web, page web ou application

Objectif de l'interface :
Permettre à la propriétaire et à ses collaborateurs de gérer le stock au quotidien — enregistrer les arrivées, suivre les ventes, consulter les marges.

Pages ou écrans nécessaires :
- Tableau de bord (accueil) — indicateurs clés, stock total, CA potentiel, marges
- Liste des produits — filtrable par catégorie, état, canal
- Fiche produit — détail complet, photos, historique
- Ajouter un produit — formulaire d'enregistrement avec upload photo
- Catégories — gestion des catégories et sous-catégories
- Ventes — historique, marquer un article vendu
- Paramètres — canaux de vente, revendeurs et leurs commissions

Contenus importants :
- Titre principal : Mon stock
- Actions principales : "Ajouter un produit", "Voir le stock", "Enregistrer une vente"
- Sections obligatoires : tableau de bord, liste produits, formulaire d'ajout

Style visuel souhaité :
Doux, chaleureux, artisanal. Pas corporate. Voir la skill `ui-design` pour la palette complète (violet doux + corail chaud, blanc cassé, typographie fluide).

Règles UX :
- Interface en français
- Actions principales toujours visibles (pas cachées dans des menus)
- Boutons grands et clairs (minimum 44×44px — tactile mobile)
- Navigation en bas de l'écran sur mobile
- Formulaires avec labels explicites au-dessus des champs
- Messages d'erreur clairs et en français

## 10. Commandes utiles

Installation des dépendances :
```bash
npm install
```

Lancer le projet en développement :
```bash
npm run dev
```

Créer une version de production :
```bash
npm run build
```

Variables d'environnement nécessaires (fichier `.env.local` — jamais sur GitHub) :
```
NEXT_PUBLIC_SUPABASE_URL=https://ktthghagczyuphdiwzbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[clé publiable — voir cles-supabase.txt]
```

## 11. Règles de travail pour Claude dans ce projet

Avant de modifier :
- Comprendre l'objectif de la tâche
- Identifier les fichiers concernés
- Expliquer brièvement le plan si la modification est importante
- Demander validation avant toute action risquée ou difficile à annuler

Pendant la modification :
- Toujours appliquer le design system de la skill `ui-design`
- Interface en français partout (labels, messages, boutons)
- Privilégier la solution la plus simple
- Ne jamais écrire les clés Supabase dans le code
- Garder le code compréhensible pour une personne non développeuse

Après la modification :
- Résumer ce qui a changé
- Indiquer les fichiers modifiés
- Expliquer comment vérifier que ça fonctionne
- Proposer la prochaine étape

## 12. Tests et vérification

Méthode de vérification attendue :
- L'application se lance sans erreur (`npm run dev`)
- On peut ajouter un produit avec photo depuis un téléphone
- On peut consulter le tableau de bord sur ordinateur
- Le calcul de marge est correct
- L'interface est lisible sur mobile (375px) et desktop (1280px)

Données ou scénario de test :
Ajouter un produit test : "Doudou étoile crochet", catégorie "Enfant/Bébé", prix d'achat 2€, frais 0,50€, prix de vente 8€. Vérifier que la marge affichée est correcte (5,50€ soit 68,75%).

Critères de réussite :
- Produit enregistré avec photo visible
- Marge calculée et affichée correctement
- Produit apparaît dans la liste et dans le tableau de bord
- Accessible depuis un téléphone sans problème d'affichage

## 13. Sécurité et points de vigilance

Claude doit faire attention à :
- Ne jamais écrire les clés Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`) dans le code source
- Toujours utiliser les variables d'environnement (`.env.local`)
- Ne pas commiter `.env.local` sur GitHub (vérifier `.gitignore`)
- Ne pas supprimer de tables Supabase sans validation explicite
- Prévenir avant toute migration de base de données

Informations sensibles à ne jamais inclure dans le projet :
- Clés Supabase (publiable et secrète)
- Mots de passe GitHub, Vercel, Supabase
- Données personnelles réelles

## 14. Documentation attendue

Documentation utile :
- Comment lancer le projet localement
- Comment déployer une mise à jour (push GitHub → Vercel automatique)
- Comment ajouter une catégorie depuis l'interface
- Comment créer les tables Supabase (script SQL fourni)

Emplacement souhaité :
- [x] Dans ce fichier CLAUDE.md

## 15. Décisions déjà prises

Décisions importantes :
- **Next.js + Supabase + Vercel** : stack choisie pour hébergement gratuit, responsive, multi-utilisateurs, photos dans le cloud
- **Supabase plutôt que SQLite local** : données accessibles partout, pas de risque de perte, partageable
- **GitHub comme intermédiaire** : toute modification du code passe par GitHub → Vercel se met à jour automatiquement
- **Projet Supabase créé** : `magasin-stock`, région West EU (Ireland), clés notées dans `cles-supabase.txt`
- **Design system** : skill `ui-design` avec palette violet doux + corail chaud, mobile-first, WCAG AA
- **Bucket Supabase Storage** : nommé `images de produits` (avec espaces, en français) — toujours utiliser ce nom exact dans le code
- **GitHub** : dépôt `https://github.com/28gaellellorca-alt/magasin-app`
- **Vercel** : application déployée sur `magasin-app.vercel.app` — MVP fonctionnel en production

Choix refusés :
- Application locale Windows (Python+Flask+SQLite) : abandonnée car non accessible sur téléphone et non partageable
- Hébergement payant : inutile pour cet usage personnel

## 16. Questions ouvertes (résolues)

- Dossier du code : `magasin-app/` sur le bureau
- Revendeurs : nombre illimité, gérés dans Réglages
- Login : pas de login — accès ouvert à quiconque possède le lien Vercel (décision assumée)

## 17. État actuel — MVP terminé et en production

**URL de production : `magasin-app.vercel.app`**
**GitHub : `https://github.com/28gaellellorca-alt/magasin-app`**

### Ce qui fonctionne aujourd'hui

**Stock :**
- Ajout d'un article avec photo (depuis téléphone ou ordinateur)
- Fiche produit : photo, catégorie, sous-catégorie, prix achat, frais, prix de revient, prix de vente, marge, quantité, état, notes
- Liste des produits avec filtres par catégorie et état
- Modifier un article
- Supprimer un article (avec confirmation et avertissement si des ventes existent)

**Ventes :**
- Enregistrer une vente depuis la fiche produit : prix réel, quantité, canal (direct ou revendeur), acheteur (optionnel), notes (optionnel)
- Calcul automatique de la marge au moment de la vente
- Stock décrémenté automatiquement à chaque vente
- Annuler une vente (avec remise en stock automatique)
- Page Ventes : historique complet avec photo, date, acheteur, notes, prix et marge
- La photo d'un article vendu reste visible même si l'article est supprimé

**Tableau de bord :**
- Nombre d'articles disponibles
- Valeur du stock (prix de revient total)
- CA potentiel (si tout est vendu au prix souhaité)
- Marge potentielle
- CA réalisé (ventes enregistrées)
- Alerte articles > 60 jours en stock

**Paramètres :**
- Catégories et sous-catégories personnalisables
- Revendeurs avec commission (% ou € fixe)

**Design :**
- Logo "Les Pépites de G&A" visible sur mobile (header) et desktop (sidebar)
- Interface responsive mobile + desktop
- Palette dorée/bois, design chaleureux artisanal

### Structure de la base de données (Supabase)

Tables créées et migrées :
- `produits` — articles du stock
- `categories` / `sous_categories` — organisation
- `ventes` — historique des ventes (avec `photo_url` et `acheteur` ajoutés en migration)
- `revendeurs` — canaux de vente avec commissions

Migrations appliquées manuellement via SQL Editor :
1. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS photo_url text;`
2. `ALTER TABLE ventes DROP CONSTRAINT ventes_produit_id_fkey; ALTER TABLE ventes ADD CONSTRAINT ventes_produit_id_fkey FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL;`
3. `ALTER TABLE ventes ADD COLUMN IF NOT EXISTS acheteur text;`

## 18. Prochaines étapes — par ordre de priorité

### Priorité 1 — Utile pour la gestion quotidienne

**CA par période sur le tableau de bord**
Pourquoi : la déclaration URSSAF se fait par mois ou par trimestre. Aujourd'hui le CA affiché est total depuis le début. Il faut voir : CA du mois en cours, du trimestre en cours, de l'année civile.
Travail : modifier `app/page.tsx` pour filtrer les ventes par période.

**Estimation cotisations URSSAF**
Pourquoi : en vente de marchandises, les cotisations sociales sont 12,3% du CA. Afficher "à mettre de côté ce trimestre : X€" aide à ne pas avoir de mauvaise surprise.
Travail : calcul simple à ajouter sur le tableau de bord.

**Alerte seuil TVA**
Pourquoi : la franchise TVA s'arrête à 85 000€ de CA annuel. Une barre de progression sur le tableau de bord évite de dépasser sans le savoir.
Travail : comparer le CA annuel à un seuil paramétrable.

### Priorité 2 — Confort d'utilisation

**Export CSV des ventes**
Pourquoi : pour la déclaration ou un comptable, avoir les ventes d'une période en tableau Excel.
Travail : bouton d'export sur la page Ventes.

**Recherche dans la liste des produits**
Pourquoi : quand il y aura 50+ articles, retrouver un article par mot-clé sera nécessaire.
Travail : barre de recherche côté client dans `app/produits/page.tsx`.

**Filtre par date sur la page Ventes**
Pourquoi : voir uniquement les ventes de ce mois ou de cette semaine.
Travail : sélecteur de période sur `app/ventes/page.tsx`.

### Priorité 3 — À envisager plus tard

- Dépenses générales (non liées à un article : frais de marché, abonnements)
- Articles les plus vendus (statistiques)
- CA et marge par catégorie sur le tableau de bord
- Objectif de CA mensuel avec indicateur de progression
