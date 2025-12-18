// Types principaux pour les exercices Cycle 2

export type Level = "CP" | "CE1" | "CE2";

export type Domain = "fr" | "math" | "qlm" | "emc" | "lv";

export type ExerciseType = 
  | "calcul-mental"
  | "phrases-a-trous"
  | "qcm"
  | "vrai-faux"
  | "relier"
  | "ordonner"
  | "dictee"
  | "probleme"
  | "conjugaison"
  | "grammaire"
  | "vocabulaire"
  | "lecture"
  | "numeration"
  | "geometrie"
  | "mesures";

export interface ExerciseItem {
  /** Question courte */
  q: string;
  /** Réponse exacte */
  a: string;
  /** Indice court optionnel */
  hint?: string;
  /** Options pour QCM (si applicable) */
  options?: string[];
  /** Paire pour exercices "relier" */
  pair?: string;
}

export interface CorrectionList {
  mode: "list";
  v: string[];
}

export interface CorrectionText {
  mode: "short_text";
  v: string;
}

export type Correction = CorrectionList | CorrectionText;

export interface ExerciseSEO {
  title: string;
  description: string;
  tags: string[];
  internalLinks: string[];
  nextSuggestions: string[];
}

export interface Exercise {
  /** Date de publication YYYY-MM-DD */
  date: string;
  /** Niveau scolaire */
  level: Level;
  /** Domaine/Matière */
  domain: Domain;
  /** Compétence travaillée */
  skill: string;
  /** Type d'exercice */
  type: ExerciseType;
  /** Thème saisonnier */
  theme: string;
  /** Titre court */
  title: string;
  /** Slug URL unique */
  slug: string;
  /** Titre H1 de la page */
  h1: string;
  /** Consigne pour l'élève */
  instruction: string;
  /** Liste des items/questions */
  items: ExerciseItem[];
  /** Correction */
  correction: Correction;
  /** Métadonnées SEO */
  seo: ExerciseSEO;
}

// Constantes pour les domaines
export const DOMAIN_LABELS: Record<Domain, string> = {
  fr: "Français",
  math: "Mathématiques",
  qlm: "Questionner le monde",
  emc: "EMC",
  lv: "Anglais"
};

export const DOMAIN_EMOJIS: Record<Domain, string> = {
  fr: "📖",
  math: "🧮",
  qlm: "🌍",
  emc: "🤝",
  lv: "🇬🇧"
};

export const LEVEL_EMOJIS: Record<Level, string> = {
  CP: "🐣",
  CE1: "🦊",
  CE2: "🦁"
};

export const LEVEL_COLORS: Record<Level, string> = {
  CP: "#f472b6",
  CE1: "#34d399",
  CE2: "#60a5fa"
};

// Contraintes par niveau
export const LEVEL_CONSTRAINTS: Record<Level, { min: number; max: number }> = {
  CP: { min: 6, max: 12 },
  CE1: { min: 8, max: 15 },
  CE2: { min: 12, max: 18 }
};

// Types pour les jeux
export type GameType = "quiz" | "memory" | "matching";

export interface GameConfig {
  type: GameType;
  title: string;
  exerciseSlug: string;
  level: Level;
  domain: Domain;
}

export interface QuizState {
  currentIndex: number;
  score: number;
  answers: (string | null)[];
  isFinished: boolean;
}

export interface MemoryCard {
  id: string;
  content: string;
  type: "question" | "answer";
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MatchingItem {
  id: string;
  content: string;
  type: "left" | "right";
  pairId: string;
  isMatched: boolean;
}
