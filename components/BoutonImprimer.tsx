'use client'

export default function BoutonImprimer() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: '#C4953A', color: 'white', border: 'none', borderRadius: 10,
        padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}
    >
      Imprimer ce catalogue
    </button>
  )
}
