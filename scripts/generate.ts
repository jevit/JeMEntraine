#!/usr/bin/env tsx
/**
 * Script de génération automatique d'exercices
 * Génère des exercices d'exemple avec rotation des domaines
 * 
 * Usage: 
 *   npm run generate:daily     - Génère 1 exercice du jour
 *   npm run generate:batch 10  - Génère 10 exercices
 */

import * as fs from 'fs';
import * as path from 'path';

type Level = "CP" | "CE1" | "CE2";
type Domain = "fr" | "math" | "qlm" | "emc" | "lv";

interface ExerciseTemplate {
  domain: Domain;
  type: string;
  skill: string;
  titleTemplate: string;
  instructionTemplate: string;
  generateItems: (level: Level) => { q: string; a: string; hint?: string }[];
}

// Distribution des domaines
const DOMAIN_WEIGHTS: Record<Domain, number> = {
  fr: 40,
  math: 30,
  qlm: 10,
  emc: 8,
  lv: 6
};

// Templates d'exercices par domaine
const TEMPLATES: ExerciseTemplate[] = [
  // MATHS - Additions
  {
    domain: 'math',
    type: 'calcul-mental',
    skill: 'Calculer des additions',
    titleTemplate: 'Additions {level}',
    instructionTemplate: 'Trouve le résultat de chaque addition.',
    generateItems: (level) => {
      const max = level === 'CP' ? 10 : level === 'CE1' ? 20 : 100;
      const count = level === 'CP' ? 8 : level === 'CE1' ? 10 : 14;
      const items = [];
      
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * (max / 2)) + 1;
        const b = Math.floor(Math.random() * (max / 2)) + 1;
        items.push({ q: `${a} + ${b} = ?`, a: String(a + b) });
      }
      return items;
    }
  },
  // MATHS - Soustractions
  {
    domain: 'math',
    type: 'calcul-mental',
    skill: 'Calculer des soustractions',
    titleTemplate: 'Soustractions {level}',
    instructionTemplate: 'Trouve le résultat de chaque soustraction.',
    generateItems: (level) => {
      const max = level === 'CP' ? 10 : level === 'CE1' ? 20 : 100;
      const count = level === 'CP' ? 8 : level === 'CE1' ? 10 : 14;
      const items = [];
      
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * max) + Math.floor(max / 2);
        const b = Math.floor(Math.random() * (a - 1)) + 1;
        items.push({ q: `${a} - ${b} = ?`, a: String(a - b) });
      }
      return items;
    }
  },
  // FRANCAIS - Articles
  {
    domain: 'fr',
    type: 'phrases-a-trous',
    skill: 'Utiliser les articles définis',
    titleTemplate: 'Les articles définis {level}',
    instructionTemplate: 'Complète avec le bon article : le, la, l\' ou les.',
    generateItems: (level) => {
      const words = [
        { word: 'chat', article: 'le' },
        { word: 'maison', article: 'la' },
        { word: 'école', article: 'l\'' },
        { word: 'enfants', article: 'les' },
        { word: 'soleil', article: 'le' },
        { word: 'lune', article: 'la' },
        { word: 'arbre', article: 'l\'' },
        { word: 'oiseaux', article: 'les' },
        { word: 'fleur', article: 'la' },
        { word: 'livre', article: 'le' },
        { word: 'ami', article: 'l\'' },
        { word: 'étoiles', article: 'les' }
      ];
      
      const count = level === 'CP' ? 6 : level === 'CE1' ? 8 : 12;
      const shuffled = words.sort(() => Math.random() - 0.5).slice(0, count);
      
      return shuffled.map(w => ({
        q: `___ ${w.word}`,
        a: w.article
      }));
    }
  },
  // QLM - Saisons
  {
    domain: 'qlm',
    type: 'qcm',
    skill: 'Connaître les caractéristiques des saisons',
    titleTemplate: 'Les saisons {level}',
    instructionTemplate: 'Réponds aux questions sur les saisons.',
    generateItems: (level) => {
      const questions = [
        { q: 'En quelle saison les feuilles tombent-elles ?', a: 'automne' },
        { q: 'Quelle saison vient après l\'hiver ?', a: 'printemps' },
        { q: 'En quelle saison fait-il le plus chaud ?', a: 'été' },
        { q: 'Quand Noël a-t-il lieu ?', a: 'hiver' },
        { q: 'En quelle saison les fleurs poussent-elles ?', a: 'printemps' },
        { q: 'Quelle saison vient avant l\'automne ?', a: 'été' },
        { q: 'En quelle saison neige-t-il souvent ?', a: 'hiver' },
        { q: 'Quand les arbres sont-ils tout verts ?', a: 'été' }
      ];
      
      const count = level === 'CP' ? 6 : level === 'CE1' ? 8 : 8;
      return questions.slice(0, count);
    }
  },
  // EMC - Règles de vie
  {
    domain: 'emc',
    type: 'vrai-faux',
    skill: 'Connaître les règles de vie en classe',
    titleTemplate: 'Les règles de vie {level}',
    instructionTemplate: 'Dis si chaque phrase est vraie ou fausse.',
    generateItems: (level) => {
      const statements = [
        { q: 'Je lève la main avant de parler.', a: 'vrai' },
        { q: 'Je peux courir dans les couloirs.', a: 'faux' },
        { q: 'Je respecte mes camarades.', a: 'vrai' },
        { q: 'Je peux prendre les affaires des autres sans demander.', a: 'faux' },
        { q: 'J\'écoute quand quelqu\'un parle.', a: 'vrai' },
        { q: 'Je peux crier en classe.', a: 'faux' },
        { q: 'Je range mes affaires après le travail.', a: 'vrai' },
        { q: 'Je peux manger en classe quand je veux.', a: 'faux' }
      ];
      
      const count = level === 'CP' ? 6 : level === 'CE1' ? 8 : 8;
      return statements.slice(0, count);
    }
  }
];

// Détermine le thème saisonnier
function getSeasonalTheme(): string {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  
  if (month === 12 && day >= 15) return 'Noël';
  if (month === 1 && day <= 6) return 'Nouvel An';
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
}

// Sélectionne un domaine selon les poids
function selectDomain(): Domain {
  const total = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
    random -= weight;
    if (random <= 0) return domain as Domain;
  }
  return 'fr';
}

// Génère un slug
function generateSlug(title: string, date: string): string {
  const datePrefix = date.replace(/-/g, '');
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  
  return `${datePrefix}-${slug}`;
}

// Génère un exercice
function generateExercise(date: string, level: Level): any {
  const domain = selectDomain();
  const templates = TEMPLATES.filter(t => t.domain === domain);
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const title = template.titleTemplate.replace('{level}', level);
  const items = template.generateItems(level);
  const theme = getSeasonalTheme();
  const slug = generateSlug(title, date);
  
  return {
    date,
    level,
    domain: template.domain,
    skill: template.skill,
    type: template.type,
    theme,
    title,
    slug,
    h1: `${title} - ${level}`,
    instruction: template.instructionTemplate,
    items,
    correction: {
      mode: 'list',
      v: items.map(i => i.a)
    },
    seo: {
      title: `${title} - Exercices ${level} gratuits`,
      description: `Exercices gratuits : ${title} pour le ${level}. ${template.skill}. Avec correction.`,
      tags: [template.domain, level.toLowerCase(), template.type, 'cycle 2', 'exercices'],
      internalLinks: [`/${level.toLowerCase()}`, `/${level.toLowerCase()}/${template.domain}`],
      nextSuggestions: []
    }
  };
}

// Sauvegarde un exercice
function saveExercise(exercise: any): string {
  const date = new Date(exercise.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const dir = path.join(process.cwd(), 'content/exercises', String(year), month);
  fs.mkdirSync(dir, { recursive: true });
  
  const filename = `${exercise.slug}.json`;
  const filepath = path.join(dir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(exercise, null, 2), 'utf-8');
  return filepath;
}

function main() {
  const args = process.argv.slice(2);
  const batch = args.includes('--batch');
  const count = batch ? parseInt(args[args.indexOf('--batch') + 1] || '1') : 1;
  
  const today = new Date().toISOString().split('T')[0];
  const levels: Level[] = ['CP', 'CE1', 'CE2'];
  
  console.log(`🎲 Génération de ${count} exercice(s)...\n`);
  
  for (let i = 0; i < count; i++) {
    const level = levels[i % 3];
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(i / 3));
    const dateStr = date.toISOString().split('T')[0];
    
    const exercise = generateExercise(dateStr, level);
    const filepath = saveExercise(exercise);
    
    console.log(`✅ ${exercise.title} (${exercise.level})`);
    console.log(`   → ${path.relative(process.cwd(), filepath)}\n`);
  }
  
  console.log('🎉 Génération terminée !');
  console.log('💡 Pensez à vérifier les exercices générés avant publication.');
}

main();
