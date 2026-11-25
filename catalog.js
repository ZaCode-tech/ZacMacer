// Catálogo paramétrico: tipos-base x larguras x alturas x acabamentos (1.500+ móveis)
// fam|título|categoria|tipo|L|A|P|portas|níveis(prateleiras/gavetas)
const TYPES = `m|Armário de Pia|armario_pia||120|85|56|2|0
m|Gabinete de Banheiro|armario_pia||80|80|46|2|0
m|Guarda-Roupa 2 Portas|guarda_roupa||100|215|55|2|0
m|Guarda-Roupa 4 Portas|guarda_roupa||185|215|58|4|0
m|Guarda-Roupa Casal|guarda_roupa||240|230|60|6|0
m|Armário de Cozinha Completo|armario_cozinha||200|210|56|4|0
m|Cozinha Compacta|armario_cozinha||150|210|56|3|0
m|Balcão de Cozinha|armario_cozinha||160|90|56|3|0
m|Estante de Sala|estante||135|185|38|0|0
m|Estante Home Office|estante||100|180|30|0|0
m|Armário Multiuso|armario||110|165|48|2|0
m|Sapateira|armario||80|120|35|2|0
m|Despensa|armario||90|210|50|2|0
m|Armário de Lavanderia|armario||110|190|45|2|0
m|Cômoda|comoda||90|85|45|0|4
m|Criado-Mudo|comoda||45|50|40|0|2
m|Gaveteiro|comoda||60|75|45|0|3
i|Balcão Ripado com LED|balcao_ripado||175|94|56|0|0
i|Balcão de Recepção Ripado|balcao_ripado||200|105|60|0|0
i|Aparador Ripado|balcao_ripado||120|85|40|0|0
i|Bar em Casa Ripado|balcao_ripado||150|110|50|0|0
i|Balcão de Barbearia|balcao_ripado||160|100|55|0|0
i|Balcão para Loja|balcao_ripado||180|100|60|0|0
i|Estante Divisória de Ambientes|estante||150|180|35|0|0
i|Nichos Decorativos|estante||120|120|25|0|0
i|Cristaleira com Nichos|estante||110|190|35|0|0
s|Mesa de Jantar Metalon|metalon|mesa|160|76|80|0|0
s|Mesa de Centro Metalon|metalon|mesa|100|40|60|0|1
s|Escrivaninha Metalon|metalon|mesa|140|75|60|0|0
s|Rack de TV Metalon|metalon|rack|160|50|40|0|1
s|Estante Industrial Metalon|metalon|estante|100|180|35|0|4
s|Aparador Metalon|metalon|aparador|140|80|40|0|1
s|Banco Metalon|metalon|banco|100|45|35|0|0
s|Bancada Bar Metalon|metalon|mesa|140|105|50|0|1
s|Estante Closet Metalon|metalon|estante|120|200|40|0|5
s|Mesa de Cabeceira Metalon|metalon|mesa|45|55|35|0|1
s|Mesa Lateral Metalon|metalon|mesa|50|55|50|0|0
s|Bancada Oficina Metalon|metalon|mesa|180|90|70|0|1`.split('\n').map((l) => l.split('|'));

const FAMILIES = { m: 'Marcenaria', i: 'Ideias', s: 'Serralheria Metalon' };
const WF = [0.75, 0.9, 1, 1.15, 1.3, 1.5];
const HF = [0.9, 1, 1.1];
const FIN = [['espresso', 'Nogueira Espresso'], ['oat', 'Madeira Clara'], ['sage', 'Verde Sálvia']];
const r5 = (n) => Math.round(n / 5) * 5;

export const CATALOG = [];
const seen = new Set();
TYPES.forEach(([fam, title, category, kind, w, h, d, doors, levels]) => {
  WF.forEach((wf) => HF.forEach((hf) => FIN.forEach(([fin, finName]) => {
    const W = Math.max(40, r5(+w * wf));
    const H = Math.max(40, r5(+h * hf));
    const key = `${title}|${W}|${H}|${fin}`;
    if (seen.has(key)) return;
    seen.add(key);
    CATALOG.push({
      id: `M-${String(CATALOG.length + 1).padStart(4, '0')}`,
      fam, famName: FAMILIES[fam], title, category, kind, w: W, h: H, d: +d,
      bw: +w, doors: +doors, levels: +levels, fin,
      name: `${title} ${W} × ${H} cm`, finName: (fam === 's' ? 'Tampo ' : '') + finName
    });
  })));
});

export function specFromItem(it) {
  const doorCount = it.doors ? Math.min(6, Math.max(1, Math.round((it.doors * it.w) / it.bw))) : 0;
  return {
    category: it.category, kind: it.kind || null, levels: it.levels,
    displayTitle: it.title, wCm: it.w, hCm: it.h, dCm: it.d,
    doorCount, hasShelf: true, isAutoImagined: false, suggestedFinish: it.fin, catalogId: it.id,
    hasDrawers: ['guarda_roupa', 'armario_cozinha', 'comoda'].includes(it.category) || (it.category === 'armario_pia' && it.w >= 120)
  };
}

// Reconhece móveis de metalon/comoda digitados no campo "O que você quer criar?"
const CUSTOM = [
  [/mesa de centro/, 'Mesa de Centro Metalon', 'mesa', 100, 40, 60, 1],
  [/escrivaninha|mesa de escritorio/, 'Escrivaninha Metalon', 'mesa', 140, 75, 60, 0],
  [/mesa/, 'Mesa Metalon', 'mesa', 160, 76, 80, 0],
  [/rack|painel de tv/, 'Rack de TV Metalon', 'rack', 160, 50, 40, 1],
  [/banco/, 'Banco Metalon', 'banco', 100, 45, 35, 0],
  [/metalon|serralheria|industrial/, 'Estante Industrial Metalon', 'estante', 100, 180, 35, 4]
];
const CHEST = [[/criado|mesa de cabeceira/, 'Criado-Mudo', 45, 50, 40, 2], [/gaveteiro/, 'Gaveteiro', 60, 75, 45, 3], [/comoda/, 'Cômoda', 90, 85, 45, 4]];

export function detectCustom(text) {
  for (const [re, title, w, h, d, n] of CHEST) {
    if (re.test(text)) return { category: 'comoda', kind: null, title, dims: { w, h, d }, levels: n };
  }
  for (const [re, title, kind, w, h, d, n] of CUSTOM) {
    if (re.test(text)) return { category: 'metalon', kind, title, dims: { w, h, d }, levels: n };
  }
  return null;
}
