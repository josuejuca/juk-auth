// theme/theme.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../constants/Colors';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('system'); // system | light | dark
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('themeMode');
      if (saved) setMode(saved);
    };
    load();
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const scheme = mode === 'system' ? systemScheme : mode;
  const colors = useMemo(() => getColors(scheme), [scheme]);

  const value = useMemo(
    () => ({
      mode,
      scheme,
      colors,
      setMode: async (m) => {
        setMode(m);
        await AsyncStorage.setItem('themeMode', m);
      },
    }),
    [mode, scheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
