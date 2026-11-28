import { FURN, FURN_GROUPS, makeFurniture } from './furniture.js';
// Catálogo estrutural: cada modelo tem uma ESTRUTURA diferente (colunas, gavetas, nichos, portas, bases, tampos, metalon).
// Cor/pintura NÃO conta como modelo: isso o cliente escolhe no Modo Pintor.
// DNA: "<base><tampo>-<largura><tipo><peso>...<.>próxima coluna" (células de cima para baixo)
// base: r=rodapé p=pés s=suspenso · tampo: t=madeira n=reto p=pedra
// células: P=porta G=gaveta N=nicho L=nicho com LED C=porta de correr B=basculante R=ripado
const T2 = 2.2;
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const TYPE_NAME = { P: 'portas', G: 'gavetas', N: 'nichos', L: 'nichos com LED', C: 'portas de correr', B: 'basculantes', R: 'ripado' };

// ambiente | rótulo | título | altura | prof | bases | tampos | pesos das células | colunas | linhas | larguras
const CTX = [
  ['cozinha', 'Cozinha', 'Balcão de Cozinha', 90, 56, 'rp', 'pt', { P: 5, G: 3, N: 1, C: 1 }, [2, 5], [1, 3], [40, 45, 50, 60]],
  ['cozinha', 'Cozinha', 'Armário Aéreo', 70, 35, 's', 'n', { P: 5, B: 2, N: 2, C: 1 }, [2, 5], [1, 2], [40, 50, 60]],
  ['cozinha', 'Cozinha', 'Torre Quente', 210, 56, 'r', 'n', { P: 4, G: 2, N: 3 }, [1, 2], [3, 5], [60]],
  ['quarto', 'Quarto', 'Guarda-Roupa', 230, 58, 'r', 'n', { P: 5, G: 2, N: 2, C: 2 }, [2, 6], [2, 5], [40, 50, 60, 70]],
  ['quarto', 'Quarto', 'Cômoda', 85, 45, 'p', 'tp', { G: 8, P: 1, N: 1 }, [1, 3], [2, 5], [40, 50, 60]],
  ['quarto', 'Quarto', 'Criado-Mudo', 50, 40, 'p', 't', { G: 4, P: 2, N: 2 }, [1, 2], [1, 3], [35, 40]],
  ['quarto', 'Quarto', 'Sapateira', 120, 35, 'r', 'n', { P: 5, B: 3, N: 2 }, [1, 3], [2, 4], [40, 50]],
  ['sala', 'Sala', 'Rack de TV', 55, 40, 'sp', 't', { P: 3, G: 3, N: 3, L: 2, R: 1 }, [2, 5], [1, 2], [40, 50, 60]],
  ['sala', 'Sala', 'Estante', 180, 35, 'r', 't', { N: 6, P: 3, G: 1, L: 1 }, [2, 5], [3, 6], [40, 50, 60]],
  ['sala', 'Sala', 'Aparador', 85, 40, 'pr', 'p', { P: 4, G: 3, N: 1, R: 2 }, [2, 4], [1, 2], [40, 50, 60]],
  ['sala', 'Sala', 'Buffet', 80, 45, 'p', 'p', { P: 4, G: 4, C: 2 }, [2, 4], [1, 2], [45, 55, 65]],
  ['banheiro', 'Banheiro', 'Gabinete de Pia', 80, 46, 'sp', 'p', { P: 4, G: 4, N: 1 }, [1, 3], [1, 3], [40, 50, 60]],
  ['banheiro', 'Banheiro', 'Coluna de Banheiro', 150, 30, 's', 'n', { P: 4, N: 5, B: 1 }, [1, 2], [3, 5], [30, 40]],
  ['escritorio', 'Escritório', 'Estante de Escritório', 180, 32, 'r', 't', { N: 5, P: 4, G: 1, C: 1 }, [2, 4], [3, 5], [40, 50, 60]],
  ['escritorio', 'Escritório', 'Gaveteiro', 70, 45, 'p', 't', { G: 9, P: 1 }, [1, 3], [2, 4], [40, 50]],
  ['lavanderia', 'Lavanderia', 'Armário de Lavanderia', 190, 45, 'r', 'n', { P: 6, N: 2, C: 1, B: 2 }, [2, 4], [2, 4], [40, 50, 60]],
  ['comercial', 'Comercial', 'Balcão de Atendimento', 105, 55, 'r', 't', { P: 3, G: 3, R: 5, L: 2 }, [2, 5], [1, 3], [40, 50, 60, 80]],
  ['comercial', 'Comercial', 'Expositor com Nichos', 140, 35, 'r', 'n', { N: 7, L: 3, P: 1, R: 1 }, [2, 5], [2, 5], [40, 50, 60]]
];

export const CATALOG = [];
const seen = new Set();
const add = (it) => { it.id = `M-${String(CATALOG.length + 1).padStart(4, '0')}`; CATALOG.push(it); };

function pickW(r, weights) {
  let x = r() * Object.values(weights).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(weights)) { if ((x -= v) <= 0) return k; }
  return Object.keys(weights)[0];
}

CTX.forEach(([fam, famName, title, h, d, bases, tops, weights, [c0, c1], [r0, r1], widths], idx) => {
  const r = rng(1000 + idx * 77);
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  let made = 0;
  for (let tries = 0; tries < 6000 && made < 82; tries++) {
    const n = ri(c0, c1);
    const cols = [];
    for (let i = 0; i < n; i++) {
      const cells = [];
      for (let j = ri(r0, r1); j > 0; j--) cells.push(pickW(r, weights) + ri(1, 3));
      cols.push(widths[ri(0, widths.length - 1)] + cells.join(''));
    }
    const sumW = cols.reduce((s, c) => s + parseInt(c, 10), 0);
    if (sumW > 380) continue;
    const dna = `${bases[ri(0, bases.length - 1)]}${tops[ri(0, tops.length - 1)]}-${cols.join('.')}`;
    if (seen.has(dna)) continue;
    seen.add(dna);
    const types = [...new Set([...dna.matchAll(/([A-Z])\d/g)].map((m) => m[1]))].map((t) => TYPE_NAME[t]);
    const feat = types.length > 1 ? `${types.slice(0, -1).join(', ')} e ${types[types.length - 1]}` : types[0];
    add({ fam, famName, dna, d, h, w: Math.round(sumW + (n + 1) * T2), name: `${title} ${n} ${n > 1 ? 'colunas' : 'coluna'} · ${feat}` });
    made++;
  }
});

// Serralheria Metalon: tipo, níveis, contraventamento, gaveta, pernas e fundo mudam a estrutura
const MT = [
  ['mesa', 'Mesa Metalon', 160, 76, 80, [0, 1], true], ['mesa', 'Escrivaninha Metalon', 140, 75, 60, [0, 1], true],
  ['rack', 'Rack de TV Metalon', 160, 50, 40, [0, 1, 2], true], ['estante', 'Estante Industrial Metalon', 100, 180, 35, [2, 3, 4, 5, 6], false],
  ['banco', 'Banco Metalon', 100, 45, 35, [0], false], ['aparador', 'Aparador Metalon', 140, 80, 40, [0, 1, 2], true],
  ['mesa', 'Bancada Metalon', 180, 90, 70, [0, 1, 2], true]
];
MT.forEach(([kind, title, w, h, d, levels, canDrawer]) => {
  levels.forEach((lv) => ['none', 'H', 'X'].forEach((brace) => [0, 1].forEach((drawer) => [0, 1].forEach((legs6) => [0, 1].forEach((back) => {
    if ((drawer && !canDrawer) || (back && (kind === 'banco' || kind === 'mesa')) || (legs6 && w < 140)) return;
    const bits = [lv ? `${lv} prateleira${lv > 1 ? 's' : ''}` : 'só tampo', brace === 'H' ? 'travessa lateral' : brace === 'X' ? 'contraventamento em X' : '', drawer ? 'gaveta' : '', legs6 ? '6 pernas' : '', back ? 'fundo fechado' : ''].filter(Boolean);
    add({ fam: 'metalon', famName: 'Serralheria Metalon', mt: { kind, levels: lv, brace, drawer, legs6, back }, w, h, d, name: `${title} · ${bits.join(', ')}` });
  })))));
});

// Os 110 móveis de marcenaria entram primeiro no catálogo
CATALOG.unshift(...FURN.map((f) => ({ id: `F-${String(f.id).padStart(3, '0')}`, fam: f.grp, famName: FURN_GROUPS[f.grp], ext: f.id, w: f.W, h: f.H, d: f.D, name: f.name })));

export function specFromItem(it) {
  if (it.ext) { const f = FURN[it.ext - 1]; return makeFurniture(f, it.w, it.h, it.d); }
  const base = { displayTitle: it.name, wCm: it.w, hCm: it.h, dCm: it.d, doorCount: 0, hasShelf: true, hasDrawers: true, isAutoImagined: false, catalogId: it.id };
  return it.dna ? { ...base, category: 'modular', dna: it.dna } : { ...base, category: 'metalon', ...it.mt };
}

export function parseDna(dna) {
  const [head, rest] = dna.split('-');
  const cols = rest.split('.').map((c) => {
    const m = c.match(/^(\d+)(.*)$/);
    return { w: +m[1], cells: [...m[2].matchAll(/([A-Z])(\d)/g)].map((x) => ({ t: x[1], h: +x[2] })) };
  });
  return { base: head[0], top: head[1], cols };
}

// Miniatura SVG da estrutura (mostra a diferença real entre os modelos)
const _thumbCache = new Map();
function extThumb(it) {
  if (_thumbCache.has(it.id)) return _thumbCache.get(it.id);
  const f = FURN[it.ext - 1], ps = makeFurniture(f, f.W, f.H, f.D).parts.slice().sort((a, b) => a.z - b.z);
  const x0 = Math.min(...ps.map((q) => q.x - q.w / 2)), x1 = Math.max(...ps.map((q) => q.x + q.w / 2)), y1 = Math.max(...ps.map((q) => q.y + q.h / 2));
  const sc = 110 / Math.max(x1 - x0, y1), o = 4;
  const g = ps.map((q) => {
    const k = q.t === 'porta' || q.t === 'gaveta' ? 't-face' : q.t === 'acc' ? 't-line' : q.t === 'tubo' || q.c === 'metal' ? 't-leg' : 't-body';
    return `<rect x="${(o + (q.x - q.w / 2 - x0) * sc).toFixed(1)}" y="${(o + (y1 - q.y - q.h / 2) * sc).toFixed(1)}" width="${Math.max(0.8, q.w * sc).toFixed(1)}" height="${Math.max(0.8, q.h * sc).toFixed(1)}" class="${k}"/>`;
  }).join('');
  const out = `<svg viewBox="0 0 ${((x1 - x0) * sc + 2 * o).toFixed(0)} ${(y1 * sc + 2 * o).toFixed(0)}" class="thumb" aria-hidden="true">${g}</svg>`;
  _thumbCache.set(it.id, out);
  return out;
}

export function thumbSvg(it) {
  if (it.ext) return extThumb(it);
  const sc = 110 / Math.max(it.w, it.h), W = it.w * sc, H = it.h * sc, o = 4;
  let g = '';
  if (it.dna) {
    const { base, top, cols } = parseDna(it.dna);
    const baseH = base === 'r' ? 6 : base === 'p' ? 9 : 0, topH = top === 'p' ? 3 : 2;
    const bodyH = H - baseH - topH, sumW = cols.reduce((s, c) => s + c.w, 0), inner = W - (cols.length + 1) * 1.6;
    let x = o + 1.6;
    cols.forEach((c) => {
      const cw = (c.w / sumW) * inner, tot = c.cells.reduce((s, k) => s + k.h, 0);
      let y = o + topH;
      c.cells.forEach((k) => {
        const ch = (k.h / tot) * (bodyH - 1.6);
        const r = `x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}"`;
        const ln = (x1, y1, x2, y2, c2 = 't-line') => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${c2}"/>`;
        if (k.t === 'N' || k.t === 'L') g += `<rect ${r} class="t-nicho"/>` + (k.t === 'L' ? ln(x, y + 1, x + cw, y + 1, 't-led') : '');
        else if (k.t === 'R') for (let i = 1; i < cw / 3; i++) g += ln(x + i * 3, y, x + i * 3, y + ch);
        else g += `<rect ${r} class="t-face"/>` + (k.t === 'G' ? ln(x + cw * 0.35, y + ch / 2, x + cw * 0.65, y + ch / 2) : k.t === 'B' ? ln(x, y + 1.5, x + cw, y + 1.5, 't-led') : k.t === 'C' ? ln(x + cw / 2, y, x + cw / 2, y + ch) : ln(x + cw - 2, y + ch * 0.35, x + cw - 2, y + ch * 0.65));
        y += ch;
      });
      x += cw + 1.6;
    });
    g = `<rect x="${o}" y="${o}" width="${W}" height="${topH}" class="t-top"/><rect x="${o}" y="${o + topH}" width="${W}" height="${bodyH}" class="t-body"/>` + g;
    if (base === 'r') g += `<rect x="${o + 2}" y="${o + H - baseH}" width="${W - 4}" height="${baseH}" class="t-base"/>`;
    if (base === 'p') g += `<rect x="${o + 3}" y="${o + H - baseH}" width="2" height="${baseH}" class="t-leg"/><rect x="${o + W - 5}" y="${o + H - baseH}" width="2" height="${baseH}" class="t-leg"/>`;
  } else {
    const { levels, brace, drawer, legs6, back } = it.mt;
    g = `<rect x="${o}" y="${o}" width="${W}" height="${H}" class="${back ? 't-face' : 't-nicho'}"/>`;
    for (let i = 0; i <= levels; i++) g += `<rect x="${o}" y="${o + (H * i) / (levels + 1)}" width="${W}" height="3" class="t-top"/>`;
    if (brace === 'X') g += `<line x1="${o}" y1="${o + H}" x2="${o + W}" y2="${o + 4}" class="t-line"/><line x1="${o + W}" y1="${o + H}" x2="${o}" y2="${o + 4}" class="t-line"/>`;
    if (brace === 'H') g += `<line x1="${o}" x2="${o + W}" y1="${o + H * 0.8}" y2="${o + H * 0.8}" class="t-line"/>`;
    if (drawer) g += `<rect x="${o + W * 0.3}" y="${o + 4}" width="${W * 0.4}" height="${Math.min(10, H * 0.25)}" class="t-face"/>`;
    [0, W - 3].concat(legs6 ? [W / 2 - 1.5] : []).forEach((lx) => { g += `<rect x="${o + lx}" y="${o}" width="3" height="${H}" class="t-leg"/>`; });
  }
  return `<svg viewBox="0 0 ${(W + 2 * o).toFixed(0)} ${(H + 2 * o).toFixed(0)}" class="thumb" aria-hidden="true">${g}</svg>`;
}

// Reconhece móveis de metalon / cômoda digitados no campo "O que você quer criar?"
const CUSTOM = [
  [/mesa de centro/, 'Mesa de Centro Metalon', 'mesa', 100, 40, 60, 1],
  [/escrivaninha|mesa de escritorio/, 'Escrivaninha Metalon', 'mesa', 140, 75, 60, 0],
  [/mesa/, 'Mesa Metalon', 'mesa', 160, 76, 80, 0],
  [/rack|painel de tv/, 'Rack de TV Metalon', 'rack', 160, 50, 40, 1],
  [/banco/, 'Banco Metalon', 'banco', 100, 45, 35, 0],
  [/metalon|serralheria|industrial/, 'Estante Industrial Metalon', 'estante', 100, 180, 35, 4]
];
const CHEST = [[/criado|mesa de cabeceira/, 'Criado-Mudo', 45, 50, 40, 'G1G1'], [/gaveteiro/, 'Gaveteiro', 60, 75, 45, 'G1G1G1'], [/comoda/, 'Cômoda', 90, 85, 45, 'G1G1G1G1']];

export function detectCustom(text) {
  for (const [re, title, w, h, d, cells] of CHEST) {
    if (re.test(text)) return { category: 'modular', dna: `pt-${w - 5}${cells}`, title, dims: { w, h, d } };
  }
  for (const [re, title, kind, w, h, d, n] of CUSTOM) {
    if (re.test(text)) return { category: 'metalon', kind, title, dims: { w, h, d }, levels: n };
  }
  return null;
}
