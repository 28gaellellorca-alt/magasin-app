import { supabase } from '@/lib/supabase'
import ListeVentes from '@/components/ListeVentes'

async function getVentes() {
  const { data } = await supabase
    .from('ventes')
    .select('*, produit:produits(nom, photo_url), revendeur:revendeurs(nom)')
    .order('date_vente', { ascending: false })
  return data || []
}

export default async function VentesPage() {
  const ventes = await getVentes()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {ventes.length} vente{ventes.length > 1 ? 's' : ''} enregistrée{ventes.length > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {ventes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <p>Aucune vente enregistrée pour l'instant.</p>
          <p style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>
            Pour enregistrer une vente, ouvre la fiche d'un article disponible.
          </p>
        </div>
      ) : (
        <ListeVentes ventes={ventes} />
      )}
    </div>
  )
}
