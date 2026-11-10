import React, { useEffect, useRef } from 'react';
import { Animated, Appearance, Easing, StyleSheet, View } from 'react-native';
import { BARS, BAR_W, BAR_H, LogoMark, Wordmark } from './Logo';
import Text from '../ui/Text';
import { fonts } from '../../theme';

const CENTER = { x: 174.5, y: 174 };
const ENTRY = 0.2; // fração do tamanho da marca de onde cada par entra
const MIN_MS = 1900;

/** direção (unitária) do par de barras para fora do centro */
function outward(pairIndex) {
  const bar = BARS[pairIndex * 2];
  const a = (bar.r * Math.PI) / 180;
  const cx = bar.x + (BAR_W / 2) * Math.cos(a) - (BAR_H / 2) * Math.sin(a);
  const cy = bar.y + (BAR_W / 2) * Math.sin(a) + (BAR_H / 2) * Math.cos(a);
  const dx = cx - CENTER.x;
  const dy = cy - CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export const SPLASH_BG = { light: '#FFFFFF', dark: '#0B0E14' };

/**
 * Splash animado (como a hero da JUCA Soft): os quatro pares de barras assentam em sequência,
 * a marca faz um leve pulso e a palavra JUK aparece. Some com fade quando `ready` e o tempo mínimo passam.
 */
export default function AnimatedSplash({ ready, onDone }) {
  const dark = Appearance.getColorScheme() === 'dark';
  const bg = dark ? SPLASH_BG.dark : SPLASH_BG.light;
  const fg = dark ? '#FFFFFF' : '#111113';
  const SIZE = 132;

  const pairs = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const shine = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const minElapsed = useRef(false);
  const exiting = useRef(false);

  const tryExit = () => {
    if (exiting.current || !minElapsed.current || !readyRef.current) return;
    exiting.current = true;
    Animated.timing(out, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => onDone?.());
  };
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    Animated.parallel([
      ...pairs.map((v, i) => Animated.timing(v, { toValue: 1, duration: 900, delay: 120 + i * 130, easing: Easing.out(Easing.exp), useNativeDriver: true })),
      Animated.timing(shine, { toValue: 1, duration: 800, delay: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 600, delay: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => { minElapsed.current = true; tryExit(); }, MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { tryExit(); }, [ready]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
        { opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] },
      ]}
    >
      <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ scale: shine.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.07, 1] }) }] }}>
        {[0, 1, 2, 3].map((i) => {
          const d = outward(i);
          return (
            <Animated.View
              key={i}
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: pairs[i],
                  transform: [
                    { translateX: pairs[i].interpolate({ inputRange: [0, 1], outputRange: [d.x * SIZE * ENTRY, 0] }) },
                    { translateY: pairs[i].interpolate({ inputRange: [0, 1], outputRange: [d.y * SIZE * ENTRY, 0] }) },
                  ],
                },
              ]}
            >
              <LogoMark size={SIZE} pairs={[i]} original={!dark} color={dark ? '#FFFFFF' : undefined} />
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.View style={{ alignItems: 'center', marginTop: 34, gap: 8, opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        <Wordmark height={26} color={fg} />
        <Text style={{ fontFamily: fonts.medium, fontSize: 11.5, letterSpacing: 4, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,19,0.55)', textTransform: 'uppercase' }}>Authenticator</Text>
      </Animated.View>
    </Animated.View>
  );
}
