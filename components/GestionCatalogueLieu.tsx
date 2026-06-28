'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, Plus, X, Check, Eye } from 'lucide-react'

interface Props {
  lieu: any
  produits: any[]
  prixLieu: { produit_id: string; prix_vente: number }[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function GestionCatalogueLieu({ lieu, produits, prixLieu: initPrix }: Props) {
  const [prixLieu, setPrixLieu] = useState<{ produit_id: string; prix_vente: number }[]>(initPrix)
  const [ajoutEnCours, setAjoutEnCours] = useState<Record<string, string>>({})
  const [sauvegarde, setSauvegarde] = useState<Record<string, boolean>>({})
  const [recherche, setRecherche] = useState('')

  const dansCatalogue = produits.filter(p => prixLieu.some(pl => pl.produit_id === p.id))
  const horsCatalogue = produits.filter(p =>
    !prixLieu.some(pl => pl.produit_id === p.id) &&
    p.etat !== 'vendu' &&
    (recherche === '' || p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.categorie?.nom?.toLowerCase().includes(recherche.toLowerCase()))
  )

  function getPrix(produitId: string) {
    return prixLieu.find(pl => pl.produit_id === produitId)?.prix_vente
  }

  async function ajouterAuCatalogue(produitId: string) {
    const val = parseFloat(ajoutEnCours[produitId] || '')
    if (isNaN(val) || val <= 0) return
    await supabase.from('prix_lieu').upsert(
      { produit_id: produitId, revendeur_id: lieu.id, prix_vente: val },
      { onConflict: 'produit_id,revendeur_id' }
    )
    setPrixLieu(prev => {
      const sans = prev.filter(pl => pl.produit_id !== produitId)
      return [...sans, { produit_id: produitId, prix_vente: val }]
    })
    setAjoutEnCours(prev => { const n = { ...prev }; delete n[produitId]; return n })
    setSauvegarde(prev => ({ ...prev, [produitId]: true }))
    setTimeout(() => setSauvegarde(prev => ({ ...prev, [produitId]: false })), 2000)
  }

  async function retirerDuCatalogue(produitId: string) {
    await supabase.from('prix_lieu')
      .delete()
      .eq('produit_id', produitId)
      .eq('revendeur_id', lieu.id)
    setPrixLieu(prev => prev.filter(pl => pl.produit_id !== produitId))
  }

  return (
    <div>
      {/* En-tête avec lien aperçu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {dansCatalogue.length} article{dansCatalogue.length > 1 ? 's' : ''} dans ce catalogue
          </p>
        </div>
        <Link href={`/catalogue/${lieu.id}/apercu`} className="btn btn-accent" style={{ gap: 6 }}>
          <Eye size={16} /> Aperçu partageable
        </Link>
      </div>

      {/* Produits dans le catalogue */}
      {dansCatalogue.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Dans le catalogue
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {dansCatalogue.map(p => {
              const prix = getPrix(p.id)!
              const marge = prix - p.prix_revient
              return (
                <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)' }}>
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.nom} width={56} height={56}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={22} color="var(--color-primary)" strokeWidth={1.5} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{p.nom}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {p.categorie?.nom} · Qté stock : {p.quantite}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{euro(prix)}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      marge {euro(marge)}
                    </div>
                  </div>
                  {sauvegarde[p.id] ? (
                    <Check size={18} color="var(--color-success)" />
                  ) : (
                    <button
                      onClick={() => retirerDuCatalogue(p.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', flexShrink: 0 }}
                      title="Retirer du catalogue"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ajouter des produits */}
      <div>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
          Ajouter des articles
        </h2>
        <input
          className="form-input"
          placeholder="Rechercher un article…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ marginBottom: 'var(--space-3)' }}
        />
        {horsCatalogue.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {recherche ? 'Aucun résultat.' : 'Tous les articles disponibles sont déjà dans ce catalogue.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {horsCatalogue.map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)' }}>
                {p.photo_url ? (
                  <Image src={p.photo_url} alt={p.nom} width={56} height={56}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={22} color="var(--color-primary)" strokeWidth={1.5} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{p.nom}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {p.categorie?.nom} · Prix normal : {euro(p.prix_vente_souhaite)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={p.prix_vente_souhaite.toFixed(2)}
                    value={ajoutEnCours[p.id] || ''}
                    onChange={e => setAjoutEnCours(prev => ({ ...prev, [p.id]: e.target.value }))}
                    style={{ width: 90 }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 'var(--text-xs)', minHeight: 36, padding: '4px 12px' }}
                    onClick={() => ajouterAuCatalogue(p.id)}
                    disabled={!ajoutEnCours[p.id]}
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
