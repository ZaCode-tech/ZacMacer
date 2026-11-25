import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ==========================================================================
   1. CONFIGURAÇÃO DE ACABAMENTOS E TEXTURAS REALISTAS DE MADEIRA (PBR)
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

function createWoodTextures(finishKey) {
  const cfg = FINISHES[finishKey];
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

  const lineCount = cfg.isLacquer ? 90 : 210;
  for (let i = 0; i < lineCount; i++) {
    const xBase = (i / lineCount) * size;
    const waveFreq = 0.008 + (i % 7) * 0.0015;
    const waveAmp = cfg.isLacquer ? 2.5 : 8 + (i % 5) * 2.2;
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
    ctx.globalAlpha = cfg.isLacquer ? 0.14 : (i % 4 === 0 ? 0.38 : 0.22);
    ctx.lineWidth = cfg.isLacquer ? 1.1 : (1 + (i % 3) * 0.85);
    ctx.stroke();

    bCtx.strokeStyle = i % 2 === 0 ? '#686868' : '#969696';
    bCtx.globalAlpha = cfg.isLacquer ? 0.15 : 0.35;
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
   3. MATERIAIS COMPARTILHADOS
   ========================================================================== */
let currentFinish = 'espresso';
const woodMaterials = [];

function createWoodMaterial(rotateGrain = false) {
  const { map, bumpMap } = createWoodTextures(currentFinish);
  if (rotateGrain) {
    map.center.set(0.5, 0.5);
    map.rotation = Math.PI / 2;
    bumpMap.center.set(0.5, 0.5);
    bumpMap.rotation = Math.PI / 2;
  }
  const cfg = FINISHES[currentFinish];
  const mat = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: 0.008,
    roughness: cfg.roughness,
    metalness: cfg.metalness
  });
  mat.userData.rotateGrain = rotateGrain;
  woodMaterials.push(mat);
  return mat;
}

const woodVerticalMat = createWoodMaterial(false);
const woodHorizontalMat = createWoodMaterial(true);

const stoneMat = new THREE.MeshStandardMaterial({
  color: 0xefe7da,
  roughness: 0.22,
  metalness: 0.04
});

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
   4. INTERPRETADOR DE PEDIDOS & CONSTRUTOR PROCEDURAL DE MÓVEIS 3D
   ========================================================================== */
const furnitureRoot = new THREE.Group();
scene.add(furnitureRoot);

let animatedParts = [];
let interactiveOpenables = [];
let ledLight = null;
let doorsOpen = false;
let hasLedFeature = false;

function registerPart(obj, explodeOffset, explodeRot = { x: 0, y: 0, z: 0 }) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  animatedParts.push({
    obj,
    targetPos: obj.position.clone(),
    explodeOffset: new THREE.Vector3(explodeOffset.x, explodeOffset.y, explodeOffset.z),
    targetRot: obj.rotation.clone(),
    explodeRot
  });
  furnitureRoot.add(obj);
}

function clearFurniture() {
  while (furnitureRoot.children.length > 0) {
    furnitureRoot.remove(furnitureRoot.children[0]);
  }
  animatedParts = [];
  interactiveOpenables = [];
  ledLight = null;
  hasLedFeature = false;
  ledStripMat.emissiveIntensity = 0;
}

/* Extrai tipo de móvel, medidas (digitadas, no texto ou imaginação do site) e detalhes */
function parseFurnitureRequest(rawText, manualDims) {
  const text = (rawText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Detectar categoria do móvel
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

  // 2. Medidas padrão inteligentes ("imaginação do site") por categoria
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

  // Extrai números do texto se o usuário escreveu medidas na frase (ex: "1,50m", "120cm", "2.00 x 2.20")
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

  // Campos explícitos de medida têm prioridade máxima
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

  // 3. Quantidade de portas e gavetas
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
  const hasLed = text.includes('led') || category === 'balcao_ripado';

  // Troca acabamento se mencionado na frase
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
    hasLed,
    isAutoImagined,
    suggestedFinish
  };
}

/* Ajusta a câmera suavemente para enquadrar móveis baixos ou altos (ex: guarda-roupa 2,20m) */
function frameCameraToModel(widthUnits, heightUnits) {
  const centerY = heightUnits * 0.5;
  const maxDim = Math.max(widthUnits, heightUnits * 1.15);
  const dist = THREE.MathUtils.clamp(maxDim * 1.72, 2.25, 5.4);

  controls.target.set(0, centerY, 0);
  camera.position.set(dist * 0.72, centerY + dist * 0.42, dist * 0.88);
  controls.update();
}

/* CONSTRUTOR 1: ARMÁRIO DE PIA (Gabinete com cuba inox, prateleira interna e portas) */
function buildProceduralSinkCabinet(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const plinthH = 0.08;
  const boxH = h - plinthH - 0.036;

  // Rodapé recuado
  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, plinthH, d - 0.06), woodHorizontalMat);
  plinthBox.position.set(0, plinthH / 2, -0.015);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 });

  // Base inferior
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 });

  // Laterais
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(t, boxH - t, d), woodVerticalMat);
  leftSide.position.set(-w / 2 + t / 2, plinthH + boxH / 2 + t / 2, 0);
  registerPart(leftSide, { x: -0.45, y: 0.1, z: 0 });

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(t, boxH - t, d), woodVerticalMat);
  rightSide.position.set(w / 2 - t / 2, plinthH + boxH / 2 + t / 2, 0);
  registerPart(rightSide, { x: 0.45, y: 0.1, z: 0 });

  // Travessa superior frontal
  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, 0.06, t), woodHorizontalMat);
  frontRail.position.set(0, plinthH + boxH - 0.03, d / 2 - t / 2);
  registerPart(frontRail, { x: 0, y: 0.25, z: 0.35 });

  // Divisão entre portas e gaveteiro lateral (se tiver gavetas e largura >= 1.15m)
  const useSideDrawers = spec.hasDrawers && w >= 1.15;
  const drawerColW = useSideDrawers ? Math.min(0.42, w * 0.34) : 0;
  const doorsAreaW = w - t * 2 - (useSideDrawers ? drawerColW + t : 0);
  const doorsCenterX = -w / 2 + t + doorsAreaW / 2;

  if (useSideDrawers) {
    const divX = -w / 2 + t + doorsAreaW + t / 2;
    const divider = new THREE.Mesh(new THREE.BoxGeometry(t, boxH - t, d - 0.03), woodVerticalMat);
    divider.position.set(divX, plinthH + boxH / 2 + t / 2, -0.01);
    registerPart(divider, { x: 0.1, y: 0.35, z: -0.2 });

    const drawerH = (boxH - t - 0.018) / 3;
    const drawerCenterX = divX + t / 2 + drawerColW / 2;

    for (let i = 0; i < 3; i++) {
      const dg = new THREE.Group();
      const dy = plinthH + t + drawerH * (i + 0.5) + i * 0.005;
      dg.position.set(drawerCenterX, dy, d / 2 - t / 2);

      const front = new THREE.Mesh(new THREE.BoxGeometry(drawerColW - 0.006, drawerH - 0.006, t), woodVerticalMat);
      dg.add(front);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.02), chromeMat);
      handle.position.set(0, drawerH * 0.25, 0.018);
      dg.add(handle);

      const inner = new THREE.Mesh(new THREE.BoxGeometry(drawerColW - 0.04, drawerH * 0.65, d - 0.08), woodHorizontalMat);
      inner.position.set(0, -0.01, -(d - 0.08) / 2);
      dg.add(inner);

      registerPart(dg, { x: 0.35, y: 0.05 * i, z: 0.52 + i * 0.1 });
      interactiveOpenables.push({
        obj: dg,
        closedPos: dg.position.clone(),
        openPos: dg.position.clone().add(new THREE.Vector3(0, 0, 0.2 - i * 0.04)),
        closedRotY: 0,
        openRotY: 0
      });
    }
  }

  // Prateleira interna
  if (spec.hasShelf) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(doorsAreaW - 0.006, t, d - 0.08), woodHorizontalMat);
    shelf.position.set(doorsCenterX, plinthH + boxH * 0.46, -0.02);
    registerPart(shelf, { x: -0.15, y: 0.12, z: 0.42 });
  }

  // Portas com dobradiças e puxadores
  const doorCount = useSideDrawers ? Math.min(2, spec.doorCount) : spec.doorCount;
  const singleDoorW = (doorsAreaW - (doorCount - 1) * 0.005) / doorCount;
  const doorH = boxH - 0.072;
  const doorY = plinthH + t + doorH / 2;

  for (let i = 0; i < doorCount; i++) {
    const isLeftHinged = i % 2 === 0;
    const slotX = (-w / 2 + t) + singleDoorW * (i + 0.5) + i * 0.005;
    const pivot = new THREE.Group();
    pivot.position.set(isLeftHinged ? slotX - singleDoorW / 2 : slotX + singleDoorW / 2, doorY, d / 2 - t / 2);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(singleDoorW, doorH, t), woodVerticalMat);
    panel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.02), chromeMat);
    knob.position.set(isLeftHinged ? singleDoorW - 0.032 : -singleDoorW + 0.032, doorH * 0.28, 0.018);
    pivot.add(knob);

    registerPart(pivot, { x: (i - doorCount / 2) * 0.22, y: 0, z: 0.65 }, { x: 0, y: isLeftHinged ? -0.3 : 0.3, z: 0 });
    interactiveOpenables.push({
      obj: pivot,
      closedPos: pivot.position.clone(),
      openPos: pivot.position.clone(),
      closedRotY: 0,
      openRotY: isLeftHinged ? -Math.PI * 0.42 : Math.PI * 0.42
    });
  }

  // Tampo + Cuba Inox + Torneira
  const topGroup = new THREE.Group();
  topGroup.position.set(0, plinthH + boxH + 0.018, 0.01);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.036, d + 0.03), stoneMat);
  topGroup.add(slab);

  const sinkW = Math.min(0.52, doorsAreaW * 0.72);
  const sinkD = Math.min(0.36, d * 0.65);
  const basinRim = new THREE.Mesh(new THREE.BoxGeometry(sinkW, 0.012, sinkD), inoxMat);
  basinRim.position.set(doorsCenterX, 0.02, 0.01);
  topGroup.add(basinRim);

  const basinInner = new THREE.Mesh(new THREE.BoxGeometry(sinkW - 0.04, 0.014, sinkD - 0.04), cavityMat);
  basinInner.position.set(doorsCenterX, 0.021, 0.01);
  topGroup.add(basinInner);

  const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 24), chromeMat);
  faucetNeck.position.set(doorsCenterX, 0.1, -sinkD / 2 - 0.03);
  topGroup.add(faucetNeck);

  const faucetSpout = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.12), chromeMat);
  faucetSpout.position.set(doorsCenterX, 0.185, -sinkD / 2 + 0.025);
  topGroup.add(faucetSpout);

  registerPart(topGroup, { x: 0, y: 0.62, z: 0 });
}

/* CONSTRUTOR 2: GUARDA-ROUPA (Maleiro, Cabideiro, Prateleiras, Gavetas e Portas Altas) */
function buildProceduralWardrobe(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const plinthH = 0.07;
  const bodyH = h - plinthH;

  // Base / Rodapé
  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.03, plinthH, d - 0.04), woodHorizontalMat);
  plinthBox.position.set(0, plinthH / 2, -0.01);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 });

  // Fundo em chapa
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.01, bodyH - 0.01, 0.012), woodVerticalMat);
  backPanel.position.set(0, plinthH + bodyH / 2, -d / 2 + 0.006);
  registerPart(backPanel, { x: 0, y: 0.15, z: -0.55 });

  // Base inferior e Tampo superior
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  top.position.set(0, plinthH + bodyH - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 });

  // Laterais
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(t, bodyH - t * 2, d), woodVerticalMat);
  leftSide.position.set(-w / 2 + t / 2, plinthH + bodyH / 2, 0);
  registerPart(leftSide, { x: -0.45, y: 0.1, z: 0 });

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(t, bodyH - t * 2, d), woodVerticalMat);
  rightSide.position.set(w / 2 - t / 2, plinthH + bodyH / 2, 0);
  registerPart(rightSide, { x: 0.45, y: 0.1, z: 0 });

  // Prateleira do Maleiro superior
  const maleiroY = plinthH + bodyH - 0.42;
  const maleiroShelf = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, t, d - 0.03), woodHorizontalMat);
  maleiroShelf.position.set(0, maleiroY, 0);
  registerPart(maleiroShelf, { x: 0, y: 0.38, z: 0.35 });

  // Divisória vertical central (para largura >= 1.25m)
  const hasCenterDiv = w >= 1.25;
  if (hasCenterDiv) {
    const midDiv = new THREE.Mesh(new THREE.BoxGeometry(t, maleiroY - (plinthH + t), d - 0.04), woodVerticalMat);
    midDiv.position.set(0, (plinthH + t + maleiroY) / 2, -0.005);
    registerPart(midDiv, { x: 0, y: 0.2, z: 0.3 });
  }

  // Cabideiro cromado lado esquerdo
  const rodSpan = hasCenterDiv ? w / 2 - t * 1.5 : w - t * 2;
  const rodCenterX = hasCenterDiv ? -w / 4 : 0;
  const hangingRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, rodSpan - 0.02, 20), chromeMat);
  hangingRod.rotation.z = Math.PI / 2;
  hangingRod.position.set(rodCenterX, maleiroY - 0.12, 0);
  registerPart(hangingRod, { x: -0.25, y: 0.25, z: 0.45 });

  // Prateleiras internas lado direito (ou centro)
  const shelfSpan = hasCenterDiv ? w / 2 - t * 1.5 : w - t * 2;
  const shelfCenterX = hasCenterDiv ? w / 4 : 0;
  const shelfLevels = [0.38, 0.56, 0.74];
  shelfLevels.forEach((ratio, idx) => {
    const sy = plinthH + (maleiroY - plinthH) * ratio;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(shelfSpan - 0.01, t, d - 0.05), woodHorizontalMat);
    sh.position.set(shelfCenterX, sy, -0.01);
    registerPart(sh, { x: 0.25, y: 0.1 * idx, z: 0.38 + idx * 0.08 });
  });

  // Gavetas internas inferiores
  if (spec.hasDrawers) {
    const drawerW = shelfSpan - 0.04;
    for (let g = 0; g < 2; g++) {
      const dg = new THREE.Group();
      const gy = plinthH + t + 0.11 + g * 0.19;
      dg.position.set(shelfCenterX, gy, d / 2 - 0.04);
      const dFront = new THREE.Mesh(new THREE.BoxGeometry(drawerW, 0.17, 0.02), woodVerticalMat);
      dg.add(dFront);
      registerPart(dg, { x: 0.3, y: 0.05, z: 0.55 + g * 0.1 });
      interactiveOpenables.push({
        obj: dg,
        closedPos: dg.position.clone(),
        openPos: dg.position.clone().add(new THREE.Vector3(0, 0, 0.16)),
        closedRotY: 0,
        openRotY: 0
      });
    }
  }

  // Portas altas do guarda-roupa
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

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(singleDoorW, doorH, t), woodVerticalMat);
    doorPanel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(doorPanel);

    const longHandle = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.32, 0.022), chromeMat);
    longHandle.position.set(isLeftHinged ? singleDoorW - 0.032 : -singleDoorW + 0.032, 0, 0.018);
    pivot.add(longHandle);

    registerPart(pivot, { x: (i - doorCount / 2) * 0.2, y: 0, z: 0.72 }, { x: 0, y: isLeftHinged ? -0.25 : 0.25, z: 0 });
    interactiveOpenables.push({
      obj: pivot,
      closedPos: pivot.position.clone(),
      openPos: pivot.position.clone(),
      closedRotY: 0,
      openRotY: isLeftHinged ? -Math.PI * 0.42 : Math.PI * 0.42
    });
  }
}

/* CONSTRUTOR 3: ARMÁRIO DE COZINHA (Balcão inferior + Módulo Aéreo suspenso) */
function buildProceduralKitchen(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const totalH = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const lowerH = 0.86;

  // 1. Balcão Inferior
  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.08, d - 0.05), woodHorizontalMat);
  plinthBox.position.set(0, 0.04, -0.015);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 });

  const lowerBoxH = lowerH - 0.08 - 0.036;
  const lowerBottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  lowerBottom.position.set(0, 0.08 + t / 2, 0);
  registerPart(lowerBottom, { x: 0, y: -0.15, z: 0.25 });

  [-w / 2 + t / 2, 0, w / 2 - t / 2].forEach((px, idx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(t, lowerBoxH - t, d), woodVerticalMat);
    post.position.set(px, 0.08 + lowerBoxH / 2 + t / 2, 0);
    registerPart(post, { x: (idx - 1) * 0.38, y: 0.1, z: 0 });
  });

  // Tampo em quartzo/pedra
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.036, d + 0.04), stoneMat);
  counterTop.position.set(0, lowerH - 0.018, 0.01);
  registerPart(counterTop, { x: 0, y: 0.35, z: 0.35 });

  // Portas e Gavetas inferiores
  const doorCount = spec.doorCount;
  const innerW = w - t * 2;
  const singleW = (innerW - (doorCount - 1) * 0.006) / doorCount;
  const doorH = lowerBoxH - 0.04;

  for (let i = 0; i < doorCount; i++) {
    const isLeft = i % 2 === 0;
    const slotX = -innerW / 2 + singleW * (i + 0.5) + i * 0.006;
    const pivot = new THREE.Group();
    pivot.position.set(isLeft ? slotX - singleW / 2 : slotX + singleW / 2, 0.08 + t + doorH / 2, d / 2 + 0.002);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(singleW, doorH, t), woodVerticalMat);
    panel.position.set(isLeft ? singleW / 2 : -singleW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.02), chromeMat);
    knob.position.set(isLeft ? singleW - 0.03 : -singleW + 0.03, doorH * 0.32, 0.018);
    pivot.add(knob);

    registerPart(pivot, { x: (i - doorCount / 2) * 0.18, y: 0.05, z: 0.62 });
    interactiveOpenables.push({
      obj: pivot,
      closedPos: pivot.position.clone(),
      openPos: pivot.position.clone(),
      closedRotY: 0,
      openRotY: isLeft ? -Math.PI * 0.4 : Math.PI * 0.4
    });
  }

  // 2. Armário Aéreo Superior (se altura >= 1.50m)
  if (totalH >= 1.5) {
    const upperD = Math.min(0.36, d * 0.65);
    const upperH = Math.min(0.68, totalH - lowerH - 0.55);
    const upperBaseY = totalH - upperH;
    const upperZ = -d / 2 + upperD / 2;

    const uBottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, upperD), woodHorizontalMat);
    uBottom.position.set(0, upperBaseY + t / 2, upperZ);
    registerPart(uBottom, { x: 0, y: 0.45, z: 0.25 });

    const uTop = new THREE.Mesh(new THREE.BoxGeometry(w, t, upperD), woodHorizontalMat);
    uTop.position.set(0, totalH - t / 2, upperZ);
    registerPart(uTop, { x: 0, y: 0.72, z: 0 });

    [-w / 2 + t / 2, w / 2 - t / 2].forEach((ux, idx) => {
      const uSide = new THREE.Mesh(new THREE.BoxGeometry(t, upperH - t * 2, upperD), woodVerticalMat);
      uSide.position.set(ux, upperBaseY + upperH / 2, upperZ);
      registerPart(uSide, { x: (idx === 0 ? -0.42 : 0.42), y: 0.55, z: 0 });
    });

    for (let i = 0; i < doorCount; i++) {
      const isLeft = i % 2 === 0;
      const slotX = -innerW / 2 + singleW * (i + 0.5) + i * 0.006;
      const pivot = new THREE.Group();
      pivot.position.set(isLeft ? slotX - singleW / 2 : slotX + singleW / 2, upperBaseY + upperH / 2, upperZ + upperD / 2 + 0.002);

      const uDoor = new THREE.Mesh(new THREE.BoxGeometry(singleW, upperH - 0.015, t), woodVerticalMat);
      uDoor.position.set(isLeft ? singleW / 2 : -singleW / 2, 0, 0);
      pivot.add(uDoor);

      const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.1, 0.02), chromeMat);
      knob.position.set(isLeft ? singleW - 0.03 : -singleW + 0.03, -upperH * 0.3, 0.018);
      pivot.add(knob);

      registerPart(pivot, { x: (i - doorCount / 2) * 0.18, y: 0.55, z: 0.65 });
      interactiveOpenables.push({
        obj: pivot,
        closedPos: pivot.position.clone(),
        openPos: pivot.position.clone(),
        closedRotY: 0,
        openRotY: isLeft ? -Math.PI * 0.4 : Math.PI * 0.4
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

  const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, t, d - 0.04), woodHorizontalMat);
  base.position.set(0, t / 2, 0);
  registerPart(base, { x: 0, y: -0.25, z: 0 });

  const coreBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.08, d - 0.07), woodVerticalMat);
  coreBox.position.set(0, (h - 0.08) / 2 + t, -0.01);
  registerPart(coreBox, { x: 0, y: 0.35, z: -0.35 });

  const slatCount = Math.max(16, Math.round(w * 18));
  const slatW = 0.024;
  const slatDepth = 0.022;
  const slatH = h - 0.055;
  const startX = -(w - 0.06) / 2 + slatW / 2;
  const stepX = (w - 0.06 - slatW) / (slatCount - 1);

  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, slatH, slatDepth), woodVerticalMat);
    slat.position.set(startX + i * stepX, slatH / 2 + 0.015, d / 2 - 0.02);
    registerPart(slat, {
      x: (i - slatCount / 2) * 0.012,
      y: 0.15 + (i % 4) * 0.06,
      z: 0.45 + Math.sin(i * 0.25) * 0.22
    });
  }

  const ledBar = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.014, 0.018), ledStripMat);
  ledBar.position.set(0, h - 0.042, d / 2 - 0.008);
  registerPart(ledBar, { x: 0, y: 0.45, z: 0.25 });

  ledLight = new THREE.PointLight(0xffb84d, 0, 2.4, 1.6);
  ledLight.position.set(0, h - 0.08, d / 2 + 0.18);
  furnitureRoot.add(ledLight);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.042, d + 0.05), woodHorizontalMat);
  counterTop.position.set(0, h - 0.015, 0.01);
  registerPart(counterTop, { x: 0, y: 0.65, z: 0 });
}

/* CONSTRUTOR 5: ESTANTE & NICHOS */
function buildProceduralBookshelf(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  bottom.position.set(0, 0.05, 0);
  registerPart(bottom, { x: 0, y: -0.2, z: 0.2 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  top.position.set(0, h - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(t, h - 0.05 - t, d), woodVerticalMat);
    side.position.set(sx, (0.05 + h - t) / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.42 : 0.42, y: 0.1, z: 0 });
  });

  const shelfCount = Math.max(3, Math.round(h / 0.38));
  for (let i = 1; i < shelfCount; i++) {
    const sy = 0.05 + ((h - 0.05 - t) / shelfCount) * i;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, t, d - 0.01), woodHorizontalMat);
    shelf.position.set(0, sy, 0);
    registerPart(shelf, { x: 0, y: 0.15 * i, z: 0.35 + i * 0.06 });

    const divX = (i % 2 === 0 ? -1 : 1) * (w * 0.16);
    const segH = (h - 0.05 - t) / shelfCount - t;
    const divider = new THREE.Mesh(new THREE.BoxGeometry(t, segH, d - 0.02), woodVerticalMat);
    divider.position.set(divX, sy + segH / 2 + t / 2, 0);
    registerPart(divider, { x: divX * 0.8, y: 0.2, z: 0.42 });
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

  const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.03, plinthH, d - 0.04), woodHorizontalMat);
  plinthBox.position.set(0, plinthH / 2, -0.01);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 });

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  top.position.set(0, plinthH + bodyH - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(t, bodyH - t * 2, d), woodVerticalMat);
    side.position.set(sx, plinthH + bodyH / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.45 : 0.45, y: 0.1, z: 0 });
  });

  const shelves = Math.max(3, Math.round(bodyH / 0.36));
  for (let s = 1; s < shelves; s++) {
    const sy = plinthH + (bodyH / shelves) * s;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2 - 0.006, t, d - 0.05), woodHorizontalMat);
    sh.position.set(0, sy, -0.015);
    registerPart(sh, { x: 0, y: 0.1 * s, z: 0.38 });
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

    const panel = new THREE.Mesh(new THREE.BoxGeometry(singleDoorW, doorH, t), woodVerticalMat);
    panel.position.set(isLeft ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.22, 0.02), chromeMat);
    knob.position.set(isLeft ? singleDoorW - 0.032 : -singleDoorW + 0.032, 0, 0.018);
    pivot.add(knob);

    registerPart(pivot, { x: (i - doorCount / 2) * 0.2, y: 0, z: 0.65 });
    interactiveOpenables.push({
      obj: pivot,
      closedPos: pivot.position.clone(),
      openPos: pivot.position.clone(),
      closedRotY: 0,
      openRotY: isLeft ? -Math.PI * 0.42 : Math.PI * 0.42
    });
  }
}

/* ==========================================================================
   5. PARTÍCULAS SUTIS DE PÓ DE MADEIRA DOURADO NA LUZ
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
   6. MOTOR DE ANIMAÇÃO E CONTROLE DO CRIADOR SOB MEDIDA
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

  doorsBtnText.textContent = hasLedFeature ? 'Acender LED' : 'Abrir portas';
  frameCameraToModel(spec.wCm / 100, spec.hCm / 100);

  const originTag = spec.isAutoImagined ? ' · Medidas sugeridas pelo site' : '';
  const doorsInfo = spec.category === 'balcao_ripado'
    ? 'Ripado + LED'
    : spec.category === 'estante'
      ? 'Nichos sob medida'
      : `${spec.doorCount} portas`;

  generatedSpecsEl.innerHTML = `Projeto ativo: <strong>${spec.displayTitle}</strong> · ${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm · ${doorsInfo}${originTag}`;

  // Sincroniza automaticamente com o formulário de orçamento no rodapé
  const projectTypeInput = document.getElementById('projectType');
  const projectNotesInput = document.getElementById('projectNotes');
  if (projectTypeInput) {
    projectTypeInput.value = `${spec.displayTitle} (${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm)`;
  }
  if (projectNotesInput) {
    projectNotesInput.value = `Modelo: ${spec.displayTitle} | Medidas: ${spec.wCm}cm (L) x ${spec.hCm}cm (A) x ${spec.dCm}cm (P) | Configuração: ${doorsInfo}.`;
  }

  triggerFullAssembly();
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

  woodMaterials.forEach((mat) => {
    const { map, bumpMap } = createWoodTextures(finishKey);
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

// Cartões de projetos executados
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

// Acabamentos, Replay e Controles do Palco 3D
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

doorsBtn.addEventListener('click', () => {
  if (hasLedFeature) {
    const isBright = ledStripMat.emissiveIntensity > 1.2;
    ledStripMat.emissiveIntensity = isBright ? 0.35 : 2.2;
    if (ledLight) ledLight.intensity = isBright ? 0.4 : 2.4;
    doorsBtnText.textContent = isBright ? 'Acender LED' : 'Suavizar LED';
    return;
  }
  doorsOpen = !doorsOpen;
  doorsBtnText.textContent = doorsOpen ? 'Fechar portas' : 'Abrir portas';
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (isAutoBuilding) {
    assemblyProgress += delta * 0.42;
    if (assemblyProgress >= 1) {
      assemblyProgress = 1;
      isAutoBuilding = false;
      assemblyStatus.textContent = 'Montado';
    }
    explodeRange.value = Math.round((1 - assemblyProgress) * 100);
  } else {
    assemblyProgress += (targetAssembly - assemblyProgress) * Math.min(1, delta * 7);
  }

  const totalParts = animatedParts.length;
  animatedParts.forEach((part, idx) => {
    const startWindow = (idx / Math.max(totalParts, 1)) * 0.48;
    const localRaw = THREE.MathUtils.clamp(
      (assemblyProgress - startWindow) / (1 - startWindow),
      0,
      1
    );
    const eased = easeOutBack(localRaw);
    const inv = 1 - eased;

    part.obj.position.set(
      part.targetPos.x + part.explodeOffset.x * inv,
      part.targetPos.y + part.explodeOffset.y * inv,
      part.targetPos.z + part.explodeOffset.z * inv
    );

    part.obj.rotation.set(
      part.targetRot.x + part.explodeRot.x * inv,
      part.targetRot.y + part.explodeRot.y * inv,
      part.targetRot.z + part.explodeRot.z * inv
    );
  });

  if (assemblyProgress > 0.92 && !hasLedFeature) {
    interactiveOpenables.forEach((item) => {
      const targetP = doorsOpen ? item.openPos : item.closedPos;
      const targetR = doorsOpen ? item.openRotY : item.closedRotY;
      item.obj.position.lerp(targetP, Math.min(1, delta * 6));
      item.obj.rotation.y += (targetR - item.obj.rotation.y) * Math.min(1, delta * 6);
    });
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

// Inicia com um Armário de Pia montando ao abrir a página
runCreator('Quero criar um armário de pia com 2 portas e prateleira interna');
animate();

/* ==========================================================================
   7. INTERAÇÕES DE PÁGINA, MENU MOBILE E FORMULÁRIO
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
