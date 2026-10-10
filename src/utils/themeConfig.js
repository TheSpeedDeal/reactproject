/**
 * UI Theme System Configuration
 * Provides 6 curated, stunning color themes for PANB Compliance Monitoring
 */

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Slate',
    icon: '🌙',
    category: 'Dark',
    accentColor: '#06b6d4',
    bgPreview: '#060913',
    cardPreview: '#0f172a',
    description: 'Cyber navy obsidian with cyan electric glow (Default)'
  },
  {
    id: 'light',
    name: 'Clean Enterprise',
    icon: '☀️',
    category: 'Light',
    accentColor: '#0284c7',
    bgPreview: '#f1f5f9',
    cardPreview: '#ffffff',
    description: 'Crisp, luminous executive white & soft slate dashboard'
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    icon: '🌲',
    category: 'Dark',
    accentColor: '#10b981',
    bgPreview: '#04140d',
    cardPreview: '#0b2c1d',
    description: 'Deep obsidian with radiant emerald compliance glow'
  },
  {
    id: 'cobalt',
    name: 'Royal Cobalt',
    icon: '💎',
    category: 'Dark',
    accentColor: '#3b82f6',
    bgPreview: '#060e22',
    cardPreview: '#0f2250',
    description: 'Deep sapphire night with cobalt electric accents'
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    icon: '🌅',
    category: 'Dark',
    accentColor: '#f59e0b',
    bgPreview: '#120d08',
    cardPreview: '#291d12',
    description: 'Warm bronze charcoal with glowing golden amber accents'
  },
  {
    id: 'amethyst',
    name: 'Neon Amethyst',
    icon: '🔮',
    category: 'Dark',
    accentColor: '#a855f7',
    bgPreview: '#0e0919',
    cardPreview: '#1e1338',
    description: 'Interstellar cosmic purple with neon violet glow'
  }
];

export const DEFAULT_THEME = 'midnight';
export const THEME_STORAGE_KEY = 'panb_compliance_theme';
