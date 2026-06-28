'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, MapPin, Pencil, Check, X } from 'lucide-react'

interface Props { revendeurs: any[] }

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const TYPES_FRAIS = [
  { val: 'pourcentage', label: '% sur chaque vente', ex: 'Ex : 15% du CA réalisé sur le lieu' },
  { val: 'fixe',        label: 'Montant fixe par article vendu', ex: 'Ex : 2€ déduit par article' },
  { val: 'entree',      label: "Frais d'entrée (total par événement)", ex: 'Ex : 50€ pour louer la table' },
]

function labelFrais(r: any) {
  if (r.commission_type === 'pourcentage') return `${r.commission_valeur}% du CA`
  if (r.commission_type === 'fixe') return `${euro(r.commission_valeur)} par article`
  if (r.commission_type === 'entree') return `${euro(r.commission_valeur)} d'entrée par événement`
  return ''
}

function labelAjustement(r: any) {
  if (!r.remise_defaut || r.remise_defaut === 0) return null
  if (r.remise_defaut > 0) return `remise automatique ${r.remise_defaut}% sur tes prix`
  return `augmentation automatique ${Math.abs(r.remise_defaut)}% sur tes prix`
}

type FormLieu = {
  nom: string
  commission_type: string
  commission_valeur: string
  ajustement_type: 'remise' | 'augmentation'
  ajustement_valeur: string
}

const formVide: FormLieu = {
  nom: '', commission_type: 'pourcentage', commission_valeur: '',
  ajustement_type: 'remise', ajustement_valeur: '',
}

function formDepuisLieu(r: any): FormLieu {
  const ajustement = r.remise_defaut || 0
  return {
    nom: r.nom,
    commission_type: r.commission_type,
    commission_valeur: r.commission_valeur?.toString() || '',
    ajustement_type: ajustement < 0 ? 'augmentation' : 'remise',
    ajustement_valeur: ajustement !== 0 ? Math.abs(ajustement).toString() : '',
  }
}

export default function GestionRevendeurs({ revendeurs: init }: Props) {
  const [lieux, setLieux] = useState(init)
  const [form, setForm] = useState<FormLieu>(formVide)
  const [enEdition, setEnEdition] = useState<string | null>(null)
  const [formEdit, setFormEdit] = useState<FormLieu>(formVide)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  function remiseDefautDepuisForm(f: FormLieu) {
    const val = parseFloat(f.ajustement_valeur) || 0
    return f.ajustement_type === 'augmentation' ? -val : val
  }

  async function ajouter() {
    const nom = form.nom.trim()
    const val = parseFloat(form.commission_valeur)
    if (!nom) { setErreur('Nom obligatoire.'); return }
    if (isNaN(val) || val < 0) { setErreur('Montant invalide.'); return }
    setErreur('')
    setChargement(true)
    const { data, error } = await supabase.from('revendeurs').insert({
      nom,
      commission_type: form.commission_type,
      commission_valeur: val,
      remise_defaut: remiseDefautDepuisForm(form),
    }).select().single()
    if (!error && data) {
      setLieux(l => [...l, data])
      setForm(formVide)
    }
    setChargement(false)
  }

  async function enregistrerEdition(id: string) {
    const nom = formEdit.nom.trim()
    const val = parseFloat(formEdit.commission_valeur)
    if (!nom || isNaN(val) || val < 0) return
    const { data, error } = await supabase.from('revendeurs').update({
      nom,
      commission_type: formEdit.commission_type,
      commission_valeur: val,
      remise_defaut: remiseDefautDepuisForm(formEdit),
    }).eq('id', id).select().single()
    if (!error && data) {
      setLieux(l => l.map(r => r.id === id ? data : r))
      setEnEdition(null)
    }
  }

  async function supprimer(id: string) {
    const { count } = await supabase
      .from('ventes').select('id', { count: 'exact', head: true }).eq('revendeur_id', id)
    const msg = count && count > 0
      ? `Ce lieu a ${count} vente(s) enregistrée(s). Les ventes seront conservées mais le lieu deviendra inconnu. Supprimer quand même ?`
      : 'Supprimer ce lieu de vente ?'
    if (!confirm(msg)) return
    await supabase.from('revendeurs').delete().eq('id', id)
    setLieux(l => l.filter(r => r.id !== id))
  }

  function FormulaireLieu({ f, setF, onValider, onAnnuler, labelBouton }: {
    f: FormLieu
    setF: (fn: (prev: FormLieu) => FormLieu) => void
    onValider: () => void
    onAnnuler?: () => void
    labelBouton: string
  }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="form-group">
          <label className="form-label">Nom du lieu</label>
          <input className="form-input" placeholder="Ex : Marché de Noël, Kermesse École…"
            value={f.nom} onChange={e => setF(prev => ({ ...prev, nom: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">Type de frais</label>
          <select className="form-input" value={f.commission_type}
            onChange={e => setF(prev => ({ ...prev, commission_type: e.target.value, commission_valeur: '' }))}>
            {TYPES_FRAIS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
          </select>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {TYPES_FRAIS.find(t => t.val === f.commission_type)?.ex}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">
              {f.commission_type === 'pourcentage' ? 'Taux (%)' : 'Montant (€)'}
            </label>
            <input className="form-input" type="number" step="0.01" min="0"
              placeholder={f.commission_type === 'pourcentage' ? 'Ex : 15' : 'Ex : 50'}
              value={f.commission_valeur}
              onChange={e => setF(prev => ({ ...prev, commission_valeur: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Ajustement auto sur tes prix</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              {(['remise', 'augmentation'] as const).map(type => (
                <button key={type} type="button"
                  onClick={() => setF(prev => ({ ...prev, ajustement_type: type }))}
                  style={{
                    flex: 1, padding: '5px 8px', borderRadius: 'var(--radius)',
                    border: `2px solid ${f.ajustement_type === type ? (type === 'remise' ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-border)'}`,
                    background: f.ajustement_type === type ? (type === 'remise' ? 'var(--color-warning-light)' : 'var(--color-success-light)') : 'var(--color-surface)',
                    color: f.ajustement_type === type ? (type === 'remise' ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-text-secondary)',
                    fontWeight: f.ajustement_type === type ? 600 : 400,
                    cursor: 'pointer', fontSize: 'var(--text-xs)',
                  }}>
                  {type === 'remise' ? 'Remise' : 'Augm.'}
                </button>
              ))}
            </div>
            <input className="form-input" type="number" step="1" min="0" max="100"
              placeholder="Ex : 10 (facultatif)"
              value={f.ajustement_valeur}
              onChange={e => setF(prev => ({ ...prev, ajustement_valeur: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onValider} disabled={chargement}>
            <Check size={16} /> {labelBouton}
          </button>
          {onAnnuler && (
            <button className="btn btn-secondary" onClick={onAnnuler}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={20} color="var(--color-primary)" strokeWidth={1.8} />
        Lieux de vente
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        {lieux.map(lieu => (
          <div key={lieu.id} className="card" style={{ padding: 'var(--space-4)' }}>
            {enEdition === lieu.id ? (
              <FormulaireLieu
                f={formEdit}
                setF={setFormEdit}
                onValider={() => enregistrerEdition(lieu.id)}
                onAnnuler={() => setEnEdition(null)}
                labelBouton="Enregistrer"
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{lieu.nom}</div>
                  <div className="card-meta">
                    {labelFrais(lieu)}
                    {labelAjustement(lieu) && ` · ${labelAjustement(lieu)}`}
                  </div>
                </div>
                <button
                  onClick={() => { setEnEdition(lieu.id); setFormEdit(formDepuisLieu(lieu)) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  title="Modifier"
                >
                  <Pencil size={16} />
                </button>
                <button onClick={() => supprimer(lieu.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
        {lieux.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Aucun lieu configuré. Ajoute par ex. "Marché de Noël", "Kermesse École", "Marché du jeudi"…
          </p>
        )}
      </div>

      <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
          Ajouter un lieu de vente
        </h3>
        <FormulaireLieu
          f={form}
          setF={setForm}
          onValider={ajouter}
          labelBouton="Ajouter ce lieu"
        />
        {erreur && <p className="form-error" style={{ marginTop: 8 }}>{erreur}</p>}
      </div>
    </div>
  )
}
