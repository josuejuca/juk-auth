import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette, DEFAULT_ACCENT, DEFAULT_MODE, isAccentId, isThemeMode } from './tokens';

const THEME_KEY = 'themeMode';
const ACCENT_KEY = 'themeAccent';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(DEFAULT_MODE); // padrão: escuro
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => isThemeMode(saved) && setModeState(saved))
      .catch(() => {});
    AsyncStorage.getItem(ACCENT_KEY)
      .then((saved) => isAccentId(saved) && setAccentState(saved))
      .catch(() => {});
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme || 'light'));
    return () => sub.remove();
  }, []);

  const setMode = useCallback(async (next) => {
    if (!isThemeMode(next)) return;
    setModeState(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch {}
  }, []);

  const setAccent = useCallback(async (next) => {
    if (!isAccentId(next)) return;
    setAccentState(next);
    try {
      await AsyncStorage.setItem(ACCENT_KEY, next);
    } catch {}
  }, []);

  const scheme = mode === 'system' ? systemScheme : mode;
  const value = useMemo(
    () => ({ mode, scheme, accent, colors: getPalette(scheme, accent), setMode, setAccent }),
    [mode, scheme, accent, setMode, setAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  return ctx;
}
