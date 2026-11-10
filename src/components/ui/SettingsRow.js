import React from 'react';
import { View } from 'react-native';
import Pressable from './Pressable';
import Text from './Text';
import { useTheme } from '../../theme';

export default function SettingsRow({ icon: Icon, title, description, right, last, onPress }) {
  const { colors } = useTheme();
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      {Icon ? <Icon size={21} color={colors.textSecondary} strokeWidth={1.8} /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="heading" style={{ fontSize: 16.5, lineHeight: 22 }}>{title}</Text>
        {description ? <Text variant="caption" tone="textSecondary" style={{ marginTop: 3 }}>{description}</Text> : null}
      </View>
      {right}
    </Wrap>
  );
}
