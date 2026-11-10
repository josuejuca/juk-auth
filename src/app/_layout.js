import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_500Medium, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';
import { ThemeProvider, useTheme } from '../theme';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { ToastProvider, DialogProvider } from '../components/ui';
import LockGate from '../components/lock/LockGate';
import AnimatedSplash from '../components/brand/AnimatedSplash';
import PrivacyGuard from '../components/PrivacyGuard';

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStack() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}

function Root() {
  const { ready } = useSettings();
  const [splashDone, setSplashDone] = useState(false);
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });
  const loaded = fontsLoaded && ready;

  // o splash nativo só cobre o início; o animado assume logo em seguida
  useEffect(() => { SplashScreen.hideAsync().catch(() => {}); }, []);

  return (
    <>
      {loaded ? (
        <LockGate>
          <ToastProvider>
            <DialogProvider>
              <ThemedStack />
            </DialogProvider>
          </ToastProvider>
        </LockGate>
      ) : null}
      {loaded ? <PrivacyGuard /> : null}
      {!splashDone ? <AnimatedSplash ready={loaded} onDone={() => setSplashDone(true)} /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Root />
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
