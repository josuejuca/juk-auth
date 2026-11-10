import { saveToken, newTokenId } from './storage';
import { detectServiceKey } from './serviceDetect';
import { cleanText, validateAccount } from './otpauth';

/** Salva contas já parseadas (QR, migração ou formulário). Retorna quantas foram salvas. */
export async function importAccounts(accounts) {
  let saved = 0;
  for (const raw of accounts) {
    let acc;
    try {
      acc = validateAccount(raw); // defesa em profundidade: nada entra sem validação
    } catch {
      continue;
    }
    const ok = await saveToken({
      id: newTokenId(),
      type: 'time-based',
      issuer: acc.issuer,
      name: raw.name ? cleanText(raw.name) || undefined : undefined,
      iconKey: raw.iconKey || detectServiceKey(acc.issuer, acc.accountName) || undefined,
      accountName: acc.accountName,
      secretKey: acc.secretKey,
      algorithm: acc.algorithm,
      digits: acc.digits,
      period: acc.period,
      timestamp: Date.now(),
    });
    if (ok) saved += 1;
  }
  return saved;
}
