'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const TAUX = 0.123
const NOMS_MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface DonneesMois {
  ca: number; marge: number; nbVentes: number; nbArticles: number
  especes: number; carte: number; direct: number; lieux: number
}

interface Paiement { annee: number; mois: number; date_paiement: string | null }

interface Props {
  annee: number
  anneeActuelle: number
  donneesParMois: DonneesMois[]
  paiements: Paiement[]
}

export default function SuiviURSSAF({ annee, anneeActuelle, donneesParMois, paiements: init }: Props) {
  const [paiements, setPaiements] = useState<Paiement[]>(init)
  const [actionMois, setActionMois] = useState<number | null>(null)
  const [dateSaisie, setDateSaisie] = useState(new Date().toISOString().split('T')[0])
  const [chargement, setChargement] = useState(false)

  const moisActuel = new Date().getMonth()

  function getPaiement(mois: number) {
    return paiements.find(p => p.mois === mois) || null
  }

  async function marquerPayé(mois: number) {
    setChargement(true)
    await supabase.from('urssaf_paiements')
      .upsert({ annee, mois, date_paiement: dateSaisie }, { onConflict: 'annee,mois' })
    setPaiements(prev => [...prev.filter(p => p.mois !== mois), { annee, mois, date_paiement: dateSaisie }])
    setActionMois(null)
    setChargement(false)
  }

  async function annulerPaiement(mois: number) {
    setChargement(true)
    await supabase.from('urssaf_paiements').delete().eq('annee', annee).eq('mois', mois)
    setPaiements(prev => prev.filter(p => p.mois !== mois))
    setChargement(false)
  }

  const totaux = donneesParMois.reduce((acc, m) => ({
    ca: acc.ca + m.ca, marge: acc.marge + m.marge,
    nbVentes: acc.nbVentes + m.nbVentes, nbArticles: acc.nbArticles + m.nbArticles,
    especes: acc.especes + m.especes, carte: acc.carte + m.carte,
    direct: acc.direct + m.direct, lieux: acc.lieux + m.lieux,
  }), { ca: 0, marge: 0, nbVentes: 0, nbArticles: 0, especes: 0, carte: 0, direct: 0, lieux: 0 })

  const dernierMois = annee < anneeActuelle ? 11 : moisActuel
  const moisAfficher = Array.from({ length: dernierMois + 1 }, (_, i) => dernierMois - i)

  return (
    <div>
      {/* Navigation année */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <a href={`/urssaf?annee=${annee - 1}`}
          style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-2)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', textDecoration: 'none' }}>
          <ChevronLeft size={20} />
        </a>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-primary)', minWidth: 60, textAlign: 'center' }}>{annee}</span>
        {annee < anneeActuelle ? (
          <a href={`/urssaf?annee=${annee + 1}`}
            style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-2)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', textDecoration: 'none' }}>
            <ChevronRight size={20} />
          </a>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>

      {/* Totaux annuels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-label">CA {annee}</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(totaux.ca)}</div>
          <div className="stat-sub">{totaux.nbVentes} vente{totaux.nbVentes > 1 ? 's' : ''} · {totaux.nbArticles} art.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Marge totale</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{euro(totaux.marge)}</div>
          <div className="stat-sub">{totaux.ca > 0 ? Math.round(totaux.marge / totaux.ca * 100) : 0}% du CA</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: 'var(--color-warning)' }}>
          <div className="stat-label" style={{ color: 'var(--color-warning)' }}>URSSAF {annee}</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{euro(totaux.ca * TAUX)}</div>
          <div className="stat-sub">12,3% du CA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Espèces / Carte</div>
          <div className="stat-value">{euro(totaux.especes)}</div>
          <div className="stat-sub">Carte : {euro(totaux.carte)}</div>
        </div>
      </div>

      {/* Mois par mois */}
      {moisAfficher.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          Aucune donnée pour {annee}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {moisAfficher.map(moisIndex => {
            const m = donneesParMois[moisIndex]
            const paiement = getPaiement(moisIndex + 1)
            const estPayé = !!paiement?.date_paiement
            const moisPassé = annee < anneeActuelle || moisIndex < moisActuel
            const enRetard = moisPassé && !estPayé && m.ca > 0

            const couleurBord = m.ca === 0 ? 'var(--color-border)'
              : estPayé ? 'var(--color-success)'
              : enRetard ? 'var(--color-danger)'
              : 'var(--color-warning)'

            return (
              <div key={moisIndex} className="card card-body" style={{ borderLeft: `4px solid ${couleurBord}`, padding: 'var(--space-4)' }}>
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: m.ca > 0 ? 'var(--space-3)' : 0, flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {m.ca === 0 ? <Clock size={16} color="var(--color-text-muted)" />
                      : estPayé ? <CheckCircle size={16} color="var(--color-success)" />
                      : enRetard ? <AlertCircle size={16} color="var(--color-danger)" />
                      : <Clock size={16} color="var(--color-warning)" />}
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                      {NOMS_MOIS[moisIndex]}
                    </span>
                    {m.ca === 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>— Aucune vente</span>}
                    {enRetard && <span className="badge badge-danger" style={{ fontSize: 11 }}>URSSAF en retard</span>}
                  </div>
                  {estPayé && paiement?.date_paiement && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
                      Payé le {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                {m.ca > 0 && (
                  <>
                    {/* Grille de stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                      <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>CA</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>{euro(m.ca)}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.nbVentes} vente{m.nbVentes > 1 ? 's' : ''} · {m.nbArticles} art.</div>
                      </div>
                      <div style={{ background: 'var(--color-success-light)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Marge</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>{euro(m.marge)}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{Math.round(m.marge / m.ca * 100)}% du CA</div>
                      </div>
                      <div style={{ background: 'var(--color-warning-light)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>URSSAF</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: 'var(--text-sm)' }}>{euro(m.ca * TAUX)}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>12,3%</div>
                      </div>
                      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Espèces</div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{euro(m.especes)}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Carte : {euro(m.carte)}</div>
                      </div>
                      {(m.direct > 0 || m.lieux > 0) && (
                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Vente directe</div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{euro(m.direct)}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Lieux : {euro(m.lieux)}</div>
                        </div>
                      )}
                      {m.nbVentes > 0 && (
                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Ticket moyen</div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{euro(m.ca / m.nbVentes)}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>par vente</div>
                        </div>
                      )}
                    </div>

                    {/* Bouton URSSAF */}
                    {actionMois === moisIndex ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <label className="form-label" style={{ margin: 0 }}>Date de paiement :</label>
                        <input className="form-input" type="date" value={dateSaisie}
                          onChange={e => setDateSaisie(e.target.value)} style={{ width: 'auto' }} />
                        <button className="btn btn-primary" style={{ fontSize: 'var(--text-sm)', minHeight: 36 }}
                          onClick={() => marquerPayé(moisIndex + 1)} disabled={chargement}>
                          {chargement ? '...' : 'Confirmer'}
                        </button>
                        <button className="btn btn-secondary" style={{ fontSize: 'var(--text-sm)', minHeight: 36 }}
                          onClick={() => setActionMois(null)}>Annuler</button>
                      </div>
                    ) : estPayé ? (
                      <button className="btn btn-secondary"
                        style={{ fontSize: 'var(--text-xs)', minHeight: 32, padding: '4px 12px' }}
                        onClick={() => annulerPaiement(moisIndex + 1)} disabled={chargement}>
                        Annuler le paiement
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ fontSize: 'var(--text-sm)' }}
                        onClick={() => { setActionMois(moisIndex); setDateSaisie(new Date().toISOString().split('T')[0]) }}>
                        Marquer URSSAF payée
                      </button>
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
