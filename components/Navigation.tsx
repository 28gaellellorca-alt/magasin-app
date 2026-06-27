'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, PlusCircle, ShoppingBag, Settings } from 'lucide-react'

const liens = [
  { href: '/',           label: 'Accueil',   icone: LayoutDashboard },
  { href: '/produits',   label: 'Stock',     icone: Package },
  { href: '/ajouter',    label: 'Ajouter',   icone: PlusCircle },
  { href: '/ventes',     label: 'Ventes',    icone: ShoppingBag },
  { href: '/parametres', label: 'Réglages',  icone: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  return (
    <>
      {/* Navigation mobile — barre en bas */}
      <nav className="nav-bottom">
        {liens.map(({ href, label, icone: Icone }) => (
          <Link key={href} href={href} className={`nav-item${pathname === href ? ' active' : ''}`}>
            <Icone size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Navigation desktop — barre latérale */}
      <nav className="nav-sidebar">
        <div style={{ padding: 'var(--space-5) var(--space-4)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>Mon stock</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>Boutique artisanale</div>
        </div>
        {liens.map(({ href, label, icone: Icone }) => (
          <Link key={href} href={href} className={`nav-sidebar-item${pathname === href ? ' active' : ''}`}>
            <Icone size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
