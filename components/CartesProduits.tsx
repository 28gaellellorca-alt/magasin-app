'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  produits: any[]
  categories: any[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function CarteInfo({ p }: { p: any }) {
  const [ouvert, setOuvert] = useState(false)
  const marge = p.prix_vente_souhaite - p.prix_revient
  const margePct = p.prix_revient > 0 ? Math.round((marge / p.prix_revient) * 100) : 0

  return (
    <div className="card">
      <Link href={`/produits/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {p.photo_url ? (
          <Image src={p.photo_url} alt={p.nom} width={300} height={225} className="card-image" />
        ) : (
          <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={40} color="var(--color-primary)" strokeWidth={1} />
          </div>
        )}
      </Link>

      <div className="card-body">
        <Link href={`/produits/${p.id}`} style={{ textDecoration: 'none' }}>
          <div className="card-title" style={{ marginBottom: 4 }}>{p.nom}</div>
        </Link>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {p.categorie && (
            <span className="badge badge-primary">{p.categorie.nom}</span>
          )}
          <span className={`badge ${p.etat === 'disponible' ? 'badge-success' : p.etat === 'vendu' ? 'badge-neutral' : 'badge-warning'}`}>
            {p.etat === 'disponible' ? 'Disponible' : p.etat === 'vendu' ? 'Vendu' : 'Réservé'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span className="card-price">{euro(p.prix_vente_souhaite)}</span>
          <span className={`badge ${marge >= 0 ? 'badge-success' : 'badge-danger'}`}>+{margePct}%</span>
        </div>

        {/* Ligne quantité visible directement */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span className="card-meta">
            Qté en stock : <strong style={{ color: p.quantite > 0 ? 'var(--color-text-primary)' : 'var(--color-danger)' }}>{p.quantite}</strong>
          </span>
          <button
            onClick={() => setOuvert(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, padding: '2px 4px' }}
            aria-label="Voir les détails"
          >
            {ouvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Détails
          </button>
        </div>

        {/* Panneau d'infos dépliable */}
        {ouvert && (
          <div style={{
            marginTop: 10,
            padding: 'var(--space-3)',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Prix d'achat</span>
              <strong>{euro(p.prix_achat)}</strong>
            </div>
            {p.frais_annexes > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Frais annexes</span>
                <strong>{euro(p.frais_annexes)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Prix de revient</span>
              <strong style={{ color: 'var(--color-primary)' }}>{euro(p.prix_revient)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 5, marginTop: 2 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Marge nette</span>
              <strong style={{ color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{euro(marge)}</strong>
            </div>
            {p.sous_categorie && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Sous-catégorie</span>
                <strong>{p.sous_categorie.nom}</strong>
              </div>
            )}
            {p.notes && (
              <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', paddingTop: 2 }}>
                {p.notes}
              </div>
            )}
            <Link href={`/produits/${p.id}`} className="btn btn-secondary btn-sm" style={{ marginTop: 6, textAlign: 'center' }}>
              Ouvrir la fiche complète
            </Link>
          </div>
        )}
      </div>
    </div>
  )
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
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={catFiltre} onChange={e => setCatFiltre(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={etatFiltre} onChange={e => setEtatFiltre(e.target.value)}>
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
          {filtres.map((p: any) => <CarteInfo key={p.id} p={p} />)}
        </div>
      )}
    </>
  )
}
