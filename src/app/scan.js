import React, { useCallback, useRef, useState } from 'react';
import { goBack } from '../utils/navigation';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flashlight, FlashlightOff, Keyboard, X, Camera as CameraIcon } from 'lucide-react-native';
import { Text, Button, IconButton, useToast } from '../components/ui';
import ScannerFrame from '../components/scan/ScannerFrame';
import { useTheme } from '../theme';
import { parseAnyCode } from '../services/otpauth';
import { importAccounts } from '../services/accounts';
import { useHaptics } from '../hooks/useHaptics';

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);

  const onScanned = useCallback(async ({ data }) => {
    if (locked.current) return;
    locked.current = true;
    try {
      const accounts = parseAnyCode(data);
      const saved = await importAccounts(accounts);
      if (!saved) throw new Error('Não foi possível salvar a conta.');
      haptics.success();
      toast(saved === 1 ? 'Conta adicionada' : `${saved} contas importadas`);
      goBack(router);
    } catch (e) {
      haptics.error();
      setError(e?.message || 'QR code inválido.');
      setTimeout(() => { locked.current = false; setError(''); }, 2200);
    }
  }, [router, toast, haptics]);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    const blocked = permission.canAskAgain === false;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
        <IconButton icon={X} label="Fechar" onPress={() => goBack(router)} style={{ marginLeft: -8 }} />
        <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <CameraIcon size={36} color={colors.primary} strokeWidth={1.7} />
          <Text variant="title">Acesso à câmera</Text>
          <Text tone="textSecondary">
            Usamos a câmera só para ler o QR code de configuração. Nada é gravado nem enviado.
          </Text>
          <Button
            title={blocked ? 'Abrir ajustes' : 'Permitir câmera'}
            onPress={blocked ? () => Linking.openSettings() : requestPermission}
            style={{ marginTop: 16 }}
          />
          <Button title="Inserir chave manualmente" variant="ghost" onPress={() => router.replace('/add-token')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />

      <SafeAreaView style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 }}>
          <IconButton icon={X} label="Fechar" color="#fff" filled style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => goBack(router)} />
          <IconButton
            icon={torch ? FlashlightOff : Flashlight}
            label="Lanterna"
            color="#fff"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onPress={() => setTorch((t) => !t)}
          />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <ScannerFrame color={error ? colors.danger : '#fff'} />
          <Text style={{ color: '#fff', marginTop: 24, textAlign: 'center', paddingHorizontal: 40 }}>
            {error || 'Aponte para o QR code do serviço'}
          </Text>
        </View>

        <View style={{ padding: 20 }}>
          <Button title="Inserir chave manualmente" icon={Keyboard} variant="ghost" color="#fff" onPress={() => router.replace('/add-token')} style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderColor: 'rgba(255,255,255,0.25)' }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
