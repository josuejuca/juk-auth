import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Fingerprint, KeyRound, Lock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { G, Rect } from 'react-native-svg';
import { BARS, BAR_W, BAR_H, LogoMark, Wordmark } from '../components/brand/Logo';
import ServiceIcon from '../components/tokens/ServiceIcon';
import TickRing from '../components/tokens/TickRing';
import ScannerFrame from '../components/scan/ScannerFrame';
import { Text, Pressable, SegmentedControl, AccentPicker } from '../components/ui';
import { useTheme, fonts } from '../theme';
import { useLayout } from '../hooks/useLayout';
import { useNow } from '../hooks/useNow';
import { useSettings } from '../context/SettingsContext';
import { bestOn } from '../theme/color';
import { generateTOTP } from '../services/totp';
import { formatCode } from '../hooks/useTotp';

const STEPS = [
  { title: 'Códigos de verificação, sempre à mão', text: 'Gere os códigos de duas etapas direto no celular, mesmo sem internet. Nada sai do seu aparelho.' },
  { title: 'Escaneie e pronto', text: 'Aponte a câmera para o QR code do serviço. Também dá para importar suas contas do Google Authenticator.' },
  { title: 'Do seu jeito, e protegido', text: 'Escolha a aparência e, depois, ative PIN ou biometria nas configurações.' },
];

/** Ilustrações do topo (usam só as cores do tema). */
function DemoCodes({ size }) {
  const { colors } = useTheme();
  const now = useNow();
  const left = 30 - (Math.floor(now / 1000) % 30);
  const code = generateTOTP('JBSWY3DPEHPK3PXP', { timestampMs: now });
  return (
    <TickRing size={size} fraction={left / 30} color={colors.onHero} track={colors.heroTrack}>
      <View style={{ alignItems: 'center', gap: size * 0.05 }}>
        <ServiceIcon iconKey="github" size={size * 0.2} />
        <Text style={{ fontFamily: fonts.mono, fontSize: size * 0.13, color: colors.onHero, letterSpacing: 1 }}>{formatCode(code)}</Text>
        <Text variant="caption" style={{ color: colors.onHeroMuted }}>{left}s</Text>
      </View>
    </TickRing>
  );
}

function DemoScan({ size }) {
  const { colors } = useTheme();
  const line = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(line, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(line, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [line]);
  const box = size * 0.7;
  const cell = box / 11;
  // padrão fixo parecido com um QR
  const N = 11;
  const finder = (r, c) => (r < 3 && c < 3) || (r < 3 && c >= N - 3) || (r >= N - 3 && c < 3);
  const cells = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N), c = i % N;
    if (finder(r, c)) return true;
    if ((r < 4 && c < 4) || (r < 4 && c >= N - 4) || (r >= N - 4 && c < 4)) return false;
    return ((Math.imul(i + 7, 2654435761) >>> 7) % 5) < 2;
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <ScannerFrame size={size * 0.86} color={colors.onHero} />
      <View style={{ position: 'absolute', width: box, height: box, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.55 }}>
        {cells.map((on, i) => <View key={i} style={{ width: cell, height: cell, padding: cell * 0.08 }}><View style={{ flex: 1, borderRadius: 2, backgroundColor: on ? colors.onHero : 'transparent' }} /></View>)}
      </View>
      <Animated.View style={{ position: 'absolute', width: size * 0.78, height: 3, borderRadius: 2, backgroundColor: colors.onHero, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [-box / 2, box / 2] }) }] }} />
    </View>
  );
}

function DemoSecure({ size }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: size * 0.08 }}>
      <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: size * 0.1, backgroundColor: colors.heroTrack, alignItems: 'center', justifyContent: 'center' }}>
        <Lock size={size * 0.17} color={colors.onHero} strokeWidth={1.8} />
      </View>
      <View style={{ flexDirection: 'row', gap: size * 0.04 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Animated.View key={i} style={{ width: size * 0.055, height: size * 0.055, borderRadius: size, backgroundColor: colors.onHero, opacity: i < 4 ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] }) }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: size * 0.06 }}>
        <KeyRound size={size * 0.09} color={colors.onHeroMuted} />
        <Fingerprint size={size * 0.09} color={colors.onHeroMuted} />
      </View>
    </View>
  );
}

/** Botão para fundo colorido: cheio (cor do texto do topo) ou contornado. */
function HeroButton({ title, onPress, icon: Icon, ghost }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        height: 54,
        borderRadius: 16,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: ghost ? 'transparent' : colors.onHero,
        borderWidth: ghost ? 1.5 : 0,
        borderColor: colors.heroTrack,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: ghost ? colors.onHero : colors.hero }}>{title}</Text>
      {Icon ? <Icon size={19} color={colors.hero} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { rs, width, height, landscape } = useLayout();
  const { update } = useSettings();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const last = step === STEPS.length - 1;

  const go = (n) => {
    if (n === step) return;
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(n);
      Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };

  const finish = async (dest = '/') => {
    await update({ onboarded: true });
    router.replace('/');
    if (dest !== '/') router.push(dest);
  };

  // altura que sobra para a ilustração depois do bloco de texto/rodapé
  const textH = last ? 400 : 250;
  const illo = landscape
    ? Math.min(260, height - 120, width * 0.34)
    : Math.min(rs(260), width * 0.66, height - 56 - textH - 40);
  const showIllo = illo >= 90;
  const maxW = 560;

  const topBar = (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LogoMark size={24} color={colors.onHero} />
        <Wordmark height={17} color={colors.onHero} />
      </View>
      {!last ? (
        <Pressable onPress={() => finish()} accessibilityRole="button" hitSlop={10} style={{ paddingVertical: 8, paddingLeft: 12 }}>
          <Text variant="label" style={{ color: colors.onHeroMuted }}>Pular</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const illustration = (
    <Animated.View style={{ opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }], alignItems: 'center', justifyContent: 'center' }}>
      {!showIllo ? null : step === 0 ? <DemoCodes size={illo} /> : step === 1 ? <DemoScan size={illo} /> : <DemoSecure size={illo} />}
    </Animated.View>
  );

  const copy = (
    <Animated.View style={{ gap: 12, opacity: fade }}>
      <Text variant="overline" style={{ color: colors.onHeroMuted, letterSpacing: 2 }}>{`0${step + 1}  /  0${STEPS.length}`}</Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: rs(34), lineHeight: rs(40), letterSpacing: -1, color: colors.onHero }}>{STEPS[step].title}</Text>
      <Text style={{ color: colors.onHeroMuted, fontSize: 16.5, lineHeight: 24 }}>{STEPS[step].text}</Text>
    </Animated.View>
  );

  const options = last ? (
    <View style={{ gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.sheet }}>
      <SegmentedControl value={mode} onChange={setMode} options={[{ value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }, { value: 'system', label: 'Sistema' }]} />
      <AccentPicker compact inset={86} />
    </View>
  ) : null;

  const footer = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {STEPS.map((_, i) => (
          <Pressable key={i} onPress={() => go(i)} accessibilityLabel={`Passo ${i + 1}`} hitSlop={{ top: 12, bottom: 12 }} style={{ flex: 1 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.onHero : colors.heroTrack }} />
          </Pressable>
        ))}
      </View>
      {last ? (
        <View style={{ gap: 10 }}>
          <HeroButton title="Começar" icon={ArrowRight} onPress={() => finish()} />
          <HeroButton title="Escanear um QR code" ghost onPress={() => finish('/scan')} />
        </View>
      ) : (
        <HeroButton title="Continuar" icon={ArrowRight} onPress={() => go(step + 1)} />
      )}
    </View>
  );

  const statusStyle = bestOn(colors.hero) === '#FFFFFF' ? 'light' : 'dark';

  // marca enorme, cortada no canto: dá identidade ao fundo sem virar "cartão".
  // Desenhada dentro de um SVG do tamanho da tela, então nada sobra para fora (sem rolagem na web).
  const markSize = Math.min(width * 1.1, 560);
  const k = markSize / 349;
  const decor = (
    <Svg pointerEvents="none" width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <G opacity={0.08} transform={`translate(${width - markSize * 0.68} ${-width * 0.18}) scale(${k}) rotate(8 174 174)`}>
        {BARS.map((b, i) => (
          <Rect key={i} x={b.x} y={b.y} width={BAR_W} height={BAR_H} fill={colors.onHero} opacity={b.light ? 0.45 : 1} transform={`rotate(${b.r} ${b.x} ${b.y})`} />
        ))}
      </G>
    </Svg>
  );

  // celular deitado: ilustração à esquerda, texto e ações à direita
  if (landscape) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.hero, overflow: 'hidden' }}>
        <StatusBar style={statusStyle} />
        {decor}
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, paddingHorizontal: 24 }}>
          {topBar}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 32 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>{illustration}</View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 18, paddingBottom: 16 }}>
              {copy}
              {options}
              {footer}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.hero, overflow: 'hidden' }}>
      <StatusBar style={statusStyle} />
      {decor}
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flex: 1, width: '100%', maxWidth: maxW, alignSelf: 'center', paddingHorizontal: rs(24), paddingBottom: rs(12) }}>
          {topBar}
          {/* ilustração ocupa o que sobra, sempre abaixo da barra superior */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>{illustration}</View>
          <View style={{ gap: rs(18) }}>
            {copy}
            {options}
            {footer}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
