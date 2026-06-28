'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'
import BoutonAnnulerVente from '@/components/BoutonAnnulerVente'
import BoutonExportCSV from '@/components/BoutonExportCSV'

type Periode = 'semaine' | 'mois' | 'trimestre' | 'annee' | 'tout'

const FILTRES: { val: Periode; label: string }[] = [
  { val: 'semaine',   label: 'Cette semaine' },
  { val: 'mois',      label: 'Ce mois' },
  { val: 'trimestre', label: 'Ce trimestre' },
  { val: 'annee',     label: 'Cette année' },
  { val: 'tout',      label: 'Tout' },
]

function filtrerPeriode(ventes: any[], periode: Periode) {
  if (periode === 'tout') return ventes
  const now = new Date()
  const annee = now.getFullYear()
  const mois = now.getMonth()
  const trimestre = Math.floor(mois / 3)
  return ventes.filter(v => {
    const d = new Date(v.date_vente)
    if (d.getFullYear() !== annee) return false
    if (periode === 'annee') return true
    if (periode === 'trimestre') return Math.floor(d.getMonth() / 3) === trimestre
    if (periode === 'mois') return d.getMonth() === mois
    return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000
  })
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ListeVentes({ ventes }: { ventes: any[] }) {
  const [periode, setPeriode] = useState<Periode>('mois')
  const [lieuFiltre, setLieuFiltre] = useState<string>('tous')

  const parPeriode = filtrerPeriode(ventes, periode)

  // Lieux qui apparaissent sur la période
  const lieuxPeriode = Array.from(
    new Map(
      parPeriode
        .filter(v => v.canal === 'revendeur')
        .map(v => [v.revendeur_id || 'inconnu', v.revendeur?.nom || v.revendeur_nom || 'Lieu supprimé'])
    ).entries()
  ).map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom))

  const liste = lieuFiltre === 'tous'
    ? parPeriode
    : lieuFiltre === 'direct'
      ? parPeriode.filter(v => v.canal === 'direct')
      : parPeriode.filter(v => v.revendeur_id === lieuFiltre)

  const ca = liste.reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const marge = liste.reduce((s, v) => s + v.marge_nette, 0)
  const panierMoyen = liste.length > 0 ? ca / liste.length : 0

  const caEspeces = liste.filter(v => v.mode_paiement !== 'carte').reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const caCarte = ca - caEspeces
  const caDirect = liste.filter(v => v.canal === 'direct').reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const caLieu = ca - caDirect

  return (
    <>
      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
        {FILTRES.map(f => (
          <button
            key={f.val}
            onClick={() => { setPeriode(f.val); setLieuFiltre('tous') }}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${periode === f.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: periode === f.val ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: periode === f.val ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
              fontWeight: periode === f.val ? 600 : 400,
              fontSize: 'var(--text-sm)', cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <BoutonExportCSV ventes={liste} />
        </div>
      </div>

      {/* Filtre lieu */}
      {lieuxPeriode.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>Canal :</span>
          {[{ id: 'tous', nom: 'Tous' }, { id: 'direct', nom: 'Vente directe' }, ...lieuxPeriode].map(l => (
            <button
              key={l.id}
              onClick={() => setLieuFiltre(l.id)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${lieuFiltre === l.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: lieuFiltre === l.id ? 'var(--color-accent-light)' : 'var(--color-surface)',
                color: lieuFiltre === l.id ? 'var(--color-accent-dark)' : 'var(--color-text-secondary)',
                fontWeight: lieuFiltre === l.id ? 600 : 400,
                fontSize: 'var(--text-xs)', cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {l.nom}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {liste.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div className="stat-card">
              <div className="stat-label">CA · {FILTRES.find(f => f.val === periode)?.label}</div>
              <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(ca)}</div>
              <div className="stat-sub">{liste.length} vente{liste.length > 1 ? 's' : ''}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Marge nette</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>{euro(marge)}</div>
              <div className="stat-sub">{pct(marge, ca)}% du CA</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Panier moyen</div>
              <div className="stat-value">{euro(panierMoyen)}</div>
              <div className="stat-sub">par vente</div>
            </div>
          </div>

          {/* Répartitions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div className="card card-body" style={{ padding: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Paiement</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Repartition label="Espèces" montant={caEspeces} pourcent={pct(caEspeces, ca)} couleur="var(--color-warning)" />
                <Repartition label="Carte" montant={caCarte} pourcent={pct(caCarte, ca)} couleur="var(--color-primary)" />
              </div>
            </div>
            <div className="card card-body" style={{ padding: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Canal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Repartition label="Directe" montant={caDirect} pourcent={pct(caDirect, ca)} couleur="var(--color-success)" />
                <Repartition label="Lieu de vente" montant={caLieu} pourcent={pct(caLieu, ca)} couleur="var(--color-accent)" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Liste */}
      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <p>Aucune vente sur cette période.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {liste.map((v: any) => {
            const photo = v.photo_url || v.produit?.photo_url
            const nomProduit = v.produit?.nom || 'Article supprimé'
            return (
              <div key={v.id} className="card card-body" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  {photo ? (
                    <Image src={photo} alt={nomProduit} width={72} height={72}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={28} color="var(--color-primary)" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 2 }}>
                    {nomProduit}
                    {!v.produit && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 400 }}>(supprimé)</span>}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    {formatDate(v.date_vente)}
                  </div>
                  <div className="card-meta">
                    {v.canal === 'direct' ? 'Vente directe' : `Via ${v.revendeur?.nom || v.revendeur_nom || 'lieu supprimé'}`}
                    {' — '}
                    {v.quantite_vendue} article{v.quantite_vendue > 1 ? 's' : ''}
                    {v.acheteur && <span> — <strong>{v.acheteur}</strong></span>}
                    {' — '}
                    {v.mode_paiement === 'carte' ? 'Carte' : 'Espèces'}
                    {v.remise > 0 && (
                      <span style={{ marginLeft: 6, background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        -{v.remise}%
                      </span>
                    )}
                  </div>
                  {v.notes && (
                    <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      {v.notes}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
                    {euro(v.prix_vente_reel)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: 2 }}>
                    {euro(v.marge_nette)} marge
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <BoutonAnnulerVente venteId={v.id} produitId={v.produit_id} quantiteVendue={v.quantite_vendue} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function Repartition({ label, montant, pourcent, couleur }: { label: string; montant: number; pourcent: number; couleur: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 3 }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({pourcent}%)</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pourcent}%`, background: couleur, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}
