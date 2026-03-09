# Documentation API TradeScan Pro

## Base URL

```
Développement: http://localhost:5000/api
Production: https://api.tradescan.pro/api
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Header

```
Authorization: Bearer <access_token>
```

### Tokens

- **Access Token** : Valide 1 heure
- **Refresh Token** : Valide 7 jours

## Codes de réponse

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 409 | Conflit |
| 422 | Validation échouée |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## Endpoints

### Authentification

#### POST /auth/register

Inscrit un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": "1h"
    }
  }
}
```

#### POST /auth/login

Connecte un utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

#### POST /auth/refresh

Rafraîchit les tokens.

**Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

#### GET /auth/profile

Récupère le profil utilisateur.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

### Marché

#### GET /market/pairs

Récupère la liste des paires supportées.

**Response:**
```json
{
  "success": true,
  "data": [
    { "symbol": "EURUSD", "name": "EUR/USD", "type": "forex" },
    { "symbol": "GBPUSD", "name": "GBP/USD", "type": "forex" }
  ]
}
```

#### GET /market/data/:symbol

Récupère les données de marché pour un symbole.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "price": 1.0850,
    "change": 0.0020,
    "changePercent": 0.18,
    "volume": 125000,
    "high": 1.0860,
    "low": 1.0830,
    "open": 1.0830,
    "previousClose": 1.0830,
    "lastUpdated": "2024-01-15"
  }
}
```

#### GET /market/historical/:symbol

Récupère les données historiques.

**Query:**
- `interval`: 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "interval": "daily",
    "candles": [
      {
        "date": "2024-01-15",
        "open": 1.0830,
        "high": 1.0860,
        "low": 1.0820,
        "close": 1.0850,
        "volume": 125000
      }
    ]
  }
}
```

### SMC (Smart Money Concepts)

#### POST /smc/analyze

Analyse complète SMC pour un symbole.

**Body:**
```json
{
  "symbol": "EURUSD",
  "interval": "daily"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "interval": "daily",
    "timestamp": "2024-01-15T10:00:00Z",
    "trend": {
      "direction": "bullish",
      "strength": 75
    },
    "patterns": {
      "fvg": {
        "count": 5,
        "active": 3,
        "retested": 2,
        "rejected": 1,
        "details": [...]
      },
      "bos": {
        "count": 3,
        "bullish": 2,
        "bearish": 1,
        "recent": [...]
      },
      "choch": {
        "count": 1,
        "bullish": 1,
        "bearish": 0,
        "recent": [...]
      },
      "liquidity": {
        "sweeps": 2,
        "recentSweeps": [...]
      }
    },
    "signals": {
      "best": {
        "type": "BUY",
        "strategy": "FVG_RETEST",
        "entry": 1.0845,
        "stopLoss": 1.0830,
        "takeProfit": 1.0900,
        "confidence": 78
      },
      "all": [...]
    }
  }
}
```

#### POST /smc/fvg

Détecte les Fair Value Gaps.

**Body:**
```json
{
  "symbol": "EURUSD",
  "interval": "daily",
  "options": {
    "minGapPercent": 0.01,
    "maxAge": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "interval": "daily",
    "fvgs": [
      {
        "type": "bullish",
        "startIndex": 10,
        "endIndex": 12,
        "top": 1.0850,
        "bottom": 1.0840,
        "middle": 1.0845,
        "height": 0.0010,
        "heightPercent": 10.5,
        "status": "active",
        "retested": true,
        "rejected": false
      }
    ],
    "signal": { ... }
  }
}
```

#### POST /smc/bos

Détecte les Break of Structure.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "bos": [
      {
        "type": "bullish",
        "breakType": "BOS",
        "swingHighIndex": 15,
        "breakIndex": 20,
        "swingHighPrice": 1.0860,
        "breakPrice": 1.0870,
        "strength": 85,
        "trendConfirmed": true
      }
    ],
    "signal": { ... }
  }
}
```

#### POST /smc/choch

Détecte les Change of Character.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "choch": [
      {
        "type": "bullish",
        "chochType": "CHoCH",
        "trendBefore": "bearish",
        "swingHighIndex": 25,
        "breakIndex": 30,
        "swingHighPrice": 1.0850,
        "breakPrice": 1.0860,
        "strength": 72,
        "confirmed": true
      }
    ],
    "signal": { ... }
  }
}
```

#### POST /smc/liquidity

Détecte les zones de liquidité et sweeps.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "zones": {
      "equalHighs": [
        {
          "price": 1.0900,
          "tolerance": 0.0005,
          "touches": [10, 15, 20],
          "strength": 3
        }
      ],
      "equalLows": [...]
    },
    "sweeps": [
      {
        "type": "bearish",
        "sweepType": "EQUAL_HIGH_SWEEP",
        "zone": { ... },
        "sweepIndex": 25,
        "sweepPrice": 1.0905,
        "closePrice": 1.0890,
        "reversal": 0.15,
        "strength": 80,
        "confirmed": true
      }
    ],
    "signal": { ... }
  }
}
```

#### POST /smc/trend

Analyse la tendance.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "interval": "daily",
    "analysis": {
      "trend": {
        "direction": "bullish",
        "strength": 75
      },
      "movingAverages": {
        "direction": "bullish",
        "strength": 70,
        "fastMA": 1.0840,
        "slowMA": 1.0820
      },
      "priceAction": {
        "direction": "bullish",
        "strength": 80,
        "higherHighs": 8,
        "higherLows": 7
      },
      "supportResistance": {
        "supports": [...],
        "resistances": [...]
      },
      "nearbyLevels": {
        "support": { "price": 1.0820, "strength": 30 },
        "resistance": { "price": 1.0900, "strength": 30 }
      },
      "lastPrice": 1.0850
    }
  }
}
```

#### POST /smc/signal

Récupère le signal actuel.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "interval": "daily",
    "timestamp": "2024-01-15T10:00:00Z",
    "signal": {
      "type": "BUY",
      "strategy": "FVG_REJECTION",
      "entry": 1.0845,
      "stopLoss": 1.0830,
      "takeProfit": 1.0900,
      "confidence": 78,
      "fvg": { ... }
    },
    "alternatives": [...]
  }
}
```

### Leçons

#### GET /lessons

Récupère toutes les leçons.

**Query:**
- `category`: Filtrer par catégorie
- `difficulty`: beginner, intermediate, advanced
- `page`: Numéro de page
- `limit`: Éléments par page

**Response:**
```json
{
  "success": true,
  "data": {
    "lessons": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  }
}
```

#### GET /lessons/:slug

Récupère une leçon par slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "introduction-smc",
    "title": "Introduction au SMC",
    "description": "...",
    "content": "...",
    "category": "smc-basics",
    "difficulty": "beginner",
    "duration_minutes": 15,
    "tags": ["smc", "introduction"]
  }
}
```

#### GET /lessons/user/progress

Récupère la progression de l'utilisateur.

**Response:**
```json
{
  "success": true,
  "data": {
    "lessons": [...],
    "summary": {
      "total": 25,
      "completed": 12,
      "in_progress": 5,
      "not_started": 8,
      "progress_percent": 48
    }
  }
}
```

## Rate Limiting

- **Général** : 1000 requêtes par 15 minutes
- **Authentification** : 5 tentatives par 15 minutes
- **SMC Analysis** : 60 requêtes par minute

## Erreurs

### Format d'erreur standard

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Email invalide" }
  ]
}
```

### Codes d'erreur courants

| Code | Description |
|------|-------------|
| TOKEN_EXPIRED | Le token JWT a expiré |
| INVALID_TOKEN | Token JWT invalide |
| UNAUTHORIZED | Accès non autorisé |
| VALIDATION_ERROR | Données invalides |
| NOT_FOUND | Ressource non trouvée |
| RATE_LIMIT | Trop de requêtes |