export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import GestionCatalogueLieu from '@/components/GestionCatalogueLieu'

async function getLieu(id: string) {
  const { data } = await supabase.from('revendeurs').select('*').eq('id', id).single()
  return data
}

async function getProduits() {
  const { data } = await supabase
    .from('produits')
    .select('*, categorie:categories(nom)')
    .order('nom')
  return data || []
}

async function getPrixLieu(lieuId: string) {
  const { data } = await supabase
    .from('prix_lieu')
    .select('produit_id, prix_vente')
    .eq('revendeur_id', lieuId)
  return data || []
}

export default async function CatalogueLieuPage({ params }: { params: { lieu_id: string } }) {
  const [lieu, produits, prixLieu] = await Promise.all([
    getLieu(params.lieu_id),
    getProduits(),
    getPrixLieu(params.lieu_id),
  ])

  if (!lieu) notFound()

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/parametres" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
          <ArrowLeft size={16} /> Retour aux réglages
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <MapPin size={22} color="var(--color-primary)" strokeWidth={1.8} />
          <div>
            <h1 className="page-title">{lieu.nom}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 2 }}>
              Catalogue des articles proposés sur ce lieu
            </p>
          </div>
        </div>
      </div>

      <GestionCatalogueLieu lieu={lieu} produits={produits} prixLieu={prixLieu} />
    </div>
  )
}
