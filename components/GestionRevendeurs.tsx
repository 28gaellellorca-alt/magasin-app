'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

interface Props { revendeurs: any[] }

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function GestionRevendeurs({ revendeurs: initRevs }: Props) {
  const [revs, setRevs] = useState(initRevs)
  const [form, setForm] = useState({ nom: '', commission_type: 'pourcentage', commission_valeur: '' })
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function ajouter() {
    const nom = form.nom.trim()
    const val = parseFloat(form.commission_valeur)
    if (!nom) { setErreur('Nom obligatoire.'); return }
    if (isNaN(val) || val < 0) { setErreur('Commission invalide.'); return }
    setErreur('')
    setChargement(true)
    const { data, error } = await supabase.from('revendeurs').insert({
      nom, commission_type: form.commission_type, commission_valeur: val
    }).select().single()
    if (!error && data) {
      setRevs(r => [...r, data])
      setForm({ nom: '', commission_type: 'pourcentage', commission_valeur: '' })
    }
    setChargement(false)
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce revendeur ?')) return
    await supabase.from('revendeurs').delete().eq('id', id)
    setRevs(r => r.filter(rev => rev.id !== id))
  }

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Revendeurs</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        {revs.map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{r.nom}</div>
              <div className="card-meta">
                Commission : {r.commission_type === 'pourcentage' ? `${r.commission_valeur}%` : euro(r.commission_valeur)} ({r.commission_type === 'pourcentage' ? 'du prix de vente' : 'fixe'})
              </div>
            </div>
            <button onClick={() => supprimer(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {revs.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Aucun revendeur configuré.</p>}
      </div>

      <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Ajouter un revendeur</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">Nom du revendeur</label>
            <input className="form-input" placeholder="Ex : Vinted, Marché du jeudi..."
              value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Type de commission</label>
              <select className="form-input" value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}>
                <option value="pourcentage">Pourcentage (%)</option>
                <option value="fixe">Montant fixe (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{form.commission_type === 'pourcentage' ? 'Commission (%)' : 'Commission (€)'}</label>
              <input className="form-input" type="number" step="0.01" min="0"
                placeholder={form.commission_type === 'pourcentage' ? 'Ex : 5' : 'Ex : 2.50'}
                value={form.commission_valeur} onChange={e => setForm(f => ({ ...f, commission_valeur: e.target.value }))} />
            </div>
          </div>
          {erreur && <p className="form-error">{erreur}</p>}
          <button className="btn btn-primary" onClick={ajouter} disabled={chargement}>
            <Plus size={18} /> Ajouter ce revendeur
          </button>
        </div>
      </div>
    </div>
  )
}
