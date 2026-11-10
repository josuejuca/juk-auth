// Utilitários de cor com validação. Nada aqui lança erro: entrada inválida cai no `fallback`.

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isHex = (v) => typeof v === 'string' && HEX.test(v.trim());

export function normalizeHex(v, fallback = '#808080') {
  if (!isHex(v)) return fallback;
  let h = v.trim().replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return `#${h}`;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
export const rgbToHex = ({ r, g, b }) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }) {
  const S = Math.max(0, Math.min(1, s)), L = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex({ r: A.r + (B.r - A.r) * k, g: A.g + (B.g - A.g) * k, b: A.b + (B.b - A.b) * k });
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Razão de contraste WCAG (1–21). */
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Branco ou quase-preto, o que tiver mais contraste sobre `bg`. */
export function bestOn(bg) {
  return contrast(bg, '#FFFFFF') >= contrast(bg, '#0B0B0D') ? '#FFFFFF' : '#0B0B0D';
}

/** Ajusta a luminosidade de `fg` (mantendo o matiz) até atingir `min` de contraste sobre `bg`. */
export function ensureContrast(fg, bg, min = 4.5) {
  const base = normalizeHex(fg);
  if (contrast(base, bg) >= min) return base;
  const hsl = hexToHsl(base);
  const darken = luminance(bg) > 0.5;
  for (let i = 1; i <= 40; i++) {
    const l = darken ? hsl.l - i * 0.02 : hsl.l + i * 0.02;
    const cand = hslToHex({ ...hsl, l });
    if (contrast(cand, bg) >= min) return cand;
    if (l <= 0 || l >= 1) break;
  }
  return darken ? '#000000' : '#FFFFFF';
}

export const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
};
