import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import Pressable from './Pressable';
import Text from './Text';
import { ACCENTS, getPalette, useTheme } from '../../theme';
import { bestOn } from '../../theme/color';
import { useLayout } from '../../hooks/useLayout';

export default function AccentPicker({ compact, inset = 52 }) {
  const { accent, setAccent, scheme, colors } = useTheme();
  const { width } = useLayout();
  // no modo compacto, as 7 bolinhas dividem a largura disponível (nunca quebram de linha)
  const dot = compact ? Math.max(28, Math.min(40, Math.floor((Math.min(width, 560) - inset - 6 * 10) / 7))) : 48;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: compact ? 10 : 12, rowGap: compact ? 10 : 16, paddingVertical: compact ? 6 : 12, justifyContent: compact ? 'space-between' : 'flex-start' }}>
      {ACCENTS.map((a) => {
        const active = a.id === accent;
        const swatch = getPalette(scheme, a.id).hero;
        const on = bestOn(swatch);
        return (
          <Pressable key={a.id} onPress={() => setAccent(a.id)} accessibilityLabel={a.name} accessibilityState={{ selected: active }} style={{ alignItems: 'center', width: compact ? undefined : '23%', gap: 6 }}>
            <View style={{ width: dot, height: dot, borderRadius: 24, backgroundColor: swatch, alignItems: 'center', justifyContent: 'center', borderWidth: active ? 3 : 1, borderColor: active ? colors.text : colors.border }}>
              {active ? <Check size={compact ? 18 : 22} color={on} strokeWidth={3} /> : null}
            </View>
            {compact ? null : <Text variant="label" tone={active ? 'text' : 'textSecondary'} style={{ textAlign: 'center' }}>{a.name}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
