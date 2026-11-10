import React from 'react';
import { View } from 'react-native';

const ARM = 34;
const THICK = 4;

/** Moldura com cantos para guiar o enquadramento do QR. */
export default function ScannerFrame({ size = 260, color = '#fff' }) {
  const corner = (pos) => ({
    position: 'absolute',
    width: ARM,
    height: ARM,
    borderColor: color,
    ...pos,
  });
  return (
    <View style={{ width: size, height: size }}>
      <View style={corner({ top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 18 })} />
      <View style={corner({ top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 18 })} />
      <View style={corner({ bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 18 })} />
      <View style={corner({ bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 18 })} />
    </View>
  );
}
