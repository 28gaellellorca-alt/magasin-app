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
    <nav className="nav-bottom">
      {liens.map(({ href, label, icone: Icone }) => (
        <Link
          key={href}
          href={href}
          className={`nav-item${pathname === href ? ' active' : ''}`}
        >
          <Icone size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
