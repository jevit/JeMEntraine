/**
 * Configuration SEO pour JeMEntraine
 */

import { SITE_CONFIG } from './site.config';

export const SEO_CONFIG = {
  // Métadonnées par défaut
  defaults: {
    title: `${SITE_CONFIG.name} - Exercices Cycle 2`,
    description: 'Exercices et jeux éducatifs gratuits pour le Cycle 2 : CP, CE1, CE2. Français, Maths, QLM, EMC.',
    ogImage: '/og-default.png',
    locale: 'fr_FR',
    type: 'website'
  },

  // Limites SEO
  limits: {
    titleMaxLength: 60,
    descriptionMaxLength: 160,
    tagsMax: 10
  },

  // Template de titre pour les pages
  titleTemplates: {
    home: `${SITE_CONFIG.name} - Exercices Cycle 2`,
    exercise: (title: string) => `${title} | ${SITE_CONFIG.name}`,
    level: (level: string) => `Exercices ${level} gratuits | ${SITE_CONFIG.name}`,
    domain: (domain: string, level: string) => `${domain} ${level} - Exercices | ${SITE_CONFIG.name}`,
    game: (game: string) => `${game} - Jeux éducatifs | ${SITE_CONFIG.name}`
  },

  // Templates de description par type de page
  descriptionTemplates: {
    level: (level: string) =>
      `Exercices gratuits pour le ${level} : français, mathématiques, sciences. Fiches à imprimer avec correction.`,
    domain: (domain: string, level: string) =>
      `Exercices de ${domain} pour ${level}. Activités pédagogiques gratuites avec correction automatique.`,
    exercise: (skill: string, level: string) =>
      `Exercice ${level} : ${skill}. Entraînement interactif avec correction immédiate.`
  },

  // Tags par défaut par domaine
  defaultTags: {
    fr: ['français', 'lecture', 'grammaire', 'conjugaison', 'orthographe'],
    math: ['mathématiques', 'calcul', 'numération', 'problèmes', 'géométrie'],
    qlm: ['sciences', 'découverte du monde', 'nature', 'géographie'],
    emc: ['éducation civique', 'vivre ensemble', 'citoyenneté'],
    lv: ['anglais', 'langues', 'vocabulaire']
  },

  // Schema.org configuration
  schema: {
    organization: {
      '@type': 'EducationalOrganization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: `${SITE_CONFIG.url}/logo.png`
    },
    website: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url
    }
  },

  // Robots configuration
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1
  },

  // Sitemap configuration
  sitemap: {
    changefreq: {
      home: 'daily',
      level: 'daily',
      exercise: 'monthly',
      game: 'monthly'
    },
    priority: {
      home: 1.0,
      level: 0.9,
      exercise: 0.7,
      game: 0.6
    }
  }
} as const;

// Types pour l'export
export type SeoDefaults = typeof SEO_CONFIG.defaults;
export type SeoLimits = typeof SEO_CONFIG.limits;
