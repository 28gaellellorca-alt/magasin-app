export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import SuiviURSSAF from '@/components/SuiviURSSAF'

async function getData(annee: number) {
  const [{ data: ventes }, { data: paiements }] = await Promise.all([
    supabase
      .from('ventes')
      .select('prix_vente_reel, quantite_vendue, date_vente')
      .gte('date_vente', `${annee}-01-01`)
      .lte('date_vente', `${annee}-12-31`),
    supabase
      .from('urssaf_paiements')
      .select('*')
      .eq('annee', annee),
  ])

  const caParTrimestre = [0, 0, 0, 0]
  for (const v of (ventes || [])) {
    const mois = new Date(v.date_vente).getMonth()
    const t = Math.floor(mois / 3)
    caParTrimestre[t] += v.prix_vente_reel * v.quantite_vendue
  }

  return { caParTrimestre, paiements: paiements || [] }
}

export default async function URSSAFPage() {
  const annee = new Date().getFullYear()
  const { caParTrimestre, paiements } = await getData(annee)

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suivi URSSAF</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Cotisations {annee} — micro-entreprise vente de marchandises
          </p>
        </div>
      </div>
      <SuiviURSSAF annee={annee} caParTrimestre={caParTrimestre} paiements={paiements} />
    </div>
  )
}
