'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

interface Vente {
  date_vente: string
  quantite_vendue: number
  prix_vente_reel: number
  marge_nette: number
  canal: string
  acheteur?: string | null
  notes?: string | null
  produit?: { nom: string } | null
  revendeur?: { nom: string } | null
}

interface Props {
  ventes: Vente[]
}

type Periode = 'mois' | 'trimestre' | 'annee' | 'tout'

function filtrerParPeriode(ventes: Vente[], periode: Periode): Vente[] {
  if (periode === 'tout') return ventes
  const now = new Date()
  const annee = now.getFullYear()
  const mois = now.getMonth()
  const trimestre = Math.floor(mois / 3)
  return ventes.filter(v => {
    const d = new Date(v.date_vente)
    if (d.getFullYear() !== annee) return false
    if (periode === 'annee') return true
    if (periode === 'trimestre') return Math.floor(d.getMonth() / 3) === trimestre
    return d.getMonth() === mois
  })
}

function genererCSV(ventes: Vente[]): string {
  const entetes = ['Date', 'Article', 'Acheteur', 'Canal', 'Quantité vendue', 'Prix de vente (€)', 'Marge nette (€)', 'Notes']
  const lignes = ventes.map(v => [
    new Date(v.date_vente).toLocaleDateString('fr-FR'),
    v.produit?.nom || 'Article supprimé',
    v.acheteur || '',
    v.canal === 'direct' ? 'Vente directe' : `Via ${v.revendeur?.nom || 'revendeur'}`,
    v.quantite_vendue,
    v.prix_vente_reel.toFixed(2).replace('.', ','),
    v.marge_nette.toFixed(2).replace('.', ','),
    v.notes || '',
  ])
  return [entetes, ...lignes]
    .map(ligne => ligne.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
}

const LABELS: Record<Periode, string> = {
  mois: 'Ce mois',
  trimestre: 'Ce trimestre',
  annee: 'Cette année',
  tout: 'Tout',
}

export default function BoutonExportCSV({ ventes }: Props) {
  const [periode, setPeriode] = useState<Periode>('mois')

  function exporter() {
    const selection = filtrerParPeriode(ventes, periode)
    if (selection.length === 0) return alert('Aucune vente sur cette période.')

    const csv = '﻿' + genererCSV(selection)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ventes-${periode}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
      <select
        className="form-input"
        value={periode}
        onChange={e => setPeriode(e.target.value as Periode)}
        style={{ minHeight: 40, width: 'auto', fontSize: 'var(--text-sm)', padding: '6px 32px 6px 12px' }}
      >
        {(Object.keys(LABELS) as Periode[]).map(p => (
          <option key={p} value={p}>{LABELS[p]}</option>
        ))}
      </select>
      <button onClick={exporter} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
        <Download size={15} />
        Exporter CSV
      </button>
    </div>
  )
}
