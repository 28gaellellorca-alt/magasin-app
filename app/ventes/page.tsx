import { supabase } from '@/lib/supabase'

async function getVentes() {
  const { data } = await supabase
    .from('ventes')
    .select('*, produit:produits(nom, photo_url), revendeur:revendeurs(nom)')
    .order('date_vente', { ascending: false })
  return data || []
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default async function VentesPage() {
  const ventes = await getVentes()
  const caTotal = ventes.reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const margeTotal = ventes.reduce((s, v) => s + v.marge_nette, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {ventes.length} vente{ventes.length > 1 ? 's' : ''} enregistrée{ventes.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {ventes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="stat-card">
            <div className="stat-label">CA total</div>
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(caTotal)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Marge totale</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{euro(margeTotal)}</div>
          </div>
        </div>
      )}

      {ventes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <p>Aucune vente enregistrée pour l'instant.</p>
          <p style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>Pour enregistrer une vente, ouvre la fiche d'un article disponible.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {ventes.map((v: any) => (
            <div key={v.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{v.produit?.nom || 'Article supprimé'}</div>
                <div className="card-meta" style={{ marginTop: 2 }}>
                  {new Date(v.date_vente).toLocaleDateString('fr-FR')} — {v.canal === 'direct' ? 'Vente directe' : `Via ${v.revendeur?.nom || 'revendeur'}`} — {v.quantite_vendue} article{v.quantite_vendue > 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{euro(v.prix_vente_reel)}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>{euro(v.marge_nette)} de marge</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
