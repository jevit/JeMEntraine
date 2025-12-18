import type { Level, Domain, DOMAIN_LABELS, DOMAIN_EMOJIS, LEVEL_EMOJIS } from '../types/exercise';

/**
 * Formate une date en français
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formate une date courte
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Détermine la saison actuelle
 */
export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

/**
 * Détermine le thème saisonnier
 */
export function getSeasonalTheme(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Fêtes spéciales
  if (month === 12 && day >= 15) return 'Noël';
  if (month === 1 && day <= 6) return 'Nouvel An';
  if (month === 2 && day >= 10 && day <= 14) return 'Saint-Valentin';
  if (month === 10 && day >= 25) return 'Halloween';
  if (month === 4 && day >= 1 && day <= 15) return 'Pâques';

  // Saisons
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
}

/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string, date: string): string {
  const datePrefix = date.replace(/-/g, '').slice(0, 8);
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  
  return `${datePrefix}-${slug}`;
}

/**
 * Estime le temps de completion d'un exercice
 */
export function estimateTime(itemCount: number, level: Level): number {
  const baseTime: Record<Level, number> = {
    CP: 0.75,  // 45 secondes par item
    CE1: 0.5,  // 30 secondes par item
    CE2: 0.4   // 24 secondes par item
  };
  
  return Math.ceil(itemCount * baseTime[level]);
}

/**
 * Mélange un tableau (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Tronque un texte
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalise la première lettre
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Labels des domaines
 */
export const domainLabels: Record<Domain, string> = {
  fr: 'Français',
  math: 'Mathématiques',
  qlm: 'Questionner le monde',
  emc: 'EMC',
  lv: 'Anglais'
};

/**
 * Emojis des domaines
 */
export const domainEmojis: Record<Domain, string> = {
  fr: '📖',
  math: '🧮',
  qlm: '🌍',
  emc: '🤝',
  lv: '🇬🇧'
};

/**
 * Emojis des niveaux
 */
export const levelEmojis: Record<Level, string> = {
  CP: '🐣',
  CE1: '🦊',
  CE2: '🦁'
};

/**
 * Couleurs des niveaux
 */
export const levelColors: Record<Level, string> = {
  CP: '#f472b6',
  CE1: '#34d399',
  CE2: '#60a5fa'
};

/**
 * Couleurs des domaines
 */
export const domainColors: Record<Domain, string> = {
  fr: '#f59e0b',
  math: '#3b82f6',
  qlm: '#10b981',
  emc: '#8b5cf6',
  lv: '#ec4899'
};
