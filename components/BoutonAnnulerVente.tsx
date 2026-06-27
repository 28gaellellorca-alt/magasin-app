'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

interface Props {
  venteId: string
  produitId: string | null
  quantiteVendue: number
}

export default function BoutonAnnulerVente({ venteId, produitId, quantiteVendue }: Props) {
  const [confirme, setConfirme] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function annulerVente() {
    setChargement(true)
    setErreur('')
    try {
      // Si le produit existe encore, remettre le stock avant de supprimer la vente
      if (produitId) {
        const { data: produit, error: errLecture } = await supabase
          .from('produits')
          .select('quantite')
          .eq('id', produitId)
          .single()
        if (errLecture) throw new Error(errLecture.message)

        const { error: errUpdate } = await supabase
          .from('produits')
          .update({ quantite: (produit.quantite || 0) + quantiteVendue, etat: 'disponible' })
          .eq('id', produitId)
        if (errUpdate) throw new Error(errUpdate.message)
      }

      const { error: errDelete } = await supabase
        .from('ventes')
        .delete()
        .eq('id', venteId)
      if (errDelete) throw new Error(errDelete.message)

      window.location.href = '/ventes'
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de l\'annulation')
      setChargement(false)
      setConfirme(false)
    }
  }

  if (!confirme) {
    return (
      <button
        onClick={() => setConfirme(true)}
        style={{
          background: 'none', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '4px 10px',
          cursor: 'pointer', color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 'var(--text-xs)', minHeight: 32,
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-danger)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
        }}
      >
        <Trash2 size={13} />
        Annuler
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 500 }}>
        Annuler et remettre en stock ?
      </span>
      {erreur && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{erreur}</span>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={annulerVente}
          disabled={chargement}
          className="btn btn-danger btn-sm"
          style={{ minHeight: 32, padding: '4px 12px', fontSize: 'var(--text-xs)' }}
        >
          {chargement ? '...' : 'Confirmer'}
        </button>
        <button
          onClick={() => { setConfirme(false); setErreur('') }}
          className="btn btn-secondary btn-sm"
          style={{ minHeight: 32, padding: '4px 12px', fontSize: 'var(--text-xs)' }}
        >
          Non
        </button>
      </div>
    </div>
  )
}
