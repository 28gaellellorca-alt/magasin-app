'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarDays, ChevronDown, ChevronUp, Trash2, Plus, Pencil, Check, X, TrendingUp, TrendingDown } from 'lucide-react'

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

interface Vente {
  date_vente: string
  revendeur_id: string | null
  prix_vente_reel: number
  quantite_vendue: number
  marge_nette: number
}

interface Evenement {
  id: string
  nom: string
  date: string
  revendeur_id: string | null
  cout_emplacement: number
  transport: number
  autres_frais: number
  notes: string | null
  revendeur: { id: string; nom: string } | null
}

interface Revendeur { id: string; nom: string }

type FormEv = {
  nom: string
  date: string
  revendeur_id: string
  cout_emplacement: string
  transport: string
  autres_frais: string
  notes: string
}

const formVide: FormEv = {
  nom: '', date: new Date().toISOString().split('T')[0],
  revendeur_id: '', cout_emplacement: '', transport: '', autres_frais: '', notes: '',
}

function formDepuisEv(e: Evenement): FormEv {
  return {
    nom: e.nom, date: e.date,
    revendeur_id: e.revendeur_id || '',
    cout_emplacement: e.cout_emplacement > 0 ? e.cout_emplacement.toString() : '',
    transport: e.transport > 0 ? e.transport.toString() : '',
    autres_frais: e.autres_frais > 0 ? e.autres_frais.toString() : '',
    notes: e.notes || '',
  }
}

function calculBilan(ev: Evenement, ventes: Vente[]) {
  const ventesEv = ev.revendeur_id
    ? ventes.filter(v => v.date_vente.startsWith(ev.date) && v.revendeur_id === ev.revendeur_id)
    : []
  const ca = ventesEv.reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const beneficeBrut = ventesEv.reduce((s, v) => s + v.marge_nette, 0)
  const frais = (ev.cout_emplacement || 0) + (ev.transport || 0) + (ev.autres_frais || 0)
  const beneficeNet = beneficeBrut - frais
  return { ca, beneficeBrut, frais, beneficeNet, nbVentes: ventesEv.length }
}

// Défini EN DEHORS du composant parent pour éviter le re-mount à chaque frappe
function FormulaireEvenement({ f, setF, onValider, onAnnuler, labelBouton, chargement, revendeurs }: {
  f: FormEv
  setF: (fn: (prev: FormEv) => FormEv) => void
  onValider: () => void
  onAnnuler?: () => void
  labelBouton: string
  chargement: boolean
  revendeurs: Revendeur[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="form-group">
        <label className="form-label">Nom de l'événement *</label>
        <input className="form-input" placeholder="Ex : Marché de Noël Bordeaux, Kermesse École…"
          value={f.nom} onChange={e => setF(p => ({ ...p, nom: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" value={f.date}
            onChange={e => setF(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Lieu de vente</label>
          <select className="form-input" value={f.revendeur_id}
            onChange={e => setF(p => ({ ...p, revendeur_id: e.target.value }))}>
            <option value="">Aucun / vente directe</option>
            {revendeurs.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Coût emplacement (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" placeholder="0"
            value={f.cout_emplacement} onChange={e => setF(p => ({ ...p, cout_emplacement: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Transport (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" placeholder="0"
            value={f.transport} onChange={e => setF(p => ({ ...p, transport: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Autres frais (€)</label>
          <input className="form-input" type="number" step="0.01" min="0" placeholder="0"
            value={f.autres_frais} onChange={e => setF(p => ({ ...p, autres_frais: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Notes libres…"
            value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={onValider} disabled={chargement}>
          <Check size={16} /> {labelBouton}
        </button>
        {onAnnuler && (
          <button className="btn btn-secondary" onClick={onAnnuler}><X size={16} /></button>
        )}
      </div>
    </div>
  )
}

export default function GestionEvenements({ evenements: init, ventes, revendeurs }: {
  evenements: Evenement[]
  ventes: Vente[]
  revendeurs: Revendeur[]
}) {
  const [evenements, setEvenements] = useState(init)
  const [form, setForm] = useState<FormEv>(formVide)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [enEdition, setEnEdition] = useState<string | null>(null)
  const [formEdit, setFormEdit] = useState<FormEv>(formVide)
  const [chargement, setChargement] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function ajouter() {
    if (!form.nom.trim() || !form.date) return
    setChargement(true)
    const { data, error } = await supabase.from('evenements').insert({
      nom: form.nom.trim(),
      date: form.date,
      revendeur_id: form.revendeur_id || null,
      cout_emplacement: parseFloat(form.cout_emplacement) || 0,
      transport: parseFloat(form.transport) || 0,
      autres_frais: parseFloat(form.autres_frais) || 0,
      notes: form.notes.trim() || null,
    }).select('*, revendeur:revendeurs(id, nom)').single()
    if (!error && data) {
      setEvenements(prev => [data as any, ...prev])
      setForm(formVide)
      setShowForm(false)
    }
    setChargement(false)
  }

  async function enregistrerEdition(id: string) {
    if (!formEdit.nom.trim() || !formEdit.date) return
    const { data, error } = await supabase.from('evenements').update({
      nom: formEdit.nom.trim(),
      date: formEdit.date,
      revendeur_id: formEdit.revendeur_id || null,
      cout_emplacement: parseFloat(formEdit.cout_emplacement) || 0,
      transport: parseFloat(formEdit.transport) || 0,
      autres_frais: parseFloat(formEdit.autres_frais) || 0,
      notes: formEdit.notes.trim() || null,
    }).eq('id', id).select('*, revendeur:revendeurs(id, nom)').single()
    if (!error && data) {
      setEvenements(prev => prev.map(e => e.id === id ? data as any : e))
      setEnEdition(null)
    }
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cet événement ? Le bilan sera perdu, mais les ventes restent enregistrées.')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(prev => prev.filter(e => e.id !== id))
    if (ouvert === id) setOuvert(null)
  }

  // Résumé global
  const bilanTotal = evenements.map(ev => calculBilan(ev, ventes))
  const totalNet = bilanTotal.reduce((s, b) => s + b.beneficeNet, 0)
  const totalCA = bilanTotal.reduce((s, b) => s + b.ca, 0)
  const totalFrais = bilanTotal.reduce((s, b) => s + b.frais, 0)

  return (
    <div>
      {/* Récap global si plusieurs événements */}
      {evenements.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <div className="stat-card">
            <div className="stat-label">{evenements.length} événements</div>
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(totalCA)}</div>
            <div className="stat-sub">CA total cumulé</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Frais cumulés</div>
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{euro(totalFrais)}</div>
            <div className="stat-sub">Tous événements</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: totalNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            <div className="stat-label" style={{ color: totalNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>Bénéfice net total</div>
            <div className="stat-value" style={{ color: totalNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{euro(totalNet)}</div>
            <div className="stat-sub">Après tous les frais</div>
          </div>
        </div>
      )}

      {/* Bouton nouvel événement */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <button className="btn btn-accent" onClick={() => setShowForm(v => !v)}>
          <Plus size={18} /> Nouvel événement
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Nouvel événement</h3>
          <FormulaireEvenement
            f={form} setF={setForm}
            onValider={ajouter}
            onAnnuler={() => setShowForm(false)}
            labelBouton="Créer l'événement"
            chargement={chargement}
            revendeurs={revendeurs}
          />
        </div>
      )}

      {/* Liste des événements */}
      {evenements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <CalendarDays size={48} strokeWidth={1} style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ marginBottom: 'var(--space-2)' }}>Aucun événement enregistré.</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Crée un événement pour suivre le bilan de chaque marché ou kermesse.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {evenements.map(ev => {
            const b = calculBilan(ev, ventes)
            const positif = b.beneficeNet >= 0

            return (
              <div key={ev.id} className="card">
                {enEdition === ev.id ? (
                  <div style={{ padding: 'var(--space-4)' }}>
                    <FormulaireEvenement
                      f={formEdit} setF={setFormEdit}
                      onValider={() => enregistrerEdition(ev.id)}
                      onAnnuler={() => setEnEdition(null)}
                      labelBouton="Enregistrer"
                      chargement={chargement}
                      revendeurs={revendeurs}
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ padding: 'var(--space-4)', borderBottom: ouvert === ev.id ? '1px solid var(--color-border)' : 'none' }}>
                      {/* Titre + actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                            {ev.nom}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {formatDate(ev.date)}{(ev.revendeur as any)?.nom && ` · ${(ev.revendeur as any).nom}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                          <button onClick={() => { setEnEdition(ev.id); setFormEdit(formDepuisEv(ev)) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => supprimer(ev.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                          <button onClick={() => setOuvert(o => o === ev.id ? null : ev.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                            {ouvert === ev.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Bilan rapide */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                        <div style={{ textAlign: 'center', padding: '6px 0' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>CA</div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>{euro(b.ca)}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '6px 0' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>Bénéf. brut</div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{euro(b.beneficeBrut)}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '6px 0' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>Frais</div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: b.frais > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                            {b.frais > 0 ? `−${euro(b.frais)}` : '—'}
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'center', padding: '6px 0',
                          background: positif ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                          borderRadius: 'var(--radius)',
                        }}>
                          <div style={{ fontSize: 10, color: positif ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            {positif ? <TrendingUp size={10} /> : <TrendingDown size={10} />} Net
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: positif ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {euro(b.beneficeNet)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Détail dépliable */}
                    {ouvert === ev.id && (
                      <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Détail des frais</div>
                        {ev.cout_emplacement > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Coût emplacement</span>
                            <span style={{ color: 'var(--color-warning)' }}>−{euro(ev.cout_emplacement)}</span>
                          </div>
                        )}
                        {ev.transport > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Transport</span>
                            <span style={{ color: 'var(--color-warning)' }}>−{euro(ev.transport)}</span>
                          </div>
                        )}
                        {ev.autres_frais > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Autres frais</span>
                            <span style={{ color: 'var(--color-warning)' }}>−{euro(ev.autres_frais)}</span>
                          </div>
                        )}
                        {b.frais === 0 && (
                          <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucun frais renseigné</div>
                        )}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {b.nbVentes > 0
                              ? `${b.nbVentes} vente${b.nbVentes > 1 ? 's' : ''} rattachée${b.nbVentes > 1 ? 's' : ''} (même jour, même lieu)`
                              : ev.revendeur_id
                                ? 'Aucune vente enregistrée pour ce lieu ce jour-là'
                                : 'Sélectionne un lieu pour rattacher les ventes automatiquement'
                            }
                          </span>
                          {b.nbVentes > 0 && <span style={{ fontWeight: 600 }}>{euro(b.ca)}</span>}
                        </div>
                        {ev.notes && (
                          <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
                            {ev.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
