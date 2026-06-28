'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, Calculator } from 'lucide-react'
import Image from 'next/image'
import { compresserImage } from '@/lib/compresserImage'

const SUGGESTIONS: Record<string, string[]> = {
  'Bijoux':         ['collier', 'bracelet', 'bague', 'boucle', 'pendentif', 'bijou', 'perle', 'chaîne'],
  'Déco maison':    ['déco', 'deco', 'bougie', 'vase', 'cadre', 'coussin', 'tableau', 'pot', 'bocal', 'guirlande'],
  'Enfant/Bébé':    ['bébé', 'doudou', 'jouet', 'enfant', 'naissance', 'hochet', 'peluche', 'tétine'],
  'Textile':        ['tissu', 'sac', 'tote', 'pochette', 'tapis', 'serviette', 'foulard', 'écharpe'],
  'Accessoires':    ['accessoire', 'porte-monnaie', 'porte-clé', 'ceinture', 'chapeau', 'bonnet'],
}

function suggererCategorie(nom: string, categories: any[]): string {
  const n = nom.toLowerCase()
  for (const [catNom, mots] of Object.entries(SUGGESTIONS)) {
    if (mots.some(m => n.includes(m))) {
      const cat = categories.find(c => c.nom === catNom)
      if (cat) return cat.id
    }
  }
  return ''
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface Props { categories: any[]; sousCategories: any[] }

export default function FormulaireAjout({ categories, sousCategories }: Props) {
  const inputFichier = useRef<HTMLInputElement>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [nomEnregistre, setNomEnregistre] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [fichierPhoto, setFichierPhoto] = useState<File | null>(null)

  const [form, setForm] = useState({
    nom: '', categorie_id: '', sous_categorie_id: '',
    prix_achat: '', frais_annexes: '0',
    prix_vente_souhaite: '', quantite: '1',
    etat: 'disponible', notes: '', fournisseur: '',
  })

  const prixRevient = (parseFloat(form.prix_achat) || 0) + (parseFloat(form.frais_annexes) || 0)
  const prixVente = parseFloat(form.prix_vente_souhaite) || 0
  const marge = prixVente - prixRevient
  const margePct = prixRevient > 0 ? Math.round((marge / prixRevient) * 100) : 0

  const sousCatFiltrees = sousCategories.filter(sc => sc.categorie_id === form.categorie_id)

  function majChamp(champ: string, val: string) {
    setForm(f => {
      const nf = { ...f, [champ]: val }
      if (champ === 'nom' && val.length > 2) {
        const suggestion = suggererCategorie(val, categories)
        if (suggestion && !f.categorie_id) nf.categorie_id = suggestion
      }
      if (champ === 'categorie_id') nf.sous_categorie_id = ''
      return nf
    })
  }

  function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFichierPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) { setErreur('Le nom est obligatoire.'); return }
    if (!form.prix_achat) { setErreur('Le prix d\'achat est obligatoire.'); return }
    setErreur('')
    setChargement(true)

    try {
      let photo_url: string | null = null

      if (fichierPhoto) {
        const photoCompressée = await compresserImage(fichierPhoto)
        const nomFichier = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        const { error: errUpload } = await supabase.storage
          .from('images de produits')
          .upload(nomFichier, photoCompressée, { cacheControl: '3600', upsert: false })
        if (errUpload) throw new Error('Erreur upload photo : ' + errUpload.message)
        const { data: urlData } = supabase.storage.from('images de produits').getPublicUrl(nomFichier)
        photo_url = urlData.publicUrl
      }

      const { data: inserted, error } = await supabase.from('produits').insert({
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
        fournisseur: form.fournisseur.trim() || null,
        photo_url,
      }).select('id')
      if (error) throw new Error(error.message)
      if (!inserted || inserted.length === 0) throw new Error('Sauvegarde bloquée par Supabase (permissions RLS). Voir la procédure dans l\'app.')
      setNomEnregistre(form.nom.trim())
      setSucces(true)
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setChargement(false)
    }
  }

  if (succes) {
    return (
      <div style={{ maxWidth: 640, textAlign: 'center', padding: 'var(--space-10) var(--space-5)' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>
          Article enregistré !
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          « {nomEnregistre} » a bien été ajouté à ton stock.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/produits" className="btn btn-accent">Voir mon stock</a>
          <button className="btn btn-secondary" onClick={() => {
            setSucces(false)
            setNomEnregistre('')
            setErreur('')
            setPhotoPreview(null)
            setFichierPhoto(null)
            setForm({ nom: '', categorie_id: '', sous_categorie_id: '', prix_achat: '', frais_annexes: '0', prix_vente_souhaite: '', quantite: '1', etat: 'disponible', notes: '', fournisseur: '' })
          }}>
            Ajouter un autre article
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 640 }}>
      {erreur && (
        <div style={{ background: 'var(--color-danger-light)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', color: 'var(--color-danger)', fontWeight: 600 }}>
          {erreur}
        </div>
      )}
      {/* Photo */}
      <div className="form-group">
        <label className="form-label">Photo de l'article</label>
        <div
          onClick={() => inputFichier.current?.click()}
          style={{
            border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer',
            background: photoPreview ? 'transparent' : 'var(--color-primary-light)',
            position: 'relative', overflow: 'hidden',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          {photoPreview ? (
            <>
              <Image src={photoPreview} alt="Aperçu" width={300} height={200} style={{ borderRadius: 'var(--radius)', maxHeight: 200, objectFit: 'cover', width: '100%' }} />
              <button type="button" onClick={e => { e.stopPropagation(); setPhotoPreview(null); setFichierPhoto(null) }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Appuie pour ajouter une photo</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginTop: 4 }}>JPG, PNG, WebP — max 10 Mo</p>
            </>
          )}
        </div>
        <input ref={inputFichier} type="file" accept="image/*" style={{ display: 'none' }} onChange={choisirPhoto} />
      </div>

      {/* Nom */}
      <div className="form-group">
        <label className="form-label" htmlFor="nom">Nom de l'article *</label>
        <input id="nom" className="form-input" type="text" placeholder="Ex : Doudou étoile crochet rose"
          value={form.nom} onChange={e => majChamp('nom', e.target.value)} />
      </div>

      {/* Catégorie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="categorie">Catégorie</label>
          <select id="categorie" className="form-input" value={form.categorie_id} onChange={e => majChamp('categorie_id', e.target.value)}>
            <option value="">Choisir...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="sous-categorie">Sous-catégorie</label>
          <select id="sous-categorie" className="form-input" value={form.sous_categorie_id} onChange={e => majChamp('sous_categorie_id', e.target.value)} disabled={!form.categorie_id}>
            <option value="">Choisir...</option>
            {sousCatFiltrees.map(sc => <option key={sc.id} value={sc.id}>{sc.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Prix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="prix-achat">Prix d'achat (€) *</label>
          <input id="prix-achat" className="form-input" type="number" step="0.01" min="0" placeholder="0,00"
            value={form.prix_achat} onChange={e => majChamp('prix_achat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="frais">Frais annexes (€)</label>
          <input id="frais" className="form-input" type="number" step="0.01" min="0" placeholder="0,00"
            value={form.frais_annexes} onChange={e => majChamp('frais_annexes', e.target.value)} />
        </div>
      </div>

      {/* Calcul en temps réel */}
      {(parseFloat(form.prix_achat) > 0 || prixRevient > 0) && (
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Calculator size={18} color="var(--color-primary)" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Prix de revient : <strong style={{ color: 'var(--color-primary-dark)' }}>{euro(prixRevient)}</strong>
          </span>
          {prixVente > 0 && (
            <>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Marge : <strong className={marge >= 0 ? 'text-success' : 'text-danger'}>{euro(marge)} ({margePct}%)</strong>
              </span>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="prix-vente">Prix de vente souhaité (€)</label>
          <input id="prix-vente" className="form-input" type="number" step="0.01" min="0" placeholder="0,00"
            value={form.prix_vente_souhaite} onChange={e => majChamp('prix_vente_souhaite', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="quantite">Quantité</label>
          <input id="quantite" className="form-input" type="number" min="1" step="1"
            value={form.quantite} onChange={e => majChamp('quantite', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="etat">État</label>
        <select id="etat" className="form-input" value={form.etat} onChange={e => majChamp('etat', e.target.value)}>
          <option value="disponible">Disponible</option>
          <option value="reserve">Réservé</option>
          <option value="vendu">Vendu</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="fournisseur">Acheté à / Source</label>
        <input id="fournisseur" className="form-input" type="text"
          placeholder="Ex : Vinted — Marie, Brocante Bordeaux, Marché Saint-Michel…"
          value={form.fournisseur} onChange={e => majChamp('fournisseur', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="notes">Notes libres</label>
        <textarea id="notes" className="form-input" placeholder="Couleur, matière, taille, état, etc."
          value={form.notes} onChange={e => majChamp('notes', e.target.value)} />
      </div>

      {erreur && <p className="form-error" style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', borderRadius: 'var(--radius)' }}>{erreur}</p>}

      <div style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
        <button type="submit" className="btn btn-accent" disabled={chargement} style={{ flex: 1 }}>
          {chargement ? 'Enregistrement...' : 'Enregistrer l\'article'}
        </button>
        <a href="/produits" className="btn btn-secondary">Annuler</a>
      </div>
    </form>
  )
}
