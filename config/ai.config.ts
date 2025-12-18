/**
 * Configuration IA pour la génération d'exercices
 * Modifiez ce fichier pour personnaliser les prompts et paramètres
 */

import type { Level, Domain } from './site.config';

// ============================================================================
// CONFIGURATION OPENAI
// ============================================================================

export const AI_CONFIG = {
  // URL de l'API
  apiUrl: 'https://api.openai.com/v1/chat/completions',

  // Modèle par défaut (peut être override via OPENAI_MODEL env)
  defaultModel: 'gpt-4o',

  // Paramètres de génération
  temperature: 0.7,
  maxTokens: 2000,

  // Nombre de tentatives en cas d'échec
  maxRetries: 3,

  // Délai entre les exercices (ms)
  delayBetweenExercises: 1000
} as const;

// ============================================================================
// DISTRIBUTION DES DOMAINES
// ============================================================================

/**
 * Pondération pour la sélection aléatoire des domaines
 * Total = 100, ajustez selon vos besoins
 */
export const DOMAIN_WEIGHTS: Record<Domain, number> = {
  fr: 40,     // 40% Français
  math: 30,   // 30% Mathématiques
  qlm: 15,    // 15% Questionner le monde
  emc: 10,    // 10% EMC
  lv: 5       //  5% Langues vivantes
};

// ============================================================================
// COMPÉTENCES PAR DOMAINE ET NIVEAU
// ============================================================================

export const SKILLS: Record<Domain, Record<Level, string[]>> = {
  fr: {
    CP: [
      'Reconnaître les lettres',
      'Lire des syllabes simples',
      'Compléter avec le/la/les',
      'Identifier les sons voyelles',
      'Reconnaître le son d\'attaque'
    ],
    CE1: [
      'Distinguer les sons on/an',
      'Conjuguer être et avoir au présent',
      'Identifier le verbe',
      'Accorder en genre et nombre',
      'Identifier nom/verbe/adjectif'
    ],
    CE2: [
      'Conjuguer au présent/passé/futur',
      'Identifier COD et COI',
      'Utiliser et/est, a/à',
      'Accorder le participe passé',
      'Enrichir une phrase'
    ]
  },
  math: {
    CP: [
      'Additionner jusqu\'à 10',
      'Soustraire jusqu\'à 10',
      'Compter jusqu\'à 100',
      'Comparer des nombres',
      'Résoudre un problème simple'
    ],
    CE1: [
      'Additionner jusqu\'à 100',
      'Soustraire avec retenue',
      'Tables de 2 et 5',
      'Lire l\'heure',
      'Résoudre un problème'
    ],
    CE2: [
      'Multiplier (tables 2 à 9)',
      'Diviser par 2 et 5',
      'Calculer avec 3 chiffres',
      'Convertir des mesures',
      'Calculer un périmètre'
    ]
  },
  qlm: {
    CP: [
      'Les parties du corps',
      'Les saisons',
      'Vivant/non-vivant',
      'Les jours de la semaine'
    ],
    CE1: [
      'Les états de l\'eau',
      'Les milieux de vie',
      'Les besoins des plantes',
      'Se repérer sur un plan'
    ],
    CE2: [
      'Le cycle de l\'eau',
      'Le système solaire',
      'La chaîne alimentaire',
      'Lire une carte'
    ]
  },
  emc: {
    CP: ['Règles de politesse', 'Les émotions', 'Règles de vie en classe'],
    CE1: ['Droits et devoirs', 'Situations de danger', 'Coopérer'],
    CE2: ['Les élections', 'Les discriminations', 'Débattre']
  },
  lv: {
    CP: ['Couleurs en anglais', 'Compter jusqu\'à 10'],
    CE1: ['Se présenter', 'Les animaux'],
    CE2: ['Décrire une personne', 'Poser des questions']
  }
};

// ============================================================================
// TYPES D'EXERCICES PAR DOMAINE
// ============================================================================

export const EXERCISE_TYPES: Record<Domain, string[]> = {
  fr: ['phrases-a-trous', 'qcm', 'vrai-faux', 'relier'],
  math: ['calcul-mental', 'probleme', 'qcm', 'relier'],
  qlm: ['qcm', 'vrai-faux', 'relier'],
  emc: ['vrai-faux', 'qcm'],
  lv: ['relier', 'qcm', 'phrases-a-trous']
};

// ============================================================================
// CONTRAINTES PAR NIVEAU
// ============================================================================

export const LEVEL_CONSTRAINTS: Record<Level, { min: number; max: number; style: string }> = {
  CP: {
    min: 3,
    max: 5,
    style: 'très simple, mots courts, une seule notion à la fois'
  },
  CE1: {
    min: 4,
    max: 5,
    style: 'simple, phrases de 8-12 mots, progression logique'
  },
  CE2: {
    min: 4,
    max: 5,
    style: 'accessible, phrases claires, difficulté progressive'
  }
};

// ============================================================================
// THÈMES SAISONNIERS
// ============================================================================

export const SEASONAL_THEMES: Record<string, { months: number[]; days?: { from: number; to: number } }> = {
  'Noël': { months: [12] },
  'Nouvel An': { months: [1], days: { from: 1, to: 15 } },
  'Halloween': { months: [10], days: { from: 20, to: 31 } },
  'Pâques': { months: [4] },
  'Printemps': { months: [3, 4, 5] },
  'Été': { months: [6, 7, 8] },
  'Automne': { months: [9, 10, 11] },
  'Hiver': { months: [12, 1, 2] }
};

// ============================================================================
// PROMPTS IA
// ============================================================================

/**
 * Prompt système pour la génération d'exercices
 * Ce prompt définit le comportement et le format attendu
 * Intègre les bonnes pratiques pédagogiques et d'apprentissage
 */
export const SYSTEM_PROMPT = `Tu es un expert en pédagogie et en sciences cognitives de l'apprentissage pour le Cycle 2 (CP, CE1, CE2) en France.
Tu génères des exercices éducatifs au format JSON strict, en appliquant rigoureusement les bonnes pratiques d'apprentissage.

═══════════════════════════════════════════════════════════════════
🎯 RÈGLES ABSOLUES DE QUALITÉ (PRIORITÉ MAXIMALE)
═══════════════════════════════════════════════════════════════════

1. EXACTITUDE OBLIGATOIRE :
   - Chaque réponse DOIT être 100% correcte et vérifiable
   - Pour les maths : vérifie DEUX FOIS chaque calcul avant de l'inclure
   - Pour le français : vérifie l'orthographe, la grammaire, la conjugaison
   - JAMAIS de réponse approximative ou ambiguë
   - Si tu n'es pas SÛR à 100% d'une réponse, NE L'INCLUS PAS

2. UNE SEULE RÉPONSE POSSIBLE :
   - Chaque question a UNE et UNE SEULE réponse correcte
   - Pas d'ambiguïté dans la formulation
   - La question doit être claire et précise

3. MAXIMUM 5 QUESTIONS PAR EXERCICE :
   - CP : 3 à 5 items maximum
   - CE1/CE2 : 4 à 5 items maximum
   - Qualité > Quantité : moins de questions mais parfaitement correctes

═══════════════════════════════════════════════════════════════════
📚 BONNES PRATIQUES D'APPRENTISSAGE (SCIENCES COGNITIVES)
═══════════════════════════════════════════════════════════════════

1. CHARGE COGNITIVE MINIMALE :
   - Une seule notion par exercice
   - Questions courtes et claires
   - Vocabulaire adapté strictement au niveau
   - Éviter les distracteurs inutiles

2. PROGRESSION LOGIQUE :
   - Commencer par le plus simple
   - Augmenter graduellement la difficulté dans l'exercice
   - La dernière question peut être légèrement plus complexe

3. FEEDBACK POSITIF :
   - Consigne encourageante et bienveillante
   - Formulation positive ("Tu vas réussir", "C'est facile")
   - Pas de formulation négative ou culpabilisante

4. ANCRAGE MÉMORIEL :
   - Utiliser des contextes familiers à l'enfant
   - Relier à des situations concrètes du quotidien
   - Pour les maths : utiliser des objets concrets (bonbons, billes, etc.)

5. INDICES PÉDAGOGIQUES :
   - Ajouter un "hint" utile quand la question peut poser difficulté
   - L'indice guide sans donner la réponse
   - Formulé de manière à stimuler la réflexion

═══════════════════════════════════════════════════════════════════
⚠️ VÉRIFICATIONS OBLIGATOIRES AVANT DE RÉPONDRE
═══════════════════════════════════════════════════════════════════

□ Chaque calcul mathématique est vérifié DEUX FOIS
□ Chaque conjugaison est correcte
□ Chaque accord est respecté
□ Le corrigé correspond EXACTEMENT aux items (même ordre, même nombre)
□ Les questions sont dans un ordre de difficulté croissante
□ Maximum 5 items dans l'exercice
□ Vocabulaire adapté au niveau (CP = très simple)
□ Pas de contenu sous copyright
□ Réponses sans ambiguïté

═══════════════════════════════════════════════════════════════════
📝 FORMAT JSON OBLIGATOIRE
═══════════════════════════════════════════════════════════════════

{
  "date": "YYYY-MM-DD",
  "level": "CP|CE1|CE2",
  "domain": "fr|math|qlm|emc|lv",
  "skill": "compétence courte",
  "type": "type d'exercice",
  "theme": "thème saisonnier",
  "title": "titre court et engageant",
  "slug": "yyyymmdd-titre-minuscules",
  "h1": "Titre H1 motivant",
  "instruction": "Consigne positive et encourageante",
  "items": [{ "q": "question", "a": "réponse exacte", "hint": "indice optionnel" }],
  "correction": { "mode": "list", "v": ["réponse1", "réponse2"] },
  "seo": {
    "title": "max 60 chars",
    "description": "max 160 chars",
    "tags": ["tag1", "tag2"],
    "internalLinks": ["/niveau/matiere"],
    "nextSuggestions": []
  }
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

/**
 * Template pour le prompt utilisateur
 * Les variables seront remplacées lors de la génération
 * Renforce les bonnes pratiques d'apprentissage
 */
export const USER_PROMPT_TEMPLATE = `Génère un exercice {level} en {domainName}.

═══════════════════════════════════════════════════════════════════
📋 PARAMÈTRES DE L'EXERCICE
═══════════════════════════════════════════════════════════════════
- Niveau : {level}
- Domaine : {domain}
- Compétence : {skill}
- Type : {type}
- Thème : {theme}
- Date : {date}

═══════════════════════════════════════════════════════════════════
⚠️ CONTRAINTES STRICTES POUR {level}
═══════════════════════════════════════════════════════════════════
- MAXIMUM {maxItems} items (pas plus !)
- Minimum {minItems} items
- Style : {style}

═══════════════════════════════════════════════════════════════════
🎯 RAPPEL CRITIQUE : QUALITÉ ET EXACTITUDE
═══════════════════════════════════════════════════════════════════
1. VÉRIFIE DEUX FOIS chaque réponse avant de l'inclure
2. Difficulté PROGRESSIVE : du plus simple au plus complexe
3. Consigne POSITIVE et ENCOURAGEANTE
4. UN SEUL concept par exercice
5. Ajoute des "hints" utiles pour guider l'apprentissage

═══════════════════════════════════════════════════════════════════
📚 BONNES PRATIQUES D'APPRENTISSAGE À APPLIQUER
═══════════════════════════════════════════════════════════════════
- Utilise des contextes CONCRETS et FAMILIERS (école, maison, jeux)
- Pour les maths : utilise des objets que l'enfant connaît
- Pour le français : phrases simples avec vocabulaire courant
- Favorise la RÉUSSITE : questions accessibles pour encourager

═══════════════════════════════════════════════════════════════════
✅ VÉRIFICATIONS FINALES
═══════════════════════════════════════════════════════════════════
□ Le slug commence par {dateSlug}
□ correction.v a EXACTEMENT le même nombre d'éléments que items
□ Chaque réponse est 100% correcte
□ Les questions sont ordonnées par difficulté croissante

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après.`;

/**
 * Noms des domaines pour les prompts
 */
export const DOMAIN_NAMES: Record<Domain, string> = {
  fr: 'français',
  math: 'mathématiques',
  qlm: 'questionner le monde',
  emc: 'EMC',
  lv: 'anglais'
};
