// app/settings.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/theme';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function SettingsScreen() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState(true);

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const { mode, setMode, colors, scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  // responsividade
  const isTablet = width >= 768;
  const PAD_X = clamp(Math.round(width * 0.045), 14, 24);
  const PAD = clamp(Math.round(width * 0.042), 12, 20);
  const GAP = clamp(Math.round(width * 0.03), 8, 16);
  const CARD_RADIUS = clamp(Math.round(width * 0.03), 10, 14);
  const HEADER_H = clamp(Math.round(height * 0.06), 48, 56);
  const SIDE_W = clamp(Math.round(width * 0.12), 42, 56);
  const TITLE = isTablet ? 18 : 16;

  useEffect(() => {
    (async () => {
      await loadSettings();
      // biometria
      const hasHw = await LocalAuthentication.hasHardwareAsync().catch(() => false);
      const enrolled = hasHw ? await LocalAuthentication.isEnrolledAsync().catch(() => false) : false;
      setBiometricSupported(!!hasHw);
      setBiometricEnrolled(!!enrolled);
      const stored = await AsyncStorage.getItem('appSettings');
      const current = stored ? JSON.parse(stored) : {};
      setBiometricEnabled(current.biometricEnabled === true);
    })();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const s = JSON.parse(settings);
        setAutoRefreshEnabled(s.autoRefreshEnabled !== false);
        setHapticFeedbackEnabled(s.hapticFeedbackEnabled !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key, value) => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      const current = settings ? JSON.parse(settings) : {};
      current[key] = value;
      await AsyncStorage.setItem('appSettings', JSON.stringify(current));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // header compacto (mesmo padrão das outras telas internas)
  const Header = () => (
    <View
      style={{
        height: HEADER_H,
        paddingHorizontal: PAD_X,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <View style={{ width: SIDE_W, alignItems: 'flex-start', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text allowFontScaling={false} style={{ flex: 1, textAlign: 'center', color: colors.text, fontSize: 16, fontWeight: '700' }}>
        Configurações
      </Text>
      <View style={{ width: SIDE_W }} />
    </View>
  );

  const SectionTitle = ({ children }) => (
    <Text allowFontScaling={false}
      style={{
        color: colors.text,
        fontWeight: '700',
        padding: PAD,
        backgroundColor: colors.primary + '22',
      }}
    >
      {children}
    </Text>
  );

  const Card = ({ children }) => (
    <View
      style={{
        backgroundColor: colors.card,
        marginHorizontal: PAD_X,
        marginTop: GAP,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );

  const SettingItem = ({ title, description, right }) => (
    <View style={{ padding: PAD, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text allowFontScaling={false} style={{ color: colors.text, fontWeight: '600', fontSize: TITLE }}>{title}</Text>
      {description ? (
        <Text allowFontScaling={false} style={{ color: colors.textSecondary, marginTop: 4 }}>
          {description}
        </Text>
      ) : null}
      <View style={{ alignItems: 'flex-end', marginTop: 8 }}>{right}</View>
    </View>
  );

  const ThemeButton = ({ value, label }) => {
    const selected = mode === value;
    return (
      <TouchableOpacity
        onPress={() => setMode(value)}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          marginRight: 8,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary + '22' : 'transparent',
        }}
      >
        <Text allowFontScaling={false} style={{ color: selected ? colors.text : colors.textSecondary, fontWeight: '600' }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleBiometricToggle = async (v) => {
    if (!v) {
      setBiometricEnabled(false);
      await saveSettings('biometricEnabled', false);
      return;
    }
    // ativando
    if (!biometricSupported) {
      Alert.alert('Biometria não disponível', 'Seu dispositivo não possui hardware biométrico.');
      return;
    }
    if (!biometricEnrolled) {
      Alert.alert(
        'Sem biometria cadastrada',
        'Cadastre sua digital/rosto nas configurações do dispositivo e tente novamente.'
      );
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmar biometria',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (res.success) {
      setBiometricEnabled(true);
      await saveSettings('biometricEnabled', true);
    } else {
      setBiometricEnabled(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: GAP * 2 }}>
        {/* Aparência */}
        <Card>
          <SectionTitle>Aparência</SectionTitle>

          <View style={{ padding: PAD, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text allowFontScaling={false} style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Tema
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <ThemeButton value="system" label="Sistema" />
              <ThemeButton value="light" label="Claro" />
              <ThemeButton value="dark" label="Escuro" />
            </View>
            <Text allowFontScaling={false} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Tema atual: {mode === 'system' ? `Sistema (${scheme})` : mode}
            </Text>
          </View>

          <SectionTitle>Funcionalidades</SectionTitle>
          <SettingItem
            title="Atualização Automática"
            description="Atualizar automaticamente os códigos a cada período"
            right={
              <Switch
                value={autoRefreshEnabled}
                onValueChange={async (v) => {
                  setAutoRefreshEnabled(v);
                  await saveSettings('autoRefreshEnabled', v);
                }}
                thumbColor={autoRefreshEnabled ? colors.primary : '#f4f3f4'}
                trackColor={{ false: '#767577', true: colors.primary + '22' }}
              />
            }
          />
          <SettingItem
            title="Feedback Tátil"
            description="Vibrar ao copiar códigos ou realizar ações"
            right={
              <Switch
                value={hapticFeedbackEnabled}
                onValueChange={async (v) => {
                  setHapticFeedbackEnabled(v);
                  await saveSettings('hapticFeedbackEnabled', v);
                }}
                thumbColor={hapticFeedbackEnabled ? colors.primary : '#f4f3f4'}
                trackColor={{ false: '#767577', true: colors.primary + '22' }}
              />
            }
          />
        </Card>

        {/* Segurança */}
        <Card>
          <SectionTitle>Segurança</SectionTitle>

          <SettingItem
            title="Entrar com biometria"
            description={
              biometricSupported
                ? biometricEnrolled
                  ? 'Protege o app solicitando Face/Touch ID ou sensor biométrico ao abrir.'
                  : 'Cadastre a biometria nas configurações do seu dispositivo para ativar.'
                : 'Seu dispositivo não possui hardware biométrico.'
            }
            right={
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricSupported}
                thumbColor={biometricEnabled ? colors.primary : '#f4f3f4'}
                trackColor={{ false: '#767577', true: colors.primary + '22' }}
              />
            }
          />
          {Platform.OS === 'android' && biometricEnabled ? (
            <View style={{ paddingHorizontal: PAD, paddingBottom: PAD }}>
              <Text allowFontScaling={false} style={{ color: colors.textSecondary, fontSize: 12 }}>
                Dica: em alguns aparelhos, o fallback pode solicitar PIN/padrão caso a biometria falhe.
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Sobre */}
        <View style={{ padding: PAD, alignItems: 'center', gap: 6, marginTop: GAP }}>
          <Text allowFontScaling={false} style={{ color: colors.textSecondary }}>JuK Authenticator v1.0.0</Text>
          <Text allowFontScaling={false} style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            Um aplicativo de autenticação de dois fatores simples e seguro.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
