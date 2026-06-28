export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Package } from 'lucide-react'
import BoutonImprimer from '@/components/BoutonImprimer'

async function getLieu(id: string) {
  const { data } = await supabase.from('revendeurs').select('nom').eq('id', id).single()
  return data
}

async function getProduitsCatalogue(lieuId: string) {
  const { data: prixLieu } = await supabase
    .from('prix_lieu')
    .select('produit_id, prix_vente')
    .eq('revendeur_id', lieuId)
  if (!prixLieu || prixLieu.length === 0) return []

  const ids = prixLieu.map(pl => pl.produit_id)
  const { data: produits } = await supabase
    .from('produits')
    .select('id, nom, photo_url, categorie:categories(nom), sous_categorie:sous_categories(nom), notes')
    .in('id', ids)
    .neq('etat', 'vendu')
    .order('nom')

  return (produits || []).map(p => ({
    ...p,
    categorie: p.categorie as any,
    sous_categorie: p.sous_categorie as any,
    prix_vente: prixLieu.find(pl => pl.produit_id === p.id)?.prix_vente ?? 0,
  }))
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default async function ApercuCataloguePage({ params }: { params: { lieu_id: string } }) {
  const [lieu, produits] = await Promise.all([
    getLieu(params.lieu_id),
    getProduitsCatalogue(params.lieu_id),
  ])

  if (!lieu) notFound()

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '2px solid var(--color-border, #E8E4DF)', paddingBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#999', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Les Pépites de G&A · Boutique éphémère
          </p>
          <h1 style={{ fontSize: 28, fontFamily: 'EB Garamond, Georgia, serif', fontWeight: 700, margin: '0 0 8px', color: '#2C2416' }}>
            {lieu.nom}
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>
            {produits.length} article{produits.length > 1 ? 's' : ''} proposés
          </p>
        </div>

        {/* Bouton imprimer */}
        <div className="no-print" style={{ textAlign: 'center', marginBottom: 32 }}>
          <BoutonImprimer />
        </div>

        {produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
            <p>Aucun article dans ce catalogue pour l'instant.</p>
          </div>
        ) : (
          <div className="print-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 24,
          }}>
            {produits.map(p => (
              <div key={p.id} style={{
                border: '1px solid #E8E4DF', borderRadius: 16, overflow: 'hidden',
                background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {p.photo_url ? (
                  <Image
                    src={p.photo_url}
                    alt={p.nom}
                    width={300}
                    height={220}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 180, background: '#FDF8F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={48} color="#C4953A" strokeWidth={1} />
                  </div>
                )}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'EB Garamond, Georgia, serif', fontSize: 17, fontWeight: 600, color: '#2C2416', marginBottom: 6 }}>
                    {p.nom}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {p.categorie && (
                      <span style={{ background: '#FDF0E8', color: '#C97548', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 500 }}>
                        {p.categorie.nom}
                      </span>
                    )}
                    {p.sous_categorie && (
                      <span style={{ background: '#F3F4F6', color: '#6B6B6B', borderRadius: 99, padding: '2px 10px', fontSize: 11 }}>
                        {p.sous_categorie.nom}
                      </span>
                    )}
                  </div>
                  {p.notes && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>
                      {p.notes}
                    </p>
                  )}
                  <div style={{ fontFamily: 'EB Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#C4953A' }}>
                    {euro(p.prix_vente)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 12, borderTop: '1px solid #E8E4DF', paddingTop: 20 }}>
          Les Pépites de G&A · 28gaellellorca@gmail.com
        </div>
      </div>
    </>
  )
}
