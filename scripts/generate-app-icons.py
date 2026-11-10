"""Gera os ícones do app (marca JUCA Soft): o padrão em assets/images e as variações alternativas
em assets/app-icons (também registra o plugin expo-alternate-app-icons no app.json).
Uso: python3 scripts/generate-app-icons.py"""
import json
import math
import os
from PIL import Image, ImageDraw

# (x, y, rotação, clara?, cor original da logo JUCA Soft)
BARS = [(165.564, 0, 42.1729, 0, '#048002'), (118.642, 51.7971, 42.1729, 1, '#2DA026'), (169.493, 173.497, 132.13, 0, '#1465BB'), (117.66, 126.614, 132.13, 1, '#81C9FA'),
        (173.818, 178, 41.694, 0, '#FCA61F'), (127.331, 230.188, 41.694, 1, '#FED369'), (348.476, 164.324, 132.018, 0, '#A6140D'), (296.552, 117.542, 132.018, 1, '#F32F18')]
WHITE = (255, 255, 255, 255)
SS = 4  # supersampling p/ bordas suaves


def mark(size, scale, color, bg=None):
    big = size * SS
    img = Image.new('RGBA', (big, big), bg or (0, 0, 0, 0))
    s = big * scale / 349
    ox, oy = (big - 349 * s) / 2, (big - 348 * s) / 2
    for x, y, r, light, hexc in BARS:
        layer = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        a = math.radians(r)
        pts = [(0, 0), (120, 0), (120, 50.1099), (0, 50.1099)]
        rot = [(x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a)) for px, py in pts]
        d.polygon([(ox + px * s, oy + py * s) for px, py in rot], fill=(color or tuple(int(hexc[i:i + 2], 16) for i in (1, 3, 5))) + ((115 if light and color else 255),))
        img = Image.alpha_composite(img, layer)
    return img.resize((size, size), Image.LANCZOS)


out = 'assets/images/'
mark(1024, 0.62, None, WHITE).convert('RGB').save(out + 'icon.png')
mark(1024, 0.46, None).save(out + 'adaptive-icon.png')
mark(48, 0.7, None, WHITE).convert('RGB').save(out + 'favicon.png')

# ---- ícones alternativos (como o X): nome, cor de fundo, cor da marca (None = cores originais)
def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def luminance(rgb):
    f = lambda c: (c / 255) / 12.92 if c / 255 <= 0.03928 else ((c / 255 + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2])

VARIANTS = [
    ('Escuro', '#0B0E14', '#FFFFFF'),
    ('Azul', '#1465BB', None), ('Verde', '#048002', None), ('Laranja', '#FCA61F', None), ('Vermelho', '#A6140D', None),
    ('Ceu', '#57A3F2', None), ('Menta', '#15803D', None), ('Grafite', '#27272A', None),
]
os.makedirs('assets/app-icons', exist_ok=True)
plugin = []
for name, bg, fg in VARIANTS:
    bgc = hex_rgb(bg)
    color = hex_rgb(fg) if fg else ((255, 255, 255) if luminance(bgc) < 0.42 else (17, 17, 19))
    mark(1024, 0.62, color, bgc + (255,)).convert('RGB').save(f'assets/app-icons/{name.lower()}.png')
    mark(1024, 0.46, color).save(f'assets/app-icons/{name.lower()}-fg.png')
    plugin.append({'name': name, 'ios': f'./assets/app-icons/{name.lower()}.png',
                   'android': {'foregroundImage': f'./assets/app-icons/{name.lower()}-fg.png', 'backgroundColor': bg}})

with open('app.json') as f:
    cfg = json.load(f)
plugins = [p for p in cfg['expo']['plugins'] if not (isinstance(p, list) and p[0] == 'expo-alternate-app-icons')]
plugins.append(['expo-alternate-app-icons', plugin])
cfg['expo']['plugins'] = plugins
with open('app.json', 'w') as f:
    json.dump(cfg, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('ok')
