# 📚 ExoCycle2 - Site Éducatif Cycle 2

Site Astro statique avec génération automatique d'exercices éducatifs via IA pour le Cycle 2 (CP, CE1, CE2).

**Philosophie inspirée de Melicolori** : contenu généré par IA, SEO automatisé, zéro maintenance manuelle.

---

## 🎯 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKFLOW GLOBAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [CRON Daily]                                                  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Generate   │───▶│  Validate   │───▶│   Build     │        │
│   │  (Claude)   │    │  (Zéro Err) │    │   (Astro)   │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│        │                                       │                │
│        ▼                                       ▼                │
│   content/exercises/              dist/ (pages statiques)      │
│   └── 2025/01/*.json              └── exercices/*.html         │
│                                                                 │
│   [Cloudflare Pages / Vercel / Netlify]                        │
│        │                                                        │
│        ▼                                                        │
│   🌐 Site en production                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

```bash
# Cloner et installer
git clone https://github.com/your-repo/exocycle2.git
cd exocycle2
npm install

# Configurer l'API OpenAI (pour génération IA)
cp .env.example .env
# Éditer .env avec votre clé OPENAI_API_KEY

# Lancer en développement
npm run dev
```

### Variables d'environnement

```bash
# .env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx           # Clé API OpenAI (obligatoire)
OPENAI_MODEL=gpt-4o                        # Modèle (défaut: gpt-4o)
SITE_URL=https://exocycle2.fr              # URL de production
EXERCISES_PER_DAY=3                        # Nombre d'exercices/jour
```

---

## 📁 Structure du projet

```
exocycle2/
├── src/
│   ├── components/           # Composants Astro
│   │   ├── ExerciseCard.astro
│   │   ├── ExerciseHeader.astro
│   │   ├── ExerciseItems.astro
│   │   ├── CorrectionToggle.astro
│   │   ├── QuizGame.astro        # Mini-jeu Quiz
│   │   ├── MemoryGame.astro      # Mini-jeu Memory
│   │   └── MatchingGame.astro    # Mini-jeu Relier
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro           # Accueil
│   │   ├── cp/                   # Pages CP
│   │   ├── ce1/                  # Pages CE1
│   │   ├── ce2/                  # Pages CE2
│   │   ├── exercices/[slug].astro
│   │   └── jeux/                 # Mini-jeux
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   └── exercise.ts           # Types TypeScript
│   └── utils/
│       ├── validator.ts          # Validation zéro erreur
│       ├── loader.ts             # Chargement des contenus
│       └── helpers.ts
├── content/
│   └── exercises/                # Exercices JSON générés
│       └── YYYY/MM/*.json
├── scripts/
│   ├── validate.ts               # Validation avant build
│   ├── generate.ts               # Générateur simple (templates)
│   └── generate-ai.ts            # 🤖 Générateur IA (Claude)
└── .github/
    └── workflows/
        └── daily-generation.yml  # Cron GitHub Actions
```

---

## 🤖 Génération automatique avec Claude

### Architecture du système IA

```
┌──────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE GÉNÉRATION IA                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PLANIFICATION                                                │
│     ┌─────────────┐                                              │
│     │ Scheduler   │  → Détermine: niveau, domaine, compétence   │
│     │ (rotation)  │  → Évite les doublons récents               │
│     └─────────────┘  → Applique la saisonnalité                 │
│            │                                                     │
│            ▼                                                     │
│  2. GÉNÉRATION (OpenAI API)                                      │
│     ┌─────────────┐                                              │
│     │  Prompt     │  → System prompt + contraintes niveau       │
│     │  Builder    │  → Format JSON strict (response_format)     │
│     └─────────────┘                                              │
│            │                                                     │
│            ▼                                                     │
│     ┌─────────────┐                                              │
│     │  GPT-4o     │  → Génère l'exercice complet                │
│     │             │  → Inclut SEO, correction, indices          │
│     └─────────────┘                                              │
│            │                                                     │
│            ▼                                                     │
│  3. VALIDATION                                                   │
│     ┌─────────────┐                                              │
│     │ Validator   │  → Vérifie structure JSON                   │
│     │ (zéro err)  │  → Vérifie cohérence items/correction       │
│     └─────────────┘  → Vérifie contraintes niveau               │
│            │                                                     │
│            ▼                                                     │
│  4. STOCKAGE                                                     │
│     ┌─────────────┐                                              │
│     │ File System │  → content/exercises/YYYY/MM/slug.json      │
│     └─────────────┘  → Git commit automatique                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Commandes de génération

```bash
# Génération simple (templates, sans IA)
npm run generate:daily          # 1 exercice/niveau = 3 exercices
npm run generate:batch 30       # 30 exercices

# Génération IA (Claude)
npm run generate:ai             # 3 exercices IA du jour
npm run generate:ai -- --count 10 --level CE1 --domain math
npm run generate:ai -- --week   # Génère une semaine complète

# Validation
npm run validate                # Vérifie tous les exercices
```

---

## 📝 Script de génération IA

Le script `scripts/generate-ai.ts` appelle l'API Claude pour générer des exercices.

### Fonctionnement

1. **Sélection aléatoire** : niveau, domaine, compétence (avec pondération)
2. **Construction du prompt** : contraintes pédagogiques + format JSON
3. **Appel Claude API** : génération de l'exercice complet
4. **Validation** : vérification des règles "zéro erreur"
5. **Sauvegarde** : fichier JSON dans `content/exercises/`

### Distribution des domaines

| Domaine | Poids | Description |
|---------|-------|-------------|
| Français | 40% | Lecture, grammaire, conjugaison |
| Maths | 30% | Calcul, problèmes, géométrie |
| QLM | 15% | Sciences, histoire, géographie |
| EMC | 10% | Vivre ensemble, citoyenneté |
| Anglais | 5% | Vocabulaire, expressions |

### Exemple de prompt envoyé à Claude

```
Tu es un expert en pédagogie pour le Cycle 2 (CP, CE1, CE2).
Génère un exercice CE1 en mathématiques.

PARAMÈTRES :
- Niveau : CE1
- Domaine : math
- Compétence : Additionner jusqu'à 100
- Type : calcul-mental
- Thème : Hiver

CONTRAINTES CE1 :
- Nombre d'items : entre 8 et 12
- Style : simple, phrases de 8-12 mots

Génère UNIQUEMENT le JSON strict...
```

---

## ⏰ Automatisation GitHub Actions

### Workflow quotidien

Fichier `.github/workflows/daily-generation.yml` :

```yaml
name: Daily Exercise Generation

on:
  schedule:
    - cron: '0 6 * * *'  # 6h UTC = 7h/8h France
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      
      - name: Generate with AI
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run generate:ai -- --count 3
        
      - name: Validate
        run: npm run validate
        
      - name: Build
        run: npm run build
        
      - name: Commit & Push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add content/
          git diff --staged --quiet || git commit -m "🤖 Auto-generate $(date +%Y-%m-%d)"
          git push
          
      - name: Deploy Cloudflare
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: exocycle2
          directory: dist
```

### Secrets à configurer

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | Clé API OpenAI |
| `CLOUDFLARE_API_TOKEN` | Token Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | ID compte Cloudflare |

---

## 📊 Modèle de données

### Structure JSON d'un exercice

```json
{
  "date": "2025-01-15",
  "level": "CE1",
  "domain": "math",
  "skill": "Additionner jusqu'à 100",
  "type": "calcul-mental",
  "theme": "Hiver",
  "title": "Additions CE1",
  "slug": "20250115-additions-ce1",
  "h1": "Additions jusqu'à 100 - CE1",
  "instruction": "Trouve le résultat de chaque addition.",
  "items": [
    { "q": "25 + 13 = ?", "a": "38" },
    { "q": "42 + 17 = ?", "a": "59", "hint": "Pense à 42 + 20 - 3" }
  ],
  "correction": {
    "mode": "list",
    "v": ["38", "59"]
  },
  "seo": {
    "title": "Exercices additions CE1 - Calcul mental gratuit",
    "description": "Exercices d'additions pour CE1. Calcul mental jusqu'à 100 avec correction.",
    "tags": ["additions", "CE1", "calcul mental"],
    "internalLinks": ["/ce1/maths"],
    "nextSuggestions": ["20250116-soustractions-ce1"]
  }
}
```

---

## ✅ Règles de validation "Zéro Erreur"

| Règle | CP | CE1 | CE2 |
|-------|:--:|:---:|:---:|
| Items minimum | 6 | 8 | 10 |
| Items maximum | 10 | 12 | 16 |
| Question non vide | ✓ | ✓ | ✓ |
| Réponse non vide | ✓ | ✓ | ✓ |
| `correction.v.length == items.length` | ✓ | ✓ | ✓ |
| Slug format valide | ✓ | ✓ | ✓ |
| SEO title ≤ 60 chars | ✓ | ✓ | ✓ |
| SEO description ≤ 160 chars | ✓ | ✓ | ✓ |

**Le build échoue si un exercice est invalide.**

---

## 🎮 Mini-jeux interactifs

Trois jeux réutilisent le contenu des exercices (100% client-side, vanilla JS) :

| Jeu | URL | Adaptation |
|-----|-----|------------|
| **Quiz** | `/jeux/quiz?level=CE1` | CP: 4 choix, CE2: plus de questions |
| **Memory** | `/jeux/memory?level=CE1` | CP: 4 paires, CE2: 8 paires |
| **Relier** | `/jeux/relier?level=CE1` | CP: 4 items, CE2: 6 items |

---

## 🎨 Design "Kids Modern"

### Caractéristiques

- Coins très arrondis (16-24px)
- Couleurs pastels par niveau
- Emojis comme icônes (pas d'images)
- Animations CSS légères (hover, feedback)
- Responsive mobile-first
- Mode impression intégré

### Couleurs

```css
/* Niveaux */
--color-cp: #f472b6;   /* Rose */
--color-ce1: #34d399;  /* Vert */
--color-ce2: #60a5fa;  /* Bleu */

/* Matières */
--color-francais: #f59e0b;
--color-maths: #3b82f6;
--color-qlm: #10b981;
--color-emc: #8b5cf6;
```

---

## 📈 SEO automatisé

Chaque exercice génère :

- **Meta tags** : title, description, Open Graph
- **Schema.org** : LearningResource structuré
- **Sitemap XML** : généré au build
- **Maillage interne** : liens automatiques vers exercices similaires
- **Pages hub** : `/cp/maths`, `/ce1/francais`, etc.

---

## 🛠️ Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement local |
| `npm run build` | Build production (avec validation) |
| `npm run preview` | Preview du build |
| `npm run validate` | Validation des exercices |
| `npm run generate:daily` | 3 exercices templates |
| `npm run generate:ai` | 3 exercices IA |
| `npm run generate:ai -- --count 10` | 10 exercices IA |

---

## 📦 Déploiement

### Cloudflare Pages (recommandé)

```
Build command: npm run build
Output directory: dist
```

### Vercel / Netlify

```bash
npx vercel --prod
# ou
netlify deploy --prod --dir=dist
```

---

## 🔧 Maintenance quotidienne

Le workflow automatique :

1. **6h UTC** : Génère 3 exercices via OpenAI GPT-4o
2. **Valide** tous les fichiers JSON
3. **Build** le site Astro
4. **Commit** les nouveaux exercices
5. **Déploie** sur Cloudflare Pages

### En cas d'échec

```bash
# Vérifier les logs GitHub Actions
# Puis régénérer manuellement si besoin :
npm run generate:ai -- --count 5
npm run validate
npm run build
```

---

## 💡 Bonnes pratiques IA

1. **3 exercices/jour** suffisent pour un bon SEO
2. **Varier les compétences** : le scheduler alterne automatiquement
3. **Saisonnalité** : thèmes adaptés (Noël, Pâques, etc.)
4. **Validation stricte** : mieux vaut 0 exercice qu'un exercice faux
5. **Retry automatique** : 3 tentatives si GPT rate
6. **Modèle recommandé** : `gpt-4o` pour la qualité, `gpt-4o-mini` pour le coût

---

## 📄 Licence

MIT - Contenu éducatif libre d'utilisation.

---

**Fait avec ❤️ pour les enfants du Cycle 2**
