import { supabase } from '@/lib/supabase'
import GestionCategories from '@/components/GestionCategories'
import GestionRevendeurs from '@/components/GestionRevendeurs'

async function getCategories() {
  const { data } = await supabase.from('categories').select('*').order('nom')
  return data || []
}

async function getSousCategories() {
  const { data } = await supabase.from('sous_categories').select('*').order('nom')
  return data || []
}

async function getRevendeurs() {
  const { data } = await supabase.from('revendeurs').select('*').order('nom')
  return data || []
}

export default async function ParametresPage() {
  const [categories, sousCategories, revendeurs] = await Promise.all([
    getCategories(), getSousCategories(), getRevendeurs(),
  ])
  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Réglages</h1>
      </div>
      <GestionCategories categories={categories} sousCategories={sousCategories} />
      <div className="divider" />
      <GestionRevendeurs revendeurs={revendeurs} />
    </div>
  )
}
