import React, { useCallback, useEffect, useState } from 'react';
import { verifyPin, pinLockRemaining } from '../../services/pin';
import { View } from 'react-native';
import PinPad from './PinPad';
import Pressable from '../ui/Pressable';
import Text from '../ui/Text';
import { useSettings } from '../../context/SettingsContext';

/** Pede o PIN atual e chama `onSuccess`. Aplica espera após muitos erros. */
export default function PinVerify({ title = 'Digite seu PIN', subtitle, onSuccess, onBiometric, onForgot }) {
  const { pinLength } = useSettings();
  const [error, setError] = useState('');
  const [reset, setReset] = useState(0);

  useEffect(() => {
    pinLockRemaining().then((ms) => ms > 0 && setError(`Muitas tentativas. Aguarde ${Math.ceil(ms / 1000)}s.`));
  }, []);

  const check = useCallback(async (pin) => {
    let res;
    try { res = await verifyPin(pin); } catch { setError('Erro ao verificar o PIN. Tente novamente.'); setReset((n) => n + 1); return false; }
    const { ok, waitMs } = res;
    if (ok) { onSuccess(); return true; }
    setError(waitMs > 0 ? `Muitas tentativas. Aguarde ${Math.ceil(waitMs / 1000)}s.` : 'PIN incorreto');
    setReset((n) => n + 1);
    return false;
  }, [onSuccess]);

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <PinPad title={title} subtitle={subtitle} length={pinLength} error={error} onComplete={check} onBiometric={onBiometric} resetSignal={reset} />
      {onForgot ? <Pressable onPress={onForgot} accessibilityRole="button" style={{ padding: 10 }}><Text variant="label" tone="primary">Esqueci o PIN</Text></Pressable> : null}
    </View>
  );
}
