import React from 'react';
import { copySensitive } from '../../services/clipboard';
import { goBack } from '../../utils/navigation';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Copy, Download, Pencil, Trash2 } from 'lucide-react-native';
import HeroScreen from '../layout/HeroScreen';
import ServiceIcon from './ServiceIcon';
import TickRing from './TickRing';
import { Text, IconButton, Pressable, useToast, useDialog } from '../ui';
import { useTheme, fonts } from '../../theme';
import { useLayout } from '../../hooks/useLayout';
import { useHaptics } from '../../hooks/useHaptics';
import { totpFor, formatCode } from '../../hooks/useTotp';
import { tokenTitle } from '../../services/serviceDetect';

function Action({ icon: Icon, label, onPress, danger }) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} strokeWidth={1.9} />
      </View>
      <Text variant="caption" tone={danger ? 'danger' : 'textSecondary'}>{label}</Text>
    </Pressable>
  );
}

/** Detalhe da conta (referência "Option 2"): anel de contagem + código grande. */
export default function TokenDetail({ token, now, embedded, onRemove }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { rs, width, height, isSplit } = useLayout();
  const toast = useToast();
  const dialog = useDialog();
  const haptics = useHaptics();
  const { code, secondsLeft, fraction } = totpFor(token, now);
  const title = tokenTitle(token);

  const ringSize = Math.min(rs(280), (embedded ? 460 : width) * 0.68, height * 0.3);

  const copy = async () => {
    await copySensitive(code, 30_000);
    haptics.success();
    toast('Código copiado');
  };

  const remove = async () => {
    haptics.tap();
    const ok = await dialog.confirm({
      title: 'Remover conta?',
      message: `${title}\n\nVocê perderá o acesso aos códigos se não tiver outra forma de entrar nessa conta.`,
      confirmText: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    await onRemove(token.id);
    if (!embedded) goBack(router);
  };

  const hero = (
    <View style={{ alignItems: 'center', paddingBottom: rs(28) }}>
      <View style={{ height: 56, width: '100%', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
        {embedded ? <View style={{ width: 40 }} /> : <IconButton icon={ChevronLeft} size={26} color={colors.onHero} label="Voltar" onPress={() => goBack(router)} />}
        <Text variant="label" style={{ flex: 1, textAlign: 'center', color: colors.onHeroMuted }} numberOfLines={1}>{token.issuer || 'Conta'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <TickRing size={ringSize} fraction={fraction} color={colors.onHero} track={colors.heroTrack}>
        <ServiceIcon iconKey={token.iconKey} name={title} size={ringSize * 0.34} />
      </TickRing>
      <Text style={{ fontFamily: fonts.semibold, fontSize: rs(26), color: colors.onHero, marginTop: rs(14) }}>{secondsLeft}</Text>
      <Text variant="caption" style={{ color: colors.onHeroMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>segundos</Text>
    </View>
  );

  return (
    <HeroScreen hero={hero} maxWidth={embedded ? 560 : 640}>
      <ScrollView contentContainerStyle={{ padding: rs(24), paddingBottom: 40, gap: rs(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ServiceIcon iconKey={token.iconKey} name={title} size={24} />
          <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>{title}</Text>
          <IconButton icon={Pencil} size={19} color={colors.textSecondary} label="Editar" onPress={() => router.push(`/edit/${token.id}`)} />
        </View>
        <Pressable onPress={copy} accessibilityLabel="Copiar código" pressedOpacity={0.7}>
          <Text style={{ fontFamily: fonts.mono, fontSize: Math.min(rs(46), 56), letterSpacing: 2, color: secondsLeft <= 5 ? colors.danger : colors.text, marginTop: 4 }} numberOfLines={1}>
            {formatCode(code)}
          </Text>
        </Pressable>
        <Text tone="textSecondary" selectable>{token.accountName}</Text>
        <Text variant="caption" tone="textMuted">{(token.algorithm || 'SHA-1')} · {token.digits || 6} dígitos · {token.period || 30}s</Text>

        <View style={{ flexDirection: 'row', marginTop: rs(26), maxWidth: 440 }}>
          <Action icon={Copy} label="Copiar" onPress={copy} />
          <Action icon={Pencil} label="Editar" onPress={() => router.push(`/edit/${token.id}`)} />
          <Action icon={Download} label="Exportar" onPress={() => router.push(`/export?ids=${token.id}`)} />
          <Action icon={Trash2} label="Remover" onPress={remove} danger />
        </View>
      </ScrollView>
    </HeroScreen>
  );
}
