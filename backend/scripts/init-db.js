/**
 * TradeScan Pro — Initialisation de la base de données
 * =====================================================
 * Usage: node scripts/init-db.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tradescan',
  user: process.env.DB_USER || 'tradescan_user',
  password: process.env.DB_PASSWORD,
});

const SCHEMA_PATH = path.resolve(__dirname, '../../database/schema.sql');
const SEED_SQL = `
-- ============================================================
-- Leçons SMC/ICT de démonstration
-- ============================================================

INSERT INTO lessons (id, slug, title, description, content, category, difficulty, order_index, duration_minutes, tags, is_published)
VALUES
(
  gen_random_uuid(), 'introduction-smc',
  'Introduction aux Smart Money Concepts',
  'Découvrez ce que sont les Smart Money Concepts et pourquoi les institutionnels dominent le marché.',
  'Les Smart Money Concepts (SMC) est une approche du trading qui consiste à comprendre et suivre les actions des "smart money", c''est-à-dire les grands acteurs du marché : banques, fonds d''investissement et institutions financières.

## Pourquoi les SMC ?

Les institutions génèrent des volumes considérables qui leur rendent difficile l''entrée et la sortie discrète du marché. Pour compenser cela, elles créent des mouvements de prix artificiels pour :
1. Accumuler des positions à de meilleurs prix
2. Manipuler les traders de détail
3. Distribuer leurs positions sur la liquidité des particuliers

## Les principes fondamentaux

**1. La liquidité**
Le marché se déplace vers les zones de liquidité — là où de nombreux stop-loss et ordres sont concentrés. Les institutionnels ont besoin de cette liquidité pour exécuter leurs ordres massifs.

**2. L''efficacité des prix**
Le marché cherche toujours à combler les inefficacités de prix créées lors de mouvements brusques. Ces zones d''inefficacité sont appelées Fair Value Gaps (FVG).

**3. La structure du marché**
Comprendre si le marché est en tendance haussière ou baissière est essentiel. Cela se mesure via les Break of Structure (BOS) et Change of Character (CHoCH).',
  'smc', 'beginner', 1, 15, '["smc", "introduction", "smart money"]', true
),
(
  gen_random_uuid(), 'fair-value-gaps',
  'Fair Value Gaps (FVG) — Déséquilibres de Prix',
  'Apprenez à identifier et trader les Fair Value Gaps, les zones d''inefficacité créées par les mouvements institutionnels.',
  'Un Fair Value Gap (FVG) est une zone d''inefficacité de prix qui se forme lorsque le marché évolue si rapidement qu''il crée un "trou" entre deux bougies.

## Structure d''un FVG

**FVG Haussier (Bullish FVG)**
- Bougie 1 : établit un high
- Bougie 2 : bougie forte haussière
- Bougie 3 : son low est supérieur au high de la bougie 1
→ Le gap entre le high de la B1 et le low de la B3 est le FVG

**FVG Baissier (Bearish FVG)**
- Bougie 1 : établit un low
- Bougie 2 : bougie forte baissière
- Bougie 3 : son high est inférieur au low de la bougie 1
→ Le gap entre le low de la B1 et le high de la B3 est le FVG

## Comment trader les FVG

1. **Identifier** le FVG sur votre timeframe d''analyse
2. **Attendre** que le prix revienne dans la zone (retest)
3. **Observer** le comportement du prix dans le FVG
4. **Entrer** si le prix rejette la zone avec confirmation
5. **Placer** le stop loss sous (ou au-dessus) du FVG

## Qualité d''un FVG

Tous les FVG ne se valent pas. Les meilleurs FVG :
- Se forment dans la direction de la tendance principale
- Sont créés par un mouvement impulsif fort
- Ne sont pas encore retestés
- S''alignent avec d''autres niveaux clés (BOS, liquidity)',
  'smc', 'intermediate', 2, 20, '["fvg", "fair value gap", "imbalance"]', true
),
(
  gen_random_uuid(), 'break-of-structure',
  'Break of Structure (BOS) et Market Structure',
  'Maîtrisez la lecture de la structure du marché avec les concepts BOS et CHoCH.',
  'La structure du marché est le fondement de toute analyse SMC. Elle nous permet de comprendre si le marché est contrôlé par les acheteurs ou les vendeurs.

## Les structures de base

**Marché haussier**
Une série de Higher Highs (HH) et Higher Lows (HL) confirme une tendance haussière. Chaque fois que le prix casse un HH précédent, on a un Break of Structure (BOS) haussier.

**Marché baissier**
Une série de Lower Lows (LL) et Lower Highs (LH) confirme une tendance baissière. Chaque cassure d''un LL précédent est un BOS baissier.

## Break of Structure (BOS)

Le BOS confirme la continuation de la tendance. Il se produit quand :
- En tendance haussière : le prix casse et clôture au-dessus d''un HH précédent
- En tendance baissière : le prix casse et clôture en dessous d''un LL précédent

## Change of Character (CHoCH)

Le CHoCH signale un potentiel retournement de tendance. Il se produit quand :
- En tendance haussière : le prix casse et clôture en dessous d''un HL précédent
- En tendance baissière : le prix casse et clôture au-dessus d''un LH précédent

## Utilisation pratique

1. Identifier la tendance sur le HTF (Higher Time Frame)
2. Chercher des CHoCH sur le LTF pour des entrées précises
3. Combiner avec les FVG et la liquidité pour des setups haute probabilité',
  'smc', 'intermediate', 3, 25, '["bos", "choch", "structure", "trend"]', true
),
(
  gen_random_uuid(), 'liquidite-sweeps',
  'Zones de Liquidité et Sweeps',
  'Comprenez comment les institutionnels chassent la liquidité avant leurs vrais mouvements.',
  'La liquidité est le carburant du marché. Les institutions ont besoin de liquidité pour exécuter leurs ordres massifs sans faire bouger excessivement le prix.

## Où se trouve la liquidité ?

La liquidité se concentre là où les traders placent leurs ordres :

**1. Equal Highs / Equal Lows**
Deux ou plusieurs hauts/bas au même niveau créent une zone de stop-loss concentrés. Les traders haussiers ont leurs stops sous les equal lows, et vice versa.

**2. Swing Highs / Swing Lows**
Les hauts et bas significatifs sont des zones naturelles de stop-loss.

**3. Niveaux psychologiques**
Les niveaux ronds (1.1000, 1.2000) concentrent beaucoup d''ordres.

## Le Liquidity Sweep

Un sweep de liquidité se produit quand le prix :
1. Dépasse brièvement un niveau de liquidité
2. Active les stop-loss des traders
3. Revient rapidement dans la direction opposée

## Comment trader les sweeps

Après un sweep, cherchez :
- Un retour rapide dans le range précédent
- Un FVG créé lors du sweep
- Un CHoCH confirmant le retournement
- Un BOS confirmant la nouvelle direction

## Exemple de setup

1. Prix en tendance haussière
2. Sweep des equal lows (chasse les acheteurs sur stop)
3. Rebond fort avec CHoCH haussier
4. FVG créé lors du rebond
5. Entrée sur le retest du FVG avec stop sous le sweep',
  'smc', 'advanced', 4, 30, '["liquidity", "sweep", "stop hunt", "institutional"]', true
),
(
  gen_random_uuid(), 'gestion-risque',
  'Gestion du Risque en Trading SMC',
  'Les règles essentielles de money management pour préserver votre capital et rester rentable sur le long terme.',
  'La meilleure stratégie du monde ne vous rendra pas profitable si vous ne gérez pas correctement votre risque. La gestion du risque est LE pilier du trading professionnel.

## La règle du 1-2%

Ne risquez jamais plus de 1-2% de votre capital sur un seul trade.

Exemple avec un compte de 10 000 $ :
- Risque max par trade : 100-200 $
- Si votre stop est à 50 pips sur EURUSD
- Volume max : 0.20-0.40 lots

## Le Risk/Reward Ratio (RRR)

Visez toujours un RRR minimum de 1:2. Cela signifie que votre take profit doit être au moins 2x votre stop loss.

Avec un RRR de 1:2 et un win rate de 40% :
- 4 trades gagnants × 200$ = +800$
- 6 trades perdants × 100$ = -600$
- **Résultat net : +200$**

## Placement des stops

**Méthode SMC :**
- Stop sous le FVG (haussier) ou au-dessus (baissier)
- Stop sous le swing low ayant initié le mouvement
- Stop sous la zone de liquidité sweepée

**Règle d''or :** le stop doit invalider votre analyse. S''il est atteint, c''est que vous aviez tort.

## Journaliser ses trades

Notez CHAQUE trade avec :
- Le setup (FVG, BOS, CHoCH, Liquidity)
- La raison d''entrée
- Le résultat
- Ce que vous auriez pu faire différemment

La journalisation est ce qui sépare les traders amateurs des professionnels.',
  'risk', 'beginner', 5, 20, '["risk management", "money management", "capital", "rrr"]', true
);
`;

async function main() {
  console.log('🔌 Connexion à la base de données...');
  const client = await pool.connect();

  try {
    console.log('📋 Lecture du schéma SQL...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

    console.log('🏗️  Création des tables...');
    await client.query(schema);
    console.log('✅ Tables créées avec succès');

    console.log('🌱 Insertion des données de démonstration...');
    await client.query(SEED_SQL);
    console.log('✅ Données de démonstration insérées');

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('📚 5 leçons SMC ajoutées');
    console.log('\nProchaines étapes :');
    console.log('  1. Démarrer le backend : npm run dev');
    console.log('  2. Créer un compte sur http://localhost:5173\n');
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation :', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
