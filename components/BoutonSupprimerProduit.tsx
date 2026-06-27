'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

interface Props {
  produitId: string
  photoUrl: string | null
}

export default function BoutonSupprimerProduit({ produitId, photoUrl }: Props) {
  const router = useRouter()
  const [confirme, setConfirme] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function supprimerProduit() {
    setChargement(true)
    setErreur('')
    try {
      // 1. Supprimer la photo dans Supabase Storage si elle existe
      if (photoUrl) {
        const nomFichier = photoUrl.split('/').pop()
        if (nomFichier) {
          await supabase.storage.from('images de produits').remove([nomFichier])
        }
      }

      // 2. Supprimer le produit (les ventes liées sont supprimées automatiquement)
      const { error } = await supabase.from('produits').delete().eq('id', produitId)
      if (error) throw new Error(error.message)

      router.push('/produits')
      router.refresh()
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de la suppression')
      setChargement(false)
    }
  }

  if (!confirme) {
    return (
      <button
        onClick={() => setConfirme(true)}
        className="btn btn-sm"
        style={{
          background: 'none', border: '1.5px solid var(--color-danger)',
          color: 'var(--color-danger)', gap: 6,
        }}
      >
        <Trash2 size={15} />
        Supprimer
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--color-danger-light)',
      border: '2px solid var(--color-danger)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
    }}>
      <p style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
        Supprimer cet article définitivement ?
      </p>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
        La photo et tout l'historique des ventes seront supprimés. Cette action est irréversible.
      </p>
      {erreur && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 500 }}>{erreur}</p>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          onClick={supprimerProduit}
          disabled={chargement}
          className="btn btn-danger btn-sm"
          style={{ flex: 1 }}
        >
          {chargement ? 'Suppression...' : 'Oui, supprimer'}
        </button>
        <button
          onClick={() => { setConfirme(false); setErreur('') }}
          className="btn btn-secondary btn-sm"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
