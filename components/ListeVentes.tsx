'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'
import BoutonAnnulerVente from '@/components/BoutonAnnulerVente'
import BoutonExportCSV from '@/components/BoutonExportCSV'

type Periode = 'semaine' | 'mois' | 'trimestre' | 'annee' | 'tout'

const FILTRES: { val: Periode; label: string }[] = [
  { val: 'semaine',   label: 'Cette semaine' },
  { val: 'mois',      label: 'Ce mois' },
  { val: 'trimestre', label: 'Ce trimestre' },
  { val: 'annee',     label: 'Cette année' },
  { val: 'tout',      label: 'Tout' },
]

function filtrer(ventes: any[], periode: Periode) {
  if (periode === 'tout') return ventes
  const now = new Date()
  const annee = now.getFullYear()
  const mois = now.getMonth()
  const trimestre = Math.floor(mois / 3)
  return ventes.filter(v => {
    const d = new Date(v.date_vente)
    if (d.getFullYear() !== annee) return false
    if (periode === 'annee') return true
    if (periode === 'trimestre') return Math.floor(d.getMonth() / 3) === trimestre
    if (periode === 'mois') return d.getMonth() === mois
    // semaine : 7 derniers jours
    return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000
  })
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ListeVentes({ ventes }: { ventes: any[] }) {
  const [periode, setPeriode] = useState<Periode>('mois')

  const liste = filtrer(ventes, periode)
  const ca = liste.reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const marge = liste.reduce((s, v) => s + v.marge_nette, 0)

  return (
    <>
      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {FILTRES.map(f => (
          <button
            key={f.val}
            onClick={() => setPeriode(f.val)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${periode === f.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: periode === f.val ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: periode === f.val ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
              fontWeight: periode === f.val ? 600 : 400,
              fontSize: 'var(--text-sm)', cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <BoutonExportCSV ventes={liste} />
        </div>
      </div>

      {/* Totaux */}
      {liste.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="stat-card">
            <div className="stat-label">CA — {FILTRES.find(f => f.val === periode)?.label}</div>
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(ca)}</div>
            <div className="stat-sub">{liste.length} vente{liste.length > 1 ? 's' : ''}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Marge</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{euro(marge)}</div>
          </div>
        </div>
      )}

      {/* Liste */}
      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <p>Aucune vente sur cette période.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {liste.map((v: any) => {
            const photo = v.photo_url || v.produit?.photo_url
            const nomProduit = v.produit?.nom || 'Article supprimé'
            return (
              <div key={v.id} className="card card-body" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  {photo ? (
                    <Image src={photo} alt={nomProduit} width={72} height={72}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={28} color="var(--color-primary)" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 2 }}>
                    {nomProduit}
                    {!v.produit && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 400 }}>(supprimé)</span>}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    {formatDate(v.date_vente)}
                  </div>
                  <div className="card-meta">
                    {v.canal === 'direct' ? 'Vente directe' : `Via ${v.revendeur?.nom || 'revendeur'}`}
                    {' — '}
                    {v.quantite_vendue} article{v.quantite_vendue > 1 ? 's' : ''}
                    {v.acheteur && <span> — <strong>{v.acheteur}</strong></span>}
                    {' — '}
                    {v.mode_paiement === 'carte' ? 'Carte' : 'Espèces'}
                    {v.remise > 0 && (
                      <span style={{ marginLeft: 6, background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        -{v.remise}%
                      </span>
                    )}
                  </div>
                  {v.notes && (
                    <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      {v.notes}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
                    {euro(v.prix_vente_reel)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: 2 }}>
                    {euro(v.marge_nette)} marge
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <BoutonAnnulerVente venteId={v.id} produitId={v.produit_id} quantiteVendue={v.quantite_vendue} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
