export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Package, PlusCircle, ShoppingBag, AlertTriangle } from 'lucide-react'

const SEUIL_TVA = 85000
const TAUX_URSSAF = 0.123 // 12,3% pour vente de marchandises en micro-entreprise

async function getDashboardData() {
  const [{ data: produits }, { data: ventes }] = await Promise.all([
    supabase.from('produits').select('*, categorie:categories(nom)'),
    supabase.from('ventes').select('prix_vente_reel, quantite_vendue, marge_nette, date_vente'),
  ])

  const now = new Date()
  const moisCourant = now.getMonth()
  const trimestreCourant = Math.floor(moisCourant / 3)
  const annee = now.getFullYear()

  const filtrer = (v: any, periode: 'mois' | 'trimestre' | 'annee') => {
    const d = new Date(v.date_vente)
    if (d.getFullYear() !== annee) return false
    if (periode === 'annee') return true
    if (periode === 'trimestre') return Math.floor(d.getMonth() / 3) === trimestreCourant
    return d.getMonth() === moisCourant
  }

  const ca = (liste: any[]) => liste.reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const marge = (liste: any[]) => liste.reduce((s, v) => s + v.marge_nette, 0)

  const toutesVentes = ventes || []
  const ventesMois = toutesVentes.filter(v => filtrer(v, 'mois'))
  const ventesTrimestre = toutesVentes.filter(v => filtrer(v, 'trimestre'))
  const ventesAnnee = toutesVentes.filter(v => filtrer(v, 'annee'))

  const produitsDispos = (produits || []).filter(p => p.etat === 'disponible')
  const valeurStock = produitsDispos.reduce((s, p) => s + p.prix_revient * p.quantite, 0)
  const caPotentiel = produitsDispos.reduce((s, p) => s + p.prix_vente_souhaite * p.quantite, 0)
  const nbArticlesDispos = produitsDispos.reduce((s, p) => s + p.quantite, 0)
  const artOld = produitsDispos.filter(p => {
    const jours = (Date.now() - new Date(p.created_at).getTime()) / 86400000
    return jours > 60
  }).length
  const artStockBas = produitsDispos.filter(p => p.stock_min > 0 && p.quantite <= p.stock_min).length

  const caMois = ca(ventesMois)
  const caTrimestre = ca(ventesTrimestre)
  const caAnnee = ca(ventesAnnee)
  const margeMois = marge(ventesMois)
  const cotisationsEstimees = caTrimestre * TAUX_URSSAF
  const pctTVA = Math.min((caAnnee / SEUIL_TVA) * 100, 100)

  const nomMois = now.toLocaleDateString('fr-FR', { month: 'long' })
  const nomTrimestre = `T${trimestreCourant + 1} ${annee}`

  return {
    valeurStock, caPotentiel, nbArticlesDispos, artOld, artStockBas,
    nbProduits: (produits || []).length,
    caMois, caTrimestre, caAnnee, margeMois,
    cotisationsEstimees, pctTVA,
    nomMois, nomTrimestre,
  }
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon stock</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Vue d'ensemble de ta boutique
          </p>
        </div>
        <Link href="/ajouter" className="btn btn-accent">
          <PlusCircle size={18} />
          Ajouter un article
        </Link>
      </div>

      {/* --- CA PAR PÉRIODE --- */}
      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
        Chiffre d'affaires
      </h2>
      <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-label">{d.nomMois}</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(d.caMois)}</div>
          <div className="stat-sub">Marge : {euro(d.margeMois)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{d.nomTrimestre}</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(d.caTrimestre)}</div>
          <div className="stat-sub">Ce trimestre</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Année {new Date().getFullYear()}</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(d.caAnnee)}</div>
          <div className="stat-sub">CA annuel cumulé</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: 'var(--color-warning)' }}>
          <div className="stat-label" style={{ color: 'var(--color-warning)' }}>URSSAF à prévoir</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{euro(d.cotisationsEstimees)}</div>
          <div className="stat-sub">12,3% du CA trimestriel</div>
        </div>
      </div>

      {/* --- SEUIL TVA --- */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Seuil de franchise TVA
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: d.pctTVA > 80 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {euro(d.caAnnee)} / {euro(SEUIL_TVA)} ({Math.round(d.pctTVA)}%)
          </span>
        </div>
        <div style={{ background: 'var(--color-border)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${d.pctTVA}%`,
            background: d.pctTVA > 80 ? 'var(--color-danger)' : d.pctTVA > 60 ? 'var(--color-warning)' : 'var(--color-success)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        {d.pctTVA > 80 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-2)', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            <AlertTriangle size={14} />
            Attention — tu approches du seuil. Au-delà de 85 000€, la TVA s'applique.
          </div>
        )}
      </div>

      {/* --- STOCK --- */}
      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
        Stock
      </h2>
      <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-label">Articles disponibles</div>
          <div className="stat-value">{d.nbArticlesDispos}</div>
          <div className="stat-sub">{d.nbProduits} produits au total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Valeur du stock</div>
          <div className="stat-value">{euro(d.valeurStock)}</div>
          <div className="stat-sub">Prix de revient total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CA potentiel</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(d.caPotentiel)}</div>
          <div className="stat-sub">Si tout est vendu</div>
        </div>
        {d.artOld > 0 && (
          <div className="stat-card" style={{ borderTopColor: 'var(--color-warning)', background: 'var(--color-warning-light)' }}>
            <div className="stat-label" style={{ color: 'var(--color-warning)' }}>Stock vieillissant</div>
            <div className="stat-value">{d.artOld}</div>
            <div className="stat-sub">Articles &gt; 60 jours</div>
          </div>
        )}
        {d.artStockBas > 0 && (
          <Link href="/produits" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ borderTopColor: 'var(--color-danger)', background: 'var(--color-danger-light)', cursor: 'pointer' }}>
              <div className="stat-label" style={{ color: 'var(--color-danger)' }}>Stock bas</div>
              <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{d.artStockBas}</div>
              <div className="stat-sub">Article{d.artStockBas > 1 ? 's' : ''} à réapprovisionner</div>
            </div>
          </Link>
        )}
      </div>

      {/* --- ACTIONS RAPIDES --- */}
      <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        <Link href="/produits" style={{ textDecoration: 'none' }}>
          <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
            <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', padding: 'var(--space-3)' }}>
              <Package size={28} color="var(--color-primary)" />
            </div>
            <div>
              <div className="card-title">Voir le stock</div>
              <div className="card-meta">Parcourir tous les articles</div>
            </div>
          </div>
        </Link>
        <Link href="/ajouter" style={{ textDecoration: 'none' }}>
          <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
            <div style={{ background: 'var(--color-accent-light)', borderRadius: 'var(--radius)', padding: 'var(--space-3)' }}>
              <PlusCircle size={28} color="var(--color-accent-dark)" />
            </div>
            <div>
              <div className="card-title">Ajouter un article</div>
              <div className="card-meta">Enregistrer une nouvelle arrivée</div>
            </div>
          </div>
        </Link>
        <Link href="/ventes" style={{ textDecoration: 'none' }}>
          <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
            <div style={{ background: 'var(--color-success-light)', borderRadius: 'var(--radius)', padding: 'var(--space-3)' }}>
              <ShoppingBag size={28} color="var(--color-success)" />
            </div>
            <div>
              <div className="card-title">Historique des ventes</div>
              <div className="card-meta">Consulter toutes les ventes</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
