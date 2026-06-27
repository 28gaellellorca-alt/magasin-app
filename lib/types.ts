export type EtatProduit = 'disponible' | 'vendu' | 'reserve'

export interface Categorie {
  id: string
  nom: string
  slug: string
  created_at: string
}

export interface SousCategorie {
  id: string
  nom: string
  categorie_id: string
  created_at: string
}

export interface Revendeur {
  id: string
  nom: string
  commission_type: 'fixe' | 'pourcentage'
  commission_valeur: number
  created_at: string
}

export interface Produit {
  id: string
  nom: string
  categorie_id: string | null
  sous_categorie_id: string | null
  prix_achat: number
  frais_annexes: number
  prix_revient: number
  prix_vente_souhaite: number
  quantite: number
  etat: EtatProduit
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
  categorie?: Categorie
  sous_categorie?: SousCategorie
}

export interface Vente {
  id: string
  produit_id: string
  quantite_vendue: number
  prix_vente_reel: number
  canal: 'direct' | 'revendeur'
  revendeur_id: string | null
  marge_nette: number
  date_vente: string
  notes: string | null
  produit?: Produit
  revendeur?: Revendeur
}
