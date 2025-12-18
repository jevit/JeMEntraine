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

const LEVEL_QUESTION_CONSTRAINTS: Record<Level, { min: number; max: number }> = {
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
    'title', 'slug', 'h1', 'instruction', 'questions', 'correction', 'seo'
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

  // 2. Vérification du nombre de questions selon le niveau
  const constraints = LEVEL_QUESTION_CONSTRAINTS[exercise.level];
  if (constraints) {
    const questionCount = exercise.questions?.length ?? 0;
    if (questionCount < constraints.min) {
      errors.push({
        field: 'questions',
        message: `Niveau ${exercise.level}: minimum ${constraints.min} questions requises, ${questionCount} fournies`,
        severity: 'error'
      });
    }
    if (questionCount > constraints.max) {
      warnings.push({
        field: 'questions',
        message: `Niveau ${exercise.level}: maximum ${constraints.max} questions recommandé, ${questionCount} fournies`,
        severity: 'warning'
      });
    }
  }

  // 3. Vérification que chaque question a prompt et answer non vides
  if (exercise.questions) {
    exercise.questions.forEach((question, index) => {
      if (!question.prompt || question.prompt.trim() === '') {
        errors.push({
          field: `questions[${index}].prompt`,
          message: `Question ${index + 1}: le prompt est vide`,
          severity: 'error'
        });
      }
      if (!question.answer || question.answer.trim() === '') {
        errors.push({
          field: `questions[${index}].answer`,
          message: `Question ${index + 1}: la réponse est vide`,
          severity: 'error'
        });
      }
    });
  }

  // 4. Vérification de la cohérence correction / questions
  if (exercise.correction && exercise.questions) {
    if (exercise.correction.mode === 'list') {
      const correctionCount = exercise.correction.v.length;
      const questionCount = exercise.questions.length;
      if (correctionCount !== questionCount) {
        errors.push({
          field: 'correction',
          message: `Incohérence: ${questionCount} questions mais ${correctionCount} réponses dans la correction`,
          severity: 'error'
        });
      }

      // Vérifier que chaque correction correspond à la réponse de la question
      exercise.questions.forEach((question, index) => {
        const correctionValue = exercise.correction.v[index];
        if (correctionValue && question.answer !== correctionValue) {
          warnings.push({
            field: `correction.v[${index}]`,
            message: `Question ${index + 1}: réponse "${question.answer}" différente de correction "${correctionValue}"`,
            severity: 'warning'
          });
        }
      });
    }
  }

  // 5. Vérification unicité pour exercices "relier"
  if (exercise.type === 'relier' && exercise.questions) {
    const answers = exercise.questions.map(q => q.answer);
    const uniqueAnswers = new Set(answers);
    if (answers.length !== uniqueAnswers.size) {
      errors.push({
        field: 'questions',
        message: 'Exercice "relier": les réponses doivent être uniques (relation 1-1)',
        severity: 'error'
      });
    }

    // Vérifier que les paires sont définies
    const questionsWithoutPair = exercise.questions.filter(q => !q.pair);
    if (questionsWithoutPair.length > 0) {
      errors.push({
        field: 'questions',
        message: `Exercice "relier": ${questionsWithoutPair.length} question(s) sans "pair" défini`,
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
