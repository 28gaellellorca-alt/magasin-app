'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

interface Props {
  produitId: string
  photoUrl: string | null
}

export default function BoutonSupprimerProduit({ produitId, photoUrl }: Props) {
  const [confirme, setConfirme] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [verification, setVerification] = useState(false)
  const [erreur, setErreur] = useState('')
  const [nbVentes, setNbVentes] = useState<number | null>(null)

  async function verifierEtOuvrir() {
    setVerification(true)
    const { count } = await supabase
      .from('ventes')
      .select('id', { count: 'exact', head: true })
      .eq('produit_id', produitId)
    setNbVentes(count ?? 0)
    setVerification(false)
    setConfirme(true)
  }

  async function supprimerProduit() {
    setChargement(true)
    setErreur('')
    try {
      // Si aucune vente, supprimer aussi la photo de Supabase Storage
      if (nbVentes === 0 && photoUrl) {
        const chemin = photoUrl.split('/images de produits/')[1]
        if (chemin) {
          await supabase.storage.from('images de produits').remove([chemin])
        }
      }

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
        disabled={verification}
        className="btn btn-sm"
        style={{
          background: 'none', border: '1.5px solid var(--color-danger)',
          color: 'var(--color-danger)', gap: 6,
        }}
      >
        <Trash2 size={15} />
        {verification ? 'Vérification...' : 'Supprimer'}
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
        <div style={{ background: 'white', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 500 }}>
          Erreur : {erreur}
        </div>
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
