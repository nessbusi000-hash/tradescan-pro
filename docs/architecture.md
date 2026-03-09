# Architecture TradeScan Pro

## Vue d'ensemble

TradeScan Pro est une application de trading professionnelle construite avec une architecture moderne **MERN Stack** (MongoDB/PostgreSQL, Express, React, Node.js) et des services spécialisés pour l'analyse technique SMC (Smart Money Concept).

## Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │  Dashboard  │  │   Trading   │  │     Lessons     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   Signals   │  │   Charts    │  │   Order Panel   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Express Server                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │    Auth     │  │   Market    │  │      SMC        │  │   │
│  │  │   Routes    │  │   Routes    │  │     Routes      │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  AUTH SERVICE   │  │ MARKET SERVICE  │  │   SMC SERVICE   │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │  JWT      │  │  │  │  Alpha    │  │  │  │    FVG    │  │
│  │  Bcrypt   │  │  │  │ Vantage   │  │  │  │    BOS    │  │
│  │  Postgres │  │  │  │   Cache   │  │  │  │   CHoCH   │  │
│  └───────────┘  │  │  └───────────┘  │  │  │ Liquidity │  │
└─────────────────┘  └─────────────────┘  │  └───────────┘  │
                                          └─────────────────┘
```

## Stack technique

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Base de données**: PostgreSQL 14+
- **Cache**: In-memory (Redis recommandé en production)
- **Authentification**: JWT (jsonwebtoken)
- **Sécurité**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: express-validator

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Charts**: Lightweight Charts, Recharts
- **Icons**: Lucide React

### APIs externes
- **Alpha Vantage**: Données de marché temps réel
- **TradingView**: Widget de graphiques avancés

## Structure du projet

```
tradescan-pro/
├── backend/
│   ├── config/           # Configuration (DB, Auth, API)
│   ├── api/              # Routes API
│   │   └── routes/       # Définition des routes
│   ├── controllers/      # Logique des contrôleurs
│   ├── services/         # Services métier
│   │   └── smc/          # Services d'analyse SMC
│   ├── models/           # Modèles de données
│   ├── middlewares/      # Middlewares (auth, sécurité)
│   └── server.js         # Point d'entrée
├── frontend/
│   ├── src/
│   │   ├── api/          # Appels API
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages de l'application
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # Contextes React
│   │   └── styles/       # Styles globaux
│   └── public/           # Assets statiques
├── database/
│   └── schema.sql        # Schéma PostgreSQL
├── docs/                 # Documentation
└── lessons/              # Contenu pédagogique
```

## Flux de données

### Authentification
```
1. Client → POST /api/auth/login
2. Serveur → Vérifie credentials
3. Serveur → Génère JWT (access + refresh)
4. Client ← Stocke tokens
5. Client → Requêtes avec Bearer token
6. Serveur → Vérifie JWT → Autorise/Refuse
```

### Analyse SMC
```
1. Client → POST /api/smc/analyze (symbol, interval)
2. Serveur → Récupère données historiques
3. Serveur → Exécute algorithmes SMC
   - Détection FVG
   - Détection BOS/CHoCH
   - Détection Liquidité
   - Analyse de tendance
4. Serveur → Génère signaux
5. Client ← Reçoit analyse complète
```

### Trading (Demo)
```
1. Client → POST /api/trades (order details)
2. Serveur → Valide l'ordre
3. Serveur → Enregistre la position
4. Serveur → Met à jour le portfolio
5. Client ← Confirmation
```

## Services SMC

### 1. FVG Service (`fvg.service.js`)
- Détecte les Fair Value Gaps
- Identifie les retests et rejets
- Calcule la qualité des FVG
- Génère des signaux de trading

### 2. BOS Service (`bos.service.js`)
- Détecte les Break of Structure
- Identifie les points de swing
- Confirme les tendances
- Génère des signaux de continuation

### 3. CHoCH Service (`choch.service.js`)
- Détecte les Change of Character
- Analyse les inversions de tendance
- Calcule le momentum
- Génère des signaux de reversal

### 4. Liquidity Service (`liquidity.service.js`)
- Détecte les zones de liquidité
- Identifie les Equal Highs/Lows
- Détecte les Liquidity Sweeps
- Génère des signaux basés sur la liquidité

### 5. Trend Service (`trend.service.js`)
- Analyse les tendances multi-timeframes
- Calcule les moyennes mobiles
- Détecte les supports/résistances
- Fournit l'analyse HTF/LTF

## Sécurité

### Authentification
- JWT avec expiration courte (1h)
- Refresh tokens (7j)
- Blacklist des tokens invalidés
- Hashage bcrypt des mots de passe (12 rounds)

### Protection API
- Rate limiting (1000 req/15min)
- Rate limiting strict sur auth (5 req/15min)
- CORS configuré
- Helmet pour les headers de sécurité
- Validation des entrées

### Base de données
- Requêtes paramétrées (protection SQL injection)
- Relations avec CASCADE delete
- Index optimisés

## Performance

### Optimisations
- Cache des données de marché (1 min)
- Cache des analyses SMC (30 sec)
- Lazy loading des composants
- Pagination des listes
- Compression gzip

### Scalabilité
- Stateless API (facilement scalable)
- Pool de connexions PostgreSQL
- Possibilité d'ajouter Redis
- Possibilité d'ajouter un load balancer

## Déploiement

### Environnements
- **Développement**: Local avec Docker
- **Staging**: Cloud (Heroku/Railway)
- **Production**: VPS cloud (AWS/GCP/Azure)

### Variables d'environnement
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tradescan
DB_USER=tradescan_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# API
ALPHA_VANTAGE_API_KEY=your_api_key
PORT=5000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://your-domain.com
```

## Monitoring

### Logs
- Winston pour le logging structuré
- Logs d'erreur séparés
- Rotation des logs

### Métriques
- Temps de réponse API
- Taux d'erreur
- Utilisation des ressources
- Performance des requêtes DB

## Roadmap technique

### Court terme
- [ ] WebSocket pour données temps réel
- [ ] Tests unitaires et d'intégration
- [ ] CI/CD pipeline

### Moyen terme
- [ ] Redis pour cache distribué
- [ ] Microservices pour SMC
- [ ] Machine Learning pour prédiction

### Long terme
- [ ] Connexion aux brokers (REST/WebSocket)
- [ ] Trading algorithmique
- [ ] Application mobile