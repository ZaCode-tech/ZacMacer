import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function boxGeo(w, h, d) {
  const m = Math.min(w, h, d);
  if (m < 0.012) return new THREE.BoxGeometry(w, h, d);
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(0.0025, m * 0.3));
  g.parameters = { ...g.parameters, width: w, height: h, depth: d }; // medidas reais (usadas nas ferragens e no editor)
  return g;
}

/* ==========================================================================
   1. ACABAMENTOS DE MADEIRA & BALDES DE TINTA (PBR)
   ========================================================================== */
export const FINISHES = {
  espresso: {
    name: 'Espresso & Quartzo Aveia',
    labelSelect: 'Espresso (Madeira Escura / Nogueira)',
    baseColor: '#5B3D2B',
    grainColor: '#2B1D16',
    highlightColor: '#75513B',
    roughness: 0.42,
    metalness: 0.04,
    isLacquer: false
  },
  oat: {
    name: 'Oat Natural & Pedra Clara',
    labelSelect: 'Oat (Madeira Clara / Aveia)',
    baseColor: '#DFD2BE',
    grainColor: '#BFA98C',
    highlightColor: '#EFE6D8',
    roughness: 0.48,
    metalness: 0.02,
    isLacquer: false
  },
  sage: {
    name: 'Sage Green Acetinado & Carvalho',
    labelSelect: 'Sage Green (Verde Sálvia)',
    baseColor: '#8FA37B',
    grainColor: '#728660',
    highlightColor: '#A7BA94',
    roughness: 0.36,
    metalness: 0.05,
    isLacquer: true
  }
};

export const PAINT_BUCKETS = [
  {
    id: 'sage_paint',
    name: 'Verde Sálvia Acetinado',
    short: 'Verde Sálvia',
    baseColor: '#8FA37B',
    grainColor: '#788C64',
    highlightColor: '#A6B993',
    roughness: 0.34,
    metalness: 0.05,
    isLacquer: true
  },
  {
    id: 'oat_paint',
    name: 'Aveia / Carvalho Claro',
    short: 'Aveia Clara',
    baseColor: '#E5D8C3',
    grainColor: '#C5AF91',
    highlightColor: '#F3EBDE',
    roughness: 0.44,
    metalness: 0.02,
    isLacquer: false
  },
  {
    id: 'espresso_paint',
    name: 'Nogueira Espresso',
    short: 'Nogueira',
    baseColor: '#4A3123',
    grainColor: '#23150E',
    highlightColor: '#664532',
    roughness: 0.4,
    metalness: 0.04,
    isLacquer: false
  },
  {
    id: 'naval_white',
    name: 'Branco Naval Fosco',
    short: 'Branco Naval',
    baseColor: '#F3F1EC',
    grainColor: '#DCD9D2',
    highlightColor: '#FFFFFF',
    roughness: 0.32,
    metalness: 0.03,
    isLacquer: true
  },
  {
    id: 'graphite_paint',
    name: 'Grafite Carvão Acetinado',
    short: 'Grafite',
    baseColor: '#35393E',
    grainColor: '#222529',
    highlightColor: '#4A4F56',
    roughness: 0.35,
    metalness: 0.08,
    isLacquer: true
  },
  {
    id: 'honey_oak',
    name: 'Carvalho Mel Dourado',
    short: 'Carvalho Mel',
    baseColor: '#B57B45',
    grainColor: '#7D4E24',
    highlightColor: '#CE965E',
    roughness: 0.42,
    metalness: 0.03,
    isLacquer: false
  },
  {
    id: 'petrol_blue',
    name: 'Azul Petróleo Profundo',
    short: 'Azul Petróleo',
    baseColor: '#2E535F',
    grainColor: '#1E3A43',
    highlightColor: '#426D7B',
    roughness: 0.34,
    metalness: 0.06,
    isLacquer: true
  },
  {
    id: 'terracotta_paint',
    name: 'Terracota Argila',
    short: 'Terracota',
    baseColor: '#A6563D',
    grainColor: '#7B3A26',
    highlightColor: '#BE6E55',
    roughness: 0.38,
    metalness: 0.04,
    isLacquer: true
  }
];

const _texCache = new Map();
function _drawWood(cfg) {
  const key = cfg.baseColor + cfg.isLacquer;
  if (_texCache.has(key)) return _texCache.get(key);
  const size = 768;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
  const cc = mk(), bc = mk();
  const ctx = cc.getContext('2d'), b = bc.getContext('2d');
  ctx.fillStyle = cfg.baseColor; ctx.fillRect(0, 0, size, size);
  b.fillStyle = '#808080'; b.fillRect(0, 0, size, size);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (cfg.isLacquer) {
    for (let i = 0; i < 2600; i++) { // laca com leve "casca de laranja"
      ctx.fillStyle = i % 2 ? cfg.highlightColor : cfg.grainColor;
      ctx.globalAlpha = 0.035;
      ctx.beginPath(); ctx.arc(rnd() * size, rnd() * size, 1 + rnd() * 3, 0, 6.283); ctx.fill();
    }
  } else {
    // faixas largas de tom (variação natural entre tábuas)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? cfg.highlightColor : cfg.grainColor;
      ctx.globalAlpha = 0.08; ctx.fillRect(rnd() * size, 0, 40 + rnd() * 160, size);
    }
    // anéis de crescimento em arco (corte tangencial)
    for (let k = 1; k < 16; k++) {
      ctx.beginPath(); ctx.ellipse(size * 0.5, size * 1.1, 30 + k * 26, 300 + k * 70, 0, 0, 6.283);
      ctx.strokeStyle = k % 2 ? cfg.grainColor : cfg.highlightColor;
      ctx.globalAlpha = 0.09; ctx.lineWidth = 2 + (k % 3); ctx.stroke();
    }
    // fibras longas onduladas
    for (let i = 0; i < 950; i++) {
      const x0 = rnd() * size, lw = 0.5 + rnd() * 2, amp = 3 + rnd() * 14, f = 0.004 + rnd() * 0.01, ph = rnd() * 6.28;
      ctx.beginPath(); b.beginPath();
      for (let y = 0; y <= size; y += 16) {
        const x = x0 + Math.sin(y * f + ph) * amp + Math.sin(y * f * 2.7 + ph * 1.7) * amp * 0.35;
        if (y) { ctx.lineTo(x, y); b.lineTo(x, y); } else { ctx.moveTo(x, y); b.moveTo(x, y); }
      }
      ctx.strokeStyle = rnd() < 0.62 ? cfg.grainColor : cfg.highlightColor;
      ctx.globalAlpha = 0.05 + rnd() * 0.2; ctx.lineWidth = lw; ctx.stroke();
      b.strokeStyle = rnd() < 0.5 ? '#585858' : '#a8a8a8'; b.globalAlpha = 0.25; b.lineWidth = lw; b.stroke();
    }
    // poros e um nó ocasional
    for (let p = 0; p < 1400; p++) {
      ctx.fillStyle = cfg.grainColor; ctx.globalAlpha = 0.2;
      ctx.fillRect(rnd() * size, rnd() * size, 1, 3 + rnd() * 14);
    }
    const kx = rnd() * size, ky = rnd() * size;
    for (let r = 3; r < 26; r += 4) {
      ctx.beginPath(); ctx.ellipse(kx, ky, r * 0.7, r * 1.5, 0, 0, 6.283);
      ctx.strokeStyle = cfg.grainColor; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.4; ctx.stroke();
      b.beginPath(); b.ellipse(kx, ky, r * 0.7, r * 1.5, 0, 0, 6.283); b.strokeStyle = '#404040'; b.globalAlpha = 0.3; b.stroke();
    }
  }
  const pair = { cc, bc };
  _texCache.set(key, pair);
  return pair;
}

export function createWoodTexturesFromConfig(cfg) {
  const { cc, bc } = _drawWood(cfg);
  const map = new THREE.CanvasTexture(cc);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const bumpMap = new THREE.CanvasTexture(bc);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  return { map, bumpMap };
}



/* ---------- Materiais dos acessórios (vidro, espelho, metais, LED, palhinha...) ---------- */
// chave: [cor, rugosidade, metalico, opacidade, emissivo?]
const AM = {
  mirror: [0xdfe6ea, 0.03, 1, 1], mirror_bronze: [0xb08a6a, 0.03, 1, 1], mirror_smoke: [0x6d747a, 0.03, 1, 1],
  glass: [0xcfe6ee, 0.05, 0, 0.28], glass_clear: [0xe8f4f2, 0.04, 0, 0.22], glass_bronze: [0x8a6b4f, 0.05, 0.6, 0.45],
  glass_silver: [0xb9c4cc, 0.05, 0.8, 0.45], glass_smoke: [0x59626a, 0.05, 0.4, 0.5], glass_ribbed: [0xcfe6ee, 0.25, 0, 0.4],
  glass_white: [0xf4f1ea, 0.1, 0, 0.96], glass_black: [0x151515, 0.1, 0, 0.96], glass_frost: [0xdfe9ec, 0.75, 0, 0.62],
  inox: [0xc9ccd0, 0.3, 0.9, 1], alu: [0xb8bcc2, 0.35, 0.85, 1], black: [0x1a1a1c, 0.5, 0.5, 1], brass: [0xb58f4a, 0.3, 0.9, 1],
  gold: [0xd2b04c, 0.25, 0.95, 1], bronze: [0x7a5a3a, 0.35, 0.85, 1], iron: [0x2a2b2e, 0.55, 0.7, 1],
  wicker: [0xc9a56a, 0.85, 0, 1], fabric: [0xcdbfa8, 0.95, 0, 1], fabric_dark: [0x4a4a50, 0.95, 0, 1], leather: [0x6b3f2a, 0.6, 0, 1],
  rubber: [0x222426, 0.9, 0, 1], felt: [0x3d4a6b, 0.95, 0, 1], plastic: [0xe9e6df, 0.5, 0, 1], white: [0xf2efe8, 0.5, 0, 1],
  mesh: [0x2a2b2e, 0.5, 0.8, 0.6], led_warm: [0xffd27d, 0.4, 0, 1, 0xffa733], led_neutral: [0xfff4e0, 0.4, 0, 1, 0xffe9c4], led_cool: [0xe8f4ff, 0.4, 0, 1, 0x9fd0ff]
};
export const ACC_MAT_KEYS = Object.keys(AM);
export const isAcc = (c) => Object.prototype.hasOwnProperty.call(AM, c);
const _am = new Map();
export function accMaterial(key) {
  if (_am.has(key)) return _am.get(key);
  const [color, rough, metal, op, em] = AM[key];
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, transparent: op < 1, opacity: op, side: op < 1 ? THREE.DoubleSide : THREE.FrontSide, depthWrite: op >= 0.9 });
  if (em) { m.emissive.setHex(em); m.emissiveIntensity = 0.9; }
  m.userData.isAccessory = true;
  _am.set(key, m);
  return m;
}
// Geometria de uma peça do projeto: caixa ('b') ou cilindro ('c': L = diâmetro, A = comprimento)
export function partGeometry(q) {
  if (q.s === 'c') { const g = new THREE.CylinderGeometry(q.w / 200, q.w / 200, q.h / 100, 24); g.parameters = { ...g.parameters, width: q.w / 100, height: q.h / 100, depth: q.w / 100 }; return g; }
  return boxGeo(q.w / 100, q.h / 100, q.d / 100);
}
export const rotRad = (r) => (r || [0, 0, 0]).map((v) => (v * Math.PI) / 180);
