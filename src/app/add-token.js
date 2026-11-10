import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Page } from '../components/layout';
import { ClipboardPaste, ScanLine } from 'lucide-react-native';
import IconPicker from '../components/tokens/IconPicker';
import ServiceIcon from '../components/tokens/ServiceIcon';
import { detectServiceKey } from '../services/serviceDetect';
import { Text, TextField, Button, SegmentedControl, ScreenHeader, Pressable, useToast, useDialog } from '../components/ui';
import { useTheme } from '../theme';
import { isValidBase32 } from '../services/totp';
import { detectCodeType, normalizeSecret, parseAnyCode } from '../services/otpauth';
import { importAccounts } from '../services/accounts';
import { useHaptics } from '../hooks/useHaptics';

export default function AddTokenScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const dialog = useDialog();
  const haptics = useHaptics();

  const [issuer, setIssuer] = useState('');
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState(null);
  const [iconTouched, setIconTouched] = useState(false);
  const [pickIcon, setPickIcon] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA-1');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [saving, setSaving] = useState(false);

  const onIssuer = (v) => {
    setIssuer(v);
    if (!iconTouched) setIconKey(detectServiceKey(v, accountName));
  };

  const finish = (count) => {
    haptics.success();
    toast(count === 1 ? 'Conta adicionada' : `${count} contas importadas`);
    router.dismissAll?.();
    router.replace('/');
  };

  const handlePaste = async () => {
    const text = (await Clipboard.getStringAsync())?.trim();
    if (!text) return toast('Área de transferência vazia');
    if (detectCodeType(text) === 'unknown') {
      setSecretKey(normalizeSecret(text));
      return;
    }
    try {
      const accounts = parseAnyCode(text);
      if (accounts.length === 1) {
        const a = accounts[0];
        onIssuer(a.issuer); setAccountName(a.accountName); setSecretKey(a.secretKey);
        setAlgorithm(a.algorithm); setDigits(a.digits); setPeriod(a.period);
      } else {
        const ok = await dialog.confirm({ title: 'Importar contas?', message: `${accounts.length} contas encontradas. Importar todas?`, confirmText: 'Importar' });
        if (ok) finish(await importAccounts(accounts));
      }
    } catch (e) {
      dialog.alert({ title: 'Não foi possível ler', message: e?.message || 'Código inválido.', tone: 'danger' });
    }
  };

  const save = async () => {
    const secret = normalizeSecret(secretKey);
    if (!accountName.trim() || !secret) {
      return dialog.alert({ title: 'Campos obrigatórios', message: 'Informe o nome da conta e a chave secreta.', tone: 'warning' });
    }
    if (!isValidBase32(secret)) {
      return dialog.alert({ title: 'Chave inválida', message: 'A chave deve conter apenas letras A–Z e números 2–7 (Base32).', tone: 'danger' });
    }
    setSaving(true);
    const count = await importAccounts([{ issuer: issuer.trim(), name: name.trim(), iconKey: iconKey || undefined, accountName: accountName.trim(), secretKey: secret, algorithm, digits, period }]);
    setSaving(false);
    if (count) finish(count);
    else dialog.alert({ title: 'Erro', message: 'Não foi possível salvar a conta.', tone: 'danger' });
  };

  return (
    <Page>
      <ScreenHeader
        title="Inserir chave"
        right={<Pressable onPress={() => router.replace('/scan')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 }}>
          <ScanLine size={18} color={colors.primary} />
          <Text variant="label" tone="primary">Escanear</Text>
        </Pressable>}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <Pressable onPress={() => setPickIcon((v) => !v)} accessibilityLabel="Escolher ícone" style={{ alignItems: 'center', gap: 4 }}>
              <ServiceIcon iconKey={iconKey} name={name || issuer || '?'} size={50} />
              <Text variant="caption" tone="primary">Ícone</Text>
            </Pressable>
            <TextField style={{ flex: 1 }} label="Serviço" placeholder="Google, GitHub…" value={issuer} onChangeText={onIssuer} autoCapitalize="words" />
          </View>
          {pickIcon ? <IconPicker value={iconKey} onChange={(k) => { setIconKey(k); setIconTouched(true); }} name={name || issuer} /> : null}
          <TextField label="Nome de exibição (opcional)" placeholder="Ex.: Google trabalho" value={name} onChangeText={setName} autoCapitalize="words" />
          <TextField label="Conta" placeholder="voce@email.com" value={accountName} onChangeText={(v) => { setAccountName(v); if (!iconTouched && !issuer) setIconKey(detectServiceKey(v)); }} autoCapitalize="none" keyboardType="email-address" />
          <TextField
            label="Chave secreta"
            placeholder="JBSW Y3DP EHPK 3PXP"
            value={secretKey}
            onChangeText={setSecretKey}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            hint="Também aceita links otpauth:// e códigos de migração copiados."
            right={<Pressable onPress={handlePaste} hitSlop={8} accessibilityLabel="Colar" style={{ paddingLeft: 10 }}><ClipboardPaste size={20} color={colors.primary} /></Pressable>}
          />

          <View style={{ gap: 14, marginTop: 6 }}>
            <Text variant="overline" tone="textMuted">Avançado</Text>
            <SegmentedControl label="Algoritmo" value={algorithm} onChange={setAlgorithm} options={[{ value: 'SHA-1', label: 'SHA-1' }, { value: 'SHA-256', label: 'SHA-256' }, { value: 'SHA-512', label: 'SHA-512' }]} />
            <SegmentedControl label="Dígitos" value={digits} onChange={setDigits} options={[{ value: 6, label: '6' }, { value: 7, label: '7' }, { value: 8, label: '8' }]} />
            <SegmentedControl label="Período" value={period} onChange={setPeriod} options={[{ value: 30, label: '30 s' }, { value: 60, label: '60 s' }, { value: 90, label: '90 s' }]} />
          </View>

          <Button title="Adicionar conta" onPress={save} loading={saving} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}
