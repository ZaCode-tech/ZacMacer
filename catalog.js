/**
 * ZacFurniture — Gerador Estrutural de 1.500 Modelos Distintos
 * Cada modelo possui arquitetura, proporções, vãos, prateleiras frontais/traseiras,
 * divisórias, zonas ripadas, portas, gavetas e bases estruturalmente únicas.
 * Todos utilizam acabamento padrão Nogueira Natural para foco 100% estrutural.
 */
(function (window) {
  const ARCHETYPES = [
    { key: 'balcao', label: 'Balcão Gourmet / Recepção', wRange: [120, 260], hRange: [85, 110], dRange: [50, 75] },
    { key: 'painel', label: 'Painel Ripado & Rack TV', wRange: [160, 300], hRange: [140, 240], dRange: [35, 48] },
    { key: 'estante', label: 'Estante Arquitetônica', wRange: [80, 220], hRange: [160, 240], dRange: [32, 45] },
    { key: 'aparador', label: 'Aparador Estrutural', wRange: [100, 200], hRange: [75, 92], dRange: [35, 46] },
    { key: 'ilha', label: 'Ilha Central Multifuncional', wRange: [140, 260], hRange: [88, 96], dRange: [70, 100] },
    { key: 'mesa', label: 'Mesa de Jantar / Reunião', wRange: [140, 280], hRange: [75, 78], dRange: [80, 110] },
    { key: 'escrivaninha', label: 'Estação Home Office', wRange: [110, 200], hRange: [75, 82], dRange: [55, 70] },
    { key: 'rack', label: 'Rack Baixo Suspenso / Piso', wRange: [130, 240], hRange: [48, 68], dRange: [38, 48] },
    { key: 'armario', label: 'Armário Alto Organizador', wRange: [70, 180], hRange: [170, 230], dRange: [45, 60] },
    { key: 'cristaleira', label: 'Cristaleira com Nichos', wRange: [65, 130], hRange: [175, 220], dRange: [38, 48] },
    { key: 'comoda', label: 'Cômoda Modular', wRange: [90, 160], hRange: [80, 115], dRange: [45, 55] },
    { key: 'nicho', label: 'Módulo de Nichos Geométricos', wRange: [90, 210], hRange: [60, 150], dRange: [28, 38] },
    { key: 'bancada', label: 'Bancada de Atendimento', wRange: [150, 280], hRange: [95, 115], dRange: [55, 75] },
    { key: 'roupeiro', label: 'Guarda-Roupa Estrutural', wRange: [140, 270], hRange: [200, 245], dRange: [55, 65] },
    { key: 'bar', label: 'Cantinho do Café / Bar', wRange: [85, 160], hRange: [90, 185], dRange: [42, 55] }
  ];

  const STRUCTURAL_PROFILES = [
    'Simétrico com Divisória Central',
    'Assimétrico com Torre Lateral',
    'Frente Ripada + Prateleiras Traseiras',
    'Vão Livre Inferior + Nichos Superiores',
    'Dupla Face com Divisórias Cruzadas',
    'Base Suspensa com Canal de LED',
    'Estrutura em Pórtico Reforçado',
    'Módulos Escalonados em Degrau',
    'Compartimento Fechado + Adega/Nicho',
    'Corpo Duplo com Balcão Passa-Prato'
  ];

  const BASE_TYPES = ['rodape', 'pes_palito', 'metalon', 'suspenso'];
  const SLAT_ZONES = ['none', 'full_front', 'left_wing', 'right_wing', 'center_band'];

  function seededStep(index, mod, offset = 0) {
    return ((index * 37 + offset * 13) % mod);
  }

  function generate1500StructuralCatalog() {
    const models = [];
    const total = 1500;

    for (let i = 1; i <= total; i++) {
      const arch = ARCHETYPES[(i - 1) % ARCHETYPES.length];
      const variantIdx = Math.floor((i - 1) / ARCHETYPES.length); // 0..99

      // Dimensões estruturais variadas deterministicamente
      const wSpan = arch.wRange[1] - arch.wRange[0];
      const hSpan = arch.hRange[1] - arch.hRange[0];
      const dSpan = arch.dRange[1] - arch.dRange[0];

      const width = arch.wRange[0] + (seededStep(variantIdx, Math.floor(wSpan / 5) + 1, 1) * 5);
      const height = arch.hRange[0] + (seededStep(variantIdx, Math.floor(hSpan / 3) + 1, 2) * 3);
      const depth = arch.dRange[0] + (seededStep(variantIdx, Math.floor(dSpan / 2) + 1, 3) * 2);

      // Topologia interna distinta para cada variação (0..99)
      const dividers = variantIdx % 5; // 0, 1, 2, 3, 4 divisórias internas
      const frontShelves = Math.floor(variantIdx / 5) % 4; // 0..3 prateleiras frontais
      const rearShelves = (arch.key === 'balcao' || arch.key === 'ilha' || arch.key === 'bancada' || variantIdx % 3 === 0)
        ? ((variantIdx % 3) + 1)
        : (variantIdx % 2);
      const doors = (arch.key === 'mesa' || arch.key === 'nicho') ? 0 : (variantIdx % 4);
      const drawers = (arch.key === 'mesa' || arch.key === 'painel') ? 0 : (Math.floor(variantIdx / 7) % 4);
      const slatZone = SLAT_ZONES[(variantIdx + arch.key.length) % SLAT_ZONES.length];
      const baseType = BASE_TYPES[variantIdx % BASE_TYPES.length];
      const ledMode = (variantIdx % 4 === 0) ? 'frio' : (variantIdx % 4 === 2 ? 'quente' : null);
      const asymmetricRatio = [0.5, 0.35, 0.65, 0.4, 0.6][variantIdx % 5];

      const profileName = STRUCTURAL_PROFILES[variantIdx % STRUCTURAL_PROFILES.length];
      const code = `ZF-${String(i).padStart(4, '0')}`;

      models.push({
        id: code,
        index: i,
        category: arch.key,
        categoryLabel: arch.label,
        name: `${arch.label.split('/')[0].trim()} ${code} — ${profileName}`,
        width,
        height,
        depth,
        dividers,
        frontShelves,
        rearShelves,
        doors,
        drawers,
        slatZone,
        baseType,
        ledMode,
        asymmetricRatio
      });
    }

    return models;
  }

  window.ZAC_CATALOG = generate1500StructuralCatalog();
})(window);
