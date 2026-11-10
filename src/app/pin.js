import React, { useState } from 'react';
import { goBack } from '../utils/navigation';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Page } from '../components/layout';
import { ScreenHeader, SegmentedControl, Text, useToast } from '../components/ui';
import PinPad from '../components/lock/PinPad';
import { generateRecoveryCodes, recoveryCodesRemaining, setPin } from '../services/pin';
import { setFreshRecoveryCodes } from '../services/recoveryCache';
import AuthGate from '../components/lock/AuthGate';
import { useSettings } from '../context/SettingsContext';
import { useHaptics } from '../hooks/useHaptics';
import { useLayout } from '../hooks/useLayout';

/** Criação de PIN: escolhe 4/6 dígitos, digita e confirma. */
export default function PinSetupScreen() {
  const router = useRouter();
  const toast = useToast();
  const haptics = useHaptics();
  const { height } = useLayout();
  const short = height < 700;
  const { update, pinLength, pinEnabled, needsNewPin, setNeedsNewPin } = useSettings();
  // alterar um PIN existente exige o PIN atual (decidido uma vez, ao abrir a tela)
  const [needGate] = useState(() => pinEnabled && !needsNewPin);
  const [length, setLength] = useState(pinLength);
  const [first, setFirst] = useState(null);
  const [error, setError] = useState('');
  const [reset, setReset] = useState(0);

  const change = (n) => { setLength(n); setFirst(null); setError(''); setReset((r) => r + 1); };

  const done = async (pin) => {
    if (!first) { setFirst(pin); setError(''); setReset((r) => r + 1); return true; }
    if (pin !== first) {
      setError('Os PINs não conferem. Tente de novo.');
      setFirst(null);
      haptics.error();
      return false;
    }
    try {
      await setPin(pin);
      await update({ pinEnabled: true, pinLength: pin.length });
    } catch (e) {
      setError('Não foi possível salvar o PIN neste aparelho.');
      setFirst(null);
      haptics.error();
      return false;
    }
    haptics.success();
    // PIN novo (primeira vez, ou após recuperação) → gera e mostra os códigos de recuperação
    try {
      const remaining = await recoveryCodesRemaining();
      if (needsNewPin || remaining === 0) {
        setFreshRecoveryCodes(await generateRecoveryCodes());
        setNeedsNewPin(false);
        router.replace('/recovery');
        return true;
      }
    } catch {}
    setNeedsNewPin(false);
    toast('PIN atualizado');
    goBack(router);
    return true;
  };

  const body = (
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 18 }}>
        {!first ? <View style={{ width: 200 }}><SegmentedControl value={length} onChange={change} options={[{ value: 4, label: '4 dígitos' }, { value: 6, label: '6 dígitos' }]} /></View> : null}
        <PinPad
          key={`${length}-${first ? 'b' : 'a'}`}
          title={first ? 'Confirme o PIN' : 'Crie um PIN'}
          subtitle={first ? 'Digite o mesmo PIN novamente' : 'Ele protege o app e a exportação dos códigos'}
          length={length}
          error={error}
          onComplete={done}
          resetSignal={reset}
        />
        {!short ? <Text variant="caption" tone="textMuted" style={{ textAlign: 'center', maxWidth: 300 }}>Ao criar o PIN você receberá códigos de recuperação. Guarde-os: sem eles e sem o PIN, só reinstalando o app (e perdendo as contas).</Text> : null}
      </ScrollView>
  );

  return (
    <Page>
      <ScreenHeader title="PIN de bloqueio" />
      {needGate ? <AuthGate reason="Confirme seu PIN atual para alterá-lo">{body}</AuthGate> : body}
    </Page>
  );
}
