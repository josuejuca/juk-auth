import * as Clipboard from 'expo-clipboard';

let timer = null;

/**
 * Copia algo sensível e apaga da área de transferência depois de `ttlMs`
 * (outros apps podem ler a área de transferência). Uma cópia nova cancela o apagamento anterior.
 */
export async function copySensitive(text, ttlMs = 30_000) {
  await Clipboard.setStringAsync(text);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    Clipboard.setStringAsync('').catch(() => {});
    timer = null;
  }, ttlMs);
}
