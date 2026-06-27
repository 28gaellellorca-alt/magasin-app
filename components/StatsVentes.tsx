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
