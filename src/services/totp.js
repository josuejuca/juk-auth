// TOTP (RFC 6238) em JS puro com @noble/hashes (auditada, sem dependências).
import { hmac } from '@noble/hashes/hmac.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';

const HASHES = { 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-512': sha512 };

export const MIN_DIGITS = 6;
export const MAX_DIGITS = 8;
export const MIN_PERIOD = 10;
export const MAX_PERIOD = 120;

/** Base32 (RFC 4648). Bits sobrando no fim são descartados (não geram byte extra). */
export function base32ToBytes(input) {
  const clean = (input || '').replace(/=+$/, '').toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const out = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) throw new Error('Chave inválida (Base32).');
    buffer = ((buffer << 5) | val) & 0xfff; // só os bits que ainda importam
    bits += 5;
    if (bits >= 8) {
      out.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

export const isValidBase32 = (str) => /^[A-Z2-7]+=*$/i.test(str || '') && (str || '').length <= 512;

function counterToBytes(counter) {
  let v = BigInt(counter);
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

const clampInt = (v, min, max, fallback) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/**
 * Gera o código. Parâmetros são validados/limitados (dígitos 6–8, período 10–120 s, algoritmo
 * conhecido). Retorna null se a chave for inválida (nunca um código falso).
 */
export function generateTOTP(secretBase32, { algorithm = 'SHA-1', digits = 6, period = 30, timestampMs = Date.now() } = {}) {
  try {
    const hash = HASHES[algorithm] || HASHES['SHA-1'];
    const d = clampInt(digits, MIN_DIGITS, MAX_DIGITS, 6);
    const p = clampInt(period, MIN_PERIOD, MAX_PERIOD, 30);
    const key = base32ToBytes(secretBase32);
    if (!key.length) return null;
    const counter = Math.floor(timestampMs / 1000 / p);
    const mac = hmac(hash, key, counterToBytes(counter));
    const offset = mac[mac.length - 1] & 0x0f;
    const bin = ((mac[offset] & 0x7f) << 24) | ((mac[offset + 1] & 0xff) << 16) | ((mac[offset + 2] & 0xff) << 8) | (mac[offset + 3] & 0xff);
    return (bin % 10 ** d).toString().padStart(d, '0');
  } catch {
    return null;
  }
}
