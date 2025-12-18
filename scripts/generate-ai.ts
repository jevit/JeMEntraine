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
 *
 * Configuration:
 *   Les prompts, compétences et paramètres SEO sont dans /config/
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Import des configurations
import {
  AI_CONFIG,
  DOMAIN_WEIGHTS,
  SKILLS,
  EXERCISE_TYPES,
  LEVEL_CONSTRAINTS,
  SEASONAL_THEMES,
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  DOMAIN_NAMES,
  SITE_CONFIG,
  type Level,
  type Domain
} from '../config';

// ============================================================================
// TYPES
// ============================================================================

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
const OPENAI_MODEL = process.env.OPENAI_MODEL || AI_CONFIG.defaultModel;

// ============================================================================
// PROMPTS
// ============================================================================

function buildPrompt(config: GenerationConfig): string {
  const constraint = LEVEL_CONSTRAINTS[config.level];
  const today = new Date().toISOString().split('T')[0];
  const domainName = DOMAIN_NAMES[config.domain];

  return USER_PROMPT_TEMPLATE
    .replace(/{level}/g, config.level)
    .replace('{domainName}', domainName)
    .replace('{domain}', config.domain)
    .replace('{skill}', config.skill)
    .replace('{type}', config.type)
    .replace('{theme}', config.theme)
    .replace('{date}', today)
    .replace('{minItems}', String(constraint.min))
    .replace('{maxItems}', String(constraint.max))
    .replace('{style}', constraint.style)
    .replace('{dateSlug}', today.replace(/-/g, ''));
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

  if (exercise.level && !(SITE_CONFIG.levels as readonly string[]).includes(exercise.level)) {
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

  for (const [theme, config] of Object.entries(SEASONAL_THEMES)) {
    if (config.months.includes(month)) {
      if (config.days) {
        if (day >= config.days.from && day <= config.days.to) {
          return theme;
        }
      } else {
        return theme;
      }
    }
  }

  // Fallback sur la saison
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
}

function selectConfig(forceLevel?: Level, forceDomain?: Domain): GenerationConfig {
  const level = forceLevel || (SITE_CONFIG.levels[Math.floor(Math.random() * SITE_CONFIG.levels.length)] as Level);
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

  const response = await fetch(AI_CONFIG.apiUrl, {
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
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
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

async function generateExercise(config: GenerationConfig): Promise<Exercise> {
  const prompt = buildPrompt(config);

  for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`  🤖 Appel OpenAI ${OPENAI_MODEL} (tentative ${attempt}/${AI_CONFIG.maxRetries})...`);
      
      const text = await callOpenAI(prompt);
      let jsonText = text.trim();
      
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
      }
      
      const exercise = JSON.parse(jsonText) as Exercise;
      const { isValid, errors } = validateExercise(exercise);
      
      if (!isValid) {
        console.log(`  ⚠️ Validation échouée:`, errors.map(e => e.message).join(', '));
        if (attempt === AI_CONFIG.maxRetries) {
          throw new Error(`Validation échouée: ${errors[0].message}`);
        }
        continue;
      }

      return exercise;

    } catch (error) {
      console.log(`  ❌ Erreur: ${(error as Error).message}`);
      if (attempt === AI_CONFIG.maxRetries) throw error;
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
      await new Promise(r => setTimeout(r, AI_CONFIG.delayBetweenExercises));
    }
  }

  console.log('─'.repeat(50));
  console.log(`📊 Résultat: ${success} réussis, ${failed} échoués`);
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
