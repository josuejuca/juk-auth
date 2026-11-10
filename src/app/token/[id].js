import React from 'react';
import { goBack } from '../../utils/navigation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import TokenDetail from '../../components/tokens/TokenDetail';
import { useTokens } from '../../hooks/useTokens';
import { useNow } from '../../hooks/useNow';
import { useTheme } from '../../theme';
import { Text, Button } from '../../components/ui';

export default function TokenScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const now = useNow();
  const { tokens, loading, remove } = useTokens();
  const token = tokens.find((t) => String(t.id) === String(id));

  if (!token) {
    return loading ? <View style={{ flex: 1, backgroundColor: colors.hero }} /> : (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.background }}>
        <Text>Conta não encontrada.</Text>
        <Button title="Voltar" onPress={() => goBack(router)} />
      </View>
    );
  }
  return <TokenDetail token={token} now={now} onRemove={remove} />;
}
