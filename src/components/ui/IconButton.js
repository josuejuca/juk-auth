import React from 'react';
import Pressable from './Pressable';
import { useTheme } from '../../theme';

export default function IconButton({ icon: Icon, onPress, label, size = 22, color, filled = false, style }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? colors.surfaceAlt : 'transparent',
        },
        style,
      ]}
    >
      <Icon size={size} color={color || colors.text} strokeWidth={1.9} />
    </Pressable>
  );
}
