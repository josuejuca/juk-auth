// Valida o contraste de todas as paletas. Uso: node scripts/check-palettes.mjs
import { ACCENTS, getPalette } from '../src/theme/tokens.js';
import { contrast } from '../src/theme/color.js';

let bad = 0;
for (const a of ACCENTS) for (const scheme of ['light', 'dark']) {
  const c = getPalette(scheme, a.id);
  const pairs = [
    ['text/background', c.text, c.background, 7], ['text/sheet', c.text, c.sheet, 7], ['textSecondary/sheet', c.textSecondary, c.sheet, 4.5],
    ['textMuted/sheet', c.textMuted, c.sheet, 4.5], ['textMuted/surface', c.textMuted, c.surface, 4.5], ['textSecondary/surface', c.textSecondary, c.surface, 4.5], ['textSecondary/background', c.textSecondary, c.background, 4.5], ['primary/sheet', c.primary, c.sheet, 4.5], ['onPrimary/primary', c.onPrimary, c.primary, 4.5],
    ['onHero/hero', c.onHero, c.hero, 4.5], ['primary/surface', c.primary, c.surface, 4.5], ['text/primarySoft', c.text, c.primarySoft, 7],
    ['danger/sheet', c.danger, c.sheet, 4.5],
  ];
  for (const [n, f, b, min] of pairs) {
    const r = contrast(f, b);
    if (r < min) { bad++; console.log(`FALHA ${a.id}/${scheme} ${n}: ${r.toFixed(2)} < ${min}`); }
  }
}
console.log(bad ? `${bad} falhas` : 'todas as paletas passam');
process.exit(bad ? 1 : 0);
