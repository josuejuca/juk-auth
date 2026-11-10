// Design tokens do JUK Authenticator.
// Cores de destaque: as quatro da logo original da JUCA Soft + temas de outros apps (CNPJ API, MeuIP, JucaSoft).

import { bestOn, contrast, ensureContrast, hexToHsl, hslToHex, mix, normalizeHex, withAlpha } from './color.js';

// Cada tema nasce de uma cor-semente. A paleta inteira (fundos, superfícies, hero, textos)
// é derivada dela e validada por contraste, então qualquer semente gera telas legíveis.
export const ACCENTS = [
  // cores da logo original da JUCA Soft
  { id: 'azul', name: 'Azul', seed: '#1465BB' },
  { id: 'verde', name: 'Verde', seed: '#048002' },
  { id: 'laranja', name: 'Laranja', seed: '#FCA61F' },
  { id: 'vermelho', name: 'Vermelho', seed: '#A6140D' },
  // temas de outros apps JUCA Soft
  { id: 'ceu', name: 'Céu', seed: '#57A3F2' },
  { id: 'menta', name: 'Menta', seed: '#15803D' },
  { id: 'grafite', name: 'Grafite', seed: '#52525B' },
];

export const DEFAULT_ACCENT = 'azul';
export const DEFAULT_MODE = 'dark';
export const THEME_MODES = ['system', 'light', 'dark'];

export const isAccentId = (id) => ACCENTS.some((a) => a.id === id);
export const isThemeMode = (m) => THEME_MODES.includes(m);

const MIN_TEXT = 4.5;

function derive(scheme, seedInput) {
  const seed = normalizeHex(seedInput, '#1465BB');
  const { h, s: rawS } = hexToHsl(seed);
  const gray = rawS < 0.12; // grafite: sem matiz
  const hue = gray ? 220 : h;
  const tint = (sat, l) => hslToHex({ h: hue, s: gray ? Math.min(sat, 0.06) : sat, l });
  const dark = scheme === 'dark';

  // superfícies tingidas levemente pelo matiz do tema
  const n = dark
    ? { background: tint(0.2, 0.065), sheet: tint(0.17, 0.1), surface: tint(0.15, 0.135), surfaceAlt: tint(0.15, 0.185), border: tint(0.13, 0.235),
        text: tint(0.25, 0.95), textSecondary: tint(0.12, 0.72), textMuted: tint(0.08, 0.64) }
    : { background: tint(0.3, 0.965), sheet: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: tint(0.25, 0.94), border: tint(0.2, 0.89),
        text: tint(0.35, 0.1), textSecondary: tint(0.15, 0.34), textMuted: tint(0.1, 0.42) };

  // cor de destaque usada em texto/ícones/botões: precisa de contraste sobre a folha
  // (confere contra todas as superfícies onde ele aparece, inclusive a versão suave)
  let primary = dark ? mix(seed, '#FFFFFF', 0.35) : seed;
  for (let i = 0; i < 3; i++) {
    for (const bg of [n.sheet, n.surface, n.surfaceAlt, n.background, mix(n.sheet, primary, dark ? 0.16 : 0.1)]) primary = ensureContrast(primary, bg, MIN_TEXT);
  }
  const onPrimary = bestOn(primary);

  // faixa do topo (hero): no claro é a própria semente; no escuro, um tom profundo dela
  let hero = dark ? hslToHex({ h: hue, s: gray ? 0.04 : Math.min(0.7, Math.max(0.35, rawS * 0.85)), l: 0.24 }) : seed;
  let onHero = bestOn(hero);
  if (contrast(onHero, hero) < MIN_TEXT) hero = dark ? mix(hero, '#000000', 0.25) : mix(hero, '#000000', 0.2);
  onHero = bestOn(hero);

  return {
    ...n,
    primary,
    onPrimary,
    primarySoft: mix(n.sheet, primary, dark ? 0.16 : 0.1),
    hero,
    onHero,
    onHeroMuted: withAlpha(onHero, 0.72),
    heroTrack: withAlpha(onHero, 0.25),
    danger: dark ? '#FF8A80' : '#C62828',
    success: dark ? '#6EE7A0' : '#15803D',
    overlay: dark ? 'rgba(0,0,0,0.65)' : 'rgba(10,14,20,0.5)',
  };
}

const cache = new Map();

/** Paleta validada. Tema ou modo inválidos caem no padrão (azul / escuro). */
export function getPalette(scheme, accentId = DEFAULT_ACCENT) {
  const sch = scheme === 'light' ? 'light' : 'dark';
  const accent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];
  const key = `${sch}:${accent.id}`;
  if (!cache.has(key)) cache.set(key, derive(sch, accent.seed));
  return cache.get(key);
}

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  mono: 'GeistMono_500Medium',
  monoBold: 'GeistMono_600SemiBold',
};
