'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, CreditCard, Banknote } from 'lucide-react'

interface Props {
  produitId: string
  produitNom: string
  photoUrl: string | null
  prixSouhaite: number
  prixRevient: number
  quantiteDisponible: number
  revendeurs: any[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function BoutonVente({ produitId, produitNom, photoUrl, prixSouhaite, prixRevient, quantiteDisponible, revendeurs }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    prix_vente_reel: (prixSouhaite || 0).toFixed(2),
    canal: 'direct',
    revendeur_id: '',
    quantite_vendue: '1',
    remise: '',
    ajustement_type: 'reduction' as 'reduction' | 'augmentation',
    ajustement_unite: 'pct' as 'pct' | 'eur',
    ajustement_valeur: '',
    mode_paiement: 'especes',
    acheteur: '',
    notes: '',
  })

  const rev = revendeurs.find(r => r.id === form.revendeur_id)
  const prixUnitaire = parseFloat(form.prix_vente_reel) || 0
  const qteVendue = parseInt(form.quantite_vendue) || 1
  const remisePct = parseFloat(form.remise) || 0
  const prixTotal = prixUnitaire * qteVendue

  let commission = 0
  if (form.canal === 'revendeur' && rev) {
    if (rev.commission_type === 'pourcentage') commission = prixUnitaire * rev.commission_valeur / 100
    else if (rev.commission_type === 'fixe') commission = rev.commission_valeur
    // 'entree' : frais global par événement, pas par article → commission = 0 ici
  }
  const margeNette = prixUnitaire - commission - prixRevient

  function calculerPrix(valeur: number, type: 'reduction' | 'augmentation', unite: 'pct' | 'eur') {
    if (valeur <= 0) return prixSouhaite
    if (type === 'reduction') {
      return unite === 'pct' ? prixSouhaite * (1 - valeur / 100) : prixSouhaite - valeur
    } else {
      return unite === 'pct' ? prixSouhaite * (1 + valeur / 100) : prixSouhaite + valeur
    }
  }

  function handleAjustementValeur(val: string) {
    const valeur = parseFloat(val) || 0
    const prix = calculerPrix(valeur, form.ajustement_type, form.ajustement_unite)
    const remise = form.ajustement_type === 'reduction' && form.ajustement_unite === 'pct' ? val : ''
    setForm(f => ({ ...f, ajustement_valeur: val, prix_vente_reel: Math.max(0, prix).toFixed(2), remise }))
  }

  function handleAjustementType(type: 'reduction' | 'augmentation') {
    const valeur = parseFloat(form.ajustement_valeur) || 0
    const prix = calculerPrix(valeur, type, form.ajustement_unite)
    const remise = type === 'reduction' && form.ajustement_unite === 'pct' ? form.ajustement_valeur : ''
    setForm(f => ({ ...f, ajustement_type: type, prix_vente_reel: Math.max(0, prix).toFixed(2), remise }))
  }

  function handleAjustementUnite(unite: 'pct' | 'eur') {
    setForm(f => ({ ...f, ajustement_unite: unite, ajustement_valeur: '', remise: '', prix_vente_reel: (prixSouhaite || 0).toFixed(2) }))
  }

  function handlePrix(val: string) {
    setForm(f => ({ ...f, prix_vente_reel: val, remise: '', ajustement_valeur: '' }))
  }

  async function enregistrerVente(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')

    if (qteVendue > quantiteDisponible) {
      setErreur(`Quantité insuffisante — il reste ${quantiteDisponible} article${quantiteDisponible > 1 ? 's' : ''} en stock.`)
      return
    }

    setChargement(true)
    try {
      const margeAEnregistrer = isNaN(margeNette) ? 0 : margeNette

      const { error: errVente } = await supabase.from('ventes').insert({
        produit_id: produitId,
        quantite_vendue: qteVendue,
        prix_vente_reel: prixUnitaire,
        canal: form.canal,
        revendeur_id: form.canal === 'revendeur' ? form.revendeur_id || null : null,
        marge_nette: margeAEnregistrer,
        photo_url: photoUrl || null,
        mode_paiement: form.mode_paiement,
        remise: remisePct || null,
        acheteur: form.acheteur.trim() || null,
        date_vente: new Date().toISOString(),
        notes: form.notes.trim() || null,
      })
      if (errVente) throw new Error(errVente.message || errVente.details || 'Erreur enregistrement vente')

      const nouvelleQuantite = quantiteDisponible - qteVendue
      const { error: errProduit } = await supabase
        .from('produits')
        .update({
          quantite: nouvelleQuantite,
          etat: nouvelleQuantite <= 0 ? 'vendu' : 'disponible',
          ...(nouvelleQuantite <= 0 ? { lieu_depot_id: null } : {}),
        })
        .eq('id', produitId)
      if (errProduit) throw new Error(errProduit.message || errProduit.details || 'Erreur mise à jour stock')

      window.location.reload()
    } catch (err: any) {
      setErreur(err?.message || 'Erreur inconnue')
      console.error('Erreur vente:', err)
    } finally {
      setChargement(false)
    }
  }

  if (!ouvert) {
    return (
      <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => setOuvert(true)}>
        <ShoppingBag size={18} /> Enregistrer une vente
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
        Enregistrer la vente — {produitNom}
      </h3>

      <form onSubmit={enregistrerVente} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Prix et quantité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Prix par article (€)</label>
            <input className="form-input" type="number" step="0.01" min="0"
              value={form.prix_vente_reel}
              onChange={e => handlePrix(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantité (stock : {quantiteDisponible})</label>
            <input className="form-input" type="number" min="1" max={quantiteDisponible} step="1"
              value={form.quantite_vendue}
              onChange={e => setForm(f => ({ ...f, quantite_vendue: e.target.value }))} />
          </div>
        </div>

        {/* Ajustement de prix */}
        <div className="form-group">
          <label className="form-label">Ajustement de prix (optionnel)</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            {(['reduction', 'augmentation'] as const).map(type => (
              <button key={type} type="button"
                onClick={() => handleAjustementType(type)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius)',
                  border: `2px solid ${form.ajustement_type === type ? (type === 'reduction' ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-border)'}`,
                  background: form.ajustement_type === type ? (type === 'reduction' ? 'var(--color-warning-light)' : 'var(--color-success-light)') : 'var(--color-surface)',
                  color: form.ajustement_type === type ? (type === 'reduction' ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-text-secondary)',
                  fontWeight: form.ajustement_type === type ? 600 : 400,
                  cursor: 'pointer', fontSize: 'var(--text-sm)',
                }}>
                {type === 'reduction' ? 'Réduction' : 'Augmentation'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input className="form-input" type="number" min="0" step="1" placeholder="0"
              value={form.ajustement_valeur}
              onChange={e => handleAjustementValeur(e.target.value)}
              style={{ maxWidth: 90 }} />
            {(['pct', 'eur'] as const).map(unite => (
              <button key={unite} type="button"
                onClick={() => handleAjustementUnite(unite)}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius)',
                  border: `2px solid ${form.ajustement_unite === unite ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: form.ajustement_unite === unite ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: form.ajustement_unite === unite ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                  fontWeight: form.ajustement_unite === unite ? 600 : 400,
                  cursor: 'pointer', fontSize: 'var(--text-sm)',
                  minWidth: 44, minHeight: 44,
                }}>
                {unite === 'pct' ? '%' : '€'}
              </button>
            ))}
            {parseFloat(form.ajustement_valeur) > 0 && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {form.ajustement_type === 'reduction' ? 'Réduit' : 'Majoré'} à <strong>{euro(prixUnitaire)}</strong> au lieu de {euro(prixSouhaite)}
              </span>
            )}
          </div>
        </div>

        {/* Récapitulatif prix */}
        {prixUnitaire > 0 && (
          <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {qteVendue > 1 && (
              <div style={{ color: 'var(--color-text-secondary)' }}>
                {qteVendue} × {euro(prixUnitaire)} = <strong>{euro(prixTotal)}</strong>
              </div>
            )}
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Prix de revient : <strong>{euro(prixRevient)}</strong>
            </div>
            {form.canal === 'revendeur' && rev?.commission_type === 'entree' && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                Frais d'entrée {euro(rev.commission_valeur)} — déduit du bilan global, pas par article
              </div>
            )}
            {form.canal === 'revendeur' && commission > 0 && (
              <div style={{ color: 'var(--color-text-secondary)' }}>Commission : <strong>{euro(commission)}</strong></div>
            )}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
              Marge par article : <strong style={{ color: margeNette >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 'var(--text-base)' }}>{euro(margeNette)}</strong>
              {qteVendue > 1 && (
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>
                  / Total marge : <strong>{euro(margeNette * qteVendue)}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mode de paiement */}
        <div className="form-group">
          <label className="form-label">Mode de paiement</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[
              { val: 'especes', label: 'Espèces', icon: <Banknote size={16} /> },
              { val: 'carte', label: 'Carte', icon: <CreditCard size={16} /> },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setForm(f => ({ ...f, mode_paiement: opt.val }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 'var(--radius)',
                  border: `2px solid ${form.mode_paiement === opt.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: form.mode_paiement === opt.val ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: form.mode_paiement === opt.val ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                  fontWeight: form.mode_paiement === opt.val ? 600 : 400,
                  cursor: 'pointer', fontSize: 'var(--text-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canal */}
        <div className="form-group">
          <label className="form-label">Canal de vente</label>
          <select className="form-input" value={form.canal}
            onChange={e => setForm(f => ({ ...f, canal: e.target.value, revendeur_id: '' }))}>
            <option value="direct">Vente directe</option>
            <option value="revendeur">Via un lieu de vente</option>
          </select>
        </div>

        {form.canal === 'revendeur' && revendeurs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Lieu de vente</label>
            <select className="form-input" value={form.revendeur_id}
              onChange={e => {
                const lieu = revendeurs.find(r => r.id === e.target.value)
                const remise = lieu?.remise_defaut || 0
                setForm(f => ({
                  ...f,
                  revendeur_id: e.target.value,
                  ...(remise > 0 ? {
                    remise: remise.toString(),
                    ajustement_type: 'reduction' as const,
                    ajustement_unite: 'pct' as const,
                    ajustement_valeur: remise.toString(),
                    prix_vente_reel: (prixSouhaite * (1 - remise / 100)).toFixed(2),
                  } : {}),
                }))
              }}>
              <option value="">Choisir un lieu...</option>
              {revendeurs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nom}{r.commission_type === 'pourcentage' ? ` (${r.commission_valeur}%)` : r.commission_type === 'entree' ? ` (${euro(r.commission_valeur)} entrée)` : ` (${euro(r.commission_valeur)}/article)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Acheteur + Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Acheteur (facultatif)</label>
            <input className="form-input" type="text" placeholder="Ex : Marie"
              value={form.acheteur} onChange={e => setForm(f => ({ ...f, acheteur: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (facultatif)</label>
            <input className="form-input" type="text" placeholder="Ex : marché de Noël"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        {erreur && (
          <div style={{
            background: 'var(--color-danger-light)', border: '2px solid var(--color-danger)',
            borderRadius: 'var(--radius)', padding: 'var(--space-4)',
            color: 'var(--color-danger)', fontWeight: 600, fontSize: 'var(--text-sm)',
          }}>
            Erreur : {erreur}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="submit" className="btn btn-accent" disabled={chargement} style={{ flex: 1 }}>
            {chargement ? 'Enregistrement...' : 'Confirmer la vente'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setOuvert(false)}>Annuler</button>
        </div>
      </form>
    </div>
  )
}
