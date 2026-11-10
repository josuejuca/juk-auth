import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { bestOn } from '../../theme/color';
import { useTheme } from '../../theme';
import { useLayout } from '../../hooks/useLayout';

/** Página simples centralizada com largura máxima (formulários, configurações). */
export default function Page({ children, wide, edges = ['top', 'left', 'right', 'bottom'] }) {
  const { colors } = useTheme();
  const { contentMax } = useLayout();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={bestOn(colors.background) === '#FFFFFF' ? 'light' : 'dark'} />
      <View style={{ flex: 1, width: '100%', maxWidth: wide ? Math.min(contentMax, 1040) : Math.min(contentMax, 640), alignSelf: 'center' }}>{children}</View>
    </SafeAreaView>
  );
}
