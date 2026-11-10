import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cofre do aparelho (Keychain no iOS, Keystore no Android).
 * - Só neste aparelho: não entra em backup do iCloud/Google nem migra para outro aparelho.
 * - Na web não existe cofre: cai no AsyncStorage (a web não é um alvo de produção).
 */
const OPTS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const isWeb = Platform.OS === 'web';

export const secure = {
  get: (k) => (isWeb ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k, OPTS)),
  set: (k, v) => (isWeb ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v, OPTS)),
  del: (k) => (isWeb ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k, OPTS)),
};
