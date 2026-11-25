// Lista de ferragens, parafusos e tamanhos ideais para o projeto atual.
// Painéis do site: 22 mm. Tampos de metalon: 30 mm.
const SLIDES = [25, 30, 35, 40, 45, 50, 55, 60];
const STRUCT = /^(Parede Lateral|Divisória|Base (Inferior|Balcão|Armário)|Tampo (Superior|Armário|Encabeçado)|Prateleira Maleiro|Travessa|Lateral Aéreo)/;

export function computeBOM(spec, parts) {
  const out = [];
  const add = (item, qty, note = '') => { if (qty > 0) out.push({ item, qty, note }); };
  const w = spec.wCm, h = spec.hCm, d = spec.dCm;

  if (spec.category === 'metalon') {
    const L = (spec.levels || 0) + 1;
    const lenRail = Math.round(w - 8), lenSide = Math.round(d - 8), legH = Math.round(h - 3);
    add(`Metalon 30 × 30 × 1,2 mm, perna de ${legH} cm`, 4, 'corte reto a 90°');
    add(`Metalon 30 × 30 × 1,2 mm, travessa de ${lenRail} cm`, 2 * L, 'frente e fundo de cada nível');
    add(`Metalon 30 × 30 × 1,2 mm, travessa de ${lenSide} cm`, 2 * L, 'laterais de cada nível');
    add('Pontos de solda MIG (cordões)', 8 * L + 0, 'esmerilhar e aplicar fundo anticorrosivo');
    add('Parafuso chipboard 4,0 × 25 mm', L * (w > 120 ? 8 : 6), 'tampo de 30 mm: parafuso menor que a espessura para não atravessar');
    add('Sapata nivelador de nylon 30 × 30', 4);
    return out;
  }

  const find = (re) => parts.filter((p) => re.test(p.name));
  const T = 2.2;
  const conf = T <= 1.6 ? '7 × 40' : T <= 1.9 ? '7 × 50' : '7 × 60';

  let confirmats = 0;
  parts.forEach((p) => {
    const isShelfFixed = spec.category === 'estante' && /^Prateleira/.test(p.name);
    if ((STRUCT.test(p.name) || isShelfFixed) && p.dimsCm) confirmats += 2 * Math.max(2, Math.ceil((p.dimsCm.d || 40) / 25));
  });
  add(`Parafuso Confirmat ${conf} mm (painel 22 mm)`, confirmats, 'uma a cada 25 cm de profundidade, 2 por encontro');
  add('Cavilha de madeira 8 × 30 mm', confirmats, 'junto de cada Confirmat, trava o painel');

  if (spec.category !== 'estante') {
    const pins = find(/^Prateleira(?! Maleiro)/).length;
    add('Suporte de prateleira (pino Ø 5 mm)', pins * 4);
  }

  const doors = find(/^Porta/);
  const hinges = doors.reduce((s, p) => { const ph = p.dimsCm.h; return s + (ph <= 100 ? 2 : ph <= 160 ? 3 : ph <= 200 ? 4 : 5); }, 0);
  add('Dobradiça de caneco 35 mm com amortecedor', hinges, 'até 100 cm: 2 · até 160: 3 · até 200: 4 · acima: 5');
  add('Parafuso 3,5 × 13 mm (dobradiças)', hinges * 4, '2 na base + 2 no caneco');

  const drawers = find(/^Gaveta/);
  if (drawers.length) {
    const maxLen = (drawers[0].dimsCm.d || d) - 3;
    const slide = [...SLIDES].reverse().find((s) => s <= maxLen) || 25;
    add(`Corrediça telescópica ${slide} cm (par)`, drawers.length);
    add('Parafuso 3,5 × 13 mm (corrediças)', drawers.length * 12, '6 por trilho');
    add('Parafuso 4,0 × 40 mm (caixa da gaveta)', drawers.length * 8);
  }

  add('Puxador', doors.length + drawers.length);
  add('Parafuso M4 × 40 mm (puxador, painel 22 mm + 15 mm)', (doors.length + drawers.length) * 2);

  if (!['balcao_ripado'].includes(spec.category)) {
    add('Parafuso 3,0 × 16 mm (fundo de 6 mm)', Math.ceil((2 * (w + h)) / 20), 'a cada 20 cm no perímetro');
  }

  const rip = parts.find((p) => /ripas\)/.test(p.name));
  if (rip) {
    const n = +(rip.name.match(/\((\d+) ripas/) || [0, 0])[1];
    add('Pino de aço 1,2 × 25 mm (ripas) + cola PU', n * Math.ceil(rip.dimsCm.h / 20), 'um a cada 20 cm de ripa');
    add('Fita/perfil LED quente + fonte 12 V', 1);
  }

  if (find(/Cabideiro/).length) {
    add('Suporte de cabideiro oblongo', 2);
    add('Parafuso 3,5 × 16 mm (suportes)', 4);
  }
  if (find(/Pés/).length) add('Parafuso M8 × 30 mm com bucha de garra (pés)', 4);

  if (['armario_pia', 'guarda_roupa', 'armario', 'armario_cozinha'].includes(spec.category)) {
    add('Pé nivelador regulável', 4 + (w > 120 ? 2 : 0) + (w > 200 ? 2 : 0));
  }
  if (spec.category === 'armario_cozinha' && h >= 150) {
    const n = 2 * Math.ceil(w / 60);
    add('Suporte (mão-francesa) para armário aéreo', n);
    add('Bucha 8 mm + parafuso 6 × 60 mm (parede)', n, 'parede de alvenaria');
  }
  if (['guarda_roupa', 'estante', 'armario'].includes(spec.category) && h >= 120) {
    add('Esquadro antitombamento', 2);
    add('Bucha 8 mm + parafuso 4,5 × 50 mm (parede)', 2);
  }
  return out;
}

export const countScrews = (bom) => bom.filter((b) => /Parafuso|Confirmat|Pino de aço/.test(b.item)).reduce((s, b) => s + b.qty, 0);
