import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Page } from '../components/layout';
import { Text, ScreenHeader, Pressable, useToast } from '../components/ui';
import { LogoMark } from '../components/brand/Logo';
import { useTheme } from '../theme';
import { useLayout } from '../hooks/useLayout';
import { useHaptics } from '../hooks/useHaptics';
import { APP_ICONS, changeAppIcon, currentAppIcon, supportsAppIcons } from '../services/appIcon';

export default function AppIconScreen() {
  const { colors } = useTheme();
  const { width } = useLayout();
  const toast = useToast();
  const haptics = useHaptics();
  const supported = supportsAppIcons();
  const [current, setCurrent] = useState(currentAppIcon());

  const cols = width >= 520 ? 4 : 3;
  const tile = Math.floor((Math.min(width, 640) - 40 - (cols - 1) * 14) / cols);

  const pick = async (name) => {
    if (!supported) return toast('Disponível só no app instalado');
    const ok = await changeAppIcon(name);
    if (ok) { setCurrent(name); haptics.success(); toast('Ícone alterado'); }
    else toast('Não foi possível trocar o ícone');
  };

  return (
    <Page>
      <ScreenHeader title="Ícone do app" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <Text tone="textSecondary">Escolha como o JUK Authenticator aparece na tela inicial do seu aparelho.</Text>
        {!supported ? (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft }}>
            <Text variant="caption" tone="textSecondary">A troca de ícone só funciona no app instalado (iOS e Android), não no Expo Go nem na web.</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {APP_ICONS.map((i) => {
            const active = (current ?? null) === i.name;
            return (
              <Pressable key={String(i.name)} onPress={() => pick(i.name)} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Ícone ${i.label}`} style={{ width: tile, alignItems: 'center', gap: 8 }}>
                <View style={{ width: tile, height: tile, borderRadius: tile * 0.225, backgroundColor: i.bg, alignItems: 'center', justifyContent: 'center', borderWidth: active ? 3 : 1, borderColor: active ? colors.primary : colors.border }}>
                  <LogoMark size={tile * 0.62} original={i.original} color={i.fg} />
                  {active ? (
                    <View style={{ position: 'absolute', right: -6, top: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={15} color={colors.onPrimary} strokeWidth={3} />
                    </View>
                  ) : null}
                </View>
                <Text variant="caption" tone={active ? 'text' : 'textSecondary'}>{i.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Page>
  );
}
