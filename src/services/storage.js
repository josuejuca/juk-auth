import AsyncStorage from '@react-native-async-storage/async-storage';
import { secure } from './secureStore';

/**
 * Contas:
 *  - metadados (nome, serviço, ícone, algoritmo…) no AsyncStorage — NÃO são segredos;
 *  - a chave secreta de cada conta no cofre do aparelho, uma entrada por conta.
 * Contas gravadas por versões antigas (chave em texto puro no AsyncStorage) são migradas
 * automaticamente na primeira leitura.
 */
const TOKENS_KEY = 'juk_authenticator_tokens';
const LEGACY_BACKUP_KEY = 'juk_authenticator_backup'; // cópia em texto puro de versões antigas
const secretKeyOf = (id) => `juk_s_${String(id).replace(/[^A-Za-z0-9._-]/g, '_')}`;

export const newTokenId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function readMeta() {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((t) => t && t.id) : [];
  } catch {
    return [];
  }
}

const writeMeta = (list) => AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(list));

/** Move chaves em texto puro para o cofre e apaga a cópia antiga. Idempotente. */
async function migrateLegacy(list) {
  if (!list.some((t) => typeof t.secretKey === 'string' && t.secretKey)) {
    await AsyncStorage.removeItem(LEGACY_BACKUP_KEY).catch(() => {});
    return list;
  }
  const clean = [];
  for (const t of list) {
    const { secretKey, code, ...meta } = t; // `code` (código antigo em cache) também sai
    if (secretKey) await secure.set(secretKeyOf(t.id), secretKey);
    clean.push(meta);
  }
  await writeMeta(clean);
  await AsyncStorage.removeItem(LEGACY_BACKUP_KEY).catch(() => {});
  return clean;
}

/** Lista as contas COM a chave (só em memória). Contas sem chave no cofre são ignoradas. */
export const getTokens = async () => {
  try {
    const meta = await migrateLegacy(await readMeta());
    const full = await Promise.all(
      meta.map(async (m) => {
        const secretKey = await secure.get(secretKeyOf(m.id)).catch(() => null);
        return secretKey ? { ...m, secretKey } : null;
      })
    );
    return full.filter(Boolean);
  } catch (error) {
    console.error('Error getting tokens');
    return [];
  }
};

export const saveToken = async (token) => {
  try {
    const { secretKey, ...meta } = token;
    if (!secretKey) return false;
    await secure.set(secretKeyOf(token.id), secretKey);
    const list = await readMeta();
    const i = list.findIndex((t) => t.id === token.id);
    if (i >= 0) list[i] = meta;
    else list.push(meta);
    await writeMeta(list);
    return true;
  } catch {
    console.error('Error saving token');
    return false;
  }
};

/** Atualiza só metadados (nome, ícone…). A chave nunca passa por aqui. */
export const updateToken = async (id, patch) => {
  try {
    const { secretKey, ...safe } = patch || {};
    const list = await readMeta();
    await writeMeta(list.map((t) => (t.id === id ? { ...t, ...safe } : t)));
    return true;
  } catch {
    console.error('Error updating token');
    return false;
  }
};

export const deleteToken = async (id) => {
  try {
    await secure.del(secretKeyOf(id));
    const list = await readMeta();
    await writeMeta(list.filter((t) => t.id !== id));
    return true;
  } catch {
    console.error('Error deleting token');
    return false;
  }
};
