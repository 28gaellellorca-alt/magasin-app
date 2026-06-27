'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, MapPin } from 'lucide-react'

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

export default function GestionRevendeurs({ revendeurs: init }: Props) {
  const [lieux, setLieux] = useState(init)
  const [form, setForm] = useState({
    nom: '', commission_type: 'pourcentage', commission_valeur: '', remise_defaut: '',
  })
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

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
      remise_defaut: parseFloat(form.remise_defaut) || 0,
    }).select().single()
    if (!error && data) {
      setLieux(l => [...l, data])
      setForm({ nom: '', commission_type: 'pourcentage', commission_valeur: '', remise_defaut: '' })
    }
    setChargement(false)
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

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={20} color="var(--color-primary)" strokeWidth={1.8} />
        Lieux de vente
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        {lieux.map(lieu => (
          <div key={lieu.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{lieu.nom}</div>
              <div className="card-meta">
                {labelFrais(lieu)}
                {(lieu.remise_defaut > 0) && ` · remise automatique ${lieu.remise_defaut}% sur tes prix`}
              </div>
            </div>
            <button onClick={() => supprimer(lieu.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
              <Trash2 size={18} />
            </button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Nom du lieu</label>
            <input className="form-input" placeholder="Ex : Marché de Noël, Kermesse École…"
              value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Type de frais</label>
            <select className="form-input" value={form.commission_type}
              onChange={e => setForm(f => ({ ...f, commission_type: e.target.value, commission_valeur: '' }))}>
              {TYPES_FRAIS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
            </select>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {TYPES_FRAIS.find(t => t.val === form.commission_type)?.ex}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">
                {form.commission_type === 'pourcentage' ? 'Taux (%)' : 'Montant (€)'}
              </label>
              <input className="form-input" type="number" step="0.01" min="0"
                placeholder={form.commission_type === 'pourcentage' ? 'Ex : 15' : 'Ex : 50'}
                value={form.commission_valeur}
                onChange={e => setForm(f => ({ ...f, commission_valeur: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Remise auto sur tes prix (%)</label>
              <input className="form-input" type="number" step="1" min="0" max="100"
                placeholder="Ex : 10 (facultatif)"
                value={form.remise_defaut}
                onChange={e => setForm(f => ({ ...f, remise_defaut: e.target.value }))} />
            </div>
          </div>

          {erreur && <p className="form-error">{erreur}</p>}
          <button className="btn btn-primary" onClick={ajouter} disabled={chargement}>
            <Plus size={18} /> Ajouter ce lieu
          </button>
        </div>
      </div>
    </div>
  )
}
