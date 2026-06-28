'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronDown, ChevronUp, Search, X, Pencil, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { compresserImage } from '@/lib/compresserImage'

interface Props {
  produits: any[]
  categories: any[]
  revendeurs: any[]
  prixLieu: { produit_id: string; revendeur_id: string; prix_vente: number }[]
  sousCategories: { id: string; nom: string }[]
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function BadgeSousCat({ produitId, valeurId, valeurNom, options }: {
  produitId: string
  valeurId: string | null
  valeurNom: string | null
  options: { id: string; nom: string }[]
}) {
  const [id, setId] = useState(valeurId)
  const [nom, setNom] = useState(valeurNom)
  const [edition, setEdition] = useState(false)
  const [saving, setSaving] = useState(false)

  async function changer(newId: string) {
    setEdition(false)
    setSaving(true)
    const { error } = await supabase.from('produits').update({
      sous_categorie_id: newId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', produitId)
    if (!error) {
      setId(newId || null)
      setNom(options.find(o => o.id === newId)?.nom || null)
    }
    setSaving(false)
  }

  if (edition) {
    return (
      <select autoFocus
        defaultValue={id || ''}
        onChange={e => changer(e.target.value)}
        onBlur={() => setEdition(false)}
        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 'var(--text-xs)', fontWeight: 500, background: 'var(--color-surface)', cursor: 'pointer' }}>
        <option value="">Aucune</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}
      </select>
    )
  }

  return (
    <span
      className="badge badge-neutral"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontStyle: nom ? 'italic' : 'normal' }}
      onClick={e => { e.preventDefault(); setEdition(true) }}
      title="Cliquer pour modifier la sous-catégorie">
      {saving ? '…' : (nom || <em style={{ opacity: 0.5, fontStyle: 'normal' }}>+ sous-cat</em>)}
      <Pencil size={9} style={{ opacity: 0.3, flexShrink: 0 }} />
    </span>
  )
}

function ChampPrixCarte({ produitId, prix, onUpdate }: {
  produitId: string
  prix: number
  onUpdate: (val: number) => void
}) {
  const [val, setVal] = useState(prix)
  const [edition, setEdition] = useState(false)
  const [saving, setSaving] = useState(false)

  async function sauver() {
    const num = parseFloat(String(val)) || 0
    setEdition(false)
    if (num === prix) return
    setSaving(true)
    const { error } = await supabase.from('produits').update({
      prix_vente_souhaite: num,
      updated_at: new Date().toISOString(),
    }).eq('id', produitId)
    if (!error) onUpdate(num)
    else setVal(prix)
    setSaving(false)
  }

  if (edition) {
    return (
      <input autoFocus type="number" step="0.01" min="0"
        value={val}
        onChange={e => setVal(parseFloat(e.target.value) || 0)}
        onBlur={sauver}
        onKeyDown={e => { if (e.key === 'Enter') sauver(); if (e.key === 'Escape') { setVal(prix); setEdition(false) } }}
        style={{ width: 90, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '2px 6px', fontFamily: 'inherit' }}
      />
    )
  }

  return (
    <span className="card-price"
      onClick={() => setEdition(true)}
      title="Cliquer pour modifier le prix de vente"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {saving ? '…' : euro(val)}
      <Pencil size={10} style={{ opacity: 0.35, flexShrink: 0 }} />
    </span>
  )
}

function ChampNomCarte({ produitId, nom, onUpdate }: {
  produitId: string
  nom: string
  onUpdate: (val: string) => void
}) {
  const [val, setVal] = useState(nom)
  const [edition, setEdition] = useState(false)
  const [saving, setSaving] = useState(false)

  async function sauver() {
    const trimmed = val.trim()
    setEdition(false)
    if (!trimmed || trimmed === nom) { if (!trimmed) setVal(nom); return }
    setSaving(true)
    const { error } = await supabase.from('produits').update({
      nom: trimmed,
      updated_at: new Date().toISOString(),
    }).eq('id', produitId)
    if (!error) onUpdate(trimmed)
    else setVal(nom)
    setSaving(false)
  }

  if (edition) {
    return (
      <input autoFocus type="text" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={sauver}
        onKeyDown={e => { if (e.key === 'Enter') sauver(); if (e.key === 'Escape') { setVal(nom); setEdition(false) } }}
        className="form-input"
        style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4, width: '100%' }}
      />
    )
  }

  return (
    <div className="card-title"
      onClick={() => setEdition(true)}
      title="Cliquer pour modifier le nom"
      style={{ marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
      <span>{saving ? '…' : val}</span>
      <Pencil size={10} style={{ opacity: 0.35, flexShrink: 0, marginTop: 3 }} />
    </div>
  )
}

function ChampQuantiteCarte({ produitId, quantite, stockMin, onUpdate }: {
  produitId: string
  quantite: number
  stockMin: number
  onUpdate: (val: number) => void
}) {
  const [val, setVal] = useState(quantite)
  const [edition, setEdition] = useState(false)
  const [saving, setSaving] = useState(false)

  async function sauver() {
    const num = parseInt(String(val)) || 0
    setEdition(false)
    if (num === quantite) return
    setSaving(true)
    const { error } = await supabase.from('produits').update({
      quantite: num,
      updated_at: new Date().toISOString(),
    }).eq('id', produitId)
    if (!error) onUpdate(num)
    else setVal(quantite)
    setSaving(false)
  }

  const couleur = val > 0 ? (stockMin > 0 && val <= stockMin ? 'var(--color-danger)' : 'var(--color-text-primary)') : 'var(--color-danger)'

  if (edition) {
    return (
      <input autoFocus type="number" min="0" step="1" value={val}
        onChange={e => setVal(parseInt(e.target.value) || 0)}
        onBlur={sauver}
        onKeyDown={e => { if (e.key === 'Enter') sauver(); if (e.key === 'Escape') { setVal(quantite); setEdition(false) } }}
        style={{ width: 60, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1px 6px', fontSize: 'inherit', fontFamily: 'inherit' }}
      />
    )
  }

  return (
    <span onClick={() => setEdition(true)} title="Cliquer pour modifier la quantité"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {saving ? '…' : <strong style={{ color: couleur }}>{val}</strong>}
      <Pencil size={9} style={{ opacity: 0.3, flexShrink: 0 }} />
    </span>
  )
}

function PhotoUploadCarte({ produitId, photoUrl, nom }: {
  produitId: string
  photoUrl: string | null
  nom: string
}) {
  const [url, setUrl] = useState(photoUrl)
  const [uploading, setUploading] = useState(false)
  const inputId = `photo-${produitId}`

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compresserImage(file)
      const photoNom = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('images de produits')
        .upload(photoNom, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('images de produits').getPublicUrl(photoNom)
      const { error: updateError } = await supabase.from('produits').update({
        photo_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', produitId)
      if (!updateError) setUrl(data.publicUrl)
    } catch (err) {
      console.error('Upload photo:', err)
    }
    setUploading(false)
    if (e.target) e.target.value = ''
  }

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/produits/${produitId}`} style={{ textDecoration: 'none', display: 'block' }}>
        {url ? (
          <Image src={url} alt={nom} width={300} height={225} className="card-image" />
        ) : (
          <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-light)' }}>
            <Package size={40} color="var(--color-primary)" strokeWidth={1} />
          </div>
        )}
      </Link>
      <label htmlFor={inputId} title="Changer la photo"
        style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
        {uploading ? '…' : <><Camera size={12} /> Photo</>}
      </label>
      <input id={inputId} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

function CarteInfo({ p, prixLieu, sousCategories }: { p: any; prixLieu?: number; sousCategories: { id: string; nom: string }[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [nomVal, setNomVal] = useState(p.nom)
  const [quantiteVal, setQuantiteVal] = useState(p.quantite)
  const [prixVente, setPrixVente] = useState(p.prix_vente_souhaite)
  const prixAffiché = prixLieu ?? prixVente
  const marge = prixAffiché - p.prix_revient
  const margePct = p.prix_revient > 0 ? Math.round((marge / p.prix_revient) * 100) : 0

  return (
    <div className="card">
      <PhotoUploadCarte produitId={p.id} photoUrl={p.photo_url} nom={nomVal} />

      <div className="card-body">
        <ChampNomCarte produitId={p.id} nom={nomVal} onUpdate={val => setNomVal(val)} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {p.categorie && (
            <span className="badge badge-primary">{p.categorie.nom}</span>
          )}
          <BadgeSousCat
            produitId={p.id}
            valeurId={p.sous_categorie_id || null}
            valeurNom={p.sous_categorie?.nom || null}
            options={sousCategories}
          />
          <span className={`badge ${p.etat === 'disponible' ? 'badge-success' : p.etat === 'vendu' ? 'badge-neutral' : 'badge-warning'}`}>
            {p.etat === 'disponible' ? 'Disponible' : p.etat === 'vendu' ? 'Vendu' : 'Réservé'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div>
            {prixLieu !== undefined ? (
              <span className="card-price">{euro(prixAffiché)}</span>
            ) : (
              <ChampPrixCarte produitId={p.id} prix={prixVente} onUpdate={val => setPrixVente(val)} />
            )}
            {prixLieu !== undefined && (
              <div style={{ fontSize: 10, color: 'var(--color-warning)', fontWeight: 500, marginTop: 1 }}>Prix lieu de vente</div>
            )}
            {prixLieu === undefined && (
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>Prix normal</div>
            )}
          </div>
          <span className={`badge ${marge >= 0 ? 'badge-success' : 'badge-danger'}`}>+{margePct}%</span>
        </div>

        {/* Ligne quantité visible directement */}
        {p.stock_min > 0 && p.quantite <= p.stock_min && (
          <div style={{ marginTop: 6, background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', padding: '3px 8px', fontSize: 'var(--text-xs)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ⚠ Stock bas
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span className="card-meta">
            Qté en stock : <ChampQuantiteCarte produitId={p.id} quantite={quantiteVal} stockMin={p.stock_min || 0} onUpdate={val => setQuantiteVal(val)} />
          </span>
          <button
            onClick={() => setOuvert(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, padding: '2px 4px' }}
            aria-label="Voir les détails"
          >
            {ouvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Détails
          </button>
        </div>

        {/* Panneau d'infos dépliable */}
        {ouvert && (
          <div style={{
            marginTop: 10,
            padding: 'var(--space-3)',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Prix d'achat</span>
              <strong>{euro(p.prix_achat)}</strong>
            </div>
            {p.frais_annexes > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Frais annexes</span>
                <strong>{euro(p.frais_annexes)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Prix de revient</span>
              <strong style={{ color: 'var(--color-primary)' }}>{euro(p.prix_revient)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 5, marginTop: 2 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Marge nette</span>
              <strong style={{ color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{euro(marge)}</strong>
            </div>
            {p.sous_categorie && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Sous-catégorie</span>
                <strong>{p.sous_categorie.nom}</strong>
              </div>
            )}
            {p.notes && (
              <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', paddingTop: 2 }}>
                {p.notes}
              </div>
            )}
            <Link href={`/produits/${p.id}`} className="btn btn-secondary btn-sm" style={{ marginTop: 6, textAlign: 'center' }}>
              Ouvrir la fiche complète
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CartesProduits({ produits, categories, revendeurs, prixLieu, sousCategories }: Props) {
  const [catFiltre, setCatFiltre] = useState('')
  const [sousCatFiltre, setSousCatFiltre] = useState('')
  const [etatFiltre, setEtatFiltre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [lieuVue, setLieuVue] = useState('')

  // Sous-catégories disponibles selon la catégorie sélectionnée
  const sousCatsDisponibles = Array.from(
    new Map(
      produits
        .filter(p => !catFiltre || p.categorie_id === catFiltre)
        .filter(p => p.sous_categorie_id && p.sous_categorie?.nom)
        .map(p => [p.sous_categorie_id, p.sous_categorie.nom])
    ).entries()
  ).map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom))

  const termes = recherche.toLowerCase().trim().split(/\s+/).filter(Boolean)

  const filtres = produits.filter(p => {
    if (catFiltre && p.categorie_id !== catFiltre) return false
    if (sousCatFiltre && p.sous_categorie_id !== sousCatFiltre) return false
    if (etatFiltre && p.etat !== etatFiltre) return false
    if (termes.length > 0) {
      const texte = [p.nom, p.categorie?.nom, p.sous_categorie?.nom, p.notes].filter(Boolean).join(' ').toLowerCase()
      if (!termes.every(t => texte.includes(t))) return false
    }
    return true
  })

  function getPrixPourLieu(produitId: string): number | undefined {
    if (!lieuVue) return undefined
    const entree = prixLieu.find(pl => pl.produit_id === produitId && pl.revendeur_id === lieuVue)
    return entree?.prix_vente
  }

  const lieuActif = revendeurs.find((r: any) => r.id === lieuVue)

  return (
    <>
      {/* Sélecteur de vue par lieu */}
      {revendeurs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)', padding: 'var(--space-3)',
          background: lieuVue ? 'var(--color-warning-light)' : 'var(--color-surface)',
          border: `1px solid ${lieuVue ? 'var(--color-warning)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius)', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Voir les prix pour :
          </span>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: 180, minHeight: 36 }}
            value={lieuVue}
            onChange={e => setLieuVue(e.target.value)}
          >
            <option value="">Affichage normal</option>
            {revendeurs.map((r: any) => (
              <option key={r.id} value={r.id}>{r.nom}</option>
            ))}
          </select>
          {lieuVue && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontStyle: 'italic' }}>
              Les prix spécifiques à {lieuActif?.nom} sont mis en avant
            </span>
          )}
        </div>
      )}

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          className="form-input"
          type="text"
          placeholder="Rechercher un article (nom, catégorie, notes…)"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ paddingLeft: 40, paddingRight: recherche ? 40 : 14 }}
        />
        {recherche && (
          <button
            onClick={() => setRecherche('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
            aria-label="Effacer la recherche"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtres catégorie + sous-catégorie + état */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={catFiltre}
          onChange={e => { setCatFiltre(e.target.value); setSousCatFiltre('') }}>
          <option value="">Toutes les catégories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        {sousCatsDisponibles.length > 0 && (
          <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={sousCatFiltre}
            onChange={e => setSousCatFiltre(e.target.value)}>
            <option value="">Toutes les sous-catégories</option>
            {sousCatsDisponibles.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.nom}</option>
            ))}
          </select>
        )}
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={etatFiltre} onChange={e => setEtatFiltre(e.target.value)}>
          <option value="">Tous les états</option>
          <option value="disponible">Disponible</option>
          <option value="vendu">Vendu</option>
          <option value="reserve">Réservé</option>
        </select>
        {(recherche || catFiltre || sousCatFiltre || etatFiltre) && (
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {filtres.length} résultat{filtres.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {filtres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <Package size={48} strokeWidth={1} style={{ margin: '0 auto var(--space-4)' }} />
          <p>{recherche ? `Aucun article pour "${recherche}".` : 'Aucun article trouvé.'}</p>
          {!recherche && (
            <Link href="/ajouter" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              Ajouter un article
            </Link>
          )}
        </div>
      ) : (
        <div className="grid-products">
          {filtres.map((p: any) => (
            <CarteInfo key={p.id} p={p} prixLieu={getPrixPourLieu(p.id)} sousCategories={sousCategories} />
          ))}
        </div>
      )}
    </>
  )
}
