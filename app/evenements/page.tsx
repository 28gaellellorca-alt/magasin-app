export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MapPin, Plus, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react'

function euro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function calculerBilanEvenement(ev: any, ventes: any[]) {
  const ventesEv = ev.revendeur_id
    ? ventes.filter(v => v.date_vente?.startsWith(ev.date) && v.revendeur_id === ev.revendeur_id)
    : []
  const ca = ventesEv.reduce((s: number, v: any) => s + v.prix_vente_reel * v.quantite_vendue, 0)
  const beneficeBrut = ventesEv.reduce((s: number, v: any) => s + v.marge_nette, 0)
  const frais = (ev.cout_emplacement || 0) + (ev.transport || 0) + (ev.autres_frais || 0)
  return { ca, beneficeNet: beneficeBrut - frais }
}

export default async function EvenementsPage() {
  const [{ data: revendeurs }, { data: evenements }, { data: ventes }] = await Promise.all([
    supabase.from('revendeurs').select('id, nom, commission_type, commission_valeur, remise_defaut, remise_defaut_type').order('nom'),
    supabase.from('evenements').select('*').order('date', { ascending: false }),
    supabase.from('ventes').select('date_vente, revendeur_id, prix_vente_reel, quantite_vendue, marge_nette'),
  ])

  const tousLieux = revendeurs || []
  const tousEvenements = evenements || []
  const toutesVentes = ventes || []

  // Stats par lieu
  const statsParLieu = tousLieux.map(lieu => {
    const evLieu = tousEvenements.filter(e => e.revendeur_id === lieu.id)
    const bilans = evLieu.map(ev => calculerBilanEvenement(ev, toutesVentes))
    const caTotal = bilans.reduce((s, b) => s + b.ca, 0)
    const beneficeTotal = bilans.reduce((s, b) => s + b.beneficeNet, 0)
    const dernierEv = evLieu[0]
    return { lieu, nbEvenements: evLieu.length, caTotal, beneficeTotal, dernierEv }
  })

  // Lieux sans événement à la fin
  const tries = [...statsParLieu].sort((a, b) => {
    if (a.nbEvenements === 0 && b.nbEvenements > 0) return 1
    if (b.nbEvenements === 0 && a.nbEvenements > 0) return -1
    return b.caTotal - a.caTotal
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marchés & Lieux de vente</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Clique sur un lieu pour voir son bilan complet, ses événements et ses réglages
          </p>
        </div>
        <Link href="/parametres" className="btn btn-secondary" style={{ gap: 6 }}>
          <Plus size={16} /> Nouveau lieu
        </Link>
      </div>

      {tries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <MapPin size={48} strokeWidth={1} style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ marginBottom: 'var(--space-4)' }}>Aucun lieu de vente configuré.</p>
          <Link href="/parametres" className="btn btn-primary">Créer un lieu de vente</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {tries.map(({ lieu, nbEvenements, caTotal, beneficeTotal, dernierEv }) => {
            const positif = beneficeTotal >= 0
            return (
              <Link key={lieu.id} href={`/evenements/${lieu.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-body" style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MapPin size={20} color="var(--color-primary)" strokeWidth={1.8} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 2 }}>
                      {lieu.nom}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {nbEvenements > 0
                        ? `${nbEvenements} événement${nbEvenements > 1 ? 's' : ''} · Dernier : ${new Date(dernierEv.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Aucun événement enregistré'
                      }
                    </div>
                  </div>

                  {nbEvenements > 0 ? (
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>CA total</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>{euro(caTotal)}</div>
                      </div>
                      <div style={{
                        textAlign: 'right', padding: '6px 12px',
                        background: positif ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                        borderRadius: 'var(--radius)',
                      }}>
                        <div style={{ fontSize: 10, color: positif ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {positif ? <TrendingUp size={10} /> : <TrendingDown size={10} />} Net
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: positif ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {euro(beneficeTotal)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      <CalendarDays size={14} style={{ display: 'inline', marginRight: 4 }} />
                      Premier événement à créer
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
