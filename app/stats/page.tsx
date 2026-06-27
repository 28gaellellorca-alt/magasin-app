export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import StatsVentes from '@/components/StatsVentes'
import SectionDepots from '@/components/SectionDepots'

async function getProduitsEnDepot() {
  const { data } = await supabase
    .from('produits')
    .select('id, nom, photo_url, quantite, quantite_en_depot, prix_vente_souhaite, lieu_depot:revendeurs(id, nom)')
    .not('lieu_depot_id', 'is', null)
    .eq('etat', 'disponible')
  return data || []
}

async function getVentes() {
  const { data } = await supabase
    .from('ventes')
    .select(`
      prix_vente_reel, quantite_vendue, marge_nette, date_vente, photo_url, canal,
      revendeur:revendeurs(id, nom, commission_type, commission_valeur),
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
  const [ventes, produitsEnDepot] = await Promise.all([getVentes(), getProduitsEnDepot()])

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
      <SectionDepots produits={produitsEnDepot} />
      <StatsVentes ventes={ventes} />
    </div>
  )
}
