import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldAlert } from 'lucide-react-native';
import PinVerify from './PinVerify';
import { Button, Text } from '../ui';
import { useSettings } from '../../context/SettingsContext';

/**
 * Exige autenticação (PIN e/ou biometria) antes de mostrar `children`.
 * Sem nenhuma proteção configurada, pede só uma confirmação.
 */
export default function AuthGate({ children, reason = 'Confirme sua identidade' }) {
  const { pinEnabled, biometricEnabled } = useSettings();
  const [ok, setOk] = useState(false);
  const busy = useRef(false);

  const bio = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancelar' });
      if (r.success) setOk(true);
    } finally { busy.current = false; }
  }, [reason]);

  useEffect(() => { if (!pinEnabled && biometricEnabled) bio(); }, []);

  if (ok) return children;
  if (pinEnabled) return <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}><PinVerify subtitle={reason} onSuccess={() => setOk(true)} onBiometric={biometricEnabled ? bio : undefined} /></ScrollView>;
  if (biometricEnabled) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}><Text>{reason}</Text><Button title="Usar biometria" onPress={bio} /></View>;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 }}>
      <ShieldAlert size={34} color="#E0A100" />
      <Text variant="heading" style={{ textAlign: 'center' }}>{reason}</Text>
      <Text tone="textSecondary" style={{ textAlign: 'center' }}>Esses dados dão acesso às suas contas. Ative um PIN em Configurações para proteger melhor.</Text>
      <Button title="Continuar" onPress={() => setOk(true)} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}
