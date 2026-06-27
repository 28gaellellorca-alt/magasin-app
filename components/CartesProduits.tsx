'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface Props {
  produits: any[]
  categories: any[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function CartesProduits({ produits, categories }: Props) {
  const [catFiltre, setCatFiltre] = useState('')
  const [etatFiltre, setEtatFiltre] = useState('')

  const filtres = produits.filter(p => {
    if (catFiltre && p.categorie_id !== catFiltre) return false
    if (etatFiltre && p.etat !== etatFiltre) return false
    return true
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 160 }}
          value={catFiltre}
          onChange={e => setCatFiltre(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 140 }}
          value={etatFiltre}
          onChange={e => setEtatFiltre(e.target.value)}
        >
          <option value="">Tous les états</option>
          <option value="disponible">Disponible</option>
          <option value="vendu">Vendu</option>
          <option value="reserve">Réservé</option>
        </select>
      </div>

      {filtres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <Package size={48} strokeWidth={1} style={{ margin: '0 auto var(--space-4)' }} />
          <p>Aucun article trouvé.</p>
          <Link href="/ajouter" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Ajouter un article
          </Link>
        </div>
      ) : (
        <div className="grid-products">
          {filtres.map((p: any) => {
            const marge = p.prix_vente_souhaite - p.prix_revient
            const margePct = p.prix_revient > 0 ? Math.round((marge / p.prix_revient) * 100) : 0
            return (
              <Link key={p.id} href={`/produits/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card">
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.nom} width={300} height={225} className="card-image" />
                  ) : (
                    <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={40} color="var(--color-primary)" strokeWidth={1} />
                    </div>
                  )}
                  <div className="card-body">
                    <div className="card-title" style={{ marginBottom: 4 }}>{p.nom}</div>
                    {p.categorie && (
                      <span className="badge badge-primary" style={{ marginBottom: 8 }}>{p.categorie.nom}</span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                      <span className="card-price">{euro(p.prix_vente_souhaite)}</span>
                      <span className={`badge ${marge >= 0 ? 'badge-success' : 'badge-danger'}`}>+{margePct}%</span>
                    </div>
                    <div className="card-meta" style={{ marginTop: 4 }}>Revient : {euro(p.prix_revient)}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge ${p.etat === 'disponible' ? 'badge-success' : p.etat === 'vendu' ? 'badge-neutral' : 'badge-warning'}`}>
                        {p.etat === 'disponible' ? 'Disponible' : p.etat === 'vendu' ? 'Vendu' : 'Réservé'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
