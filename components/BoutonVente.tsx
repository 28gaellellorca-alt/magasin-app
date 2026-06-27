'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShoppingBag } from 'lucide-react'

interface Props {
  produitId: string
  produitNom: string
  prixSouhaite: number
  revendeurs: any[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function BoutonVente({ produitId, produitNom, prixSouhaite, revendeurs }: Props) {
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
  let commission = 0
  if (form.canal === 'revendeur' && rev) {
    commission = rev.commission_type === 'pourcentage'
      ? prixReel * rev.commission_valeur / 100
      : rev.commission_valeur
  }
  const margeNette = prixReel - commission

  async function enregistrerVente(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    try {
      const { error } = await supabase.from('ventes').insert({
        produit_id: produitId,
        quantite_vendue: parseInt(form.quantite_vendue) || 1,
        prix_vente_reel: prixReel,
        canal: form.canal,
        revendeur_id: form.canal === 'revendeur' ? form.revendeur_id || null : null,
        marge_nette: margeNette,
        date_vente: new Date().toISOString(),
        notes: form.notes.trim() || null,
      })
      if (error) throw new Error(error.message)

      await supabase.from('produits').update({ etat: 'vendu' }).eq('id', produitId)

      setOuvert(false)
      router.refresh()
    } catch (err: any) {
      setErreur(err.message)
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
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Enregistrer la vente de : {produitNom}</h3>
      <form onSubmit={enregistrerVente} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Prix de vente réel (€)</label>
            <input className="form-input" type="number" step="0.01" min="0"
              value={form.prix_vente_reel} onChange={e => setForm(f => ({ ...f, prix_vente_reel: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantité vendue</label>
            <input className="form-input" type="number" min="1" step="1"
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
          <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {form.canal === 'revendeur' && commission > 0 && (
              <div>Commission : <strong>{euro(commission)}</strong></div>
            )}
            <div>Marge nette : <strong style={{ color: margeNette >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{euro(margeNette)}</strong></div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes (facultatif)</label>
          <input className="form-input" type="text" placeholder="Ex : vendu sur Vinted"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {erreur && <p className="form-error">{erreur}</p>}

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
