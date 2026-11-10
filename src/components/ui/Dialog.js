import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable as RNPressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react-native';
import Text from './Text';
import Pressable from './Pressable';
import { useTheme, fonts, radius } from '../../theme';
import { bestOn } from '../../theme/color';
import { useLayout } from '../../hooks/useLayout';

const DialogContext = createContext(null);

const ICONS = { info: Info, warning: TriangleAlert, danger: CircleAlert };

function Btn({ label, onPress, kind = 'ghost' }) {
  const { colors } = useTheme();
  const primary = kind === 'primary';
  const danger = kind === 'danger';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? colors.primary : danger ? colors.danger : 'transparent',
        borderWidth: primary || danger ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: primary ? colors.onPrimary : danger ? bestOn(colors.danger) : colors.text }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Modais do app (substituem o Alert nativo):
 *  - alert({ title, message, tone })            → Promise<void>
 *  - confirm({ title, message, confirmText, cancelText, destructive, tone }) → Promise<boolean>
 *  - sheet({ title, subtitle, actions:[{ label, icon, destructive, onPress }] }) → folha de ações
 */
export function DialogProvider({ children }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useLayout();
  const [current, setCurrent] = useState(null);
  const queue = useRef([]);
  const anim = useRef(new Animated.Value(0)).current;

  const active = useRef(null);

  // fila: um modal por vez (sem funções "atualizadoras" impuras, que rodam em dobro no modo dev)
  const next = useCallback(() => {
    const item = queue.current.shift() || null;
    active.current = item;
    setCurrent(item);
  }, []);

  const enqueue = useCallback((spec) => new Promise((resolve) => {
    const item = { ...spec, resolve };
    if (active.current) {
      queue.current.push(item);
    } else {
      active.current = item;
      setCurrent(item);
    }
  }), []);

  useEffect(() => {
    if (!current) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [current, anim]);

  const close = (result, after) => {
    const item = current;
    Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      item?.resolve(result);
      next();
      after?.();
    });
  };

  const api = useRef({
    alert: (o) => enqueue({ kind: 'alert', ...o }),
    confirm: (o) => enqueue({ kind: 'confirm', ...o }),
    sheet: (o) => enqueue({ kind: 'sheet', ...o }),
  }).current;

  const isSheet = current?.kind === 'sheet';
  const Icon = ICONS[current?.tone || (current?.destructive ? 'danger' : 'info')] || Info;
  const iconColor = current?.destructive || current?.tone === 'danger' ? colors.danger : current?.tone === 'warning' ? '#C98A0B' : colors.primary;
  const cardW = Math.min(width - 40, 400);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal visible={!!current} transparent animationType="none" statusBarTranslucent onRequestClose={() => close(current?.kind === 'confirm' ? false : undefined)}>
        <View style={{ flex: 1, justifyContent: isSheet ? 'flex-end' : 'center', alignItems: 'center' }}>
          <RNPressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => !current?.persistent && close(current?.kind === 'confirm' ? false : undefined)}
            accessibilityLabel="Fechar"
          >
            <Animated.View style={{ flex: 1, backgroundColor: colors.overlay, opacity: anim }} />
          </RNPressable>

          {current && !isSheet ? (
            <Animated.View
              style={{
                width: cardW,
                backgroundColor: colors.sheet,
                borderRadius: radius.xl,
                padding: 22,
                gap: 14,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: anim,
                transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
              }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={iconColor} strokeWidth={1.9} />
              </View>
              <View style={{ gap: 6 }}>
                <Text variant="heading" style={{ fontSize: 19 }}>{current.title}</Text>
                {current.message ? <Text tone="textSecondary">{current.message}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {current.kind === 'confirm' ? <Btn label={current.cancelText || 'Cancelar'} onPress={() => close(false)} /> : null}
                <Btn
                  label={current.kind === 'confirm' ? current.confirmText || 'Confirmar' : current.okText || 'Entendi'}
                  kind={current.destructive ? 'danger' : 'primary'}
                  onPress={() => close(current.kind === 'confirm' ? true : undefined)}
                />
              </View>
            </Animated.View>
          ) : null}

          {current && isSheet ? (
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 560,
                backgroundColor: colors.sheet,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                paddingTop: 10,
                paddingHorizontal: 20,
                paddingBottom: insets.bottom + 18,
                gap: 6,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: colors.border,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }],
              }}
            >
              <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 10 }} />
              {current.title ? <Text variant="heading" numberOfLines={1}>{current.title}</Text> : null}
              {current.subtitle ? <Text variant="caption" tone="textMuted" numberOfLines={1} style={{ marginBottom: 6 }}>{current.subtitle}</Text> : null}
              {current.actions.map((a, i) => {
                const AIcon = a.icon;
                const color = a.destructive ? colors.danger : colors.text;
                return (
                  <Pressable key={i} onPress={() => close(undefined, a.onPress)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
                    {AIcon ? <AIcon size={21} color={color} strokeWidth={1.9} /> : null}
                    <Text style={{ fontFamily: fonts.medium, fontSize: 16, color }}>{a.label}</Text>
                  </Pressable>
                );
              })}
              <Btn label="Cancelar" onPress={() => close(undefined)} />
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog deve ser usado dentro de <DialogProvider>');
  return ctx;
};
