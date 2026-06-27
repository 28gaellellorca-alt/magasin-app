import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Package, TrendingUp, ShoppingBag, AlertCircle, PlusCircle } from 'lucide-react'

async function getDashboardData() {
  const [{ data: produits }, { data: ventes }] = await Promise.all([
    supabase.from('produits').select('*, categorie:categories(nom)'),
    supabase.from('ventes').select('*'),
  ])

  const produitsDispos = (produits || []).filter(p => p.etat === 'disponible')
  const valeurStock = produitsDispos.reduce((s, p) => s + p.prix_revient * p.quantite, 0)
  const caPotentiel = produitsDispos.reduce((s, p) => s + p.prix_vente_souhaite * p.quantite, 0)
  const margeGlobale = caPotentiel - valeurStock

  const ventesTotal = (ventes || []).reduce((s, v) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const nbArticlesDispos = produitsDispos.reduce((s, p) => s + p.quantite, 0)

  const artOld = produitsDispos.filter(p => {
    const jours = (Date.now() - new Date(p.created_at).getTime()) / 86400000
    return jours > 60
  })

  return { valeurStock, caPotentiel, margeGlobale, ventesTotal, nbArticlesDispos, artOld: artOld.length, nbProduits: (produits || []).length }
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default async function DashboardPage() {
  const data = await getDashboardData()

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

      <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-label">Articles disponibles</div>
          <div className="stat-value">{data.nbArticlesDispos}</div>
          <div className="stat-sub">{data.nbProduits} produits au total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Valeur du stock</div>
          <div className="stat-value">{euro(data.valeurStock)}</div>
          <div className="stat-sub">Prix de revient total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CA potentiel</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(data.caPotentiel)}</div>
          <div className="stat-sub">Si tout est vendu</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Marge potentielle</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{euro(data.margeGlobale)}</div>
          <div className="stat-sub">{data.caPotentiel > 0 ? Math.round((data.margeGlobale / data.caPotentiel) * 100) : 0}% du CA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CA réalisé</div>
          <div className="stat-value" style={{ color: 'var(--color-accent-dark)' }}>{euro(data.ventesTotal)}</div>
          <div className="stat-sub">Ventes enregistrées</div>
        </div>
        {data.artOld > 0 && (
          <div className="stat-card" style={{ borderColor: 'var(--color-warning)', background: 'var(--color-warning-light)' }}>
            <div className="stat-label" style={{ color: 'var(--color-warning)' }}>Stock vieillissant</div>
            <div className="stat-value">{data.artOld}</div>
            <div className="stat-sub">Articles &gt; 60 jours</div>
          </div>
        )}
      </div>

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
              <div className="card-title">Enregistrer une vente</div>
              <div className="card-meta">Marquer un article comme vendu</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
