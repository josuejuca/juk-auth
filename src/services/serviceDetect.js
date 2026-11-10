import { SERVICE_ICONS } from '../data/serviceIcons';

// apelidos / nomes alternativos → slug do ícone
const ALIASES = {
  // Google
  gmail: 'google', googlecloud: 'google', gcp: 'google', googledrive: 'google', gdrive: 'google', googlemail: 'google',
  // Microsoft
  outlook: 'microsoftoutlook', hotmail: 'microsoftoutlook', live: 'microsoft', msn: 'microsoft', office: 'microsoft', office365: 'microsoft', o365: 'microsoft', m365: 'microsoft', microsoft365: 'microsoft',
  azure: 'microsoftazure', teams: 'microsoftteams', onedrive: 'microsoftonedrive', edge: 'microsoftedge',
  // Amazon
  aws: 'amazonwebservices', amazonaws: 'amazonwebservices', primevideo: 'primevideo', prime: 'primevideo',
  // redes e mensageiros
  twitter: 'x', fb: 'facebook', ig: 'instagram', wa: 'whatsapp', fbmessenger: 'messenger', insta: 'instagram', tg: 'telegram',
  // jogos
  psn: 'playstation', sony: 'playstation', ps: 'playstation', epic: 'epicgames', battlenet: 'battledotnet', blizzard: 'battledotnet', riot: 'riotgames', gog: 'gogdotcom', rockstar: 'rockstargames', ubi: 'ubisoft', electronicarts: 'ea',
  // dev / nuvem
  gh: 'github', bw: 'bitwarden', op: '1password', cf: 'cloudflare', 'digital ocean': 'digitalocean', ovhcloud: 'ovh', linode: 'akamai', fly: 'flydotio', jb: 'jetbrains', pypiorg: 'pypi', npmjs: 'npm', docker: 'docker', dockerhub: 'docker',
  // pagamentos / bancos
  mp: 'mercadopago', mercadopago: 'mercadopago', nu: 'nubank', transferwise: 'wise', cryptocom: 'cryptodotcom', trustwallet: 'metamask',
  // outros
  protonme: 'proton', pm: 'protonmail', booking: 'bookingdotcom', disney: 'disneyplus', monday: 'mondaydotcom', unifi: 'ubiquiti', ubiquiti: 'ubiquiti', gpt: 'openai', chatgpt: 'openai', claude: 'anthropic',
};

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const squash = (s) => norm(s).replace(/[^a-z0-9]/g, '');

// chaves de busca: slug, título e apelidos → slug. (Chaves curtas só casam como palavra inteira.)
const KEYS = (() => {
  const m = new Map();
  for (const [slug, v] of Object.entries(SERVICE_ICONS)) {
    m.set(slug, slug);
    const t = squash(v.title);
    if (t) m.set(t, slug);
  }
  for (const [alias, slug] of Object.entries(ALIASES)) if (SERVICE_ICONS[slug]) m.set(squash(alias), slug);
  return [...m.entries()].sort((a, b) => b[0].length - a[0].length); // mais específico primeiro
})();

function matchOne(text) {
  const hay = norm(text);
  if (!hay.trim()) return null;
  const tokens = new Set(hay.split(/[^a-z0-9]+/).filter(Boolean)); // palavras (inclui partes de domínios)
  const compact = squash(hay);
  for (const [key, slug] of KEYS) {
    if (tokens.has(key)) return slug; // palavra inteira
    if (key.length >= 5 && compact.includes(key)) return slug; // ex.: "mygithub"
  }
  return null;
}

/**
 * Descobre o ícone do serviço. Tenta o emissor primeiro; o nome da conta só entra se não for
 * um e-mail (o domínio de um e-mail, como gmail.com, não diz qual é o serviço).
 */
export function detectServiceKey(issuer, accountName) {
  const fromIssuer = matchOne(issuer);
  if (fromIssuer) return fromIssuer;
  if (accountName && !String(accountName).includes('@')) return matchOne(accountName);
  return null;
}

export const listServices = () =>
  Object.entries(SERVICE_ICONS)
    .map(([key, v]) => ({ key, title: v.title, hex: v.hex }))
    .sort((a, b) => a.title.localeCompare(b.title));

export function maskEmail(value) {
  const v = value || '';
  const at = v.indexOf('@');
  if (at < 0) return v.length > 4 ? v.slice(0, 2) + '•'.repeat(Math.min(6, v.length - 2)) : v;
  const user = v.slice(0, at);
  const keep = Math.min(3, Math.max(1, Math.floor(user.length / 3)));
  return `${user.slice(0, keep)}${'•'.repeat(Math.max(3, user.length - keep))}${v.slice(at)}`;
}

/** Nome exibido: o que o usuário definiu → serviço → conta. */
export const tokenTitle = (t) => (t.name || t.issuer || t.accountName || 'Conta').trim();
