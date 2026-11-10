import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable as RNPressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Keyboard, Plus, ScanLine } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../ui/Text';
import Pressable from '../ui/Pressable';
import { useTheme, fonts } from '../../theme';
import { useLayout } from '../../hooks/useLayout';

/**
 * Botão de adicionar no estilo do Google Authenticator: um FAB com "+" que, ao tocar,
 * abre duas ações em pílula (Escanear código QR / Inserir chave de configuração).
 */
export default function AddMenu({ right = 16, bottom = 16, modalRight }) {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { rs } = useLayout();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: open ? 220 : 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [open]);

  const go = (path) => { setOpen(false); setTimeout(() => router.push(path), 120); };
  const size = rs(60);
  const fabBg = scheme === 'dark' ? colors.primary : colors.primary;

  const Action = ({ icon: Icon, label, onPress, i }) => (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14 * (i + 1), 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} pressedOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingLeft: 18, paddingRight: 22, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
        <Icon size={22} color={colors.primary} strokeWidth={2} />
        <Text style={{ fontFamily: fonts.medium, fontSize: 15.5 }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );

  return (
    <>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <RNPressable style={{ flex: 1 }} onPress={() => setOpen(false)} accessibilityLabel="Fechar menu">
          <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: colors.overlay || 'rgba(0,0,0,0.5)', opacity: anim }} />
          <View pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: modalRight ?? right, paddingBottom: bottom + insets.bottom + size + 14, gap: 12 }}>
            <Action i={1} icon={Keyboard} label="Inserir chave de configuração" onPress={() => go('/add-token')} />
            <Action i={0} icon={ScanLine} label="Escanear código QR" onPress={() => go('/scan')} />
          </View>
        </RNPressable>
      </Modal>

      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Adicionar conta"
        pressedOpacity={0.85}
        style={{
          position: 'absolute',
          right: right + insets.right,
          bottom: bottom + insets.bottom,
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: fabBg,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          zIndex: open ? 0 : 10,
        }}
      >
        <Plus size={size * 0.44} color={colors.onPrimary} strokeWidth={2.2} />
      </Pressable>
    </>
  );
}
