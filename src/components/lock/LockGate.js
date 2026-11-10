import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint } from 'lucide-react-native';
import PinVerify from './PinVerify';
import { LogoMark } from '../brand/Logo';
import { Button, Text, TextField, Pressable } from '../ui';
import { clearPin, redeemRecoveryCode } from '../../services/pin';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../theme';

/** Bloqueia o app (PIN e/ou biometria) ao abrir e ao voltar do segundo plano. */
export default function LockGate({ children }) {
  const { pinEnabled, biometricEnabled, update, setNeedsNewPin } = useSettings();
  const [recovering, setRecovering] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [checking, setChecking] = useState(false);
  const { colors } = useTheme();
  const locking = pinEnabled || biometricEnabled;
  const [unlocked, setUnlocked] = useState(!locking);
  const busy = useRef(false);

  const bio = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquear JUK Authenticator', cancelLabel: 'Cancelar' });
      if (r.success) setUnlocked(true);
    } finally { busy.current = false; }
  }, []);

  useEffect(() => {
    if (!locking) setUnlocked(true);
    else if (!unlocked && biometricEnabled) bio();
  }, [locking]);

  useEffect(() => {
    if (!locking) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') setUnlocked(false);
      if (s === 'active' && biometricEnabled) bio();
    });
    return () => sub.remove();
  }, [locking, biometricEnabled, bio]);

  const recover = async () => {
    if (checking) return;
    setChecking(true);
    setCodeError('');
    try {
      const r = await redeemRecoveryCode(code);
      if (r.ok) {
        // prova de posse: remove o PIN antigo, destrava e pede um novo
        await clearPin();
        await update({ pinEnabled: false });
        setNeedsNewPin(true);
        setUnlocked(true);
        setRecovering(false);
        setCode('');
      } else if (r.noCodes) setCodeError('Nenhum código de recuperação foi configurado neste aparelho.');
      else if (r.waitMs > 0) setCodeError(`Muitas tentativas. Aguarde ${Math.ceil(r.waitMs / 1000)}s.`);
      else setCodeError('Código inválido ou já usado.');
    } catch {
      setCodeError('Não foi possível verificar o código.');
    } finally { setChecking(false); }
  };

  if (unlocked || !locking) return children;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 16 }}>
        <LogoMark size={44} original />
        {pinEnabled
          ? (recovering
            ? (
              <View style={{ alignSelf: 'stretch', maxWidth: 380, width: '100%', gap: 14 }}>
                <Text variant="heading" style={{ fontSize: 20, textAlign: 'center' }}>Recuperar acesso</Text>
                <Text tone="textSecondary" style={{ textAlign: 'center' }}>Digite um dos seus códigos de recuperação. Depois você criará um PIN novo.</Text>
                <TextField value={code} onChangeText={(v) => { setCode(v); setCodeError(''); }} placeholder="XXXXX-XXXXX" autoCapitalize="characters" autoCorrect={false} autoFocus maxLength={11} inputStyle={{ textAlign: 'center', letterSpacing: 2 }} />
                <Text variant="caption" tone="danger" style={{ textAlign: 'center', minHeight: 18 }}>{codeError || ' '}</Text>
                <Button title="Recuperar acesso" onPress={recover} loading={checking} disabled={code.replace(/[^A-Za-z0-9]/g, '').length < 10} />
                <Pressable onPress={() => { setRecovering(false); setCodeError(''); }} style={{ alignSelf: 'center', padding: 10 }}><Text variant="label" tone="primary">Voltar ao PIN</Text></Pressable>
              </View>
            )
            : <PinVerify title="JUK Authenticator" subtitle="Digite seu PIN para entrar" onSuccess={() => setUnlocked(true)} onBiometric={biometricEnabled ? bio : undefined} onForgot={() => setRecovering(true)} />)
          : <><Text variant="heading">App bloqueado</Text><Button title="Desbloquear" icon={Fingerprint} onPress={bio} style={{ alignSelf: 'stretch', minWidth: 260 }} /></>}
      </ScrollView>
    </SafeAreaView>
  );
}
