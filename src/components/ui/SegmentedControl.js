import React from 'react';
import { View } from 'react-native';
import Pressable from './Pressable';
import Text from './Text';
import { useTheme, radius } from '../../theme';

export default function SegmentedControl({ options, value, onChange, label }) {
  const { colors } = useTheme();
  return (
    <View>
      {label ? <Text variant="label" tone="text" style={{ marginBottom: 8 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 3 }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              pressedOpacity={0.8}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 11,
                borderRadius: radius.md - 3,
                backgroundColor: active ? colors.surface : 'transparent',
              }}
            >
              <Text variant="label" tone={active ? 'text' : 'textSecondary'} style={{ fontSize: 14.5 }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
