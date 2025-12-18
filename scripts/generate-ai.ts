#!/usr/bin/env tsx
/**
 * Générateur d'exercices via OpenAI API (GPT-4)
 * Inspiré du workflow Melicolori : génération automatique + SEO
 * 
 * Usage:
 *   npm run generate:ai
 *   npm run generate:ai -- --count 10
 *   npm run generate:ai -- --count 5 --level CE1 --domain math
 * 
 * Variables d'environnement:
 *   OPENAI_API_KEY    - Clé API OpenAI (obligatoire)
 *   OPENAI_MODEL      - Modèle à utiliser (défaut: gpt-4o)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

type Level = 'CP' | 'CE1' | 'CE2';
type Domain = 'fr' | 'math' | 'qlm' | 'emc' | 'lv';

interface ExerciseItem {
  q: string;
  a: string;
  hint?: string;
  options?: string[];
}

interface Exercise {
  date: string;
  level: Level;
  domain: Domain;
  skill: string;
  type: string;
  theme: string;
  title: string;
  slug: string;
  h1: string;
  instruction: string;
  items: ExerciseItem[];
  correction: { mode: 'list'; v: string[] };
  seo: {
    title: string;
    description: string;
    tags: string[];
    internalLinks: string[];
    nextSuggestions: string[];
  };
}

interface GenerationConfig {
  level: Level;
  domain: Domain;
  type: string;
  skill: string;
  theme: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// CONFIGURATION OPENAI
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Distribution pondérée des domaines
const DOMAIN_WEIGHTS: Record<Domain, number> = {
  fr: 40,
  math: 30,
  qlm: 15,
  emc: 10,
  lv: 5
};

// Compétences par domaine et niveau
const SKILLS: Record<Domain, Record<Level, string[]>> = {
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

// Types d'exercices par domaine
const EXERCISE_TYPES: Record<Domain, string[]> = {
  fr: ['phrases-a-trous', 'qcm', 'vrai-faux', 'relier'],
  math: ['calcul-mental', 'probleme', 'qcm', 'relier'],
  qlm: ['qcm', 'vrai-faux', 'relier'],
  emc: ['vrai-faux', 'qcm'],
  lv: ['relier', 'qcm', 'phrases-a-trous']
};

// Contraintes par niveau
const LEVEL_CONSTRAINTS: Record<Level, { min: number; max: number; style: string }> = {
  CP: { min: 6, max: 10, style: 'très simple, mots courts' },
  CE1: { min: 8, max: 12, style: 'simple, phrases de 8-12 mots' },
  CE2: { min: 10, max: 16, style: 'élaboré mais accessible' }
};

// ============================================================================
// PROMPTS OPENAI
// ============================================================================

const SYSTEM_PROMPT = `Tu es un expert en pédagogie pour le Cycle 2 (CP, CE1, CE2) en France.
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

function buildPrompt(config: GenerationConfig): string {
  const constraint = LEVEL_CONSTRAINTS[config.level];
  const today = new Date().toISOString().split('T')[0];
  const domainName = {
    fr: 'français',
    math: 'mathématiques',
    qlm: 'questionner le monde',
    emc: 'EMC',
    lv: 'anglais'
  }[config.domain];

  return `Génère un exercice ${config.level} en ${domainName}.

PARAMÈTRES :
- Niveau : ${config.level}
- Domaine : ${config.domain}
- Compétence : ${config.skill}
- Type : ${config.type}
- Thème : ${config.theme}
- Date : ${today}

CONTRAINTES ${config.level} :
- Entre ${constraint.min} et ${constraint.max} items
- Style : ${constraint.style}

Le slug doit commencer par ${today.replace(/-/g, '')}.
correction.v doit avoir EXACTEMENT autant d'éléments que items.

Réponds UNIQUEMENT avec le JSON valide.`;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateExercise(exercise: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const required = ['date', 'level', 'domain', 'skill', 'type', 'title', 'slug', 'h1', 'instruction', 'items', 'correction', 'seo'];
  for (const field of required) {
    if (!exercise[field]) {
      errors.push({ field, message: `Champ "${field}" manquant` });
    }
  }

  if (exercise.level && !['CP', 'CE1', 'CE2'].includes(exercise.level)) {
    errors.push({ field: 'level', message: `Niveau invalide: ${exercise.level}` });
  }

  if (exercise.level && exercise.items) {
    const constraint = LEVEL_CONSTRAINTS[exercise.level as Level];
    if (constraint) {
      if (exercise.items.length < constraint.min) {
        errors.push({ field: 'items', message: `Min ${constraint.min} items pour ${exercise.level}` });
      }
      if (exercise.items.length > constraint.max + 2) {
        errors.push({ field: 'items', message: `Max ${constraint.max} items pour ${exercise.level}` });
      }
    }
  }

  if (exercise.items) {
    exercise.items.forEach((item: any, i: number) => {
      if (!item.q?.trim()) errors.push({ field: `items[${i}].q`, message: `Question ${i + 1} vide` });
      if (!item.a?.trim()) errors.push({ field: `items[${i}].a`, message: `Réponse ${i + 1} vide` });
    });
  }

  if (exercise.correction?.mode === 'list' && exercise.items) {
    if (!Array.isArray(exercise.correction.v)) {
      errors.push({ field: 'correction.v', message: 'correction.v doit être un tableau' });
    } else if (exercise.correction.v.length !== exercise.items.length) {
      errors.push({ field: 'correction', message: `${exercise.items.length} items mais ${exercise.correction.v.length} corrections` });
    }
  }

  if (exercise.slug && !/^[a-z0-9-]+$/.test(exercise.slug)) {
    errors.push({ field: 'slug', message: 'Slug invalide' });
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

function selectDomain(): Domain {
  const total = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
    random -= weight;
    if (random <= 0) return domain as Domain;
  }
  return 'fr';
}

function getSeasonalTheme(): string {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  
  if (month === 12) return 'Noël';
  if (month === 1 && day <= 15) return 'Nouvel An';
  if (month === 10 && day >= 20) return 'Halloween';
  if (month === 4) return 'Pâques';
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
}

function selectConfig(forceLevel?: Level, forceDomain?: Domain): GenerationConfig {
  const level = forceLevel || (['CP', 'CE1', 'CE2'] as Level[])[Math.floor(Math.random() * 3)];
  const domain = forceDomain || selectDomain();
  
  const skills = SKILLS[domain][level];
  const skill = skills[Math.floor(Math.random() * skills.length)];
  
  const types = EXERCISE_TYPES[domain];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return { level, domain, skill, type, theme: getSeasonalTheme() };
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non définie');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API Error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateExercise(config: GenerationConfig, maxRetries = 3): Promise<Exercise> {
  const prompt = buildPrompt(config);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  🤖 Appel OpenAI ${OPENAI_MODEL} (tentative ${attempt}/${maxRetries})...`);
      
      const text = await callOpenAI(prompt);
      let jsonText = text.trim();
      
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
      }
      
      const exercise = JSON.parse(jsonText) as Exercise;
      const { isValid, errors } = validateExercise(exercise);
      
      if (!isValid) {
        console.log(`  ⚠️ Validation échouée:`, errors.map(e => e.message).join(', '));
        if (attempt === maxRetries) {
          throw new Error(`Validation échouée: ${errors[0].message}`);
        }
        continue;
      }
      
      return exercise;
      
    } catch (error) {
      console.log(`  ❌ Erreur: ${(error as Error).message}`);
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  throw new Error('Échec après retries');
}

function saveExercise(exercise: Exercise): string {
  const date = new Date(exercise.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const dir = path.join(process.cwd(), 'content/exercises', String(year), month);
  fs.mkdirSync(dir, { recursive: true });
  
  const filepath = path.join(dir, `${exercise.slug}.json`);
  fs.writeFileSync(filepath, JSON.stringify(exercise, null, 2), 'utf-8');
  
  return filepath;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  
  const count = parseInt(getArg('count') || '3');
  const level = getArg('level') as Level | undefined;
  const domain = getArg('domain') as Domain | undefined;
  
  console.log(`\n🎲 Génération IA de ${count} exercice(s) avec OpenAI\n`);
  console.log(`   API Key: ${OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`   Modèle: ${OPENAI_MODEL}`);
  console.log(`   Niveau: ${level || 'aléatoire'}`);
  console.log(`   Domaine: ${domain || 'pondéré'}\n`);
  
  if (!OPENAI_API_KEY) {
    console.error('❌ Définissez OPENAI_API_KEY dans votre .env');
    process.exit(1);
  }
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < count; i++) {
    const config = selectConfig(level, domain);
    console.log(`[${i + 1}/${count}] ${config.level} - ${config.domain} - ${config.skill}`);
    
    try {
      const exercise = await generateExercise(config);
      const filepath = saveExercise(exercise);
      console.log(`  ✅ ${exercise.title}`);
      console.log(`     → ${path.relative(process.cwd(), filepath)}\n`);
      success++;
    } catch (error) {
      console.log(`  ❌ Échec: ${(error as Error).message}\n`);
      failed++;
    }
    
    if (i < count - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('─'.repeat(50));
  console.log(`📊 Résultat: ${success} réussis, ${failed} échoués`);
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
