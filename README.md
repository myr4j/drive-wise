# DriveWise

Compagnon mobile IA de prévention de la fatigue pour conducteurs VTC. DriveWise surveille en temps réel les signaux comportementaux de conduite pour prédire la fatigue et envoyer des suggestions bienveillantes — sans jamais être intrusif.

**Ce que DriveWise EST :**
- Un compagnon de route qui veille sur le conducteur
- Un outil de prédiction basé sur des signaux objectifs
- Un conseiller suggestif, jamais autoritaire

**Ce que DriveWise N'EST PAS :**
- Un traceur GPS intrusif
- Un outil de surveillance patronale
- Un optimiseur de revenus

---

## Architecture

```
drive-wise/
├── backend/
│   ├── app/
│   │   ├── main.py                  # Point d'entrée FastAPI
│   │   ├── database/
│   │   │   ├── base.py              # Session SQLAlchemy
│   │   │   └── init_db.py           # Initialisation de la base
│   │   ├── models/                  # Modèles ORM (Driver, Shift, Snapshot)
│   │   ├── routes/
│   │   │   ├── auth.py              # Inscription / connexion
│   │   │   └── shift.py             # Cycle de vie des trajets
│   │   ├── schemas/                 # Validation Pydantic (v2)
│   │   └── services/
│   │       ├── auth.py              # Hachage mot de passe, JWT
│   │       ├── feature_engineering.py  # Métriques de conduite / pause
│   │       ├── predictor.py         # Inférence XGBoost
│   │       ├── shap_explainer.py    # Explications SHAP par prédiction
│   │       ├── suggestion.py        # Suggestions LLM (Groq / fallback)
│   │       └── summary.py           # Résumé de fin de trajet
│   ├── ml/
│   │   ├── train.py                 # Pipeline d'entraînement XGBoost
│   │   ├── data/
│   │   │   ├── generate_dataset.py  # Générateur de données synthétiques
│   │   │   └── fatigue_dataset.csv  # Jeu d'entraînement (10 000 lignes)
│   │   └── saved_models/
│   │       └── xgboost_model.joblib # Modèle entraîné
│   ├── tests/                       # Tests pytest (unit + intégration)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── screens/                 # Auth, Dashboard, ActiveShift, History, Stats, Settings
    │   ├── components/              # FatigueGauge, ShiftCard, composants UI
    │   ├── services/                # Client HTTP (Axios)
    │   ├── store/                   # État global Zustand (auth, shift, fatigue)
    │   ├── hooks/                   # useLocation (GPS), useShift (snapshots auto)
    │   ├── utils/                   # Thème, formateurs, validateurs
    │   ├── types/                   # Interfaces TypeScript
    │   └── navigation/              # AppNavigator (onglets + pile)
    ├── App.tsx
    └── app.json
```

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Backend API** | FastAPI 0.115.0 | API async, docs OpenAPI auto, validation Pydantic |
| **Base de données** | SQLite + SQLAlchemy | Stockage sans configuration |
| **Modèle ML** | XGBoost 2.1.1 | Prédiction de fatigue sur données tabulaires |
| **Interprétabilité** | SHAP 0.46.0 | Explication par prédiction pour la confiance du conducteur |
| **LLM** | Groq API (Llama 3.2) | Génération de suggestions personnalisées en français |
| **Auth** | JWT + Bcrypt (passlib) | Hachage des mots de passe, tokens d'accès |
| **Mobile** | React Native 0.81 + Expo 54 | Application cross-platform (iOS, Android, web) |
| **UI** | React Native Paper 5 | Composants Material Design |
| **État** | Zustand 5 | Stores réactifs légers |
| **Formulaires** | React Hook Form + Zod | Validation côté client |
| **Navigation** | React Navigation 7 | Onglets du bas + navigation en pile |
| **GPS** | expo-location | Tracking temps réel avec gestion des permissions |
| **Tests** | pytest | Tests unitaires et d'intégration |

---

## Prérequis

- Python 3.8+
- Node.js 18+
- npm ou yarn
- Une clé API Groq (pour les suggestions LLM)

---

## Installation & Démarrage

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Définir la variable d'environnement :

```bash
export GROQ_API_KEY=your_api_key_here   # Linux/macOS
set GROQ_API_KEY=your_api_key_here      # Windows
```

Entraîner le modèle ML (si le modèle sauvegardé n'existe pas) :

```bash
python ml/train.py
```

Démarrer le serveur :

```bash
uvicorn app.main:app --reload
```

L'API est disponible sur `http://localhost:8000`. La documentation interactive est accessible sur `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm start
```

Puis scanner le QR code avec Expo Go, ou lancer :

```bash
npm run android   # Émulateur Android
npm run ios       # Simulateur iOS (macOS requis)
npm run web       # Navigateur
```

L'URL de l'API backend est configurée dans `frontend/app.json` (défaut : `http://172.20.10.2:8000` pour partage de connexion Android).

---

## Endpoints API

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Créer un compte conducteur |
| POST | `/auth/login` | Se connecter et obtenir un token JWT |

### Trajets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/shift/start` | Démarrer un nouveau trajet |
| POST | `/shift/{shift_id}/snapshot` | Enregistrer un snapshot GPS (toutes les 30 s) |
| POST | `/shift/{shift_id}/end` | Terminer le trajet et obtenir le résumé |
| GET | `/shift/{shift_id}/status` | Statut courant d'un trajet |
| GET | `/shift/driver/list` | Liste paginée des trajets du conducteur |
| GET | `/shift/driver/stats` | Statistiques globales + tendance 7 jours |
| GET | `/shift/ml/feature-importance` | Importance des variables du modèle XGBoost |

---

## Modèle de données

### Driver
Compte conducteur avec authentification.

### Shift
Session de conduite :
- `started_at`, `ended_at` : horodatages
- `status` : `active` / `completed`
- `active_driving_h`, `total_break_min`, `break_count` : métriques agrégées
- `last_suggestion_time`, `last_fatigue_level` : anti-harcèlement

### Snapshot
Point de données temps réel (toutes les 30 secondes) :
- GPS : `speed_kmh`, `latitude`, `longitude`
- Features : `shift_duration_h`, `time_since_last_break_min`, `driving_ratio`, `break_count`, `is_night`, `is_post_lunch_dip`, `hour_sin/cos`
- Prédictions : `fatigue_score` (0–1), `fatigue_level`
- Suggestion : `suggestion_given`, `suggestion_message`, `suggestion_delivery`

---

## Prédiction de fatigue

Le modèle XGBoost prédit un score continu (0–1) à partir de 10 variables :

| Variable | Poids approximatif |
|----------|-------------------|
| Durée du trajet | 30 % |
| Temps depuis la dernière pause | 25 % |
| Conduite de nuit | 15 % |
| Ratio de conduite active | 10 % |
| Déficit de pause | 10 % |
| Creux post-déjeuner (13h–16h) | 5 % |
| Heures de conduite active | 5 % |

Seuils de classification :

| Niveau | Score | Comportement |
|--------|-------|--------------|
| **Faible** | < 0.3 | Aucune suggestion |
| **Modéré** | 0.3 – 0.6 | Notification in-app |
| **Élevé** | 0.6 – 0.8 | Notification push douce |
| **Critique** | > 0.8 | Notification push forte |

Une pause est détectée quand la vitesse est inférieure à 5 km/h pendant au moins 2 minutes consécutives.

---

## Logique de suggestion

Le système évite le harcèlement tout en restant efficace :

1. Aucune suggestion si le niveau est **faible**
2. Notification immédiate en cas d'**escalade** (ex. modéré → élevé)
3. Sinon, délai minimal de **30 minutes** entre deux suggestions
4. Messages générés par le LLM Groq (Llama 3.2, max 120 caractères, en français)
5. Messages de **fallback** codés en dur si l'API Groq est indisponible

---

## Explications SHAP

À chaque snapshot, SHAP décompose la prédiction en contributions par variable. Le conducteur peut consulter :
- Les facteurs qui augmentent la fatigue détectée
- Les facteurs qui la réduisent
- Un classement global de l'importance des variables

---

## Tests

```bash
cd backend
pytest tests/ -v
```

Les tests couvrent : authentification, feature engineering, prédiction ML, génération de suggestions, liste et pagination des trajets, génération de résumés.
