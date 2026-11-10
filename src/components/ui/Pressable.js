import React from 'react';
import { Pressable as RNPressable } from 'react-native';

/** Pressable com feedback de opacidade (sem ripple "de template"). */
export default function Pressable({ style, pressedOpacity = 0.6, ...props }) {
  return (
    <RNPressable
      style={({ pressed }) => [typeof style === 'function' ? style({ pressed }) : style, pressed && { opacity: pressedOpacity }]}
      {...props}
    />
  );
}
