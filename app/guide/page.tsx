export const dynamic = 'force-dynamic'

export default function GuidePage() {
  return (
    <div className="page-container" style={{ maxWidth: 820 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Guide d'utilisation</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Tout ce qu'il faut savoir pour utiliser l'application au quotidien
          </p>
        </div>
      </div>

      {/* Sommaire */}
      <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Sommaire</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
          {[
            ['#navigation', 'Naviguer dans l\'app'],
            ['#ajouter', 'Ajouter un article'],
            ['#stock', 'Gérer le stock'],
            ['#vente', 'Enregistrer une vente'],
            ['#depot', 'Dépôts en lieu de vente'],
            ['#marches', 'Marchés & événements'],
            ['#catalogue', 'Catalogue par lieu'],
            ['#ventes', 'Historique des ventes'],
            ['#stats', 'Statistiques'],
            ['#urssaf', 'Récap URSSAF'],
            ['#reglages', 'Réglages'],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', textDecoration: 'none', padding: '4px 0' }}>
              → {label}
            </a>
          ))}
        </div>
      </div>

      {/* 1. Navigation */}
      <Section id="navigation" num="1" titre="Naviguer dans l'application">
        <p style={pStyle}>
          L'application est accessible sur <strong>magasin-app.vercel.app</strong> depuis n'importe quel appareil (téléphone, tablette, ordinateur).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
          {[
            ['Accueil', 'Tableau de bord — CA, URSSAF, alertes stock bas'],
            ['Stock', 'Tous les articles enregistrés, filtres, ajouter un article'],
            ['Ventes', 'Historique complet des ventes avec export CSV'],
            ['Marchés', 'Suivi par lieu de vente — bilan, événements, réglages'],
            ['Stats', 'Statistiques par lieu, catégorie, produit'],
            ['Récap', 'Suivi mensuel URSSAF et paiements trimestriels'],
            ['Réglages', 'Catégories, lieux de vente et catalogues'],
            ['Guide', 'Ce guide !'],
          ].map(([label, desc]) => (
            <div key={label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
        <Info>Sur téléphone : barre en bas de l'écran. Sur ordinateur : menu latéral à gauche. L'onglet "Ajouter un article" est intégré directement dans la page Stock (bouton en haut à droite).</Info>
      </Section>

      {/* 2. Ajouter */}
      <Section id="ajouter" num="2" titre="Ajouter un article au stock">
        <p style={pStyle}>
          Depuis la page <strong>Stock</strong>, clique sur <strong>"+ Ajouter un article"</strong> en haut à droite. Remplis le formulaire :
        </p>
        <Etapes items={[
          ['Photo', 'Appuie sur la zone pour prendre une photo ou choisir depuis la galerie. Elle est compressée automatiquement.'],
          ['Nom de l\'article', '(obligatoire) Sois descriptive : couleur, matière, type. Ex : "Doudou étoile crochet rose".'],
          ['Catégorie / Sous-catégorie', 'Aide à filtrer et retrouver les articles. La catégorie peut se suggérer selon le nom.'],
          ['Prix d\'achat', '(obligatoire) Ce que tu as payé pour l\'article.'],
          ['Frais annexes', 'Port, emballage lié à cet article. Laisse à 0 si rien.'],
          ['Prix de vente souhaité', 'La marge est calculée en temps réel pendant que tu saisis.'],
          ['Quantité', 'Combien d\'exemplaires en stock.'],
          ['Alerte si stock sous', 'Mets 2 pour être prévenue quand il en reste 2 ou moins. Laisse à 0 pour désactiver.'],
          ['État', 'Disponible, Réservé ou Vendu.'],
          ['Acheté à / Source', 'Optionnel. D\'où vient l\'article : "Vinted — Marie", "Brocante Bordeaux"…'],
          ['Notes libres', 'Toute autre info utile : taille, couleur précise, état, etc.'],
        ]} />
        <Astuce>Après enregistrement, clique "Ajouter un autre article" pour enchaîner sans tout ressaisir.</Astuce>
      </Section>

      {/* 3. Stock */}
      <Section id="stock" num="3" titre="Consulter et gérer le stock">
        <SousTitre>Recherche et filtres</SousTitre>
        <ul style={ulStyle}>
          <li><strong>Barre de recherche</strong> — Tape un mot-clé (nom, catégorie, notes). La croix efface la recherche.</li>
          <li><strong>Filtre catégorie</strong> — Affiche uniquement une catégorie.</li>
          <li><strong>Filtre état</strong> — Disponible / Vendu / Réservé.</li>
        </ul>
        <SousTitre>Voir les prix pour un lieu de vente</SousTitre>
        <p style={pStyle}>Le sélecteur "Voir les prix pour :" en haut de la page affiche les prix spécifiques définis pour chaque lieu. Très utile avant un marché.</p>
        <SousTitre>Alertes stock bas</SousTitre>
        <p style={pStyle}>Quand un article est sous son seuil, un badge rouge <Badge rouge>⚠ Stock bas</Badge> apparaît sur sa carte et la quantité s'affiche en rouge. Sur le tableau de bord, une carte "Stock bas" te redirige vers les articles concernés.</p>
        <SousTitre>Détails dépliables</SousTitre>
        <p style={pStyle}>Clique sur "Détails" en bas d'une carte pour voir prix d'achat, frais et marge sans ouvrir la fiche complète.</p>
      </Section>

      {/* 4. Vente */}
      <Section id="vente" num="4" titre="Enregistrer une vente">
        <p style={pStyle}>Tu peux enregistrer une vente de <strong>deux endroits</strong> : depuis la fiche de l'article (page Stock) ou directement depuis le <a href="#catalogue" style={{ color: 'var(--color-primary)' }}>catalogue d'un lieu</a>.</p>
        <SousTitre>Depuis la fiche d'un article</SousTitre>
        <Etapes items={[
          ['Prix par article', 'Pré-rempli avec ton prix souhaité. Tu peux le modifier directement.'],
          ['Quantité', 'Combien d\'exemplaires vendus en une fois.'],
          ['Ajustement de prix', 'Optionnel. Choisis Réduction ou Augmentation, puis % ou €. Le prix final est recalculé automatiquement.'],
          ['Mode de paiement', 'Espèces ou Carte.'],
          ['Canal de vente', 'Vente directe ou Via un lieu de vente.'],
          ['Lieu de vente', 'Si tu sélectionnes un lieu configuré avec une remise/augmentation auto, elle s\'applique immédiatement.'],
          ['Acheteur', 'Optionnel. Prénom ou surnom pour retrouver une vente.'],
          ['Notes', 'Optionnel. Ex : "Marché de Noël", "Réservé en avance"…'],
        ]} />
        <Info>Un récapitulatif bleu affiche la marge par article (et la marge totale si quantité {">"} 1) avant de confirmer. La vente décrémente le stock automatiquement.</Info>
        <SousTitre>Annuler une vente</SousTitre>
        <p style={pStyle}>Sur la fiche produit ou sur la page Ventes, clique sur <strong>Annuler</strong> à côté de la vente. Le stock est remis à jour automatiquement.</p>
        <Attention>Si le produit a été supprimé entre-temps, la vente est annulée mais le stock n'est pas remis (le produit n'existe plus).</Attention>
      </Section>

      {/* 5. Dépôt */}
      <Section id="depot" num="5" titre="Déposer des articles dans un lieu de vente">
        <p style={pStyle}>Si tu déposes des articles chez un revendeur ou pour un événement, utilise la fonction dépôt pour suivre le stock immobilisé séparément du reste.</p>
        <Info>Le dépôt ne retire pas le stock total — il précise combien sont <em>chez le lieu</em> (par opposition à chez toi). Ex : 16 articles au total dont 15 en dépôt chez Kermesse Vava · 1 chez toi.</Info>

        <SousTitre>Méthode 1 — Depuis la fiche de l'article</SousTitre>
        <Etapes items={[
          ['Ouvre la fiche du produit', 'Clique sur l\'article depuis la page Stock.'],
          ['Clique sur "Déposer chez un lieu de vente"', 'Le bouton apparaît si l\'article est disponible.'],
          ['Choisis le lieu et la quantité', 'Tu peux déposer une partie seulement du stock.'],
          ['Valide', 'Le prix est automatiquement ajusté selon le paramétrage du lieu (remise ou augmentation). Le dépôt apparaît dans le catalogue du lieu.'],
        ]} />

        <SousTitre>Méthode 2 — Depuis le catalogue du lieu</SousTitre>
        <Etapes items={[
          ['Va dans Marchés', 'Clique sur le lieu concerné, puis sur "Catalogue".'],
          ['Cherche l\'article dans la liste "Ajouter"', 'En bas de page, tous les articles non encore déposés sont listés.'],
          ['Clique sur "Déposer"', 'Le bouton orange à droite de chaque article.'],
          ['Entre la quantité et le prix', 'Le prix suggéré est déjà calculé avec le paramétrage du lieu. Modifie si besoin.'],
          ['Confirme', 'L\'article passe directement dans la section "En dépôt ici".'],
        ]} />

        <SousTitre>Retour de dépôt</SousTitre>
        <p style={pStyle}>Tu peux annuler un dépôt depuis <strong>deux endroits</strong> :</p>
        <ul style={ulStyle}>
          <li><strong>Fiche de l'article</strong> — Bouton "Tout est rentré (retour de dépôt)"</li>
          <li><strong>Catalogue du lieu</strong> — Clique sur le <strong>X</strong> à côté de l'article dans la section "En dépôt ici"</li>
        </ul>
        <Astuce>La page Stats affiche en bas une section "Dépôts en cours" avec tous les articles actuellement déposés et leur lieu.</Astuce>
      </Section>

      {/* 6. Marchés */}
      <Section id="marches" num="6" titre="Marchés & événements">
        <p style={pStyle}>La page <strong>Marchés</strong> centralise tout ce que tu sais sur tes lieux de vente : bilan financier, historique des passages, réglages et catalogue.</p>

        <SousTitre>Vue d'ensemble</SousTitre>
        <p style={pStyle}>Chaque lieu de vente est listé avec :</p>
        <ul style={ulStyle}>
          <li>Le nombre d'événements passés</li>
          <li>Le CA total généré sur ce lieu</li>
          <li>Le bénéfice net (après déduction des frais de chaque événement)</li>
          <li>La date du dernier passage</li>
        </ul>

        <SousTitre>Fiche d'un lieu</SousTitre>
        <p style={pStyle}>Clique sur un lieu pour ouvrir sa fiche complète :</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Partie</th>
              <th style={thStyle}>Ce que tu peux faire</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Stats globales', 'CA total, frais cumulés, bénéfice net, nombre de ventes'],
              ['Réglages', 'Modifier le nom, les frais (% / fixe / entrée) et l\'ajustement auto des prix (remise ou augmentation, en % ou en €)'],
              ['Événements', 'Voir le bilan de chaque passage : CA, bénéfice brut, frais, bénéfice net, ventes rattachées'],
              ['Catalogue', 'Accès direct aux articles en dépôt et au catalogue du lieu'],
            ].map(([p, d]) => (
              <tr key={p}>
                <td style={tdStyle}><strong>{p}</strong></td>
                <td style={tdStyle}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SousTitre>Enregistrer un événement</SousTitre>
        <Etapes items={[
          ['Ouvre la fiche du lieu', 'Clique sur le lieu depuis la page Marchés.'],
          ['Clique "Nouvel événement"', 'Remplis le nom, la date et les frais (emplacement, transport, autres).'],
          ['Enregistre', 'L\'événement apparaît dans la liste avec son bilan automatique. Les ventes enregistrées ce jour-là sur ce lieu sont rattachées automatiquement.'],
        ]} />
        <Info>Pour que les ventes soient rattachées à un événement, elles doivent avoir été enregistrées <strong>le même jour</strong> que la date de l'événement <strong>et</strong> sur le même lieu.</Info>

        <SousTitre>Ajustement automatique des prix (% ou €)</SousTitre>
        <p style={pStyle}>Dans les réglages d'un lieu, configure un ajustement qui s'applique automatiquement à chaque vente sur ce lieu :</p>
        <ul style={ulStyle}>
          <li><strong>Remise</strong> — Tu vends moins cher sur ce lieu (ex : kermesse scolaire). Ex : Remise de 10%</li>
          <li><strong>Augmentation</strong> — Tu majores les prix sur ce lieu (ex : marché de créateurs). Ex : Augmentation de 30%</li>
          <li><strong>En % ou en €</strong> — Choisis l'unité qui correspond à ta pratique</li>
        </ul>
        <Astuce>L'ajustement s'applique aussi automatiquement au prix calculé lors d'un dépôt. Si tu modifies le réglage après, tu peux recalculer tous les prix du catalogue en un clic ("Recalculer tous les prix").</Astuce>
      </Section>

      {/* 7. Catalogue */}
      <Section id="catalogue" num="7" titre="Catalogue par lieu de vente">
        <p style={pStyle}>Chaque lieu peut avoir son propre catalogue : liste des articles proposés avec des prix spécifiques à ce lieu. Accès depuis <strong>Marchés → fiche du lieu → Catalogue</strong> ou depuis <strong>Réglages → lien Catalogue</strong>.</p>

        <SousTitre>Ce que tu vois dans le catalogue</SousTitre>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Section</th>
              <th style={thStyle}>Contenu</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['En dépôt ici', 'Articles physiquement déposés chez ce lieu, avec la quantité exacte présente, le prix de vente et la marge'],
              ['Dans le catalogue', 'Articles référencés pour ce lieu (avec prix spécifique) mais pas en dépôt physique'],
              ['Ajouter des articles', 'Tous les autres articles disponibles — tu peux les ajouter au catalogue ou les déposer directement'],
            ].map(([p, d]) => (
              <tr key={p}>
                <td style={tdStyle}><strong>{p}</strong></td>
                <td style={tdStyle}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SousTitre>Ajouter un article au catalogue</SousTitre>
        <p style={pStyle}>Dans la section "Ajouter des articles au catalogue", entre le prix pour ce lieu et clique <strong>"+ Ajouter"</strong>. L'article sera listé dans le catalogue sans dépôt physique.</p>

        <SousTitre>Déposer un article directement depuis le catalogue</SousTitre>
        <p style={pStyle}>À côté de chaque article dans la liste "Ajouter", le bouton <strong>"Déposer"</strong> ouvre un mini-formulaire. Entre la quantité et le prix (pré-rempli avec le calcul automatique), puis confirme. L'article passe directement dans la section "En dépôt ici".</p>

        <SousTitre>Vendre depuis le catalogue</SousTitre>
        <p style={pStyle}>Sur chaque article en dépôt ou dans le catalogue, le bouton <strong>"Vendre"</strong> ouvre un formulaire rapide (prix, quantité, espèces/carte). La vente est enregistrée et le stock mis à jour automatiquement.</p>

        <SousTitre>Modifier le prix d'un article pour ce lieu</SousTitre>
        <p style={pStyle}>Clique sur l'icône <strong>crayon</strong> à côté du prix d'un article. Le nouveau prix s'applique uniquement pour ce lieu — le prix normal de l'article n'est pas modifié.</p>

        <SousTitre>Annuler un dépôt depuis le catalogue</SousTitre>
        <p style={pStyle}>Dans la section "En dépôt ici", clique sur le <strong>X</strong> à droite du bouton Vendre. Après confirmation, le dépôt est annulé et le stock revient chez toi.</p>

        <SousTitre>Recalculer les prix</SousTitre>
        <p style={pStyle}>Si tu modifies l'ajustement automatique du lieu, le bandeau en haut du catalogue affiche un bouton <strong>"Recalculer tous les prix"</strong> pour mettre à jour tous les articles du catalogue en un clic.</p>

        <SousTitre>Aperçu partageable</SousTitre>
        <p style={pStyle}>Clique sur <strong>"Aperçu partageable"</strong> pour voir une présentation propre du catalogue :</p>
        <ul style={ulStyle}>
          <li>Photo, nom, catégorie, notes et prix de chaque article</li>
          <li>Aucun prix d'achat ni marge visible (confidentiel)</li>
          <li>Bouton "Imprimer ce catalogue" pour générer un PDF à partager</li>
        </ul>
        <Astuce>Parfait pour envoyer aux organisateurs de marchés ou afficher sur une table lors d'un événement.</Astuce>
      </Section>

      {/* 8. Historique ventes */}
      <Section id="ventes" num="8" titre="Historique des ventes">
        <p style={pStyle}>La page <strong>Ventes</strong> liste toutes les ventes enregistrées avec 5 filtres de période : Cette semaine / Ce mois / Ce trimestre / Cette année / Tout.</p>
        <SousTitre>Chaque ligne affiche</SousTitre>
        <ul style={ulStyle}>
          <li>Photo de l'article (conservée même si le produit est supprimé ensuite)</li>
          <li>Nom, date, canal de vente, quantité, acheteur, notes</li>
          <li>Mode de paiement et badge remise si applicable</li>
          <li>Prix de vente et marge nette</li>
          <li>Bouton "Annuler" pour corriger une erreur</li>
        </ul>
        <SousTitre>Export CSV</SousTitre>
        <p style={pStyle}>Clique sur <strong>"Exporter"</strong> pour télécharger les ventes de la période en cours au format CSV, compatible avec Excel.</p>
      </Section>

      {/* 9. Stats */}
      <Section id="stats" num="9" titre="Statistiques">
        <p style={pStyle}>La page <strong>Stats</strong> donne une vue détaillée de tes performances, filtrée par période.</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Section</th>
              <th style={thStyle}>Ce que tu trouves</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Par lieu de vente', 'CA brut, frais, bénéfice net et nombre de ventes par lieu — pour voir quels marchés sont les plus rentables'],
              ['Par catégorie', 'CA et marge par catégorie et sous-catégorie avec barre proportionnelle'],
              ['Top produits', 'Les 15 articles qui ont généré le plus de CA sur la période'],
              ['Dépôts en cours', 'Articles actuellement déposés chez un lieu de vente avec la quantité immobilisée'],
            ].map(([s, d]) => (
              <tr key={s}>
                <td style={tdStyle}><strong>{s}</strong></td>
                <td style={tdStyle}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 10. URSSAF */}
      <Section id="urssaf" num="10" titre="Récap mensuel URSSAF">
        <p style={pStyle}>La page <strong>Récap</strong> te donne un tableau mois par mois pour suivre tes cotisations.</p>
        <SousTitre>Ce que tu vois par mois</SousTitre>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Colonne</th>
              <th style={thStyle}>Signification</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['CA', 'Chiffre d\'affaires du mois'],
              ['Marge', 'Bénéfice net du mois'],
              ['URSSAF due', 'Estimation des cotisations à 12,3% (prélevées trimestriellement)'],
              ['Espèces / Carte', 'Répartition des modes de paiement'],
              ['Direct / Lieux', 'Répartition des canaux de vente'],
              ['Ticket moyen', 'Prix moyen par vente'],
            ].map(([col, desc]) => (
              <tr key={col}>
                <td style={tdStyle}><strong>{col}</strong></td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <SousTitre>Marquer l'URSSAF comme payée</SousTitre>
        <Etapes items={[
          ['Clique "Marquer URSSAF payée"', 'Pour le trimestre concerné.'],
          ['Sélectionne la date de paiement', 'La date est enregistrée et reste visible.'],
          ['La ligne passe au vert', 'Avec la date confirmée.'],
        ]} />
        <Info>Code couleur — <strong style={{ color: 'var(--color-success)' }}>Vert</strong> : payée · <strong style={{ color: 'var(--color-danger)' }}>Rouge</strong> : en retard · <strong style={{ color: 'var(--color-warning)' }}>Orange</strong> : à payer · <strong style={{ color: 'var(--color-text-muted)' }}>Gris</strong> : aucune vente ce mois.</Info>
        <p style={pStyle}>Les totaux annuels s'affichent en bas du tableau. Navigue entre les années avec les flèches en haut.</p>
      </Section>

      {/* 11. Réglages */}
      <Section id="reglages" num="11" titre="Réglages">
        <SousTitre>Catégories et sous-catégories</SousTitre>
        <p style={pStyle}>Crée tes propres catégories (Bijoux, Déco, Enfant…) et sous-catégories pour organiser ton stock. Pour supprimer une catégorie, assure-toi qu'aucun article ne l'utilise encore.</p>
        <SousTitre>Lieux de vente</SousTitre>
        <p style={pStyle}>Crée et gère tes marchés, kermesses et revendeurs. Clique sur <strong>"Catalogue"</strong> à côté d'un lieu pour gérer ses articles, ou sur le <strong>crayon</strong> pour modifier ses réglages rapides. Pour le détail complet d'un lieu (événements, bilan, réglages avancés), passe par la page <strong>Marchés</strong>.</p>
        <Info>Les données sont sauvegardées dans le cloud — elles ne se perdent jamais, même si tu changes de téléphone ou d'ordinateur.</Info>
      </Section>

      <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', borderTop: '1px solid var(--color-border)' }}>
        Les Pépites de G&A · Guide utilisateur · magasin-app.vercel.app
      </div>
    </div>
  )
}

// ——— Composants utilitaires de mise en page ———

const pStyle: React.CSSProperties = { color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }
const ulStyle: React.CSSProperties = { paddingLeft: 20, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.8, marginBottom: 'var(--space-3)' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }
const thStyle: React.CSSProperties = { background: 'var(--color-primary)', color: 'white', padding: '9px 14px', textAlign: 'left', fontWeight: 600, fontSize: 'var(--text-xs)' }
const tdStyle: React.CSSProperties = { padding: '8px 14px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top', color: 'var(--color-text-secondary)' }

function Section({ id, num, titre, children }: { id: string; num: string; titre: string; children: React.ReactNode }) {
  return (
    <div id={id} className="card card-body" style={{ marginBottom: 'var(--space-5)', scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '2px solid var(--color-border)' }}>
        <div style={{ background: 'var(--color-primary)', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {num}
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>{titre}</h2>
      </div>
      {children}
    </div>
  )
}

function SousTitre({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', margin: 'var(--space-4) 0 var(--space-2)' }}>{children}</h3>
}

function Etapes({ items }: { items: [string, string][] }) {
  return (
    <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
      {items.map(([titre, desc], i) => (
        <li key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <div style={{ background: '#2C2416', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
            {i + 1}
          </div>
          <div>
            <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{titre}</strong>
            {desc && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function Astuce({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-success-light)', borderLeft: '4px solid var(--color-success)', borderRadius: '0 var(--radius) var(--radius) 0', padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-3) 0', fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
      <strong>Astuce :</strong> {children}
    </div>
  )
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-accent-light)', borderLeft: '4px solid var(--color-accent)', borderRadius: '0 var(--radius) var(--radius) 0', padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-3) 0', fontSize: 'var(--text-xs)', color: 'var(--color-accent-dark)' }}>
      {children}
    </div>
  )
}

function Attention({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-danger-light)', borderLeft: '4px solid var(--color-danger)', borderRadius: '0 var(--radius) var(--radius) 0', padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-3) 0', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
      <strong>Attention :</strong> {children}
    </div>
  )
}

function Badge({ children, rouge }: { children: React.ReactNode; rouge?: boolean }) {
  return (
    <span style={{ display: 'inline-block', background: rouge ? 'var(--color-danger-light)' : 'var(--color-primary-light)', color: rouge ? 'var(--color-danger)' : 'var(--color-primary)', borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  )
}
