import * as THREE from 'three';

function createGlassMaterial(kind = 'clear') {
  const presets = {
    mirror_silver: { color: 0xf2f5f7, roughness: 0.05, metalness: 0.96, opacity: 0.96, transparent: false },
    mirror_bronze: { color: 0xb88963, roughness: 0.07, metalness: 0.92, opacity: 0.96, transparent: false },
    mirror_smoke: { color: 0x565b61, roughness: 0.07, metalness: 0.9, opacity: 0.96, transparent: false },
    glass_clear: { color: 0xdff2f7, roughness: 0.08, metalness: 0.1, opacity: 0.34, transparent: true },
    glass_extraclear: { color: 0xf7fbfd, roughness: 0.06, metalness: 0.08, opacity: 0.28, transparent: true },
    glass_reflecta_bronze: { color: 0xa6744e, roughness: 0.12, metalness: 0.78, opacity: 0.55, transparent: true },
    glass_reflecta_silver: { color: 0xd6dee4, roughness: 0.1, metalness: 0.85, opacity: 0.55, transparent: true },
    glass_reflecta_smoke: { color: 0x4b5057, roughness: 0.12, metalness: 0.8, opacity: 0.55, transparent: true },
    glass_fluted: { color: 0xe7f2f5, roughness: 0.22, metalness: 0.08, opacity: 0.45, transparent: true },
    glass_lacobel_white: { color: 0xf6f7f5, roughness: 0.14, metalness: 0.05, opacity: 0.95, transparent: false },
    glass_lacobel_black: { color: 0x191a1d, roughness: 0.14, metalness: 0.08, opacity: 0.95, transparent: false },
    glass_acid: { color: 0xe9eef0, roughness: 0.65, metalness: 0.02, opacity: 0.58, transparent: true }
  };
  const cfg = presets[kind] || presets.glass_clear;
  return new THREE.MeshStandardMaterial({
    color: cfg.color,
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    transparent: cfg.transparent,
    opacity: cfg.opacity
  });
}

function createWickerMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xc8a46d,
    roughness: 0.78,
    metalness: 0.04
  });
}

function createLeatherMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x3b2316,
    roughness: 0.52,
    metalness: 0.08
  });
}

function createFabricMaterial(colorHex = 0x8d8275) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.88,
    metalness: 0.02
  });
}

const FURNITURE_110_PROFILES = [
  { id: 1, keys: ['rack baixo', 'rack tradicional'], title: 'Rack Baixo Tradicional', cat: 'metalon', kind: 'rack', w: 160, h: 48, d: 40, levels: 1, drawer: true },
  { id: 2, keys: ['rack suspenso'], title: 'Rack Suspenso', cat: 'balcao_ripado', w: 170, h: 36, d: 38, opts: { led: 'quente', divider: 1 } },
  { id: 3, keys: ['rack retro', 'pes palito', 'pe palito'], title: 'Rack Estilo Retrô (Pés Palito)', cat: 'modular', w: 150, h: 55, d: 40, dna: 'pt-45G1N1.45P1N1.45G1N1' },
  { id: 4, keys: ['painel tv liso', 'painel para tv liso'], title: 'Painel para TV Liso', cat: 'balcao_ripado', w: 180, h: 120, d: 8, opts: { led: 'neutro' } },
  { id: 5, keys: ['painel ripado', 'painel para tv ripado'], title: 'Painel Ripado para TV', cat: 'balcao_ripado', w: 180, h: 120, d: 9, opts: { led: 'quente' } },
  { id: 6, keys: ['painel com iluminacao led', 'painel led'], title: 'Painel com Iluminação LED Embutida', cat: 'balcao_ripado', w: 180, h: 120, d: 9, opts: { led: 'quente', backShelves: 2 } },
  { id: 7, keys: ['home theater'], title: 'Home Theater Completo', cat: 'balcao_ripado', w: 210, h: 185, d: 42, opts: { led: 'quente', divider: 2, backShelves: 3 } },
  { id: 8, keys: ['mesa de centro retangular', 'mesa de centro'], title: 'Mesa de Centro Retangular', cat: 'metalon', kind: 'mesa', w: 110, h: 38, d: 60, levels: 1 },
  { id: 9, keys: ['mesa de centro redonda', 'mesa de centro organica'], title: 'Mesa de Centro Redonda / Orgânica', cat: 'metalon', kind: 'mesa', w: 85, h: 38, d: 85, levels: 0 },
  { id: 10, keys: ['tampo elevavel'], title: 'Mesa de Centro com Tampo Elevável', cat: 'modular', w: 110, h: 42, d: 60, dna: 'pt-50B1N1.50G1N1' },
  { id: 11, keys: ['mesa lateral', 'mesa de apoio'], title: 'Mesa Lateral / de Apoio', cat: 'metalon', kind: 'mesa', w: 45, h: 55, d: 45, levels: 0 },
  { id: 12, keys: ['mesa de canto'], title: 'Mesa de Canto', cat: 'metalon', kind: 'mesa', w: 45, h: 52, d: 45, levels: 1 },
  { id: 13, keys: ['aparador de sala', 'aparador'], title: 'Aparador de Sala', cat: 'metalon', kind: 'aparador', w: 140, h: 82, d: 40, levels: 1, drawer: true },
  { id: 14, keys: ['aparador bar', 'adega', 'porta-tacas', 'porta tacas'], title: 'Aparador Bar com Adega e Porta-Taças', cat: 'modular', w: 140, h: 85, d: 42, dna: 'pt-45N1N1.45P1G1.45N1N1' },
  { id: 15, keys: ['estante livreiro', 'livreiro'], title: 'Estante Livreiro', cat: 'estante', w: 120, h: 190, d: 35 },
  { id: 16, keys: ['estante colmeia', 'colmeia', 'vazada'], title: 'Estante Colmeia / Vazada', cat: 'estante', w: 135, h: 180, d: 35 },
  { id: 17, keys: ['estante escada'], title: 'Estante Escada', cat: 'estante', w: 65, h: 175, d: 42 },
  { id: 18, keys: ['estante industrial', 'metalon'], title: 'Estante Estilo Industrial (Madeira e Metalon)', cat: 'metalon', kind: 'estante', brace: 'X', w: 110, h: 185, d: 38, levels: 4 },
  { id: 19, keys: ['cristaleira'], title: 'Cristaleira com Portas de Vidro', cat: 'modular', w: 95, h: 190, d: 42, dna: 'rt-42P1N1N1.42P1N1N1' },
  { id: 20, keys: ['namoradeira de madeira', 'banco namoradeira'], title: 'Banco Namoradeira de Madeira', cat: 'metalon', kind: 'banco', w: 130, h: 46, d: 45, levels: 0 },
  { id: 21, keys: ['revisteiro'], title: 'Revisteiro de Chão', cat: 'estante', w: 42, h: 48, d: 32 },
  { id: 22, keys: ['floreira', 'plantas'], title: 'Floreira / Suporte de Madeira para Plantas', cat: 'estante', w: 80, h: 75, d: 32 },
  { id: 23, keys: ['cama de casal', 'cama casal'], title: 'Cama de Casal Convencional', cat: 'metalon', kind: 'mesa', w: 148, h: 38, d: 198, levels: 0, legs6: true },
  { id: 24, keys: ['queen size', 'cama queen'], title: 'Cama Queen Size', cat: 'metalon', kind: 'mesa', w: 168, h: 38, d: 208, levels: 0, legs6: true },
  { id: 25, keys: ['king size', 'cama king'], title: 'Cama King Size', cat: 'metalon', kind: 'mesa', w: 203, h: 38, d: 213, levels: 0, legs6: true },
  { id: 26, keys: ['cama de solteiro', 'cama solteiro'], title: 'Cama de Solteiro', cat: 'metalon', kind: 'mesa', w: 98, h: 38, d: 198, levels: 0 },
  { id: 27, keys: ['box bau', 'cama bau', 'bau'], title: 'Cama Box Baú (Estrutura em Madeira)', cat: 'modular', w: 148, h: 42, d: 198, dna: 'rn-70B2.70B2' },
  { id: 28, keys: ['cama com gavetas', 'gavetas embutidas'], title: 'Cama com Gavetas Embutidas', cat: 'modular', w: 148, h: 42, d: 198, dna: 'rn-70G2.70G2' },
  { id: 29, keys: ['bicama', 'cama auxiliar'], title: 'Cama Bicama (com Cama Auxiliar)', cat: 'modular', w: 98, h: 45, d: 198, dna: 'pn-92G2' },
  { id: 30, keys: ['cama japonesa', 'plataforma'], title: 'Cama Japonesa / Plataforma', cat: 'metalon', kind: 'mesa', w: 160, h: 28, d: 200, levels: 0 },
  { id: 31, keys: ['beliche'], title: 'Beliche', cat: 'metalon', kind: 'estante', brace: 'H', w: 98, h: 165, d: 198, levels: 1 },
  { id: 32, keys: ['treliche'], title: 'Treliche', cat: 'metalon', kind: 'estante', brace: 'H', w: 148, h: 165, d: 198, levels: 1 },
  { id: 33, keys: ['mezanino', 'cama suspensa'], title: 'Cama Suspensa / Mezanino com Escrivaninha', cat: 'metalon', kind: 'estante', brace: 'X', w: 105, h: 185, d: 198, levels: 1 },
  { id: 34, keys: ['cabeceira estofada'], title: 'Cabeceira Estofada com Moldura de Madeira', cat: 'balcao_ripado', w: 160, h: 115, d: 6, opts: { led: 'quente' } },
  { id: 35, keys: ['cabeceira ripada'], title: 'Cabeceira Ripada', cat: 'balcao_ripado', w: 160, h: 115, d: 6, opts: { led: 'quente' } },
  { id: 36, keys: ['cabeceira com mesas', 'cabeceira acoplada'], title: 'Cabeceira com Mesas de Cabeceira Acopladas', cat: 'modular', w: 240, h: 110, d: 42, dna: 'pt-45G2.140R2.45G2' },
  { id: 37, keys: ['mesa de cabeceira', 'criado-mudo', 'criado mudo'], title: 'Mesa de Cabeceira Tradicional (com Gavetas)', cat: 'comoda', levels: 2, w: 48, h: 55, d: 40 },
  { id: 38, keys: ['cabeceira suspensa', 'mesa de cabeceira suspensa'], title: 'Mesa de Cabeceira Suspensa', cat: 'modular', w: 48, h: 24, d: 38, dna: 'sn-44G1' },
  { id: 39, keys: ['guarda-roupa portas de abrir', 'guarda roupa abrir'], title: 'Guarda-Roupa com Portas de Abrir', cat: 'guarda_roupa', w: 200, h: 220, d: 58 },
  { id: 40, keys: ['portas de correr', 'guarda-roupa correr'], title: 'Guarda-Roupa com Portas de Correr', cat: 'modular', w: 220, h: 225, d: 60, dna: 'rn-70C2.70C2.70C2' },
  { id: 41, keys: ['guarda-roupa de canto', 'canto em l', 'closet em l'], title: 'Guarda-Roupa de Canto (em L)', cat: 'guarda_roupa', w: 210, h: 220, d: 90 },
  { id: 42, keys: ['closet aberto', 'arara'], title: 'Módulo de Closet Aberto (Arara e Prateleiras)', cat: 'estante', w: 150, h: 210, d: 45 },
  { id: 43, keys: ['comoda tradicional', 'comoda'], title: 'Cômoda Tradicional', cat: 'comoda', levels: 4, w: 110, h: 95, d: 46 },
  { id: 44, keys: ['comoda sapateira'], title: 'Cômoda Sapateira', cat: 'modular', w: 110, h: 95, d: 45, dna: 'pt-50G2N1.50P2' },
  { id: 45, keys: ['penteadeira camarim'], title: 'Penteadeira Camarim (com Espelho e Luzes)', cat: 'modular', w: 120, h: 145, d: 45, dna: 'pt-38G2.38G2.38G2' },
  { id: 46, keys: ['tampo basculante', 'penteadeira'], title: 'Penteadeira com Tampo Basculante', cat: 'modular', w: 110, h: 80, d: 45, dna: 'pt-50B1N1.50G2' },
  { id: 47, keys: ['recamier', 'pes da cama', 'pe da cama'], title: 'Recamier / Baú para Pés da Cama', cat: 'modular', w: 130, h: 46, d: 42, dna: 'pt-124B1' },
  { id: 48, keys: ['berco padrao americano', 'berco americano', 'berco'], title: 'Berço Padrão Americano', cat: 'metalon', kind: 'mesa', w: 76, h: 95, d: 135, levels: 1 },
  { id: 49, keys: ['berco evolutivo', 'minicama evolutiva'], title: 'Berço Evolutivo (que Vira Minicama)', cat: 'metalon', kind: 'mesa', w: 76, h: 95, d: 135, levels: 1 },
  { id: 50, keys: ['minicama'], title: 'Minicama Infantil', cat: 'metalon', kind: 'mesa', w: 78, h: 42, d: 156, levels: 0 },
  { id: 51, keys: ['montessoriana', 'casinha'], title: 'Cama Montessoriana (Casinha no Chão)', cat: 'metalon', kind: 'estante', w: 85, h: 135, d: 160, levels: 0 },
  { id: 52, keys: ['comoda trocador', 'trocador'], title: 'Cômoda Trocador', cat: 'comoda', levels: 4, w: 100, h: 92, d: 48 },
  { id: 53, keys: ['bau de brinquedos', 'brinquedos'], title: 'Baú Organizador de Brinquedos', cat: 'modular', w: 85, h: 48, d: 45, dna: 'pn-80B1' },
  { id: 54, keys: ['estante montessoriana'], title: 'Estante Montessoriana (Baixa para Livros)', cat: 'estante', w: 90, h: 72, d: 32 },
  { id: 55, keys: ['guarda-roupa infantil', 'roupeiro infantil'], title: 'Guarda-Roupa Infantil', cat: 'guarda_roupa', w: 135, h: 185, d: 50 },
  { id: 56, keys: ['mesinha infantil', 'cadeirinhas'], title: 'Mesinha Infantil com Cadeirinhas', cat: 'metalon', kind: 'mesa', w: 75, h: 52, d: 55, levels: 0 },
  { id: 57, keys: ['nichos decorativos', 'nicho'], title: 'Nichos Decorativos de Parede', cat: 'estante', w: 90, h: 35, d: 28 },
  { id: 58, keys: ['mesa de jantar retangular', 'mesa de jantar'], title: 'Mesa de Jantar Retangular', cat: 'metalon', kind: 'mesa', w: 180, h: 76, d: 90, levels: 0, legs6: true },
  { id: 59, keys: ['mesa de jantar redonda'], title: 'Mesa de Jantar Redonda', cat: 'metalon', kind: 'mesa', w: 120, h: 76, d: 120, levels: 0 },
  { id: 60, keys: ['mesa extensivel', 'mesa dobravel de jantar'], title: 'Mesa de Jantar Extensível / Dobrável', cat: 'metalon', kind: 'mesa', w: 160, h: 76, d: 85, levels: 0 },
  { id: 61, keys: ['canto alemao'], title: 'Mesa de Jantar Canto Alemão', cat: 'modular', w: 180, h: 86, d: 52, dna: 'rn-55B1.60B1.55B1' },
  { id: 62, keys: ['cadeira de jantar em madeira', 'cadeira de jantar'], title: 'Cadeira de Jantar Toda em Madeira', cat: 'metalon', kind: 'banco', w: 44, h: 85, d: 45, levels: 0 },
  { id: 63, keys: ['cadeira estofada', 'assento estofado'], title: 'Cadeira de Jantar com Assento Estofado', cat: 'metalon', kind: 'banco', w: 45, h: 86, d: 46, levels: 0 },
  { id: 64, keys: ['banco reto'], title: 'Banco Reto para Mesa de Jantar', cat: 'metalon', kind: 'banco', w: 150, h: 45, d: 38, levels: 0 },
  { id: 65, keys: ['banqueta alta', 'banqueta'], title: 'Banqueta Alta para Bancada / Ilha', cat: 'metalon', kind: 'banco', w: 40, h: 75, d: 40, levels: 0 },
  { id: 66, keys: ['banqueta baixa', 'tamborete'], title: 'Banqueta Baixa / Tamborete', cat: 'metalon', kind: 'banco', w: 38, h: 46, d: 38, levels: 0 },
  { id: 67, keys: ['buffet', 'balcao aparador'], title: 'Buffet / Balcão Aparador de Jantar', cat: 'modular', w: 160, h: 82, d: 45, dna: 'pt-50P1G1.50G2.50P1G1' },
  { id: 68, keys: ['armario aereo', 'aereo'], title: 'Armário Aéreo de Cozinha', cat: 'modular', w: 120, h: 70, d: 35, dna: 'sn-55P1.55P1' },
  { id: 69, keys: ['balcao inferior', 'pia', 'cooktop'], title: 'Balcão Inferior de Cozinha (Pia / Cooktop)', cat: 'armario_pia', w: 140, h: 88, d: 56 },
  { id: 70, keys: ['torre quente', 'forno', 'micro-ondas', 'microondas'], title: 'Torre Quente (Forno e Micro-ondas)', cat: 'modular', w: 65, h: 215, d: 58, dna: 'rn-60N1N1G2P1' },
  { id: 71, keys: ['paneleiro', 'despenseiro'], title: 'Paneleiro / Despenseiro Alto', cat: 'armario', w: 70, h: 215, d: 52 },
  { id: 72, keys: ['ilha de cozinha', 'ilha'], title: 'Ilha de Cozinha com Tampo de Madeira', cat: 'modular', w: 180, h: 90, d: 75, dna: 'rp-55G2.55P1N1.55G2' },
  { id: 73, keys: ['passa-pratos', 'passa pratos', 'gourmet'], title: 'Balcão Passa-Pratos / Gourmet', cat: 'balcao_ripado', w: 160, h: 105, d: 45, opts: { led: 'quente', divider: 1 } },
  { id: 74, keys: ['fruteira'], title: 'Fruteira de Chão com Gavetas', cat: 'modular', w: 60, h: 85, d: 40, dna: 'pn-55G1N2' },
  { id: 75, keys: ['carrinho bar', 'carrinho auxiliar', 'rodizios'], title: 'Carrinho Bar / Auxiliar com Rodízios', cat: 'metalon', kind: 'aparador', w: 75, h: 80, d: 42, levels: 1 },
  { id: 76, keys: ['adega', 'vinhos'], title: 'Adega Climatizada ou Colmeia para Vinhos', cat: 'estante', w: 60, h: 140, d: 35 },
  { id: 77, keys: ['porta-temperos', 'porta temperos', 'temperos'], title: 'Porta-Temperos de Parede', cat: 'estante', w: 50, h: 45, d: 15 },
  { id: 78, keys: ['escrivaninha reta', 'escrivaninha'], title: 'Escrivaninha Reta Simples', cat: 'metalon', kind: 'mesa', w: 135, h: 75, d: 60, levels: 0 },
  { id: 79, keys: ['gaveteiro embutido'], title: 'Escrivaninha com Gaveteiro Embutido', cat: 'modular', w: 145, h: 75, d: 60, dna: 'pt-95N1.45G3' },
  { id: 80, keys: ['mesa em l', 'escritorio em l', 'mesa de canto escritorio'], title: 'Mesa de Escritório em L (de Canto)', cat: 'metalon', kind: 'mesa', w: 150, h: 75, d: 120, levels: 0 },
  { id: 81, keys: ['cavalete'], title: 'Mesa Estilo Cavalete', cat: 'metalon', kind: 'mesa', brace: 'X', w: 150, h: 75, d: 65, levels: 0 },
  { id: 82, keys: ['bancada de estudo', 'estudo suspensa'], title: 'Bancada de Estudo Suspensa', cat: 'modular', w: 140, h: 75, d: 52, dna: 'sn-65G1.65G1' },
  { id: 83, keys: ['mesa dobravel'], title: 'Mesa Dobrável de Parede', cat: 'modular', w: 90, h: 75, d: 50, dna: 'sn-85B1' },
  { id: 84, keys: ['gaveteiro volante', 'gaveteiro'], title: 'Gaveteiro Volante (com Rodízios)', cat: 'comoda', levels: 3, w: 42, h: 62, d: 45 },
  { id: 85, keys: ['arquivo para pastas', 'arquivo'], title: 'Armário Arquivo para Pastas', cat: 'comoda', levels: 3, w: 52, h: 105, d: 50 },
  { id: 86, keys: ['credenza'], title: 'Credenza (Armário Baixo de Apoio)', cat: 'modular', w: 160, h: 75, d: 45, dna: 'pt-50P1.50G2.50P1' },
  { id: 87, keys: ['livros e documentos', 'documentos'], title: 'Estante para Livros e Documentos', cat: 'estante', w: 120, h: 195, d: 35 },
  { id: 88, keys: ['monitor', 'suporte elevado'], title: 'Suporte Elevado de Madeira para Monitor', cat: 'estante', w: 55, h: 12, d: 24 },
  { id: 89, keys: ['mesa de reuniao', 'reuniao'], title: 'Mesa de Reunião', cat: 'metalon', kind: 'mesa', w: 220, h: 76, d: 100, levels: 0, legs6: true },
  { id: 90, keys: ['gabinete suspenso', 'gabinete de banheiro'], title: 'Gabinete de Banheiro Suspenso', cat: 'modular', w: 80, h: 55, d: 42, dna: 'sp-36G2.36P1' },
  { id: 91, keys: ['gabinete com pes', 'gabinete pes'], title: 'Gabinete de Banheiro com Pés', cat: 'armario_pia', w: 85, h: 82, d: 44 },
  { id: 92, keys: ['madeira naval', 'cuba de apoio'], title: 'Bancada de Madeira Naval para Cuba de Apoio', cat: 'modular', w: 100, h: 60, d: 46, dna: 'sp-46G1.46G1' },
  { id: 93, keys: ['espelheira'], title: 'Espelheira com Armário Embutido', cat: 'modular', w: 75, h: 65, d: 15, dna: 'sn-35P1.35P1' },
  { id: 94, keys: ['toalhas'], title: 'Prateleira / Nicho para Toalhas', cat: 'estante', w: 60, h: 55, d: 22 },
  { id: 95, keys: ['multiuso', 'lavanderia', 'vassouras'], title: 'Armário Multiuso / Lavanderia', cat: 'armario', w: 75, h: 190, d: 45 },
  { id: 96, keys: ['aereo lavanderia', 'area de servico'], title: 'Armário Aéreo para Área de Serviço', cat: 'modular', w: 90, h: 65, d: 34, dna: 'sn-42P1.42P1' },
  { id: 97, keys: ['balcao para tanque', 'tanque'], title: 'Balcão para Tanque', cat: 'armario_pia', w: 90, h: 86, d: 54 },
  { id: 98, keys: ['roupas sujas', 'cesto'], title: 'Cesto de Roupas Sujas Ripado', cat: 'balcao_ripado', w: 45, h: 62, d: 38, opts: { led: 'quente' } },
  { id: 99, keys: ['sapateira slim', 'sapateira basculante', 'sapateira'], title: 'Sapateira Slim / Basculante de Entrada', cat: 'modular', w: 75, h: 105, d: 25, dna: 'rt-70B3' },
  { id: 100, keys: ['banco sapateira', 'hall'], title: 'Banco Sapateira para Hall', cat: 'modular', w: 95, h: 48, d: 38, dna: 'pt-45N1.45P1' },
  { id: 101, keys: ['cabideiro de parede', 'cabideiro'], title: 'Cabideiro de Parede com Prateleira', cat: 'estante', w: 85, h: 26, d: 20 },
  { id: 102, keys: ['mancebo'], title: 'Mancebo (Cabideiro de Chão)', cat: 'metalon', kind: 'estante', w: 45, h: 170, d: 45, levels: 0 },
  { id: 103, keys: ['console', 'aparador estreito'], title: 'Console / Aparador Estreito de Entrada', cat: 'metalon', kind: 'aparador', w: 120, h: 80, d: 30, levels: 1 },
  { id: 104, keys: ['biombo', 'biombos'], title: 'Biombos Divisórios de Ambiente', cat: 'balcao_ripado', w: 135, h: 180, d: 4, opts: { led: 'quente' } },
  { id: 105, keys: ['banco de jardim', 'praca', 'jardim'], title: 'Banco de Jardim / Praça (Madeira Maciça)', cat: 'metalon', kind: 'banco', w: 150, h: 46, d: 48, levels: 0 },
  { id: 106, keys: ['namoradeira de varanda', 'varanda'], title: 'Namoradeira de Varanda', cat: 'metalon', kind: 'banco', w: 125, h: 82, d: 55, levels: 0 },
  { id: 107, keys: ['espreguicadeira', 'deck', 'piscina'], title: 'Espreguiçadeira de Madeira (Deck/Piscina)', cat: 'metalon', kind: 'banco', w: 195, h: 36, d: 65, levels: 0 },
  { id: 108, keys: ['bistro'], title: 'Mesa Dobrável de Varanda / Bistrô', cat: 'metalon', kind: 'mesa', w: 70, h: 98, d: 70, levels: 0 },
  { id: 109, keys: ['pergolado'], title: 'Pergolado de Madeira', cat: 'metalon', kind: 'estante', w: 220, h: 230, d: 180, levels: 0 },
  { id: 110, keys: ['painel vertical', 'jardim vertical'], title: 'Painel Vertical de Madeira para Jardim', cat: 'balcao_ripado', w: 150, h: 180, d: 6, opts: { led: 'quente' } }
];

const ACCESSORIES_115_MAP = [
  { id: 1, keys: ['espelho prata'], group: 'glass', type: 'mirror_silver' },
  { id: 2, keys: ['espelho bronze'], group: 'glass', type: 'mirror_bronze' },
  { id: 3, keys: ['espelho fume'], group: 'glass', type: 'mirror_smoke' },
  { id: 4, keys: ['pelicula de seguranca', 'anti-estilhaco'], group: 'glass', type: 'mirror_silver' },
  { id: 5, keys: ['espelho bisotado', 'bisotado'], group: 'glass', type: 'mirror_silver' },
  { id: 6, keys: ['espelho organico'], group: 'glass', type: 'mirror_silver' },
  { id: 7, keys: ['vidro incolor', 'vidro temperado'], group: 'glass', type: 'glass_clear' },
  { id: 8, keys: ['extra clear'], group: 'glass', type: 'glass_extraclear' },
  { id: 9, keys: ['reflecta bronze'], group: 'glass', type: 'glass_reflecta_bronze' },
  { id: 10, keys: ['reflecta prata'], group: 'glass', type: 'glass_reflecta_silver' },
  { id: 11, keys: ['reflecta fume'], group: 'glass', type: 'glass_reflecta_smoke' },
  { id: 12, keys: ['canelado', 'canelato'], group: 'glass', type: 'glass_fluted' },
  { id: 13, keys: ['lacobel', 'serigrafado'], group: 'glass', type: 'glass_lacobel_white' },
  { id: 14, keys: ['acidato', 'jateado'], group: 'glass', type: 'glass_acid' },
  { id: 15, keys: ['perfil de aluminio para porta de vidro', 'perfil porta de vidro'], group: 'profile', type: 'glass_door_frame' },
  { id: 16, keys: ['perfil puxador de embutir', 'cava de aluminio'], group: 'profile', type: 'recessed_handle' },
  { id: 17, keys: ['perfil puxador de sobrepor', 'perfil g', 'perfil c'], group: 'profile', type: 'overlay_handle' },
  { id: 18, keys: ['filete metalico', 'divisor de painel'], group: 'profile', type: 'trim_strip' },
  { id: 19, keys: ['estrutura em metalon', 'metalon'], group: 'profile', type: 'metalon_cage' },
  { id: 20, keys: ['barra de ferro', 'prateleiras suspensas'], group: 'profile', type: 'hanging_bar' },
  { id: 21, keys: ['mao francesa', 'mão francesa'], group: 'profile', type: 'bracket' },
  { id: 22, keys: ['cantoneira metalica'], group: 'profile', type: 'corner_brace' },
  { id: 23, keys: ['tela metalica', 'expandida', 'perfurada'], group: 'profile', type: 'mesh_panel' },
  { id: 24, keys: ['palhinha'], group: 'wicker', type: 'palhinha' },
  { id: 25, keys: ['ripas', 'ripado pronto'], group: 'wicker', type: 'slat_trim' },
  { id: 26, keys: ['fita de borda'], group: 'profile', type: 'edge_band' },
  { id: 27, keys: ['puxador tipo alca', 'puxador alca'], group: 'handle', type: 'bar_pull' },
  { id: 28, keys: ['puxador tipo ponto', 'puxador ponto', 'botao'], group: 'handle', type: 'knob_pull' },
  { id: 29, keys: ['puxador tipo concha', 'concha'], group: 'handle', type: 'shell_pull' },
  { id: 30, keys: ['puxador de couro', 'couro'], group: 'leather', type: 'leather_pull' },
  { id: 31, keys: ['puxador em madeira', 'madeira macica'], group: 'handle', type: 'wood_pull' },
  { id: 32, keys: ['puxador cava'], group: 'handle', type: 'cava_pull' },
  { id: 33, keys: ['fecho toque', 'push-open', 'push open'], group: 'latch', type: 'push_latch' },
  { id: 34, keys: ['fecho magnetico'], group: 'latch', type: 'mag_latch' },
  { id: 35, keys: ['fecho rolete'], group: 'latch', type: 'roller_latch' },
  { id: 36, keys: ['fechadura'], group: 'latch', type: 'lock' },
  { id: 37, keys: ['biometrica', 'eletronica'], group: 'latch', type: 'smart_lock' },
  { id: 38, keys: ['cremona'], group: 'latch', type: 'cremona' },
  { id: 39, keys: ['trinco'], group: 'latch', type: 'bolt' },
  { id: 40, keys: ['targeta'], group: 'latch', type: 'safety_bolt' },
  { id: 41, keys: ['chaveiro', 'espelho de fechadura'], group: 'latch', type: 'escutcheon' },
  { id: 42, keys: ['dobradica reta', 'caneco reta'], group: 'hinge', type: 'straight' },
  { id: 43, keys: ['dobradica curva', 'caneco curva'], group: 'hinge', type: 'curve' },
  { id: 44, keys: ['supercurva'], group: 'hinge', type: 'super_curve' },
  { id: 45, keys: ['soft-close', 'amortecedor'], group: 'hinge', type: 'soft_close' },
  { id: 46, keys: ['165', '180', 'abertura ampla'], group: 'hinge', type: 'wide_180' },
  { id: 47, keys: ['porta de vidro'], group: 'hinge', type: 'glass_hinge' },
  { id: 48, keys: ['invisivel', 'embutida'], group: 'hinge', type: 'concealed_hinge' },
  { id: 49, keys: ['vai-e-vem', 'bang-bang'], group: 'hinge', type: 'swing_hinge' },
  { id: 50, keys: ['pistao a gas normal', 'pistao normal'], group: 'hinge', type: 'gas_up' },
  { id: 51, keys: ['pistao a gas inversa', 'pistao inversa'], group: 'hinge', type: 'gas_down' },
  { id: 52, keys: ['friccao'], group: 'hinge', type: 'friction' },
  { id: 53, keys: ['aventos', 'articulador duplo'], group: 'hinge', type: 'aventos' },
  { id: 54, keys: ['corredica telescopica', 'telescopica'], group: 'slide', type: 'telescopic' },
  { id: 55, keys: ['corredica com amortecedor'], group: 'slide', type: 'telescopic_soft' },
  { id: 56, keys: ['corredica push-open', 'corredica toque'], group: 'slide', type: 'telescopic_push' },
  { id: 57, keys: ['corredica oculta', 'corredica invisivel'], group: 'slide', type: 'concealed_slide' },
  { id: 58, keys: ['tandembox', 'metabox', 'lateral fina'], group: 'slide', type: 'tandembox' },
  { id: 59, keys: ['mesa extensivel', 'abertura sincronizada'], group: 'slide', type: 'table_slide' },
  { id: 60, keys: ['barn door', 'celeiro', 'roldanas aparentes'], group: 'sliding', type: 'barn' },
  { id: 61, keys: ['deslizante embutido'], group: 'sliding', type: 'pocket_slide' },
  { id: 62, keys: ['deslizante com amortecedor'], group: 'sliding', type: 'soft_slide' },
  { id: 63, keys: ['coplanar'], group: 'sliding', type: 'coplanar' },
  { id: 64, keys: ['camarao', 'sanfonado'], group: 'sliding', type: 'bifold' },
  { id: 65, keys: ['trilho de aluminio', 'trilho'], group: 'sliding', type: 'track' },
  { id: 66, keys: ['guia inferior', 'pino guia'], group: 'sliding', type: 'floor_guide' },
  { id: 67, keys: ['desempenador'], group: 'sliding', type: 'straightener' },
  { id: 68, keys: ['escova de vedacao', 'tapa-poeira'], group: 'sliding', type: 'brush_seal' },
  { id: 69, keys: ['fita de led', '3000k', '4000k', '6000k'], group: 'led', type: 'strip' },
  { id: 70, keys: ['led cob', 'cob'], group: 'led', type: 'cob' },
  { id: 71, keys: ['difusor leitoso', 'perfil de embutir'], group: 'led', type: 'recessed_led' },
  { id: 72, keys: ['perfil de sobrepor', 'canto 45'], group: 'led', type: 'corner_led' },
  { id: 73, keys: ['mini spot', 'spot'], group: 'led', type: 'spot' },
  { id: 74, keys: ['fonte', 'driver'], group: 'led', type: 'driver' },
  { id: 75, keys: ['sensor de abertura'], group: 'led', type: 'door_sensor' },
  { id: 76, keys: ['sensor de presenca', 'movimento'], group: 'led', type: 'motion_sensor' },
  { id: 77, keys: ['interruptor touch', 'dimerizacao'], group: 'led', type: 'touch_dimmer' },
  { id: 78, keys: ['cabideiro iluminado'], group: 'led', type: 'lit_rod' },
  { id: 79, keys: ['torre de tomadas', 'tomadas retratil'], group: 'power', type: 'retract_tower' },
  { id: 80, keys: ['regua de tomadas', 'tomadas de embutir'], group: 'power', type: 'power_strip' },
  { id: 81, keys: ['inducao', 'wireless'], group: 'power', type: 'qi_charger' },
  { id: 82, keys: ['passa-fios', 'passa fios'], group: 'power', type: 'grommet' },
  { id: 83, keys: ['divisor de talheres', 'talheres'], group: 'kitchen_org', type: 'cutlery' },
  { id: 84, keys: ['porta-temperos', 'porta temperos'], group: 'kitchen_org', type: 'spice_rack' },
  { id: 85, keys: ['porta-latas', 'garrafeiro'], group: 'kitchen_org', type: 'bottle_rack' },
  { id: 86, keys: ['lixeira'], group: 'kitchen_org', type: 'bin' },
  { id: 87, keys: ['escorredor'], group: 'kitchen_org', type: 'dish_rack' },
  { id: 88, keys: ['cesto fruteira'], group: 'kitchen_org', type: 'fruit_basket' },
  { id: 89, keys: ['cantoneira magica', 'giratorio'], group: 'kitchen_org', type: 'lazy_susan' },
  { id: 90, keys: ['tulha'], group: 'kitchen_org', type: 'hamper_pullout' },
  { id: 91, keys: ['tabua de passar'], group: 'kitchen_org', type: 'ironing_board' },
  { id: 92, keys: ['vassouras', 'limpeza'], group: 'kitchen_org', type: 'broom_pullout' },
  { id: 93, keys: ['porta-panos', 'panos de prato'], group: 'kitchen_org', type: 'towel_pullout' },
  { id: 94, keys: ['antiderrapante', 'tapete'], group: 'kitchen_org', type: 'anti_slip' },
  { id: 95, keys: ['protetor metalico', 'bandeja de aluminio', 'umidade'], group: 'kitchen_org', type: 'wet_tray' },
  { id: 96, keys: ['tubo cabideiro', 'cabideiro'], group: 'closet_org', type: 'rod' },
  { id: 97, keys: ['suporte para cabideiro'], group: 'closet_org', type: 'rod_bracket' },
  { id: 98, keys: ['cabideiro basculante'], group: 'closet_org', type: 'pull_down_rod' },
  { id: 99, keys: ['calceiro'], group: 'closet_org', type: 'trouser_rack' },
  { id: 100, keys: ['sapateira deslizante'], group: 'closet_org', type: 'shoe_pullout' },
  { id: 101, keys: ['colmeia', 'joias', 'relogios', 'oculos'], group: 'closet_org', type: 'jewelry_tray' },
  { id: 102, keys: ['tampo de vidro para gaveta'], group: 'closet_org', type: 'glass_top' },
  { id: 103, keys: ['espelho deslizante', 'espelho interno'], group: 'closet_org', type: 'pullout_mirror' },
  { id: 104, keys: ['porta-gravatas', 'porta-cintos'], group: 'closet_org', type: 'tie_belt_rack' },
  { id: 105, keys: ['cesto aramado'], group: 'closet_org', type: 'wire_basket' },
  { id: 106, keys: ['pe palito', 'pé palito'], group: 'feet', type: 'tapered_leg' },
  { id: 107, keys: ['hairpin'], group: 'feet', type: 'hairpin_leg' },
  { id: 108, keys: ['pe nivelador', 'nivelador'], group: 'feet', type: 'leveler_plastic' },
  { id: 109, keys: ['pe metalico', 'regulavel'], group: 'feet', type: 'leveler_metal' },
  { id: 110, keys: ['rodizio', 'rodinha'], group: 'feet', type: 'caster' },
  { id: 111, keys: ['sapata'], group: 'feet', type: 'glide' },
  { id: 112, keys: ['pino tucano', 'suporte invisivel', 'flutuante'], group: 'mount', type: 'concealed_shelf' },
  { id: 113, keys: ['suporte cadeirinha', 'fixacao na parede'], group: 'mount', type: 'wall_cleat' },
  { id: 114, keys: ['prateleira de vidro', 'pelicano'], group: 'mount', type: 'glass_shelf_clip' },
  { id: 115, keys: ['grelha de ventilacao', 'respiro'], group: 'mount', type: 'vent_grille' }
];

export function detectAccessory115(text) {
  const norm = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matched = [];
  for (const item of ACCESSORIES_115_MAP) {
    if (item.keys.some((k) => norm.includes(k))) {
      matched.push(item);
    }
  }
  return matched;
}

export function detectFurniture110(text) {
  const norm = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const prof of FURNITURE_110_PROFILES) {
    if (prof.keys.some((k) => norm.includes(k))) {
      return prof;
    }
  }
  return null;
}

export function parseFurnitureRequest(rawText, manualDims = {}, detectCustomFn) {
  const text = (rawText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const prof110 = detectFurniture110(text);
  const accessories = detectAccessory115(text);

  let category = prof110 ? prof110.cat : 'armario_pia';
  let displayTitle = prof110 ? prof110.title : 'Armário de Pia';

  if (!prof110) {
    if (text.includes('guarda-roupa') || text.includes('guarda roupa') || text.includes('roupeiro') || text.includes('closet')) {
      category = 'guarda_roupa';
      displayTitle = 'Guarda-Roupa Sob Medida';
    } else if (text.includes('cozinha') || text.includes('aereo') || text.includes('bancada')) {
      category = 'armario_cozinha';
      displayTitle = 'Armário de Cozinha';
    } else if (text.includes('pia') || text.includes('tanque') || text.includes('banheiro') || text.includes('lavabo') || text.includes('gabinete')) {
      category = 'armario_pia';
      displayTitle = 'Armário de Pia';
    } else if (text.includes('ripado') || text.includes('balcao') || text.includes('recepcao') || text.includes('aparador')) {
      category = 'balcao_ripado';
      displayTitle = 'Balcão Ripado LED';
    } else if (text.includes('estante') || text.includes('nicho') || text.includes('livreiro') || text.includes('prateleira')) {
      category = 'estante';
      displayTitle = 'Estante & Nichos';
    } else if (text.includes('armario') || text.includes('multiuso') || text.includes('dispensa') || text.includes('sapateira')) {
      category = 'armario';
      displayTitle = 'Armário Multiuso';
    }
  }

  const custom = typeof detectCustomFn === 'function' ? detectCustomFn(text) : null;
  if (!prof110 && custom) {
    category = custom.category;
    displayTitle = custom.title;
  }

  const defaults = {
    armario_pia: { w: 120, h: 85, d: 56 },
    guarda_roupa: { w: 185, h: 215, d: 58 },
    armario_cozinha: { w: 200, h: 210, d: 56 },
    balcao_ripado: { w: 175, h: 94, d: 56 },
    estante: { w: 135, h: 185, d: 38 },
    armario: { w: 110, h: 165, d: 48 },
    metalon: { w: 140, h: 76, d: 60 },
    comoda: { w: 110, h: 95, d: 46 },
    modular: { w: 160, h: 180, d: 50 }
  };

  let { w, h, d } = prof110
    ? { w: prof110.w, h: prof110.h, d: prof110.d }
    : (custom && custom.dims ? custom.dims : (defaults[category] || defaults.armario_pia));
  let isAutoImagined = !prof110 && !(custom && custom.dims);

  const nxmMatch = text.match(/(\d+[.,]?\d*)\s*(?:m|cm)?\s*[x×]\s*(\d+[.,]?\d*)/);
  if (nxmMatch) {
    let v1 = parseFloat(nxmMatch[1].replace(',', '.'));
    let v2 = parseFloat(nxmMatch[2].replace(',', '.'));
    if (v1 <= 10) v1 = Math.round(v1 * 100);
    if (v2 <= 10) v2 = Math.round(v2 * 100);
    w = THREE.MathUtils.clamp(v1, 50, 420);
    h = THREE.MathUtils.clamp(v2, 50, 290);
    isAutoImagined = false;
  } else {
    const unitMatches = [...text.matchAll(/(\d+[.,]?\d*)\s*(cm|m|metro|metros)\b/g)];
    if (unitMatches.length >= 1) {
      let val1 = parseFloat(unitMatches[0][1].replace(',', '.'));
      if (unitMatches[0][2] !== 'cm') val1 = Math.round(val1 * 100);
      w = THREE.MathUtils.clamp(val1, 50, 420);
      isAutoImagined = false;
    }
    if (unitMatches.length >= 2) {
      let val2 = parseFloat(unitMatches[1][1].replace(',', '.'));
      if (unitMatches[1][2] !== 'cm') val2 = Math.round(val2 * 100);
      h = THREE.MathUtils.clamp(val2, 50, 290);
    }
  }

  if (Number.isFinite(manualDims.w) && manualDims.w >= 40) {
    w = THREE.MathUtils.clamp(manualDims.w, 40, 450);
    isAutoImagined = false;
  }
  if (Number.isFinite(manualDims.h) && manualDims.h >= 40) {
    h = THREE.MathUtils.clamp(manualDims.h, 40, 300);
    isAutoImagined = false;
  }
  if (Number.isFinite(manualDims.d) && manualDims.d >= 25) {
    d = THREE.MathUtils.clamp(manualDims.d, 25, 120);
    isAutoImagined = false;
  }

  const doorsMatch = text.match(/(\d+)\s*portas?/);
  const doorCount = doorsMatch
    ? THREE.MathUtils.clamp(parseInt(doorsMatch[1], 10), 1, 6)
    : Math.max(2, Math.min(6, Math.round(w / 48)));

  const hasDrawers =
    text.includes('gaveta') ||
    category === 'guarda_roupa' ||
    category === 'armario_cozinha' ||
    (category === 'armario_pia' && w >= 120);

  const known = Boolean(prof110 || custom) || /guarda|roupeiro|closet|cozinha|aereo|bancada|pia|tanque|banheiro|lavabo|gabinete|ripado|balcao|recepcao|aparador|estante|nicho|armario|multiuso|dispensa|sapateira|mesa|cama|berco|comoda|penteadeira|escrivaninha|biombo|pergolado/.test(text);

  const opts = {
    ...(prof110 && prof110.opts ? prof110.opts : {}),
    led: /\bled\b|iluminacao|luz/.test(text) ? (/frio|branc/.test(text) ? 'frio' : /neutro/.test(text) ? 'neutro' : 'quente') : ((prof110 && prof110.opts && prof110.opts.led) || 'quente'),
    divider: /divisoria/.test(text) ? Math.min(4, parseInt((text.match(/(\d+)\s*divisoria/) || [0, 1])[1], 10) || 1) : ((prof110 && prof110.opts && prof110.opts.divider) || 0),
    backShelves: /prat\w*leira/.test(text) && /(atras|fundo|traseir)/.test(text) ? Math.min(6, parseInt((text.match(/(\d+)\s*prat\w*leira/) || [0, 3])[1], 10) || 3) : ((prof110 && prof110.opts && prof110.opts.backShelves) || 0)
  };
  const hasShelf = !text.includes('sem prateleira');

  let suggestedFinish = null;
  if (text.includes('claro') || text.includes('branco') || text.includes('aveia') || text.includes('oat')) {
    suggestedFinish = 'oat';
  } else if (text.includes('verde') || text.includes('salvia') || text.includes('sage')) {
    suggestedFinish = 'sage';
  } else if (text.includes('escuro') || text.includes('nogueira') || text.includes('espresso')) {
    suggestedFinish = 'espresso';
  }

  return {
    category,
    displayTitle,
    wCm: Math.round(w),
    hCm: Math.round(h),
    dCm: Math.round(d),
    doorCount,
    hasDrawers,
    hasShelf,
    isAutoImagined,
    suggestedFinish,
    furnitureId110: prof110 ? prof110.id : null,
    accessories115: accessories.map((a) => a.id),
    kind: prof110 && prof110.kind ? prof110.kind : (custom ? custom.kind : null),
    levels: prof110 && prof110.levels ? prof110.levels : (custom ? custom.levels : 0),
    dna: prof110 && prof110.dna ? prof110.dna : (custom && custom.dna ? custom.dna : null),
    brace: prof110 && prof110.brace ? prof110.brace : (custom && custom.brace ? custom.brace : null),
    legs6: Boolean((prof110 && prof110.legs6) || (custom && custom.legs6)),
    back: Boolean((prof110 && prof110.back) || (custom && custom.back)),
    drawer: Boolean((prof110 && prof110.drawer) || (custom && custom.drawer)),
    opts,
    fallback: !known
  };
}

export function frameCameraToModel(widthUnits, heightUnits, camera, controls) {
  const centerY = heightUnits * 0.5;
  const maxDim = Math.max(widthUnits, heightUnits * 1.15);
  const dist = THREE.MathUtils.clamp(maxDim * 1.78, 2.35, 5.6);

  controls.target.set(0, centerY, 0);
  camera.position.set(dist * 0.72, centerY + dist * 0.42, dist * 0.88);
  controls.update();
}

export function createFurnitureBuilders(ctx) {
  const {
    furnitureRoot,
    boxGeo,
    FINISHES,
    PAINT_BUCKETS,
    createWoodTexturesFromConfig,
    parseDna,
    registerPart,
    registerOpenable,
    clearFurniture,
    createPartWoodMaterial,
    createStonePartMaterial,
    inoxMat,
    chromeMat,
    cavityMat,
    ledStripMat,
    metalMat,
    getCurrentFinish,
    setHasLedFeature,
    setLedLight
  } = ctx;

  function cfgFor(c) {
    const cur = getCurrentFinish();
    return FINISHES[c] || PAINT_BUCKETS.find((b) => b.id === c) || FINISHES[cur];
  }

  function applyAccessory115Details(spec) {
    const accIds = spec.accessories115 || [];
    if (!accIds.length) return;
    const w = spec.wCm / 100;
    const h = spec.hCm / 100;
    const d = spec.dCm / 100;

    accIds.forEach((id) => {
      const item = ACCESSORIES_115_MAP.find((a) => a.id === id);
      if (!item) return;

      if (item.group === 'glass') {
        const glassMesh = new THREE.Mesh(
          boxGeo(Math.max(0.2, w * 0.78), Math.max(0.18, Math.min(0.65, h * 0.42)), 0.008),
          createGlassMaterial(item.type)
        );
        glassMesh.position.set(0, Math.min(h - 0.14, h * 0.58), d / 2 + 0.012);
        registerPart(glassMesh, { x: 0, y: 0.25, z: 0.52 }, {
          name: `Acessório #${id} (${item.type})`,
          dimsCm: { w: Math.round(w * 78), h: Math.round(Math.min(0.65, h * 0.42) * 100), d: 0.8 },
          paintable: false
        });
      } else if (item.group === 'wicker') {
        const wickerMesh = new THREE.Mesh(
          boxGeo(Math.max(0.2, w * 0.72), Math.max(0.16, h * 0.36), 0.01),
          createWickerMaterial()
        );
        wickerMesh.position.set(0, h * 0.52, d / 2 + 0.01);
        registerPart(wickerMesh, { x: 0, y: 0.2, z: 0.48 }, {
          name: `Acessório #${id} (${item.type})`,
          dimsCm: { w: Math.round(w * 72), h: Math.round(h * 36), d: 1.0 },
          paintable: false
        });
      } else if (item.group === 'leather') {
        const pull = new THREE.Mesh(boxGeo(0.022, 0.11, 0.024), createLeatherMaterial());
        pull.position.set(w * 0.25, h * 0.55, d / 2 + 0.022);
        registerPart(pull, { x: 0.1, y: 0.1, z: 0.45 }, {
          name: `Puxador Couro #${id}`,
          dimsCm: { w: 2.2, h: 11, d: 2.4 },
          paintable: false
        });
      } else if (item.group === 'led' || item.group === 'power') {
        setHasLedFeature(true);
        const strip = new THREE.Mesh(boxGeo(Math.max(0.2, w - 0.08), 0.014, 0.016), ledStripMat);
        strip.position.set(0, Math.max(0.12, h - 0.06), d / 2 + 0.008);
        registerPart(strip, { x: 0, y: 0.35, z: 0.35 }, {
          name: `Elétrica/LED #${id}`,
          dimsCm: { w: Math.max(20, spec.wCm - 8), h: 1.4, d: 1.6 },
          paintable: false
        });
        const pt = new THREE.PointLight(0xffb84d, 0, 2.4, 1.6);
        pt.position.set(0, h * 0.65, d / 2 + 0.2);
        furnitureRoot.add(pt);
        setLedLight(pt);
      } else if (item.group === 'feet') {
        const feetGroup = new THREE.Group();
        [-1, 1].forEach((ix) => [-1, 1].forEach((iz) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.12, 14), chromeMat);
          leg.position.set(ix * (w / 2 - 0.06), 0.06, iz * (d / 2 - 0.06));
          feetGroup.add(leg);
        }));
        registerPart(feetGroup, { x: 0, y: -0.2, z: 0 }, {
          name: `Apoio/Pé #${id}`,
          dimsCm: { w: 3.6, h: 12, d: 3.6 },
          paintable: false
        });
      } else if (item.group === 'kitchen_org' || item.group === 'closet_org' || item.group === 'handle' || item.group === 'hinge' || item.group === 'slide' || item.group === 'sliding' || item.group === 'latch' || item.group === 'profile' || item.group === 'mount') {
        const hwAcc = new THREE.Mesh(
          boxGeo(Math.min(0.45, Math.max(0.06, w * 0.35)), 0.024, Math.min(0.35, Math.max(0.04, d * 0.35))),
          chromeMat
        );
        hwAcc.position.set(0, Math.min(h - 0.08, Math.max(0.18, h * 0.45)), d * 0.25);
        registerPart(hwAcc, { x: 0, y: 0.15, z: 0.4 }, {
          name: `Ferragem/Organizador #${id} (${item.type})`,
          dimsCm: { w: Math.round(Math.min(0.45, Math.max(0.06, w * 0.35)) * 100), h: 2.4, d: Math.round(Math.min(0.35, Math.max(0.04, d * 0.35)) * 100) },
          paintable: false
        });
      }
    });
  }

  function buildProceduralSinkCabinet(spec) {
    clearFurniture();
    const w = spec.wCm / 100;
    const h = spec.hCm / 100;
    const d = spec.dCm / 100;
    const t = 0.022;
    const plinthH = 0.08;
    const boxH = Math.max(0.2, h - plinthH - 0.036);

    const plinthBox = new THREE.Mesh(boxGeo(w - 0.04, plinthH, d - 0.06), createPartWoodMaterial(true));
    plinthBox.position.set(0, plinthH / 2, -0.015);
    registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
      name: 'Rodapé Base',
      dimsCm: { w: spec.wCm - 4, h: 8, d: spec.dCm - 6 }
    });

    const bottom = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
    bottom.position.set(0, plinthH + t / 2, 0);
    registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
      name: 'Base Inferior',
      dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
    });

    const leftSide = new THREE.Mesh(boxGeo(t, boxH - t, d), createPartWoodMaterial(false));
    leftSide.position.set(-w / 2 + t / 2, plinthH + boxH / 2 + t / 2, 0);
    registerPart(leftSide, { x: -0.48, y: 0.1, z: 0 }, {
      name: 'Parede Lateral Esquerda',
      dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm }
    });

    const rightSide = new THREE.Mesh(boxGeo(t, boxH - t, d), createPartWoodMaterial(false));
    rightSide.position.set(w / 2 - t / 2, plinthH + boxH / 2 + t / 2, 0);
    registerPart(rightSide, { x: 0.48, y: 0.1, z: 0 }, {
      name: 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm }
    });

    const frontRail = new THREE.Mesh(boxGeo(w - t * 2, 0.06, t), createPartWoodMaterial(true));
    frontRail.position.set(0, plinthH + boxH - 0.03, d / 2 - t / 2);
    registerPart(frontRail, { x: 0, y: 0.25, z: 0.35 }, {
      name: 'Travessa Frontal',
      dimsCm: { w: Math.round((w - t * 2) * 100), h: 6, d: 2.2 }
    });

    const useSideDrawers = spec.hasDrawers && w >= 1.15;
    const drawerColW = useSideDrawers ? Math.min(0.42, w * 0.34) : 0;
    const doorsAreaW = w - t * 2 - (useSideDrawers ? drawerColW + t : 0);
    const doorsCenterX = -w / 2 + t + doorsAreaW / 2;

    if (useSideDrawers) {
      const divX = -w / 2 + t + doorsAreaW + t / 2;
      const divider = new THREE.Mesh(boxGeo(t, boxH - t, d - 0.03), createPartWoodMaterial(false));
      divider.position.set(divX, plinthH + boxH / 2 + t / 2, -0.01);
      registerPart(divider, { x: 0.12, y: 0.35, z: -0.2 }, {
        name: 'Divisória Interna',
        dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm - 3 }
      });

      const drawerH = (boxH - t - 0.018) / 3;
      const drawerCenterX = divX + t / 2 + drawerColW / 2;

      for (let i = 0; i < 3; i++) {
        const dg = new THREE.Group();
        const dy = plinthH + t + drawerH * (i + 0.5) + i * 0.005;
        dg.position.set(drawerCenterX, dy, d / 2 - t / 2);

        const drawerMat = createPartWoodMaterial(false);
        const front = new THREE.Mesh(boxGeo(drawerColW - 0.006, drawerH - 0.006, t), drawerMat);
        dg.add(front);

        const handle = new THREE.Mesh(boxGeo(0.11, 0.012, 0.02), chromeMat);
        handle.position.set(0, drawerH * 0.25, 0.018);
        handle.userData.nonPaintable = true;
        dg.add(handle);

        const inner = new THREE.Mesh(boxGeo(drawerColW - 0.04, drawerH * 0.65, d - 0.08), drawerMat);
        inner.position.set(0, -0.01, -(d - 0.08) / 2);
        dg.add(inner);

        const pInfo = registerPart(dg, { x: 0.38, y: 0.05 * i, z: 0.55 + i * 0.1 }, {
          name: `Gaveta ${3 - i}`,
          dimsCm: { w: Math.round(drawerColW * 100), h: Math.round(drawerH * 100), d: spec.dCm - 8 }
        });

        registerOpenable(pInfo, {
          openOffset: new THREE.Vector3(0, 0, 0.24 - i * 0.045)
        });
      }
    }

    if (spec.hasShelf) {
      const shelf = new THREE.Mesh(boxGeo(doorsAreaW - 0.006, t, d - 0.08), createPartWoodMaterial(true));
      shelf.position.set(doorsCenterX, plinthH + boxH * 0.46, -0.02);
      registerPart(shelf, { x: -0.15, y: 0.12, z: 0.45 }, {
        name: 'Prateleira Interna',
        dimsCm: { w: Math.round(doorsAreaW * 100), h: 2.2, d: spec.dCm - 8 }
      });
    }

    const doorCount = useSideDrawers ? Math.min(2, spec.doorCount) : spec.doorCount;
    const singleDoorW = (doorsAreaW - (doorCount - 1) * 0.005) / doorCount;
    const doorH = boxH - 0.072;
    const doorY = plinthH + t + doorH / 2;

    for (let i = 0; i < doorCount; i++) {
      const isLeftHinged = i % 2 === 0;
      const slotX = (-w / 2 + t) + singleDoorW * (i + 0.5) + i * 0.005;
      const pivot = new THREE.Group();
      pivot.position.set(isLeftHinged ? slotX - singleDoorW / 2 : slotX + singleDoorW / 2, doorY, d / 2 - t / 2);

      const panel = new THREE.Mesh(boxGeo(singleDoorW, doorH, t), createPartWoodMaterial(false));
      panel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
      pivot.add(panel);

      const knob = new THREE.Mesh(boxGeo(0.014, 0.11, 0.02), chromeMat);
      knob.position.set(isLeftHinged ? singleDoorW - 0.032 : -singleDoorW + 0.032, doorH * 0.28, 0.018);
      knob.userData.nonPaintable = true;
      pivot.add(knob);

      const doorLabel = doorCount === 2 ? (i === 0 ? 'Porta Esquerda' : 'Porta Direita') : `Porta ${i + 1}`;
      const pInfo = registerPart(pivot, { x: (i - doorCount / 2) * 0.24, y: 0, z: 0.68 }, {
        name: doorLabel,
        dimsCm: { w: Math.round(singleDoorW * 100), h: Math.round(doorH * 100), d: 2.2 },
        explodeRot: { x: 0, y: isLeftHinged ? -0.25 : 0.25, z: 0 }
      });

      registerOpenable(pInfo, {
        openRotY: isLeftHinged ? -Math.PI * 0.55 : Math.PI * 0.55
      });
    }

    const topGroup = new THREE.Group();
    topGroup.position.set(0, plinthH + boxH + 0.018, 0.01);

    const slab = new THREE.Mesh(boxGeo(w + 0.03, 0.036, d + 0.03), createStonePartMaterial());
    topGroup.add(slab);

    const sinkW = Math.min(0.52, doorsAreaW * 0.72);
    const sinkD = Math.min(0.36, d * 0.65);
    const basinRim = new THREE.Mesh(boxGeo(sinkW, 0.012, sinkD), inoxMat);
    basinRim.position.set(doorsCenterX, 0.02, 0.01);
    basinRim.userData.nonPaintable = true;
    topGroup.add(basinRim);

    const basinInner = new THREE.Mesh(boxGeo(sinkW - 0.04, 0.014, sinkD - 0.04), cavityMat);
    basinInner.position.set(doorsCenterX, 0.021, 0.01);
    basinInner.userData.nonPaintable = true;
    topGroup.add(basinInner);

    const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 24), chromeMat);
    faucetNeck.position.set(doorsCenterX, 0.1, -sinkD / 2 - 0.03);
    faucetNeck.userData.nonPaintable = true;
    topGroup.add(faucetNeck);

    const faucetSpout = new THREE.Mesh(boxGeo(0.016, 0.014, 0.12), chromeMat);
    faucetSpout.position.set(doorsCenterX, 0.185, -sinkD / 2 + 0.025);
    faucetSpout.userData.nonPaintable = true;
    topGroup.add(faucetSpout);

    registerPart(topGroup, { x: 0, y: 0.65, z: 0 }, {
      name: 'Tampo & Cuba',
      dimsCm: { w: spec.wCm + 3, h: 3.6, d: spec.dCm + 3 }
    });

    applyAccessory115Details(spec);
  }

  function buildProceduralWardrobe(spec) {
    clearFurniture();
    const w = spec.wCm / 100;
    const h = spec.hCm / 100;
    const d = spec.dCm / 100;
    const t = 0.022;
    const plinthH = 0.07;
    const bodyH = Math.max(0.3, h - plinthH);

    const plinthBox = new THREE.Mesh(boxGeo(w - 0.03, plinthH, d - 0.04), createPartWoodMaterial(true));
    plinthBox.position.set(0, plinthH / 2, -0.01);
    registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
      name: 'Base Rodapé',
      dimsCm: { w: spec.wCm - 3, h: 7, d: spec.dCm - 4 }
    });

    const backPanel = new THREE.Mesh(boxGeo(w - 0.01, bodyH - 0.01, 0.012), createPartWoodMaterial(false));
    backPanel.position.set(0, plinthH + bodyH / 2, -d / 2 + 0.006);
    registerPart(backPanel, { x: 0, y: 0.15, z: -0.58 }, {
      name: 'Parede Fundo',
      dimsCm: { w: spec.wCm - 1, h: Math.round(bodyH * 100), d: 1.2 }
    });

    const bottom = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
    bottom.position.set(0, plinthH + t / 2, 0);
    registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
      name: 'Base Inferior',
      dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
    });

    const top = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
    top.position.set(0, plinthH + bodyH - t / 2, 0);
    registerPart(top, { x: 0, y: 0.58, z: 0 }, {
      name: 'Tampo Superior',
      dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
    });

    const leftSide = new THREE.Mesh(boxGeo(t, bodyH - t * 2, d), createPartWoodMaterial(false));
    leftSide.position.set(-w / 2 + t / 2, plinthH + bodyH / 2, 0);
    registerPart(leftSide, { x: -0.48, y: 0.1, z: 0 }, {
      name: 'Parede Lateral Esquerda',
      dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
    });

    const rightSide = new THREE.Mesh(boxGeo(t, bodyH - t * 2, d), createPartWoodMaterial(false));
    rightSide.position.set(w / 2 - t / 2, plinthH + bodyH / 2, 0);
    registerPart(rightSide, { x: 0.48, y: 0.1, z: 0 }, {
      name: 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
    });

    const maleiroY = plinthH + bodyH - 0.42;
    const maleiroShelf = new THREE.Mesh(boxGeo(w - t * 2, t, d - 0.03), createPartWoodMaterial(true));
    maleiroShelf.position.set(0, maleiroY, 0);
    registerPart(maleiroShelf, { x: 0, y: 0.4, z: 0.35 }, {
      name: 'Prateleira Maleiro',
      dimsCm: { w: spec.wCm - 4, h: 2.2, d: spec.dCm - 3 }
    });

    const hasCenterDiv = w >= 1.25;
    if (hasCenterDiv) {
      const midDiv = new THREE.Mesh(boxGeo(t, maleiroY - (plinthH + t), d - 0.04), createPartWoodMaterial(false));
      midDiv.position.set(0, (plinthH + t + maleiroY) / 2, -0.005);
      registerPart(midDiv, { x: 0, y: 0.2, z: 0.3 }, {
        name: 'Divisória Central',
        dimsCm: { w: 2.2, h: Math.round((maleiroY - plinthH - t) * 100), d: spec.dCm - 4 }
      });
    }

    const rodSpan = hasCenterDiv ? w / 2 - t * 1.5 : w - t * 2;
    const rodCenterX = hasCenterDiv ? -w / 4 : 0;
    const hangingRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, rodSpan - 0.02, 20), chromeMat);
    hangingRod.rotation.z = Math.PI / 2;
    hangingRod.position.set(rodCenterX, maleiroY - 0.12, 0);
    registerPart(hangingRod, { x: -0.25, y: 0.25, z: 0.45 }, {
      name: 'Cabideiro Metálico',
      dimsCm: { w: Math.round(rodSpan * 100), h: 2.8, d: 2.8 },
      paintable: false
    });

    const shelfSpan = hasCenterDiv ? w / 2 - t * 1.5 : w - t * 2;
    const shelfCenterX = hasCenterDiv ? w / 4 : 0;
    [0.38, 0.56, 0.74].forEach((ratio, idx) => {
      const sy = plinthH + (maleiroY - plinthH) * ratio;
      const sh = new THREE.Mesh(boxGeo(shelfSpan - 0.01, t, d - 0.05), createPartWoodMaterial(true));
      sh.position.set(shelfCenterX, sy, -0.01);
      registerPart(sh, { x: 0.25, y: 0.1 * idx, z: 0.38 + idx * 0.08 }, {
        name: `Prateleira ${idx + 1}`,
        dimsCm: { w: Math.round(shelfSpan * 100), h: 2.2, d: spec.dCm - 5 }
      });
    });

    if (spec.hasDrawers) {
      const drawerW = shelfSpan - 0.04;
      for (let g = 0; g < 2; g++) {
        const dg = new THREE.Group();
        const gy = plinthH + t + 0.11 + g * 0.19;
        dg.position.set(shelfCenterX, gy, d / 2 - 0.04);
        const dFront = new THREE.Mesh(boxGeo(drawerW, 0.17, 0.02), createPartWoodMaterial(false));
        dg.add(dFront);
        const pInfo = registerPart(dg, { x: 0.3, y: 0.05, z: 0.55 + g * 0.1 }, {
          name: `Gaveta Interna ${g + 1}`,
          dimsCm: { w: Math.round(drawerW * 100), h: 17, d: spec.dCm - 8 }
        });
        registerOpenable(pInfo, { openOffset: new THREE.Vector3(0, 0, 0.22) });
      }
    }

    const doorCount = spec.doorCount;
    const totalInnerW = w - t * 2;
    const singleDoorW = (totalInnerW - (doorCount - 1) * 0.005) / doorCount;
    const doorH = bodyH - t * 2 - 0.008;
    const doorY = plinthH + bodyH / 2;

    for (let i = 0; i < doorCount; i++) {
      const isLeftHinged = i % 2 === 0;
      const slotX = -totalInnerW / 2 + singleDoorW * (i + 0.5) + i * 0.005;
      const pivot = new THREE.Group();
      pivot.position.set(isLeftHinged ? slotX - singleDoorW / 2 : slotX + singleDoorW / 2, doorY, d / 2 + 0.002);

      const doorPanel = new THREE.Mesh(boxGeo(singleDoorW, doorH, t), createPartWoodMaterial(false));
      doorPanel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
      pivot.add(doorPanel);

      const longHandle = new THREE.Mesh(boxGeo(0.014, 0.32, 0.022), chromeMat);
      longHandle.position.set(isLeftHinged ? singleDoorW - 0.032 : -singleDoorW + 0.032, 0, 0.018);
      longHandle.userData.nonPaintable = true;
      pivot.add(longHandle);

      const pInfo = registerPart(pivot, { x: (i - doorCount / 2) * 0.22, y: 0, z: 0.74 }, {
        name: `Porta ${i + 1}`,
        dimsCm: { w: Math.round(singleDoorW * 100), h: Math.round(doorH * 100), d: 2.2 },
        explodeRot: { x: 0, y: isLeftHinged ? -0.22 : 0.22, z: 0 }
      });
      registerOpenable(pInfo, {
        openRotY: isLeftHinged ? -Math.PI * 0.54 : Math.PI * 0.54
      });
    }

    applyAccessory115Details(spec);
  }

  function buildProceduralKitchen(spec) {
    clearFurniture();
    const w = spec.wCm / 100;
    const totalH = spec.hCm / 100;
    const d = spec.dCm / 100;
    const t = 0.022;
    const lowerH = 0.86;

    const plinthBox = new THREE.Mesh(boxGeo(w - 0.04, 0.08, d - 0.05), createPartWoodMaterial(true));
    plinthBox.position.set(0, 0.04, -0.015);
    registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
      name: 'Rodapé Balcão',
      dimsCm: { w: spec.wCm - 4, h: 8, d: spec.dCm - 5 }
    });

    const lowerBoxH = lowerH - 0.0
