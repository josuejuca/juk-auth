import React, { memo } from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import Text from '../ui/Text';
import Pressable from '../ui/Pressable';
import ServiceIcon from './ServiceIcon';
import { useTheme, fonts, radius } from '../../theme';
import { totpFor, formatCode } from '../../hooks/useTotp';
import { maskEmail, tokenTitle } from '../../services/serviceDetect';
import { useLayout } from '../../hooks/useLayout';

/** Linha de conta (referência: ícone, nome, e-mail mascarado, check). */
function TokenCard({ token, now, selected, onPress, onLongPress }) {
  const { colors } = useTheme();
  const { rs } = useLayout();
  const { code, secondsLeft } = totpFor(token, now);
  const title = tokenTitle(token);

  return (
    <Pressable
      onPress={() => onPress(token)}
      onLongPress={() => onLongPress?.(token)}
      pressedOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${token.accountName}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(12),
        paddingVertical: rs(12),
        paddingHorizontal: rs(14),
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
      }}
    >
      <ServiceIcon iconKey={token.iconKey} name={title} size={rs(44)} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: rs(16.5) }}>{title}</Text>
        <Text numberOfLines={1} style={{ fontSize: rs(13.5), marginTop: 2 }} tone="textSecondary">{maskEmail(token.accountName)}</Text>
      </View>
      <Text numberOfLines={1} style={{ flexShrink: 0, fontFamily: fonts.mono, fontSize: rs(15.5), color: secondsLeft <= 5 ? colors.danger : colors.textSecondary }}>
        {formatCode(code)}
      </Text>
      {selected ? <Check size={rs(18)} color={colors.success} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}

export default memo(TokenCard);
