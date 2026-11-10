import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { LogoMark } from './brand/Logo';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../theme';

/**
 * Privacidade:
 *  1) bloqueia capturas/gravação de tela (Android: FLAG_SECURE, que também oculta a miniatura em "recentes";
 *     iOS: oculta o conteúdo em capturas e gravações) — a menos que o usuário permita nas configurações;
 *  2) cobre a tela quando o app não está ativo, para os códigos não aparecerem no seletor de apps.
 */
export default function PrivacyGuard() {
  const { allowScreenshots } = useSettings();
  const { colors } = useTheme();
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const run = allowScreenshots ? ScreenCapture.allowScreenCaptureAsync() : ScreenCapture.preventScreenCaptureAsync();
    Promise.resolve(run).catch(() => {});
  }, [allowScreenshots]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setCovered(s !== 'active'));
    return () => sub.remove();
  }, []);

  if (!covered) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', zIndex: 1000 }]}>
      <LogoMark size={72} original />
    </View>
  );
}
