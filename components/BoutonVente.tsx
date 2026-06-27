'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShoppingBag } from 'lucide-react'

interface Props {
  produitId: string
  produitNom: string
  prixSouhaite: number
  prixRevient: number
  quantiteDisponible: number
  revendeurs: any[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function BoutonVente({ produitId, produitNom, prixSouhaite, prixRevient, quantiteDisponible, revendeurs }: Props) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    prix_vente_reel: prixSouhaite.toString(),
    canal: 'direct',
    revendeur_id: '',
    quantite_vendue: '1',
    notes: '',
  })

  const rev = revendeurs.find(r => r.id === form.revendeur_id)
  const prixReel = parseFloat(form.prix_vente_reel) || 0
  const qteVendue = parseInt(form.quantite_vendue) || 1

  let commission = 0
  if (form.canal === 'revendeur' && rev) {
    commission = rev.commission_type === 'pourcentage'
      ? prixReel * rev.commission_valeur / 100
      : rev.commission_valeur
  }
  // Marge nette réelle = prix de vente - commission - prix de revient
  const margeNette = prixReel - commission - prixRevient

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

      // 1. Enregistrer la vente
      const { error: errVente } = await supabase.from('ventes').insert({
        produit_id: produitId,
        quantite_vendue: qteVendue,
        prix_vente_reel: prixReel,
        canal: form.canal,
        revendeur_id: form.canal === 'revendeur' ? form.revendeur_id || null : null,
        marge_nette: margeAEnregistrer,
        date_vente: new Date().toISOString(),
        notes: form.notes.trim() || null,
      })
      if (errVente) throw new Error(errVente.message || errVente.details || 'Erreur enregistrement vente')

      // 2. Décrémenter la quantité en stock
      const nouvelleQuantite = quantiteDisponible - qteVendue
      const { error: errProduit } = await supabase
        .from('produits')
        .update({
          quantite: nouvelleQuantite,
          etat: nouvelleQuantite <= 0 ? 'vendu' : 'disponible',
        })
        .eq('id', produitId)
      if (errProduit) throw new Error(errProduit.message || errProduit.details || 'Erreur mise à jour stock')

      setOuvert(false)
      router.refresh()
    } catch (err: any) {
      const msg = err?.message || err?.details || JSON.stringify(err) || 'Erreur inconnue'
      setErreur(msg)
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Prix de vente réel (€)</label>
            <input className="form-input" type="number" step="0.01" min="0"
              value={form.prix_vente_reel} onChange={e => setForm(f => ({ ...f, prix_vente_reel: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantité vendue (stock : {quantiteDisponible})</label>
            <input className="form-input" type="number" min="1" max={quantiteDisponible} step="1"
              value={form.quantite_vendue} onChange={e => setForm(f => ({ ...f, quantite_vendue: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Canal de vente</label>
          <select className="form-input" value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value, revendeur_id: '' }))}>
            <option value="direct">Vente directe</option>
            <option value="revendeur">Via un revendeur</option>
          </select>
        </div>

        {form.canal === 'revendeur' && revendeurs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Revendeur</label>
            <select className="form-input" value={form.revendeur_id} onChange={e => setForm(f => ({ ...f, revendeur_id: e.target.value }))}>
              <option value="">Choisir un revendeur...</option>
              {revendeurs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nom} ({r.commission_type === 'pourcentage' ? `${r.commission_valeur}%` : euro(r.commission_valeur)})
                </option>
              ))}
            </select>
          </div>
        )}

        {prixReel > 0 && (
          <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Prix de revient : <strong>{euro(prixRevient)}</strong></div>
            {form.canal === 'revendeur' && commission > 0 && (
              <div>Commission : <strong>{euro(commission)}</strong></div>
            )}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
              Marge nette : <strong style={{ color: margeNette >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 'var(--text-base)' }}>{euro(margeNette)}</strong>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes (facultatif)</label>
          <input className="form-input" type="text" placeholder="Ex : vendu au marché de Noël"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {erreur && (
          <div style={{
            background: 'var(--color-danger-light)',
            border: '2px solid var(--color-danger)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-4)',
            color: 'var(--color-danger)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
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
