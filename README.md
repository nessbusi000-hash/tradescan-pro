# TradeScan Pro 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

**Plateforme de trading professionnelle avec analyse Smart Money Concept (SMC/ICT)**

![TradeScan Pro](https://img.shields.io/badge/TradeScan-Pro-6366f1?style=for-the-badge)

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Documentation](#documentation)
- [API](#api)
- [Screenshots](#screenshots)
- [Contributions](#contributions)
- [License](#license)

## 🎯 Aperçu

TradeScan Pro est une plateforme de trading complète qui combine :
- **Analyse technique avancée** basée sur le Smart Money Concept
- **Graphiques TradingView** en temps réel
- **Détection automatique** des patterns SMC (FVG, BOS, CHoCH, Liquidité)
- **Module de formation** complet
- **Simulation de trading** (mode démo)

### Smart Money Concept (SMC)

Le SMC est une approche d'analyse qui suit le comportement des institutions :
- **Liquidité** - Zones de stops et ordres en attente
- **Order Blocks** - Zones d'accumulation institutionnelle
- **Fair Value Gaps** - Déséquilibres de prix
- **BOS/CHoCH** - Breaks et changements de structure

## ✨ Fonctionnalités

### 📊 Trading
- ✅ Graphiques TradingView officiels
- ✅ Données de marché temps réel (Alpha Vantage)
- ✅ Panel d'ordres BUY/SELL (démo)
- ✅ Liste des positions ouvertes
- ✅ Watchlist personnalisable

### 🤖 Analyse SMC
- ✅ Détection automatique des FVG
- ✅ Identification des BOS et CHoCH
- ✅ Détection des Liquidity Sweeps
- ✅ Signaux de trading générés
- ✅ Analyse multi-timeframes

### 📚 Formation
- ✅ Leçons interactives sur le SMC
- ✅ Progression de l'apprentissage
- ✅ Exemples pratiques
- ✅ Checklists de trading

### 🔐 Sécurité
- ✅ Authentification JWT
- ✅ Protection OWASP
- ✅ Rate limiting
- ✅ Validation des entrées

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│   React + Vite  │◄────│  Node + Express │◄────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Alpha Vantage  │
                        │   (Market API)  │
                        └─────────────────┘
```

### Stack technique

**Backend**
- Node.js 18+ + Express 4
- PostgreSQL 14+
- JWT Authentication
- Winston Logging

**Frontend**
- React 18 + Vite 5
- Tailwind CSS 3
- React Query
- Lightweight Charts

**APIs externes**
- Alpha Vantage (données marché)
- TradingView Widget (graphiques)

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 14+
- [Git](https://git-scm.com/)

### Étapes rapides

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/tradescan-pro.git
cd tradescan-pro

# 2. Lancer le script d'installation
node scripts/setup.js

# 3. Configurer la base de données
psql -c "CREATE DATABASE tradescan;"
psql -d tradescan -f database/schema.sql

# 4. Configurer les variables d'environnement
# Éditer backend/.env et frontend/.env

# 5. Lancer le backend
cd backend && npm run dev

# 6. Lancer le frontend (nouveau terminal)
cd frontend && npm run dev
```

### Installation manuelle

#### Backend

```bash
cd backend
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos configurations

npm run dev
```

#### Frontend

```bash
cd frontend
npm install

# Créer le fichier .env
cp .env.example .env

npm run dev
```

## 💻 Utilisation

### Accès

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Documentation API**: http://localhost:5000/api/health

### Compte démo

```
Email: admin@tradescan.pro
Mot de passe: admin123
```

### Flux de trading

1. **Analyser** - Utilisez l'onglet Trading pour voir les graphiques
2. **Détecter** - Les signaux SMC apparaissent automatiquement
3. **Apprendre** - Consultez les leçons pour comprendre les setups
4. **Simuler** - Utilisez le panel d'ordres en mode démo

## 📖 Documentation

- [Architecture](docs/architecture.md) - Architecture technique détaillée
- [API Documentation](docs/api-docs.md) - Documentation complète de l'API
- [Guide SMC](docs/smc-guide.md) - Guide du Smart Money Concept

### Leçons disponibles

- [Introduction à la Liquidité](lessons/liquidity.md)
- [Break of Structure (BOS)](lessons/bos.md)
- [Change of Character (CHoCH)](lessons/choch.md)
- [Fair Value Gaps (FVG)](lessons/fvg.md)
- [FVG Retest](lessons/fvg-retest.md)
- [FVG Reject](lessons/fvg-reject.md)

## 🔌 API

### Endpoints principaux

```
POST   /api/auth/register      # Inscription
POST   /api/auth/login         # Connexion
GET    /api/auth/profile       # Profil utilisateur

GET    /market/data/:symbol    # Données marché
GET    /market/historical/:sym # Données historiques

POST   /smc/analyze            # Analyse SMC complète
POST   /smc/fvg                # Détection FVG
POST   /smc/bos                # Détection BOS
POST   /smc/choch              # Détection CHoCH
POST   /smc/signal             # Signal actuel

GET    /lessons                # Liste des leçons
GET    /lessons/:slug          # Détail d'une leçon
```

Voir [API Documentation](docs/api-docs.md) pour plus de détails.

## 📸 Screenshots

*À venir*

## 🤝 Contributions

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License

Distribué sous licence MIT. Voir [LICENSE](LICENSE) pour plus d'informations.

## 🙏 Remerciements

- [ICT](https://www.youtube.com/c/InnerCircleTrader) - Inner Circle Trader
- [Alpha Vantage](https://www.alphavantage.co/) - API de données marché
- [TradingView](https://www.tradingview.com/) - Widgets de graphiques
- [shadcn/ui](https://ui.shadcn.com/) - Composants UI

## 📧 Contact

Pour toute question ou suggestion :
- Email: contact@tradescan.pro
- Twitter: [@TradeScanPro](https://twitter.com/tradescanpro)

---

<p align="center">
  <strong>TradeScan Pro - Trade smarter, not harder</strong>
</p>

<p align="center">
  Made with ❤️ by traders, for traders
</p>