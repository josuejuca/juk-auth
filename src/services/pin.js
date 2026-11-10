import { secure } from './secureStore';
import * as ExpoCrypto from 'expo-crypto';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// O PIN nunca é guardado: só um hash com sal + "pepper" (segredo aleatório por aparelho), tudo no
// armazenamento seguro (Keychain/Keystore).
//
// Hash atual (v3): SHA-256 NATIVO (expo-crypto) encadeado, com sal e pepper. É praticamente instantâneo
// no celular. O PBKDF2 em JS puro que usávamos levava segundos no Hermes (sem JIT) e não acrescentava
// proteção real: um PIN tem poucos dígitos, então o que protege é o pepper no cofre do aparelho e o
// bloqueio por tentativas.
// PINs e códigos antigos (PBKDF2) continuam válidos e são migrados para v3 no primeiro uso.
const KEY = 'juk_pin_v2';
const PEPPER_KEY = 'juk_pin_pepper_v1';
const FAILS_KEY = 'juk_pin_fails';
const ROUNDS = 4;
const LEGACY_ITER = 20000;

const store = secure;

const randomHex = (n) => bytesToHex(ExpoCrypto.getRandomBytes(n));
const randomSalt = () => randomHex(16);

async function getPepper() {
  let p = await store.get(PEPPER_KEY);
  if (!p) {
    p = randomHex(32);
    await store.set(PEPPER_KEY, p);
  }
  return p;
}

/** Hash v3: SHA-256 nativo, encadeado, com sal e pepper. */
async function nativeHash(secret, saltHex) {
  const pepper = await getPepper();
  let h = `${pepper}:${saltHex}:${secret}`;
  for (let i = 0; i < ROUNDS; i++) {
    h = await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, `${h}:${i}`);
  }
  return h;
}

/** Hash antigo (PBKDF2 em JS), só para conferir registros criados antes da v3. */
const legacyHash = (secret, saltHex, iter, dkLen = 32) => bytesToHex(pbkdf2(sha256, secret, hexToBytes(saltHex), { c: iter, dkLen }));

const same = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export async function setPin(pin) {
  const salt = randomSalt();
  await store.set(KEY, JSON.stringify({ v: 3, salt, hash: await nativeHash(pin, salt), length: pin.length }));
  await store.del(FAILS_KEY);
}

export async function clearPin() {
  await store.del(KEY);
  await store.del(FAILS_KEY);
  await clearRecoveryCodes();
  await store.del(PEPPER_KEY); // um PIN novo ganha um pepper novo
}

export async function hasPin() {
  return !!(await store.get(KEY));
}

/** Dados não secretos do registro (ou null se não há PIN). */
export async function pinRecordInfo() {
  const raw = await store.get(KEY);
  if (!raw) return null;
  try { return { length: JSON.parse(raw).length }; } catch { return null; }
}

/** Espera (ms) exigida após falhas seguidas: 5 erros → 30s, depois dobra. */
const waitFor = (fails) => (fails < 5 ? 0 : Math.min(15 * 60_000, 30_000 * 2 ** (fails - 5)));

export async function pinLockRemaining() {
  const raw = await store.get(FAILS_KEY);
  if (!raw) return 0;
  const { fails, last } = JSON.parse(raw);
  return Math.max(0, last + waitFor(fails) - Date.now());
}

/** Retorna { ok, waitMs }. */
export async function verifyPin(pin) {
  const wait = await pinLockRemaining();
  if (wait > 0) return { ok: false, waitMs: wait };
  const raw = await store.get(KEY);
  if (!raw) return { ok: true, waitMs: 0 };
  const rec = JSON.parse(raw);
  const { salt, hash: expected } = rec;
  const isV3 = rec.v === 3;
  const ok = isV3 ? same(await nativeHash(pin, salt), expected) : same(legacyHash(pin, salt, rec.iter || LEGACY_ITER), expected);
  if (ok) {
    await store.del(FAILS_KEY);
    // registro antigo (PBKDF2): migra para o hash rápido
    if (!isV3) {
      try { await setPin(pin); } catch {}
    }
    return { ok: true, waitMs: 0 };
  }
  const prev = JSON.parse((await store.get(FAILS_KEY)) || '{"fails":0}');
  const fails = prev.fails + 1;
  await store.set(FAILS_KEY, JSON.stringify({ fails, last: Date.now() }));
  return { ok: false, waitMs: waitFor(fails) };
}

// ---------------------------------------------------------------------------
// Códigos de recuperação do PIN
// Mostrados uma única vez; só o hash fica guardado. Cada código vale uma vez.
// ---------------------------------------------------------------------------

const RKEY = 'juk_pin_recovery_v1';
const RFAILS_KEY = 'juk_pin_recovery_fails';
const RITER = 2000; // só para códigos antigos (PBKDF2)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 símbolos, sem 0/O/1/I
export const RECOVERY_COUNT = 8;
const CODE_LEN = 10;

const legacyRhash = (code, saltHex) => legacyHash(code, saltHex, RITER, 16);

export const normalizeRecoveryCode = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const formatRecoveryCode = (c) => `${c.slice(0, 5)}-${c.slice(5)}`;

function randomCode() {
  const bytes = ExpoCrypto.getRandomBytes(CODE_LEN);
  let out = '';
  for (const b of bytes) out += ALPHABET[b & 31]; // 32 símbolos: sem viés de módulo
  return out;
}

/** Gera um conjunto novo (invalida o anterior). Retorna os códigos em texto, para mostrar uma vez. */
export async function generateRecoveryCodes() {
  const codes = Array.from({ length: RECOVERY_COUNT }, randomCode);
  const entries = [];
  for (const c of codes) {
    const salt = randomHex(8);
    entries.push({ v: 3, salt, hash: await nativeHash(c, salt), used: false });
  }
  await store.set(RKEY, JSON.stringify(entries));
  await store.del(RFAILS_KEY);
  return codes.map(formatRecoveryCode);
}

export async function clearRecoveryCodes() {
  await store.del(RKEY);
  await store.del(RFAILS_KEY);
}

export async function recoveryCodesRemaining() {
  const raw = await store.get(RKEY);
  if (!raw) return 0;
  return JSON.parse(raw).filter((e) => !e.used).length;
}

export async function recoveryLockRemaining() {
  const raw = await store.get(RFAILS_KEY);
  if (!raw) return 0;
  const { fails, last } = JSON.parse(raw);
  return Math.max(0, last + waitFor(fails) - Date.now());
}

/** Confere e consome um código. Retorna { ok, waitMs, noCodes }. */
export async function redeemRecoveryCode(input) {
  const wait = await recoveryLockRemaining();
  if (wait > 0) return { ok: false, waitMs: wait };
  const raw = await store.get(RKEY);
  if (!raw) return { ok: false, waitMs: 0, noCodes: true };
  const code = normalizeRecoveryCode(input);
  const entries = JSON.parse(raw);
  let hit = -1;
  if (code.length === CODE_LEN) {
    for (let i = 0; i < entries.length && hit < 0; i++) {
      const e = entries[i];
      if (e.used) continue;
      const h = e.v === 3 ? await nativeHash(code, e.salt) : legacyRhash(code, e.salt);
      if (same(h, e.hash)) hit = i;
    }
  }
  if (hit >= 0) {
    entries[hit].used = true;
    await store.set(RKEY, JSON.stringify(entries));
    await store.del(RFAILS_KEY);
    return { ok: true, waitMs: 0 };
  }
  const prev = JSON.parse((await store.get(RFAILS_KEY)) || '{"fails":0}');
  const fails = prev.fails + 1;
  await store.set(RFAILS_KEY, JSON.stringify({ fails, last: Date.now() }));
  return { ok: false, waitMs: waitFor(fails) };
}
