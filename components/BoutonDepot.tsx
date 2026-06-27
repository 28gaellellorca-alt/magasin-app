'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin } from 'lucide-react'

interface Props {
  produitId: string
  lieuDepot: { id: string; nom: string } | null
  revendeurs: any[]
}

export default function BoutonDepot({ produitId, lieuDepot, revendeurs }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [lieuChoisi, setLieuChoisi] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function deposer() {
    if (!lieuChoisi) return
    setChargement(true)
    setErreur('')
    const { error } = await supabase.from('produits').update({ lieu_depot_id: lieuChoisi }).eq('id', produitId)
    if (error) { setErreur('Erreur lors du dépôt'); setChargement(false); return }
    window.location.reload()
  }

  async function retour() {
    setChargement(true)
    setErreur('')
    const { error } = await supabase.from('produits').update({ lieu_depot_id: null }).eq('id', produitId)
    if (error) { setErreur('Erreur lors du retour'); setChargement(false); return }
    window.location.reload()
  }

  if (lieuDepot) {
    return (
      <div style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius)', padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MapPin size={16} color="var(--color-warning)" />
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>
            En dépôt chez {lieuDepot.nom}
          </span>
        </div>
        <button className="btn btn-secondary" style={{ fontSize: 'var(--text-sm)', padding: '6px 14px', minHeight: 36 }}
          onClick={retour} disabled={chargement}>
          {chargement ? 'En cours...' : 'Retour de dépôt'}
        </button>
      </div>
    )
  }

  if (!ouvert) {
    return (
      <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOuvert(true)}>
        <MapPin size={16} /> Déposer chez un lieu de vente
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
        Choisir le lieu de dépôt
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <select className="form-input" value={lieuChoisi} onChange={e => setLieuChoisi(e.target.value)} style={{ flex: 1 }}>
          <option value="">Choisir un lieu...</option>
          {revendeurs.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
        <button className="btn btn-primary" onClick={deposer} disabled={!lieuChoisi || chargement} style={{ flexShrink: 0 }}>
          {chargement ? 'En cours...' : 'Confirmer'}
        </button>
        <button className="btn btn-secondary" onClick={() => setOuvert(false)} style={{ flexShrink: 0 }}>
          Annuler
        </button>
      </div>
      {erreur && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{erreur}</p>}
    </div>
  )
}
