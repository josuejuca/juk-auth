// components/TokenList.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TokenItem from './TokenItem';
import { useTheme } from '../theme/theme';

export default function TokenList({ tokens = [], onRefresh = () => {} }) {
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 2 : 1;
  const gap = isTablet ? 16 : 12;
  const padding = isTablet ? 24 : 16;

  const data = useMemo(() => tokens, [tokens]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (!data || data.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: isTablet ? 60 : 40 }}>
        <Ionicons name="key-outline" size={64} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: isTablet ? 18 : 16, marginTop: 16 }}>
          Nenhum token adicionado.
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          Toque no botão “+” para adicionar seu primeiro token.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={{ flex: 1, margin: gap / 2 }}>
          <TokenItem token={item} onUpdate={onRefresh} />
        </View>
      )}
      numColumns={numColumns}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.text]}
          tintColor={colors.text}
        />
      }
      contentContainerStyle={{
        paddingHorizontal: padding,
        paddingVertical: gap,
      }}
      columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
      ItemSeparatorComponent={numColumns === 1 ? () => <View style={{ height: gap }} /> : undefined}
      removeClippedSubviews
      initialNumToRender={10}
      windowSize={5}
    />
  );
}
