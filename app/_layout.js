// app/_layout.js
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../theme/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput } from 'react-native';
import { useEffect } from 'react';

function ThemedStack() {
  const { colors, scheme } = useTheme();

  // desabilita auto-escala de fontes globalmente
  useEffect(() => {
    if (Text?.defaultProps == null) Text.defaultProps = {};
    if (TextInput?.defaultProps == null) TextInput.defaultProps = {};
    Text.defaultProps.allowFontScaling = false;
    TextInput.defaultProps.allowFontScaling = false;
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="add-token" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
