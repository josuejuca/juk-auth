import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';
import { AppWindow, ChevronRight, EyeOff, Download, Fingerprint, KeyRound, LifeBuoy, Vibrate } from 'lucide-react-native';
import { Page } from '../components/layout';
import { Text, ScreenHeader, SegmentedControl, SettingsRow, AccentPicker, useToast, useDialog } from '../components/ui';
import { JucaSoftLogo } from '../components/brand/Logo';
import PinVerify from '../components/lock/PinVerify';
import { useTheme } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { clearPin, recoveryCodesRemaining, RECOVERY_COUNT } from '../services/pin';

function Section({ title, children }) {
  return (
    <View style={{ marginTop: 32 }}>
      <Text variant="overline" tone="textSecondary" style={{ marginBottom: 6 }}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialog();
  const { colors, mode, setMode } = useTheme();
  const { hapticsEnabled, biometricEnabled, pinEnabled, allowScreenshots, update } = useSettings();
  const [bio, setBio] = useState({ supported: false, enrolled: false });
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [codesLeft, setCodesLeft] = useState(null);
  useFocusEffect(React.useCallback(() => { if (pinEnabled) recoveryCodesRemaining().then(setCodesLeft).catch(() => {}); }, [pinEnabled]));

  useEffect(() => {
    (async () => {
      const supported = await LocalAuthentication.hasHardwareAsync().catch(() => false);
      const enrolled = supported ? await LocalAuthentication.isEnrolledAsync().catch(() => false) : false;
      setBio({ supported, enrolled });
    })();
  }, []);

  const toggleBiometric = async (on) => {
    if (!on) return update({ biometricEnabled: false });
    if (!bio.supported || !bio.enrolled) {
      return dialog.alert({ title: 'Biometria indisponível', message: 'Cadastre sua biometria ou um bloqueio de tela nas configurações do aparelho.', tone: 'warning' });
    }
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirmar biometria' });
    if (res.success) update({ biometricEnabled: true });
  };

  const sw = (value, onValueChange, disabled) => (
    <Switch value={value} onValueChange={onValueChange} disabled={disabled} trackColor={{ false: colors.surfaceAlt, true: colors.primary }} thumbColor="#fff" />
  );

  if (confirmRemove) {
    return (
      <Page>
        <ScreenHeader title="Remover PIN" onBack={() => setConfirmRemove(false)} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <PinVerify title="Digite seu PIN" subtitle="Confirme para remover o bloqueio" onSuccess={async () => { await clearPin(); await update({ pinEnabled: false }); setConfirmRemove(false); toast('PIN removido'); }} />
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <ScreenHeader title="Configurações" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Section title="Aparência">
          <View style={{ paddingVertical: 12 }}>
            <SegmentedControl value={mode} onChange={setMode} options={[{ value: 'system', label: 'Sistema' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }]} />
          </View>
        </Section>

        <Section title="Cor do tema">
          <AccentPicker />
        </Section>

        <Section title="Ícone do app">
          <SettingsRow icon={AppWindow} title="Trocar ícone" description="Escolha outra cor para o ícone na tela inicial." last onPress={() => router.push('/app-icon')} right={<ChevronRight size={20} color={colors.textMuted} />} />
        </Section>

        <Section title="Segurança">
          <SettingsRow
            icon={KeyRound}
            title="PIN de bloqueio"
            description={pinEnabled ? 'Ativo. Pedido ao abrir o app e ao exportar.' : 'Peça um PIN ao abrir o app e ao exportar.'}
            right={sw(pinEnabled, (v) => (v ? router.push('/pin') : setConfirmRemove(true)))}
          />
          {pinEnabled ? <SettingsRow icon={LifeBuoy} title="Códigos de recuperação" description={codesLeft === null ? 'Para criar um PIN novo se você esquecer.' : `${codesLeft} de ${RECOVERY_COUNT} disponíveis${codesLeft === 0 ? ' — gere novos' : ''}`} onPress={() => router.push('/recovery')} right={<ChevronRight size={20} color={colors.textMuted} />} /> : null}
          {pinEnabled ? <SettingsRow title="Alterar PIN" onPress={() => router.push('/pin')} right={<ChevronRight size={20} color={colors.textMuted} />} /> : null}
          <SettingsRow
            icon={Fingerprint}
            title="Bloqueio biométrico"
            description={bio.supported ? (bio.enrolled ? 'Usar digital ou rosto para desbloquear.' : 'Cadastre uma biometria no aparelho.') : 'Indisponível neste aparelho.'}
            right={sw(biometricEnabled, toggleBiometric, !bio.supported)}
          />
          <SettingsRow
            icon={EyeOff}
            title="Bloquear capturas de tela"
            description="Impede prints e gravação, e esconde os códigos na lista de apps recentes."
            last
            right={sw(!allowScreenshots, (v) => update({ allowScreenshots: !v }))}
          />
        </Section>

        <Section title="Dados">
          <SettingsRow icon={Download} title="Exportar códigos" description="QR de transferência ou backup em texto." onPress={() => router.push('/export')} right={<ChevronRight size={20} color={colors.textMuted} />} />
          <SettingsRow icon={Vibrate} title="Vibração" description="Retorno tátil ao copiar e escanear." last right={sw(hapticsEnabled, (v) => update({ hapticsEnabled: v }))} />
        </Section>


        <View style={{ alignItems: 'center', gap: 10, marginTop: 48 }}>
          <JucaSoftLogo height={26} />
          <Text variant="caption" tone="textMuted">JUK Authenticator · versão {Constants.expoConfig?.version}</Text>
        </View>
      </ScrollView>
    </Page>
  );
}
