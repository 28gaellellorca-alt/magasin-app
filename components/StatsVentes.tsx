'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

type Periode = 'semaine' | 'mois' | 'trimestre' | 'annee' | 'tout'

const FILTRES: { val: Periode; label: string }[] = [
  { val: 'semaine',   label: 'Cette semaine' },
  { val: 'mois',      label: 'Ce mois' },
  { val: 'trimestre', label: 'Ce trimestre' },
  { val: 'annee',     label: 'Cette année' },
  { val: 'tout',      label: 'Tout' },
]

function filtrer(ventes: any[], periode: Periode) {
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

type StatItem = { nom: string; ca: number; marge: number; nbArticles: number; photo?: string }

function agréger(ventes: any[]) {
  const cats = new Map<string, StatItem>()
  const sousCats = new Map<string, StatItem>()
  const produits = new Map<string, StatItem>()

  for (const v of ventes) {
    if (!v.produit) continue
    const ca = v.prix_vente_reel * v.quantite_vendue
    const marge = v.marge_nette
    const nb = v.quantite_vendue

    const catNom = v.produit.categorie?.nom || 'Sans catégorie'
    const c = cats.get(catNom) || { nom: catNom, ca: 0, marge: 0, nbArticles: 0 }
    c.ca += ca; c.marge += marge; c.nbArticles += nb
    cats.set(catNom, c)

    const scNom = v.produit.sous_categorie?.nom
    if (scNom) {
      const sc = sousCats.get(scNom) || { nom: scNom, ca: 0, marge: 0, nbArticles: 0 }
      sc.ca += ca; sc.marge += marge; sc.nbArticles += nb
      sousCats.set(scNom, sc)
    }

    const pid = v.produit.id
    const p = produits.get(pid) || { nom: v.produit.nom, ca: 0, marge: 0, nbArticles: 0, photo: v.photo_url || v.produit.photo_url }
    p.ca += ca; p.marge += marge; p.nbArticles += nb
    produits.set(pid, p)
  }

  const tri = (m: Map<string, StatItem>) => Array.from(m.values()).sort((a, b) => b.ca - a.ca)
  return { cats: tri(cats), sousCats: tri(sousCats), produits: tri(produits).slice(0, 15) }
}

type LieuStat = {
  id: string; nom: string; commissionType: string; commissionValeur: number
  ca: number; margeNette: number; nbArticles: number; nbJours: number
}

function agrégerLieux(ventes: any[]): LieuStat[] {
  const map = new Map<string, LieuStat>()
  const jours = new Map<string, Set<string>>()
  for (const v of ventes) {
    if (v.canal !== 'revendeur' || !v.revendeur) continue
    const id = v.revendeur.id
    const existing = map.get(id) || {
      id, nom: v.revendeur.nom,
      commissionType: v.revendeur.commission_type,
      commissionValeur: v.revendeur.commission_valeur,
      ca: 0, margeNette: 0, nbArticles: 0, nbJours: 0,
    }
    existing.ca += v.prix_vente_reel * v.quantite_vendue
    existing.margeNette += v.marge_nette
    existing.nbArticles += v.quantite_vendue
    map.set(id, existing)
    if (!jours.has(id)) jours.set(id, new Set())
    jours.get(id)!.add(v.date_vente.slice(0, 10))
  }
  const result = Array.from(map.values())
  result.forEach(l => { l.nbJours = jours.get(l.id)?.size || 1 })
  return result.sort((a, b) => b.ca - a.ca)
}

function SectionLieux({ lieux }: { lieux: LieuStat[] }) {
  if (lieux.length === 0) return null
  return (
    <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
        Par lieu de vente
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {lieux.map(lieu => {
          const fraisEntree = lieu.commissionType === 'entree' ? lieu.commissionValeur * lieu.nbJours : 0
          const benefice = lieu.margeNette - fraisEntree
          const rentable = benefice >= 0
          return (
            <div key={lieu.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{lieu.nom}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {lieu.nbArticles} article{lieu.nbArticles > 1 ? 's' : ''} · {lieu.nbJours} événement{lieu.nbJours > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>{euro(lieu.ca)}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>CA brut</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
                {fraisEntree > 0 && (
                  <div style={{ background: 'var(--color-warning-light)', borderRadius: 'var(--radius)', padding: '6px 10px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>Frais d'entrée</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-warning)', fontSize: 'var(--text-sm)' }}>−{euro(fraisEntree)}</div>
                  </div>
                )}
                <div style={{ background: rentable ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: 'var(--radius)', padding: '6px 10px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: rentable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    Bénéfice net {rentable ? '✓' : '✗'}
                  </div>
                  <div style={{ fontWeight: 700, color: rentable ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
                    {euro(benefice)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BarreStats({ items }: { items: StatItem[] }) {
  const max = items[0]?.ca || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {items.map((item, i) => (
        <div key={item.nom} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
              {i === 0 && (
                <span style={{ fontSize: 11, background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-full)', padding: '1px 7px', flexShrink: 0, fontWeight: 600 }}>N°1</span>
              )}
              {'photo' in item && (
                <div style={{ flexShrink: 0 }}>
                  {item.photo ? (
                    <Image src={item.photo} alt={item.nom} width={32} height={32}
                      style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={16} color="var(--color-primary)" />
                    </div>
                  )}
                </div>
              )}
              <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.nom}
              </span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>{euro(item.ca)}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>{euro(item.marge)} marge</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ flex: 1, height: 8, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(item.ca / max) * 100}%`,
                background: i === 0 ? 'var(--color-primary)' : 'var(--color-primary-dark)',
                opacity: i === 0 ? 1 : 0.55 + (0.45 * (1 - i / items.length)),
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
              {item.nbArticles} art.
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Section({ titre, items, vide }: { titre: string; items: StatItem[]; vide: string }) {
  return (
    <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
        {titre}
      </h2>
      {items.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{vide}</p>
      ) : (
        <BarreStats items={items} />
      )}
    </div>
  )
}

export default function StatsVentes({ ventes }: { ventes: any[] }) {
  const [periode, setPeriode] = useState<Periode>('mois')
  const liste = filtrer(ventes, periode)
  const { cats, sousCats, produits } = agréger(liste)
  const lieux = agrégerLieux(liste)
  const caTotal = liste.filter(v => v.produit).reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)

  return (
    <>
      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {FILTRES.map(f => (
          <button
            key={f.val}
            onClick={() => setPeriode(f.val)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${periode === f.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: periode === f.val ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: periode === f.val ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
              fontWeight: periode === f.val ? 600 : 400,
              fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Résumé rapide */}
      {liste.length > 0 && (
        <div className="stat-card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="stat-label">{FILTRES.find(f => f.val === periode)?.label} — CA total</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(caTotal)}</div>
          <div className="stat-sub">{cats.length} catégorie{cats.length > 1 ? 's' : ''} · {produits.length} produit{produits.length > 1 ? 's' : ''} vendus</div>
        </div>
      )}

      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <p>Aucune vente sur cette période.</p>
        </div>
      ) : (
        <>
          <SectionLieux lieux={lieux} />
          <Section titre="Par catégorie" items={cats} vide="Aucune catégorie" />
          {sousCats.length > 0 && (
            <Section titre="Par sous-catégorie" items={sousCats} vide="Aucune sous-catégorie" />
          )}
          <Section titre="Top produits" items={produits} vide="Aucun produit" />
        </>
      )}
    </>
  )
}
