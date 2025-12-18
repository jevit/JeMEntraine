import type { Exercise, Level, Domain } from '../types/exercise';
import { validateExercise } from './validator';
import * as fs from 'fs';
import * as path from 'path';

const CONTENT_DIR = 'content/exercises';

/**
 * Charge tous les exercices depuis le dossier content
 */
export async function loadAllExercises(): Promise<Exercise[]> {
  const exercises: Exercise[] = [];
  
  // Parcourir récursivement le dossier content/exercises
  const walkDir = (dir: string): string[] => {
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
  };

  const jsonFiles = walkDir(CONTENT_DIR);
  
  for (const file of jsonFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const exercise = JSON.parse(content) as Exercise;
      
      // Valider l'exercice
      const validation = validateExercise(exercise);
      if (validation.isValid) {
        exercises.push(exercise);
      } else {
        console.warn(`⚠️ Exercice invalide ignoré: ${file}`);
        validation.errors.forEach(e => console.warn(`  - ${e.message}`));
      }
    } catch (error) {
      console.error(`❌ Erreur lecture ${file}:`, error);
    }
  }

  return exercises;
}

/**
 * Charge les exercices pour un niveau donné
 */
export async function loadExercisesByLevel(level: Level): Promise<Exercise[]> {
  const all = await loadAllExercises();
  return all.filter(e => e.level === level);
}

/**
 * Charge les exercices pour un domaine donné
 */
export async function loadExercisesByDomain(domain: Domain): Promise<Exercise[]> {
  const all = await loadAllExercises();
  return all.filter(e => e.domain === domain);
}

/**
 * Charge les exercices par niveau et domaine
 */
export async function loadExercisesByLevelAndDomain(
  level: Level,
  domain: Domain
): Promise<Exercise[]> {
  const all = await loadAllExercises();
  return all.filter(e => e.level === level && e.domain === domain);
}

/**
 * Charge un exercice par son slug
 */
export async function loadExerciseBySlug(slug: string): Promise<Exercise | null> {
  const all = await loadAllExercises();
  return all.find(e => e.slug === slug) ?? null;
}

/**
 * Charge les N exercices les plus récents
 */
export async function loadRecentExercises(count: number = 10): Promise<Exercise[]> {
  const all = await loadAllExercises();
  return all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

/**
 * Recherche d'exercices par mot-clé
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const all = await loadAllExercises();
  const lowerQuery = query.toLowerCase();
  
  return all.filter(e => 
    e.title.toLowerCase().includes(lowerQuery) ||
    e.h1.toLowerCase().includes(lowerQuery) ||
    e.skill.toLowerCase().includes(lowerQuery) ||
    e.seo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Retourne les exercices liés (même niveau/domaine)
 */
export async function getRelatedExercises(
  exercise: Exercise,
  count: number = 3
): Promise<Exercise[]> {
  const all = await loadAllExercises();
  
  return all
    .filter(e => 
      e.slug !== exercise.slug &&
      (e.level === exercise.level || e.domain === exercise.domain)
    )
    .sort((a, b) => {
      // Priorité: même niveau ET même domaine
      const aScore = (a.level === exercise.level ? 2 : 0) + (a.domain === exercise.domain ? 1 : 0);
      const bScore = (b.level === exercise.level ? 2 : 0) + (b.domain === exercise.domain ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, count);
}

/**
 * Compte les exercices par niveau
 */
export async function countByLevel(): Promise<Record<Level, number>> {
  const all = await loadAllExercises();
  return {
    CP: all.filter(e => e.level === 'CP').length,
    CE1: all.filter(e => e.level === 'CE1').length,
    CE2: all.filter(e => e.level === 'CE2').length
  };
}

/**
 * Compte les exercices par domaine
 */
export async function countByDomain(): Promise<Record<Domain, number>> {
  const all = await loadAllExercises();
  return {
    francais: all.filter(e => e.domain === 'francais').length,
    maths: all.filter(e => e.domain === 'maths').length,
    "questionner-le-monde": all.filter(e => e.domain === 'questionner-le-monde').length,
    emc: all.filter(e => e.domain === 'emc').length,
    anglais: all.filter(e => e.domain === 'anglais').length,
    arts: all.filter(e => e.domain === 'arts').length,
    eps: all.filter(e => e.domain === 'eps').length
  };
}
