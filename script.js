import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ==========================================================================
   1. ACABAMENTOS DE MADEIRA & BALDES DE TINTA (PBR)
   ========================================================================== */
const FINISHES = {
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

const PAINT_BUCKETS = [
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

function createWoodTexturesFromConfig(cfg) {
  const size = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  ctx.fillStyle = cfg.baseColor;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const lineCount = cfg.isLacquer ? 75 : 210;
  for (let i = 0; i < lineCount; i++) {
    const xBase = (i / lineCount) * size;
    const waveFreq = 0.008 + (i % 7) * 0.0015;
    const waveAmp = cfg.isLacquer ? 2.0 : 8 + (i % 5) * 2.2;
    const phase = i * 0.37;

    ctx.beginPath();
    bCtx.beginPath();

    for (let y = 0; y <= size; y += 8) {
      const offset =
        Math.sin(y * waveFreq + phase) * waveAmp +
        Math.cos(y * waveFreq * 0.45 - phase) * (waveAmp * 0.4);
      const x = xBase + offset;
      if (y === 0) {
        ctx.moveTo(x, y);
        bCtx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = i % 3 === 0 ? cfg.highlightColor : cfg.grainColor;
    ctx.globalAlpha = cfg.isLacquer ? 0.1 : (i % 4 === 0 ? 0.38 : 0.22);
    ctx.lineWidth = cfg.isLacquer ? 1.0 : (1 + (i % 3) * 0.85);
    ctx.stroke();

    bCtx.strokeStyle = i % 2 === 0 ? '#686868' : '#969696';
    bCtx.globalAlpha = cfg.isLacquer ? 0.12 : 0.35;
    bCtx.lineWidth = 1.2;
    bCtx.stroke();
  }

  if (!cfg.isLacquer) {
    for (let p = 0; p < 900; p++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const len = 6 + Math.random() * 18;
      ctx.fillStyle = cfg.grainColor;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(px, py, 1, len);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

/* ==========================================================================
   2. CENA 3D, ILUMINAÇÃO DE ESTÚDIO E CONTROLES DE CÂMERA
   ========================================================================== */
const container = document.getElementById('canvasContainer');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  38,
  Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
  0.1,
  50
);
camera.position.set(2.35, 1.55, 2.85);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
container.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 1.2;
controls.maxDistance = 7.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 0.55, 0);

const hemiLight = new THREE.HemisphereLight(0xfff5e8, 0x2b1d16, 0.78);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff1de, 1.85);
keyLight.position.set(3.4, 5.2, 3.6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 16;
keyLight.shadow.camera.left = -2.8;
keyLight.shadow.camera.right = 2.8;
keyLight.shadow.camera.top = 3.2;
keyLight.shadow.camera.bottom = -1.5;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9caf88, 0.65);
rimLight.position.set(-3.0, 2.5, -2.5);
scene.add(rimLight);

const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14),
  new THREE.ShadowMaterial({ opacity: 0.34 })
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = 0;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

const plinthGeo = new THREE.CylinderGeometry(1.55, 1.6, 0.025, 64);
const plinthMat = new THREE.MeshStandardMaterial({
  color: 0x221610,
  roughness: 0.85,
  metalness: 0.05
});
const plinth = new THREE.Mesh(plinthGeo, plinthMat);
plinth.position.y = -0.013;
plinth.receiveShadow = true;
scene.add(plinth);

/* ==========================================================================
   3. MATERIAIS POR PEÇA (PARA PERMITIR PINTURA INDIVIDUAL)
   ========================================================================== */
let currentFinish = 'espresso';
const partMaterials = [];

function createPartWoodMaterial(rotateGrain = false, customCfg = null) {
  const cfg = customCfg || FINISHES[currentFinish];
  const { map, bumpMap } = createWoodTexturesFromConfig(cfg);
  if (rotateGrain) {
    map.center.set(0.5, 0.5);
    map.rotation = Math.PI / 2;
    bumpMap.center.set(0.5, 0.5);
    bumpMap.rotation = Math.PI / 2;
  }
  const mat = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: 0.008,
    roughness: cfg.roughness,
    metalness: cfg.metalness
  });
  mat.userData.rotateGrain = rotateGrain;
  mat.userData.customPaintName = customCfg ? customCfg.short : null;
  partMaterials.push(mat);
  return mat;
}

function createStonePartMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xefe7da,
    roughness: 0.22,
    metalness: 0.04
  });
  mat.userData.isStone = true;
  mat.userData.rotateGrain = true;
  mat.userData.customPaintName = null;
  partMaterials.push(mat);
  return mat;
}

const inoxMat = new THREE.MeshStandardMaterial({
  color: 0xd8dde2,
  roughness: 0.22,
  metalness: 0.88
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xe6e8ea,
  roughness: 0.16,
  metalness: 0.92
});

const cavityMat = new THREE.MeshStandardMaterial({
  color: 0x231711,
  roughness: 0.8
});

const ledStripMat = new THREE.MeshStandardMaterial({
  color: 0xffd27d,
  emissive: 0xffaa2b,
  emissiveIntensity: 0.0,
  roughness: 0.2
});

/* ==========================================================================
   4. PINCEL 3D INTERATIVO & GOTAS DE TINTA (MODO PINTOR)
   ========================================================================== */
const brush3D = new THREE.Group();
brush3D.visible = false;

const handleMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.011, 0.016, 0.19, 16),
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.45 })
);
handleMesh.position.y = 0.16;
brush3D.add(handleMesh);

const ferruleMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.018, 0.016, 0.032, 16),
  chromeMat
);
ferruleMesh.position.y = 0.055;
brush3D.add(ferruleMesh);

const bristleMat = new THREE.MeshStandardMaterial({
  color: 0x8fa37b,
  roughness: 0.6
});
const bristleMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.044, 0.048, 0.016),
  bristleMat
);
bristleMesh.position.y = 0.024;
brush3D.add(bristleMesh);

brush3D.rotation.z = -0.45;
brush3D.rotation.x = 0.35;
scene.add(brush3D);

let brushSweepTimer = 0;
const paintSplashes = [];

function spawnPaintSplash(point, hexColor) {
  const splashMat = new THREE.MeshBasicMaterial({ color: hexColor });
  for (let i = 0; i < 8; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), splashMat);
    drop.position.copy(point);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.9,
      0.25 + Math.random() * 0.65,
      (Math.random() - 0.5) * 0.9
    );
    scene.add(drop);
    paintSplashes.push({ mesh: drop, vel, life: 0.45 });
  }
}

/* ==========================================================================
   5. CONSTRUTORES PROCEDURAIS DE MÓVEIS + REGISTRO DE PEÇAS E MEDIDAS
   ========================================================================== */
const furnitureRoot = new THREE.Group();
scene.add(furnitureRoot);

let animatedParts = [];
let paintableParts = [];
let interactiveOpenables = [];
let dimensionLinesGroup = new THREE.Group();
scene.add(dimensionLinesGroup);

let ledLight = null;
let doorsOpen = false;
let hasLedFeature = false;
let currentSpec = null;

function formatCmAndM(cmVal) {
  const cmRounded = Math.round(cmVal * 10) / 10;
  const mStr = (cmRounded / 100).toFixed(2).replace('.', ',');
  const cmStr = Number.isInteger(cmRounded) ? `${cmRounded}` : cmRounded.toFixed(1).replace('.', ',');
  return `${cmStr} cm (${mStr} m)`;
}

function formatDimsShort(dimsCm) {
  const f = (n) => (Number.isInteger(Math.round(n * 10) / 10) ? Math.round(n) : (Math.round(n * 10) / 10).toFixed(1).replace('.', ','));
  return `${f(dimsCm.w)} × ${f(dimsCm.h)} × ${f(dimsCm.d)} cm`;
}

function registerPart(obj, explodeOffset, meta = {}) {
  const partInfo = {
    id: `part_${animatedParts.length + 1}`,
    obj,
    name: meta.name || `Peça ${animatedParts.length + 1}`,
    dimsCm: meta.dimsCm || null,
    paintable: meta.paintable !== false,
    paintedColorName: null,
    targetPos: obj.position.clone(),
    explodeOffset: new THREE.Vector3(explodeOffset.x, explodeOffset.y, explodeOffset.z),
    targetRot: obj.rotation.clone(),
    explodeRot: meta.explodeRot || { x: 0, y: 0, z: 0 },
    openable: null,
    calloutEl: null
  };

  obj.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (partInfo.paintable && !child.userData.nonPaintable) {
        child.userData.partRef = partInfo;
      }
    }
  });

  animatedParts.push(partInfo);
  if (partInfo.paintable) {
    paintableParts.push(partInfo);
  }
  furnitureRoot.add(obj);
  return partInfo;
}

function registerOpenable(partInfo, config) {
  const openableData = {
    partInfo,
    obj: partInfo.obj,
    closedOffset: new THREE.Vector3(0, 0, 0),
    openOffset: config.openOffset || new THREE.Vector3(0, 0, 0),
    closedRotY: 0,
    openRotY: config.openRotY || 0,
    currentProgress: 0,
    targetProgress: 0
  };
  partInfo.openable = openableData;

  partInfo.obj.traverse((child) => {
    if (child.isMesh) {
      child.userData.openableRef = openableData;
    }
  });

  interactiveOpenables.push(openableData);
}

function clearFurniture() {
  while (furnitureRoot.children.length > 0) {
    furnitureRoot.remove(furnitureRoot.children[0]);
  }
  partMaterials.forEach((m) => {
    if (m.map) m.map.dispose();
    if (m.bumpMap) m.bumpMap.dispose();
    m.dispose();
  });
  partMaterials.length = 0;

  animatedParts = [];
  paintableParts = [];
  interactiveOpenables = [];
  ledLight = null;
  hasLedFeature = false;
  ledStripMat.emissiveIntensity = 0;

  const dimOverlay = document.getElementById('dimensionOverlay');
  if (dimOverlay) dimOverlay.innerHTML = '';
  clearDimensionLines3D();
}

/* Extrai tipo de móvel, medidas (digitadas, no texto ou imaginação do site) e detalhes */
function parseFurnitureRequest(rawText, manualDims) {
  const text = (rawText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let category = 'armario_pia';
  let displayTitle = 'Armário de Pia';

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

  const defaults = {
    armario_pia:     { w: 120, h: 85,  d: 56 },
    guarda_roupa:    { w: 185, h: 215, d: 58 },
    armario_cozinha: { w: 200, h: 210, d: 56 },
    balcao_ripado:   { w: 175, h: 94,  d: 56 },
    estante:         { w: 135, h: 185, d: 38 },
    armario:         { w: 110, h: 165, d: 48 }
  };

  let { w, h, d } = defaults[category];
  let isAutoImagined = true;

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

  if (manualDims.w && manualDims.w >= 40) {
    w = THREE.MathUtils.clamp(manualDims.w, 40, 450);
    isAutoImagined = false;
  }
  if (manualDims.h && manualDims.h >= 40) {
    h = THREE.MathUtils.clamp(manualDims.h, 40, 300);
    isAutoImagined = false;
  }
  if (manualDims.d && manualDims.d >= 25) {
    d = THREE.MathUtils.clamp(manualDims.d, 25, 120);
    isAutoImagined = false;
  }

  const doorsMatch = text.match(/(\d+)\s*portas?/);
  let doorCount = doorsMatch
    ? THREE.MathUtils.clamp(parseInt(doorsMatch[1], 10), 1, 6)
    : Math.max(2, Math.min(6, Math.round(w / 48)));

  const hasDrawers =
    text.includes('gaveta') ||
    category === 'guarda_roupa' ||
    category === 'armario_cozinha' ||
    (category === 'armario_pia' && w >= 120);

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
    suggestedFinish
  };
}

function frameCameraToModel(widthUnits, heightUnits) {
  const centerY = heightUnits * 0.5;
  const maxDim = Math.max(widthUnits, heightUnits * 1.15);
  const dist = THREE.MathUtils.clamp(maxDim * 1.78, 2.35, 5.6);

  controls.target.set(0, centerY, 0);
  camera.position.set(dist * 0.72, centerY + dist * 0.42, dist * 0.88);
  controls.update();
}

/* CONSTRUTOR 1: ARMÁRIO DE PIA */
function buildProceduralSinkCabinet(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const plinthH = 0.08;
  const boxH = h - plinthH - 0.036;

  const plinthBox = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.04, plinthH, d - 0.06),
    createPartWoodMaterial(true)
  );
  plinthBox.position.set(0, plinthH / 2, -0.015);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Rodapé Base',
    dimsCm: { w: spec.wCm - 4, h: 8, d: spec.dCm - 6 }
  });

  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(w, t, d),
    createPartWoodMaterial(true)
  );
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const leftSide = new THREE.Mesh(
    new THREE.BoxGeometry(t, boxH - t, d),
    createPartWoodMaterial(false)
  );
  leftSide.position.set(-w / 2 + t / 2, plinthH + boxH / 2 + t / 2, 0);
  registerPart(leftSide, { x: -0.48, y: 0.1, z: 0 }, {
    name: 'Parede Lateral Esquerda',
    dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm }
  });

  const rightSide = new THREE.Mesh(
    new THREE.BoxGeometry(t, boxH - t, d),
    createPartWoodMaterial(false)
  );
  rightSide.position.set(w / 2 - t / 2, plinthH + boxH / 2 + t / 2, 0);
  registerPart(rightSide, { x: 0.48, y: 0.1, z: 0 }, {
    name: 'Parede Lateral Direita',
    dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm }
  });

  const frontRail = new THREE.Mesh(
    new THREE.BoxGeometry(w - t * 2, 0.06, t),
    createPartWoodMaterial(true)
  );
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
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(t, boxH - t, d - 0.03),
      createPartWoodMaterial(false)
    );
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
      const front = new THREE.Mesh(
        new THREE.BoxGeometry(drawerColW - 0.006, drawerH - 0.006, t),
        drawerMat
      );
      dg.add(front);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.02), chromeMat);
      handle.position.set(0, drawerH * 0.25, 0.018);
      handle.userData.nonPaintable = true;
      dg.add(handle);

      const inner = new THREE.Mesh(
        new THREE.BoxGeometry(drawerColW - 0.04, drawerH * 0.65, d - 0.08),
        drawerMat
      );
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
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(doorsAreaW - 0.006, t, d - 0.08),
      createPartWoodMaterial(true)
    );
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

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(singleDoorW, doorH, t),
      createPartWoodMaterial(false)
    );
    panel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.02), chromeMat);
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

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.03, 0.036, d + 0.03),
    createStonePartMaterial()
  );
  topGroup.add(slab);

  const sinkW = Math.min(0.52, doorsAreaW * 0.72);
  const sinkD = Math.min(0.36, d * 0.65);
  const basinRim = new THREE.Mesh(new THREE.BoxGeometry(sinkW, 0.012, sinkD), inoxMat);
  basinRim.position.set(doorsCenterX, 0.02, 0.01);
  basinRim.userData.nonPaintable = true;
  topGroup.add(basinRim);

  const basinInner = new THREE.Mesh(new THREE.BoxGeometry(sinkW - 0.04, 0.014, sinkD - 0.04), cavityMat);
  basinInner.position.set(doorsCenterX, 0.021, 0.01);
  basinInner.userData.nonPaintable = true;
  topGroup.add(basinInner);

  const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 24), chromeMat);
  faucetNeck.position.set(doorsCenterX, 0.1, -sinkD / 2 - 0.03);
  faucetNeck.userData.nonPaintable = true;
  topGroup.add(faucetNeck);

  const faucetSpout = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.12), chromeMat);
  faucetSpout.position.set(doorsCenterX, 0.185, -sinkD / 2 + 0.025);
  faucetSpout.userData.nonPaintable = true;
  topGroup.add(faucetSpout);

  registerPart(topGroup, { x: 0, y: 0.65, z: 0 }, {
    name: 'Tampo & Cuba',
    dimsCm: { w: spec.wCm + 3, h: 3.6, d: spec.dCm + 3 }
  });
}

/* CONSTRUTOR 2: GUARDA-ROUPA */
function buildProceduralWardrobe(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const plinthH = 0.07;
  const bodyH = h - plinthH;

  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.03, plinthH, d - 0.04), createPartWoodMaterial(true));
  plinthBox.position.set(0, plinthH / 2, -0.01);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Base Rodapé',
    dimsCm: { w: spec.wCm - 3, h: 7, d: spec.dCm - 4 }
  });

  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.01, bodyH - 0.01, 0.012), createPartWoodMaterial(false));
  backPanel.position.set(0, plinthH + bodyH / 2, -d / 2 + 0.006);
  registerPart(backPanel, { x: 0, y: 0.15, z: -0.58 }, {
    name: 'Parede Fundo',
    dimsCm: { w: spec.wCm - 1, h: Math.round(bodyH * 100), d: 1.2 }
  });

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  top.position.set(0, plinthH + bodyH - t / 2, 0);
  registerPart(top, { x: 0, y: 0.58, z: 0 }, {
    name: 'Tampo Superior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(t, bodyH - t * 2, d), createPartWoodMaterial(false));
  leftSide.position.set(-w / 2 + t / 2, plinthH + bodyH / 2, 0);
  registerPart(leftSide, { x: -0.48, y: 0.1, z: 0 }, {
    name: 'Parede Lateral Esquerda',
    dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
  });

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(t, bodyH - t * 2, d), createPartWoodMaterial(false));
  rightSide.position.set(w / 2 - t / 2, plinthH + bodyH / 2, 0);
  registerPart(rightSide, { x: 0.48, y: 0.1, z: 0 }, {
    name: 'Parede Lateral Direita',
    dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
  });

  const maleiroY = plinthH + bodyH - 0.42;
  const maleiroShelf = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, t, d - 0.03), createPartWoodMaterial(true));
  maleiroShelf.position.set(0, maleiroY, 0);
  registerPart(maleiroShelf, { x: 0, y: 0.4, z: 0.35 }, {
    name: 'Prateleira Maleiro',
    dimsCm: { w: spec.wCm - 4, h: 2.2, d: spec.dCm - 3 }
  });

  const hasCenterDiv = w >= 1.25;
  if (hasCenterDiv) {
    const midDiv = new THREE.Mesh(new THREE.BoxGeometry(t, maleiroY - (plinthH + t), d - 0.04), createPartWoodMaterial(false));
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
    const sh = new THREE.Mesh(new THREE.BoxGeometry(shelfSpan - 0.01, t, d - 0.05), createPartWoodMaterial(true));
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
      const dFront = new THREE.Mesh(new THREE.BoxGeometry(drawerW, 0.17, 0.02), createPartWoodMaterial(false));
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

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(singleDoorW, doorH, t), createPartWoodMaterial(false));
    doorPanel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(doorPanel);

    const longHandle = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.32, 0.022), chromeMat);
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
}

/* CONSTRUTOR 3: ARMÁRIO DE COZINHA */
function buildProceduralKitchen(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const totalH = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const lowerH = 0.86;

  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.08, d - 0.05), createPartWoodMaterial(true));
  plinthBox.position.set(0, 0.04, -0.015);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Rodapé Balcão',
    dimsCm: { w: spec.wCm - 4, h: 8, d: spec.dCm - 5 }
  });

  const lowerBoxH = lowerH - 0.08 - 0.036;
  const lowerBottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  lowerBottom.position.set(0, 0.08 + t / 2, 0);
  registerPart(lowerBottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Balcão Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const wallNames = ['Parede Lateral Esquerda', 'Divisória Central Balcão', 'Parede Lateral Direita'];
  [-w / 2 + t / 2, 0, w / 2 - t / 2].forEach((px, idx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(t, lowerBoxH - t, d), createPartWoodMaterial(false));
    post.position.set(px, 0.08 + lowerBoxH / 2 + t / 2, 0);
    registerPart(post, { x: (idx - 1) * 0.42, y: 0.1, z: 0 }, {
      name: wallNames[idx],
      dimsCm: { w: 2.2, h: Math.round((lowerBoxH - t) * 100), d: spec.dCm }
    });
  });

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.036, d + 0.04), createStonePartMaterial());
  counterTop.position.set(0, lowerH - 0.018, 0.01);
  registerPart(counterTop, { x: 0, y: 0.35, z: 0.35 }, {
    name: 'Tampo Bancada',
    dimsCm: { w: spec.wCm + 4, h: 3.6, d: spec.dCm + 4 }
  });

  const doorCount = spec.doorCount;
  const innerW = w - t * 2;
  const singleW = (innerW - (doorCount - 1) * 0.006) / doorCount;
  const doorH = lowerBoxH - 0.04;

  for (let i = 0; i < doorCount; i++) {
    const isLeft = i % 2 === 0;
    const slotX = -innerW / 2 + singleW * (i + 0.5) + i * 0.006;
    const pivot = new THREE.Group();
    pivot.position.set(isLeft ? slotX - singleW / 2 : slotX + singleW / 2, 0.08 + t + doorH / 2, d / 2 + 0.002);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(singleW, doorH, t), createPartWoodMaterial(false));
    panel.position.set(isLeft ? singleW / 2 : -singleW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.02), chromeMat);
    knob.position.set(isLeft ? singleW - 0.03 : -singleW + 0.03, doorH * 0.32, 0.018);
    knob.userData.nonPaintable = true;
    pivot.add(knob);

    const pInfo = registerPart(pivot, { x: (i - doorCount / 2) * 0.2, y: 0.05, z: 0.65 }, {
      name: `Porta Inferior ${i + 1}`,
      dimsCm: { w: Math.round(singleW * 100), h: Math.round(doorH * 100), d: 2.2 }
    });
    registerOpenable(pInfo, {
      openRotY: isLeft ? -Math.PI * 0.54 : Math.PI * 0.54
    });
  }

  if (totalH >= 1.5) {
    const upperD = Math.min(0.36, d * 0.65);
    const upperH = Math.min(0.68, totalH - lowerH - 0.55);
    const upperBaseY = totalH - upperH;
    const upperZ = -d / 2 + upperD / 2;

    const uBottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, upperD), createPartWoodMaterial(true));
    uBottom.position.set(0, upperBaseY + t / 2, upperZ);
    registerPart(uBottom, { x: 0, y: 0.45, z: 0.25 }, {
      name: 'Base Armário Aéreo',
      dimsCm: { w: spec.wCm, h: 2.2, d: Math.round(upperD * 100) }
    });

    const uTop = new THREE.Mesh(new THREE.BoxGeometry(w, t, upperD), createPartWoodMaterial(true));
    uTop.position.set(0, totalH - t / 2, upperZ);
    registerPart(uTop, { x: 0, y: 0.72, z: 0 }, {
      name: 'Tampo Armário Aéreo',
      dimsCm: { w: spec.wCm, h: 2.2, d: Math.round(upperD * 100) }
    });

    [-w / 2 + t / 2, w / 2 - t / 2].forEach((ux, idx) => {
      const uSide = new THREE.Mesh(new THREE.BoxGeometry(t, upperH - t * 2, upperD), createPartWoodMaterial(false));
      uSide.position.set(ux, upperBaseY + upperH / 2, upperZ);
      registerPart(uSide, { x: (idx === 0 ? -0.45 : 0.45), y: 0.55, z: 0 }, {
        name: idx === 0 ? 'Lateral Aéreo Esq.' : 'Lateral Aéreo Dir.',
        dimsCm: { w: 2.2, h: Math.round((upperH - t * 2) * 100), d: Math.round(upperD * 100) }
      });
    });

    for (let i = 0; i < doorCount; i++) {
      const isLeft = i % 2 === 0;
      const slotX = -innerW / 2 + singleW * (i + 0.5) + i * 0.006;
      const pivot = new THREE.Group();
      pivot.position.set(isLeft ? slotX - singleW / 2 : slotX + singleW / 2, upperBaseY + upperH / 2, upperZ + upperD / 2 + 0.002);

      const uDoor = new THREE.Mesh(new THREE.BoxGeometry(singleW, upperH - 0.015, t), createPartWoodMaterial(false));
      uDoor.position.set(isLeft ? singleW / 2 : -singleW / 2, 0, 0);
      pivot.add(uDoor);

      const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.1, 0.02), chromeMat);
      knob.position.set(isLeft ? singleW - 0.03 : -singleW + 0.03, -upperH * 0.3, 0.018);
      knob.userData.nonPaintable = true;
      pivot.add(knob);

      const pInfo = registerPart(pivot, { x: (i - doorCount / 2) * 0.2, y: 0.55, z: 0.68 }, {
        name: `Porta Aérea ${i + 1}`,
        dimsCm: { w: Math.round(singleW * 100), h: Math.round((upperH - 0.015) * 100), d: 2.2 }
      });
      registerOpenable(pInfo, {
        openRotY: isLeft ? -Math.PI * 0.54 : Math.PI * 0.54
      });
    }
  }
}

/* CONSTRUTOR 4: BALCÃO RIPADO COM LED QUENTE */
function buildProceduralSlatted(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.025;
  hasLedFeature = true;

  const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, t, d - 0.04), createPartWoodMaterial(true));
  base.position.set(0, t / 2, 0);
  registerPart(base, { x: 0, y: -0.25, z: 0 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm - 4, h: 2.5, d: spec.dCm - 4 }
  });

  const coreBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.08, d - 0.07), createPartWoodMaterial(false));
  coreBox.position.set(0, (h - 0.08) / 2 + t, -0.01);
  registerPart(coreBox, { x: 0, y: 0.35, z: -0.38 }, {
    name: 'Caixa Estrutural Interna',
    dimsCm: { w: spec.wCm - 6, h: spec.hCm - 8, d: spec.dCm - 7 }
  });

  const slatCount = Math.max(16, Math.round(w * 18));
  const slatW = 0.024;
  const slatDepth = 0.022;
  const slatH = h - 0.055;
  const startX = -(w - 0.06) / 2 + slatW / 2;
  const stepX = (w - 0.06 - slatW) / (slatCount - 1);

  const slatsGroup = new THREE.Group();
  const sharedSlatMat = createPartWoodMaterial(false);
  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, slatH, slatDepth), sharedSlatMat);
    slat.position.set(startX + i * stepX, slatH / 2 + 0.015, d / 2 - 0.02);
    slatsGroup.add(slat);
  }
  registerPart(slatsGroup, { x: 0, y: 0.18, z: 0.58 }, {
    name: `Painel Ripado (${slatCount} ripas)`,
    dimsCm: { w: spec.wCm - 6, h: Math.round(slatH * 100), d: 2.2 }
  });

  const ledBar = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.014, 0.018), ledStripMat);
  ledBar.position.set(0, h - 0.042, d / 2 - 0.008);
  registerPart(ledBar, { x: 0, y: 0.45, z: 0.25 }, {
    name: 'Perfil LED Quente',
    dimsCm: { w: spec.wCm - 4, h: 1.4, d: 1.8 },
    paintable: false
  });

  ledLight = new THREE.PointLight(0xffb84d, 0, 2.4, 1.6);
  ledLight.position.set(0, h - 0.08, d / 2 + 0.18);
  furnitureRoot.add(ledLight);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.042, d + 0.05), createPartWoodMaterial(true));
  counterTop.position.set(0, h - 0.015, 0.01);
  registerPart(counterTop, { x: 0, y: 0.65, z: 0 }, {
    name: 'Tampo Encabeçado',
    dimsCm: { w: spec.wCm + 5, h: 4.2, d: spec.dCm + 5 }
  });
}

/* CONSTRUTOR 5: ESTANTE & NICHOS */
function buildProceduralBookshelf(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  bottom.position.set(0, 0.05, 0);
  registerPart(bottom, { x: 0, y: -0.2, z: 0.2 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  top.position.set(0, h - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 }, {
    name: 'Tampo Superior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(t, h - 0.05 - t, d), createPartWoodMaterial(false));
    side.position.set(sx, (0.05 + h - t) / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.45 : 0.45, y: 0.1, z: 0 }, {
      name: idx === 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: spec.hCm - 7, d: spec.dCm }
    });
  });

  const shelfCount = Math.max(3, Math.round(h / 0.38));
  for (let i = 1; i < shelfCount; i++) {
    const sy = 0.05 + ((h - 0.05 - t) / shelfCount) * i;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, t, d - 0.01), createPartWoodMaterial(true));
    shelf.position.set(0, sy, 0);
    registerPart(shelf, { x: 0, y: 0.14 * i, z: 0.38 + i * 0.05 }, {
      name: `Prateleira ${i}`,
      dimsCm: { w: spec.wCm - 4, h: 2.2, d: spec.dCm - 1 }
    });

    const divX = (i % 2 === 0 ? -1 : 1) * (w * 0.16);
    const segH = (h - 0.05 - t) / shelfCount - t;
    const divider = new THREE.Mesh(new THREE.BoxGeometry(t, segH, d - 0.02), createPartWoodMaterial(false));
    divider.position.set(divX, sy + segH / 2 + t / 2, 0);
    registerPart(divider, { x: divX * 0.85, y: 0.2, z: 0.45 }, {
      name: `Divisória Nicho ${i}`,
      dimsCm: { w: 2.2, h: Math.round(segH * 100), d: spec.dCm - 2 }
    });
  }
}

/* CONSTRUTOR 6: ARMÁRIO MULTIUSO / DISPENSA */
function buildProceduralCabinet(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const plinthH = 0.07;
  const bodyH = h - plinthH;

  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.03, plinthH, d - 0.04), createPartWoodMaterial(true));
  plinthBox.position.set(0, plinthH / 2, -0.01);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Rodapé Base',
    dimsCm: { w: spec.wCm - 3, h: 7, d: spec.dCm - 4 }
  });

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), createPartWoodMaterial(true));
  top.position.set(0, plinthH + bodyH - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 }, {
    name: 'Tampo Superior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(t, bodyH - t * 2, d), createPartWoodMaterial(false));
    side.position.set(sx, plinthH + bodyH / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.48 : 0.48, y: 0.1, z: 0 }, {
      name: idx === 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
    });
  });

  const shelves = Math.max(3, Math.round(bodyH / 0.36));
  for (let s = 1; s < shelves; s++) {
    const sy = plinthH + (bodyH / shelves) * s;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2 - 0.006, t, d - 0.05), createPartWoodMaterial(true));
    sh.position.set(0, sy, -0.015);
    registerPart(sh, { x: 0, y: 0.1 * s, z: 0.42 }, {
      name: `Prateleira Interna ${s}`,
      dimsCm: { w: spec.wCm - 5, h: 2.2, d: spec.dCm - 5 }
    });
  }

  const doorCount = spec.doorCount;
  const innerW = w - t * 2;
  const singleDoorW = (innerW - (doorCount - 1) * 0.005) / doorCount;
  const doorH = bodyH - t * 2 - 0.008;

  for (let i = 0; i < doorCount; i++) {
    const isLeft = i % 2 === 0;
    const slotX = -innerW / 2 + singleDoorW * (i + 0.5) + i * 0.005;
    const pivot = new THREE.Group();
    pivot.position.set(isLeft ? slotX - singleDoorW / 2 : slotX + singleDoorW / 2, plinthH + bodyH / 2, d / 2 + 0.002);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(singleDoorW, doorH, t), createPartWoodMaterial(false));
    panel.position.set(isLeft ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.22, 0.02), chromeMat);
    knob.position.set(isLeft ? singleDoorW - 0.032 : -singleDoorW + 0.032, 0, 0.018);
    knob.userData.nonPaintable = true;
    pivot.add(knob);

    const pInfo = registerPart(pivot, { x: (i - doorCount / 2) * 0.22, y: 0, z: 0.68 }, {
      name: `Porta ${i + 1}`,
      dimsCm: { w: Math.round(singleDoorW * 100), h: Math.round(doorH * 100), d: 2.2 }
    });
    registerOpenable(pInfo, {
      openRotY: isLeft ? -Math.PI * 0.54 : Math.PI * 0.54
    });
  }
}

/* ==========================================================================
   6. MODO DETALHADO (LINHAS DE COTA 3D + MEDIDAS EM CM E M)
   ========================================================================== */
let detailModeActive = false;
let overallDimAnchors = [];

function clearDimensionLines3D() {
  while (dimensionLinesGroup.children.length > 0) {
    const child = dimensionLinesGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    dimensionLinesGroup.remove(child);
  }
  overallDimAnchors = [];
}

function addDimensionRuler3D(pStart, pEnd, labelText) {
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x9caf88,
    transparent: true,
    opacity: 0.9
  });

  const points = [pStart, pEnd];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, lineMat);
  dimensionLinesGroup.add(line);

  // Pequenas marcas nas pontas da cota
  [pStart, pEnd].forEach((pt) => {
    const tickGeo = new THREE.SphereGeometry(0.018, 10, 10);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xe9dfcf });
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.copy(pt);
    dimensionLinesGroup.add(tick);
  });

  const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
  const el = document.createElement('div');
  el.className = 'dim-callout overall';
  el.textContent = labelText;
  document.getElementById('dimensionOverlay').appendChild(el);

  overallDimAnchors.push({ pos: mid, el });
}

function setupDetailedBlueprint(spec) {
  clearDimensionLines3D();
  const dimOverlay = document.getElementById('dimensionOverlay');
  dimOverlay.innerHTML = '';

  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const margin = 0.24;

  // 3 cotas principais (Largura, Altura, Profundidade) em cm e m
  addDimensionRuler3D(
    new THREE.Vector3(-w / 2, 0.03, d / 2 + margin),
    new THREE.Vector3(w / 2, 0.03, d / 2 + margin),
    `Largura: ${formatCmAndM(spec.wCm)}`
  );

  addDimensionRuler3D(
    new THREE.Vector3(w / 2 + margin, 0, d / 2 + 0.05),
    new THREE.Vector3(w / 2 + margin, h, d / 2 + 0.05),
    `Altura: ${formatCmAndM(spec.hCm)}`
  );

  addDimensionRuler3D(
    new THREE.Vector3(-w / 2 - margin, 0.03, -d / 2),
    new THREE.Vector3(-w / 2 - margin, 0.03, d / 2),
    `Profund.: ${formatCmAndM(spec.dCm)}`
  );

  // Etiquetas individuais para cada peça
  const summaryList = document.getElementById('detailSummaryList');
  summaryList.innerHTML = '';
  document.getElementById('detailTotalBadge').textContent =
    `${formatCmAndM(spec.wCm)} × ${formatCmAndM(spec.hCm)} × ${formatCmAndM(spec.dCm)}`;

  animatedParts.forEach((part) => {
    if (!part.dimsCm) return;
    const dimsStr = formatDimsShort(part.dimsCm);
    const widthM = (part.dimsCm.w / 100).toFixed(2).replace('.', ',');
    const heightM = (part.dimsCm.h / 100).toFixed(2).replace('.', ',');

    // Card na gaveta superior
    const item = document.createElement('div');
    item.className = 'detail-part-item';
    item.innerHTML = `<strong>${part.name}</strong><span>${dimsStr} (${widthM}m × ${heightM}m)</span>`;
    summaryList.appendChild(item);

    // Callout 3D flutuante sobre a peça
    const tag = document.createElement('div');
    tag.className = 'dim-callout';
    tag.innerHTML = `${part.name}<small>${dimsStr}</small>`;
    dimOverlay.appendChild(tag);
    part.calloutEl = tag;
  });

  dimensionLinesGroup.visible = detailModeActive;
  dimOverlay.classList.toggle('hidden', !detailModeActive);
}

function updateDetailedCalloutsProjection() {
  if (!detailModeActive) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return;

  const tempVec = new THREE.Vector3();
  const box = new THREE.Box3();

  overallDimAnchors.forEach((anchor) => {
    tempVec.copy(anchor.pos).project(camera);
    if (tempVec.z > 1) {
      anchor.el.style.display = 'none';
      return;
    }
    anchor.el.style.display = 'block';
    const x = (tempVec.x * 0.5 + 0.5) * width;
    const y = (-tempVec.y * 0.5 + 0.5) * height;
    anchor.el.style.left = `${x}px`;
    anchor.el.style.top = `${y}px`;
  });

  animatedParts.forEach((part) => {
    if (!part.calloutEl) return;
    box.setFromObject(part.obj);
    box.getCenter(tempVec);
    tempVec.project(camera);

    if (tempVec.z > 1) {
      part.calloutEl.style.display = 'none';
      return;
    }
    part.calloutEl.style.display = 'block';
    const x = (tempVec.x * 0.5 + 0.5) * width;
    const y = (-tempVec.y * 0.5 + 0.5) * height;
    part.calloutEl.style.left = `${x}px`;
    part.calloutEl.style.top = `${y}px`;
  });
}

/* ==========================================================================
   7. MODO PINTOR (BALDE DE TINTA + PINCEL + PINTAR PORTAS E PAREDES)
   ========================================================================== */
let painterModeActive = false;
let activePaintBucket = PAINT_BUCKETS[0];
let activePainterTool = 'brush'; // 'brush' | 'roller'
let hoveredPaintPart = null;
let isBrushingStroke = false;

function initPaintBucketsUI() {
  const row = document.getElementById('paintBucketsRow');
  row.innerHTML = '';

  PAINT_BUCKETS.forEach((bucket, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `bucket-swatch-btn ${idx === 0 ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="bucket-color-dot" style="background:${bucket.baseColor};"></span>
      <span>${bucket.short}</span>
    `;
    btn.addEventListener('click', () => {
      selectPaintBucket(bucket, btn);
    });
    row.appendChild(btn);
  });

  updateActiveBucketVisuals();
}

function selectPaintBucket(bucket, btnEl) {
  activePaintBucket = bucket;
  document.querySelectorAll('.bucket-swatch-btn').forEach((b) => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  updateActiveBucketVisuals();

  if (activePainterTool === 'roller') {
    paintAllPartsWithActiveBucket();
  }
}

function updateActiveBucketVisuals() {
  const icon = document.getElementById('activeBucketIcon');
  const nameEl = document.getElementById('activePaintName');
  icon.style.backgroundColor = activePaintBucket.baseColor;
  icon.style.color = activePaintBucket.id === 'naval_white' || activePaintBucket.id === 'oat_paint' ? '#1D130E' : '#F4F2ED';
  nameEl.textContent = activePaintBucket.name;
  bristleMat.color.set(activePaintBucket.baseColor);
}

function applyPaintToPart(partInfo, bucketCfg, hitPoint = null) {
  if (!partInfo || !partInfo.paintable) return;

  partInfo.obj.traverse((child) => {
    if (child.isMesh && !child.userData.nonPaintable && child.material) {
      const mat = child.material;
      const { map, bumpMap } = createWoodTexturesFromConfig(bucketCfg);
      if (mat.userData.rotateGrain) {
        map.center.set(0.5, 0.5);
        map.rotation = Math.PI / 2;
        bumpMap.center.set(0.5, 0.5);
        bumpMap.rotation = Math.PI / 2;
      }
      if (mat.map) mat.map.dispose();
      if (mat.bumpMap) mat.bumpMap.dispose();
      mat.map = map;
      mat.bumpMap = bumpMap;
      mat.roughness = bucketCfg.roughness;
      mat.metalness = bucketCfg.metalness;
      mat.emissive.setHex(0x000000);
      mat.needsUpdate = true;
    }
  });

  partInfo.paintedColorName = bucketCfg.short;
  brushSweepTimer = 0.28;

  if (hitPoint) {
    spawnPaintSplash(hitPoint, bucketCfg.baseColor);
  }

  updatePaintedSummary();
}

function paintAllPartsWithActiveBucket() {
  paintableParts.forEach((part) => {
    applyPaintToPart(part, activePaintBucket);
  });
}

function resetAllPaintedParts() {
  applyFinish(currentFinish);
  paintableParts.forEach((p) => {
    p.paintedColorName = null;
  });
  updatePaintedSummary();
}

function updatePaintedSummary() {
  const painted = paintableParts.filter((p) => p.paintedColorName);
  const statusEl = document.getElementById('paintedStatusText');
  const notesInput = document.getElementById('projectNotes');

  if (painted.length === 0) {
    statusEl.textContent = 'Clique ou passe o pincel sobre cada porta, parede lateral, gaveta ou tampo para pintar.';
  } else {
    const summary = painted.map((p) => `${p.name}: ${p.paintedColorName}`).join(' · ');
    statusEl.textContent = `Pintado: ${summary}`;
  }

  if (currentSpec && notesInput) {
    const baseSpecText = `Modelo: ${currentSpec.displayTitle} | Medidas: ${currentSpec.wCm}cm (L) × ${currentSpec.hCm}cm (A) × ${currentSpec.dCm}cm (P).`;
    const paintText = painted.length > 0
      ? ` Pintura personalizada: ${painted.map((p) => `${p.name} (${p.paintedColorName})`).join(', ')}.`
      : '';
    notesInput.value = baseSpecText + paintText;
  }
}

function setHoveredPaintPart(partInfo) {
  if (hoveredPaintPart && hoveredPaintPart !== partInfo) {
    hoveredPaintPart.obj.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive && !child.userData.nonPaintable) {
        child.material.emissive.setHex(0x000000);
      }
    });
  }
  hoveredPaintPart = partInfo;
  if (hoveredPaintPart) {
    hoveredPaintPart.obj.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive && !child.userData.nonPaintable) {
        child.material.emissive.setHex(0x2a2418);
      }
    });
  }
}

/* ==========================================================================
   8. PARTÍCULAS SUTIS DE PÓ DE MADEIRA DOURADO NA LUZ
   ========================================================================== */
const dustCount = 55;
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 2.6;
  dustPositions[i * 3 + 1] = 0.1 + Math.random() * 1.8;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

const dustMat = new THREE.PointsMaterial({
  color: 0xe9dfcf,
  size: 0.014,
  transparent: true,
  opacity: 0.32
});
const woodDust = new THREE.Points(dustGeo, dustMat);
scene.add(woodDust);

/* ==========================================================================
   9. MOTOR DE ANIMAÇÃO, RAYCASTING & CONTROLES DA INTERFACE
   ========================================================================== */
let assemblyProgress = 0;
let targetAssembly = 1;
let isAutoBuilding = true;

const explodeRange = document.getElementById('explodeRange');
const assemblyStatus = document.getElementById('assemblyStatus');
const doorsBtn = document.getElementById('doorsBtn');
const doorsBtnText = document.getElementById('doorsBtnText');
const finishLabel = document.getElementById('currentFinishLabel');
const generatedSpecsEl = document.getElementById('generatedSpecs');

function easeOutBack(x) {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function buildFromSpec(spec) {
  currentSpec = spec;
  doorsOpen = false;

  if (spec.suggestedFinish) {
    applyFinish(spec.suggestedFinish);
    document.querySelectorAll('.swatch-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.finish === spec.suggestedFinish);
    });
  }

  if (spec.category === 'armario_pia') buildProceduralSinkCabinet(spec);
  if (spec.category === 'guarda_roupa') buildProceduralWardrobe(spec);
  if (spec.category === 'armario_cozinha') buildProceduralKitchen(spec);
  if (spec.category === 'balcao_ripado') buildProceduralSlatted(spec);
  if (spec.category === 'estante') buildProceduralBookshelf(spec);
  if (spec.category === 'armario') buildProceduralCabinet(spec);

  setupDetailedBlueprint(spec);

  doorsBtnText.textContent = hasLedFeature ? 'Acender LED' : 'Abrir portas';
  frameCameraToModel(spec.wCm / 100, spec.hCm / 100);

  const originTag = spec.isAutoImagined ? ' · Medidas sugeridas pelo site' : '';
  const doorsInfo = spec.category === 'balcao_ripado'
    ? 'Ripado + LED'
    : spec.category === 'estante'
      ? 'Nichos sob medida'
      : `${spec.doorCount} portas`;

  generatedSpecsEl.innerHTML = `Projeto ativo: <strong>${spec.displayTitle}</strong> · ${formatCmAndM(spec.wCm)} × ${formatCmAndM(spec.hCm)} · ${doorsInfo}${originTag}`;

  const projectTypeInput = document.getElementById('projectType');
  if (projectTypeInput) {
    projectTypeInput.value = `${spec.displayTitle} (${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm)`;
  }
  updatePaintedSummary();

  if (detailModeActive) {
    isAutoBuilding = false;
    targetAssembly = 0.28;
    explodeRange.value = 72;
    assemblyStatus.textContent = 'Modo Detalhado';
  } else {
    triggerFullAssembly();
  }
}

function runCreator(overridePrompt = null) {
  const promptInput = document.getElementById('customPrompt');
  const textToUse = overridePrompt !== null ? overridePrompt : promptInput.value;

  const manualDims = {
    w: parseFloat(document.getElementById('dimWidth').value),
    h: parseFloat(document.getElementById('dimHeight').value),
    d: parseFloat(document.getElementById('dimDepth').value)
  };

  const spec = parseFurnitureRequest(textToUse, manualDims);
  buildFromSpec(spec);
}

function triggerFullAssembly() {
  assemblyProgress = 0;
  targetAssembly = 1;
  isAutoBuilding = true;
  explodeRange.value = 0;
  assemblyStatus.textContent = 'Montando...';
  updateStepChips(1);
}

function updateStepChips(stageVal) {
  document.querySelectorAll('.step-chip').forEach((chip) => {
    chip.classList.toggle('active', Number(chip.dataset.stage) === stageVal);
  });
}

function applyFinish(finishKey) {
  currentFinish = finishKey;
  const cfg = FINISHES[finishKey];
  finishLabel.textContent = cfg.name;

  const finishSelect = document.getElementById('finishChoice');
  if (finishSelect) {
    finishSelect.value = cfg.labelSelect;
  }

  partMaterials.forEach((mat) => {
    if (mat.userData.isStone) return;
    const { map, bumpMap } = createWoodTexturesFromConfig(cfg);
    if (mat.userData.rotateGrain) {
      map.center.set(0.5, 0.5);
      map.rotation = Math.PI / 2;
      bumpMap.center.set(0.5, 0.5);
      bumpMap.rotation = Math.PI / 2;
    }
    if (mat.map) mat.map.dispose();
    if (mat.bumpMap) mat.bumpMap.dispose();
    mat.map = map;
    mat.bumpMap = bumpMap;
    mat.roughness = cfg.roughness;
    mat.metalness = cfg.metalness;
    mat.needsUpdate = true;
  });
}

/* ==========================================================================
   10. EVENTOS DOS MODOS: PINTOR, DETALHADO & RAYCASTING NA CENA
   ========================================================================== */
const painterModeBtn = document.getElementById('painterModeBtn');
const detailModeBtn = document.getElementById('detailModeBtn');
const painterPanel = document.getElementById('painterPanel');
const detailPanel = document.getElementById('detailPanel');
const painterTooltip = document.getElementById('painterTooltip');
const stageHint = document.getElementById('stageHint');

painterModeBtn.addEventListener('click', () => {
  painterModeActive = !painterModeActive;
  painterModeBtn.classList.toggle('active', painterModeActive);
  painterModeBtn.setAttribute('aria-pressed', String(painterModeActive));
  painterPanel.classList.toggle('hidden', !painterModeActive);
  container.classList.toggle('painter-cursor', painterModeActive);

  if (!painterModeActive) {
    brush3D.visible = false;
    painterTooltip.classList.add('hidden');
    setHoveredPaintPart(null);
    stageHint.textContent = 'Arraste para girar · Clique na porta para abrir';
  } else {
    stageHint.textContent = 'Modo Pintor: clique nas portas ou paredes para pintar';
  }
});

detailModeBtn.addEventListener('click', () => {
  detailModeActive = !detailModeActive;
  detailModeBtn.classList.toggle('active', detailModeActive);
  detailModeBtn.setAttribute('aria-pressed', String(detailModeActive));
  detailPanel.classList.toggle('hidden', !detailModeActive);

  dimensionLinesGroup.visible = detailModeActive;
  document.getElementById('dimensionOverlay').classList.toggle('hidden', !detailModeActive);

  isAutoBuilding = false;
  if (detailModeActive) {
    // Expande as peças para mostrar as medidas detalhadas em cm e m
    targetAssembly = 0.28;
    explodeRange.value = 72;
    assemblyStatus.textContent = 'Expandido (cm / m)';
    updateStepChips(0.35);
  } else {
    targetAssembly = 1;
    explodeRange.value = 0;
    assemblyStatus.textContent = 'Montado';
    updateStepChips(1);
  }
});

document.getElementById('toolBrushBtn').addEventListener('click', () => {
  activePainterTool = 'brush';
  document.getElementById('toolBrushBtn').classList.add('active');
  document.getElementById('toolRollerBtn').classList.remove('active');
});

document.getElementById('toolRollerBtn').addEventListener('click', () => {
  activePainterTool = 'roller';
  document.getElementById('toolRollerBtn').classList.add('active');
  document.getElementById('toolBrushBtn').classList.remove('active');
  paintAllPartsWithActiveBucket();
});

document.getElementById('clearPaintBtn').addEventListener('click', resetAllPaintedParts);

// Raycasting para Pintar Peças ou Clicar para Abrir Porta Individual
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

function updatePointerNDC(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  return {
    localX: clientX - rect.left,
    localY: clientY - rect.top
  };
}

function raycastFurniture(clientX, clientY) {
  const local = updatePointerNDC(clientX, clientY);
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(furnitureRoot.children, true);
  return { hits, local };
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };

  if (painterModeActive) {
    const { hits } = raycastFurniture(e.clientX, e.clientY);
    const hitWithPart = hits.find((h) => h.object.userData && h.object.userData.partRef);
    if (hitWithPart) {
      isBrushingStroke = true;
      controls.enabled = false;
      applyPaintToPart(hitWithPart.object.userData.partRef, activePaintBucket, hitWithPart.point);
    }
  }
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!painterModeActive) return;

  const { hits, local } = raycastFurniture(e.clientX, e.clientY);
  const hitWithPart = hits.find((h) => h.object.userData && h.object.userData.partRef);

  if (hitWithPart) {
    const partRef = hitWithPart.object.userData.partRef;
    setHoveredPaintPart(partRef);

    brush3D.visible = true;
    brush3D.position.copy(hitWithPart.point).add(new THREE.Vector3(0.02, 0.03, 0.04));

    painterTooltip.classList.remove('hidden');
    painterTooltip.style.left = `${local.localX}px`;
    painterTooltip.style.top = `${local.localY}px`;
    painterTooltip.textContent = `Pintar ${partRef.name} (${activePaintBucket.short})`;

    if (isBrushingStroke) {
      applyPaintToPart(partRef, activePaintBucket, hitWithPart.point);
    }
  } else {
    setHoveredPaintPart(null);
    brush3D.visible = false;
    painterTooltip.classList.add('hidden');
  }
});

window.addEventListener('pointerup', (e) => {
  if (isBrushingStroke) {
    isBrushingStroke = false;
    controls.enabled = true;
    return;
  }

  if (!painterModeActive) {
    const distMoved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (distMoved < 6) {
      const { hits } = raycastFurniture(e.clientX, e.clientY);
      const hitOpenable = hits.find((h) => h.object.userData && h.object.userData.openableRef);
      if (hitOpenable) {
        const ref = hitOpenable.object.userData.openableRef;
        if (assemblyProgress < 0.95) {
          isAutoBuilding = false;
          targetAssembly = 1;
          assemblyProgress = 1;
          explodeRange.value = 0;
        }
        ref.targetProgress = ref.targetProgress > 0.5 ? 0 : 1;
        const anyOpen = interactiveOpenables.some((item) => item.targetProgress > 0.5);
        doorsOpen = anyOpen;
        if (!hasLedFeature) {
          doorsBtnText.textContent = anyOpen ? 'Fechar portas' : 'Abrir portas';
        }
      }
    }
  }
});

// Botão Abrir/Fechar todas as portas e gavetas
doorsBtn.addEventListener('click', () => {
  if (hasLedFeature) {
    const isBright = ledStripMat.emissiveIntensity > 1.2;
    ledStripMat.emissiveIntensity = isBright ? 0.35 : 2.2;
    if (ledLight) ledLight.intensity = isBright ? 0.4 : 2.4;
    doorsBtnText.textContent = isBright ? 'Acender LED' : 'Suavizar LED';
    return;
  }

  // Garante que o móvel esteja fechado/montado para abrir as portas nas dobradiças
  if (targetAssembly < 0.95 || assemblyProgress < 0.95) {
    isAutoBuilding = false;
    targetAssembly = 1;
    assemblyProgress = 1;
    explodeRange.value = 0;
    assemblyStatus.textContent = 'Montado';
    if (detailModeActive) {
      detailModeActive = false;
      detailModeBtn.classList.remove('active');
      detailPanel.classList.add('hidden');
      dimensionLinesGroup.visible = false;
      document.getElementById('dimensionOverlay').classList.add('hidden');
    }
  }

  doorsOpen = !doorsOpen;
  interactiveOpenables.forEach((item) => {
    item.targetProgress = doorsOpen ? 1 : 0;
  });
  doorsBtnText.textContent = doorsOpen ? 'Fechar portas' : 'Abrir portas';
});

// Eventos do Criador Sob Medida
document.getElementById('generateFurnitureBtn').addEventListener('click', () => runCreator());

document.getElementById('customPrompt').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    runCreator();
  }
});

document.querySelectorAll('.idea-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const idea = chip.dataset.idea;
    document.getElementById('customPrompt').value = idea;
    document.getElementById('dimWidth').value = '';
    document.getElementById('dimHeight').value = '';
    document.getElementById('dimDepth').value = '';
    runCreator(idea);
  });
});

const SURPRISE_PROMPTS = [
  'Quero criar um armário de pia de 130cm com cuba inox, 2 portas e gaveteiro',
  'Quero criar um guarda-roupa de 210cm por 220cm com 4 portas, cabideiro e maleiro',
  'Quero criar um armário de cozinha de 200cm completo com aéreo e gavetas',
  'Quero criar um balcão ripado de 180cm com iluminação LED quente',
  'Quero criar uma estante de 140cm por 190cm com nichos para sala',
  'Quero criar um armário multiuso de 110cm por 175cm com 2 portas e prateleiras'
];
let surpriseIndex = 0;

document.getElementById('surpriseFurnitureBtn').addEventListener('click', () => {
  const chosen = SURPRISE_PROMPTS[surpriseIndex % SURPRISE_PROMPTS.length];
  surpriseIndex += 1;
  document.getElementById('customPrompt').value = chosen;
  document.getElementById('dimWidth').value = '';
  document.getElementById('dimHeight').value = '';
  document.getElementById('dimDepth').value = '';
  runCreator(chosen);
});

document.querySelectorAll('.work-card[data-preset-prompt]').forEach((card) => {
  card.addEventListener('click', () => {
    const preset = card.dataset.presetPrompt;
    document.getElementById('customPrompt').value = preset;
    document.getElementById('dimWidth').value = '';
    document.getElementById('dimHeight').value = '';
    document.getElementById('dimDepth').value = '';
    runCreator(preset);
    document.getElementById('inicio').scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelectorAll('.swatch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    applyFinish(btn.dataset.finish);
  });
});

document.getElementById('replayBtn').addEventListener('click', triggerFullAssembly);
document.getElementById('animateBuildBtn').addEventListener('click', triggerFullAssembly);

document.querySelectorAll('.step-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const stage = Number(chip.dataset.stage);
    isAutoBuilding = false;
    targetAssembly = stage;
    explodeRange.value = Math.round((1 - stage) * 100);
    assemblyStatus.textContent = stage < 1 ? 'Estrutura' : 'Montado';
    updateStepChips(stage);
  });
});

explodeRange.addEventListener('input', (e) => {
  isAutoBuilding = false;
  const explodeRatio = Number(e.target.value) / 100;
  targetAssembly = 1 - explodeRatio;
  assemblyStatus.textContent = explodeRatio > 0.05 ? 'Vista explodida' : 'Montado';
});

/* ==========================================================================
   11. LOOP PRINCIPAL DE ANIMAÇÃO (60 FPS)
   ========================================================================== */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (isAutoBuilding) {
    assemblyProgress += delta * 0.45;
    if (assemblyProgress >= 1) {
      assemblyProgress = 1;
      isAutoBuilding = false;
      assemblyStatus.textContent = detailModeActive ? 'Expandido (cm / m)' : 'Montado';
    }
    explodeRange.value = Math.round((1 - assemblyProgress) * 100);
  } else {
    assemblyProgress += (targetAssembly - assemblyProgress) * Math.min(1, delta * 7.5);
  }

  // Atualiza abertura suave das portas e gavetas
  interactiveOpenables.forEach((item) => {
    item.currentProgress += (item.targetProgress - item.currentProgress) * Math.min(1, delta * 8.5);
  });

  // Posiciona cada peça (montagem + abertura real das portas/gavetas)
  const totalParts = animatedParts.length;
  animatedParts.forEach((part, idx) => {
    const startWindow = (idx / Math.max(totalParts, 1)) * 0.45;
    const localRaw = THREE.MathUtils.clamp(
      (assemblyProgress - startWindow) / (1 - startWindow),
      0,
      1
    );
    const eased = easeOutBack(localRaw);
    const inv = 1 - eased;

    let px = part.targetPos.x + part.explodeOffset.x * inv;
    let py = part.targetPos.y + part.explodeOffset.y * inv;
    let pz = part.targetPos.z + part.explodeOffset.z * inv;

    let rx = part.targetRot.x + part.explodeRot.x * inv;
    let ry = part.targetRot.y + part.explodeRot.y * inv;
    let rz = part.targetRot.z + part.explodeRot.z * inv;

    // Aplica abertura real das dobradiças / corrediças sem conflitar com a montagem
    if (part.openable && assemblyProgress > 0.85) {
      const op = part.openable.currentProgress;
      px += part.openable.openOffset.x * op;
      py += part.openable.openOffset.y * op;
      pz += part.openable.openOffset.z * op;
      ry += part.openable.openRotY * op;
    }

    part.obj.position.set(px, py, pz);
    part.obj.rotation.set(rx, ry, rz);
  });

  // Animação da pincelada 3D e gotas de tinta
  if (brush3D.visible) {
    if (brushSweepTimer > 0) {
      brushSweepTimer -= delta;
      brush3D.rotation.z = -0.45 + Math.sin(elapsed * 32) * 0.35;
    } else {
      brush3D.rotation.z = -0.45 + Math.sin(elapsed * 4) * 0.08;
    }
  }

  for (let i = paintSplashes.length - 1; i >= 0; i--) {
    const sp = paintSplashes[i];
    sp.life -= delta;
    sp.vel.y -= 2.2 * delta;
    sp.mesh.position.addScaledVector(sp.vel, delta);
    sp.mesh.scale.setScalar(Math.max(0.01, sp.life / 0.45));
    if (sp.life <= 0) {
      scene.remove(sp.mesh);
      sp.mesh.geometry.dispose();
      sp.mesh.material.dispose();
      paintSplashes.splice(i, 1);
    }
  }

  if (hasLedFeature && ledLight) {
    const targetGlow = assemblyProgress > 0.78 ? 1.8 : 0;
    ledLight.intensity += (targetGlow - ledLight.intensity) * Math.min(1, delta * 4);
    ledStripMat.emissiveIntensity = ledLight.intensity;
    doorsBtnText.textContent = ledLight.intensity > 1 ? 'Suavizar LED' : 'Acender LED';
  }

  woodDust.rotation.y = elapsed * 0.04;
  furnitureRoot.position.y = Math.sin(elapsed * 1.1) * 0.004;

  controls.update();
  renderer.render(scene, camera);
  updateDetailedCalloutsProjection();
}

function resizeStage() {
  if (!container) return;
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', resizeStage);
resizeStage();
initPaintBucketsUI();

// Inicia com Armário de Pia montando ao abrir a página
runCreator('Quero criar um armário de pia com 2 portas e prateleira interna');
animate();

/* ==========================================================================
   12. INTERAÇÕES DE PÁGINA, MENU MOBILE E FORMULÁRIO
   ========================================================================== */
const menuToggle = document.getElementById('menuToggle');
const mobileDrawer = document.getElementById('mobileDrawer');

menuToggle.addEventListener('click', () => {
  mobileDrawer.classList.toggle('open');
});

document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => mobileDrawer.classList.remove('open'));
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal-up').forEach((el) => observer.observe(el));

const quoteForm = document.getElementById('quoteForm');
const formFeedback = document.getElementById('formFeedback');

quoteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  const project = document.getElementById('projectType').value;
  const finish = document.getElementById('finishChoice').value;

  formFeedback.textContent = `Obrigado, ${name}! Recebemos o pedido de ${project} no acabamento ${finish} e retornaremos em breve.`;
  quoteForm.reset();
});
