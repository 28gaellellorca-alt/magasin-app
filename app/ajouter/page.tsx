import { supabase } from '@/lib/supabase'
import FormulaireAjout from '@/components/FormulaireAjout'

async function getCategories() {
  const { data } = await supabase.from('categories').select('*').order('nom')
  return data || []
}

async function getSousCategories() {
  const { data } = await supabase.from('sous_categories').select('*').order('nom')
  return data || []
}

export default async function AjouterPage() {
  const [categories, sousCategories] = await Promise.all([getCategories(), getSousCategories()])
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ajouter un article</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Remplis les informations de ton nouvel article
          </p>
        </div>
      </div>
      <FormulaireAjout categories={categories} sousCategories={sousCategories} />
    </div>
  )
}
