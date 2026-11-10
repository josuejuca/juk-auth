import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import Text from '../ui/Text';
import { useTheme, fonts } from '../../theme';
import { WORDMARK_PATH, WORDMARK_RATIO, WORDMARK_VIEWBOX } from './wordmark';
import { JUCASOFT_PATHS, JUCASOFT_RATIO } from './jucasoftWordmark';

/** Geometria da marca JUCA Soft: quatro pares de barras (escura + clara). Cores = favicon original. */
export const BARS = [
  { x: 165.564, y: 0, r: 42.1729, light: false, color: '#048002' },
  { x: 118.642, y: 51.7971, r: 42.1729, light: true, color: '#2DA026' },
  { x: 169.493, y: 173.497, r: 132.13, light: false, color: '#1465BB' },
  { x: 117.66, y: 126.614, r: 132.13, light: true, color: '#81C9FA' },
  { x: 173.818, y: 178, r: 41.694, light: false, color: '#FCA61F' },
  { x: 127.331, y: 230.188, r: 41.694, light: true, color: '#FED369' },
  { x: 348.476, y: 164.324, r: 132.018, light: false, color: '#A6140D' },
  { x: 296.552, y: 117.542, r: 132.018, light: true, color: '#F32F18' },
];
export const BAR_W = 120;
export const BAR_H = 50.1099;

/**
 * Marca JUCA Soft.
 * - `color` define uma cor única (barras claras com 45% de opacidade);
 * - sem `color` e `original`, usa as 8 cores da logo original.
 * - `pairs` limita quais pares (0–3) desenhar (usado na animação).
 */
export function LogoMark({ size = 32, color, original = false, pairs, opacity = 1 }) {
  const { colors } = useTheme();
  const mono = original ? null : color || colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 349 348" opacity={opacity}>
      {BARS.map((b, i) => (pairs && !pairs.includes(Math.floor(i / 2)) ? null : (
        <Rect key={i} x={b.x} y={b.y} width={BAR_W} height={BAR_H} fill={mono || b.color} opacity={mono && b.light ? 0.45 : 1} transform={`rotate(${b.r} ${b.x} ${b.y})`} />
      )))}
    </Svg>
  );
}

/** Wordmark "JUK". */
export function Wordmark({ height = 20, color }) {
  const { colors } = useTheme();
  return (
    <Svg width={height * WORDMARK_RATIO} height={height} viewBox={WORDMARK_VIEWBOX}>
      <Path d={WORDMARK_PATH} fill={color || colors.text} />
    </Svg>
  );
}

/** Logo da JUCA Soft (assinatura). */
export function JucaSoftLogo({ height = 28, color }) {
  const { colors } = useTheme();
  return (
    <Svg width={height * JUCASOFT_RATIO} height={height} viewBox="0 0 948 233">
      {JUCASOFT_PATHS.map((d, i) => <Path key={i} d={d} fill={color || colors.textSecondary} />)}
    </Svg>
  );
}

/** JUK + "Authenticator". */
export default function Logo({ height = 20, color, showName = true, muted }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.5 }}>
      <Wordmark height={height} color={color} />
      {showName ? (
        <>
          <View style={{ width: 1, height: height * 0.9, backgroundColor: muted || colors.textMuted, opacity: 0.5 }} />
          <Text style={{ fontFamily: fonts.medium, fontSize: height * 0.7, color: muted || colors.textSecondary, letterSpacing: 0.2 }}>Authenticator</Text>
        </>
      ) : null}
    </View>
  );
}
