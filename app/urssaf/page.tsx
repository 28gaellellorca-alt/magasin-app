export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import SuiviURSSAF from '@/components/SuiviURSSAF'

async function getData(annee: number) {
  const [{ data: ventes }, { data: paiements }] = await Promise.all([
    supabase
      .from('ventes')
      .select('prix_vente_reel, quantite_vendue, marge_nette, date_vente, mode_paiement, canal')
      .gte('date_vente', `${annee}-01-01`)
      .lte('date_vente', `${annee}-12-31`),
    supabase
      .from('urssaf_paiements')
      .select('*')
      .eq('annee', annee),
  ])

  const donneesParMois = Array.from({ length: 12 }, () => ({
    ca: 0, marge: 0, nbVentes: 0, nbArticles: 0,
    especes: 0, carte: 0, direct: 0, lieux: 0,
  }))

  for (const v of (ventes || [])) {
    const mois = new Date(v.date_vente).getMonth()
    const ca = v.prix_vente_reel * v.quantite_vendue
    donneesParMois[mois].ca += ca
    donneesParMois[mois].marge += v.marge_nette
    donneesParMois[mois].nbVentes += 1
    donneesParMois[mois].nbArticles += v.quantite_vendue
    if (v.mode_paiement === 'carte') donneesParMois[mois].carte += ca
    else donneesParMois[mois].especes += ca
    if (v.canal === 'revendeur') donneesParMois[mois].lieux += ca
    else donneesParMois[mois].direct += ca
  }

  return { donneesParMois, paiements: paiements || [] }
}

export default async function URSSAFPage({ searchParams }: { searchParams: { annee?: string } }) {
  const anneeActuelle = new Date().getFullYear()
  const annee = parseInt(searchParams.annee || '') || anneeActuelle
  const { donneesParMois, paiements } = await getData(annee)

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Récap mensuel</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            CA · Marge · URSSAF · Modes de paiement · Canaux de vente
          </p>
        </div>
      </div>
      <SuiviURSSAF
        annee={annee}
        anneeActuelle={anneeActuelle}
        donneesParMois={donneesParMois}
        paiements={paiements}
      />
    </div>
  )
}
