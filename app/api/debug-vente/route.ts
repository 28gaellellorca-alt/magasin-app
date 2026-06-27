import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const rapport: Record<string, any> = {
    supabase_url: url ? url.substring(0, 40) + '...' : 'NON DEFINIE',
    anon_key: key ? key.substring(0, 20) + '...' : 'NON DEFINIE',
    tests: {}
  }

  if (!url || !key) {
    return NextResponse.json({ ...rapport, erreur: 'Variables Supabase manquantes sur Vercel' })
  }

  const supabase = createClient(url, key)

  // Test 1 : lire les produits disponibles
  const { data: produits, error: errLecture } = await supabase
    .from('produits')
    .select('id, nom, quantite, prix_revient, etat')
    .eq('etat', 'disponible')
    .limit(3)

  rapport.tests.lecture_produits = errLecture
    ? { ok: false, erreur: errLecture.message, code: errLecture.code }
    : { ok: true, nb_produits: produits?.length }

  if (!produits || produits.length === 0) {
    rapport.tests.insert_vente = { ok: false, erreur: 'Aucun produit disponible pour tester' }
    return NextResponse.json(rapport)
  }

  const p = produits[0]
  rapport.produit_test = { nom: p.nom, quantite: p.quantite, prix_revient: p.prix_revient }

  // Test 2 : insérer dans ventes
  const prixVente = 5
  const marge = prixVente - (p.prix_revient || 0)

  const { data: ins, error: errIns } = await supabase
    .from('ventes')
    .insert({
      produit_id: p.id,
      quantite_vendue: 1,
      prix_vente_reel: prixVente,
      canal: 'direct',
      marge_nette: marge,
      date_vente: new Date().toISOString(),
      notes: 'TEST DIAGNOSTIC AUTO - sera supprimé',
    })
    .select()

  if (errIns) {
    rapport.tests.insert_vente = { ok: false, erreur: errIns.message, code: errIns.code, details: errIns.details }
  } else {
    rapport.tests.insert_vente = { ok: true, id_cree: ins?.[0]?.id }

    // Test 3 : mettre à jour le stock
    const { error: errUpd } = await supabase
      .from('produits')
      .update({ quantite: p.quantite - 1, etat: p.quantite - 1 <= 0 ? 'vendu' : 'disponible' })
      .eq('id', p.id)

    rapport.tests.update_stock = errUpd
      ? { ok: false, erreur: errUpd.message, code: errUpd.code }
      : { ok: true }

    // Nettoyage : supprimer le test
    if (ins?.[0]?.id) await supabase.from('ventes').delete().eq('id', ins[0].id)
    await supabase.from('produits').update({ quantite: p.quantite, etat: p.etat }).eq('id', p.id)
    rapport.tests.nettoyage = 'ok'
  }

  return NextResponse.json(rapport, { status: 200 })
}
