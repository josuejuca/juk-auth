import { generateTOTP } from '../services/totp';

export const formatCode = (code) => {
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
};

/** Calcula código e tempo restante de um token para o instante `now`. */
export function totpFor(token, now) {
  const period = Number(token.period) || 30;
  const digits = Number(token.digits) || 6;
  const secondsLeft = period - (Math.floor(now / 1000) % period);
  // chave inválida → traços, nunca um código falso
  const code = generateTOTP(token.secretKey, { algorithm: token.algorithm || 'SHA-1', digits, period, timestampMs: now }) || '-'.repeat(digits);
  return { code, secondsLeft, period, fraction: secondsLeft / period };
}
