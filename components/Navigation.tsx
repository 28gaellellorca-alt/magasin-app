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

function LogoPepites() {
  return (
    <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 180, height: 'auto' }}>
      <path d="M65,132 L65,70 Q65,30 100,30 Q135,30 135,70 L135,132" fill="none" stroke="#C4953A" strokeWidth="1.5"/>
      <path d="M71,132 L71,71 Q71,37 100,37 Q129,37 129,71 L129,132" fill="none" stroke="#C4953A" strokeWidth="0.5" opacity="0.5"/>
      <circle cx="118" cy="48" r="5" fill="#C4953A"/>
      <circle cx="118" cy="48" r="3" fill="#E8C878" opacity="0.8"/>
      <circle cx="126" cy="60" r="2.5" fill="#C4953A" opacity="0.5"/>
      <text x="100" y="73" textAnchor="middle" fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.55)" letterSpacing="4">LES</text>
      <text x="100" y="98" textAnchor="middle" fontFamily="Georgia,serif" fontSize="24" fill="#FFFFFF" fontWeight="700">Pépites</text>
      <text x="100" y="114" textAnchor="middle" fontFamily="Georgia,serif" fontSize="12" fill="#C4953A" letterSpacing="1">de G&amp;A</text>
      <text x="100" y="128" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7" fill="rgba(255,255,255,0.4)" letterSpacing="3">BOUTIQUE ÉPHÉMÈRE</text>
    </svg>
  )
}

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

      {/* Navigation desktop — barre latérale sombre avec logo */}
      <nav className="nav-sidebar">
        <div className="nav-sidebar-logo">
          <Link href="/" style={{ display: 'block' }}>
            <LogoPepites />
          </Link>
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
