'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Check } from 'lucide-react'

interface Props {
  produitId: string
  prixRevient: number
  revendeurs: any[]
  prixExistants: { revendeur_id: string; prix_vente: number }[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function PrixParLieu({ produitId, prixRevient, revendeurs, prixExistants }: Props) {
  const [prix, setPrix] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const p of prixExistants) init[p.revendeur_id] = p.prix_vente.toString()
    return init
  })
  const [sauvegardé, setSauvegardé] = useState<Record<string, boolean>>({})
  const [chargement, setChargement] = useState<Record<string, boolean>>({})

  async function sauvegarder(revendeurId: string) {
    const val = parseFloat(prix[revendeurId] || '')
    if (isNaN(val) || val <= 0) return
    setChargement(c => ({ ...c, [revendeurId]: true }))
    await supabase.from('prix_lieu').upsert(
      { produit_id: produitId, revendeur_id: revendeurId, prix_vente: val },
      { onConflict: 'produit_id,revendeur_id' }
    )
    setSauvegardé(s => ({ ...s, [revendeurId]: true }))
    setChargement(c => ({ ...c, [revendeurId]: false }))
    setTimeout(() => setSauvegardé(s => ({ ...s, [revendeurId]: false })), 2000)
  }

  async function supprimer(revendeurId: string) {
    await supabase.from('prix_lieu')
      .delete()
      .eq('produit_id', produitId)
      .eq('revendeur_id', revendeurId)
    setPrix(p => { const n = { ...p }; delete n[revendeurId]; return n })
  }

  if (revendeurs.length === 0) return null

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <MapPin size={16} color="var(--color-primary)" />
        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Prix par lieu de vente</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {revendeurs.map(r => {
          const prixSaisi = prix[r.id] || ''
          const prixNum = parseFloat(prixSaisi)
          const marge = !isNaN(prixNum) ? prixNum - prixRevient : null
          const aUnPrix = prixExistants.some(p => p.revendeur_id === r.id) || prixSaisi !== ''

          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-sm)', minWidth: 140, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                {r.nom}
              </span>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Prix €"
                value={prixSaisi}
                onChange={e => setPrix(p => ({ ...p, [r.id]: e.target.value }))}
                style={{ width: 90, flexShrink: 0 }}
              />
              {marge !== null && (
                <span style={{ fontSize: 'var(--text-xs)', color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)', flexShrink: 0 }}>
                  Marge : {euro(marge)}
                </span>
              )}
              <button
                className="btn btn-primary"
                style={{ fontSize: 'var(--text-xs)', minHeight: 32, padding: '4px 12px', flexShrink: 0 }}
                onClick={() => sauvegarder(r.id)}
                disabled={!prixSaisi || chargement[r.id]}
              >
                {sauvegardé[r.id] ? <><Check size={12} /> Enregistré</> : chargement[r.id] ? '...' : 'Enregistrer'}
              </button>
              {aUnPrix && prix[r.id] && (
                <button
                  style={{ fontSize: 'var(--text-xs)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', textDecoration: 'underline', flexShrink: 0 }}
                  onClick={() => supprimer(r.id)}
                >
                  Supprimer
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
