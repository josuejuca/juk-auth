import { Base64 } from 'js-base64';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ---- limites e validação (entrada de QR codes e links não é confiável) ----
export const LIMITS = { input: 50_000, accounts: 200, text: 128, secretChars: 512, secretBytes: 256 };
const ALGOS = new Set(['SHA-1', 'SHA-256', 'SHA-512']);

/** Remove caracteres de controle e limita o tamanho de textos vindos de fora. */
export const cleanText = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, LIMITS.text);

/** Valida/normaliza uma conta vinda de QR/link; lança Error com mensagem amigável se algo for inválido. */
export function validateAccount(a) {
  const secretKey = normalizeSecret(a.secretKey);
  if (secretKey.length < 8 || secretKey.length > LIMITS.secretChars || !/^[A-Z2-7]+$/.test(secretKey)) throw new Error('Chave secreta inválida.');
  const algorithm = normalizeAlgorithm(a.algorithm);
  if (!ALGOS.has(algorithm)) throw new Error('Algoritmo não suportado.');
  const digits = Number(a.digits ?? 6);
  if (![6, 7, 8].includes(digits)) throw new Error('Número de dígitos não suportado.');
  const period = Number(a.period ?? 30);
  if (!Number.isInteger(period) || period < 10 || period > 120) throw new Error('Período não suportado.');
  const accountName = cleanText(a.accountName);
  const issuer = cleanText(a.issuer);
  return { type: 'time-based', issuer, accountName: accountName || issuer || 'Conta', secretKey, algorithm, digits, period };
}

export function bytesToBase32(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function normalizeSecret(str) {
  return (str || '').replace(/[\s=-]+/g, '').toUpperCase();
}

export function normalizeAlgorithm(algo) {
  const a = String(algo || 'SHA-1').toUpperCase().replace('-', '');
  if (a === 'SHA1') return 'SHA-1';
  if (a === 'SHA256') return 'SHA-256';
  if (a === 'SHA512') return 'SHA-512';
  return `UNSUPPORTED:${a.slice(0, 12)}`; // reprovado por validateAccount
}

export function detectCodeType(text) {
  const t = (text || '').trim();
  if (t.startsWith('otpauth-migration://')) return 'migration';
  if (t.startsWith('otpauth://')) return 'otpauth';
  return 'unknown';
}

/** Lê otpauth://totp/Issuer:conta?secret=...&issuer=... (HOTP não é suportado). */
export function parseOtpauthUri(uri) {
  const text = String(uri || '').trim();
  if (text.length > LIMITS.input) throw new Error('QR code grande demais.');
  const match = /^otpauth:\/\/(totp|hotp)\/([^?]*)\??(.*)$/i.exec(text);
  if (!match) throw new Error('QR code não é um otpauth válido.');
  const [, kind, rawLabel, rawQuery] = match;
  if (kind.toLowerCase() === 'hotp') throw new Error('Contas baseadas em contador (HOTP) ainda não são suportadas.');

  const params = {};
  for (const pair of rawQuery.split('&')) {
    if (!pair) continue;
    const [k, ...v] = pair.split('=');
    try {
      params[decodeURIComponent(k)] = decodeURIComponent(v.join('=').replace(/\+/g, ' '));
    } catch {
      throw new Error('QR code malformado.');
    }
  }

  let label;
  try { label = decodeURIComponent(rawLabel); } catch { throw new Error('QR code malformado.'); }
  const sep = label.indexOf(':');
  const labelIssuer = sep >= 0 ? label.slice(0, sep) : '';
  const accountName = sep >= 0 ? label.slice(sep + 1) : label;

  return validateAccount({
    issuer: params.issuer || labelIssuer,
    accountName,
    secretKey: params.secret,
    algorithm: params.algorithm,
    digits: params.digits,
    period: params.period,
  });
}

// ---- otpauth-migration (Google Authenticator export, protobuf) ----

function readVarint(buf, pos) {
  let result = 0;
  let shift = 0;
  for (let n = 0; n < 10; n++) {
    if (pos >= buf.length) throw new Error('Dados de migração corrompidos.');
    const byte = buf[pos++];
    result += (byte & 0x7f) * 2 ** shift;
    if (!(byte & 0x80)) return [result, pos];
    shift += 7;
  }
  throw new Error('Dados de migração corrompidos.');
}

function* readFields(buf) {
  let pos = 0;
  while (pos < buf.length) {
    let tag;
    [tag, pos] = readVarint(buf, pos);
    const field = Math.floor(tag / 8);
    const wire = tag & 7;
    if (wire === 0) {
      let v;
      [v, pos] = readVarint(buf, pos);
      yield { field, wire, value: v };
    } else if (wire === 2) {
      let len;
      [len, pos] = readVarint(buf, pos);
      if (len > buf.length - pos) throw new Error('Dados de migração corrompidos.');
      yield { field, wire, value: buf.subarray(pos, pos + len) };
      pos += len;
    } else if (wire === 1) {
      pos += 8;
      if (pos > buf.length) throw new Error('Dados de migração corrompidos.');
    } else if (wire === 5) {
      pos += 4;
      if (pos > buf.length) throw new Error('Dados de migração corrompidos.');
    } else {
      throw new Error('Dados de migração corrompidos.');
    }
  }
}

const MIGRATION_ALGO = { 1: 'SHA-1', 2: 'SHA-1', 3: 'SHA-256', 4: 'SHA-512' };
const MIGRATION_DIGITS = { 1: 6, 2: 8 };

export function parseMigrationUri(uri) {
  const text = String(uri || '');
  if (text.length > LIMITS.input) throw new Error('QR code grande demais.');
  const m = /[?&]data=([^&]+)/.exec(text);
  if (!m) throw new Error('Código de migração inválido.');
  let buf;
  try {
    buf = Base64.toUint8Array(decodeURIComponent(m[1]).replace(/ /g, '+'));
  } catch {
    throw new Error('Código de migração inválido.');
  }
  const decode = (u8) => { try { return decodeURIComponent(escape(Array.from(u8, (c) => String.fromCharCode(c)).join(''))); } catch { return ''; } };

  const accounts = [];
  for (const f of readFields(buf)) {
    if (f.field !== 1 || f.wire !== 2) continue;
    if (accounts.length >= LIMITS.accounts) throw new Error('Contas demais neste código.');
    const acc = { algo: 1, digits: 1, type: 2 };
    for (const p of readFields(f.value)) {
      if (p.field === 1 && p.wire === 2) acc.secret = p.value;
      else if (p.field === 2 && p.wire === 2) acc.name = decode(p.value);
      else if (p.field === 3 && p.wire === 2) acc.issuer = decode(p.value);
      else if (p.field === 4 && p.wire === 0) acc.algo = p.value;
      else if (p.field === 5 && p.wire === 0) acc.digits = p.value;
      else if (p.field === 6 && p.wire === 0) acc.type = p.value;
    }
    if (!acc.secret || acc.secret.length > LIMITS.secretBytes) continue;
    if (acc.type === 1) continue; // HOTP: não suportado, ignora
    try {
      accounts.push(validateAccount({
        issuer: acc.issuer,
        accountName: (acc.name || '').replace(/^[^:]+:\s*/, ''),
        secretKey: bytesToBase32(acc.secret),
        algorithm: ({ 1: 'SHA-1', 2: 'SHA-1', 3: 'SHA-256', 4: 'SHA-512' })[acc.algo] || 'SHA-1',
        digits: acc.digits === 2 ? 8 : 6,
        period: 30,
      }));
    } catch {
      /* conta inválida: ignora e segue */
    }
  }
  return accounts;
}

/** Aceita otpauth:// ou otpauth-migration:// e devolve sempre uma lista de contas. */
export function parseAnyCode(text) {
  if (String(text || '').length > LIMITS.input) throw new Error('QR code grande demais.');
  const kind = detectCodeType(text);
  if (kind === 'otpauth') return [parseOtpauthUri(text)];
  if (kind === 'migration') return parseMigrationUri(text);
  throw new Error('Esse QR code não é de autenticação em dois fatores.');
}

// ---- exportação ----

export function base32ToBytes(base32) {
  const clean = normalizeSecret(base32);
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

const utf8 = (str) => Array.from(unescape(encodeURIComponent(str)), (c) => c.charCodeAt(0));

/** otpauth://totp/Issuer:conta?secret=…&issuer=… */
export function buildOtpauthUri(t) {
  const issuer = (t.issuer || '').trim();
  const label = encodeURIComponent(issuer ? `${issuer}:${t.accountName}` : t.accountName);
  const kind = t.type === 'counter-based' ? 'hotp' : 'totp';
  const params = [`secret=${normalizeSecret(t.secretKey)}`];
  if (issuer) params.push(`issuer=${encodeURIComponent(issuer)}`);
  const algo = normalizeAlgorithm(t.algorithm);
  if (algo !== 'SHA-1') params.push(`algorithm=${algo.replace('-', '')}`);
  if ((Number(t.digits) || 6) !== 6) params.push(`digits=${Number(t.digits)}`);
  if (kind === 'totp' && (Number(t.period) || 30) !== 30) params.push(`period=${Number(t.period)}`);
  if (kind === 'hotp') params.push('counter=0');
  return `otpauth://${kind}/${label}?${params.join('&')}`;
}

function varint(n) {
  const out = [];
  let v = n;
  while (v > 127) { out.push((v % 128) | 0x80); v = Math.floor(v / 128); }
  out.push(v);
  return out;
}
const fieldBytes = (field, bytes) => [...varint(field * 8 + 2), ...varint(bytes.length), ...bytes];
const fieldVarint = (field, n) => [...varint(field * 8), ...varint(n)];

/** Gera links otpauth-migration:// (formato do Google Authenticator), em lotes. */
export function buildMigrationUris(tokens, batchSize = 6) {
  const batches = [];
  for (let i = 0; i < tokens.length; i += batchSize) batches.push(tokens.slice(i, i + batchSize));
  const batchId = Math.floor(Math.random() * 2 ** 31);
  return batches.map((batch, index) => {
    let msg = [];
    for (const t of batch) {
      const algo = { 'SHA-1': 1, 'SHA-256': 3, 'SHA-512': 4 }[normalizeAlgorithm(t.algorithm)] || 1;
      const digits = Number(t.digits) === 8 ? 2 : 1;
      const name = t.issuer ? `${t.issuer}:${t.accountName}` : t.accountName;
      const otp = [
        ...fieldBytes(1, Array.from(base32ToBytes(t.secretKey))),
        ...fieldBytes(2, utf8(name)),
        ...fieldBytes(3, utf8(t.issuer || '')),
        ...fieldVarint(4, algo),
        ...fieldVarint(5, digits),
        ...fieldVarint(6, t.type === 'counter-based' ? 1 : 2),
      ];
      msg = msg.concat(fieldBytes(1, otp));
    }
    msg = msg.concat(fieldVarint(2, 1), fieldVarint(3, batches.length), fieldVarint(4, index), fieldVarint(5, batchId));
    return `otpauth-migration://offline?data=${encodeURIComponent(Base64.fromUint8Array(Uint8Array.from(msg)))}`;
  });
}
