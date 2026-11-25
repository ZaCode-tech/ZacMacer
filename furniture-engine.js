/**
 * ZacFurniture — Motor Paramétrico 3D, Interpretador de Pedidos e Modo Detalhado
 * Renderiza modelos estruturais em Three.js, interpreta linguagem natural em português,
 * gera parafusos e dobradiças 3D no Modo Detalhado e calcula plano de corte.
 */
(function (window) {
  const DEFAULT_WOOD = '#7A563A'; // Nogueira Natural Padrão
  const SECONDARY_LINEN = '#DFD7C8';
  const DARK_WALNUT = '#4A3525';

  function uid(prefix = 'part') {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Converte uma especificação estrutural (do catálogo ou do prompt) em lista de peças 3D
   */
  function buildPartsFromSpec(spec) {
    const W = Number(spec.width) || 180;
    const H = Number(spec.height) || 95;
    const D = Number(spec.depth) || 60;
    const t = 2.0; // Espessura padrão MDF 20mm (2cm)
    const parts = [];

    // 1. Base / Pés
    let bodyBottomY = 0;
    if (spec.baseType === 'rodape') {
      const baseH = 8;
      parts.push({
        id: uid('base'),
        name: 'Base / Rodapé Recuado',
        role: 'base',
        x: 0, y: baseH / 2, z: 0,
        w: W - 4, h: baseH, d: D - 6,
        color: DARK_WALNUT
      });
      bodyBottomY = baseH;
    } else if (spec.baseType === 'pes_palito' || spec.baseType === 'metalon') {
      const legH = spec.category === 'mesa' || spec.category === 'escrivaninha' ? H - t : 16;
      const legColor = spec.baseType === 'metalon' ? '#2E2A27' : DARK_WALNUT;
      const offsets = [
        [-W / 2 + 5, -D / 2 + 5],
        [W / 2 - 5, -D / 2 + 5],
        [-W / 2 + 5, D / 2 - 5],
        [W / 2 - 5, D / 2 - 5]
      ];
      offsets.forEach(([lx, lz], idx) => {
        parts.push({
          id: uid('pe'),
          name: `Pé Estrutural ${idx + 1}`,
          role: 'base',
          x: lx, y: legH / 2, z: lz,
          w: 4, h: legH, d: 4,
          color: legColor
        });
      });
      bodyBottomY = legH;
    } else if (spec.baseType === 'suspenso') {
      bodyBottomY = 22; // Flutuante a 22cm do piso
    }

    // Se for Mesa Simples
    if (spec.category === 'mesa' || spec.category === 'escrivaninha') {
      parts.push({
        id: uid('tampo'),
        name: 'Tampo Principal Engrossado',
        role: 'tampo',
        x: 0, y: H - 1.8, z: 0,
        w: W, h: 3.6, d: D,
        color: DEFAULT_WOOD
      });
      if (spec.drawers > 0) {
        const boxW = Math.min(W * 0.42, 65);
        parts.push({
          id: uid('gav'),
          name: 'Gaveteiro Suspenso Sob Tampo',
          role: 'gaveta',
          x: W / 2 - boxW / 2 - 6, y: H - 11, z: 0,
          w: boxW, h: 14, d: D - 8,
          color: SECONDARY_LINEN
        });
      }
      if (spec.ledMode) {
        parts.push({
          id: uid('led'),
          name: `Fita LED ${spec.ledMode === 'frio' ? 'Frio 6500K' : 'Quente 3000K'}`,
          role: 'led',
          x: 0, y: H - 4, z: D / 2 - 2,
          w: W - 8, h: 1.2, d: 1.5,
          color: spec.ledMode === 'frio' ? '#DDF4FF' : '#FFD384',
          ledMode: spec.ledMode
        });
      }
      return parts;
    }

    const bodyH = Math.max(30, H - bodyBottomY);
    const innerH = bodyH - t * 2;
    const innerCenterY = bodyBottomY + bodyH / 2;

    // 2. Tampo Superior e Base Inferior da Caixa
    parts.push({
      id: uid('tampo'),
      name: 'Tampo Superior',
      role: 'tampo',
      x: 0, y: bodyBottomY + bodyH - t / 2, z: 0,
      w: W, h: t, d: D,
      color: DEFAULT_WOOD
    });

    parts.push({
      id: uid('base_caixa'),
      name: 'Base Inferior da Caixa',
      role: 'base',
      x: 0, y: bodyBottomY + t / 2, z: 0,
      w: W - t * 2, h: t, d: D - 1,
      color: DEFAULT_WOOD
    });

    // 3. Laterais Esquerda e Direita
    parts.push({
      id: uid('lat_esq'),
      name: 'Lateral Esquerda',
      role: 'lateral',
      x: -W / 2 + t / 2, y: innerCenterY, z: 0,
      w: t, h: bodyH - t, d: D - 1,
      color: DEFAULT_WOOD
    });

    parts.push({
      id: uid('lat_dir'),
      name: 'Lateral Direita',
      role: 'lateral',
      x: W / 2 - t / 2, y: innerCenterY, z: 0,
      w: t, h: bodyH - t, d: D - 1,
      color: DEFAULT_WOOD
    });

    // 4. Painel Ripado Frontal (ou parcial conforme topologia)
    const hasRearShelves = (spec.rearShelves || 0) > 0;
    const slatZone = spec.slatZone || 'none';

    if (slatZone !== 'none') {
      let slatW = W - 2;
      let slatX = 0;
      if (slatZone === 'left_wing') {
        slatW = (W - 4) * 0.45;
        slatX = -W / 2 + slatW / 2 + 1;
      } else if (slatZone === 'right_wing') {
        slatW = (W - 4) * 0.45;
        slatX = W / 2 - slatW / 2 - 1;
      } else if (slatZone === 'center_band') {
        slatW = (W - 4) * 0.55;
        slatX = 0;
      }

      parts.push({
        id: uid('ripado'),
        name: 'Painel Ripado Frontal',
        role: 'ripado',
        x: slatX,
        y: innerCenterY,
        z: D / 2 - 1.2,
        w: slatW,
        h: bodyH - t * 2,
        d: 2.2,
        color: DEFAULT_WOOD,
        slatted: true
      });
    }

    // 5. Divisórias Internas
    const divCount = Math.max(0, Math.min(5, spec.dividers || 0));
    const usableW = W - t * 2;
    const ratio = spec.asymmetricRatio || 0.5;

    for (let i = 0; i < divCount; i++) {
      let dx = 0;
      if (divCount === 1) {
        dx = (ratio - 0.5) * usableW * 0.6;
      } else {
        const step = usableW / (divCount + 1);
        dx = -usableW / 2 + step * (i + 1);
      }

      parts.push({
        id: uid('div'),
        name: `Divisória Interna ${i + 1}`,
        role: 'divisoria',
        x: dx,
        y: innerCenterY,
        z: hasRearShelves ? 0 : -1,
        w: t,
        h: innerH,
        d: D - 5,
        color: DEFAULT_WOOD
      });
    }

    // 6. Prateleiras Traseiras (Abertas para a parte de trás do móvel)
    const rearCount = Math.max(0, Math.min(4, spec.rearShelves || 0));
    if (rearCount > 0) {
      const rearDepth = Math.max(18, (D - 6) * 0.48);
      const rearZ = -D / 2 + rearDepth / 2 + 1;

      // Painel divisor longitudinal central para separar frente ripada das prateleiras traseiras
      parts.push({
        id: uid('fundo_centro'),
        name: 'Painel Divisor Frente/Trás',
        role: 'fundo',
        x: 0,
        y: innerCenterY,
        z: rearZ + rearDepth / 2 + 0.8,
        w: usableW,
        h: innerH,
        d: 1.5,
        color: SECONDARY_LINEN
      });

      for (let r = 0; r < rearCount; r++) {
        const sy = bodyBottomY + t + (innerH / (rearCount + 1)) * (r + 1);
        parts.push({
          id: uid('prat_tras'),
          name: `Prateleira Traseira ${r + 1}`,
          role: 'prateleira_tras',
          x: 0,
          y: sy,
          z: rearZ,
          w: usableW,
          h: t,
          d: rearDepth,
          color: DEFAULT_WOOD
        });
      }
    }

    // 7. Prateleiras Frontais / Internas
    const frontCount = Math.max(0, Math.min(4, spec.frontShelves || 0));
    if (frontCount > 0 && slatZone !== 'full_front') {
      const frontDepth = hasRearShelves ? (D - 6) * 0.44 : D - 6;
      const frontZ = hasRearShelves ? D / 2 - frontDepth / 2 - 2 : 0;

      for (let f = 0; f < frontCount; f++) {
        const fy = bodyBottomY + t + (innerH / (frontCount + 1)) * (f + 1);
        parts.push({
          id: uid('prat_frente'),
          name: `Prateleira Interna ${f + 1}`,
          role: 'prateleira_frente',
          x: 0,
          y: fy,
          z: frontZ,
          w: usableW,
          h: t,
          d: frontDepth,
          color: DEFAULT_WOOD
        });
      }
    }

    // 8. Portas (caso não seja totalmente ripado na frente)
    const doorCount = slatZone === 'full_front' ? 0 : Math.min(4, spec.doors || 0);
    if (doorCount > 0) {
      const doorAreaW = usableW / doorCount;
      const doorH = innerH - 0.6;
      for (let d = 0; d < doorCount; d++) {
        const doorX = -usableW / 2 + doorAreaW * (d + 0.5);
        parts.push({
          id: uid('porta'),
          name: `Porta Estrutural ${d + 1}`,
          role: 'porta',
          x: doorX,
          y: innerCenterY,
          z: D / 2 - 0.9,
          w: doorAreaW - 0.5,
          h: doorH,
          d: 1.8,
          color: SECONDARY_LINEN,
          hingeSide: d % 2 === 0 ? 'left' : 'right'
        });
      }
    }

    // 9. Gavetas
    const drawerCount = slatZone === 'full_front' ? 0 : Math.min(4, spec.drawers || 0);
    if (drawerCount > 0 && doorCount === 0) {
      const drwH = Math.min(18, (innerH - 2) / drawerCount);
      for (let g = 0; g < drawerCount; g++) {
        const gy = bodyBottomY + bodyH - t - drwH * (g + 0.5) - 0.4 * g;
        parts.push({
          id: uid('gaveta'),
          name: `Gaveta Frontal ${g + 1}`,
          role: 'gaveta',
          x: 0,
          y: gy,
          z: D / 2 - 0.9,
          w: usableW - 1,
          h: drwH - 0.4,
          d: 1.8,
          color: SECONDARY_LINEN
        });
      }
    }

    // 10. Iluminação LED (Frio 6500K ou Quente 3000K)
    if (spec.ledMode) {
      const isCold = spec.ledMode === 'frio';
      parts.push({
        id: uid('led'),
        name: `Fita LED ${isCold ? 'Frio 6500K' : 'Quente 3000K'}`,
        role: 'led',
        x: 0,
        y: bodyBottomY + bodyH - t - 0.8,
        z: D / 2 - 0.4,
        w: W - 4,
        h: 1.2,
        d: 1.4,
        color: isCold ? '#E3F6FF' : '#FFD58C',
        ledMode: spec.ledMode
      });
    }

    return parts;
  }

  /**
   * Interpretador de Prompts em Linguagem Natural (Português)
   * Ex: "Quero criar um balcão ripado de 180cm com iluminação LED Frio, com divisória e pratileira atras"
   */
  function parseNaturalPrompt(text) {
    const raw = (text || '').trim();
    const norm = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Categoria
    let category = 'balcao';
    let categoryLabel = 'Balcão Sob Medida';
    if (norm.includes('painel')) { category = 'painel'; categoryLabel = 'Painel Ripado TV'; }
    else if (norm.includes('estante')) { category = 'estante'; categoryLabel = 'Estante Modular'; }
    else if (norm.includes('mesa')) { category = 'mesa'; categoryLabel = 'Mesa Estrutural'; }
    else if (norm.includes('escrivaninha')) { category = 'escrivaninha'; categoryLabel = 'Escrivaninha'; }
    else if (norm.includes('aparador')) { category = 'aparador'; categoryLabel = 'Aparador'; }
    else if (norm.includes('ilha')) { category = 'ilha'; categoryLabel = 'Ilha Gourmet'; }
    else if (norm.includes('rack')) { category = 'rack'; categoryLabel = 'Rack Suspenso'; }
    else if (norm.includes('armario') || norm.includes('gabinete')) { category = 'armario'; categoryLabel = 'Armário / Gabinete'; }

    // Dimensões (180cm, 1.80m, 1,80m, 1800mm)
    let width = category === 'painel' ? 220 : 180;
    let height = category === 'painel' ? 180 : (category === 'mesa' ? 76 : 95);
    let depth = category === 'painel' ? 38 : (category === 'ilha' ? 80 : 60);

    const cmMatch = norm.match(/(\d{2,3})\s*cm/);
    const mMatch = norm.match(/(\d)[.,](\d{1,2})\s*m(?!m)/);
    const mmMatch = norm.match(/(\d{3,4})\s*mm/);

    if (cmMatch) width = parseInt(cmMatch[1], 10);
    else if (mMatch) width = Math.round(parseFloat(`${mMatch[1]}.${mMatch[2]}`) * 100);
    else if (mmMatch) width = Math.round(parseInt(mmMatch[1], 10) / 10);

    const altMatch = norm.match(/altura\s*(?:de)?\s*(\d{2,3})\s*cm/);
    if (altMatch) height = parseInt(altMatch[1], 10);

    const profMatch = norm.match(/profundidade\s*(?:de)?\s*(\d{2,3})\s*cm/);
    if (profMatch) depth = parseInt(profMatch[1], 10);

    // Ripado
    const isRipado = norm.includes('ripado') || norm.includes('ripa');
    const slatZone = isRipado ? 'full_front' : 'none';

    // Iluminação LED (Frio vs Quente)
    let ledMode = null;
    if (norm.includes('led') || norm.includes('iluminacao') || norm.includes('luz')) {
      if (norm.includes('frio') || norm.includes('fria') || norm.includes('branco') || norm.includes('6000') || norm.includes('6500')) {
        ledMode = 'frio';
      } else {
        ledMode = 'quente';
      }
    }

    // Divisórias
    let dividers = 0;
    if (norm.includes('divisoria') || norm.includes('divisoes') || norm.includes('reparticao')) {
      const numDiv = norm.match(/(\d)\s*divisoria/);
      dividers = numDiv ? parseInt(numDiv[1], 10) : 1;
    }

    // Prateleira atrás / traseira vs frontal
    let rearShelves = 0;
    let frontShelves = 0;
    const hasRearKeyword = norm.includes('atras') || norm.includes('traseira') || norm.includes('verso') || norm.includes('costas');
    const hasShelfKeyword = norm.includes('prateleira') || norm.includes('pratileira');

    if (hasShelfKeyword && hasRearKeyword) {
      const numRear = norm.match(/(\d)\s*prat[ei]leira/);
      rearShelves = numRear ? parseInt(numRear[1], 10) : 2;
    } else if (hasShelfKeyword) {
      const numFront = norm.match(/(\d)\s*prat[ei]leira/);
      frontShelves = numFront ? parseInt(numFront[1], 10) : 2;
    }

    // Portas e Gavetas
    let doors = 0;
    let drawers = 0;
    const doorMatch = norm.match(/(\d)\s*porta/);
    if (doorMatch) doors = parseInt(doorMatch[1], 10);
    else if (norm.includes('com porta')) doors = 2;

    const drawerMatch = norm.match(/(\d)\s*gaveta/);
    if (drawerMatch) drawers = parseInt(drawerMatch[1], 10);
    else if (norm.includes('com gaveta')) drawers = 2;

    const baseType = norm.includes('suspenso') ? 'suspenso' : (norm.includes('metalon') || norm.includes('ferro') ? 'metalon' : 'rodape');

    const spec = {
      id: 'CUSTOM-AI',
      category,
      categoryLabel,
      name: raw.length > 56 ? raw.slice(0, 56) + '...' : (raw || 'Projeto Personalizado'),
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
      asymmetricRatio: 0.5
    };

    spec.parts = buildPartsFromSpec(spec);
    return spec;
  }

  /**
   * Calcula automaticamente posições 3D de Parafusos Estruturais e Dobradiças Caneco 35mm
   */
  function computeHardwareMarkers(parts) {
    const screws = [];
    const hinges = [];

    parts.forEach((p) => {
      // Parafusos nas junções de tampo/base/prateleiras/divisórias
      if (p.role === 'tampo' || p.role === 'base') {
        const sxOffsets = [-p.w / 2 + 2.5, p.w / 2 - 2.5];
        const szOffsets = [-p.d / 2 + 4, p.d / 2 - 4];
        sxOffsets.forEach((ox) => {
          szOffsets.forEach((oz) => {
            screws.push({
              x: p.x + ox,
              y: p.y,
              z: p.z + oz,
              label: `Parafuso Estrutural 4.5x45mm (${p.name})`
            });
          });
        });
      }

      if (p.role === 'divisoria' || p.role === 'prateleira_tras' || p.role === 'prateleira_frente') {
        screws.push(
          {
            x: p.x - p.w / 2 + 1.5,
            y: p.y,
            z: p.z + p.d / 2 - 3,
            label: `Parafuso Minifix / União (${p.name})`
          },
          {
            x: p.x + p.w / 2 - 1.5,
            y: p.y,
            z: p.z + p.d / 2 - 3,
            label: `Parafuso Minifix / União (${p.name})`
          }
        );
      }

      // Dobradiças Caneco 35mm nas portas
      if (p.role === 'porta') {
        const hx = p.hingeSide === 'right' ? p.x + p.w / 2 - 2.2 : p.x - p.w / 2 + 2.2;
        const topY = p.y + p.h / 2 - 9;
        const botY = p.y - p.h / 2 + 9;
        hinges.push(
          { x: hx, y: topY, z: p.z - 0.6, label: `Dobradiça Caneco 35mm Superior (${p.name})` },
          { x: hx, y: botY, z: p.z - 0.6, label: `Dobradiça Caneco 35mm Inferior (${p.name})` }
        );
        if (p.h > 110) {
          hinges.push({ x: hx, y: p.y, z: p.z - 0.6, label: `Dobradiça Caneco 35mm Central (${p.name})` });
        }
      }
    });

    return { screws, hinges };
  }

  /**
   * Constrói o grupo Three.js completo a partir do projeto
   */
  function createFurnitureGroup(project, options = {}) {
    const {
      detailedMode = false,
      explodeFactor = 0,
      selectedPartId = null
    } = options;

    const group = new THREE.Group();
    const parts = project.parts || [];
    const scale = 0.01; // 100cm = 1 unidade Three.js

    // Centro de referência para Vista Explodida
    const centerY = (project.height || 95) / 2;

    parts.forEach((p) => {
      const partGroup = new THREE.Group();
      partGroup.userData = { partId: p.id, partName: p.name };

      // Vetor de explosão
      const ex = p.x * 0.35 * explodeFactor;
      const ey = (p.y - centerY) * 0.28 * explodeFactor;
      const ez = p.z * 0.45 * explodeFactor;

      const isSelected = selectedPartId && selectedPartId === p.id;

      if (p.slatted) {
        // Renderiza ripas verticais reais com espaçamento
        const slatWidth = 2.4;
        const gap = 1.4;
        const step = slatWidth + gap;
        const count = Math.max(2, Math.floor(p.w / step));
        const totalUsed = count * step - gap;
        const startX = -totalUsed / 2 + slatWidth / 2;

        const mat = new THREE.MeshStandardMaterial({
          color: p.color || DEFAULT_WOOD,
          roughness: 0.55,
          metalness: 0.06,
          emissive: isSelected ? '#C86D51' : '#000000',
          emissiveIntensity: isSelected ? 0.35 : 0
        });

        const slatGeo = new THREE.BoxGeometry(slatWidth * scale, p.h * scale, p.d * scale);
        for (let i = 0; i < count; i++) {
          const mesh = new THREE.Mesh(slatGeo, mat);
          mesh.position.set((startX + i * step) * scale, 0, 0);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { partId: p.id };
          partGroup.add(mesh);
        }
      } else if (p.role === 'led') {
        const isCold = p.ledMode === 'frio';
        const ledColor = isCold ? 0xdff5ff : 0xffd285;
        const geo = new THREE.BoxGeometry(p.w * scale, p.h * scale, p.d * scale);
        const mat = new THREE.MeshStandardMaterial({
          color: ledColor,
          emissive: ledColor,
          emissiveIntensity: 2.2,
          roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { partId: p.id };
        partGroup.add(mesh);

        // Luzes reais iluminando o móvel
        const lightPositions = [-p.w * 0.32, 0, p.w * 0.32];
        lightPositions.forEach((lx) => {
          const ptLight = new THREE.PointLight(ledColor, 0.95, 1.45);
          ptLight.position.set(lx * scale, -0.04, 0.06);
          partGroup.add(ptLight);
        });
      } else {
        const geo = new THREE.BoxGeometry(p.w * scale, p.h * scale, p.d * scale);
        const mat = new THREE.MeshStandardMaterial({
          color: p.color || DEFAULT_WOOD,
          roughness: 0.58,
          metalness: 0.05,
          emissive: isSelected ? '#C86D51' : '#000000',
          emissiveIntensity: isSelected ? 0.35 : 0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { partId: p.id };
        partGroup.add(mesh);

        // Contorno sutil de borda para leitura técnica limpa
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x3a281b, transparent: true, opacity: 0.22 })
        );
        partGroup.add(line);
      }

      partGroup.position.set((p.x + ex) * scale, (p.y + ey) * scale, (p.z + ez) * scale);
      group.add(partGroup);
    });

    // Modo Detalhado: Parafusos e Dobradiças 3D
    const hardware = computeHardwareMarkers(parts);
    if (detailedMode) {
      const screwMat = new THREE.MeshStandardMaterial({
        color: 0xd9e2ec,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.35
      });
      const screwGeo = new THREE.CylinderGeometry(0.014, 0.008, 0.045, 12);

      hardware.screws.forEach((s) => {
        const m = new THREE.Mesh(screwGeo, screwMat);
        m.position.set(s.x * scale, s.y * scale, s.z * scale);
        group.add(m);

        // Anel indicador de destaque
        const ringGeo = new THREE.RingGeometry(0.018, 0.026, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xc86d51, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(s.x * scale, s.y * scale + 0.025, s.z * scale);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      });

      const hingeMat = new THREE.MeshStandardMaterial({
        color: 0xc86d51,
        metalness: 0.75,
        roughness: 0.25,
        emissive: 0xc86d51,
        emissiveIntensity: 0.3
      });
      const hingeGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.016, 18);
      hingeGeo.rotateX(Math.PI / 2);

      hardware.hinges.forEach((h) => {
        const m = new THREE.Mesh(hingeGeo, hingeMat);
        m.position.set(h.x * scale, h.y * scale, h.z * scale);
        group.add(m);
      });
    }

    return { group, hardware };
  }

  /**
   * Calcula Plano de Corte, Área de MDF e Orçamento Estimado
   */
  function calculateProjectBOM(project) {
    const parts = project.parts || [];
    let totalAreaM2 = 0;
    let ledMeters = 0;

    const cutRows = parts.map((p) => {
      if (p.role === 'led') {
        ledMeters += p.w / 100;
      } else {
        totalAreaM2 += (p.w / 100) * (p.h / 100);
      }
      return {
        name: p.name,
        dimensions: `${Math.round(p.w * 10)} × ${Math.round(p.h * 10)} × ${Math.round(p.d * 10)} mm`
      };
    });

    const hw = computeHardwareMarkers(parts);
    const sheetsNeeded = Math.max(1, Math.ceil(totalAreaM2 / 4.2)); // Chapa padrão 2.75 x 1.83m (~5m² útil ~4.2m²)
    const estimatedPrice =
      sheetsNeeded * 340 +
      ledMeters * 95 +
      hw.screws.length * 1.2 +
      hw.hinges.length * 18 +
      680; // Mão de obra marcenaria sob medida

    return {
      cutRows,
      sheetsNeeded,
      ledMeters: ledMeters.toFixed(2),
      screwCount: hw.screws.length,
      hingeCount: hw.hinges.length,
      hardwareList: [...hw.screws, ...hw.hinges],
      estimatedPrice: Math.round(estimatedPrice)
    };
  }

  window.ZacEngine = {
    DEFAULT_WOOD,
    SECONDARY_LINEN,
    DARK_WALNUT,
    buildPartsFromSpec,
    parseNaturalPrompt,
    computeHardwareMarkers,
    createFurnitureGroup,
    calculateProjectBOM
  };
})(window);
