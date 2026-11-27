// Os 110 móveis de marcenaria: cada um é uma receita paramétrica (cm) que gera PEÇAS nomeadas
// (mesmo formato do Modo Editor: {t,n,w,h,d,x,y,z,c,s,r}). Assim o 3D, o Modo Detalhado, a lista de
// ferragens, o editor e os links de pedido funcionam igual para todos.
import { ACC } from './accessories.js';
const T = 2.2, WD = 'wood', r1 = (v) => Math.round(v * 10) / 10;
const B = (n, w, h, d, x, yb, z, o = {}) => ({ t: 'painel', n, w: r1(w), h: r1(h), d: r1(d), x: r1(x), y: r1(yb + h / 2), z: r1(z), c: WD, ...o });
const CY = (n, dia, h, x, yb, z, o = {}) => B(n, dia, h, dia, x, yb, z, { s: 'c', ...o });
const TB = (n, w, h, d, x, yb, z, o = {}) => B(n, w, h, d, x, yb, z, { t: 'tubo', c: 'metal', ...o });
const rot = (q, rx = 0, ry = 0, rz = 0) => ({ ...q, r: [rx, ry, rz] });
const AC = (id, x, yc, z, o = {}) => { const a = ACC[id - 1]; return { t: 'acc', acc: id, n: a.n, w: a.w, h: a.h, d: a.d, x: r1(x), y: r1(yc), z: r1(z), c: a.c, ...(a.s === 'c' ? { s: 'c' } : {}), ...(a.r ? { r: a.r } : {}), ...o }; };
const spread = (n, a, b) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 0.5)) / n);
const rotY90 = (ps) => ps.map((q) => ({ ...q, w: q.d, d: q.w, x: q.z, z: -q.x }));

/* ---------- Armário: base, laterais, tampo, fundo, prateleiras, gavetas, portas, puxadores ---------- */
function cab(W, H, D, o = {}) {
  const { doors = 0, drawers = 0, shelves = 0, foot = 'rod', yb = 0, x = 0, z = 0, glass = false, slide = false, flaps = 0, wheels = false, mirror = false, top = 2, pull = true } = o;
  const fh = foot === 'rod' ? 8 : foot === 'pe' || foot === 'stick' ? 12 : wheels ? 7 : 0;
  const y0 = yb + fh, iH = H - fh - 2 * T, iy = y0 + T, iw = W - 2 * T, fz = z + D / 2 + T / 2, p = [];
  p.push(B('Base Inferior', W, T, D, x, y0, z), B('Tampo Superior', W + top, T, D + top / 2, x, yb + H - T, z + top / 4));
  [-1, 1].forEach((k) => p.push(B(k < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita', T, iH, D, x + k * (W / 2 - T / 2), iy, z)));
  p.push(B('Fundo', iw, iH, 0.6, x, iy, z - D / 2 + 0.3));
  if (foot === 'rod') p.push(B('Rodapé Base', W - 4, 8, D - 6, x, yb, z - 1));
  if (foot === 'pe' || foot === 'stick') [-1, 1].forEach((a) => [-1, 1].forEach((b) => { const q = CY('Pé', 4, fh, x + a * (W / 2 - 6), yb, z + b * (D / 2 - 6)); p.push(foot === 'stick' ? rot(q, b * 6, 0, -a * 6) : q); }));
  if (wheels) [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(AC(110, x + a * (W / 2 - 5), yb + 3, z + b * (D / 2 - 5)))));
  for (let i = 1; i <= shelves; i++) p.push(B(`Prateleira ${i}`, iw - 0.4, T, D - 3, x, iy + ((iH - T) * i) / (shelves + 1), z - 0.5));
  const dh = drawers ? (doors || flaps ? Math.min(iH * 0.45, 16 * drawers) : iH) / drawers : 0, dTop = iy + iH;
  for (let i = 0; i < drawers; i++) {
    const yy = dTop - dh * (i + 1);
    p.push(B(`Gaveta ${i + 1}`, iw - 0.4, dh - 0.4, D - 4, x, yy + 0.2, z + 2, { t: 'gaveta' }));
    if (pull) p.push(AC(27, x, yy + dh / 2, fz + 1.5));
  }
  const rh = dTop - iy - dh * drawers;
  for (let i = 0; i < doors; i++) {
    const dw = iw / doors, cx = x - iw / 2 + dw * (i + 0.5);
    p.push(B(slide ? `Porta de Correr ${i + 1}` : `Porta ${i + 1}`, dw - 0.4 + (slide ? 3 : 0), rh - 0.4, T, cx, iy + 0.2, fz + (slide && i % 2 ? 2.4 : 0), { t: slide ? 'painel' : 'porta', c: glass ? 'glass_frost' : mirror ? 'mirror' : WD }));
    if (pull && !slide) p.push(rot(AC(27, cx + (i % 2 ? -1 : 1) * (dw / 2 - 4), iy + rh * 0.5, fz + 1.5), 0, 0, 90));
  }
  for (let i = 0; i < flaps; i++) { const f = iH / flaps; p.push(B(`Porta Basculante ${i + 1}`, iw - 0.4, f - 0.4, T, x, iy + f * (flaps - i - 1) + 0.2, fz)); }
  return p;
}

/* ---------- Mesas ---------- */
function tbl(W, H, D, o = {}) {
  const { round = false, legs = 'reta', apron = false, drawer = 0, tt = 3, shelf = false, x = 0, z = 0, yb = 0, lift = false, ext = false } = o, lh = H - tt, p = [];
  p.push(round ? CY('Tampo', W, tt, x, yb + lh, z) : B('Tampo', W, tt, D, x, yb + lh, z));
  const cx = (W / 2 - 8) * (round ? 0.7 : 1), cz = (D / 2 - 8) * (round ? 0.7 : 1);
  if (legs === 'reta') [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(B('Perna', 5, lh, 5, x + a * cx, yb, z + b * cz))));
  if (legs === 'palito') [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(rot(CY('Perna', 4, lh, x + a * cx, yb, z + b * cz), b * 8, 0, -a * 8))));
  if (legs === 'hairpin') [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(rot(AC(107, x + a * cx, yb + lh / 2, z + b * cz, { h: lh }), b * 5, 0, -a * 5))));
  if (legs === 'cavalete') { [-1, 1].forEach((a) => p.push(B('Cavalete', 4, lh, D - 8, x + a * (W / 2 - 18), yb, z))); p.push(B('Travessa Fixa', W - 36, 5, 4, x, yb + lh - 8, z)); }
  if (legs === 'painel') [-1, 1].forEach((a) => p.push(B('Parede Lateral', T, lh, D - 8, x + a * (W / 2 - 6), yb, z)));
  if (legs === 'central') p.push(CY('Coluna central', 10, lh - 2, x, yb + 2, z), CY('Base da coluna', Math.min(W, D) * 0.55, 2, x, yb, z));
  if (apron) { p.push(B('Travessa Fixa Frente', W - 20, 6, T, x, yb + lh - 6, z + D / 2 - 8), B('Travessa Fixa Fundo', W - 20, 6, T, x, yb + lh - 6, z - D / 2 + 8)); }
  if (shelf) p.push(B('Prateleira inferior', W - 12, 2.5, D - 12, x, yb + 12, z));
  for (let i = 0; i < drawer; i++) p.push(B(`Gaveta ${i + 1}`, Math.min(40, W / 2 - 6), 9, D - 14, x - W / 4 + (drawer > 1 ? i * 42 : 0), yb + lh - 10, z + 2, { t: 'gaveta' }), AC(27, x - W / 4 + (drawer > 1 ? i * 42 : 0), yb + lh - 5.5, z + D / 2 - 4));
  if (ext) p.push(B('Folha Extensível', W * 0.4, tt, D, x + W * 0.7, yb + lh, z), AC(59, x + W * 0.3, yb + lh - 2, z));
  if (lift) p.push(rot(B('Tampo Elevável', W - 12, 2, D - 12, x, yb + lh + 12, z - 1), -7, 0, 0), TB('Articulação do tampo', 2, 12, 2, x - W / 4, yb + lh, z + 2), TB('Articulação do tampo', 2, 12, 2, x + W / 4, yb + lh, z + 2));
  return p;
}

/* ---------- Assentos ---------- */
function seat(W, H, D, o = {}) {
  const { sh = 45, back = true, pad = false, round = false, x = 0, z = 0, yb = 0, rec = -8, arms = false, stretcher = false } = o, p = [], st = pad ? 7 : 3, f = pad ? { c: 'fabric' } : {};
  p.push(round ? CY('Assento', W, st, x, yb + sh - st, z, f) : B('Assento', W, st, D, x, yb + sh - st, z, f));
  if (round) [0, 1, 2].forEach((i) => p.push(rot(CY('Perna', 3.5, sh - st, x + Math.cos(i * 2.094) * (W / 2 - 6), yb, z + Math.sin(i * 2.094) * (W / 2 - 6)), -Math.sin(i * 2.094) * 5, 0, Math.cos(i * 2.094) * 5)));
  else [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(B('Perna', 4, sh - st, 4, x + a * (W / 2 - 3), yb, z + b * (D / 2 - 3)))));
  if (stretcher) p.push(CY('Apoio de pés', 2.5, W - 8, x, yb + sh * 0.35, z, { c: 'alu', r: [0, 0, 90] }));
  if (back) p.push(rot(B('Encosto', W - 2, H - sh, pad ? 6 : 2.5, x, yb + sh, z - D / 2 + 1, f), rec, 0, 0));
  if (arms) [-1, 1].forEach((a) => p.push(B('Braço', 5, 18, D - 8, x + a * (W / 2 + 2.5), yb + sh - 3, z)));
  return p;
}

/* ---------- Camas e berços ---------- */
function bed(W, L, o = {}) {
  const { levels = [30], hb = 90, post = 0, ladder = false, drawers = 0, baul = false, bi = false, head = 'pad', desk = false, house = false, mat = 18, side = false } = o, p = [], FW = W + 6, FL = L + 4;
  levels.forEach((lv, i) => {
    const s = levels.length > 1 ? ` ${i + 1}` : '';
    p.push(B(`Parede Lateral Esquerda${s}`, T, 20, FL, -FW / 2 + T / 2, lv - 20, 0), B(`Parede Lateral Direita${s}`, T, 20, FL, FW / 2 - T / 2, lv - 20, 0), B(`Travessa Fixa Pé${s}`, FW - 2 * T, 20, T, 0, lv - 20, FL / 2 - T / 2), B(`Travessa Fixa Cabeceira${s}`, FW - 2 * T, 20, T, 0, lv - 20, -FL / 2 + T / 2));
    p.push(B(`Estrado ripado${s}`, FW - 2 * T, 2, FL - 2 * T, 0, lv - 3, 0), B(`Colchão${s}`, W, mat, L, 0, lv - 1, 0, { c: 'fabric' }));
    if (levels.length > 1 || side) p.push(B(`Grade de proteção${s}`, T, 22, FL * 0.7, FW / 2 - T / 2, lv + mat - 1, FL * 0.15));
  });
  const top = levels[levels.length - 1];
  if (post) [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(B('Poste', 5, top + post, 5, a * (FW / 2 - 2.5), 0, b * (FL / 2 - 2.5)))));
  if (ladder) { [-1, 1].forEach((a) => p.push(B('Escada Lateral', 3, top + 10, 4, FW / 2 + 6 + a * 14, 0, 20))); [0.2, 0.4, 0.6, 0.8].forEach((f) => p.push(B('Degrau', 30, 3, 4, FW / 2 + 6, top * f, 20))); }
  if (baul) p.push(B('Base do Baú', FW - 2 * T, 12, FL - 2 * T, 0, 4, 0), AC(51, 0, 24, FL / 2 - 1), B('Tampa do Baú', FW - 2 * T, 2, FL - 2 * T, 0, 28, 0));
  for (let i = 0; i < drawers; i++) p.push(B(`Gaveta ${i + 1}`, FW / 2 - 4, 16, 40, (i - (drawers - 1) / 2) * (FW / drawers), 6, FL / 2 - 20, { t: 'gaveta' }), AC(27, (i - (drawers - 1) / 2) * (FW / drawers), 14, FL / 2 + 1));
  if (bi) p.push(B('Cama Auxiliar', W - 8, 14, L - 6, 0, 4, 20, { c: 'fabric' }), AC(110, -W / 2 + 6, 3, L / 2 - 6), AC(110, W / 2 - 6, 3, L / 2 - 6));
  if (head === 'pad') p.push(B('Cabeceira Estofada', FW + 6, hb, 6, 0, top - 20, -FL / 2 - 3, { c: 'fabric' }), B('Moldura da Cabeceira', FW + 10, 4, 8, 0, top - 20 + hb, -FL / 2 - 3));
  if (head === 'rip') p.push(B('Painel Ripado (18 ripas)', FW + 6, hb, 3, 0, top - 20, -FL / 2 - 3, { t: 'ripado' }));
  if (head === 'mesas') p.push(B('Cabeceira com Moldura', FW, hb, 5, 0, top - 20, -FL / 2 - 3), ...[-1, 1].flatMap((a) => cab(40, 45, 35, { foot: 'none', drawers: 1, yb: top - 14, x: a * (FW / 2 + 22), z: -FL / 2 + 14, pull: true })));
  if (head === 'tall') p.push(B('Cabeceira', FW + 6, hb, 5, 0, top - 20, -FL / 2 - 3));
  if (desk) p.push(...tbl(120, 75, 55, { x: 0, z: -FL / 2 + 40, drawer: 1 }).map((q) => ({ ...q, x: q.x + FW + 40 })));
  if (house) [-1, 1].forEach((a) => p.push(rot(B('Telhado da Casinha', FW * 0.7, 3, FL * 0.9, a * FW * 0.2, top + 40, 0), 0, 0, a * 38), B('Montante da Casinha', 4, 70, 4, a * (FW / 2 - 2), top, FL / 2 - 4)));
  return p;
}

function crib(W, L, o = {}) {
  const { low = false } = o, H = 90, p = [];
  p.push(B('Estrado do Berço', W, 3, L, 0, 30, 0), B('Colchão', W - 4, 12, L - 4, 0, 33, 0, { c: 'fabric' }), B('Cabeceira do Berço', W + 6, H, 3, 0, 0, -L / 2 - 1.5), B('Peseira do Berço', W + 6, low ? 60 : H, 3, 0, 0, L / 2 + 1.5));
  [-1, 1].forEach((a) => { p.push(B('Corrimão', 3, 4, L, a * (W / 2 + 1.5), 90, 0)); if (!(low && a > 0)) for (let i = 0; i < 12; i++) p.push(B('Grade', 2, 50, 2, a * (W / 2 + 1.5), 40, -L / 2 + 6 + (i * (L - 12)) / 11)); });
  return p;
}

/* ---------- Estantes ---------- */
function shelf(W, H, D, o = {}) {
  const { n = 4, style = 'liv', x = 0, z = 0, yb = 0, foot = 8 } = o, p = [], iy = yb + foot, ih = H - foot;
  if (style === 'ind') { [-1, 1].forEach((a) => [-1, 1].forEach((b) => p.push(TB('Montante Metalon 30×30', 3, H, 3, x + a * (W / 2 - 2), yb, z + b * (D / 2 - 2))))); for (let i = 0; i <= n; i++) p.push(B(i === n ? 'Tampo' : `Prateleira ${i + 1}`, W, 3, D, x, yb + ((H - 3) * i) / n, z)); return p; }
  if (style === 'col') {
    const R = 4, C = 3, cw = W / C, ch = ih / R;
    for (let r = 0; r <= R; r++) p.push(B(`Travessa Fixa ${r + 1}`, W, T, D, x, iy + ((ih - T) * r) / R, z));
    for (let r = 0; r < R; r++) for (let c = 1; c < C + (r % 2); c++) { const px = x - W / 2 + c * cw - (r % 2 ? cw / 2 : 0); if (px > x - W / 2 + 4 && px < x + W / 2 - 4) p.push(B(`Divisória ${r + 1}.${c}`, T, ch - T, D, px, iy + r * ch + T, z)); }
    p.push(B('Fundo', W, ih, 0.6, x, iy, z - D / 2 + 0.3)); return p;
  }
  if (style === 'esc') { [-1, 1].forEach((a) => p.push(rot(B('Lateral Inclinada', T, H + 4, 5, x + a * (W / 2 - 1), yb, z - D * 0.15), 12, 0, 0))); for (let i = 0; i < n; i++) p.push(B(`Prateleira ${i + 1}`, W - 4, 2.5, D * (1 - i * 0.16), x, yb + 12 + (i * (H - 24)) / (n - 1), z + D * 0.5 - (D * (1 - i * 0.16)) / 2 - D * 0.35 + i * 3)); return p; }
  [-1, 1].forEach((a) => p.push(B(a < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita', T, ih, D, x + a * (W / 2 - T / 2), iy, z)));
  p.push(B('Base Inferior', W, T, D, x, iy, z), B('Tampo Superior', W, T, D, x, yb + H - T, z), B('Fundo', W - 2 * T, ih - 2 * T, 0.6, x, iy + T, z - D / 2 + 0.3));
  if (foot) p.push(B('Rodapé Base', W - 4, foot, D - 6, x, yb, z - 1));
  for (let i = 1; i <= n; i++) p.push(B(`Prateleira ${i}`, W - 2 * T - 0.4, T, D - 3, x, iy + ((ih - T) * i) / (n + 1), z - 0.5));
  if (style === 'mont') for (let i = 1; i <= n; i++) p.push(B(`Aba de Livros ${i}`, W - 2 * T, 5, 1.5, x, iy + ((ih - T) * i) / (n + 1) + T, z + D / 2 - 1));
  return p;
}

/* ---------- Painéis de TV ---------- */
const panelTV = (W, H, style, o = {}) => {
  const { x = 0, z = -22, yb = 0 } = o, p = [];
  if (style === 'rip') p.push(B(`Painel Ripado (${Math.round(W / 4.5)} ripas)`, W, H, 3, x, yb, z, { t: 'ripado' }));
  else p.push(B('Painel de TV', W, H, 3, x, yb, z));
  if (style === 'led') p.push(AC(69, x, yb + H - 6, z + 2, { w: W - 8 }), AC(69, x, yb + 8, z + 2, { w: W - 8 }), AC(74, x + W / 2 - 10, yb + 3, z + 3));
  return p;
};

/* ---------- Receitas especiais ---------- */
const R = {
  revisteiro: (W, H, D) => [B('Base Inferior', W, T, D, 0, 0, 0), ...[-1, 1].map((a) => B(a < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita', T, H, D, a * (W / 2 - T / 2), 0, 0)), rot(B('Aba Frontal', W - 4, H * 0.55, 1.5, 0, 4, D / 2 - 2), -14, 0, 0), B('Divisória', W - 4, H * 0.5, 1.5, 0, 4, 0)],
  floreira: (W, H, D) => [B('Caixa da Floreira', W, 25, D, 0, H - 25, 0), ...[-1, 1].flatMap((a) => [-1, 1].map((b) => rot(B('Pé', 4, H - 25, 4, a * (W / 2 - 6), 0, b * (D / 2 - 6)), b * 5, 0, -a * 5)))],
  mancebo: (W, H) => [CY('Coluna', 4, H, 0, 5, 0), ...[0, 1, 2].map((i) => rot(B('Pé de Apoio', 3, 3, W / 2, Math.sin(i * 2.094 + 0.5) * (W / 4), 0, Math.cos(i * 2.094 + 0.5) * (W / 4)), 0, i * 120 + 30, 0)), ...[0, 1, 2, 3].map((i) => rot(CY('Gancho', 2, 14, Math.cos(i * 1.57) * 8, H - 18, Math.sin(i * 1.57) * 8, { c: 'brass' }), 0, 0, 0)), CY('Topo', 8, 4, 0, H, 0)],
  cabideiroParede: (W, H, D) => [B('Painel do Cabideiro', W, H, 2, 0, 0, 0), B('Prateleira', W, T, D, 0, H - 4, D / 2), ...spread(4, -W / 2 + 8, W / 2 - 8).map((x) => rot(CY('Gancho', 2, 8, x, H * 0.45, 5, { c: 'black' }), 90, 0, 0)), B('Suporte cadeirinha', 2, 12, D - 4, -W / 2 + 6, H - 16, D / 2, { c: 'iron' }), B('Suporte cadeirinha', 2, 12, D - 4, W / 2 - 6, H - 16, D / 2, { c: 'iron' })],
  biombo: (W, H) => [-1, 0, 1].map((i) => rot(B(`Painel Ripado (14 ripas) ${i + 2}`, W / 3 - 2, H, 3, i * (W / 3 - 4), 0, i === 0 ? 0 : 6), 0, i * 22, 0, { t: 'ripado' })).map((q) => ({ ...q, t: 'ripado' })),
  jardimBanco: (W, H, D) => [...[0, 1, 2, 3, 4].map((i) => B('Ripa do Assento', W, 3, 6, 0, 42, -D / 2 + 5 + i * 8)), ...[0, 1, 2].map((i) => rot(B('Ripa do Encosto', W, 3, 8, 0, 50 + i * 12, -D / 2 - 2 - i * 2), -14, 0, 0)), ...[-1, 1].flatMap((a) => [B('Perna Maciça', 6, 42, D - 4, a * (W / 2 - 6), 0, 0), rot(B('Braço', 6, 3, D - 6, a * (W / 2 - 6), 62, -2), 0, 0, 0)])],
  espreguicadeira: (W, H, D) => [...[0, 1, 2, 3, 4, 5, 6].map((i) => B('Ripa do Assento', W, 2.5, 6, 0, 30, -D / 2 + 5 + i * 9)), ...[0, 1, 2, 3, 4].map((i) => rot(B('Ripa do Encosto', W, 2.5, 6, 0, 36 + i * 8, D / 2 - 6 + i * 6), -55, 0, 0)), ...[-1, 1].flatMap((a) => [B('Lateral do Deck', 4, 20, D, a * (W / 2), 20, 0), rot(B('Apoio do Encosto', 3, 38, 3, a * (W / 2), 28, D / 2 - 20), -40, 0, 0), B('Pé', 4, 20, 4, a * (W / 2), 0, -D / 2 + 6), B('Pé', 4, 20, 4, a * (W / 2), 0, D / 2 - 6)])],
  pergolado: (W, H, D) => [...[-1, 1].flatMap((a) => [-1, 1].map((b) => B('Pilar', 14, H, 14, a * (W / 2 - 7), 0, b * (D / 2 - 7)))), ...[-1, 1].map((b) => B('Viga Principal', W, 18, 8, 0, H, b * (D / 2 - 7))), ...spread(9, -W / 2 + 10, W / 2 - 10).map((x) => B('Caibro', 6, 8, D + 40, x, H + 18, 0))],
  painelJardim: (W, H) => [...spread(12, -W / 2, W / 2).map((x) => B('Régua Vertical (ripas)', 7, H - 20, 2.5, x, 20, 0)), B('Painel Ripado (12 ripas)', 0.1, 0.1, 0.1, 0, 0, 0)].slice(0, 12).concat([B('Travessa Fixa', W, 6, 3, 0, 28, -2), B('Travessa Fixa', W, 6, 3, 0, H - 14, -2), B('Poste Maciço', 8, H, 8, -W / 2 - 4, 0, -2), B('Poste Maciço', 8, H, 8, W / 2 + 4, 0, -2)]),
  cesto: (W, H, D) => [B('Base do Cesto', W, 3, D, 0, 6, 0), ...spread(8, -W / 2, W / 2).flatMap((x) => [B('Ripa Frontal', 2.5, H - 12, 2, x, 8, D / 2 - 1), B('Ripa Traseira', 2.5, H - 12, 2, x, 8, -D / 2 + 1)]), ...[-1, 1].map((a) => B('Ripa Lateral', 2, H - 12, D, a * (W / 2 - 1), 8, 0)), ...[-1, 1].flatMap((a) => [-1, 1].map((b) => B('Pé', 4, 6, 4, a * (W / 2 - 3), 0, b * (D / 2 - 3)))), B('Tampa Basculante', W + 1, 2.5, D + 1, 0, H - 2, 0)],
  carrinho: (W, H, D) => [...[-1, 1].flatMap((a) => [-1, 1].map((b) => TB('Montante Metalon', 3, H - 8, 3, a * (W / 2 - 2), 8, b * (D / 2 - 2)))), B('Tampo', W, 3, D, 0, H - 3, 0), B('Prateleira 1', W - 4, 2.5, D - 4, 0, 30, 0), B('Prateleira 2', W - 4, 2.5, D - 4, 0, 8, 0), ...[-1, 1].flatMap((a) => [-1, 1].map((b) => AC(110, a * (W / 2 - 3), 3, b * (D / 2 - 3)))), TB('Apoio para Taças', W - 6, 2, 3, 0, H - 12, D / 2 - 4)],
  suporteMonitor: (W, H, D) => [B('Tampo do Suporte', W, T, D, 0, H - T, 0), ...[-1, 1].map((a) => B('Lateral do Suporte', T, H - T, D - 2, a * (W / 2 - T / 2), 0, 0))],
  caixaBrinquedos: (W, H, D) => [B('Base Inferior', W, T, D, 0, 4, 0), ...[-1, 1].map((a) => B(a < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita', T, H - 4, D, a * (W / 2 - T / 2), 4, 0)), B('Travessa Fixa Frente', W - 2 * T, H - 4, T, 0, 4, D / 2 - T / 2), B('Travessa Fixa Fundo', W - 2 * T, H - 4, T, 0, 4, -D / 2 + T / 2), rot(B('Tampa do Baú', W, T, D, 0, H, -2), -6, 0, 0), ...[-1, 1].flatMap((a) => [-1, 1].map((b) => CY('Rodízio', 5, 4, a * (W / 2 - 6), 0, b * (D / 2 - 6), { c: 'rubber' })))],
  nichos: (W, H, D) => [0, 1, 2].flatMap((i) => { const x = (i - 1) * (W / 3 + 1); return [B(`Parede Lateral Esquerda ${i + 1}`, T, W / 3, D, x - W / 6 + T / 2, 120 + (i % 2) * 16, 0), B(`Parede Lateral Direita ${i + 1}`, T, W / 3, D, x + W / 6 - T / 2, 120 + (i % 2) * 16, 0), B(`Travessa Fixa Superior ${i + 1}`, W / 3, T, D, x, 120 + W / 3 - T + (i % 2) * 16, 0), B(`Travessa Fixa Inferior ${i + 1}`, W / 3, T, D, x, 120 + (i % 2) * 16, 0)]; }),
  penteadeira: (W, H, D, flip) => [...tbl(W, 76, D, { drawer: 2 }), flip ? rot(B('Tampo Basculante com Espelho', W - 10, 2, 28, 0, 78, -D / 2 + 20, { c: 'mirror' }), -55, 0, 0) : B('Espelho do Camarim', W - 10, H - 76, 1, 0, 80, -D / 2 + 3, { c: 'mirror' }), ...(flip ? [] : [AC(69, -W / 2 + 6, 78 + (H - 76) / 2, -D / 2 + 5, { h: H - 84, w: 1.2 }), AC(69, W / 2 - 6, 78 + (H - 76) / 2, -D / 2 + 5, { h: H - 84, w: 1.2 }), AC(69, 0, H - 4, -D / 2 + 5, { w: W - 14 })])],
  bancadaCuba: (W, H, D) => [B('Tampo de Madeira Naval', W, 4, D, 0, H - 4, 0), CY('Cuba de Apoio', 38, 12, 0, H, 0, { c: 'stone' }), ...[-1, 1].map((a) => B('Mão francesa', 3, 24, D - 8, a * (W / 2 - 12), H - 28, 0, { c: 'iron' }))],
  espelheira: (W, H, D) => [...cab(W, H, D, { foot: 'none', doors: 2, mirror: true, shelves: 2, yb: 100, top: 0 })],
  tanque: (W, H, D) => [...cab(W, H - 12, D, { doors: 2, drawers: 0, foot: 'rod', top: 0, shelves: 0 }), B('Tampo do Tanque', W + 2, 4, D + 2, 0, H - 16, 0, { c: 'stone' }), B('Cuba do Tanque', W * 0.5, 14, D * 0.7, 0, H - 12, 0, { c: 'stone' })],
  toalhas: (W, H, D) => [0, 1, 2].map((i) => B(`Nicho ${i + 1}`, W, 24, D, 0, 100 + i * 26, 0)),
  mesaDobravelParede: (W, H, D) => [B('Tampo Rebatível', W, 2.5, D, 0, H - 2.5, D / 2), ...[-1, 1].map((a) => rot(B('Mão francesa', 3, 40, 3, a * (W / 2 - 8), H - 42, D / 2 - 2, { c: 'iron' }), -30, 0, 0)), B('Painel de Fixação', W, 10, 2, 0, H - 12, 0)],
  parede: (W, H, D) => [B('Prateleira de Estudo', W, 3, D, 0, H - 3, 0), ...[-1, 1].map((a) => B('Suporte invisível', 1, 15, 1, a * (W / 2 - 15), H - 18, -D / 4, { c: 'iron' }))],
  portaTemperos: (W, H, D) => [0, 1, 2].map((i) => B(`Prateleira ${i + 1}`, W, 2, D, 0, 90 + i * 22, 0)).concat([B('Fundo', W, 54, 1, 0, 90, -D / 2)]),
  fruteira: (W, H, D) => cab(W, H, D, { drawers: 3, foot: 'pe', wheels: false, pull: true }),
  cantoAlemao: (W, H, D) => [...rotY90(seat(150, 85, 45, { sh: 45, back: true, pad: false })).map((q) => ({ ...q, x: q.x - W / 2 + 22 })), ...seat(W - 50, 85, 45, { sh: 45, z: -D / 2 + 22 }), ...tbl(W - 40, 76, D - 40, { x: 20, z: 10 })],
  tampoElevavel: () => [],
  homeTheater: (W, H) => [...cab(W * 0.5, 48, 40, { doors: 2, drawers: 1, foot: 'pe', z: 5 }), ...panelTV(W, H, 'rip', { z: -18 }), ...[-1, 1].flatMap((a) => shelf(W * 0.22, H, 25, { n: 4, style: 'liv', x: a * (W * 0.39), z: -3 })), AC(69, 0, 54, -15, { w: W * 0.45 })],
  escritorioL: (W, H, D) => [...tbl(W, H, D * 0.6, { legs: 'reta', drawer: 1 }), ...tbl(D, H, W * 0.5, { legs: 'reta', x: -W / 2 + D / 2, z: W * 0.2 }).filter((q) => q.n !== 'Perna').map((q) => q)],
  closetAberto: (W, H, D) => [...[-1, 1].map((a) => B(a < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita', T, H, D, a * (W / 2 - T / 2), 0, 0)), B('Tampo Superior', W, T, D, 0, H - T, 0), B('Base Inferior', W, T, D, 0, 0, 0), AC(96, 0, H - 30, 0, { h: W - 6 }), AC(97, -W / 2 + 6, H - 24, 0), AC(97, W / 2 - 6, H - 24, 0), B('Prateleira 1', W / 2 - 4, T, D - 2, -W / 4, H - 70, 0), B('Prateleira 2', W / 2 - 4, T, D - 2, W / 4, H * 0.5, 0), B('Prateleira 3', W / 2 - 4, T, D - 2, W / 4, H * 0.3, 0), AC(100, W / 4, 30, 0)],
  cabeceira: (W, H, kind) => kind === 'pad' ? [B('Cabeceira Estofada', W, H, 6, 0, 0, 0, { c: 'fabric' }), B('Moldura de Madeira', W + 6, 4, 8, 0, H, 0), ...[-1, 1].map((a) => B('Moldura de Madeira', 4, H, 8, a * (W / 2 + 1), 0, 0))] : kind === 'rip' ? [B(`Painel Ripado (${Math.round(W / 4.5)} ripas)`, W, H, 3, 0, 0, 0, { t: 'ripado' })] : [B('Cabeceira', W, H, 5, 0, 0, 0), ...[-1, 1].flatMap((a) => cab(40, 40, 35, { foot: 'none', drawers: 1, yb: 40, x: a * (W / 2 + 20), z: 14 }))],
  mesinhaInfantil: () => [...tbl(60, 50, 60, { legs: 'reta' }), ...seat(30, 55, 30, { sh: 30, x: -22, z: 45, rec: -6 }), ...seat(30, 55, 30, { sh: 30, x: 22, z: 45, rec: -6 })],
  bar: (W, H, D) => [...cab(W, H, D, { doors: 2, foot: 'pe', glass: true, shelves: 1 }), B('Porta-taças', W - 10, 2, 8, 0, H - 14, D / 2 - 8, { c: 'alu' }), B('Adega Colmeia', W * 0.3, 24, D - 8, -W * 0.3, 14, 0, { c: 'black' })],
  ilha: (W, H, D) => [...cab(W, H, D, { doors: 3, foot: 'rod', top: 14, shelves: 0 }), ...[-1, 1].flatMap((a) => seat(34, 62, 34, { sh: 62, x: a * 40, z: D / 2 + 30, back: false, round: true }))],
  torreQuente: (W, H, D) => [...cab(W, H, D, { doors: 1, drawers: 1, foot: 'rod', shelves: 1 }), B('Nicho do Forno', W - 8, 60, D - 6, 0, 100, 0, { c: 'black' }), B('Nicho do Micro-ondas', W - 8, 36, D - 6, 0, 164, 0, { c: 'black' })],
  passaPratos: (W, H, D) => [...cab(W, H - 6, D, { doors: 3, drawers: 2, foot: 'rod', top: 0 }), B('Balcão Gourmet (ressalto)', W + 4, 3, 20, 0, H - 3, D / 2 + 10)],
  adegaColmeia: (W, H, D) => shelf(W, H, D, { style: 'col' }).concat([AC(115, 0, 5, D / 2, { w: W * 0.6 })]),
  sapateiraSlim: (W, H, D) => cab(W, H, D, { flaps: 3, foot: 'pe', top: 0 }),
  bancoSapateira: (W, H, D) => [...seat(W, 45, D, { sh: 45, back: false, pad: true }).filter((q) => !/Perna/.test(q.n)), ...[-1, 1].map((a) => B('Parede Lateral', T, 38, D, a * (W / 2 - T / 2), 0, 0)), B('Prateleira 1', W - 2 * T, T, D - 3, 0, 18, 0), B('Base Inferior', W - 2 * T, T, D - 3, 0, 0, 0), B('Fundo', W - 2 * T, 38, 0.6, 0, 2, -D / 2 + 0.3)],
  console: (W, H, D) => tbl(W, H, D, { legs: 'palito', drawer: 1, shelf: true }),
  recamier: (W, H, D) => [...seat(W, H, D, { sh: H, back: false, pad: true }), B('Moldura do Recamier', W + 2, 6, D + 2, 0, 8, 0)],
  namoradeira: (W, H, D) => seat(W, H, D, { sh: 42, pad: true, rec: -8, arms: true }),
  mancebo2: (W, H) => R.mancebo(W, H)
};

/* ---------- Tabela dos 110 móveis ---------- */
// [id, grupo, nome, palavras-chave (sem acento, separadas por |), L, A, P, receita(L,A,P)]
const F = [
  [1, 'sala', 'Rack baixo tradicional', 'rack baixo|rack tradicional|rack de tv', 180, 50, 40, (W, H, D) => cab(W, H, D, { doors: 2, drawers: 1, foot: 'rod' })],
  [2, 'sala', 'Rack suspenso', 'rack suspenso', 180, 38, 38, (W, H, D) => cab(W, H, D, { doors: 2, foot: 'none', yb: 45 })],
  [3, 'sala', 'Rack estilo retrô (pés palito)', 'rack retro|rack pe palito|rack pes palito', 160, 60, 40, (W, H, D) => cab(W, H, D, { doors: 2, foot: 'stick' })],
  [4, 'sala', 'Painel para TV liso', 'painel para tv liso|painel de tv liso|painel liso', 200, 170, 3, (W, H) => panelTV(W, H, 'liso', { z: 0 })],
  [5, 'sala', 'Painel ripado para TV', 'painel ripado para tv|painel de tv ripado|painel ripado', 200, 170, 3, (W, H) => panelTV(W, H, 'rip', { z: 0 })],
  [6, 'sala', 'Painel com iluminação LED embutida', 'painel com led|painel de tv com led|painel com iluminacao', 200, 170, 3, (W, H) => panelTV(W, H, 'led', { z: 0 })],
  [7, 'sala', 'Home theater completo', 'home theater', 320, 200, 45, (W, H) => R.homeTheater(W, H)],
  [8, 'sala', 'Mesa de centro retangular', 'mesa de centro retangular|mesa de centro', 100, 40, 60, (W, H, D) => tbl(W, H, D, { legs: 'reta', shelf: true })],
  [9, 'sala', 'Mesa de centro redonda ou orgânica', 'mesa de centro redonda|mesa de centro organica', 80, 40, 80, (W, H) => tbl(W, H, W, { round: true, legs: 'palito' })],
  [10, 'sala', 'Mesa de centro com tampo elevável', 'mesa de centro elevavel|tampo elevavel', 100, 45, 55, (W, H, D) => tbl(W, H, D, { legs: 'reta', lift: true })],
  [11, 'sala', 'Mesa lateral / de apoio', 'mesa lateral|mesa de apoio', 45, 55, 45, (W, H, D) => tbl(W, H, D, { legs: 'palito' })],
  [12, 'sala', 'Mesa de canto', 'mesa de canto', 50, 55, 50, (W, H, D) => tbl(W, H, D, { legs: 'reta', shelf: true })],
  [13, 'sala', 'Aparador de sala', 'aparador de sala|aparador sala', 160, 80, 40, (W, H, D) => cab(W, H, D, { doors: 2, drawers: 2, foot: 'stick' })],
  [14, 'sala', 'Aparador bar (adega e porta-taças)', 'aparador bar|bar com adega|aparador com adega', 150, 95, 45, (W, H, D) => R.bar(W, H, D)],
  [15, 'sala', 'Estante livreiro', 'estante livreiro|livreiro', 100, 200, 30, (W, H, D) => shelf(W, H, D, { n: 5 })],
  [16, 'sala', 'Estante colmeia / vazada', 'estante colmeia|estante vazada|colmeia', 120, 140, 30, (W, H, D) => shelf(W, H, D, { style: 'col' })],
  [17, 'sala', 'Estante escada', 'estante escada', 80, 180, 40, (W, H, D) => shelf(W, H, D, { style: 'esc', n: 5 })],
  [18, 'sala', 'Estante industrial (madeira e metalon)', 'estante industrial|estante metalon', 100, 180, 35, (W, H, D) => shelf(W, H, D, { style: 'ind', n: 4 })],
  [19, 'sala', 'Cristaleira com portas de vidro', 'cristaleira', 90, 190, 40, (W, H, D) => cab(W, H, D, { doors: 2, glass: true, shelves: 3 })],
  [20, 'sala', 'Banco namoradeira de madeira', 'banco namoradeira|namoradeira de madeira', 110, 85, 55, (W, H, D) => R.namoradeira(W, H, D)],
  [21, 'sala', 'Revisteiro de chão', 'revisteiro', 40, 40, 20, (W, H, D) => R.revisteiro(W, H, D)],
  [22, 'sala', 'Floreira / suporte para plantas', 'floreira|suporte para plantas|suporte de plantas', 80, 60, 25, (W, H, D) => R.floreira(W, H, D)],
  [23, 'quarto', 'Cama de casal convencional', 'cama de casal|cama casal', 138, 90, 188, (W, H, D) => bed(W, D, { hb: H })],
  [24, 'quarto', 'Cama queen size', 'cama queen', 158, 95, 198, (W, H, D) => bed(W, D, { hb: H })],
  [25, 'quarto', 'Cama king size', 'cama king', 193, 100, 203, (W, H, D) => bed(W, D, { hb: H })],
  [26, 'quarto', 'Cama de solteiro', 'cama de solteiro|cama solteiro', 88, 80, 188, (W, H, D) => bed(W, D, { hb: H })],
  [27, 'quarto', 'Cama box baú', 'cama box bau|cama bau|box bau', 138, 90, 188, (W, H, D) => bed(W, D, { hb: H, baul: true, levels: [32] })],
  [28, 'quarto', 'Cama com gavetas embutidas', 'cama com gavetas|cama gavetas', 138, 90, 188, (W, H, D) => bed(W, D, { hb: H, drawers: 2 })],
  [29, 'quarto', 'Cama bicama (com cama auxiliar)', 'bicama|cama auxiliar', 88, 80, 188, (W, H, D) => bed(W, D, { hb: H, bi: true, levels: [38] })],
  [30, 'quarto', 'Cama japonesa / plataforma', 'cama japonesa|cama plataforma|cama baixa', 158, 60, 198, (W, H, D) => bed(W, D, { hb: H, levels: [22], head: 'tall', mat: 16 })],
  [31, 'quarto', 'Beliche', 'beliche', 88, 160, 188, (W, H, D) => bed(W, D, { levels: [35, 120], post: 40, ladder: true, head: 'none' })],
  [32, 'quarto', 'Treliche', 'treliche', 88, 190, 188, (W, H, D) => bed(W, D, { levels: [30, 95, 160], post: 40, ladder: true, head: 'none' })],
  [33, 'quarto', 'Cama suspensa / mezanino com escrivaninha', 'cama suspensa|mezanino|cama alta', 88, 190, 188, (W, H, D) => bed(W, D, { levels: [150], post: 40, ladder: true, head: 'none', desk: true })],
  [34, 'quarto', 'Cabeceira estofada com moldura', 'cabeceira estofada', 160, 110, 8, (W, H) => R.cabeceira(W, H, 'pad')],
  [35, 'quarto', 'Cabeceira ripada', 'cabeceira ripada', 160, 110, 4, (W, H) => R.cabeceira(W, H, 'rip')],
  [36, 'quarto', 'Cabeceira com mesas acopladas', 'cabeceira com mesas|cabeceira com criado', 160, 110, 5, (W, H) => R.cabeceira(W, H, 'mesas')],
  [37, 'quarto', 'Mesa de cabeceira tradicional', 'mesa de cabeceira|criado mudo', 45, 55, 40, (W, H, D) => cab(W, H, D, { drawers: 2, foot: 'stick' })],
  [38, 'quarto', 'Mesa de cabeceira suspensa', 'cabeceira suspensa|criado suspenso', 45, 25, 35, (W, H, D) => cab(W, H, D, { drawers: 1, foot: 'none', yb: 40 })],
  [39, 'quarto', 'Guarda-roupa com portas de abrir', 'guarda-roupa com portas de abrir|guarda roupa de abrir|guarda-roupa de abrir', 200, 230, 58, (W, H, D) => cab(W, H, D, { doors: 4, drawers: 3, foot: 'rod', shelves: 2 })],
  [40, 'quarto', 'Guarda-roupa com portas de correr', 'guarda-roupa de correr|guarda-roupa com portas de correr|guarda roupa de correr|portas de correr', 240, 250, 60, (W, H, D) => cab(W, H, D, { doors: 3, slide: true, foot: 'rod', shelves: 3 })],
  [41, 'quarto', 'Guarda-roupa de canto (em L)', 'guarda-roupa de canto|guarda-roupa em l|guarda roupa de canto', 160, 230, 58, (W, H, D) => [...cab(W, H, D, { doors: 3, foot: 'rod' }), ...rotY90(cab(W * 0.8, H, D, { doors: 2, foot: 'rod' })).map((q) => ({ ...q, x: q.x - W / 2 - D / 2, z: q.z + W * 0.4 - D / 2 }))]],
  [42, 'quarto', 'Módulo de closet aberto (arara e prateleiras)', 'closet aberto|modulo de closet|arara', 160, 220, 50, (W, H, D) => R.closetAberto(W, H, D)],
  [43, 'quarto', 'Cômoda tradicional', 'comoda tradicional|comoda', 100, 90, 45, (W, H, D) => cab(W, H, D, { drawers: 4, foot: 'stick' })],
  [44, 'quarto', 'Cômoda sapateira', 'comoda sapateira', 80, 120, 35, (W, H, D) => cab(W, H, D, { flaps: 3, foot: 'stick', top: 0 })],
  [45, 'quarto', 'Penteadeira camarim (espelho e luzes)', 'penteadeira camarim|camarim|penteadeira com luz', 100, 150, 45, (W, H, D) => R.penteadeira(W, H, D, false)],
  [46, 'quarto', 'Penteadeira com tampo basculante', 'penteadeira basculante|penteadeira com tampo', 90, 100, 45, (W, H, D) => R.penteadeira(W, H, D, true)],
  [47, 'quarto', 'Recamier / baú para pés da cama', 'recamier|bau para cama|bau pes da cama', 140, 45, 45, (W, H, D) => R.recamier(W, H, D)],
  [48, 'infantil', 'Berço padrão americano', 'berco padrao americano|berco americano|berco', 70, 90, 130, (W, H, D) => crib(W, D)],
  [49, 'infantil', 'Berço evolutivo (vira minicama)', 'berco evolutivo', 70, 90, 130, (W, H, D) => crib(W, D, { low: true })],
  [50, 'infantil', 'Minicama infantil', 'minicama|mini cama', 80, 60, 160, (W, H, D) => bed(W, D, { levels: [28], hb: 50, side: true })],
  [51, 'infantil', 'Cama montessoriana (casinha no chão)', 'montessoriana|cama casinha|casinha no chao', 90, 120, 180, (W, H, D) => bed(W, D, { levels: [18], hb: 40, house: true, head: 'none', mat: 12 })],
  [52, 'infantil', 'Cômoda trocador', 'comoda trocador|trocador', 90, 95, 50, (W, H, D) => [...cab(W, H - 12, D, { drawers: 3, foot: 'pe' }), ...[-1, 1].map((a) => B('Grade do Trocador', 2, 12, D, a * (W / 2 - 1), H - 12, 0)), B('Grade do Trocador', W, 12, 2, 0, H - 12, -D / 2 + 1)]],
  [53, 'infantil', 'Baú organizador de brinquedos', 'bau de brinquedos|bau organizador|brinquedos', 80, 45, 40, (W, H, D) => R.caixaBrinquedos(W, H, D)],
  [54, 'infantil', 'Estante montessoriana (baixa)', 'estante montessoriana', 90, 80, 30, (W, H, D) => shelf(W, H, D, { style: 'mont', n: 2, foot: 0 })],
  [55, 'infantil', 'Guarda-roupa infantil', 'guarda-roupa infantil|guarda roupa infantil', 110, 170, 50, (W, H, D) => cab(W, H, D, { doors: 2, drawers: 2, foot: 'rod' })],
  [56, 'infantil', 'Mesinha infantil com cadeirinhas', 'mesinha infantil|mesa infantil', 60, 50, 60, () => R.mesinhaInfantil()],
  [57, 'infantil', 'Nichos decorativos de parede', 'nichos decorativos|nichos de parede', 90, 160, 20, (W, H, D) => R.nichos(W, H, D)],
  [58, 'cozinha', 'Mesa de jantar retangular', 'mesa de jantar retangular|mesa de jantar|mesa jantar', 180, 76, 90, (W, H, D) => tbl(W, H, D, { legs: 'reta', apron: true })],
  [59, 'cozinha', 'Mesa de jantar redonda', 'mesa de jantar redonda|mesa redonda', 110, 76, 110, (W, H) => tbl(W, H, W, { round: true, legs: 'central' })],
  [60, 'cozinha', 'Mesa de jantar extensível / dobrável', 'mesa extensivel|mesa de jantar extensivel|mesa dobravel de jantar', 140, 76, 90, (W, H, D) => tbl(W, H, D, { legs: 'reta', ext: true, apron: true })],
  [61, 'cozinha', 'Mesa de jantar canto alemão', 'canto alemao', 170, 85, 170, (W, H, D) => R.cantoAlemao(W, H, D)],
  [62, 'cozinha', 'Cadeira de jantar toda em madeira', 'cadeira de madeira|cadeira de jantar de madeira|cadeira de jantar', 45, 90, 45, (W, H, D) => seat(W, H, D, { sh: 46 })],
  [63, 'cozinha', 'Cadeira de jantar com assento estofado', 'cadeira estofada|cadeira com assento estofado', 45, 90, 45, (W, H, D) => seat(W, H, D, { sh: 46, pad: true })],
  [64, 'cozinha', 'Banco reto para mesa de jantar', 'banco reto|banco para mesa de jantar|banco de jantar', 140, 46, 35, (W, H, D) => seat(W, H, D, { sh: 46, back: false })],
  [65, 'cozinha', 'Banqueta alta para bancada / ilha', 'banqueta alta|banqueta de ilha|banqueta para bancada', 36, 100, 36, (W, H, D) => seat(W, H, D, { sh: 65, stretcher: true, rec: -4 })],
  [66, 'cozinha', 'Banqueta baixa / tamborete', 'banqueta baixa|tamborete|banquinho', 34, 45, 34, (W, H) => seat(W, H, W, { sh: 45, round: true, back: false })],
  [67, 'cozinha', 'Buffet / balcão aparador de jantar', 'buffet|balcao aparador', 180, 85, 45, (W, H, D) => cab(W, H, D, { doors: 3, drawers: 3, foot: 'stick' })],
  [68, 'cozinha', 'Armário aéreo de cozinha', 'armario aereo|aereo de cozinha', 120, 70, 35, (W, H, D) => cab(W, H, D, { doors: 2, foot: 'none', yb: 140, shelves: 1 })],
  [69, 'cozinha', 'Balcão inferior de cozinha (pia ou cooktop)', 'balcao inferior|balcao de cozinha|balcao de pia|balcao cooktop', 160, 85, 56, (W, H, D) => cab(W, H, D, { doors: 3, drawers: 2, foot: 'rod' })],
  [70, 'cozinha', 'Torre quente (forno e micro-ondas)', 'torre quente|torre de forno', 60, 210, 56, (W, H, D) => R.torreQuente(W, H, D)],
  [71, 'cozinha', 'Paneleiro / despenseiro alto', 'paneleiro|despenseiro', 60, 210, 56, (W, H, D) => cab(W, H, D, { doors: 2, drawers: 3, foot: 'rod', shelves: 4 })],
  [72, 'cozinha', 'Ilha de cozinha com tampo de madeira', 'ilha de cozinha|ilha gourmet|ilha', 160, 90, 80, (W, H, D) => R.ilha(W, H, D)],
  [73, 'cozinha', 'Balcão passa-pratos / gourmet', 'passa-pratos|passa pratos|balcao gourmet', 180, 105, 50, (W, H, D) => R.passaPratos(W, H, D)],
  [74, 'cozinha', 'Fruteira de chão com gavetas', 'fruteira de chao|fruteira', 40, 70, 35, (W, H, D) => R.fruteira(W, H, D)],
  [75, 'cozinha', 'Carrinho bar / auxiliar com rodízios', 'carrinho bar|carrinho auxiliar|carrinho de cozinha', 70, 85, 40, (W, H, D) => R.carrinho(W, H, D)],
  [76, 'cozinha', 'Adega climatizada ou colmeia para vinhos', 'adega|colmeia para vinhos', 90, 120, 30, (W, H, D) => R.adegaColmeia(W, H, D)],
  [77, 'cozinha', 'Porta-temperos de parede', 'porta-temperos|porta temperos|tempero de parede', 40, 160, 12, (W, H, D) => R.portaTemperos(W, H, D)],
  [78, 'escritorio', 'Escrivaninha reta simples', 'escrivaninha reta|escrivaninha simples|escrivaninha', 140, 75, 60, (W, H, D) => tbl(W, H, D, { legs: 'reta', apron: true })],
  [79, 'escritorio', 'Escrivaninha com gaveteiro embutido', 'escrivaninha com gaveteiro|mesa com gaveteiro', 150, 75, 60, (W, H, D) => [...tbl(W, H, D, { legs: 'painel' }), ...cab(40, H - 3, D - 4, { drawers: 3, foot: 'none', top: 0, x: W / 2 - 26 }).filter((q) => !/Tampo|Fundo/.test(q.n))]],
  [80, 'escritorio', 'Mesa de escritório em L (de canto)', 'mesa em l|mesa de canto escritorio|escritorio em l|mesa de escritorio em l', 160, 75, 160, (W, H, D) => R.escritorioL(W, H, D)],
  [81, 'escritorio', 'Mesa estilo cavalete', 'mesa cavalete|cavalete', 160, 75, 70, (W, H, D) => tbl(W, H, D, { legs: 'cavalete' })],
  [82, 'escritorio', 'Bancada de estudo suspensa', 'bancada de estudo|bancada suspensa', 120, 80, 45, (W, H, D) => R.parede(W, H, D)],
  [83, 'escritorio', 'Mesa dobrável de parede', 'mesa dobravel de parede|mesa rebativel|mesa de parede', 90, 75, 50, (W, H, D) => R.mesaDobravelParede(W, H, D)],
  [84, 'escritorio', 'Gaveteiro volante (com rodízios)', 'gaveteiro volante|gaveteiro com rodizios|gaveteiro', 40, 60, 45, (W, H, D) => cab(W, H, D, { drawers: 3, foot: 'none', wheels: true })],
  [85, 'escritorio', 'Armário arquivo para pastas', 'armario arquivo|arquivo para pastas|arquivo', 50, 130, 50, (W, H, D) => cab(W, H, D, { drawers: 4, foot: 'rod' })],
  [86, 'escritorio', 'Credenza (armário baixo de apoio)', 'credenza', 160, 70, 45, (W, H, D) => cab(W, H, D, { doors: 2, drawers: 2, foot: 'stick' })],
  [87, 'escritorio', 'Estante para livros e documentos', 'estante para livros|estante de documentos|estante para documentos', 90, 180, 30, (W, H, D) => shelf(W, H, D, { n: 4 })],
  [88, 'escritorio', 'Suporte elevado de madeira para monitor', 'suporte para monitor|suporte de monitor|elevador de monitor', 60, 12, 22, (W, H, D) => R.suporteMonitor(W, H, D)],
  [89, 'escritorio', 'Mesa de reunião', 'mesa de reuniao|mesa de reuniao', 240, 75, 110, (W, H, D) => tbl(W, H, D, { legs: 'painel' })],
  [90, 'banheiro', 'Gabinete de banheiro suspenso', 'gabinete suspenso|gabinete de banheiro suspenso', 80, 50, 46, (W, H, D) => cab(W, H, D, { doors: 1, drawers: 1, foot: 'none', yb: 45 })],
  [91, 'banheiro', 'Gabinete de banheiro com pés', 'gabinete com pes|gabinete de banheiro com pes|gabinete de banheiro', 80, 80, 46, (W, H, D) => cab(W, H, D, { drawers: 2, foot: 'stick' })],
  [92, 'banheiro', 'Bancada de madeira naval para cuba', 'madeira naval|bancada para cuba|bancada de cuba', 120, 85, 50, (W, H, D) => R.bancadaCuba(W, H, D)],
  [93, 'banheiro', 'Espelheira com armário embutido', 'espelheira', 60, 70, 15, (W, H, D) => R.espelheira(W, H, D)],
  [94, 'banheiro', 'Prateleira / nicho para toalhas', 'nicho para toalhas|prateleira para toalhas|toalheiro', 60, 40, 18, (W, H, D) => R.toalhas(W, H, D)],
  [95, 'lavanderia', 'Armário multiuso / lavanderia', 'armario multiuso|armario de lavanderia|armario lavanderia', 80, 190, 40, (W, H, D) => cab(W, H, D, { doors: 2, foot: 'rod', shelves: 4 })],
  [96, 'lavanderia', 'Armário aéreo para área de serviço', 'aereo area de servico|aereo de servico|aereo de lavanderia', 100, 60, 30, (W, H, D) => cab(W, H, D, { doors: 2, foot: 'none', yb: 150, shelves: 1 })],
  [97, 'lavanderia', 'Balcão para tanque', 'balcao para tanque|balcao de tanque|gabinete de tanque', 110, 85, 55, (W, H, D) => R.tanque(W, H, D)],
  [98, 'lavanderia', 'Cesto de roupas sujas ripado', 'cesto de roupas|cesto ripado|cesto de roupa suja', 45, 60, 35, (W, H, D) => R.cesto(W, H, D)],
  [99, 'hall', 'Sapateira slim / basculante de entrada', 'sapateira slim|sapateira basculante|sapateira de entrada', 70, 110, 20, (W, H, D) => R.sapateiraSlim(W, H, D)],
  [100, 'hall', 'Banco sapateira para hall', 'banco sapateira', 100, 45, 35, (W, H, D) => R.bancoSapateira(W, H, D)],
  [101, 'hall', 'Cabideiro de parede com prateleira', 'cabideiro de parede|cabideiro com prateleira', 80, 35, 20, (W, H, D) => R.cabideiroParede(W, H, D)],
  [102, 'hall', 'Mancebo (cabideiro de chão)', 'mancebo|cabideiro de chao', 45, 175, 45, (W, H) => R.mancebo(W, H)],
  [103, 'hall', 'Console / aparador estreito de entrada', 'console|aparador estreito|aparador de entrada', 120, 80, 30, (W, H, D) => R.console(W, H, D)],
  [104, 'hall', 'Biombo divisório de ambiente', 'biombo|divisoria de ambiente', 180, 170, 4, (W, H) => R.biombo(W, H)],
  [105, 'hall', 'Banco de jardim / praça (madeira maciça)', 'banco de jardim|banco de praca', 150, 85, 55, (W, H, D) => R.jardimBanco(W, H, D)],
  [106, 'hall', 'Namoradeira de varanda', 'namoradeira de varanda|namoradeira externa', 120, 85, 60, (W, H, D) => R.jardimBanco(W, H, D).map((q) => ({ ...q, c: WD }))],
  [107, 'hall', 'Espreguiçadeira de madeira (deck/piscina)', 'espreguicadeira|espreguicadeira de madeira|chaise de deck', 65, 70, 190, (W, H, D) => R.espreguicadeira(W, H, D)],
  [108, 'hall', 'Mesa dobrável de varanda / bistrô', 'mesa bistro|mesa de varanda|mesa dobravel de varanda', 70, 75, 70, (W, H) => tbl(W, H, W, { round: true, legs: 'central', tt: 2 })],
  [109, 'hall', 'Pergolado de madeira', 'pergolado', 300, 250, 300, (W, H, D) => R.pergolado(W, H, D)],
  [110, 'hall', 'Painel vertical de madeira para jardim', 'painel vertical|painel de jardim', 150, 200, 6, (W, H) => R.painelJardim(W, H)]
];

export const FURN = F.map(([id, grp, name, kw, W, H, D, fn]) => ({ id, grp, name, kw: kw.split('|'), W, H, D, fn }));
export const FURN_GROUPS = { sala: 'Sala', quarto: 'Quarto', infantil: 'Infantil', cozinha: 'Cozinha', escritorio: 'Escritório', banheiro: 'Banheiro', lavanderia: 'Lavanderia', hall: 'Hall e Varanda' };

// Acha o móvel pelas palavras do pedido (vence a frase mais longa).
export function matchFurniture(text) {
  let best = null, len = 0;
  FURN.forEach((f) => f.kw.forEach((k) => { if (k.length > len && text.includes(k)) { best = f; len = k.length; } }));
  return best;
}

// Gera o spec "custom" (lista de peças) já com as dimensões finais.
export function makeFurniture(f, W, H, D, base = {}) {
  const parts = f.fn(W, H, D).filter((q) => q.w > 0 && q.h > 0 && q.d > 0);
  const lo = (k, s) => Math.min(...parts.map((q) => q[k] - s * q[k === 'x' ? 'w' : k === 'y' ? 'h' : 'd'] / 2));
  const hi = (k, s) => Math.max(...parts.map((q) => q[k] + s * q[k === 'x' ? 'w' : k === 'y' ? 'h' : 'd'] / 2));
  const cx = (lo('x', 1) + hi('x', 1)) / 2, cz = (lo('z', 1) + hi('z', 1)) / 2;
  const cen = parts.map((q) => ({ ...q, x: r1(q.x - cx), z: r1(q.z - cz) }));
  return {
    doorCount: 0, hasShelf: true, hasDrawers: true, isAutoImagined: false, suggestedFinish: null, ...base,
    category: 'custom', displayTitle: f.name, parts: cen, catalogId: `F-${String(f.id).padStart(3, '0')}`,
    wCm: Math.round(hi('x', 1) - lo('x', 1)), hCm: Math.round(hi('y', 1)), dCm: Math.round(hi('z', 1) - lo('z', 1))
  };
}
