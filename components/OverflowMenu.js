// components/OverflowMenu.js
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  Animated,
  Platform,
  ScrollView,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * items: Array<
 *  | { type?: 'item'; icon: string; label: string; subLabel?: string; onPress?: () => void; badge?: string; danger?: boolean; disabled?: boolean }
 *  | { type: 'toggle'; icon: string; label: string; subLabel?: string; value: boolean; onToggle: (v:boolean)=>void; disabled?: boolean }
 *  | { type: 'section'; label: string }
 *  | { type: 'divider' }
 *  | { type: 'footer'; label: string }
 * >
 */
export default function OverflowMenu({
  visible,
  onClose,
  items = [],
  title = 'JuK Authenticator',
  subtitle,           // opcional: texto pequeno abaixo do título
  anchorTop = 56,     // altura do header para posicionar o popover
  alignment = 'right' // 'right' | 'left'
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // dimensões responsivas
  const MENU_W = clamp(Math.round(width * 0.86), 260, 340);
  const PADDING_X = clamp(Math.round(width * 0.045), 14, 18);
  const ROW_VPAD = clamp(Math.round(height * 0.016), 12, 16);
  const ICON = clamp(Math.round(width * 0.055), 18, 22);
  const CORNER = clamp(Math.round(width * 0.04), 12, 16);
  const GAP = clamp(Math.round(height * 0.01), 6, 10);
  const TOP_OFFSET = clamp(Math.round(height * 0.012), 8, 12);
  const MAX_H = clamp(Math.round(height * 0.58), 320, 460);

  // animações
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-6)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.spring(translate, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      translate.setValue(-6);
    }
  }, [visible]);

  if (!visible) return null;

  const Pointer = () => (
    <View
      style={{
        position: 'absolute',
        top: -8,
        [alignment === 'right' ? 'right' : 'left']: 24,
        width: 16, height: 16,
        backgroundColor: colors.card,
        transform: [{ rotate: '45deg' }],
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
        borderTopLeftRadius: 3,
      }}
    />
  );

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: GAP }} />
  );

  const Section = ({ label }) => (
    <View style={{ paddingHorizontal: PADDING_X, paddingTop: GAP }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );

  const Badge = ({ text }) => (
    <View
      style={{
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: colors.primary + '33',
      }}
    >
      <Text style={{ color: colors.text, fontSize: 11 }}>{text}</Text>
    </View>
  );

  const RowBase = ({ children, onPress, disabled }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.5 : Platform.OS === 'ios' && pressed ? 0.6 : 1,
          paddingHorizontal: PADDING_X,
          paddingVertical: ROW_VPAD,
          flexDirection: 'row',
          alignItems: 'center',
        },
      ]}
    >
      {children}
    </Pressable>
  );

  const ItemRow = ({ icon, label, subLabel, onPress, badge, danger, disabled }) => (
    <RowBase onPress={() => { onClose?.(); setTimeout(() => onPress?.(), 10); }} disabled={disabled}>
      <Ionicons
        name={icon}
        size={ICON}
        color={danger ? colors.danger : colors.text}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
          <Text
            numberOfLines={1}
            style={{
              color: danger ? colors.danger : colors.text,
              fontSize: 16,
              fontWeight: '600',
              flexShrink: 1,
            }}
          >
            {label}
          </Text>
          {badge ? <Badge text={badge} /> : null}
        </View>
        {subLabel ? (
          <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </RowBase>
  );

  const ToggleRow = ({ icon, label, subLabel, value, onToggle, disabled }) => (
    <RowBase onPress={() => !disabled && onToggle?.(!value)} disabled={disabled}>
      <Ionicons name={icon} size={ICON} color={colors.text} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        {subLabel ? (
          <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      <Switch
        value={!!value}
        onValueChange={(v) => onToggle?.(v)}
        thumbColor={value ? colors.primary : '#f4f3f4'}
        trackColor={{ false: '#767577', true: colors.primary + '88' }}
      />
    </RowBase>
  );

  const Footer = ({ label }) => (
    <View
      style={{
        paddingHorizontal: PADDING_X,
        paddingVertical: GAP + 2,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>{label}</Text>
    </View>
  );

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      {/* backdrop */}
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)' }} onPress={onClose}>
        {/* popover */}
        <Animated.View
          style={{
            position: 'absolute',
            top: (insets.top || 0) + anchorTop + TOP_OFFSET,
            [alignment]: 12 + (alignment === 'right' ? (insets.right || 0) : (insets.left || 0)),
            width: MENU_W,
            borderRadius: CORNER,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 12,
            opacity,
            transform: [{ translateY: translate }],
            overflow: 'hidden',
          }}
        >
          <Pointer />

          {/* header */}
          <View style={{ paddingHorizontal: PADDING_X, paddingTop: ROW_VPAD, paddingBottom: ROW_VPAD / 1.5 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>{subtitle}</Text>
            ) : null}
          </View>

          {/* conteúdo com rolagem */}
          <ScrollView
            style={{ maxHeight: MAX_H }}
            contentContainerStyle={{ paddingBottom: GAP }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((it, idx) => {
              const type = it.type || 'item';
              if (type === 'divider') return <Divider key={`div-${idx}`} />;
              if (type === 'section') return <Section key={`sec-${idx}`} label={it.label} />;
              if (type === 'toggle') {
                return (
                  <ToggleRow
                    key={`tog-${idx}`}
                    icon={it.icon}
                    label={it.label}
                    subLabel={it.subLabel}
                    value={it.value}
                    onToggle={it.onToggle}
                    disabled={it.disabled}
                  />
                );
              }
              if (type === 'footer') return <Footer key={`foo-${idx}`} label={it.label} />;
              // default: item
              return (
                <ItemRow
                  key={`it-${idx}`}
                  icon={it.icon}
                  label={it.label}
                  subLabel={it.subLabel}
                  onPress={it.onPress}
                  badge={it.badge}
                  danger={it.danger}
                  disabled={it.disabled}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
