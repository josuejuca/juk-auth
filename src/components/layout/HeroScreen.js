import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { bestOn } from '../../theme/color';
import { useTheme, radius } from '../../theme';

/**
 * Tela "hero + folha": faixa colorida no topo e folha arredondada por cima (referência).
 * `hero` = conteúdo da faixa; `children` = conteúdo da folha.
 */
export default function HeroScreen({ hero, children, heroGrow = 0, sheetStyle, maxWidth }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.hero }}>
      {/* ícones da barra de status claros ou escuros conforme a cor do topo */}
      <StatusBar style={bestOn(colors.hero) === '#FFFFFF' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <View style={{ flex: 1, width: '100%', maxWidth, alignSelf: 'center' }}>
          <View style={heroGrow ? { flex: heroGrow, justifyContent: 'center', minHeight: 0, overflow: 'hidden' } : null}>{hero}</View>
          <View
            style={[
              {
                ...(heroGrow ? { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' } : { flex: 1 }),
                backgroundColor: colors.sheet,
                borderTopLeftRadius: radius.xl + 6,
                borderTopRightRadius: radius.xl + 6,
                overflow: 'hidden',
              },
              sheetStyle,
            ]}
          >
            {children}
          </View>
        </View>
      </SafeAreaView>
      {/* completa o fundo da folha sob a área segura inferior */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: colors.sheet, zIndex: -1 }} />
    </View>
  );
}
