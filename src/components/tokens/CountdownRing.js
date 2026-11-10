import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Text from '../ui/Text';
import { useTheme, fonts } from '../../theme';

export default function CountdownRing({ secondsLeft, period, size = 34 }) {
  const { colors } = useTheme();
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fraction = Math.max(0, Math.min(1, secondsLeft / period));
  const color = secondsLeft <= 5 ? colors.danger : colors.primary;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - fraction)} />
      </Svg>
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.34, color }}>{secondsLeft}</Text>
    </View>
  );
}
