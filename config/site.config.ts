/**
 * Configuration globale du site JeMEntraine
 */

export const SITE_CONFIG = {
  name: 'JeMEntraine',
  description: 'Site éducatif Cycle 2 - Exercices CP/CE1/CE2',
  url: process.env.SITE_URL || 'https://jementraine.fr',
  defaultLocale: 'fr',

  // Niveaux supportés
  levels: ['CP', 'CE1', 'CE2'] as const,

  // Domaines
  domains: {
    francais: { label: 'Français', emoji: '📖' },
    maths: { label: 'Mathématiques', emoji: '🧮' },
    'questionner-le-monde': { label: 'Questionner le monde', emoji: '🌍' },
    emc: { label: 'EMC', emoji: '🤝' },
    anglais: { label: 'Anglais', emoji: '🇬🇧' },
    arts: { label: 'Arts', emoji: '🎨' },
    eps: { label: 'EPS', emoji: '⚽' }
  },

  // Couleurs par niveau
  levelColors: {
    CP: '#f472b6',
    CE1: '#34d399',
    CE2: '#60a5fa'
  },

  // Emojis par niveau
  levelEmojis: {
    CP: '🐣',
    CE1: '🦊',
    CE2: '🦁'
  }
} as const;

export type Level = typeof SITE_CONFIG.levels[number];
export type Domain = keyof typeof SITE_CONFIG.domains;
