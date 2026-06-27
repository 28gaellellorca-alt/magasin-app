import { supabase } from '@/lib/supabase'
import StatsVentes from '@/components/StatsVentes'

async function getVentes() {
  const { data } = await supabase
    .from('ventes')
    .select(`
      prix_vente_reel, quantite_vendue, marge_nette, date_vente, photo_url,
      produit:produits(
        id, nom, photo_url,
        categorie:categories(id, nom),
        sous_categorie:sous_categories(id, nom)
      )
    `)
    .order('date_vente', { ascending: false })
  return data || []
}

export default async function StatsPage() {
  const ventes = await getVentes()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Statistiques</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Ventes par catégorie, sous-catégorie et produit
          </p>
        </div>
      </div>
      <StatsVentes ventes={ventes} />
    </div>
  )
}
