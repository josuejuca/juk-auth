import React, { useMemo, useState } from 'react';
import { copySensitive } from '../services/clipboard';
import { ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Check, ChevronLeft, ChevronRight, Copy, QrCode, Share2, Layers, TriangleAlert } from 'lucide-react-native';
import { Page } from '../components/layout';
import AuthGate from '../components/lock/AuthGate';
import ServiceIcon from '../components/tokens/ServiceIcon';
import { Text, ScreenHeader, Button, Pressable, IconButton, useToast } from '../components/ui';
import { useTheme, radius } from '../theme';
import { useTokens } from '../hooks/useTokens';
import { useLayout } from '../hooks/useLayout';
import { buildMigrationUris, buildOtpauthUri } from '../services/otpauth';
import { tokenTitle, maskEmail } from '../services/serviceDetect';

/** Cartão com nome da conta + QR code individual (otpauth://). */
function QrCard({ token, size }) {
  const { colors } = useTheme();
  const toast = useToast();
  const uri = useMemo(() => buildOtpauthUri(token), [token]);
  return (
    <View style={{ alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
        <ServiceIcon iconKey={token.iconKey} name={tokenTitle(token)} size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" numberOfLines={1}>{tokenTitle(token)}</Text>
          <Text variant="caption" tone="textMuted" numberOfLines={1}>{token.accountName}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: radius.md }}>
        <QRCode value={uri} size={size} ecl="M" />
      </View>
      <Pressable onPress={async () => { await copySensitive(uri, 60_000); toast('Link copiado'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 }}>
        <Copy size={15} color={colors.primary} />
        <Text variant="label" tone="primary">Copiar link</Text>
      </Pressable>
    </View>
  );
}

function Content({ initialIds }) {
  const { colors } = useTheme();
  const { width, bp } = useLayout();
  const toast = useToast();
  const { tokens } = useTokens();
  const [picked, setPicked] = useState(initialIds); // Set | null (null = todas)
  const [view, setView] = useState('select'); // select | qrs | migration
  const [mIndex, setMIndex] = useState(0);

  const isOn = (id) => (picked ? picked.has(id) : true);
  const selected = useMemo(() => tokens.filter((t) => isOn(t.id)), [tokens, picked]);
  const toggle = (id) => {
    const set = new Set(picked || tokens.map((t) => t.id));
    set.has(id) ? set.delete(id) : set.add(id);
    setPicked(set);
  };

  const lines = () => selected.map(buildOtpauthUri).join('\n');
  const share = async () => { try { await Share.share({ title: 'Backup JUK Authenticator', message: lines() }); } catch {} };
  const copyAll = async () => {
    await copySensitive(lines(), 60_000);
    toast('Backup copiado');
  };

  const avail = Math.min(width, 1000) - 40;
  const cols = bp === 'expanded' ? 3 : bp === 'medium' ? 2 : 1;
  const cardW = (avail - (cols - 1) * 14) / cols;
  const qrSize = selected.length === 1 ? Math.min(300, cardW - 56) : Math.max(150, Math.min(240, cardW - 56));

  // ---- QRs individuais ----
  if (view === 'qrs') {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon={ChevronLeft} label="Voltar à seleção" onPress={() => setView('select')} style={{ marginLeft: -8 }} />
          <Text variant="heading" style={{ flex: 1 }}>{selected.length === 1 ? 'QR code da conta' : `${selected.length} QR codes`}</Text>
        </View>
        <Text variant="caption" tone="textSecondary">Escaneie com o JUK ou com qualquer app autenticador. Quem escanear terá acesso à conta.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: cols === 1 ? 'center' : 'flex-start' }}>
          {selected.map((t) => <View key={t.id} style={{ width: cardW }}><QrCard token={t} size={qrSize} /></View>)}
        </View>
      </ScrollView>
    );
  }

  // ---- QR de transferência em lote (Google Authenticator) ----
  if (view === 'migration') {
    const uris = buildMigrationUris(selected);
    const size = Math.min(width - 64, 320);
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: radius.lg }}>
          <QRCode value={uris[mIndex]} size={size} ecl="L" />
        </View>
        <Text variant="heading">QR {mIndex + 1} de {uris.length}</Text>
        <Text tone="textSecondary" style={{ textAlign: 'center', maxWidth: 340 }}>Reúne {selected.length} conta(s) em poucos QRs, no formato de transferência do Google Authenticator.</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <IconButton icon={ChevronLeft} label="Anterior" filled onPress={() => setMIndex((i) => Math.max(0, i - 1))} />
          <Button title="Concluir" onPress={() => { setView('select'); setMIndex(0); }} style={{ paddingHorizontal: 32 }} />
          <IconButton icon={ChevronRight} label="Próximo" filled onPress={() => setMIndex((i) => Math.min(uris.length - 1, i + 1))} />
        </View>
      </View>
    );
  }

  // ---- seleção ----
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft }}>
        <TriangleAlert size={20} color={colors.primary} />
        <Text variant="caption" tone="textSecondary" style={{ flex: 1 }}>Os códigos exportados dão acesso às suas contas. Guarde em local seguro e não compartilhe.</Text>
      </View>

      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text variant="overline" tone="textMuted">{selected.length} de {tokens.length} selecionadas</Text>
          <Pressable onPress={() => setPicked(selected.length === tokens.length ? new Set() : null)}><Text variant="label" tone="primary">{selected.length === tokens.length ? 'Limpar' : 'Selecionar todas'}</Text></Pressable>
        </View>
        {tokens.map((t) => (
          <Pressable key={t.id} onPress={() => toggle(t.id)} accessibilityRole="checkbox" accessibilityState={{ checked: isOn(t.id) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <ServiceIcon iconKey={t.iconKey} name={tokenTitle(t)} size={38} />
            <View style={{ flex: 1 }}>
              <Text variant="heading" style={{ fontSize: 15 }} numberOfLines={1}>{tokenTitle(t)}</Text>
              <Text variant="caption" tone="textMuted" numberOfLines={1}>{maskEmail(t.accountName)}</Text>
            </View>
            <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: isOn(t.id) ? colors.primary : colors.border, backgroundColor: isOn(t.id) ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {isOn(t.id) ? <Check size={15} color={colors.onPrimary} strokeWidth={3} /> : null}
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Button title={selected.length === 1 ? 'Mostrar QR code' : `Mostrar ${selected.length || ''} QR codes`.replace('  ', ' ')} icon={QrCode} disabled={!selected.length} onPress={() => setView('qrs')} />
        {selected.length > 1 ? <Button title="QR único de transferência" icon={Layers} variant="ghost" onPress={() => setView('migration')} /> : null}
        <Button title="Compartilhar backup (texto)" icon={Share2} variant="ghost" disabled={!selected.length} onPress={share} />
        <Button title="Copiar backup" icon={Copy} variant="ghost" disabled={!selected.length} onPress={copyAll} />
        <Text variant="caption" tone="textMuted" style={{ textAlign: 'center' }}>Cada conta ganha seu próprio QR (padrão otpauth://), aceito por qualquer app 2FA. O QR único segue o formato do Google Authenticator.</Text>
      </View>
    </ScrollView>
  );
}

export default function ExportScreen() {
  const { ids } = useLocalSearchParams();
  const initial = typeof ids === 'string' && ids ? new Set(ids.split(',')) : null;
  return (
    <Page wide>
      <ScreenHeader title="Exportar códigos" />
      <AuthGate reason="Confirme para exportar seus códigos">
        <Content initialIds={initial} />
      </AuthGate>
    </Page>
  );
}
