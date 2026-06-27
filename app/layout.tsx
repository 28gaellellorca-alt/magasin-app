import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Mon Stock — Boutique Artisanale',
  description: 'Gestion de stock pour boutique artisanale fait main',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main>
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  )
}
