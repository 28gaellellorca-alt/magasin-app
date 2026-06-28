'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Pencil, Check, X, Edit } from 'lucide-react'
import Link from 'next/link'
import BoutonSupprimerProduit from '@/components/BoutonSupprimerProduit'

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// --- Primitives d'édition inline (définies HORS du composant parent) ---

function ChampTexte({ valeur, type = 'text', multiline = false, onSave, style }: {
  valeur: string | number
  type?: 'text' | 'number'
  multiline?: boolean
  onSave: (v: string) => Promise<void>
  style?: React.CSSProperties
}) {
  const [edition, setEdition] = useState(false)
  const [val, setVal] = useState(String(valeur ?? ''))
  const [saving, setSaving] = useState(false)

  async function sauver() {
    if (val === String(valeur)) { setEdition(false); return }
    setSaving(true)
    try { await onSave(val) } catch { } finally { setSaving(false); setEdition(false) }
  }

  function annuler() { setVal(String(valeur ?? '')); setEdition(false) }

  if (edition) {
    if (multiline) {
      return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <textarea autoFocus className="form-input" value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') annuler() }}
            style={{ minHeight: 80, width: '100%', ...style }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={sauver} disabled={saving}
              style={{ background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
              <Check size={14} />
            </button>
            <button onClick={annuler}
              style={{ background: 'var(--color-border)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )
    }
    return (
      <input autoFocus type={type} className="form-input" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') sauver(); if (e.key === 'Escape') annuler() }}
        onBlur={sauver}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        style={{ width: type === 'number' ? 110 : '100%', ...style }}
      />
    )
  }

  return (
    <span onClick={() => { setVal(String(valeur ?? '')); setEdition(true) }}
      title="Cliquer pour modifier"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>
      {saving ? '…' : (valeur !== null && valeur !== undefined && valeur !== '' ? String(valeur) : <em style={{ color: 'var(--color-text-muted)' }}>Ajouter…</em>)}
      <Pencil size={11} style={{ opacity: 0.35, flexShrink: 0 }} />
    </span>
  )
}

function ChampEtat({ etat, onSave }: { etat: string; onSave: (v: string) => Promise<void> }) {
  const [ouvert, setOuvert] = useState(false)
  const [saving, setSaving] = useState(false)
  const opts = [
    { val: 'disponible', label: 'Disponible', cls: 'badge-success' },
    { val: 'reserve',    label: 'Réservé',    cls: 'badge-warning' },
    { val: 'vendu',      label: 'Vendu',      cls: 'badge-neutral' },
  ]
  const actif = opts.find(o => o.val === etat) || opts[0]

  async function changer(val: string) {
    setOuvert(false)
    if (val === etat) return
    setSaving(true)
    try { await onSave(val) } catch { } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span className={`badge ${actif.cls}`}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        onClick={() => setOuvert(v => !v)}>
        {saving ? '…' : actif.label}
        <Pencil size={10} style={{ opacity: 0.35 }} />
      </span>
      {ouvert && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 6, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'var(--shadow)' }}>
          {opts.map(o => (
            <span key={o.val} className={`badge ${o.cls}`}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => changer(o.val)}>
              {o.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ChampSelectCategorie({ valeurId, options, onSave }: {
  valeurId: string | null
  options: { id: string; nom: string }[]
  onSave: (id: string) => Promise<void>
}) {
  const [edition, setEdition] = useState(false)
  const [saving, setSaving] = useState(false)
  const label = options.find(o => o.id === valeurId)?.nom

  async function changer(id: string) {
    setEdition(false)
    if (!id || id === valeurId) return
    setSaving(true)
    try { await onSave(id) } catch { } finally { setSaving(false) }
  }

  if (edition) {
    return (
      <select autoFocus
        defaultValue={valeurId || ''}
        onChange={e => changer(e.target.value)}
        onBlur={() => setEdition(false)}
        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 'var(--text-xs)', fontWeight: 500, background: 'var(--color-surface)', cursor: 'pointer' }}>
        <option value="" disabled>Choisir...</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}
      </select>
    )
  }

  return (
    <span className="badge badge-primary"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      onClick={() => setEdition(true)}
      title="Cliquer pour modifier la catégorie">
      {saving ? '…' : (label || <em style={{ opacity: 0.5, fontStyle: 'normal' }}>Catégorie ?</em>)}
      <Pencil size={10} style={{ opacity: 0.35 }} />
    </span>
  )
}

function ChampSelect({ valeurId, options, onSave }: {
  valeurId: string | null
  options: { id: string; nom: string }[]
  onSave: (id: string | null) => Promise<void>
}) {
  const [edition, setEdition] = useState(false)
  const [saving, setSaving] = useState(false)
  const label = options.find(o => o.id === valeurId)?.nom

  async function changer(id: string) {
    setEdition(false)
    setSaving(true)
    try { await onSave(id || null) } catch { } finally { setSaving(false) }
  }

  if (edition) {
    return (
      <select autoFocus
        defaultValue={valeurId || ''}
        onChange={e => changer(e.target.value)}
        onBlur={() => setEdition(false)}
        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 'var(--text-xs)', fontWeight: 500, background: 'var(--color-surface)', cursor: 'pointer' }}>
        <option value="">Aucune sous-catégorie</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}
      </select>
    )
  }

  return (
    <span className="badge badge-neutral"
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      onClick={() => setEdition(true)}
      title="Cliquer pour modifier la sous-catégorie">
      {saving ? '…' : (label
        ? <>{label} <Pencil size={10} style={{ opacity: 0.35 }} /></>
        : <><em style={{ opacity: 0.5, fontStyle: 'normal' }}>+ sous-catégorie</em> <Pencil size={10} style={{ opacity: 0.35 }} /></>
      )}
    </span>
  )
}

function StatCardEditable({ label, children, muted }: { label: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: muted ? 'var(--color-primary)' : undefined }}>{children}</div>
    </div>
  )
}

// --- Composant principal ---

interface Props {
  produit: any
  sousCategories: { id: string; nom: string; categorie_id: string | null }[]
  categories: { id: string; nom: string }[]
}

export default function FicheEditable({ produit: initial, sousCategories, categories }: Props) {
  const [p, setP] = useState(initial)

  async function sauver(champs: Record<string, any>) {
    const { error } = await supabase.from('produits').update({
      ...champs,
      updated_at: new Date().toISOString(),
    }).eq('id', p.id)
    if (!error) setP((prev: any) => ({ ...prev, ...champs }))
  }

  async function sauverNom(val: string) {
    const nom = val.trim()
    if (!nom) return
    await sauver({ nom })
  }

  async function sauverPrix(champ: 'prix_achat' | 'frais_annexes' | 'prix_vente_souhaite', val: string) {
    const num = parseFloat(val) || 0
    const update: any = { [champ]: num }
    if (champ === 'prix_achat' || champ === 'frais_annexes') {
      const achat = champ === 'prix_achat' ? num : p.prix_achat
      const frais = champ === 'frais_annexes' ? num : p.frais_annexes
      update.prix_revient = achat + frais
    }
    await sauver(update)
  }

  async function sauverQuantite(val: string) {
    const quantite = parseInt(val) || 0
    await sauver({ quantite })
  }

  const sousCatsFiltrees = sousCategories.filter(s => !s.categorie_id || s.categorie_id === p.categorie_id)

  const prixRevient = p.prix_achat + (p.frais_annexes || 0)
  const marge = p.prix_vente_souhaite - prixRevient
  const margePct = prixRevient > 0 ? Math.round((marge / prixRevient) * 100) : 0

  return (
    <>
      {/* En-tête : nom + badges + boutons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: 6 }}>
            <ChampTexte valeur={p.nom} onSave={sauverNom} style={{ fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }} />
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <ChampSelectCategorie
              valeurId={p.categorie_id || null}
              options={categories}
              onSave={async id => await sauver({ categorie_id: id, sous_categorie_id: null })}
            />
            <ChampSelect
              valeurId={p.sous_categorie_id || null}
              options={sousCatsFiltrees}
              onSave={async id => await sauver({ sous_categorie_id: id })}
            />
            <ChampEtat etat={p.etat} onSave={async val => await sauver({ etat: val })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          <Link href={`/produits/${p.id}/modifier`} className="btn btn-secondary btn-sm" title="Modifier photo / catégorie">
            <Edit size={14} /> Photo…
          </Link>
          <BoutonSupprimerProduit produitId={p.id} photoUrl={p.photo_url} />
        </div>
      </div>

      {/* Stat-cards éditables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <StatCardEditable label="Prix d'achat">
          <ChampTexte valeur={p.prix_achat} type="number"
            onSave={val => sauverPrix('prix_achat', val)} />
        </StatCardEditable>
        <StatCardEditable label="Frais annexes">
          <ChampTexte valeur={p.frais_annexes || 0} type="number"
            onSave={val => sauverPrix('frais_annexes', val)} />
        </StatCardEditable>
        <StatCardEditable label="Prix de revient" muted>
          {euro(prixRevient)}
        </StatCardEditable>
        <StatCardEditable label="Prix de vente souhaité">
          <ChampTexte valeur={p.prix_vente_souhaite} type="number"
            onSave={val => sauverPrix('prix_vente_souhaite', val)} />
        </StatCardEditable>
        <div className="stat-card">
          <div className="stat-label">Marge</div>
          <div className="stat-value" style={{ color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{euro(marge)}</div>
          <div className="stat-sub">{margePct}% du prix de revient</div>
        </div>
        <StatCardEditable label="Quantité">
          <ChampTexte valeur={p.quantite} type="number"
            onSave={sauverQuantite} />
        </StatCardEditable>
        <StatCardEditable label="Alerte stock bas">
          <ChampTexte valeur={p.stock_min ?? 0} type="number"
            onSave={async val => await sauver({ stock_min: parseInt(val) || 0 })} />
        </StatCardEditable>
      </div>

      {/* Fournisseur + Notes */}
      <div style={{ background: 'var(--color-accent-light)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acheté à</div>
          <ChampTexte valeur={p.fournisseur || ''} onSave={async val => await sauver({ fournisseur: val.trim() || null })}
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
          <ChampTexte valeur={p.notes || ''} multiline
            onSave={async val => await sauver({ notes: val.trim() || null })}
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }} />
        </div>
      </div>
    </>
  )
}
