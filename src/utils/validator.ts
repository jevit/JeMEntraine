import type { Exercise, Level, LEVEL_CONSTRAINTS } from '../types/exercise';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

const LEVEL_ITEM_CONSTRAINTS: Record<Level, { min: number; max: number }> = {
  CP: { min: 6, max: 12 },
  CE1: { min: 8, max: 15 },
  CE2: { min: 12, max: 18 }
};

/**
 * Valide un exercice selon les règles "ZÉRO ERREUR"
 */
export function validateExercise(exercise: Exercise): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Vérification des champs obligatoires
  const requiredFields: (keyof Exercise)[] = [
    'date', 'level', 'domain', 'skill', 'type', 
    'title', 'slug', 'h1', 'instruction', 'items', 'correction', 'seo'
  ];

  for (const field of requiredFields) {
    if (!exercise[field]) {
      errors.push({
        field,
        message: `Le champ "${field}" est obligatoire`,
        severity: 'error'
      });
    }
  }

  // 2. Vérification du nombre d'items selon le niveau
  const constraints = LEVEL_ITEM_CONSTRAINTS[exercise.level];
  if (constraints) {
    const itemCount = exercise.items?.length ?? 0;
    if (itemCount < constraints.min) {
      errors.push({
        field: 'items',
        message: `Niveau ${exercise.level}: minimum ${constraints.min} items requis, ${itemCount} fournis`,
        severity: 'error'
      });
    }
    if (itemCount > constraints.max) {
      warnings.push({
        field: 'items',
        message: `Niveau ${exercise.level}: maximum ${constraints.max} items recommandé, ${itemCount} fournis`,
        severity: 'warning'
      });
    }
  }

  // 3. Vérification que chaque item a q et a non vides
  if (exercise.items) {
    exercise.items.forEach((item, index) => {
      if (!item.q || item.q.trim() === '') {
        errors.push({
          field: `items[${index}].q`,
          message: `Item ${index + 1}: la question est vide`,
          severity: 'error'
        });
      }
      if (!item.a || item.a.trim() === '') {
        errors.push({
          field: `items[${index}].a`,
          message: `Item ${index + 1}: la réponse est vide`,
          severity: 'error'
        });
      }
    });
  }

  // 4. Vérification de la cohérence correction / items
  if (exercise.correction && exercise.items) {
    if (exercise.correction.mode === 'list') {
      const correctionCount = exercise.correction.v.length;
      const itemCount = exercise.items.length;
      if (correctionCount !== itemCount) {
        errors.push({
          field: 'correction',
          message: `Incohérence: ${itemCount} items mais ${correctionCount} réponses dans la correction`,
          severity: 'error'
        });
      }

      // Vérifier que chaque correction correspond à la réponse de l'item
      exercise.items.forEach((item, index) => {
        const correctionValue = exercise.correction.v[index];
        if (correctionValue && item.a !== correctionValue) {
          warnings.push({
            field: `correction.v[${index}]`,
            message: `Item ${index + 1}: réponse "${item.a}" différente de correction "${correctionValue}"`,
            severity: 'warning'
          });
        }
      });
    }
  }

  // 5. Vérification unicité pour exercices "relier"
  if (exercise.type === 'relier' && exercise.items) {
    const answers = exercise.items.map(i => i.a);
    const uniqueAnswers = new Set(answers);
    if (answers.length !== uniqueAnswers.size) {
      errors.push({
        field: 'items',
        message: 'Exercice "relier": les réponses doivent être uniques (relation 1-1)',
        severity: 'error'
      });
    }

    // Vérifier que les paires sont définies
    const itemsWithoutPair = exercise.items.filter(i => !i.pair);
    if (itemsWithoutPair.length > 0) {
      errors.push({
        field: 'items',
        message: `Exercice "relier": ${itemsWithoutPair.length} item(s) sans "pair" défini`,
        severity: 'error'
      });
    }
  }

  // 6. Vérification du format de date
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (exercise.date && !dateRegex.test(exercise.date)) {
    errors.push({
      field: 'date',
      message: 'Le format de date doit être YYYY-MM-DD',
      severity: 'error'
    });
  }

  // 7. Vérification du slug
  const slugRegex = /^[a-z0-9-]+$/;
  if (exercise.slug && !slugRegex.test(exercise.slug)) {
    errors.push({
      field: 'slug',
      message: 'Le slug ne doit contenir que des minuscules, chiffres et tirets',
      severity: 'error'
    });
  }

  // 8. Vérification SEO
  if (exercise.seo) {
    if (!exercise.seo.title || exercise.seo.title.length < 30) {
      warnings.push({
        field: 'seo.title',
        message: 'Le titre SEO devrait faire au moins 30 caractères',
        severity: 'warning'
      });
    }
    if (exercise.seo.title && exercise.seo.title.length > 60) {
      warnings.push({
        field: 'seo.title',
        message: 'Le titre SEO ne devrait pas dépasser 60 caractères',
        severity: 'warning'
      });
    }
    if (!exercise.seo.description || exercise.seo.description.length < 100) {
      warnings.push({
        field: 'seo.description',
        message: 'La description SEO devrait faire au moins 100 caractères',
        severity: 'warning'
      });
    }
    if (exercise.seo.description && exercise.seo.description.length > 160) {
      warnings.push({
        field: 'seo.description',
        message: 'La description SEO ne devrait pas dépasser 160 caractères',
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valide un tableau d'exercices et retourne un rapport
 */
export function validateExercises(exercises: Exercise[]): {
  valid: Exercise[];
  invalid: { exercise: Exercise; result: ValidationResult }[];
  summary: { total: number; valid: number; invalid: number; warnings: number };
} {
  const valid: Exercise[] = [];
  const invalid: { exercise: Exercise; result: ValidationResult }[] = [];
  let warningsCount = 0;

  for (const exercise of exercises) {
    const result = validateExercise(exercise);
    warningsCount += result.warnings.length;

    if (result.isValid) {
      valid.push(exercise);
    } else {
      invalid.push({ exercise, result });
    }
  }

  return {
    valid,
    invalid,
    summary: {
      total: exercises.length,
      valid: valid.length,
      invalid: invalid.length,
      warnings: warningsCount
    }
  };
}
