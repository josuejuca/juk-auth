import React from 'react';
import { View } from 'react-native';
import Text from './Text';
import { useTheme } from '../../theme';

export default function EmptyState({ icon: Icon, title, description, children }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon size={32} color={colors.primary} strokeWidth={1.7} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center', fontSize: 21, lineHeight: 27 }}>{title}</Text>
      <Text tone="textSecondary" style={{ textAlign: 'center', marginTop: 6 }}>{description}</Text>
      {children ? <View style={{ marginTop: 24, alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}
