'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

interface Props { categories: any[]; sousCategories: any[] }

export default function GestionCategories({ categories: initCats, sousCategories: initSousCats }: Props) {
  const router = useRouter()
  const [cats, setCats] = useState(initCats)
  const [sousCats, setSousCats] = useState(initSousCats)
  const [nouvellesCat, setNouvellesCat] = useState('')
  const [ouvert, setOuvert] = useState<Record<string, boolean>>({})
  const [nouvelleSousCat, setNouvelleSousCat] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(false)

  async function ajouterCategorie() {
    const nom = nouvellesCat.trim()
    if (!nom) return
    setChargement(true)
    const slug = nom.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '')
    const { data, error } = await supabase.from('categories').insert({ nom, slug }).select().single()
    if (!error && data) { setCats(c => [...c, data]); setNouvellesCat('') }
    setChargement(false)
  }

  async function supprimerCategorie(id: string) {
    if (!confirm('Supprimer cette catégorie ? Les articles associés ne seront pas supprimés.')) return
    await supabase.from('categories').delete().eq('id', id)
    setCats(c => c.filter(cat => cat.id !== id))
    setSousCats(sc => sc.filter(s => s.categorie_id !== id))
  }

  async function ajouterSousCategorie(catId: string) {
    const nom = (nouvelleSousCat[catId] || '').trim()
    if (!nom) return
    const { data, error } = await supabase.from('sous_categories').insert({ nom, categorie_id: catId }).select().single()
    if (!error && data) {
      setSousCats(sc => [...sc, data])
      setNouvelleSousCat(v => ({ ...v, [catId]: '' }))
    }
  }

  async function supprimerSousCategorie(id: string) {
    await supabase.from('sous_categories').delete().eq('id', id)
    setSousCats(sc => sc.filter(s => s.id !== id))
  }

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Catégories</h2>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <input className="form-input" placeholder="Nouvelle catégorie..." value={nouvellesCat}
          onChange={e => setNouvellesCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ajouterCategorie()}
          style={{ maxWidth: 280 }} />
        <button className="btn btn-primary" onClick={ajouterCategorie} disabled={chargement}>
          <Plus size={18} /> Ajouter
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {cats.map(cat => {
          const sousCatsCat = sousCats.filter(sc => sc.categorie_id === cat.id)
          return (
            <div key={cat.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface)', gap: 'var(--space-3)' }}>
                <button onClick={() => setOuvert(o => ({ ...o, [cat.id]: !o[cat.id] }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                  {ouvert[cat.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span style={{ flex: 1, fontWeight: 500 }}>{cat.nom}</span>
                <span className="badge badge-neutral">{sousCatsCat.length} sous-cat.</span>
                <button onClick={() => supprimerCategorie(cat.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
              {ouvert[cat.id] && (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
                  {sousCatsCat.map(sc => (
                    <div key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)' }}>
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{sc.nom}</span>
                      <button onClick={() => supprimerSousCategorie(sc.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <input className="form-input" style={{ minHeight: 36, padding: '6px 10px', fontSize: 'var(--text-sm)' }}
                      placeholder="Nouvelle sous-catégorie..."
                      value={nouvelleSousCat[cat.id] || ''}
                      onChange={e => setNouvelleSousCat(v => ({ ...v, [cat.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && ajouterSousCategorie(cat.id)} />
                    <button className="btn btn-secondary btn-sm" onClick={() => ajouterSousCategorie(cat.id)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
