export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Package, Edit } from 'lucide-react'
import BoutonVente from '@/components/BoutonVente'
import BoutonAnnulerVente from '@/components/BoutonAnnulerVente'
import BoutonSupprimerProduit from '@/components/BoutonSupprimerProduit'
import BoutonDepot from '@/components/BoutonDepot'
import PrixParLieu from '@/components/PrixParLieu'

async function getProduit(id: string) {
  const { data } = await supabase
    .from('produits')
    .select('*, categorie:categories(nom), sous_categorie:sous_categories(nom), lieu_depot:revendeurs(id, nom)')
    .eq('id', id)
    .single()
  return data
}

async function getVentes(produitId: string) {
  const { data } = await supabase
    .from('ventes')
    .select('*, revendeur:revendeurs(nom)')
    .eq('produit_id', produitId)
    .order('date_vente', { ascending: false })
  return data || []
}

async function getRevendeurs() {
  const { data } = await supabase.from('revendeurs').select('*').order('nom')
  return data || []
}

async function getPrixLieu(produitId: string) {
  const { data } = await supabase.from('prix_lieu').select('revendeur_id, prix_vente').eq('produit_id', produitId)
  return data || []
}

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default async function FicheProduit({ params }: { params: { id: string } }) {
  const [produit, ventes, revendeurs] = await Promise.all([
    getProduit(params.id),
    getVentes(params.id),
    getRevendeurs(),
  ])

  if (!produit) notFound()

  const prixLieu = await getPrixLieu(params.id)

  const marge = produit.prix_vente_souhaite - produit.prix_revient
  const margePct = produit.prix_revient > 0 ? Math.round((marge / produit.prix_revient) * 100) : 0

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/produits" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
          <ArrowLeft size={16} /> Retour au stock
        </Link>
      </div>

      {produit.photo_url ? (
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 'var(--space-5)', maxHeight: 320 }}>
          <Image src={produit.photo_url} alt={produit.nom} width={720} height={320} style={{ width: '100%', objectFit: 'cover', maxHeight: 320 }} />
        </div>
      ) : (
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-xl)', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
          <Package size={64} color="var(--color-primary)" strokeWidth={1} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">{produit.nom}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 6, flexWrap: 'wrap' }}>
            {produit.categorie && <span className="badge badge-primary">{produit.categorie.nom}</span>}
            {produit.sous_categorie && <span className="badge badge-neutral">{produit.sous_categorie.nom}</span>}
            <span className={`badge ${produit.etat === 'disponible' ? 'badge-success' : produit.etat === 'vendu' ? 'badge-neutral' : 'badge-warning'}`}>
              {produit.etat === 'disponible' ? 'Disponible' : produit.etat === 'vendu' ? 'Vendu' : 'Reserve'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link href={`/produits/${produit.id}/modifier`} className="btn btn-secondary btn-sm">
            <Edit size={14} /> Modifier
          </Link>
          <BoutonSupprimerProduit produitId={produit.id} photoUrl={produit.photo_url} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-label">Prix achat</div>
          <div className="stat-value">{euro(produit.prix_achat)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Frais annexes</div>
          <div className="stat-value">{euro(produit.frais_annexes)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prix de revient</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{euro(produit.prix_revient)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prix souhaite</div>
          <div className="stat-value">{euro(produit.prix_vente_souhaite)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Marge</div>
          <div className="stat-value" style={{ color: marge >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {euro(marge)}
          </div>
          <div className="stat-sub">{margePct}% du prix de revient</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quantite</div>
          <div className="stat-value">{produit.quantite}</div>
        </div>
      </div>

      <PrixParLieu
        produitId={produit.id}
        prixRevient={produit.prix_revient}
        revendeurs={revendeurs}
        prixExistants={prixLieu}
      />

      {produit.notes && (
        <div style={{ background: 'var(--color-accent-light)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}><strong>Notes :</strong> {produit.notes}</p>
        </div>
      )}

      {produit.etat === 'disponible' && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <BoutonDepot
            produitId={produit.id}
            quantiteDisponible={produit.quantite}
            lieuDepot={produit.lieu_depot || null}
            quantiteEnDepot={produit.quantite_en_depot || 0}
            revendeurs={revendeurs}
          />
        </div>
      )}

      {produit.etat === 'disponible' && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <BoutonVente
            produitId={produit.id}
            produitNom={produit.nom}
            photoUrl={produit.photo_url}
            prixSouhaite={produit.prix_vente_souhaite}
            prixRevient={produit.prix_revient}
            quantiteDisponible={produit.quantite}
            revendeurs={revendeurs}
            lieuDepotId={produit.lieu_depot?.id || null}
            quantiteEnDepot={produit.quantite_en_depot || 0}
          />
        </div>
      )}

      {ventes.length > 0 && (
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Historique des ventes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {ventes.map((v: any) => {
              const photoVente = v.photo_url || produit.photo_url
              return (
                <div key={v.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {photoVente && (
                      <Image
                        src={photoVente}
                        alt={produit.nom}
                        width={56}
                        height={56}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        {new Date(v.date_vente).toLocaleDateString('fr-FR')} {v.canal === 'direct' ? 'Vente directe' : `Via ${v.revendeur?.nom || 'lieu de vente'}`}
                      </div>
                      <div className="card-meta">{v.quantite_vendue} article{v.quantite_vendue > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{euro(v.prix_vente_reel)}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>Marge : {euro(v.marge_nette)}</div>
                    </div>
                    <BoutonAnnulerVente
                      venteId={v.id}
                      produitId={produit.id}
                      quantiteVendue={v.quantite_vendue}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
