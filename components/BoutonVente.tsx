'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    prix_vente_reel: prixSouhaite.toFixed(2),
    canal: 'direct',
    revendeur_id: '',
    quantite_vendue: '1',
    remise: '',
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
    commission = rev.commission_type === 'pourcentage'
      ? prixUnitaire * rev.commission_valeur / 100
      : rev.commission_valeur
  }
  const margeNette = prixUnitaire - commission - prixRevient

  function handleRemise(val: string) {
    const pct = Math.min(Math.max(parseFloat(val) || 0, 0), 100)
    const prixReduit = prixSouhaite * (1 - pct / 100)
    setForm(f => ({ ...f, remise: val, prix_vente_reel: prixReduit.toFixed(2) }))
  }

  function handlePrix(val: string) {
    // Si le prix est modifié manuellement, on efface la remise
    setForm(f => ({ ...f, prix_vente_reel: val, remise: '' }))
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
        .update({ quantite: nouvelleQuantite, etat: nouvelleQuantite <= 0 ? 'vendu' : 'disponible' })
        .eq('id', produitId)
      if (errProduit) throw new Error(errProduit.message || errProduit.details || 'Erreur mise à jour stock')

      setOuvert(false)
      router.refresh()
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

        {/* Réduction */}
        <div className="form-group">
          <label className="form-label">Réduction (% — optionnel)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input className="form-input" type="number" min="0" max="100" step="1" placeholder="0"
              value={form.remise}
              onChange={e => handleRemise(e.target.value)}
              style={{ maxWidth: 100 }} />
            {remisePct > 0 && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Prix réduit : <strong>{euro(prixUnitaire)}</strong> au lieu de {euro(prixSouhaite)}
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
            <option value="revendeur">Via un revendeur</option>
          </select>
        </div>

        {form.canal === 'revendeur' && revendeurs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Revendeur</label>
            <select className="form-input" value={form.revendeur_id}
              onChange={e => setForm(f => ({ ...f, revendeur_id: e.target.value }))}>
              <option value="">Choisir un revendeur...</option>
              {revendeurs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nom} ({r.commission_type === 'pourcentage' ? `${r.commission_valeur}%` : euro(r.commission_valeur)})
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
