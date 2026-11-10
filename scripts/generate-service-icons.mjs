// Gera src/data/serviceIcons.js: logos (só o contorno SVG) dos serviços mais comuns com 2FA.
// Fonte: simple-icons (CC0 1.0). Marcas que saíram das versões novas vêm de versões antigas do pacote,
// baixadas para uma pasta temporária (npm pack) — nada disso entra no app além dos caminhos SVG.
//
// Uso: node scripts/generate-service-icons.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// slug preferido, seguido de alternativas caso o primeiro não exista
const SERVICES = [
  // Google / Microsoft / Apple / Amazon
  ['google'], ['gmail'], ['googlecloud'], ['googledrive'], ['youtube'], ['googleplay'],
  ['microsoft'], ['microsoftoutlook'], ['microsoftazure'], ['microsoftteams'], ['microsoftonedrive'], ['microsoftedge'], ['xbox'], ['windows'], ['skype'], ['linkedin'],
  ['apple'], ['icloud'], ['amazon'], ['amazonwebservices'], ['amazonpay'],
  // redes sociais e mensagens
  ['facebook'], ['meta'], ['instagram'], ['whatsapp'], ['messenger'], ['x'], ['threads'], ['tiktok'], ['snapchat'], ['pinterest'], ['reddit'], ['tumblr'], ['mastodon'], ['bluesky'],
  ['telegram'], ['signal'], ['discord'], ['slack'], ['zoom'], ['twitch'],
  // desenvolvimento / nuvem / hospedagem
  ['github'], ['gitlab'], ['bitbucket'], ['npm'], ['pypi'], ['docker'], ['jetbrains'], ['sentry'], ['datadog'], ['newrelic'], ['pagerduty'], ['circleci'], ['postman'], ['gitkraken'],
  ['cloudflare'], ['digitalocean'], ['akamai'], ['vultr'], ['hetzner'], ['ovh'], ['heroku'], ['vercel'], ['netlify'], ['render'], ['supabase'], ['firebase'], ['mongodb'], ['planetscale'], ['railway'], ['flydotio'],
  ['salesforce'], ['hubspot'], ['intercom'], ['zendesk'], ['mailchimp'],
  // identidade / senhas / e-mail
  ['okta'], ['auth0'], ['1password'], ['bitwarden'], ['lastpass'], ['dashlane'], ['proton'], ['protonmail'], ['protonvpn'], ['tuta'], ['yahoo'], ['zoho'], ['gmx'],
  // produtividade
  ['dropbox'], ['box'], ['mega'], ['nextcloud'], ['notion'], ['trello'], ['asana'], ['linear'], ['atlassian'], ['jira'], ['confluence'], ['figma'], ['canva'], ['miro'], ['airtable'], ['evernote'], ['todoist'], ['clickup'], ['mondaydotcom'],
  // pagamentos / bancos / cripto
  ['stripe'], ['paypal'], ['wise'], ['revolut'], ['nubank'], ['mercadopago'], ['picpay'], ['coinbase'], ['binance'], ['kucoin'], ['okx'], ['metamask'], ['trezor'], ['ledger'], ['cryptodotcom'],
  // jogos
  ['steam'], ['epicgames'], ['ea'], ['ubisoft'], ['battledotnet'], ['riotgames'], ['playstation'], ['nintendo'], ['roblox'], ['minecraft'], ['gogdotcom'], ['rockstargames'],
  // streaming
  ['netflix'], ['spotify'], ['disneyplus'], ['primevideo'], ['crunchyroll'], ['deezer'], ['tidal'],
  // e-commerce / viagens / serviços
  ['shopify'], ['wordpress'], ['wix'], ['squarespace'], ['godaddy'], ['namecheap'], ['gandi'], ['etsy'], ['ebay'], ['aliexpress'], ['shopee'], ['mercadopago'], ['uber'], ['airbnb'], ['bookingdotcom'], ['tripadvisor'], ['ifood'],
  // IA / VPN / outros
  ['openai'], ['anthropic'], ['huggingface'], ['kaggle'], ['tailscale'], ['nordvpn'], ['expressvpn'], ['surfshark'], ['mullvad'], ['samsung'], ['huawei'], ['xiaomi'],
];

const FALLBACK_VERSIONS = ['14.15.0', '13.21.0', '9.21.0']; // marcas removidas nas versões novas
const base = mkdtempSync(join(tmpdir(), 'si-'));

function sourceDir(version) {
  const dir = join(base, `v${version}`);
  if (!existsSync(join(dir, 'package'))) {
    mkdirSync(dir, { recursive: true });
    execFileSync('npm', ['pack', `simple-icons@${version}`, '--silent'], { cwd: dir, stdio: 'ignore' });
    execFileSync('tar', ['xzf', `simple-icons-${version}.tgz`], { cwd: dir, stdio: 'ignore' });
  }
  return join(dir, 'package');
}

const sources = [{ name: 'atual', dir: new URL('../node_modules/simple-icons', import.meta.url).pathname }];
const load = (src) => {
  const dataFile = ['data/simple-icons.json', '_data/simple-icons.json'].map((f) => join(src.dir, f)).find(existsSync);
  const raw = dataFile ? JSON.parse(readFileSync(dataFile, 'utf8')) : [];
  const list = Array.isArray(raw) ? raw : raw.icons || [];
  const slugOf = (t) => t.toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/&/g, 'and').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  src.meta = new Map(list.map((i) => [i.slug || slugOf(i.title), i]));
};
load(sources[0]);

// fontes em ordem: versão atual primeiro, depois as antigas (carregadas só se precisar)
const getSource = (idx) => {
  if (idx === 0) return sources[0];
  const v = FALLBACK_VERSIONS[idx - 1];
  let src = sources.find((x) => x.name === v);
  if (!src) { src = { name: v, dir: sourceDir(v) }; load(src); sources.push(src); }
  return src;
};

const out = {};
const missing = [];
const fromOld = [];
for (const [slug, ...alts] of SERVICES) {
  let done = false;
  for (const s of [slug, ...alts]) {
    for (let idx = 0; idx <= FALLBACK_VERSIONS.length && !done; idx++) {
      const source = getSource(idx);
      const file = join(source.dir, 'icons', `${s}.svg`);
      if (!existsSync(file)) continue;
      const svg = readFileSync(file, 'utf8');
      const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
      if (paths.length !== 1) continue; // só logos de um traço
      const meta = source.meta.get(s) || sources.map((x) => x.meta.get(s)).find(Boolean);
      const title = meta?.title || (svg.match(/<title>([^<]+)<\/title>/)?.[1] ?? s);
      const hex = '#' + (meta?.hex || sources.map((x) => x.meta.get(s)?.hex).find(Boolean) || '808080');
      out[slug] = { title, hex, path: paths[0] };
      if (source.name !== 'atual') fromOld.push(`${slug}(${source.name})`);
      done = true;
    }
    if (done) break;
  }
  if (!done) missing.push(slug);
}

writeFileSync(
  new URL('../src/data/serviceIcons.js', import.meta.url),
  `// GERADO por scripts/generate-service-icons.mjs — não editar à mão.\n// Ícones: simple-icons (CC0 1.0). Marcas pertencem aos seus donos; usadas só para identificar o serviço.\nexport const SERVICE_ICONS = ${JSON.stringify(out)};\n`
);
console.log('ícones:', Object.keys(out).length);
console.log('de versões antigas:', fromOld.join(', '));
console.log('não encontrados:', missing.join(', '));
