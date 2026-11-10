import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const TICKS = 72;

/** Anel de marcações (como na referência): ticks restantes ficam cheios, os gastos esmaecem. */
function TickRing({ size, fraction, color, track, children }) {
  const c = size / 2;
  const outer = c - 2;
  const inner = outer - size * 0.075;
  const remaining = Math.round(fraction * TICKS);
  const lines = [];
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    lines.push(
      <Line
        key={i}
        x1={c + cos * inner}
        y1={c + sin * inner}
        x2={c + cos * outer}
        y2={c + sin * outer}
        stroke={i < remaining ? color : track}
        strokeWidth={Math.max(2, size * 0.011)}
        strokeLinecap="round"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>{lines}</Svg>
      {children}
    </View>
  );
}

export default memo(TickRing);
