import { useWindowDimensions } from 'react-native';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Layout responsivo. `rs(n)` escala um valor de design (pensado p/ 390px de largura).
 * - compact:  < 600  (celular)
 * - medium:   600–899 (tablet / celular deitado)
 * - expanded: ≥ 900  (tablet grande / web) → duas colunas
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const bp = width >= 900 ? 'expanded' : width >= 600 ? 'medium' : 'compact';
  // celular deitado: pouca altura, muita largura → layout em duas colunas
  const landscape = width >= 560 && width > height * 1.3 && height < 600;
  const scale = clamp(Math.min(width, 520) / 390, 0.88, 1.2);
  const rs = (n) => Math.round(n * scale);
  const gutter = clamp(Math.round(width * 0.055), 16, 32);
  return {
    width,
    height,
    bp,
    isCompact: bp === 'compact',
    landscape,
    isSplit: bp === 'expanded' || (landscape && width >= 640),
    scale,
    rs,
    gutter,
    contentMax: bp === 'expanded' ? 1120 : 640,
    short: height < 640 || landscape,
  };
}
