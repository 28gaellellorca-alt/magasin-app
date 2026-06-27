'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

const TAUX = 0.123

const TRIMESTRES = [
  { num: 1, label: 'T1', mois: 'Janv – Mars', fin: 2, deadline: '30 avril' },
  { num: 2, label: 'T2', mois: 'Avr – Juin', fin: 5, deadline: '31 juillet' },
  { num: 3, label: 'T3', mois: 'Juil – Sept', fin: 8, deadline: '31 octobre' },
  { num: 4, label: 'T4', mois: 'Oct – Déc', fin: 11, deadline: '31 janv. année suivante' },
]

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface Paiement { annee: number; trimestre: number; date_paiement: string | null }
interface Props { annee: number; caParTrimestre: number[]; paiements: Paiement[] }

export default function SuiviURSSAF({ annee, caParTrimestre, paiements: init }: Props) {
  const [paiements, setPaiements] = useState<Paiement[]>(init)
  const [actionT, setActionT] = useState<number | null>(null)
  const [dateSaisie, setDateSaisie] = useState(new Date().toISOString().split('T')[0])
  const [chargement, setChargement] = useState(false)

  const moisActuel = new Date().getMonth()
  const anneeActuelle = new Date().getFullYear()

  function getPaiement(t: number) {
    return paiements.find(p => p.trimestre === t) || null
  }

  async function marquerPayé(trimestre: number) {
    setChargement(true)
    await supabase.from('urssaf_paiements')
      .upsert({ annee, trimestre, date_paiement: dateSaisie }, { onConflict: 'annee,trimestre' })
    setPaiements(prev => [...prev.filter(p => p.trimestre !== trimestre), { annee, trimestre, date_paiement: dateSaisie }])
    setActionT(null)
    setChargement(false)
  }

  async function annulerPaiement(trimestre: number) {
    setChargement(true)
    await supabase.from('urssaf_paiements').delete().eq('annee', annee).eq('trimestre', trimestre)
    setPaiements(prev => prev.filter(p => p.trimestre !== trimestre))
    setChargement(false)
  }

  const caTotal = caParTrimestre.reduce((s, c) => s + c, 0)

  return (
    <div>
      {/* Récap annuel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-label">CA {annee}</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(caTotal)}</div>
          <div className="stat-sub">Chiffre d'affaires annuel</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: 'var(--color-warning)' }}>
          <div className="stat-label" style={{ color: 'var(--color-warning)' }}>URSSAF totale</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{euro(caTotal * TAUX)}</div>
          <div className="stat-sub">12,3% du CA annuel</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: 'var(--color-success)' }}>
          <div className="stat-label" style={{ color: 'var(--color-success)' }}>Trimestres payés</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {paiements.filter(p => p.date_paiement).length} / 4
          </div>
          <div className="stat-sub">cette année</div>
        </div>
      </div>

      {/* Tableau trimestriel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {TRIMESTRES.map(t => {
          const ca = caParTrimestre[t.num - 1] || 0
          const cotisations = ca * TAUX
          const paiement = getPaiement(t.num)
          const estPayé = !!paiement?.date_paiement
          const trimestrePassé = annee < anneeActuelle || (annee === anneeActuelle && moisActuel > t.fin)
          const enRetard = trimestrePassé && !estPayé

          const couleurBord = estPayé
            ? 'var(--color-success)'
            : enRetard ? 'var(--color-danger)'
            : trimestrePassé ? 'var(--color-warning)'
            : 'var(--color-border)'

          return (
            <div key={t.num} className="card card-body" style={{ borderLeft: `4px solid ${couleurBord}`, padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {estPayé
                    ? <CheckCircle size={22} color="var(--color-success)" />
                    : enRetard ? <AlertCircle size={22} color="var(--color-danger)" />
                    : <Clock size={22} color={trimestrePassé ? 'var(--color-warning)' : 'var(--color-text-muted)'} />
                  }
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                      {t.label} {annee} — {t.mois}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      À déclarer avant le {t.deadline}
                      {estPayé && paiement?.date_paiement && (
                        <span style={{ color: 'var(--color-success)', marginLeft: 8, fontWeight: 600 }}>
                          · Payé le {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {enRetard && (
                        <span style={{ color: 'var(--color-danger)', marginLeft: 8, fontWeight: 600 }}>· En retard !</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>{euro(ca)}</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-warning)', fontSize: 'var(--text-sm)' }}>{euro(cotisations)}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>à reverser</div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                {actionT === t.num ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Date de paiement :</label>
                    <input className="form-input" type="date" value={dateSaisie}
                      onChange={e => setDateSaisie(e.target.value)} style={{ width: 'auto' }} />
                    <button className="btn btn-primary" style={{ fontSize: 'var(--text-sm)', minHeight: 36 }}
                      onClick={() => marquerPayé(t.num)} disabled={chargement}>
                      {chargement ? '...' : 'Confirmer'}
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: 'var(--text-sm)', minHeight: 36 }}
                      onClick={() => setActionT(null)}>
                      Annuler
                    </button>
                  </div>
                ) : estPayé ? (
                  <button className="btn btn-secondary"
                    style={{ fontSize: 'var(--text-xs)', minHeight: 32, padding: '4px 12px' }}
                    onClick={() => annulerPaiement(t.num)} disabled={chargement}>
                    Annuler le paiement
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: 'var(--text-sm)' }}
                    onClick={() => { setActionT(t.num); setDateSaisie(new Date().toISOString().split('T')[0]) }}>
                    Marquer comme payé
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        Taux applicable : 12,3% du CA pour la vente de marchandises en micro-entreprise.
        Les montants affichés sont des estimations basées sur tes ventes enregistrées.
      </div>
    </div>
  )
}
