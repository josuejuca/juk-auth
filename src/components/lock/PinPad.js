import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';
import Text from '../ui/Text';
import Pressable from '../ui/Pressable';
import { useTheme, fonts } from '../../theme';
import { useLayout } from '../../hooks/useLayout';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Key({ label, onPress, children, a11y, size, bg }) {
  return (
    <Pressable
      onPress={onPress}
      pressedOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={a11y || label}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: label ? bg : 'transparent' }}
    >
      {children || <Text style={{ fontFamily: fonts.medium, fontSize: size * 0.38 }}>{label}</Text>}
    </Pressable>
  );
}

/**
 * Teclado numérico com bolinhas. `onComplete(pin)` dispara ao preencher `length` dígitos
 * e deve retornar `false` se recusou (o campo balança e limpa).
 * O valor fica numa ref: toques rápidos não perdem dígitos.
 */
export default function PinPad({ title, subtitle, length = 6, onComplete, onBiometric, error, resetSignal }) {
  const { colors } = useTheme();
  const { width, height } = useLayout();
  const [value, setValueState] = useState('');
  const valueRef = useRef('');
  const busy = useRef(false);
  const shake = useRef(new Animated.Value(0)).current;

  const setValue = useCallback((v) => { valueRef.current = v; setValueState(v); }, []);

  const key = Math.max(46, Math.min(78, Math.floor(Math.min(width * 0.2, height * 0.082))));
  const gap = Math.round(key * 0.22);

  useEffect(() => { setValue(''); }, [resetSignal, length, setValue]);

  const press = useCallback(async (d) => {
    if (busy.current || valueRef.current.length >= length) return;
    const next = valueRef.current + d;
    setValue(next);
    if (next.length < length) return;
    busy.current = true;
    // deixa a última bolinha pintar antes do hash (PBKDF2) travar a thread JS
    await new Promise((r) => setTimeout(r, 30));
    let ok = true;
    try { ok = await onComplete(next); } catch { ok = false; }
    busy.current = false;
    if (ok === false) {
      Animated.sequence([-12, 12, -8, 8, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 55, useNativeDriver: true }))).start();
      setTimeout(() => setValue(''), 220);
    }
  }, [length, onComplete, setValue, shake]);

  const erase = useCallback(() => {
    if (busy.current) return;
    setValue(valueRef.current.slice(0, -1));
  }, [setValue]);

  // teclado físico (web / tablets com teclado)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, erase]);

  const hasError = !!error;
  return (
    <View style={{ alignItems: 'center', gap: gap * 1.6 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text variant="heading" style={{ fontSize: 20 }}>{title}</Text>
        {subtitle ? <Text tone="textSecondary" style={{ textAlign: 'center' }}>{subtitle}</Text> : null}
      </View>
      <Animated.View style={{ flexDirection: 'row', gap: 14, transform: [{ translateX: shake }], height: 18, alignItems: 'center' }}>
        {Array.from({ length }, (_, i) => (
          <View key={i} style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: hasError ? colors.danger : colors.primary, backgroundColor: i < value.length ? (hasError ? colors.danger : colors.primary) : 'transparent' }} />
        ))}
      </Animated.View>
      <Text variant="caption" tone="danger" style={{ minHeight: 18, textAlign: 'center' }}>{error || ' '}</Text>
      <View style={{ gap }}>
        {[0, 1, 2].map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap }}>
            {KEYS.slice(r * 3, r * 3 + 3).map((k) => <Key key={k} label={k} size={key} bg={colors.surfaceAlt} onPress={() => press(k)} />)}
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap }}>
          {onBiometric
            ? <Key a11y="Usar biometria" size={key} onPress={onBiometric}><Fingerprint size={key * 0.4} color={colors.primary} /></Key>
            : <View style={{ width: key, height: key }} />}
          <Key label="0" size={key} bg={colors.surfaceAlt} onPress={() => press('0')} />
          <Key a11y="Apagar" size={key} onPress={erase}><Delete size={key * 0.36} color={colors.textSecondary} /></Key>
        </View>
      </View>
    </View>
  );
}
