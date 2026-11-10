import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { useTheme, fonts } from '../../theme';

// Escala tipográfica (tamanho / entrelinha). Textos secundários nunca ficam abaixo de 13px.
const VARIANTS = {
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19 },
  overline: { fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 16, letterSpacing: 1, textTransform: 'uppercase' },
};

export default function Text({ variant = 'body', tone = 'text', style, ...props }) {
  const { colors } = useTheme();
  const flat = StyleSheet.flatten([{ color: colors[tone] }, VARIANTS[variant], style]);
  // se o tamanho foi sobrescrito sem lineHeight, ajusta para não cortar o texto
  if (style && flat.fontSize && !StyleSheet.flatten(style).lineHeight) flat.lineHeight = Math.round(flat.fontSize * 1.25);
  return <RNText allowFontScaling={false} style={flat} {...props} />;
}
