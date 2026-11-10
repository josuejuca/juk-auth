import React, { useEffect, useMemo, useState } from 'react';
import { copySensitive } from '../services/clipboard';
import { FlatList, TextInput, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Clock, Copy, Maximize2, Pencil, Trash2, Plus, Search, Settings, ShieldCheck, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AddMenu from '../components/home/AddMenu';
import HeroScreen from '../components/layout/HeroScreen';
import Logo from '../components/brand/Logo';
import ServiceIcon from '../components/tokens/ServiceIcon';
import TokenCard from '../components/tokens/TokenCard';
import TokenDetail from '../components/tokens/TokenDetail';
import { Text, IconButton, Pressable, EmptyState, Button, useToast, useDialog } from '../components/ui';
import { useTheme, fonts, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useTokens } from '../hooks/useTokens';
import { useNow } from '../hooks/useNow';
import { useHaptics } from '../hooks/useHaptics';
import { useLayout } from '../hooks/useLayout';
import { totpFor, formatCode } from '../hooks/useTotp';
import { tokenTitle } from '../services/serviceDetect';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { onboarded, needsNewPin, setNeedsNewPin } = useSettings();
  const { rs, gutter, isSplit, width } = useLayout();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const dialog = useDialog();
  const haptics = useHaptics();
  const now = useNow();
  const { tokens, loading, remove } = useTokens();

  const [selectedId, setSelectedId] = useState(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  // após recuperar o acesso com um código: criar um PIN novo
  useEffect(() => {
    if (needsNewPin) router.push('/pin');
  }, [needsNewPin]);

  useEffect(() => {
    if (!tokens.length) return setSelectedId(null);
    if (!tokens.some((t) => t.id === selectedId)) setSelectedId(tokens[0].id);
  }, [tokens, selectedId]);

  const selected = tokens.find((t) => t.id === selectedId) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => `${tokenTitle(t)} ${t.accountName || ''}`.toLowerCase().includes(q));
  }, [tokens, query]);

  if (!onboarded) return <Redirect href="/welcome" />;

  const copy = async (code) => {
    await copySensitive(code, 30_000);
    haptics.success();
    toast('Código copiado');
  };

  const onPressCard = (t) => {
    haptics.tap();
    if (isSplit || t.id !== selectedId) setSelectedId(t.id);
    else router.push(`/token/${t.id}`);
  };

  const onLongPressCard = (t) => {
    haptics.tap();
    dialog.sheet({
      title: tokenTitle(t),
      subtitle: t.accountName,
      actions: [
        { label: 'Copiar código', icon: Copy, onPress: () => copy(totpFor(t, Date.now()).code) },
        { label: 'Editar', icon: Pencil, onPress: () => router.push(`/edit/${t.id}`) },
        { label: 'Remover', icon: Trash2, destructive: true, onPress: async () => {
          const ok = await dialog.confirm({ title: 'Remover conta?', message: `${tokenTitle(t)} (${t.accountName})\n\nVocê perderá o acesso aos códigos se não tiver outra forma de entrar nessa conta.`, confirmText: 'Remover', destructive: true });
          if (ok) remove(t.id);
        } },
      ],
    });
  };

  const topBar = (onDark) => (
    <View style={{ height: 60, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Logo height={rs(19)} color={onDark ? colors.onHero : colors.text} muted={onDark ? colors.onHeroMuted : undefined} />
      <View style={{ flexDirection: 'row', marginRight: -8 }}>
        {!isSplit ? null : <IconButton icon={searching ? X : Search} label="Pesquisar" color={colors.text} onPress={() => { setSearching((s) => !s); setQuery(''); }} />}
        <IconButton icon={Settings} label="Configurações" color={onDark ? colors.onHero : colors.text} onPress={() => router.push('/settings')} />
      </View>
    </View>
  );

  const list = (
    <>
      <View style={{ paddingHorizontal: gutter, paddingTop: rs(20), paddingBottom: rs(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="overline" tone="textMuted">{tokens.length} {tokens.length === 1 ? 'conta protegida' : 'contas protegidas'}</Text>
        {!isSplit ? <IconButton icon={searching ? X : Search} size={19} color={colors.textSecondary} label="Pesquisar" onPress={() => { setSearching((s) => !s); setQuery(''); }} style={{ width: 34, height: 34 }} /> : null}
      </View>
      {searching ? (
        <View style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}>
            <Search size={17} color={colors.textMuted} />
            <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Buscar conta" placeholderTextColor={colors.textMuted} selectionColor={colors.primary} allowFontScaling={false}
              style={{ flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 }} />
          </View>
        </View>
      ) : null}
      <FlatList
        data={filtered}
        extraData={`${now}-${selectedId}`}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => <TokenCard token={item} now={now} selected={item.id === selectedId} onPress={onPressCard} onLongPress={onLongPressCard} />}
        ItemSeparatorComponent={() => <View style={{ height: rs(10) }} />}
        ListEmptyComponent={query ? <Text tone="textSecondary" style={{ textAlign: 'center', marginTop: 40 }}>Nenhum resultado.</Text> : null}
        ListFooterComponent={tokens.length ? <Text variant="caption" tone="textMuted" style={{ textAlign: 'center', marginTop: 18 }}>Segure uma conta para editar ou remover</Text> : null}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 4, paddingBottom: insets.bottom + rs(60) + 48 }}
        keyboardShouldPersistTaps="handled"
      />
    </>
  );

  const empty = (
    <EmptyState icon={ShieldCheck} title="Nenhuma conta ainda" description="Escaneie o QR code do serviço que você quer proteger com verificação em duas etapas.">
      <Button title="Escanear QR code" onPress={() => router.push('/scan')} />
      <Button title="Inserir chave manualmente" variant="ghost" onPress={() => router.push('/add-token')} style={{ marginTop: 10 }} />
    </EmptyState>
  );

  // ---------- telas largas: lista à esquerda, detalhe à direita ----------
  if (isSplit) {
    const listW = Math.max(320, Math.min(440, Math.round(width * 0.42)));
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
        <SafeAreaView edges={['top', 'left', 'bottom']} style={{ width: listW, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.sheet }}>
          {topBar(false)}
          {!loading && !tokens.length ? empty : list}
          <AddMenu modalRight={width - listW + 16} />
        </SafeAreaView>
        <View style={{ flex: 1 }}>
          {selected ? <TokenDetail embedded token={selected} now={now} onRemove={remove} /> : <View style={{ flex: 1, backgroundColor: colors.hero }} />}
        </View>
      </View>
    );
  }

  // ---------- celular: hero com código selecionado + folha com a lista ----------
  const sel = selected ? totpFor(selected, now) : null;
  const hero = (
    <View>
      {topBar(true)}
      <View style={{ paddingHorizontal: gutter, paddingTop: rs(10), paddingBottom: rs(22) }}>
        {selected ? (
          <>
            <Pressable onPress={() => router.push(`/token/${selected.id}`)} pressedOpacity={0.85} accessibilityLabel="Abrir detalhes" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ServiceIcon iconKey={selected.iconKey} name={tokenTitle(selected)} size={rs(26)} />
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: rs(15), color: colors.onHero }} numberOfLines={1}>{tokenTitle(selected)}</Text>
              <Maximize2 size={18} color={colors.onHeroMuted} />
            </Pressable>
            <Pressable onPress={() => copy(sel.code)} pressedOpacity={0.8} accessibilityLabel="Copiar código">
              <Text numberOfLines={1} style={{ fontFamily: fonts.mono, fontSize: rs(46), letterSpacing: 3, color: colors.onHero, marginTop: rs(14) }}>
                {formatCode(sel.code)}
              </Text>
            </Pressable>
            <Text numberOfLines={1} style={{ fontSize: rs(13), color: colors.onHeroMuted, marginTop: 4 }}>{selected.accountName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: rs(18) }}>
              <Clock size={15} color={colors.onHeroMuted} />
              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.heroTrack, overflow: 'hidden' }}>
                <View style={{ width: `${sel.fraction * 100}%`, height: '100%', backgroundColor: sel.secondsLeft <= 5 ? '#FFB4AB' : colors.onHero }} />
              </View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.onHeroMuted, minWidth: 24, textAlign: 'right' }}>{sel.secondsLeft}s</Text>
            </View>
          </>
        ) : (
          <View style={{ paddingVertical: rs(20) }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: rs(28), color: colors.onHero }}>0</Text>
            <Text style={{ color: colors.onHeroMuted }}>contas protegidas</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      <HeroScreen hero={hero} maxWidth={640}>
        {!loading && !tokens.length ? empty : list}
      </HeroScreen>
      <AddMenu right={16 + Math.max(0, (width - 640) / 2)} />
    </>
  );
}
