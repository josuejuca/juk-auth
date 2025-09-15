// utils/totp.js
import CryptoJS from 'crypto-js';
import { Base64 } from 'js-base64';

/**
 * Gera TOTP 100% em JS (SHA-1/256/512) via crypto-js.
 * Opções:
 *  - algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512'
 *  - digits: 6 | 7 | 8 ...
 *  - period: segundos (normalmente 30)
 *  - timestampMs: permitir injetar "agora" (em ms) já corrigido pelo offset
 */
export function generateTOTP(secretBase32, {
  algorithm = 'SHA-1',
  digits = 6,
  period = 30,
  timestampMs = Date.now()
} = {}) {
  try {
    const key = new Uint8Array(base32ToBytes(secretBase32));
    // contador = floor( (timestamp/1000) / period )
    const counter = Math.floor((timestampMs / 1000) / period);
    const msg = counterToBytes(counter);

    const mac = hmacBytes(algorithm, key, msg);
    const offset = mac[mac.length - 1] & 0x0f;

    const bin =
      ((mac[offset] & 0x7f) << 24) |
      ((mac[offset + 1] & 0xff) << 16) |
      ((mac[offset + 2] & 0xff) << 8) |
      (mac[offset + 3] & 0xff);

    const otp = (bin % (10 ** digits)).toString().padStart(digits, '0');
    return otp;
  } catch (e) {
    console.error('generateTOTP error:', e);
    return '000000';
  }
}

/**
 * Inicia um ticker que dispara nos "limiares" de período (ex.: cada 30s exatos).
 * - onTick({ code, secondsLeft, periodBoundaryAt, nowMs }): callback por segundo.
 * - syncWithNetwork: se true, tenta obter offset via Date header HTTP (ajuda a eliminar skew do device).
 * - getTimeUrl: URL leve para HEAD/GET (padrão usa generate_204).
 * Retorna uma função `stop()` para cancelar.
 */
export function startTotpTicker({
  secret,
  digits = 6,
  period = 30,
  algorithm = 'SHA-1',
  syncWithNetwork = true,
  getTimeUrl = 'https://www.google.com/generate_204',
  onTick = () => {},
} = {}) {
  let stopped = false;
  let offsetMs = 0; // diferença (servidor - device)

  const computeSecondsLeft = (nowMs) => {
    const msIntoPeriod = (nowMs + offsetMs) % (period * 1000);
    const leftMs = (period * 1000) - msIntoPeriod;
    return Math.floor(leftMs / 1000);
  };

  const computeNextBoundaryDelay = (nowMs) => {
    const msIntoPeriod = (nowMs + offsetMs) % (period * 1000);
    return (period * 1000) - msIntoPeriod; // quanto falta em ms pra próxima borda
  };

  const tickOnce = () => {
    if (stopped) return;

    const nowMs = Date.now();
    const code = generateTOTP(secret, { algorithm, digits, period, timestampMs: nowMs + offsetMs });
    const secondsLeft = computeSecondsLeft(nowMs);
    const periodBoundaryAt = nowMs + computeNextBoundaryDelay(nowMs);

    onTick({ code, secondsLeft, periodBoundaryAt, nowMs: nowMs + offsetMs });
  };

  let perSecondTimer = null;
  let boundaryTimer = null;

  const schedulePerSecond = () => {
    // Atualiza “secondsLeft” a cada segundo, mas recalcula com Date.now() + offsetMs para evitar drift
    perSecondTimer = setInterval(() => {
      if (stopped) return;
      tickOnce();
    }, 1000);
  };

  const scheduleBoundary = () => {
    const nowMs = Date.now();
    const delay = computeNextBoundaryDelay(nowMs);

    // dispara exatamente no limite do período
    boundaryTimer = setTimeout(() => {
      if (stopped) return;
      tickOnce();         // gera o novo código exatamente na virada
      clearInterval(perSecondTimer);
      schedulePerSecond(); // volta ao batimento de 1s para barra/contador
      scheduleBoundary();  // agenda a próxima virada
    }, delay);
  };

  const boot = async () => {
    try {
      if (syncWithNetwork) {
        // tenta obter offset via cabeçalho Date (UTC) para corrigir skew do device
        // Dica: usar GET em vez de HEAD por causa de alguns proxies
        const t0 = Date.now();
        const resp = await fetch(getTimeUrl, { method: 'GET' });
        const t1 = Date.now();
        const dateHeader = resp.headers.get('Date'); // ex: "Mon, 15 Sep 2025 17:12:34 GMT"
        if (dateHeader) {
          const serverMs = new Date(dateHeader).getTime();
          // RTT/2 aproxima o instante que o servidor “valia” (mitiga latência)
          const approxNowServer = serverMs + ((t1 - t0) / 2);
          offsetMs = approxNowServer - t1;
        }
      }
    } catch (e) {
      // se falhar, segue sem offset (usa relógio local)
      console.warn('Time sync failed, using device clock:', e?.message || e);
    } finally {
      // 1) emite imediatamente para preencher UI
      tickOnce();
      // 2) agenda virada exata do período
      scheduleBoundary();
      // 3) mantém contador por segundo
      schedulePerSecond();
    }
  };

  boot();

  return () => {
    stopped = true;
    if (boundaryTimer) clearTimeout(boundaryTimer);
    if (perSecondTimer) clearInterval(perSecondTimer);
  };
}

/* ----------------- Helpers de HMAC/BASE32/COUNTER ------------------- */

function hmacBytes(algorithm, keyBytes, msgBytes) {
  const algo = (algorithm || 'SHA-1').toUpperCase();

  const toWA = (u8) => CryptoJS.lib.WordArray.create(u8);
  let wa;
  if (algo === 'SHA-512') {
    wa = CryptoJS.HmacSHA512(toWA(msgBytes), toWA(keyBytes));
  } else if (algo === 'SHA-256') {
    wa = CryptoJS.HmacSHA256(toWA(msgBytes), toWA(keyBytes));
  } else {
    wa = CryptoJS.HmacSHA1(toWA(msgBytes), toWA(keyBytes)); // default
  }
  return wordArrayToUint8(wa);
}

function wordArrayToUint8(wordArray) {
  const { words, sigBytes } = wordArray;
  const u8 = new Uint8Array(sigBytes);
  let idx = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    u8[idx++] = (w >>> 24) & 0xff;
    if (idx >= sigBytes) break;
    u8[idx++] = (w >>> 16) & 0xff;
    if (idx >= sigBytes) break;
    u8[idx++] = (w >>> 8) & 0xff;
    if (idx >= sigBytes) break;
    u8[idx++] = w & 0xff;
    if (idx >= sigBytes) break;
  }
  return u8;
}

// contador 64-bit big-endian
function counterToBytes(counter) {
  let v = BigInt(counter);
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

// Base32 -> bytes (RFC 4648, ignorando inválidos)
function base32ToBytes(base32) {
  base32 = (base32 || '').replace(/=+$/i, '').toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const out = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i]);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bits += 5;
    if (bits >= 8) {
      out.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  if (bits > 0) out.push((buffer << (8 - bits)) & 0xff);
  return out;
}

export const isValidBase32 = (str) => /^[A-Z2-7]+=*$/i.test(str || '');

// util opcional: segundos restantes (com offset, se quiser reutilizar fora do ticker)
export function getTimeRemaining(period = 30, { offsetMs = 0 } = {}) {
  const now = Date.now();
  const seconds = Math.floor((now + offsetMs) / 1000);
  return period - (seconds % period);
}
