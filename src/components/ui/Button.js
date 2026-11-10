import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Pressable from './Pressable';
import Text from './Text';
import { useTheme, radius } from '../../theme';

export default function Button({ title, onPress, icon: Icon, variant = 'primary', color, loading, disabled, style }) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  const fg = color || (primary ? colors.onPrimary : colors.text);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={[
        {
          height: 52,
          borderRadius: radius.md,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          backgroundColor: primary ? colors.primary : 'transparent',
          borderWidth: primary ? 0 : 1,
          borderColor: colors.border,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon ? <Icon size={19} color={fg} strokeWidth={2} /> : null}
          <Text variant="heading" style={{ color: fg, fontSize: 16 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
