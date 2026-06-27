'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronDown, ChevronUp, Search, X } from 'lucide-react'

interface Props {
  produits: any[]
  categories: any[]
  revendeurs: any[]
  prixLieu: { produit_id: string; revendeur_id: string; prix_vente: number }[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function CarteInfo({ p, prixLieu }: { p: any; prixLieu?: number }) {
  const [ouvert, setOuvert] = useState(false)
  const prixAffiché = prixLieu ?? p.prix_vente_souhaite
  const marge = prixAffiché - p.prix_revient
  const margePct = p.prix_revient > 0 ? Math.round((marge / p.prix_revient) * 100) : 0

  return (
    <div className="card">
      <Link href={`/produits/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {p.photo_url ? (
          <Image src={p.photo_url} alt={p.nom} width={300} height={225} className="card-image" />
        ) : (
          <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-light)' }}>
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
          <div>
            <span className="card-price">{euro(prixAffiché)}</span>
            {prixLieu !== undefined && (
              <div style={{ fontSize: 10, color: 'var(--color-warning)', fontWeight: 500, marginTop: 1 }}>Prix lieu de vente</div>
            )}
            {prixLieu === undefined && (
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>Prix normal</div>
            )}
          </div>
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

export default function CartesProduits({ produits, categories, revendeurs, prixLieu }: Props) {
  const [catFiltre, setCatFiltre] = useState('')
  const [etatFiltre, setEtatFiltre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [lieuVue, setLieuVue] = useState('')

  const termes = recherche.toLowerCase().trim().split(/\s+/).filter(Boolean)

  const filtres = produits.filter(p => {
    if (catFiltre && p.categorie_id !== catFiltre) return false
    if (etatFiltre && p.etat !== etatFiltre) return false
    if (termes.length > 0) {
      const texte = [p.nom, p.categorie?.nom, p.sous_categorie?.nom, p.notes].filter(Boolean).join(' ').toLowerCase()
      if (!termes.every(t => texte.includes(t))) return false
    }
    return true
  })

  function getPrixPourLieu(produitId: string): number | undefined {
    if (!lieuVue) return undefined
    const entree = prixLieu.find(pl => pl.produit_id === produitId && pl.revendeur_id === lieuVue)
    return entree?.prix_vente
  }

  const lieuActif = revendeurs.find((r: any) => r.id === lieuVue)

  return (
    <>
      {/* Sélecteur de vue par lieu */}
      {revendeurs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)', padding: 'var(--space-3)',
          background: lieuVue ? 'var(--color-warning-light)' : 'var(--color-surface)',
          border: `1px solid ${lieuVue ? 'var(--color-warning)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius)', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Voir les prix pour :
          </span>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: 180, minHeight: 36 }}
            value={lieuVue}
            onChange={e => setLieuVue(e.target.value)}
          >
            <option value="">Affichage normal</option>
            {revendeurs.map((r: any) => (
              <option key={r.id} value={r.id}>{r.nom}</option>
            ))}
          </select>
          {lieuVue && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontStyle: 'italic' }}>
              Les prix spécifiques à {lieuActif?.nom} sont mis en avant
            </span>
          )}
        </div>
      )}

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          className="form-input"
          type="text"
          placeholder="Rechercher un article (nom, catégorie, notes…)"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ paddingLeft: 40, paddingRight: recherche ? 40 : 14 }}
        />
        {recherche && (
          <button
            onClick={() => setRecherche('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
            aria-label="Effacer la recherche"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtres catégorie + état */}
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
        {(recherche || catFiltre || etatFiltre) && (
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {filtres.length} résultat{filtres.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {filtres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <Package size={48} strokeWidth={1} style={{ margin: '0 auto var(--space-4)' }} />
          <p>{recherche ? `Aucun article pour "${recherche}".` : 'Aucun article trouvé.'}</p>
          {!recherche && (
            <Link href="/ajouter" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              Ajouter un article
            </Link>
          )}
        </div>
      ) : (
        <div className="grid-products">
          {filtres.map((p: any) => (
            <CarteInfo key={p.id} p={p} prixLieu={getPrixPourLieu(p.id)} />
          ))}
        </div>
      )}
    </>
  )
}
