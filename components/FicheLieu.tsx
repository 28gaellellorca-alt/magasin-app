'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, BookOpen, CalendarDays, Check, ChevronDown, ChevronUp,
  Pencil, Plus, TrendingDown, TrendingUp, Trash2, X, Settings,
} from 'lucide-react'

function euro(v: number) {
  return v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Lieu {
  id: string; nom: string
  commission_type: string; commission_valeur: number
  remise_defaut: number; remise_defaut_type: string
}
interface Evenement {
  id: string; nom: string; date: string; revendeur_id: string | null
  cout_emplacement: number; transport: number; autres_frais: number; notes: string | null
}
interface Vente {
  date_vente: string; revendeur_id: string | null
  prix_vente_reel: number; quantite_vendue: number; marge_nette: number
}

/* ── Calcul bilan événement ─────────────────────────────────────────────── */

function calculBilan(ev: Evenement, ventes: Vente[]) {
  const v = ventes.filter(v => v.date_vente.startsWith(ev.date))
  const ca = v.reduce((s, x) => s + x.prix_vente_reel * x.quantite_vendue, 0)
  const beneficeBrut = v.reduce((s, x) => s + x.marge_nette, 0)
  const frais = (ev.cout_emplacement || 0) + (ev.transport || 0) + (ev.autres_frais || 0)
  return { ca, beneficeBrut, frais, beneficeNet: beneficeBrut - frais, nbVentes: v.length }
}

/* ── Formulaire événement (défini HORS du parent pour éviter re-mount) ─── */

type FormEv = {
  nom: string; date: string
  cout_emplacement: string; transport: string; autres_frais: string; notes: string
}
const evVide: FormEv = {
  nom: '', date: new Date().toISOString().split('T')[0],
  cout_emplacement: '', transport: '', autres_frais: '', notes: '',
}
function evDepuis(e: Evenement): FormEv {
  return {
    nom: e.nom, date: e.date,
    cout_emplacement: e.cout_emplacement > 0 ? e.cout_emplacement.toString() : '',
    transport: e.transport > 0 ? e.transport.toString() : '',
    autres_frais: e.autres_frais > 0 ? e.autres_frais.toString() : '',
    notes: e.notes || '',
  }
}

function FormulaireEvenement({ f, setF, onValider, onAnnuler, labelBouton, chargement }: {
  f: FormEv
  setF: (fn: (prev: FormEv) => FormEv) => void
  onValider: () => void
  onAnnuler?: () => void
  labelBouton: string
  chargement: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="form-group">
        <label className="form-label">Nom de l'événement *</label>
        <input className="form-input" placeholder="Ex : Marché de Noël, Kermesse, Vide-grenier…"
          value={f.nom} onChange={e => setF(p => ({ ...p, nom: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" value={f.date}
            onChange={e => setF(p => ({ ...p, date: e.target.value }))} />
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
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Notes libres…"
            value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={onValider} disabled={chargement}>
          <Check size={16} /> {labelBouton}
        </button>
        {onAnnuler && <button className="btn btn-secondary" onClick={onAnnuler}><X size={16} /></button>}
      </div>
    </div>
  )
}

/* ── Formulaire réglages lieu (défini HORS du parent) ───────────────────── */

const TYPES_FRAIS = [
  { val: 'pourcentage', label: '% sur chaque vente', ex: 'Ex : 15% du CA réalisé sur le lieu' },
  { val: 'fixe',        label: 'Montant fixe par article vendu', ex: 'Ex : 2€ déduit par article' },
  { val: 'entree',      label: "Frais d'entrée (total par événement)", ex: 'Ex : 50€ pour louer la table' },
]

type FormLieu = {
  nom: string; commission_type: string; commission_valeur: string
  ajustement_type: 'remise' | 'augmentation'; ajustement_valeur: string; ajustement_unite: 'pct' | 'euro'
}

function lieuVersForm(l: Lieu): FormLieu {
  const adj = l.remise_defaut || 0
  return {
    nom: l.nom, commission_type: l.commission_type,
    commission_valeur: l.commission_valeur?.toString() || '',
    ajustement_type: adj < 0 ? 'augmentation' : 'remise',
    ajustement_valeur: adj !== 0 ? Math.abs(adj).toString() : '',
    ajustement_unite: l.remise_defaut_type === 'euro' ? 'euro' : 'pct',
  }
}

function FormulaireReglages({ f, setF, onValider, onAnnuler, chargement }: {
  f: FormLieu
  setF: (fn: (prev: FormLieu) => FormLieu) => void
  onValider: () => void
  onAnnuler: () => void
  chargement: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="form-group">
        <label className="form-label">Nom du lieu</label>
        <input className="form-input" value={f.nom}
          onChange={e => setF(p => ({ ...p, nom: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="form-group">
          <label className="form-label">Type de frais</label>
          <select className="form-input" value={f.commission_type}
            onChange={e => setF(p => ({ ...p, commission_type: e.target.value, commission_valeur: '' }))}>
            {TYPES_FRAIS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
          </select>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {TYPES_FRAIS.find(t => t.val === f.commission_type)?.ex}
          </span>
        </div>
        <div className="form-group">
          <label className="form-label">{f.commission_type === 'pourcentage' ? 'Taux (%)' : 'Montant (€)'}</label>
          <input className="form-input" type="number" step="0.01" min="0"
            placeholder={f.commission_type === 'pourcentage' ? 'Ex : 15' : 'Ex : 50'}
            value={f.commission_valeur}
            onChange={e => setF(p => ({ ...p, commission_valeur: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Ajustement auto (remise ou augm.)</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            {(['remise', 'augmentation'] as const).map(type => (
              <button key={type} type="button"
                onClick={() => setF(p => ({ ...p, ajustement_type: type }))}
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  border: `2px solid ${f.ajustement_type === type ? (type === 'remise' ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-border)'}`,
                  background: f.ajustement_type === type ? (type === 'remise' ? 'var(--color-warning-light)' : 'var(--color-success-light)') : 'var(--color-surface)',
                  color: f.ajustement_type === type ? (type === 'remise' ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-text-secondary)',
                  fontWeight: f.ajustement_type === type ? 600 : 400,
                }}>
                {type === 'remise' ? 'Remise' : 'Augmentation'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <input className="form-input" type="number" step="0.01" min="0"
              placeholder={`Ex : ${f.ajustement_unite === 'pct' ? '10' : '2'} (facultatif)`}
              value={f.ajustement_valeur}
              onChange={e => setF(p => ({ ...p, ajustement_valeur: e.target.value }))}
              style={{ flex: 1 }} />
            {(['pct', 'euro'] as const).map(u => (
              <button key={u} type="button"
                onClick={() => setF(p => ({ ...p, ajustement_unite: u, ajustement_valeur: '' }))}
                style={{
                  padding: '5px 10px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 'var(--text-xs)',
                  border: `2px solid ${f.ajustement_unite === u ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: f.ajustement_unite === u ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: f.ajustement_unite === u ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                  fontWeight: f.ajustement_unite === u ? 600 : 400, minHeight: 36,
                }}>
                {u === 'pct' ? '%' : '€'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={onValider} disabled={chargement}>
          <Check size={16} /> Enregistrer les réglages
        </button>
        <button className="btn btn-secondary" onClick={onAnnuler}><X size={16} /></button>
      </div>
    </div>
  )
}

/* ── Composant principal ────────────────────────────────────────────────── */

export default function FicheLieu({ lieu: initLieu, evenements: initEv, ventes, revendeurs }: {
  lieu: Lieu
  evenements: Evenement[]
  ventes: Vente[]
  revendeurs: { id: string; nom: string }[]
}) {
  const [lieu, setLieu] = useState(initLieu)
  const [evenements, setEvenements] = useState(initEv)

  // Événements
  const [showFormEv, setShowFormEv] = useState(false)
  const [formEv, setFormEv] = useState<FormEv>(evVide)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [enEditionEv, setEnEditionEv] = useState<string | null>(null)
  const [formEditEv, setFormEditEv] = useState<FormEv>(evVide)
  const [chargementEv, setChargementEv] = useState(false)

  // Réglages
  const [showReglages, setShowReglages] = useState(false)
  const [formLieu, setFormLieu] = useState<FormLieu>(lieuVersForm(initLieu))
  const [chargementLieu, setChargementLieu] = useState(false)

  // Stats globales pour ce lieu
  const bilans = evenements.map(ev => calculBilan(ev, ventes))
  const totalCA = bilans.reduce((s, b) => s + b.ca, 0)
  const totalNet = bilans.reduce((s, b) => s + b.beneficeNet, 0)
  const totalFrais = bilans.reduce((s, b) => s + b.frais, 0)
  const totalVentes = ventes.length

  /* ── Actions événements ─────────────────────────────────────────────── */

  async function ajouterEv() {
    if (!formEv.nom.trim() || !formEv.date) return
    setChargementEv(true)
    const { data, error } = await supabase.from('evenements').insert({
      nom: formEv.nom.trim(), date: formEv.date,
      revendeur_id: lieu.id,
      cout_emplacement: parseFloat(formEv.cout_emplacement) || 0,
      transport: parseFloat(formEv.transport) || 0,
      autres_frais: parseFloat(formEv.autres_frais) || 0,
      notes: formEv.notes.trim() || null,
    }).select('*').single()
    if (!error && data) {
      setEvenements(prev => [data as any, ...prev])
      setFormEv(evVide)
      setShowFormEv(false)
    }
    setChargementEv(false)
  }

  async function enregistrerEv(id: string) {
    if (!formEditEv.nom.trim() || !formEditEv.date) return
    const { data, error } = await supabase.from('evenements').update({
      nom: formEditEv.nom.trim(), date: formEditEv.date,
      cout_emplacement: parseFloat(formEditEv.cout_emplacement) || 0,
      transport: parseFloat(formEditEv.transport) || 0,
      autres_frais: parseFloat(formEditEv.autres_frais) || 0,
      notes: formEditEv.notes.trim() || null,
    }).eq('id', id).select('*').single()
    if (!error && data) {
      setEvenements(prev => prev.map(e => e.id === id ? data as any : e))
      setEnEditionEv(null)
    }
  }

  async function supprimerEv(id: string) {
    if (!confirm('Supprimer cet événement ? Les ventes restent enregistrées.')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(prev => prev.filter(e => e.id !== id))
    if (ouvert === id) setOuvert(null)
  }

  /* ── Actions réglages ───────────────────────────────────────────────── */

  async function enregistrerReglages() {
    const nom = formLieu.nom.trim()
    const val = parseFloat(formLieu.commission_valeur)
    if (!nom || isNaN(val) || val < 0) return
    setChargementLieu(true)
    const adj = parseFloat(formLieu.ajustement_valeur) || 0
    const remise_defaut = formLieu.ajustement_type === 'augmentation' ? -adj : adj
    const { data, error } = await supabase.from('revendeurs').update({
      nom, commission_type: formLieu.commission_type, commission_valeur: val,
      remise_defaut,
      remise_defaut_type: adj > 0 ? formLieu.ajustement_unite : 'pct',
    }).eq('id', lieu.id).select('*').single()
    if (!error && data) {
      setLieu(data as any)
      setShowReglages(false)
    }
    setChargementLieu(false)
  }

  function labelFrais(l: Lieu) {
    if (l.commission_type === 'pourcentage') return `${l.commission_valeur}% du CA`
    if (l.commission_type === 'fixe') return `${euro(l.commission_valeur)} par article`
    if (l.commission_type === 'entree') return `${euro(l.commission_valeur)} d'entrée par événement`
    return ''
  }

  function labelAjust(l: Lieu) {
    if (!l.remise_defaut) return null
    const val = Math.abs(l.remise_defaut)
    const unite = l.remise_defaut_type === 'euro' ? '€' : '%'
    return l.remise_defaut > 0 ? `Remise auto ${val}${unite}` : `Augmentation auto ${val}${unite}`
  }

  /* ── Rendu ──────────────────────────────────────────────────────────── */

  return (
    <div className="page-container">
      {/* En-tête */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/evenements" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none', marginBottom: 'var(--space-3)' }}>
          <ArrowLeft size={15} /> Retour aux marchés
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{lieu.nom}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 4, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              <span>{labelFrais(lieu)}</span>
              {labelAjust(lieu) && <span>· {labelAjust(lieu)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ gap: 6, fontSize: 'var(--text-sm)' }}
              onClick={() => { setShowReglages(v => !v); setFormLieu(lieuVersForm(lieu)) }}
            >
              <Settings size={15} /> Réglages
            </button>
            <Link href={`/catalogue/${lieu.id}`} className="btn btn-accent" style={{ gap: 6, fontSize: 'var(--text-sm)' }}>
              <BookOpen size={15} /> Catalogue
            </Link>
          </div>
        </div>
      </div>

      {/* Panneau réglages (dépliable) */}
      {showReglages && (
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} /> Réglages de ce lieu
          </h2>
          <FormulaireReglages
            f={formLieu} setF={setFormLieu}
            onValider={enregistrerReglages}
            onAnnuler={() => setShowReglages(false)}
            chargement={chargementLieu}
          />
        </div>
      )}

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-label">{evenements.length} événement{evenements.length > 1 ? 's' : ''}</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(totalCA)}</div>
          <div className="stat-sub">CA total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Frais cumulés</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{euro(totalFrais)}</div>
          <div className="stat-sub">Tous événements</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: totalNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
          <div className="stat-label" style={{ color: totalNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>Bénéfice net</div>
          <div className="stat-value" style={{ color: totalNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{euro(totalNet)}</div>
          <div className="stat-sub">Après tous les frais</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ventes</div>
          <div className="stat-value">{totalVentes}</div>
          <div className="stat-sub">Articles vendus ici</div>
        </div>
      </div>

      {/* En-tête section événements */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={18} color="var(--color-primary)" strokeWidth={1.8} />
          Événements
        </h2>
        <button className="btn btn-accent" style={{ gap: 6 }} onClick={() => setShowFormEv(v => !v)}>
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      {/* Formulaire nouvel événement */}
      {showFormEv && (
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Nouvel événement</h3>
          <FormulaireEvenement
            f={formEv} setF={setFormEv}
            onValider={ajouterEv}
            onAnnuler={() => setShowFormEv(false)}
            labelBouton="Créer l'événement"
            chargement={chargementEv}
          />
        </div>
      )}

      {/* Liste des événements */}
      {evenements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
          <CalendarDays size={40} strokeWidth={1} style={{ margin: '0 auto var(--space-3)' }} />
          <p style={{ marginBottom: 6 }}>Aucun événement enregistré pour ce lieu.</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Ajoute ton premier passage pour suivre le bilan.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {evenements.map(ev => {
            const b = calculBilan(ev, ventes)
            const positif = b.beneficeNet >= 0
            return (
              <div key={ev.id} className="card">
                {enEditionEv === ev.id ? (
                  <div style={{ padding: 'var(--space-4)' }}>
                    <FormulaireEvenement
                      f={formEditEv} setF={setFormEditEv}
                      onValider={() => enregistrerEv(ev.id)}
                      onAnnuler={() => setEnEditionEv(null)}
                      labelBouton="Enregistrer"
                      chargement={chargementEv}
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ padding: 'var(--space-4)', borderBottom: ouvert === ev.id ? '1px solid var(--color-border)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 2 }}>
                            {ev.nom}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {formatDate(ev.date)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => { setEnEditionEv(ev.id); setFormEditEv(evDepuis(ev)) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => supprimerEv(ev.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                          <button onClick={() => setOuvert(o => o === ev.id ? null : ev.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                            {ouvert === ev.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Bilan rapide */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                        {[
                          { label: 'CA', val: euro(b.ca), color: 'var(--color-primary)' },
                          { label: 'Bénéf. brut', val: euro(b.beneficeBrut), color: undefined },
                          { label: 'Frais', val: b.frais > 0 ? `−${euro(b.frais)}` : '—', color: b.frais > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' },
                        ].map(({ label, val, color }) => (
                          <div key={label} style={{ textAlign: 'center', padding: '6px 0' }}>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color }}>{val}</div>
                          </div>
                        ))}
                        <div style={{ textAlign: 'center', padding: '6px 0', background: positif ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: 'var(--radius)' }}>
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
                        {b.frais === 0 && <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucun frais renseigné</div>}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {b.nbVentes > 0
                              ? `${b.nbVentes} vente${b.nbVentes > 1 ? 's' : ''} rattachée${b.nbVentes > 1 ? 's' : ''}`
                              : 'Aucune vente enregistrée ce jour-là'
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
