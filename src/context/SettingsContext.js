import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secure } from '../services/secureStore';
import { pinRecordInfo } from '../services/pin';

// Preferências comuns (não sensíveis) ficam no AsyncStorage.
const SETTINGS_KEY = 'appSettings';
// Preferências de SEGURANÇA ficam no cofre do aparelho: quem editar o armazenamento comum
// não consegue desligar o PIN/biometria nem liberar capturas de tela.
const SECURITY_KEY = 'juk_security_v1';

const DEFAULTS = {
  hapticsEnabled: true,
  onboarded: false,
  biometricEnabled: false,
  pinEnabled: false,
  pinLength: 6,
  allowScreenshots: false,
};
const SECURITY_FIELDS = ['biometricEnabled', 'pinEnabled', 'pinLength', 'allowScreenshots'];
const SettingsContext = createContext(null);

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
const safeParse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  // transitório: após recuperar o acesso com um código, o usuário precisa criar um PIN novo
  const [needsNewPin, setNeedsNewPin] = useState(false);
  const latest = useRef(DEFAULTS);

  useEffect(() => {
    (async () => {
      const common = safeParse(await AsyncStorage.getItem(SETTINGS_KEY).catch(() => null)) || {};
      let sec = safeParse(await secure.get(SECURITY_KEY).catch(() => null));

      // migração: versões antigas guardavam tudo no AsyncStorage
      if (!sec) {
        sec = {
          biometricEnabled: common.biometricEnabled === true,
          pinEnabled: common.pinEnabled === true,
          pinLength: common.pinLength === 4 ? 4 : 6,
        };
      }

      // o registro do PIN no cofre é a fonte da verdade (o sinalizador sozinho não basta)
      const rec = await pinRecordInfo().catch(() => null);
      const pinEnabled = !!rec; // sem registro → sem PIN (autocorreção); com registro → sempre ativo
      const pinLength = rec?.length === 4 ? 4 : 6;

      const loaded = {
        hapticsEnabled: common.hapticsEnabled ?? common.hapticFeedbackEnabled ?? true,
        onboarded: common.onboarded === true,
        biometricEnabled: sec.biometricEnabled === true,
        pinEnabled,
        pinLength,
        allowScreenshots: sec.allowScreenshots === true,
      };
      latest.current = loaded;
      setSettings(loaded);
      // regrava já separado (e remove os campos de segurança do armazenamento comum)
      try {
        await secure.set(SECURITY_KEY, JSON.stringify(pick(loaded, SECURITY_FIELDS)));
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ hapticsEnabled: loaded.hapticsEnabled, onboarded: loaded.onboarded }));
      } catch {}
      setReady(true);
    })();
  }, []);

  const update = useCallback(async (patch) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ hapticsEnabled: next.hapticsEnabled, onboarded: next.onboarded }));
      await secure.set(SECURITY_KEY, JSON.stringify(pick(next, SECURITY_FIELDS)));
    } catch {}
  }, []);

  const value = useMemo(() => ({ ...settings, ready, update, needsNewPin, setNeedsNewPin }), [settings, ready, update, needsNewPin]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de <SettingsProvider>');
  return ctx;
}
