export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import GestionEvenements from '@/components/GestionEvenements'

export default async function EvenementsPage() {
  const [{ data: evenements }, { data: ventes }, { data: revendeurs }] = await Promise.all([
    supabase.from('evenements').select('*, revendeur:revendeurs(id, nom)').order('date', { ascending: false }),
    supabase.from('ventes').select('date_vente, revendeur_id, prix_vente_reel, quantite_vendue, marge_nette'),
    supabase.from('revendeurs').select('id, nom').order('nom'),
  ])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Événements</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Bilan complet par marché, kermesse ou événement de vente
          </p>
        </div>
      </div>
      <GestionEvenements
        evenements={(evenements || []) as any}
        ventes={ventes || []}
        revendeurs={revendeurs || []}
      />
    </div>
  )
}
