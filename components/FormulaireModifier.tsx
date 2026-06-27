'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, X, Calculator, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { compresserImage } from '@/lib/compresserImage'
import Link from 'next/link'

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface Props { produit: any; categories: any[]; sousCategories: any[] }

export default function FormulaireModifier({ produit, categories, sousCategories }: Props) {
  const router = useRouter()
  const inputFichier = useRef<HTMLInputElement>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(produit.photo_url)
  const [fichierPhoto, setFichierPhoto] = useState<File | null>(null)
  const [supprimerPhoto, setSupprimerPhoto] = useState(false)

  const [form, setForm] = useState({
    nom: produit.nom,
    categorie_id: produit.categorie_id || '',
    sous_categorie_id: produit.sous_categorie_id || '',
    prix_achat: produit.prix_achat.toString(),
    frais_annexes: produit.frais_annexes.toString(),
    prix_vente_souhaite: produit.prix_vente_souhaite.toString(),
    quantite: produit.quantite.toString(),
    etat: produit.etat,
    notes: produit.notes || '',
  })

  const prixRevient = (parseFloat(form.prix_achat) || 0) + (parseFloat(form.frais_annexes) || 0)
  const prixVente = parseFloat(form.prix_vente_souhaite) || 0
  const marge = prixVente - prixRevient
  const margePct = prixRevient > 0 ? Math.round((marge / prixRevient) * 100) : 0

  const sousCatFiltrees = sousCategories.filter(sc => sc.categorie_id === form.categorie_id)

  function majChamp(champ: string, val: string) {
    setForm(f => {
      const nf = { ...f, [champ]: val }
      if (champ === 'categorie_id') nf.sous_categorie_id = ''
      return nf
    })
  }

  function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFichierPhoto(file); setSupprimerPhoto(false)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) { setErreur('Le nom est obligatoire.'); return }
    setErreur('')
    setChargement(true)

    try {
      let photo_url = supprimerPhoto ? null : produit.photo_url

      if (fichierPhoto) {
        const photoCompressée = await compresserImage(fichierPhoto)
        const nomFichier = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        const { error: errUpload } = await supabase.storage.from('images de produits').upload(nomFichier, photoCompressée, { cacheControl: '3600' })
        if (errUpload) throw new Error('Erreur upload : ' + errUpload.message)
        const { data: urlData } = supabase.storage.from('images de produits').getPublicUrl(nomFichier)
        photo_url = urlData.publicUrl
      }

      const { error } = await supabase.from('produits').update({
        nom: form.nom.trim(),
        categorie_id: form.categorie_id || null,
        sous_categorie_id: form.sous_categorie_id || null,
        prix_achat: parseFloat(form.prix_achat),
        frais_annexes: parseFloat(form.frais_annexes) || 0,
        prix_revient: prixRevient,
        prix_vente_souhaite: prixVente,
        quantite: parseInt(form.quantite) || 1,
        etat: form.etat,
        notes: form.notes.trim() || null,
        photo_url,
        updated_at: new Date().toISOString(),
      }).eq('id', produit.id)
      if (error) throw new Error(error.message)

      router.push(`/produits/${produit.id}`)
      router.refresh()
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 640 }}>
      <Link href={`/produits/${produit.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft size={16} /> Retour à la fiche
      </Link>

      <div className="form-group">
        <label className="form-label">Photo de l'article</label>
        <div onClick={() => inputFichier.current?.click()}
          style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer', background: photoPreview ? 'transparent' : 'var(--color-primary-light)', position: 'relative', overflow: 'hidden' }}>
          {photoPreview && !supprimerPhoto ? (
            <>
              <Image src={photoPreview} alt="Aperçu" width={300} height={200} style={{ borderRadius: 'var(--radius)', maxHeight: 200, objectFit: 'cover', width: '100%' }} />
              <button type="button" onClick={ev => { ev.stopPropagation(); setPhotoPreview(null); setFichierPhoto(null); setSupprimerPhoto(true) }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Appuie pour changer la photo</p>
            </>
          )}
        </div>
        <input ref={inputFichier} type="file" accept="image/*" style={{ display: 'none' }} onChange={choisirPhoto} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="nom">Nom de l'article *</label>
        <input id="nom" className="form-input" type="text" value={form.nom} onChange={e => majChamp('nom', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Catégorie</label>
          <select className="form-input" value={form.categorie_id} onChange={e => majChamp('categorie_id', e.target.value)}>
            <option value="">Choisir...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Sous-catégorie</label>
          <select className="form-input" value={form.sous_categorie_id} onChange={e => majChamp('sous_categorie_id', e.target.value)} disabled={!form.categorie_id}>
            <option value="">Choisir...</option>
            {sousCatFiltrees.map(sc => <option key={sc.id} value={sc.id}>{sc.nom}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Prix d'achat (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={form.prix_achat} onChange={e => majChamp('prix_achat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Frais annexes (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={form.frais_annexes} onChange={e => majChamp('frais_annexes', e.target.value)} />
        </div>
      </div>

      {prixRevient > 0 && (
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Calculator size={18} color="var(--color-primary)" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Prix de revient : <strong style={{ color: 'var(--color-primary-dark)' }}>{euro(prixRevient)}</strong>
          </span>
          {prixVente > 0 && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Marge : <strong className={marge >= 0 ? 'text-success' : 'text-danger'}>{euro(marge)} ({margePct}%)</strong>
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Prix de vente souhaité (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={form.prix_vente_souhaite} onChange={e => majChamp('prix_vente_souhaite', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Quantité</label>
          <input className="form-input" type="number" min="1" step="1" value={form.quantite} onChange={e => majChamp('quantite', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">État</label>
        <select className="form-input" value={form.etat} onChange={e => majChamp('etat', e.target.value)}>
          <option value="disponible">Disponible</option>
          <option value="reserve">Réservé</option>
          <option value="vendu">Vendu</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Notes libres</label>
        <textarea className="form-input" value={form.notes} onChange={e => majChamp('notes', e.target.value)} />
      </div>

      {erreur && <p className="form-error" style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', borderRadius: 'var(--radius)' }}>{erreur}</p>}

      <div style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
        <button type="submit" className="btn btn-accent" disabled={chargement} style={{ flex: 1 }}>
          {chargement ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
        <Link href={`/produits/${produit.id}`} className="btn btn-secondary">Annuler</Link>
      </div>
    </form>
  )
}
