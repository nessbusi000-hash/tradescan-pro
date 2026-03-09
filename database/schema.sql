-- ============================================================
-- TradeScan Pro - Schéma de base de données PostgreSQL
-- ============================================================

-- Suppression des tables existantes (attention en production!)
DROP TABLE IF EXISTS user_lesson_progress CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- Table des utilisateurs
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'::jsonb,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur l'email pour les recherches rapides
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================================
-- Table des trades
-- ============================================================
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop')),
    volume DECIMAL(15, 8) NOT NULL,
    entry_price DECIMAL(15, 8) NOT NULL,
    exit_price DECIMAL(15, 8),
    stop_loss DECIMAL(15, 8),
    take_profit DECIMAL(15, 8),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'pending')),
    pnl DECIMAL(15, 2),
    pnl_percent DECIMAL(8, 4),
    commission DECIMAL(10, 4) DEFAULT 0,
    swap DECIMAL(10, 4) DEFAULT 0,
    strategy VARCHAR(50),
    timeframe VARCHAR(10),
    notes TEXT,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes de trades
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_opened_at ON trades(opened_at DESC);

-- ============================================================
-- Table des leçons
-- ============================================================
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 10,
    tags JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les leçons
CREATE INDEX idx_lessons_slug ON lessons(slug);
CREATE INDEX idx_lessons_category ON lessons(category);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty);
CREATE INDEX idx_lessons_published ON lessons(is_published);
CREATE INDEX idx_lessons_order ON lessons(order_index);
CREATE INDEX idx_lessons_category_order ON lessons(category, order_index);

-- ============================================================
-- Table de progression des leçons
-- ============================================================
CREATE TABLE user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    time_spent_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Index pour la progression
CREATE INDEX idx_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_progress_completed ON user_lesson_progress(completed);

-- ============================================================
-- Fonctions et triggers
-- ============================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON user_lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Insertion des données initiales
-- ============================================================

-- Utilisateur admin par défaut (mot de passe: admin123)
-- Le hash doit être généré avec bcrypt
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    gen_random_uuid(),
    'admin@tradescan.pro',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G',
    'Admin',
    'TradeScan',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Leçons SMC par défaut
INSERT INTO lessons (slug, title, description, content, category, difficulty, order_index, duration_minutes, tags) VALUES
(
    'introduction-smc',
    'Introduction au Smart Money Concept',
    'Découvrez les bases du Smart Money Concept et comment les institutions tradent.',
    '# Introduction au Smart Money Concept

Le Smart Money Concept (SMC) est une approche d\'analyse technique qui se concentre sur le comportement des institutions et des gros joueurs du marché.

## Qu\'est-ce que le Smart Money ?

Le "Smart Money" désigne les capitaux gérés par des professionnels : banques, fonds d\'investissement, market makers...

## Pourquoi suivre le Smart Money ?

- Les institutions ont plus d\'informations que les particuliers
- Leurs ordres créent des mouvements de prix significatifs
- Comprendre leur logique permet d\'anticiper les mouvements

## Concepts clés du SMC

1. **Liquidité** - Où se trouvent les stops
2. **Order Blocks** - Zones d\'accumulation institutionnelle
3. **Fair Value Gaps** - Déséquilibres de prix
4. **Break of Structure** - Continuation de tendance
5. **Change of Character** - Changement de tendance',
    'smc-basics',
    'beginner',
    1,
    15,
    '["smc", "introduction", "smart money"]'
),
(
    'comprendre-liquidite',
    'Comprendre la Liquidité',
    'Apprenez à identifier les zones de liquidité et les liquidity sweeps.',
    '# Comprendre la Liquidité

La liquidité est le concept fondamental du SMC. C\'est là que les institutions trouvent les ordres nécessaires à leurs positions.

## Types de Liquidité

### Equal Highs (EH)
Plusieurs highs au même niveau = stops des vendeurs au-dessus

### Equal Lows (EL)
Plusieurs lows au même niveau = stops des acheteurs en-dessous

## Liquidity Sweep

Quand le prix prend la liquidité puis rebrousse immédiatement.

**Signification**: Les institutions ont récolté les stops et sont prêtes à inverser.',
    'smc-basics',
    'beginner',
    2,
    20,
    '["smc", "liquidité", "liquidity sweep"]'
),
(
    'order-blocks',
    'Les Order Blocks',
    'Identifiez les zones d\'accumulation et distribution institutionnelle.',
    '# Les Order Blocks

Un Order Block est la dernière bougie baissière avant un mouvement haussier (ou inversement).

## Caractéristiques

- Zone de forte concentration d\'ordres
- Souvent testée avant continuation
- Agit comme support/résistance

## Types d\'Order Blocks

**Bullish OB**: Dernière bougie baissière avant pump
**Bearish OB**: Dernière bougie haussière avant dump',
    'smc-advanced',
    'intermediate',
    3,
    25,
    '["smc", "order block", "institution"]'
),
(
    'fair-value-gaps',
    'Les Fair Value Gaps (FVG)',
    'Maîtrisez la détection et l\'utilisation des FVG dans votre trading.',
    '# Les Fair Value Gaps (FVG)

Un FVG est un déséquilibre entre l\'offre et la demande visible sur 3 bougies.

## Structure

**FVG Haussier**: Low de la bougie 3 > High de la bougie 1
**FVG Baissier**: High de la bougie 3 < Low de la bougie 1

## Utilisation

1. **Entrée**: Attendre le retest du FVG
2. **Stop**: De l\'autre côté du FVG
3. **Target**: Prochain niveau clé

## FVG Mitigated

Un FVG devient "mitigated" quand le prix le traverse complètement.',
    'smc-advanced',
    'intermediate',
    4,
    30,
    '["smc", "fvg", "fair value gap", "imbalance"]'
),
(
    'bos-choch',
    'BOS et CHoCH',
    'Différenciez la continuation du changement de tendance.',
    '# BOS et CHoCH

## Break of Structure (BOS)

Signal de **continuation** de tendance.

- **Bullish BOS**: Break d\'un swing high en tendance haussière
- **Bearish BOS**: Break d\'un swing low en tendance baissière

## Change of Character (CHoCH)

Signal de **changement** de tendance.

- **Bullish CHoCH**: Break d\'un swing high après tendance baissière
- **Bearish CHoCH**: Break d\'un swing low après tendance haussière

## Comment les utiliser

1. Identifier la tendance HTF
2. Attendre un CHoCH pour signal d\'alerte
3. Confirmer avec BOS dans la nouvelle direction',
    'smc-advanced',
    'advanced',
    5,
    25,
    '["smc", "bos", "choch", "structure"]'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Permissions
-- ============================================================

-- Création d'un utilisateur pour l'application (à adapter selon votre environnement)
-- CREATE USER tradescan_app WITH PASSWORD 'votre_mot_de_passe_securise';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tradescan_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tradescan_app;