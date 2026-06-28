'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, Plus, X, Check, Eye, RefreshCw, ShoppingBag, MapPin, Pencil } from 'lucide-react'

function calculerPrixAjuste(prixBase: number, remise_defaut: number, type: string): number {
  if (!remise_defaut) return prixBase
  const val = Math.abs(remise_defaut)
  if (type === 'euro') return remise_defaut > 0 ? Math.max(0, prixBase - val) : prixBase + val
  return remise_defaut > 0 ? prixBase * (1 - val / 100) : prixBase * (1 + val / 100)
}

function calculerCommissionParUnite(lieu: any, prixVente: number): number {
  if (lieu.commission_type === 'pourcentage') return prixVente * (lieu.commission_valeur / 100)
  if (lieu.commission_type === 'fixe') return lieu.commission_valeur
  return 0 // 'entree' = frais global, pas déduit par article
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface Props {
  lieu: any
  produits: any[]
  prixLieu: { produit_id: string; prix_vente: number }[]
}

type FormVente = { prix: string; qte: string; mode: 'especes' | 'carte' }

// Défini HORS du composant parent pour éviter le re-mount
function MiniFormVente({ f, setF, onValider, onAnnuler, chargement, maxQte }: {
  f: FormVente
  setF: (fn: (prev: FormVente) => FormVente) => void
  onValider: () => void
  onAnnuler: () => void
  chargement: boolean
  maxQte: number
}) {
  return (
    <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 'var(--space-2)' }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11 }}>Prix de vente (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={f.prix}
            onChange={e => setF(p => ({ ...p, prix: e.target.value }))} style={{ minHeight: 36 }} />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11 }}>Qté</label>
          <input className="form-input" type="number" min="1" max={maxQte} value={f.qte}
            onChange={e => setF(p => ({ ...p, qte: e.target.value }))} style={{ minHeight: 36 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {(['especes', 'carte'] as const).map(m => (
          <button key={m} type="button"
            onClick={() => setF(p => ({ ...p, mode: m }))}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 'var(--text-xs)',
              border: `2px solid ${f.mode === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: f.mode === m ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: f.mode === m ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
              fontWeight: f.mode === m ? 600 : 400,
            }}>
            {m === 'especes' ? 'Espèces' : 'Carte'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary" style={{ flex: 1, minHeight: 36, fontSize: 'var(--text-sm)' }}
          onClick={onValider} disabled={chargement || !f.prix}>
          <Check size={14} /> {chargement ? 'En cours…' : 'Confirmer la vente'}
        </button>
        <button className="btn btn-secondary" style={{ minHeight: 36 }} onClick={onAnnuler}><X size={14} /></button>
      </div>
    </div>
  )
}

export default function GestionCatalogueLieu({ lieu, produits, prixLieu: initPrix }: Props) {
  const [prixLieu, setPrixLieu] = useState<{ produit_id: string; prix_vente: number }[]>(initPrix)
  const [ajoutEnCours, setAjoutEnCours] = useState<Record<string, string>>({})
  const [sauvegarde, setSauvegarde] = useState<Record<string, boolean>>({})
  const [recherche, setRecherche] = useState('')
  const [recalcul, setRecalcul] = useState(false)
  const [venteOuverte, setVenteOuverte] = useState<string | null>(null)
  const [formVente, setFormVente] = useState<FormVente>({ prix: '', qte: '1', mode: 'especes' })
  const [chargementVente, setChargementVente] = useState(false)
  const [editPrixId, setEditPrixId] = useState<string | null>(null)
  const [editPrixVal, setEditPrixVal] = useState('')

  async function enregistrerPrix(produitId: string) {
    const val = parseFloat(editPrixVal)
    if (isNaN(val) || val <= 0) return
    await supabase.from('prix_lieu').upsert(
      { produit_id: produitId, revendeur_id: lieu.id, prix_vente: val },
      { onConflict: 'produit_id,revendeur_id' }
    )
    setPrixLieu(prev => [...prev.filter(pl => pl.produit_id !== produitId), { produit_id: produitId, prix_vente: val }])
    setEditPrixId(null)
  }

  const aAjustement = !!lieu.remise_defaut
  const ajustLabel = aAjustement
    ? `${lieu.remise_defaut > 0 ? 'Remise' : 'Augmentation'} auto de ${Math.abs(lieu.remise_defaut)}${lieu.remise_defaut_type === 'euro' ? '€' : '%'}`
    : null

  function getPrix(produitId: string) {
    return prixLieu.find(pl => pl.produit_id === produitId)?.prix_vente
  }

  function prixSuggere(p: any): number {
    return parseFloat(calculerPrixAjuste(p.prix_vente_souhaite, lieu.remise_defaut || 0, lieu.remise_defaut_type || 'pct').toFixed(2))
  }

  // Produits en dépôt ici
  const enDepotIci = produits.filter(p => p.lieu_depot_id === lieu.id && p.quantite_en_depot > 0)

  // Produits dans le catalogue (avec prix_lieu) mais PAS en dépôt ici
  const dansCatalogue = produits.filter(p =>
    prixLieu.some(pl => pl.produit_id === p.id) && p.lieu_depot_id !== lieu.id
  )

  // Produits ni en dépôt, ni dans le catalogue
  const horsCatalogue = produits.filter(p =>
    !prixLieu.some(pl => pl.produit_id === p.id) &&
    p.lieu_depot_id !== lieu.id &&
    p.etat !== 'vendu' &&
    (recherche === '' || p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.categorie?.nom?.toLowerCase().includes(recherche.toLowerCase()))
  )

  async function recalculerTout() {
    if (!aAjustement) return
    setRecalcul(true)
    const cibles = [...enDepotIci, ...dansCatalogue]
    const nouveauxPrix = cibles.map(p => ({
      produit_id: p.id,
      revendeur_id: lieu.id,
      prix_vente: prixSuggere(p),
    }))
    await supabase.from('prix_lieu').upsert(nouveauxPrix, { onConflict: 'produit_id,revendeur_id' })
    setPrixLieu(prev => {
      const autres = prev.filter(pl => !nouveauxPrix.some(n => n.produit_id === pl.produit_id))
      return [...autres, ...nouveauxPrix.map(n => ({ produit_id: n.produit_id, prix_vente: n.prix_vente }))]
    })
    setRecalcul(false)
  }

  async function ajouterAuCatalogue(produitId: string) {
    const val = parseFloat(ajoutEnCours[produitId] || '')
    if (isNaN(val) || val <= 0) return
    await supabase.from('prix_lieu').upsert(
      { produit_id: produitId, revendeur_id: lieu.id, prix_vente: val },
      { onConflict: 'produit_id,revendeur_id' }
    )
    setPrixLieu(prev => [...prev.filter(pl => pl.produit_id !== produitId), { produit_id: produitId, prix_vente: val }])
    setAjoutEnCours(prev => { const n = { ...prev }; delete n[produitId]; return n })
    setSauvegarde(prev => ({ ...prev, [produitId]: true }))
    setTimeout(() => setSauvegarde(prev => ({ ...prev, [produitId]: false })), 2000)
  }

  async function retirerDuCatalogue(produitId: string) {
    await supabase.from('prix_lieu').delete().eq('produit_id', produitId).eq('revendeur_id', lieu.id)
    setPrixLieu(prev => prev.filter(pl => pl.produit_id !== produitId))
  }

  function ouvrirVente(p: any) {
    const prix = getPrix(p.id) ?? prixSuggere(p)
    setFormVente({ prix: prix.toFixed(2), qte: '1', mode: 'especes' })
    setVenteOuverte(p.id)
  }

  async function confirmerVente(produit: any) {
    const prixVal = parseFloat(formVente.prix)
    const qteVal = parseInt(formVente.qte) || 1
    if (!prixVal || prixVal <= 0 || qteVal <= 0) return
    setChargementVente(true)

    const commission = calculerCommissionParUnite(lieu, prixVal)
    const margeNette = prixVal - commission - produit.prix_revient

    // S'assurer que le prix_lieu existe
    const hasPrix = !!getPrix(produit.id)

    const nouvQuantite = produit.quantite - qteVal
    const nouvDepot = Math.max(0, (produit.quantite_en_depot || 0) - qteVal)

    await Promise.all([
      supabase.from('ventes').insert({
        produit_id: produit.id,
        revendeur_id: lieu.id,
        revendeur_nom: lieu.nom,
        prix_vente_reel: prixVal,
        quantite_vendue: qteVal,
        mode_paiement: formVente.mode,
        canal: 'revendeur',
        photo_url: produit.photo_url || null,
        marge_nette: margeNette,
        date_vente: new Date().toISOString(),
        remise: 0,
      }),
      supabase.from('produits').update({
        quantite: nouvQuantite,
        quantite_en_depot: nouvDepot,
        etat: nouvQuantite <= 0 ? 'vendu' : 'disponible',
        lieu_depot_id: nouvDepot <= 0 ? null : produit.lieu_depot_id,
      }).eq('id', produit.id),
      ...(!hasPrix ? [supabase.from('prix_lieu').upsert(
        { produit_id: produit.id, revendeur_id: lieu.id, prix_vente: prixVal },
        { onConflict: 'produit_id,revendeur_id' }
      )] : []),
    ])

    setChargementVente(false)
    setVenteOuverte(null)
    window.location.reload()
  }

  const totalEnDepot = enDepotIci.reduce((s, p) => s + (p.quantite_en_depot || 0), 0)

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: ajustLabel ? 'var(--space-3)' : 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          {enDepotIci.length + dansCatalogue.length} article{enDepotIci.length + dansCatalogue.length > 1 ? 's' : ''} dans ce catalogue
          {totalEnDepot > 0 && ` · ${totalEnDepot} en dépôt ici`}
        </p>
        <Link href={`/catalogue/${lieu.id}/apercu`} className="btn btn-accent" style={{ gap: 6 }}>
          <Eye size={16} /> Aperçu partageable
        </Link>
      </div>

      {/* Bannière ajustement */}
      {ajustLabel && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning)', fontWeight: 500 }}>{ajustLabel} configurée</span>
          {(enDepotIci.length + dansCatalogue.length) > 0 && (
            <button className="btn btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: 32, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={recalculerTout} disabled={recalcul}>
              <RefreshCw size={13} /> {recalcul ? 'Calcul…' : 'Recalculer tous les prix'}
            </button>
          )}
        </div>
      )}

      {/* Produits EN DÉPÔT ICI */}
      {enDepotIci.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="var(--color-warning)" strokeWidth={1.8} />
            En dépôt ici
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {enDepotIci.map(p => {
              const prix = getPrix(p.id) ?? prixSuggere(p)
              const marge = prix - calculerCommissionParUnite(lieu, prix) - p.prix_revient
              const hasPrix = !!getPrix(p.id)
              return (
                <div key={p.id} className="card" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {p.photo_url ? (
                      <Image src={p.photo_url} alt={p.nom} width={56} height={56}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, background: 'var(--color-warning-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={22} color="var(--color-warning)" strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{p.nom}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {p.categorie?.nom} · <strong style={{ color: 'var(--color-warning)' }}>{p.quantite_en_depot} ici</strong>
                        {p.quantite - p.quantite_en_depot > 0 && ` · ${p.quantite - p.quantite_en_depot} chez toi`}
                      </div>
                      {!hasPrix && aAjustement && (
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>prix calculé automatiquement</div>
                      )}
                    </div>
                    {editPrixId === p.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                        <input className="form-input" type="number" step="0.01" min="0" autoFocus
                          value={editPrixVal} onChange={e => setEditPrixVal(e.target.value)}
                          style={{ width: 80, minHeight: 32 }} />
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }} onClick={() => enregistrerPrix(p.id)}><Check size={16} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setEditPrixId(null)}><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{euro(prix)}</span>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}
                            title="Modifier le prix pour ce lieu"
                            onClick={() => { setEditPrixId(p.id); setEditPrixVal(prix.toFixed(2)) }}>
                            <Pencil size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          marge {euro(marge)}
                        </div>
                      </div>
                    )}
                    <button
                      className="btn btn-primary"
                      style={{ minHeight: 36, padding: '6px 12px', fontSize: 'var(--text-xs)', gap: 4, flexShrink: 0 }}
                      onClick={() => venteOuverte === p.id ? setVenteOuverte(null) : ouvrirVente(p)}
                    >
                      <ShoppingBag size={14} /> Vendre
                    </button>
                  </div>
                  {venteOuverte === p.id && (
                    <MiniFormVente
                      f={formVente} setF={setFormVente}
                      onValider={() => confirmerVente(p)}
                      onAnnuler={() => setVenteOuverte(null)}
                      chargement={chargementVente}
                      maxQte={p.quantite_en_depot}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Produits dans le catalogue (sans dépôt ici) */}
      {dansCatalogue.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Dans le catalogue
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {dansCatalogue.map(p => {
              const prix = getPrix(p.id)!
              const marge = prix - calculerCommissionParUnite(lieu, prix) - p.prix_revient
              return (
                <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
                        {p.categorie?.nom} · Stock : {p.quantite}
                      </div>
                    </div>
                    {editPrixId === p.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                        <input className="form-input" type="number" step="0.01" min="0" autoFocus
                          value={editPrixVal} onChange={e => setEditPrixVal(e.target.value)}
                          style={{ width: 80, minHeight: 32 }} />
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }} onClick={() => enregistrerPrix(p.id)}><Check size={16} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setEditPrixId(null)}><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{euro(prix)}</span>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}
                            title="Modifier le prix pour ce lieu"
                            onClick={() => { setEditPrixId(p.id); setEditPrixVal(prix.toFixed(2)) }}>
                            <Pencil size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          marge {euro(marge)}
                        </div>
                      </div>
                    )}
                    <button
                      className="btn btn-primary"
                      style={{ minHeight: 36, padding: '6px 12px', fontSize: 'var(--text-xs)', gap: 4, flexShrink: 0 }}
                      onClick={() => venteOuverte === p.id ? setVenteOuverte(null) : ouvrirVente(p)}
                    >
                      <ShoppingBag size={14} /> Vendre
                    </button>
                    {sauvegarde[p.id] ? (
                      <Check size={18} color="var(--color-success)" />
                    ) : (
                      <button onClick={() => retirerDuCatalogue(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', flexShrink: 0 }}
                        title="Retirer du catalogue">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {venteOuverte === p.id && (
                    <MiniFormVente
                      f={formVente} setF={setFormVente}
                      onValider={() => confirmerVente(p)}
                      onAnnuler={() => setVenteOuverte(null)}
                      chargement={chargementVente}
                      maxQte={p.quantite}
                    />
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
          Ajouter des articles au catalogue
        </h2>
        <input className="form-input" placeholder="Rechercher un article…" value={recherche}
          onChange={e => setRecherche(e.target.value)} style={{ marginBottom: 'var(--space-3)' }} />
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
                  <input className="form-input" type="number" step="0.01" min="0"
                    placeholder={aAjustement ? prixSuggere(p).toFixed(2) : p.prix_vente_souhaite.toFixed(2)}
                    value={ajoutEnCours[p.id] || ''}
                    onChange={e => setAjoutEnCours(prev => ({ ...prev, [p.id]: e.target.value }))}
                    style={{ width: 90 }} />
                  <button className="btn btn-primary"
                    style={{ fontSize: 'var(--text-xs)', minHeight: 36, padding: '4px 12px' }}
                    onClick={() => ajouterAuCatalogue(p.id)}
                    disabled={!ajoutEnCours[p.id]}>
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
