#!/usr/bin/env tsx
/**
 * Script de validation des exercices
 * Vérifie la conformité de tous les fichiers JSON avant le build
 * 
 * Usage: npm run validate
 */

import * as fs from 'fs';
import * as path from 'path';

// Types inline pour éviter les problèmes d'import
type Level = "CP" | "CE1" | "CE2";
type Domain = "francais" | "maths" | "questionner-le-monde" | "emc" | "anglais" | "arts" | "eps";

interface Question {
  prompt: string;
  answer: string;
  hint?: string;
  options?: string[];
  pair?: string;
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
  questions: Question[];
  correction: { mode: "list" | "short_text"; v: string[] | string };
  seo: {
    title: string;
    description: string;
    tags: string[];
    internalLinks: string[];
    nextSuggestions: string[];
  };
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

const LEVEL_CONSTRAINTS: Record<Level, { min: number; max: number }> = {
  CP: { min: 6, max: 12 },
  CE1: { min: 8, max: 15 },
  CE2: { min: 12, max: 18 }
};

const CONTENT_DIR = path.join(process.cwd(), 'content/exercises');

function validateExercise(exercise: Exercise, filename: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Champs obligatoires
  const required = ['date', 'level', 'domain', 'skill', 'type', 'title', 'slug', 'h1', 'instruction', 'questions', 'correction', 'seo'];
  for (const field of required) {
    if (!(exercise as any)[field]) {
      errors.push({ field, message: `Champ "${field}" manquant`, severity: 'error' });
    }
  }

  // Nombre de questions par niveau
  if (exercise.level && exercise.questions) {
    const constraints = LEVEL_CONSTRAINTS[exercise.level];
    if (constraints) {
      if (exercise.questions.length < constraints.min) {
        errors.push({
          field: 'questions',
          message: `${exercise.level}: min ${constraints.min} questions requises, ${exercise.questions.length} trouvées`,
          severity: 'error'
        });
      }
      if (exercise.questions.length > constraints.max) {
        errors.push({
          field: 'questions',
          message: `${exercise.level}: max ${constraints.max} questions recommandé, ${exercise.questions.length} trouvées`,
          severity: 'warning'
        });
      }
    }
  }

  // Questions non vides
  if (exercise.questions) {
    exercise.questions.forEach((question, i) => {
      if (!question.prompt?.trim()) {
        errors.push({ field: `questions[${i}].prompt`, message: `Question ${i + 1}: prompt vide`, severity: 'error' });
      }
      if (!question.answer?.trim()) {
        errors.push({ field: `questions[${i}].answer`, message: `Question ${i + 1}: réponse vide`, severity: 'error' });
      }
    });
  }

  // Cohérence correction / questions
  if (exercise.correction && exercise.questions) {
    if (exercise.correction.mode === 'list' && Array.isArray(exercise.correction.v)) {
      if (exercise.correction.v.length !== exercise.questions.length) {
        errors.push({
          field: 'correction',
          message: `${exercise.questions.length} questions mais ${exercise.correction.v.length} corrections`,
          severity: 'error'
        });
      }
    }
  }

  // Format date
  if (exercise.date && !/^\d{4}-\d{2}-\d{2}$/.test(exercise.date)) {
    errors.push({ field: 'date', message: 'Format date invalide (attendu: YYYY-MM-DD)', severity: 'error' });
  }

  // Format slug
  if (exercise.slug && !/^[a-z0-9-]+$/.test(exercise.slug)) {
    errors.push({ field: 'slug', message: 'Slug invalide (minuscules, chiffres, tirets)', severity: 'error' });
  }

  // SEO
  if (exercise.seo) {
    if (exercise.seo.title && exercise.seo.title.length > 60) {
      errors.push({ field: 'seo.title', message: 'Titre SEO > 60 caractères', severity: 'warning' });
    }
    if (exercise.seo.description && exercise.seo.description.length > 160) {
      errors.push({ field: 'seo.description', message: 'Description SEO > 160 caractères', severity: 'warning' });
    }
  }

  return errors;
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  console.log('🔍 Validation des exercices...\n');
  
  const files = walkDir(CONTENT_DIR);
  
  if (files.length === 0) {
    console.log('⚠️  Aucun fichier JSON trouvé dans', CONTENT_DIR);
    process.exit(0);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  let validCount = 0;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const exercise = JSON.parse(content) as Exercise;
      const errors = validateExercise(exercise, relativePath);
      
      const criticalErrors = errors.filter(e => e.severity === 'error');
      const warnings = errors.filter(e => e.severity === 'warning');
      
      if (criticalErrors.length > 0) {
        console.log(`❌ ${relativePath}`);
        criticalErrors.forEach(e => console.log(`   ├─ ERROR: ${e.message}`));
        warnings.forEach(e => console.log(`   └─ WARN: ${e.message}`));
        totalErrors += criticalErrors.length;
      } else if (warnings.length > 0) {
        console.log(`⚠️  ${relativePath}`);
        warnings.forEach(e => console.log(`   └─ WARN: ${e.message}`));
        validCount++;
      } else {
        console.log(`✅ ${relativePath}`);
        validCount++;
      }
      
      totalWarnings += warnings.length;
      
    } catch (err) {
      console.log(`❌ ${relativePath}`);
      console.log(`   └─ ERROR: JSON invalide - ${(err as Error).message}`);
      totalErrors++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`📊 Résumé: ${validCount}/${files.length} valides`);
  console.log(`   Erreurs: ${totalErrors} | Avertissements: ${totalWarnings}`);
  
  if (totalErrors > 0) {
    console.log('\n❌ Validation échouée - corrigez les erreurs avant le build');
    process.exit(1);
  } else {
    console.log('\n✅ Validation réussie !');
    process.exit(0);
  }
}

main();
