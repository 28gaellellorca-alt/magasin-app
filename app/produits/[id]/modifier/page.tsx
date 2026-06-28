import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import FormulaireModifier from '@/components/FormulaireModifier'

async function getProduit(id: string) {
  const { data } = await supabase.from('produits').select('*').eq('id', id).single()
  return data
}
async function getCategories() {
  const { data } = await supabase.from('categories').select('*').order('nom')
  return data || []
}
async function getSousCategories() {
  const { data } = await supabase.from('sous_categories').select('*').order('nom')
  return data || []
}
async function getFournisseurs() {
  const { data } = await supabase.from('produits').select('fournisseur').not('fournisseur', 'is', null)
  if (!data) return []
  return Array.from(new Set(data.map((d: any) => d.fournisseur).filter(Boolean))).sort() as string[]
}

export default async function ModifierProduit({ params }: { params: { id: string } }) {
  const [produit, categories, sousCategories, fournisseurs] = await Promise.all([
    getProduit(params.id), getCategories(), getSousCategories(), getFournisseurs(),
  ])
  if (!produit) notFound()
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier un article</h1>
      </div>
      <FormulaireModifier produit={produit} categories={categories} sousCategories={sousCategories} fournisseurs={fournisseurs} />
    </div>
  )
}
