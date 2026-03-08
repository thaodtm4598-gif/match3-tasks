export type ThemeId = 'dark' | 'light' | 'neon';

export interface ThemeTokens {
  id: ThemeId;
  label: string;
  icon: string;
  /** CSS custom property values — applied on the root wrapper */
  vars: Record<string, string>;
}

const THEMES: ThemeTokens[] = [
  {
    id: 'dark',
    label: 'Dark',
    icon: '🌙',
    vars: {
      '--th-bg': '#0f0f23',
      '--th-surface': '#0d0d22',
      '--th-surface2': '#12122a',
      '--th-card': '#13172e',
      '--th-border': '#1e1a40',
      '--th-border2': '#141828',
      '--th-text': '#e2e8f0',
      '--th-text2': '#6070a0',
      '--th-text3': '#3a3060',
      '--th-input': '#090b1a',
      '--th-overlay': 'rgba(0,0,0,.75)',
      '--th-header': 'linear-gradient(180deg,#141430 0%,#0f0f23 100%)',
      '--th-accent': '#7C3AED',
      '--th-accent2': '#A78BFA',
    },
  },
  {
    id: 'light',
    label: 'Light',
    icon: '☀️',
    vars: {
      '--th-bg': '#f5f3ff',
      '--th-surface': '#ffffff',
      '--th-surface2': '#ece8ff',
      '--th-card': '#ffffff',
      '--th-border': '#ccc6f0',
      '--th-border2': '#ddd8ff',
      '--th-text': '#1e1040',
      '--th-text2': '#3a3a90',
      '--th-text3': '#6060a0',
      '--th-input': '#f0eeff',
      '--th-overlay': 'rgba(0,0,0,.4)',
      '--th-header': 'linear-gradient(180deg,#ede9ff 0%,#f5f3ff 100%)',
      '--th-accent': '#7C3AED',
      '--th-accent2': '#5B21B6',
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    icon: '⚡',
    vars: {
      '--th-bg': '#000510',
      '--th-surface': '#010818',
      '--th-surface2': '#010d20',
      '--th-card': '#010d20',
      '--th-border': '#00ff9918',
      '--th-border2': '#00ff990e',
      '--th-text': '#00ffcc',
      '--th-text2': '#008866',
      '--th-text3': '#004433',
      '--th-input': '#000d18',
      '--th-overlay': 'rgba(0,5,5,.88)',
      '--th-header': 'linear-gradient(180deg,#010d20 0%,#000510 100%)',
      '--th-accent': '#00ff99',
      '--th-accent2': '#00ffcc',
    },
  },
];

export const THEME_LIST = THEMES;
export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);

export function getTheme(id: ThemeId): ThemeTokens {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function nextTheme(id: ThemeId): ThemeId {
  const idx = THEME_IDS.indexOf(id);
  return THEME_IDS[(idx + 1) % THEME_IDS.length];
}

export function loadTheme(): ThemeId {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('m3-theme') as ThemeId) ?? 'dark';
}

export function saveTheme(id: ThemeId) {
  if (typeof window !== 'undefined') localStorage.setItem('m3-theme', id);
}
