import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Package } from 'lucide-react'
import BoutonExportCSV from '@/components/BoutonExportCSV'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function VentesPage() {
  const ventes = await getVentes()
  const caTotal = ventes.reduce((s, v: any) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const margeTotal = ventes.reduce((s, v: any) => s + v.marge_nette, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {ventes.length} vente{ventes.length > 1 ? 's' : ''} enregistrée{ventes.length > 1 ? 's' : ''}
          </p>
        </div>
        {ventes.length > 0 && <BoutonExportCSV ventes={ventes} />}
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
          {ventes.map((v: any) => {
            const photo = v.photo_url || v.produit?.photo_url
            const nomProduit = v.produit?.nom || 'Article supprimé'
            return (
              <div key={v.id} className="card card-body" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                {/* Photo */}
                <div style={{ flexShrink: 0 }}>
                  {photo ? (
                    <Image
                      src={photo}
                      alt={nomProduit}
                      width={72}
                      height={72}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 72, height: 72, background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={28} color="var(--color-primary)" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 2 }}>
                    {nomProduit}
                    {!v.produit && (
                      <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 400 }}>(supprimé)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    {formatDate(v.date_vente)}
                  </div>
                  <div className="card-meta">
                    {v.canal === 'direct' ? 'Vente directe' : `Via ${v.revendeur?.nom || 'revendeur'}`}
                    {' — '}
                    {v.quantite_vendue} article{v.quantite_vendue > 1 ? 's' : ''}
                    {v.acheteur && <span> — <strong>{v.acheteur}</strong></span>}
                  </div>
                  {v.notes && (
                    <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      {v.notes}
                    </div>
                  )}
                </div>

                {/* Prix */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
                    {euro(v.prix_vente_reel)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: 2 }}>
                    {euro(v.marge_nette)} marge
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
