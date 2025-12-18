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
    min: 6,
    max: 10,
    style: 'très simple, mots courts'
  },
  CE1: {
    min: 8,
    max: 12,
    style: 'simple, phrases de 8-12 mots'
  },
  CE2: {
    min: 10,
    max: 16,
    style: 'élaboré mais accessible'
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
 */
export const SYSTEM_PROMPT = `Tu es un expert en pédagogie pour le Cycle 2 (CP, CE1, CE2) en France.
Tu génères des exercices éducatifs au format JSON strict.

RÈGLES ABSOLUES :
1. Chaque exercice a UNE SEULE réponse possible (pas d'ambiguïté)
2. Le corrigé correspond EXACTEMENT aux items (même ordre, même nombre)
3. Le contenu est adapté au niveau (vocabulaire simple pour CP)
4. Les consignes sont courtes et positives
5. Pas de contenu sous copyright (pas de marques, personnages protégés)
6. Réponds UNIQUEMENT avec le JSON, sans texte avant ou après

FORMAT JSON OBLIGATOIRE :
{
  "date": "YYYY-MM-DD",
  "level": "CP|CE1|CE2",
  "domain": "fr|math|qlm|emc|lv",
  "skill": "compétence courte",
  "type": "type d'exercice",
  "theme": "thème saisonnier",
  "title": "titre court",
  "slug": "yyyymmdd-titre-minuscules",
  "h1": "Titre H1",
  "instruction": "Consigne encourageante",
  "items": [{ "q": "question", "a": "réponse", "hint": "optionnel" }],
  "correction": { "mode": "list", "v": ["réponse1", "réponse2"] },
  "seo": {
    "title": "max 60 chars",
    "description": "max 160 chars",
    "tags": ["tag1", "tag2"],
    "internalLinks": ["/niveau/matiere"],
    "nextSuggestions": []
  }
}`;

/**
 * Template pour le prompt utilisateur
 * Les variables seront remplacées lors de la génération
 */
export const USER_PROMPT_TEMPLATE = `Génère un exercice {level} en {domainName}.

PARAMÈTRES :
- Niveau : {level}
- Domaine : {domain}
- Compétence : {skill}
- Type : {type}
- Thème : {theme}
- Date : {date}

CONTRAINTES {level} :
- Entre {minItems} et {maxItems} items
- Style : {style}

Le slug doit commencer par {dateSlug}.
correction.v doit avoir EXACTEMENT autant d'éléments que items.

Réponds UNIQUEMENT avec le JSON valide.`;

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
