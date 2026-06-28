export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import FicheLieu from '@/components/FicheLieu'

export default async function FicheLieuPage({ params }: { params: { lieu_id: string } }) {
  const [{ data: lieu }, { data: evenements }, { data: ventes }, { data: revendeurs }] = await Promise.all([
    supabase.from('revendeurs').select('*').eq('id', params.lieu_id).single(),
    supabase.from('evenements').select('*').eq('revendeur_id', params.lieu_id).order('date', { ascending: false }),
    supabase.from('ventes').select('date_vente, revendeur_id, prix_vente_reel, quantite_vendue, marge_nette').eq('revendeur_id', params.lieu_id),
    supabase.from('revendeurs').select('id, nom').order('nom'),
  ])

  if (!lieu) notFound()

  return (
    <FicheLieu
      lieu={lieu}
      evenements={evenements || []}
      ventes={ventes || []}
      revendeurs={revendeurs || []}
    />
  )
}
