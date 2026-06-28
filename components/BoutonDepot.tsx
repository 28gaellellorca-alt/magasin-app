'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin } from 'lucide-react'

interface Props {
  produitId: string
  prixVenteSouhaite: number
  quantiteDisponible: number
  lieuDepot: { id: string; nom: string } | null
  quantiteEnDepot: number
  revendeurs: any[]
}

function prixAjuste(base: number, lieu: any): number {
  const adj = lieu?.remise_defaut || 0
  if (!adj) return base
  const val = Math.abs(adj)
  if (lieu.remise_defaut_type === 'euro') return adj > 0 ? Math.max(0, base - val) : base + val
  return adj > 0 ? base * (1 - val / 100) : base * (1 + val / 100)
}

export default function BoutonDepot({ produitId, prixVenteSouhaite, quantiteDisponible, lieuDepot, quantiteEnDepot, revendeurs }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [lieuChoisi, setLieuChoisi] = useState('')
  const [qte, setQte] = useState('1')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const qteCheZtoi = quantiteDisponible - quantiteEnDepot

  async function deposer() {
    const q = parseInt(qte) || 0
    if (!lieuChoisi || q <= 0) return
    if (q > quantiteDisponible) {
      setErreur(`Tu ne peux déposer que ${quantiteDisponible} article${quantiteDisponible > 1 ? 's' : ''} au maximum.`)
      return
    }
    setChargement(true)
    setErreur('')
    const lieu = revendeurs.find((r: any) => r.id === lieuChoisi)
    const prix = parseFloat(prixAjuste(prixVenteSouhaite, lieu).toFixed(2))
    const [{ error }] = await Promise.all([
      supabase.from('produits').update({ lieu_depot_id: lieuChoisi, quantite_en_depot: q }).eq('id', produitId),
      supabase.from('prix_lieu').upsert(
        { produit_id: produitId, revendeur_id: lieuChoisi, prix_vente: prix },
        { onConflict: 'produit_id,revendeur_id' }
      ),
    ])
    if (error) { setErreur('Erreur lors du dépôt'); setChargement(false); return }
    window.location.reload()
  }

  async function retour() {
    setChargement(true)
    setErreur('')
    const { error } = await supabase.from('produits')
      .update({ lieu_depot_id: null, quantite_en_depot: 0 })
      .eq('id', produitId)
    if (error) { setErreur('Erreur lors du retour'); setChargement(false); return }
    window.location.reload()
  }

  if (lieuDepot && quantiteEnDepot > 0) {
    return (
      <div style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius)', padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <MapPin size={16} color="var(--color-warning)" />
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>
              {quantiteEnDepot} en dépôt chez {lieuDepot.nom}
            </span>
          </div>
          {qteCheZtoi > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              ({qteCheZtoi} chez toi)
            </span>
          )}
        </div>
        <button className="btn btn-secondary" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', padding: '6px 14px', minHeight: 36 }}
          onClick={retour} disabled={chargement}>
          {chargement ? 'En cours...' : 'Tout est rentré (retour de dépôt)'}
        </button>
        {erreur && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{erreur}</p>}
      </div>
    )
  }

  if (!ouvert) {
    return (
      <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setOuvert(true); setQte('1') }}>
        <MapPin size={16} /> Déposer chez un lieu de vente
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
        Déposer chez un lieu de vente
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <select className="form-input" value={lieuChoisi} onChange={e => setLieuChoisi(e.target.value)}>
          <option value="">Choisir un lieu...</option>
          {revendeurs.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <label className="form-label" style={{ whiteSpace: 'nowrap', margin: 0 }}>Qté :</label>
          <input className="form-input" type="number" min="1" max={quantiteDisponible} value={qte}
            onChange={e => setQte(e.target.value)} style={{ width: 70 }} />
        </div>
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
        Stock disponible : {quantiteDisponible} article{quantiteDisponible > 1 ? 's' : ''}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary" onClick={deposer} disabled={!lieuChoisi || chargement} style={{ flex: 1 }}>
          {chargement ? 'En cours...' : 'Confirmer le dépôt'}
        </button>
        <button className="btn btn-secondary" onClick={() => setOuvert(false)}>Annuler</button>
      </div>
      {erreur && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{erreur}</p>}
    </div>
  )
}
