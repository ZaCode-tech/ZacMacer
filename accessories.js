// 115 acessórios e ferragens. Formato: categoria|nome|L|A|P (cm)|forma(b=caixa,c=cilindro)|material|rotação opcional "rx,ry,rz"
// Materiais: ver ACC_MATS em shared.js. Cada acessório vira uma peça nomeada (t:'acc') no Modo Editor, no 3D e na lista de ferragens.
export const ACC_CATS = {
  v: 'Vidros e Espelhos', p: 'Perfis e Estruturas', u: 'Puxadores e Abertura', d: 'Dobradiças e Corrediças', c: 'Portas de Correr',
  l: 'Iluminação e Elétrica', k: 'Organizadores Cozinha e Lavanderia', q: 'Organizadores Quarto e Closet', f: 'Pés, Apoios e Fixação'
};
const RAW = `v|Espelho prata comum (3 mm ou 4 mm)|60|80|0.4|b|mirror
v|Espelho bronze|60|80|0.4|b|mirror_bronze
v|Espelho fumê|60|80|0.4|b|mirror_smoke
v|Espelho com película de segurança (anti-estilhaço)|60|80|0.4|b|mirror
v|Espelho bisotado (bordas lapidadas)|60|80|0.6|b|mirror
v|Espelho orgânico / formato irregular|55|0.4|55|c|mirror|90,0,0
v|Vidro incolor comum ou temperado|60|80|0.6|b|glass
v|Vidro Extra Clear|60|80|0.6|b|glass_clear
v|Vidro Reflecta bronze|60|80|0.6|b|glass_bronze
v|Vidro Reflecta prata|60|80|0.6|b|glass_silver
v|Vidro Reflecta fumê|60|80|0.6|b|glass_smoke
v|Vidro canelado / canelato|60|80|0.6|b|glass_ribbed
v|Vidro serigrafado / pintado (Lacobel)|60|80|0.6|b|glass_white
v|Vidro acidato / jateado (fosco)|60|80|0.6|b|glass_frost
p|Perfil de alumínio para porta de vidro|60|2|2.5|b|alu
p|Perfil puxador de embutir (cava de alumínio)|60|3|2|b|alu
p|Perfil puxador de sobrepor (perfil G ou C)|60|3|2.5|b|alu
p|Perfil divisor / filete metálico decorativo|60|1|0.6|b|brass
p|Estrutura em Metalon (quadrado ou retangular)|60|3|3|b|iron
p|Barra de ferro / tubo para prateleira suspensa|2.5|60|2.5|c|iron|0,0,90
p|Mão francesa metálica|20|20|3|b|iron
p|Cantoneira metálica externa de reforço|5|5|3|b|iron
p|Tela metálica expandida / perfurada|50|70|0.3|b|mesh
p|Palhinha natural ou sintética|50|70|0.8|b|wicker
p|Ripas / filetes de acabamento (ripado pronto)|60|60|1.8|b|wood
p|Fita de borda (PVC, ABS ou lâmina)|100|2.2|0.1|b|white
u|Puxador tipo alça (reta ou curva)|12|1.2|3|b|inox
u|Puxador tipo ponto / botão|3|2.5|3|c|brass|90,0,0
u|Puxador tipo concha (retrô ou provençal)|8|5|1.5|b|brass
u|Puxador de couro com pino metálico|12|2|1|b|leather
u|Puxador em madeira maciça|12|2|2.5|b|wood
u|Puxador cava usinado direto no MDF|12|2|1|b|black
u|Fecho toque magnético (push-open)|4|4|1.5|b|plastic
u|Fecho magnético simples|3|3|1|b|plastic
u|Fecho rolete / trava de pressão|4|2|1.5|b|plastic
u|Fechadura para gaveta ou porta|3|3|1.5|b|inox
u|Fechadura eletrônica / biométrica|6|10|2|b|black
u|Cremona (trava com varão)|4|60|2|b|alu
u|Trinco embutido (unha ou ferrolho)|5|2|1.2|b|inox
u|Targeta / trava de segurança|6|2|1.5|b|inox
u|Chaveiro / espelho de fechadura decorativo|3|5|0.5|b|brass
d|Dobradiça caneco reta|3.5|1.2|3.5|c|inox|90,0,0
d|Dobradiça caneco curva|3.5|1.2|3.5|c|inox|90,0,0
d|Dobradiça caneco supercurva|3.5|1.2|3.5|c|inox|90,0,0
d|Dobradiça com amortecedor integrado (soft-close)|3.5|1.2|3.5|c|inox|90,0,0
d|Dobradiça de abertura ampla (165° ou 180°)|3.5|1.2|3.5|c|inox|90,0,0
d|Dobradiça para porta de vidro|3.5|1.2|3.5|c|inox|90,0,0
d|Dobradiça invisível / embutida|3.5|1.2|3.5|c|alu|90,0,0
d|Dobradiça vai-e-vem|3.5|1.2|3.5|c|brass|90,0,0
d|Pistão a gás força normal|1.8|20|1.8|c|alu
d|Pistão a gás força inversa|1.8|20|1.8|c|alu
d|Articulador mecânico de fricção|12|4|1.5|b|iron
d|Sistema articulador duplo (tipo Aventos)|20|8|2|b|alu
d|Corrediça telescópica comum|45|1.3|4.5|b|inox
d|Corrediça telescópica com amortecedor|45|1.3|4.5|b|inox
d|Corrediça telescópica com fecho toque (push-open)|45|1.3|4.5|b|inox
d|Corrediça oculta / invisível|45|1|3|b|alu
d|Gaveta metálica lateral fina (tandembox / metabox)|45|8|1.6|b|inox
d|Trilho para mesa extensível|60|3|3|b|alu
c|Kit de roldanas aparentes estilo celeiro (barn door)|100|6|2|b|iron
c|Kit deslizante embutido (trilho superior e inferior)|100|5|3|b|alu
c|Sistema deslizante com amortecedor|100|5|3|b|alu
c|Sistema coplanar|100|5|4|b|alu
c|Sistema camarão / sanfonado|60|4|3|b|alu
c|Trilho de alumínio duplo ou simples|100|2|3|b|alu
c|Guia inferior / pino guia|5|2|1.5|b|inox
c|Desempenador de portas|2|200|1|b|alu
c|Escova de vedação (tapa-poeira)|100|1|0.8|b|black
l|Fita de LED 3000K (branco quente)|100|0.8|0.3|b|led_warm
l|Fita de LED COB (luz contínua)|100|1|0.3|b|led_neutral
l|Perfil de alumínio de embutir com difusor leitoso|100|1.6|1.2|b|white
l|Perfil de alumínio de sobrepor ou de canto (45°)|100|2|2|b|alu
l|Mini spot de LED de embutir|3.5|1|3.5|c|led_warm|90,0,0
l|Fonte / driver slim 12 V ou 24 V|12|4|2.5|b|black
l|Sensor de abertura de porta|3|1|1|b|plastic
l|Sensor de presença / movimento|4|4|2|b|plastic
l|Interruptor touch de embutir (dimerização)|4|4|0.8|b|black
l|Cabideiro iluminado com LED|80|2.5|2.5|b|alu
l|Torre de tomadas retrátil|10|12|10|b|black
l|Régua de tomadas de embutir|30|4|2.5|b|white
l|Carregador por indução (wireless) embutido|8|0.6|8|c|black
l|Passa-fios circular ou retangular|6|1|6|c|alu|90,0,0
k|Divisor de talheres (madeira, bambu, acrílico ou PVC)|35|5|45|b|wood
k|Porta-temperos aramado deslizante|15|40|40|b|mesh
k|Porta-latas / garrafeiro deslizante|20|60|45|b|mesh
k|Lixeira de embutir com corrediça|30|40|45|b|plastic
k|Escorredor de louças embutido para aéreo|80|25|30|b|mesh
k|Cesto fruteira deslizante aramado|40|15|40|b|mesh
k|Cantoneira mágica / sistema giratório|50|60|50|b|mesh
k|Tulha deslizante (cesto de roupa suja)|40|50|45|b|mesh
k|Tábua de passar roupa retrátil / embutida|120|3|35|b|wood
k|Suporte deslizante para vassouras e limpeza|15|60|40|b|alu
k|Porta-panos de prato deslizante|30|40|25|b|alu
k|Tapete antiderrapante para fundo de gavetas|40|0.3|45|b|rubber
k|Protetor / bandeja de alumínio para fundo de pia|80|0.3|50|b|alu
q|Tubo cabideiro (oblongo ou redondo)|2.5|90|2.5|c|alu|0,0,90
q|Suporte central e lateral para cabideiro|5|4|3|b|alu
q|Cabideiro basculante|80|5|15|b|alu
q|Calceiro deslizante|40|8|45|b|mesh
q|Sapateira deslizante|40|20|45|b|mesh
q|Gaveta colmeia / organizadora de joias e relógios|40|8|45|b|felt
q|Tampo de vidro para gaveta organizadora|40|0.6|45|b|glass
q|Espelho deslizante ou articulado interno|40|120|1|b|mirror
q|Porta-gravatas e porta-cintos lateral|8|40|45|b|alu
q|Cesto aramado deslizante para roupas dobradas|40|15|45|b|mesh
f|Pé palito de madeira maciça|4|15|4|c|wood
f|Pé estilo hairpin leg (grampo de ferro)|2|40|2|b|iron
f|Pé nivelador plástico|4|3|4|c|plastic
f|Pé metálico regulável|4|12|4|c|alu
f|Rodízio de silicone (com ou sem trava)|5|2|5|c|rubber|0,0,90
f|Sapata deslizadora|3|0.5|3|c|black
f|Suporte invisível para prateleira flutuante|1|15|1|b|iron
f|Suporte cadeirinha / cantoneira de parede|15|12|2|b|iron
f|Suporte para prateleira de vidro (fenda ou pelicano)|4|4|2|b|inox
f|Grelha de ventilação (respiro)|15|8|0.6|b|alu`;

export const ACC = RAW.split('\n').map((l, i) => {
  const [cat, n, w, h, d, s, c, r] = l.split('|');
  return { id: i + 1, cat, n, w: +w, h: +h, d: +d, s, c, ...(r ? { r: r.split(',').map(Number) } : {}) };
});
