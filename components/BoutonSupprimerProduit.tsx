'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

interface Props {
  produitId: string
  photoUrl: string | null
}

export default function BoutonSupprimerProduit({ produitId }: Props) {
  const [confirme, setConfirme] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [nbVentes, setNbVentes] = useState<number | null>(null)

  async function verifierEtOuvrir() {
    // Compter les ventes existantes pour ce produit
    const { count } = await supabase
      .from('ventes')
      .select('id', { count: 'exact', head: true })
      .eq('produit_id', produitId)
    setNbVentes(count ?? 0)
    setConfirme(true)
  }

  async function supprimerProduit() {
    setChargement(true)
    setErreur('')
    try {
      // La photo reste dans Supabase Storage intentionnellement —
      // elle est référencée dans l'historique des ventes (colonne photo_url).
      // Supprimer le produit (les ventes gardent leur photo_url même si produit_id passe à NULL)
      const { error } = await supabase.from('produits').delete().eq('id', produitId)
      if (error) throw new Error(error.message)

      window.location.href = '/produits'
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de la suppression')
      setChargement(false)
    }
  }

  if (!confirme) {
    return (
      <button
        onClick={verifierEtOuvrir}
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
      {nbVentes !== null && nbVentes > 0 ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Cet article a <strong>{nbVentes} vente{nbVentes > 1 ? 's' : ''} enregistrée{nbVentes > 1 ? 's' : ''}</strong>.
          L'historique et les photos resteront accessibles dans la page Ventes même après suppression.
        </p>
      ) : (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Aucune vente enregistrée. La suppression est définitive.
        </p>
      )}
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
          onClick={() => { setConfirme(false); setErreur(''); setNbVentes(null) }}
          className="btn btn-secondary btn-sm"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
