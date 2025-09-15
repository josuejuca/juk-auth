// app/TokenItem.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, useWindowDimensions, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { deleteToken } from '../utils/storage';
import { startTotpTicker, generateTOTP } from '../utils/totp';

const TokenItem = ({ token, onUpdate }) => {
  const period = Number(token.period || 30);
  const digits = Number(token.digits || 6);
  const algorithm = token.algorithm || 'SHA-1';

  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [code, setCode] = useState(
    generateTOTP(token.secretKey, { algorithm, digits, period })
  );
  const [timeLeft, setTimeLeft] = useState(period);

  // animação de 0..1 (fração do período restante)
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const stop = startTotpTicker({
      secret: token.secretKey,
      digits,
      period,
      algorithm,
      syncWithNetwork: true,
      onTick: ({ code: nextCode, secondsLeft }) => {
        setCode(nextCode);
        setTimeLeft(secondsLeft);

        const frac = secondsLeft / period;
        Animated.timing(progressAnim, {
          toValue: frac,
          duration: 980, // levemente menor que 1s pra não acumular drift visual
          useNativeDriver: false,
        }).start();
      },
    });
    return () => stop();
  }, [token.secretKey, algorithm, period, digits]);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copiado', `Código ${code} copiado para a área de transferência.`);
    } catch {
      Alert.alert('Erro', 'Falha ao copiar código.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remover conta',
      `Deseja remover ${token.accountName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          onPress: async () => {
            await deleteToken(token.id);
            onUpdate && onUpdate();
          },
          style: 'destructive',
        },
      ]
    );
  };

  // cores da barra em função da fração restante
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [colors.danger, colors.warning, colors.primary],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const styles = getStyles(colors, isTablet);

  return (
    <View style={styles.container}>
      <View style={styles.accountInfo}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={isTablet ? 22 : 20} color={colors.primary} />
        </View>
        <View style={styles.accountDetails}>
          <Text style={styles.accountName} numberOfLines={1}>
            {token.accountName}
          </Text>
          <Text style={styles.accountType}>
            {algorithm} • {digits} dígitos • {period}s
          </Text>
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>
          {digits >= 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={copyToClipboard} style={styles.actionButton}>
            <Ionicons name="copy-outline" size={isTablet ? 22 : 20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={isTablet ? 22 : 20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {token.type === 'time-based' && (
        <View style={styles.timerContainer}>
          <View style={styles.timerBar}>
            <Animated.View
              style={[
                styles.timerProgress,
                { width: progressWidth, backgroundColor: progressColor },
              ]}
            />
          </View>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors, isTablet) => ({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: isTablet ? 18 : 16,
    marginBottom: isTablet ? 14 : 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: isTablet ? 14 : 12 },
  iconContainer: {
    width: isTablet ? 44 : 40,
    height: isTablet ? 44 : 40,
    borderRadius: 22,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: { flex: 1 },
  accountName: { fontSize: isTablet ? 17 : 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  accountType: { fontSize: isTablet ? 13 : 12, color: colors.textSecondary },
  codeContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  codeText: {
    fontSize: isTablet ? 30 : 24,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: colors.text,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  actions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
  timerContainer: { flexDirection: 'row', alignItems: 'center' },
  timerBar: {
    flex: 1, height: 4, backgroundColor: colors.border,
    borderRadius: 2, overflow: 'hidden', marginRight: 8,
  },
  timerProgress: { height: '100%', borderRadius: 2 },
  timerText: { fontSize: 12, color: colors.textSecondary, minWidth: 28, textAlign: 'right' },
});

export default TokenItem;
