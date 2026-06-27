'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, PlusCircle, ShoppingBag, BarChart2, Settings, Receipt } from 'lucide-react'

const liens = [
  { href: '/',           label: 'Accueil',   icone: LayoutDashboard },
  { href: '/produits',   label: 'Stock',     icone: Package },
  { href: '/ajouter',    label: 'Ajouter',   icone: PlusCircle },
  { href: '/ventes',     label: 'Ventes',    icone: ShoppingBag },
  { href: '/stats',      label: 'Stats',     icone: BarChart2 },
  { href: '/urssaf',     label: 'Récap',     icone: Receipt },
  { href: '/parametres', label: 'Réglages',  icone: Settings },
]

function LogoPepitesSidebar() {
  return (
    <svg viewBox="0 0 180 170" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 170, height: 'auto' }}>
      <g transform="translate(90,52)">
        <line x1="0" y1="10" x2="0" y2="-28" stroke="#C4B890" strokeWidth="1.2"/>
        <line x1="0" y1="-4" x2="-22" y2="-20" stroke="#C4B890" strokeWidth="1"/>
        <line x1="0" y1="-4" x2="22" y2="-20" stroke="#C4B890" strokeWidth="1"/>
        <line x1="0" y1="-16" x2="-14" y2="-28" stroke="#C4B890" strokeWidth="0.8"/>
        <line x1="0" y1="-16" x2="14" y2="-28" stroke="#C4B890" strokeWidth="0.8"/>
        <ellipse cx="-26" cy="-23" rx="9" ry="5" fill="#8A9870" transform="rotate(-35,-26,-23)" opacity="0.9"/>
        <ellipse cx="-17" cy="-31" rx="8" ry="4.5" fill="#8A9870" transform="rotate(-20,-17,-31)" opacity="0.8"/>
        <ellipse cx="26" cy="-23" rx="9" ry="5" fill="#8A9870" transform="rotate(35,26,-23)" opacity="0.9"/>
        <ellipse cx="17" cy="-31" rx="8" ry="4.5" fill="#8A9870" transform="rotate(20,17,-31)" opacity="0.8"/>
        <ellipse cx="0" cy="-33" rx="6" ry="4" fill="#8A9870" opacity="0.85"/>
        <circle cx="18" cy="-6" r="7" fill="#C4953A"/>
        <circle cx="18" cy="-6" r="4.5" fill="#E8C060" opacity="0.75"/>
        <circle cx="16" cy="-8" r="1.5" fill="#3A2E20" opacity="0.4"/>
      </g>
      <text x="90" y="88" textAnchor="middle" fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.4)" letterSpacing="6">LES</text>
      <text x="90" y="122" textAnchor="middle" fontFamily="Georgia,serif" fontSize="34" fill="#FFFFFF" fontWeight="700">Pépites</text>
      <text x="90" y="142" textAnchor="middle" fontFamily="Georgia,serif" fontSize="17" fill="#C4953A" letterSpacing="1">de G&amp;A</text>
      <line x1="40" y1="152" x2="140" y2="152" stroke="#C4953A" strokeWidth="0.6"/>
      <text x="90" y="165" textAnchor="middle" fontFamily="Georgia,serif" fontSize="9" fill="rgba(255,255,255,0.45)" letterSpacing="2">Boutique éphémère</text>
    </svg>
  )
}

function LogoPepitesMobile() {
  return (
    <svg viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg" style={{ height: 52, width: 'auto' }}>
      <g transform="translate(90,20)">
        <line x1="0" y1="4" x2="0" y2="-14" stroke="#C4B890" strokeWidth="1"/>
        <line x1="0" y1="-3" x2="-11" y2="-11" stroke="#C4B890" strokeWidth="0.8"/>
        <line x1="0" y1="-3" x2="11" y2="-11" stroke="#C4B890" strokeWidth="0.8"/>
        <line x1="0" y1="-9" x2="-7" y2="-15" stroke="#C4B890" strokeWidth="0.6"/>
        <line x1="0" y1="-9" x2="7" y2="-15" stroke="#C4B890" strokeWidth="0.6"/>
        <ellipse cx="-13" cy="-13" rx="5" ry="3" fill="#8A9870" transform="rotate(-35,-13,-13)" opacity="0.9"/>
        <ellipse cx="13" cy="-13" rx="5" ry="3" fill="#8A9870" transform="rotate(35,13,-13)" opacity="0.9"/>
        <ellipse cx="-9" cy="-17" rx="4" ry="2.5" fill="#8A9870" transform="rotate(-20,-9,-17)" opacity="0.8"/>
        <ellipse cx="9" cy="-17" rx="4" ry="2.5" fill="#8A9870" transform="rotate(20,9,-17)" opacity="0.8"/>
        <ellipse cx="0" cy="-19" rx="4" ry="2.5" fill="#8A9870" opacity="0.85"/>
        <circle cx="9" cy="-3" r="5" fill="#C4953A"/>
        <circle cx="9" cy="-3" r="3" fill="#E8C060" opacity="0.75"/>
      </g>
      <text x="90" y="37" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fill="#FFFFFF" fontWeight="700">Pépites</text>
      <text x="90" y="53" textAnchor="middle" fontFamily="Georgia,serif" fontSize="12" fill="#C4953A" letterSpacing="0.5">de G&amp;A</text>
    </svg>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  return (
    <>
      {/* En-tête mobile avec logo — visible uniquement sur téléphone */}
      <header className="nav-header-mobile">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogoPepitesMobile />
        </Link>
      </header>

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
            <LogoPepitesSidebar />
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
