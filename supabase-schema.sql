-- Script à coller dans l'éditeur SQL de Supabase
-- Projet : magasin-stock

-- Catégories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Sous-catégories
create table if not exists sous_categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie_id uuid references categories(id) on delete cascade,
  created_at timestamptz default now()
);

-- Revendeurs
create table if not exists revendeurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  commission_type text not null check (commission_type in ('fixe', 'pourcentage')),
  commission_valeur numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Produits
create table if not exists produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie_id uuid references categories(id) on delete set null,
  sous_categorie_id uuid references sous_categories(id) on delete set null,
  prix_achat numeric(10,2) not null default 0,
  frais_annexes numeric(10,2) not null default 0,
  prix_revient numeric(10,2) not null default 0,
  prix_vente_souhaite numeric(10,2) not null default 0,
  quantite integer not null default 1,
  etat text not null default 'disponible' check (etat in ('disponible', 'vendu', 'reserve')),
  notes text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ventes
create table if not exists ventes (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references produits(id) on delete cascade,
  quantite_vendue integer not null default 1,
  prix_vente_reel numeric(10,2) not null,
  canal text not null check (canal in ('direct', 'revendeur')),
  revendeur_id uuid references revendeurs(id) on delete set null,
  marge_nette numeric(10,2) not null default 0,
  date_vente timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- Données de départ : catégories
insert into categories (nom, slug) values
  ('Bijoux', 'bijoux'),
  ('Déco maison', 'deco-maison'),
  ('Enfant/Bébé', 'enfant-bebe'),
  ('Textile', 'textile'),
  ('Accessoires', 'accessoires')
on conflict (slug) do nothing;

-- Accès public en lecture/écriture (app sans login)
alter table categories enable row level security;
alter table sous_categories enable row level security;
alter table revendeurs enable row level security;
alter table produits enable row level security;
alter table ventes enable row level security;

create policy "Accès public" on categories for all using (true) with check (true);
create policy "Accès public" on sous_categories for all using (true) with check (true);
create policy "Accès public" on revendeurs for all using (true) with check (true);
create policy "Accès public" on produits for all using (true) with check (true);
create policy "Accès public" on ventes for all using (true) with check (true);
