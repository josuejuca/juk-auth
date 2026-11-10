import React from 'react';
import { TextInput, View } from 'react-native';
import Text from './Text';
import { useTheme, fonts, radius } from '../../theme';

export default function TextField({ label, hint, right, style, inputStyle, ...props }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      {label ? <Text variant="label" tone="text" style={{ marginBottom: 8 }}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          minHeight: 54,
        }}
      >
        <TextInput
          allowFontScaling={false}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[{ flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 17, paddingVertical: 13 }, inputStyle]}
          {...props}
        />
        {right}
      </View>
      {hint ? <Text variant="caption" tone="textSecondary" style={{ marginTop: 8 }}>{hint}</Text> : null}
    </View>
  );
}
