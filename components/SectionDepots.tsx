import Image from 'next/image'
import { MapPin, Package } from 'lucide-react'

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function SectionDepots({ produits }: { produits: any[] }) {
  if (produits.length === 0) return null

  const parLieu = new Map<string, { nom: string; items: any[]; valeur: number; quantite: number }>()
  for (const p of produits) {
    if (!p.lieu_depot) continue
    const id = p.lieu_depot.id
    const e = parLieu.get(id) || { nom: p.lieu_depot.nom, items: [] as any[], valeur: 0, quantite: 0 }
    const qteDepot = p.quantite_en_depot || p.quantite || 0
    e.items.push({ ...p, qteDepot })
    e.valeur += (p.prix_vente_souhaite || 0) * qteDepot
    e.quantite += qteDepot
    parLieu.set(id, e)
  }

  const lieux = Array.from(parLieu.values())

  return (
    <div className="card card-body" style={{ marginBottom: 'var(--space-5)', borderTop: '3px solid var(--color-warning)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <MapPin size={20} color="var(--color-warning)" />
        Stock immobilisé en dépôt
      </h2>
      {lieux.map(lieu => (
        <div key={lieu.nom} style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{lieu.nom}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: 'var(--text-base)' }}>{euro(lieu.valeur)}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {lieu.quantite} article{lieu.quantite > 1 ? 's' : ''} immobilisé{lieu.quantite > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {lieu.items.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-warning-light)', borderRadius: 'var(--radius)' }}>
                {p.photo_url ? (
                  <Image src={p.photo_url} alt={p.nom} width={40} height={40}
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} color="var(--color-primary)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {p.qteDepot} déposé{p.qteDepot > 1 ? 's' : ''}
                    {p.quantite > p.qteDepot ? ` · ${p.quantite - p.qteDepot} chez toi` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>{euro((p.prix_vente_souhaite || 0) * p.qteDepot)}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>à {euro(p.prix_vente_souhaite || 0)} / art.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
