import { Platform } from 'react-native';

// Ícone alternativo do app (iOS/Android, precisa de build nativo: não funciona no Expo Go nem na web).
let mod = null;
try {
  if (Platform.OS !== 'web') mod = require('expo-alternate-app-icons');
} catch {
  mod = null;
}

export const supportsAppIcons = () => {
  try { return !!mod && !!mod.supportsAlternateIcons; } catch { return false; }
};

export const currentAppIcon = () => {
  try { return mod?.getAppIconName?.() ?? null; } catch { return null; }
};

/** `name` null volta ao ícone padrão. Retorna true/false (nunca lança). */
export async function changeAppIcon(name) {
  try {
    if (!mod) return false;
    await mod.setAlternateAppIcon(name);
    return true;
  } catch {
    return false;
  }
}

// bg/fg precisam bater com scripts/generate-app-icons.py
export const APP_ICONS = [
  { name: null, label: 'Original', bg: '#FFFFFF', original: true },
  { name: 'Escuro', label: 'Escuro', bg: '#0B0E14', fg: '#FFFFFF' },
  { name: 'Azul', label: 'Azul', bg: '#1465BB', fg: '#FFFFFF' },
  { name: 'Verde', label: 'Verde', bg: '#048002', fg: '#FFFFFF' },
  { name: 'Laranja', label: 'Laranja', bg: '#FCA61F', fg: '#111113' },
  { name: 'Vermelho', label: 'Vermelho', bg: '#A6140D', fg: '#FFFFFF' },
  { name: 'Ceu', label: 'Céu', bg: '#57A3F2', fg: '#111113' },
  { name: 'Menta', label: 'Menta', bg: '#15803D', fg: '#FFFFFF' },
  { name: 'Grafite', label: 'Grafite', bg: '#27272A', fg: '#FFFFFF' },
];
