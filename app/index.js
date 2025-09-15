// app/index.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import TokenItem from '../components/TokenItem';
import { getTokens } from '../utils/storage';
import { generateTOTP } from '../utils/totp';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function HomeScreen() {
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // responsividade por % + clamp
  const isTablet = width >= 768;
  const paddingX = clamp(Math.round(width * 0.045), 14, 24);
  const gap = clamp(Math.round(width * 0.035), 10, 18);
  const searchH = clamp(Math.round(height * 0.055), 42, 50);
  const searchPadX = clamp(Math.round(width * 0.035), 12, 16);
  const topGap = clamp(Math.round(height * 0.006), 2, 6); // bem pequeno
  const iconSz = clamp(Math.round(width * 0.045), 16, 20);
  const closeSz = iconSz;

  useEffect(() => { loadTokens(); }, []);

  const loadTokens = async () => {
    const stored = await getTokens();
    const withCodes = stored.map((t) => ({
      ...t,
      code: generateTOTP(t.secretKey, {
        algorithm: t.algorithm || 'SHA-1',
        digits: t.digits || 6,
        period: t.period || 30,
      }),
    }));
    setTokens(withCodes);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTokens();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => {
      const name = (t.accountName || '').toLowerCase();
      const issuer = (t.issuer || '').toLowerCase();
      return name.includes(q) || issuer.includes(q);
    });
  }, [tokens, query]);

  const numColumns = isTablet ? 2 : 1;

  return (
    // remove o top do safe area aqui para evitar somar com o do AppHeader
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        onPressAdd={() => router.push('/add-token')}
        onPressMenu={() => {}}
      />

      {/* Barra de busca (gap mínimo) */}
      <View style={{ paddingHorizontal: paddingX, paddingTop: topGap, paddingBottom: gap / 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: Math.round(searchH / 2),
            paddingHorizontal: searchPadX,
            height: searchH,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search-outline" size={iconSz} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Pesquisar…"
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              marginLeft: 10,
              color: colors.text,
              fontSize: isTablet ? 15 : 14,
              includeFontPadding: false,
              paddingVertical: 0,
            }}
            allowFontScaling={false}
            returnKeyType="search"
          />
          {query?.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 6 }}>
              <Ionicons name="close-circle-outline" size={closeSz} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de cards */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: isTablet ? 60 : 40 }}>
          <Ionicons name="key-outline" size={64} color={colors.icon} />
          <Text style={{ fontSize: isTablet ? 20 : 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 }}>
            {query ? 'Nenhum resultado' : 'Nenhuma conta configurada'}
          </Text>
          <Text style={{ fontSize: isTablet ? 16 : 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            {query ? 'Tente outro termo de busca.' : 'Use o “+” para adicionar sua primeira conta.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={{ flex: 1, margin: gap / 2 }}>
              <TokenItem token={item} onUpdate={handleRefresh} />
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
            paddingHorizontal: paddingX,
            paddingTop: gap,
            paddingBottom: gap + insets.bottom,
          }}
          columnWrapperStyle={numColumns > 1 ? { columnGap: gap } : undefined}
          ItemSeparatorComponent={numColumns === 1 ? () => <View style={{ height: gap }} /> : undefined}
          removeClippedSubviews={Platform.OS === 'android'}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          windowSize={5}
        />
      )}

      {/* FAB flutuante “+” */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/add-token')}
        accessibilityRole="button"
        accessibilityLabel="Adicionar conta"
        style={{
          position: 'absolute',
          right: paddingX,
          bottom: (Platform.OS === 'ios' ? 20 : 16) + insets.bottom,
          width: isTablet ? 64 : 56,
          height: isTablet ? 64 : 56,
          borderRadius: isTablet ? 32 : 28,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={isTablet ? 28 : 24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
