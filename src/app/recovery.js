import React, { useEffect, useState } from 'react';
import { copySensitive } from '../services/clipboard';
import { ScrollView, Share, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, Copy, KeyRound, RefreshCw, Share2, TriangleAlert } from 'lucide-react-native';
import { Page } from '../components/layout';
import AuthGate from '../components/lock/AuthGate';
import { Text, ScreenHeader, Button, Pressable, useToast, useDialog } from '../components/ui';
import { useTheme, fonts, radius } from '../theme';
import { useLayout } from '../hooks/useLayout';
import { useHaptics } from '../hooks/useHaptics';
import { generateRecoveryCodes, recoveryCodesRemaining, RECOVERY_COUNT } from '../services/pin';
import { clearFreshRecoveryCodes, setFreshRecoveryCodes, takeFreshRecoveryCodes } from '../services/recoveryCache';
import { goBack } from '../utils/navigation';

/** Códigos recém-gerados: aparecem só agora. */
function ShowCodes({ codes, onDone }) {
  const { colors } = useTheme();
  const { bp } = useLayout();
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const text = codes.join('\n');
  const cols = bp === 'compact' ? 2 : 4;

  const copy = async () => {
    await copySensitive(text, 60_000);
    toast('Códigos copiados');
  };
  const share = async () => { try { await Share.share({ title: 'Códigos de recuperação JUK', message: `Códigos de recuperação do PIN (JUK Authenticator):\n${text}` }); } catch {} };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft }}>
        <TriangleAlert size={20} color={colors.primary} />
        <Text variant="caption" tone="textSecondary" style={{ flex: 1 }}>
          Guarde estes códigos em um lugar seguro (gerenciador de senhas ou papel). Cada um vale uma vez e serve para criar um novo PIN se você esquecer o atual. Eles não serão mostrados de novo.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {codes.map((c) => (
          <View key={c} style={{ width: `${100 / cols - 2.5}%`, flexGrow: 1, paddingVertical: 14, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text selectable style={{ fontFamily: fonts.mono, fontSize: 15, letterSpacing: 1 }}>{c}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Copiar" icon={Copy} variant="ghost" onPress={copy} style={{ flex: 1 }} />
        <Button title="Compartilhar" icon={Share2} variant="ghost" onPress={share} style={{ flex: 1 }} />
      </View>

      <Pressable onPress={() => setSaved((s) => !s)} accessibilityRole="checkbox" accessibilityState={{ checked: saved }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: saved ? colors.primary : colors.border, backgroundColor: saved ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {saved ? <Check size={15} color={colors.onPrimary} strokeWidth={3} /> : null}
        </View>
        <Text style={{ flex: 1 }}>Guardei meus códigos em local seguro</Text>
      </Pressable>
      <Button title="Concluir" disabled={!saved} onPress={onDone} />
    </ScrollView>
  );
}

/** Situação atual + gerar novos. */
function Manage({ onGenerated }) {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const dialog = useDialog();
  const [remaining, setRemaining] = useState(null);

  useFocusEffect(React.useCallback(() => { recoveryCodesRemaining().then(setRemaining); }, []));

  const generate = async () => {
    const ok = await dialog.confirm({ title: 'Gerar novos códigos?', message: 'Os códigos atuais deixarão de funcionar.', confirmText: 'Gerar', destructive: true, tone: 'warning' });
    if (!ok) return;
    try { const codes = await generateRecoveryCodes(); setFreshRecoveryCodes(codes); haptics.success(); onGenerated(codes); }
    catch { dialog.alert({ title: 'Erro', message: 'Não foi possível gerar os códigos neste aparelho.', tone: 'danger' }); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <KeyRound size={32} color={colors.primary} strokeWidth={1.7} />
        </View>
        <Text style={{ fontFamily: fonts.bold, fontSize: 30 }}>{remaining ?? '–'} <Text tone="textMuted" style={{ fontSize: 18 }}>de {RECOVERY_COUNT}</Text></Text>
        <Text tone="textSecondary" style={{ textAlign: 'center', maxWidth: 320 }}>
          códigos de recuperação disponíveis. Use um deles na tela de bloqueio, em “Esqueci o PIN”, para criar um PIN novo.
        </Text>
        {remaining === 0 ? <Text variant="caption" tone="danger">Você não tem nenhum código. Gere novos agora.</Text> : null}
      </View>
      <Button title="Gerar novos códigos" icon={RefreshCw} onPress={generate} />
    </ScrollView>
  );
}

export default function RecoveryScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const [fresh, setFresh] = useState(() => takeFreshRecoveryCodes());

  // sai da memória ao deixar a tela
  useEffect(() => () => clearFreshRecoveryCodes(), []);

  const done = () => { clearFreshRecoveryCodes(); setFresh(null); goBack(router); };

  return (
    <Page>
      <ScreenHeader title="Códigos de recuperação" onBack={fresh ? async () => { if (await dialog.confirm({ title: 'Sair sem guardar?', message: 'Estes códigos não serão mostrados de novo. Você poderá gerar outros depois.', confirmText: 'Sair', cancelText: 'Ficar', destructive: true, tone: 'warning' })) done(); } : undefined} />
      {fresh ? (
        <ShowCodes codes={fresh} onDone={done} />
      ) : (
        <AuthGate reason="Confirme seu PIN para gerenciar os códigos">
          <Manage onGenerated={setFresh} />
        </AuthGate>
      )}
    </Page>
  );
}
