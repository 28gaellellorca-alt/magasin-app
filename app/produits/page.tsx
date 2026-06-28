export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import CartesProduits from '@/components/CartesProduits'

async function getProduits() {
  const { data } = await supabase
    .from('produits')
    .select('*, categorie:categories(nom), sous_categorie:sous_categories(nom)')
    .order('nom', { ascending: true })
  return data || []
}

async function getCategories() {
  const { data } = await supabase.from('categories').select('*').order('nom')
  return data || []
}

async function getRevendeurs() {
  const { data } = await supabase.from('revendeurs').select('id, nom').order('nom')
  return data || []
}

async function getPrixLieu() {
  const { data } = await supabase.from('prix_lieu').select('produit_id, revendeur_id, prix_vente')
  return data || []
}

async function getSousCategories() {
  const { data } = await supabase.from('sous_categories').select('*').order('nom')
  return data || []
}

export default async function ProduitsPage() {
  const [produits, categories, revendeurs, prixLieu, sousCategories] = await Promise.all([
    getProduits(), getCategories(), getRevendeurs(), getPrixLieu(), getSousCategories(),
  ])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon stock</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {produits.length} article{produits.length > 1 ? 's' : ''} enregistré{produits.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/ajouter" className="btn btn-accent">
          <PlusCircle size={18} />
          Ajouter
        </Link>
      </div>

      <CartesProduits produits={produits} categories={categories} revendeurs={revendeurs} prixLieu={prixLieu} sousCategories={sousCategories} />
    </div>
  )
}
