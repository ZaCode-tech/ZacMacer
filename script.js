import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { boxGeo, FINISHES, PAINT_BUCKETS, createWoodTexturesFromConfig, accMaterial, isAcc, partGeometry, rotRad } from './shared.js';
import { matchFurniture, makeFurniture } from './furniture.js';
import { CATALOG, specFromItem, detectCustom, parseDna, thumbSvg } from './catalog.js';
import { computeBOM, countScrews } from './bom.js';
import { initARAnd360 } from './ar-and-360.js';

/* ==========================================================================
   2. CENA 3D, ILUMINAÇÃO DE ESTÚDIO E CONTROLES DE CÂMERA
   ========================================================================== */
const IS_MOBILE = matchMedia('(max-width: 820px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
scene.environment = envRT.texture;
scene.environmentIntensity = 0.7;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 1.2;
controls.maxDistance = 7.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 0.55, 0);

const hemiLight = new THREE.HemisphereLight(0xfff5e8, 0x8a7560, 0.8);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff1de, 1.85);
keyLight.position.set(3.4, 5.2, 3.6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(IS_MOBILE ? 1024 : 2048, IS_MOBILE ? 1024 : 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 16;
keyLight.shadow.camera.left = -2.8;
keyLight.shadow.camera.right = 2.8;
keyLight.shadow.camera.top = 3.2;
keyLight.shadow.camera.bottom = -1.5;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffd9c2, 0.55);
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
  color: 0xe4dac8,
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

function applyGrainRotation(tex, rotateGrain) {
  if (!tex) return;
  if (rotateGrain) {
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2;
  } else {
    tex.center.set(0.5, 0.5);
    tex.rotation = 0;
  }
  tex.needsUpdate = true;
}

function createPartWoodMaterial(rotateGrain = false, customCfg = null) {
  const cfg = customCfg || FINISHES[currentFinish] || Object.values(FINISHES)[0];
  const { map, bumpMap } = createWoodTexturesFromConfig(cfg);
  applyGrainRotation(map, rotateGrain);
  applyGrainRotation(bumpMap, rotateGrain);

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

const metalMat = new THREE.MeshStandardMaterial({
  color: 0x1c1d20,
  roughness: 0.45,
  metalness: 0.8
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
  boxGeo(0.044, 0.048, 0.016),
  bristleMat
);
bristleMesh.position.y = 0.024;
brush3D.add(bristleMesh);

brush3D.rotation.z = -0.45;
brush3D.rotation.x = 0.35;
scene.add(brush3D);

let brushSweepTimer = 0;
const paintSplashes = [];
const splashGeo = new THREE.SphereGeometry(0.012, 8, 8);

function spawnPaintSplash(point, hexColor) {
  const splashMat = new THREE.MeshBasicMaterial({ color: hexColor });
  for (let i = 0; i < 8; i++) {
    const drop = new THREE.Mesh(splashGeo, splashMat);
    drop.position.copy(point);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.9,
      0.25 + Math.random() * 0.65,
      (Math.random() - 0.5) * 0.9
    );
    scene.add(drop);
    paintSplashes.push({ mesh: drop, mat: splashMat, vel, life: 0.45 });
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
const dimensionLinesGroup = new THREE.Group();
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
  const f = (n) => {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? `${r}` : r.toFixed(1).replace('.', ',');
  };
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
    paintedBucketId: null,
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
    openRotX: config.openRotX || 0,
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
  clearHardwareMarks();

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
  hoveredPaintPart = null;
  ledLight = null;
  hasLedFeature = false;
  ledStripMat.emissiveIntensity = 0;

  const dimOverlay = document.getElementById('dimensionOverlay');
  if (dimOverlay) dimOverlay.innerHTML = '';
  clearDimensionLines3D();
}

/* Extrai tipo de móvel, medidas (digitadas, no texto ou imaginação do site) e detalhes */
function parseFurnitureRequest(rawText, manualDims = {}) {
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

  const ext = matchFurniture(text);
  const custom = ext ? null : detectCustom(text);
  if (custom) {
    category = custom.category;
    displayTitle = custom.title;
  }

  const defaults = {
    armario_pia:     { w: 120, h: 85,  d: 56 },
    guarda_roupa:    { w: 185, h: 215, d: 58 },
    armario_cozinha: { w: 200, h: 210, d: 56 },
    balcao_ripado:   { w: 175, h: 94,  d: 56 },
    estante:         { w: 135, h: 185, d: 38 },
    armario:         { w: 110, h: 165, d: 48 },
    metalon:         { w: 140, h: 76,  d: 60 },
    comoda:          { w: 110, h: 95,  d: 46 },
    modular:         { w: 160, h: 180, d: 50 }
  };

  let { w, h, d } = ext ? { w: ext.W, h: ext.H, d: ext.D } : custom && custom.dims ? custom.dims : (defaults[category] || defaults.armario_pia);
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

  const known = Boolean(custom) || Boolean(ext) || /guarda|roupeiro|closet|cozinha|aereo|bancada|pia|tanque|banheiro|lavabo|gabinete|ripado|balcao|recepcao|aparador|estante|nicho|armario|multiuso|dispensa|sapateira/.test(text);
  const opts = {
    led: /\bled\b|iluminacao|luz/.test(text) ? (/frio|branc/.test(text) ? 'frio' : /neutro/.test(text) ? 'neutro' : 'quente') : 'quente',
    divider: /divisoria/.test(text) ? Math.min(4, parseInt((text.match(/(\d+)\s*divisoria/) || [0, 1])[1], 10) || 1) : 0,
    backShelves: /prat\w*leira/.test(text) && /(atras|fundo|traseir)/.test(text) ? Math.min(6, parseInt((text.match(/(\d+)\s*prat\w*leira/) || [0, 3])[1], 10) || 3) : 0
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

  const specOut = {
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
    kind: custom ? custom.kind : null,
    levels: custom ? custom.levels : 0,
    dna: custom && custom.dna ? custom.dna : null,
    brace: custom && custom.brace ? custom.brace : null,
    legs6: Boolean(custom && custom.legs6),
    back: Boolean(custom && custom.back),
    drawer: Boolean(custom && custom.drawer),
    opts,
    fallback: !known
  };
  if (ext) {
    return makeFurniture(ext, Math.round(w), Math.round(h), Math.round(d), { isAutoImagined, suggestedFinish, opts, fallback: false, doorCount, hasShelf });
  }
  return specOut;
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
  const boxH = Math.max(0.2, h - plinthH - 0.036);

  const plinthBox = new THREE.Mesh(
    boxGeo(w - 0.04, plinthH, d - 0.06),
    createPartWoodMaterial(true)
  );
  plinthBox.position.set(0, plinthH / 2, -0.015);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Rodapé Base',
    dimsCm: { w: spec.wCm - 4, h: 8, d: spec.dCm - 6 }
  });

  const bottom = new THREE.Mesh(
    boxGeo(w, t, d),
    createPartWoodMaterial(true)
  );
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const leftSide = new THREE.Mesh(
    boxGeo(t, boxH - t, d),
    createPartWoodMaterial(false)
  );
  leftSide.position.set(-w / 2 + t / 2, plinthH + boxH / 2 + t / 2, 0);
  registerPart(leftSide, { x: -0.48, y: 0.1, z: 0 }, {
    name: 'Parede Lateral Esquerda',
    dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm }
  });

  const rightSide = new THREE.Mesh(
    boxGeo(t, boxH - t, d),
    createPartWoodMaterial(false)
  );
  rightSide.position.set(w / 2 - t / 2, plinthH + boxH / 2 + t / 2, 0);
  registerPart(rightSide, { x: 0.48, y: 0.1, z: 0 }, {
    name: 'Parede Lateral Direita',
    dimsCm: { w: 2.2, h: Math.round((boxH - t) * 100), d: spec.dCm }
  });

  const frontRail = new THREE.Mesh(
    boxGeo(w - t * 2, 0.06, t),
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
      boxGeo(t, boxH - t, d - 0.03),
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
        boxGeo(drawerColW - 0.006, drawerH - 0.006, t),
        drawerMat
      );
      dg.add(front);

      const handle = new THREE.Mesh(boxGeo(0.11, 0.012, 0.02), chromeMat);
      handle.position.set(0, drawerH * 0.25, 0.018);
      handle.userData.nonPaintable = true;
      dg.add(handle);

      const inner = new THREE.Mesh(
        boxGeo(drawerColW - 0.04, drawerH * 0.65, d - 0.08),
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
      boxGeo(doorsAreaW - 0.006, t, d - 0.08),
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
      boxGeo(singleDoorW, doorH, t),
      createPartWoodMaterial(false)
    );
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

  const slab = new THREE.Mesh(
    boxGeo(w + 0.03, 0.036, d + 0.03),
    createStonePartMaterial()
  );
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
}

/* CONSTRUTOR 2: GUARDA-ROUPA */
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
}

/* CONSTRUTOR 3: ARMÁRIO DE COZINHA */
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

  const lowerBoxH = lowerH - 0.08 - 0.036;
  const lowerBottom = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
  lowerBottom.position.set(0, 0.08 + t / 2, 0);
  registerPart(lowerBottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Balcão Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const wallNames = ['Parede Lateral Esquerda', 'Divisória Central Balcão', 'Parede Lateral Direita'];
  [-w / 2 + t / 2, 0, w / 2 - t / 2].forEach((px, idx) => {
    const post = new THREE.Mesh(boxGeo(t, lowerBoxH - t, d), createPartWoodMaterial(false));
    post.position.set(px, 0.08 + lowerBoxH / 2 + t / 2, 0);
    registerPart(post, { x: (idx - 1) * 0.42, y: 0.1, z: 0 }, {
      name: wallNames[idx],
      dimsCm: { w: 2.2, h: Math.round((lowerBoxH - t) * 100), d: spec.dCm }
    });
  });

  const counterTop = new THREE.Mesh(boxGeo(w + 0.04, 0.036, d + 0.04), createStonePartMaterial());
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

    const panel = new THREE.Mesh(boxGeo(singleW, doorH, t), createPartWoodMaterial(false));
    panel.position.set(isLeft ? singleW / 2 : -singleW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(boxGeo(0.014, 0.11, 0.02), chromeMat);
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

    const uBottom = new THREE.Mesh(boxGeo(w, t, upperD), createPartWoodMaterial(true));
    uBottom.position.set(0, upperBaseY + t / 2, upperZ);
    registerPart(uBottom, { x: 0, y: 0.45, z: 0.25 }, {
      name: 'Base Armário Aéreo',
      dimsCm: { w: spec.wCm, h: 2.2, d: Math.round(upperD * 100) }
    });

    const uTop = new THREE.Mesh(boxGeo(w, t, upperD), createPartWoodMaterial(true));
    uTop.position.set(0, totalH - t / 2, upperZ);
    registerPart(uTop, { x: 0, y: 0.72, z: 0 }, {
      name: 'Tampo Armário Aéreo',
      dimsCm: { w: spec.wCm, h: 2.2, d: Math.round(upperD * 100) }
    });

    [-w / 2 + t / 2, w / 2 - t / 2].forEach((ux, idx) => {
      const uSide = new THREE.Mesh(boxGeo(t, upperH - t * 2, upperD), createPartWoodMaterial(false));
      uSide.position.set(ux, upperBaseY + upperH / 2, upperZ);
      registerPart(uSide, { x: idx === 0 ? -0.45 : 0.45, y: 0.55, z: 0 }, {
        name: idx === 0 ? 'Lateral Aéreo Esq.' : 'Lateral Aéreo Dir.',
        dimsCm: { w: 2.2, h: Math.round((upperH - t * 2) * 100), d: Math.round(upperD * 100) }
      });
    });

    for (let i = 0; i < doorCount; i++) {
      const isLeft = i % 2 === 0;
      const slotX = -innerW / 2 + singleW * (i + 0.5) + i * 0.006;
      const pivot = new THREE.Group();
      pivot.position.set(isLeft ? slotX - singleW / 2 : slotX + singleW / 2, upperBaseY + upperH / 2, upperZ + upperD / 2 + 0.002);

      const uDoor = new THREE.Mesh(boxGeo(singleW, upperH - 0.015, t), createPartWoodMaterial(false));
      uDoor.position.set(isLeft ? singleW / 2 : -singleW / 2, 0, 0);
      pivot.add(uDoor);

      const knob = new THREE.Mesh(boxGeo(0.014, 0.1, 0.02), chromeMat);
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
  const o = spec.opts || {};
  const hollow = Boolean(o.divider || o.backShelves);
  const LEDC = {
    quente: [0xffd27d, 0xffa733, 0xffb84d],
    frio: [0xe8f4ff, 0x9fd0ff, 0xbfe0ff],
    neutro: [0xfff6e6, 0xffe2b8, 0xffeacc]
  }[o.led || 'quente'];
  ledStripMat.color.setHex(LEDC[0]);
  ledStripMat.emissive.setHex(LEDC[1]);

  const base = new THREE.Mesh(boxGeo(w - 0.04, t, d - 0.04), createPartWoodMaterial(true));
  base.position.set(0, t / 2, 0);
  registerPart(base, { x: 0, y: -0.25, z: 0 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm - 4, h: 2.5, d: spec.dCm - 4 }
  });

  if (hollow) {
    const iw = w - 0.06;
    const ih = Math.max(0.12, h - 0.08);
    const idp = d - 0.07;
    const cy = ih / 2 + t;
    const tt = 0.022;
    const pm = (sx, sy, sz, x, y, z, rot) => {
      const m = new THREE.Mesh(boxGeo(sx, sy, sz), createPartWoodMaterial(rot));
      m.position.set(x, y, z);
      return m;
    };
    [-1, 1].forEach((k) => {
      registerPart(
        pm(tt, ih, idp, k * (iw / 2 - tt / 2), cy, -0.01, false),
        { x: k * 0.4, y: 0.1, z: -0.2 },
        {
          name: k < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
          dimsCm: { w: 2.2, h: Math.round(ih * 100), d: Math.round(idp * 100) }
        }
      );
    });
    registerPart(
      pm(iw - 2 * tt, tt, idp, 0, t + ih - tt / 2, -0.01, true),
      { x: 0, y: 0.45, z: -0.2 },
      {
        name: 'Travessa Fixa Superior',
        dimsCm: { w: Math.round((iw - 2 * tt) * 100), h: 2.2, d: Math.round(idp * 100) }
      }
    );
    for (let k = 1; k <= (o.divider || 0); k++) {
      registerPart(
        pm(tt, ih - 2 * tt, idp - 0.02, -iw / 2 + tt + ((iw - 2 * tt) * k) / (o.divider + 1), cy, -0.02, false),
        { x: 0, y: 0.15, z: -0.3 },
        {
          name: `Divisória ${k}`,
          dimsCm: { w: 2.2, h: Math.round((ih - 2 * tt) * 100), d: Math.round((idp - 0.02) * 100) }
        }
      );
    }
    for (let k = 1; k <= (o.backShelves || 0); k++) {
      registerPart(
        pm(iw - 2 * tt - 0.004, tt, idp - 0.03, 0, t + ((ih - tt) * k) / (o.backShelves + 1), -0.025, true),
        { x: 0, y: 0.1 + k * 0.05, z: -0.35 - k * 0.05 },
        {
          name: `Prateleira Traseira ${k}`,
          dimsCm: { w: Math.round((iw - 2 * tt) * 100), h: 2.2, d: Math.round((idp - 0.03) * 100) }
        }
      );
    }
  } else {
    const coreBox = new THREE.Mesh(boxGeo(w - 0.06, Math.max(0.12, h - 0.08), d - 0.07), createPartWoodMaterial(false));
    coreBox.position.set(0, Math.max(0.12, h - 0.08) / 2 + t, -0.01);
    registerPart(coreBox, { x: 0, y: 0.35, z: -0.38 }, {
      name: 'Caixa Estrutural Interna',
      dimsCm: { w: spec.wCm - 6, h: spec.hCm - 8, d: spec.dCm - 7 }
    });
  }

  const slatCount = Math.max(16, Math.round(w * 18));
  const slatW = 0.024;
  const slatDepth = 0.022;
  const slatH = Math.max(0.1, h - 0.055);
  const startX = -(w - 0.06) / 2 + slatW / 2;
  const stepX = (w - 0.06 - slatW) / (slatCount - 1);

  const slatsGroup = new THREE.Group();
  const sharedSlatMat = createPartWoodMaterial(false);
  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(boxGeo(slatW, slatH, slatDepth), sharedSlatMat);
    slat.position.set(startX + i * stepX, slatH / 2 + 0.015, d / 2 - 0.02);
    slatsGroup.add(slat);
  }
  registerPart(slatsGroup, { x: 0, y: 0.18, z: 0.58 }, {
    name: `Painel Ripado (${slatCount} ripas)`,
    dimsCm: { w: spec.wCm - 6, h: Math.round(slatH * 100), d: 2.2 }
  });

  const ledBar = new THREE.Mesh(boxGeo(w - 0.04, 0.014, 0.018), ledStripMat);
  ledBar.position.set(0, h - 0.042, d / 2 - 0.008);
  registerPart(ledBar, { x: 0, y: 0.45, z: 0.25 }, {
    name: `Perfil LED ${o.led === 'frio' ? 'Frio' : o.led === 'neutro' ? 'Neutro' : 'Quente'}`,
    dimsCm: { w: spec.wCm - 4, h: 1.4, d: 1.8 },
    paintable: false
  });

  ledLight = new THREE.PointLight(LEDC[2], 0, 2.4, 1.6);
  ledLight.position.set(0, h - 0.08, d / 2 + 0.18);
  furnitureRoot.add(ledLight);

  const counterTop = new THREE.Mesh(boxGeo(w + 0.05, 0.042, d + 0.05), createPartWoodMaterial(true));
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

  const bottom = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
  bottom.position.set(0, 0.05, 0);
  registerPart(bottom, { x: 0, y: -0.2, z: 0.2 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const top = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
  top.position.set(0, h - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 }, {
    name: 'Tampo Superior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(boxGeo(t, h - 0.05 - t, d), createPartWoodMaterial(false));
    side.position.set(sx, (0.05 + h - t) / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.45 : 0.45, y: 0.1, z: 0 }, {
      name: idx === 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: spec.hCm - 7, d: spec.dCm }
    });
  });

  const shelfCount = Math.max(3, Math.round(h / 0.38));
  for (let i = 1; i < shelfCount; i++) {
    const sy = 0.05 + ((h - 0.05 - t) / shelfCount) * i;
    const shelf = new THREE.Mesh(boxGeo(w - t * 2, t, d - 0.01), createPartWoodMaterial(true));
    shelf.position.set(0, sy, 0);
    registerPart(shelf, { x: 0, y: 0.14 * i, z: 0.38 + i * 0.05 }, {
      name: `Prateleira ${i}`,
      dimsCm: { w: spec.wCm - 4, h: 2.2, d: spec.dCm - 1 }
    });

    const divX = (i % 2 === 0 ? -1 : 1) * (w * 0.16);
    const segH = (h - 0.05 - t) / shelfCount - t;
    const divider = new THREE.Mesh(boxGeo(t, segH, d - 0.02), createPartWoodMaterial(false));
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
  const bodyH = Math.max(0.3, h - plinthH);

  const plinthBox = new THREE.Mesh(boxGeo(w - 0.03, plinthH, d - 0.04), createPartWoodMaterial(true));
  plinthBox.position.set(0, plinthH / 2, -0.01);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Rodapé Base',
    dimsCm: { w: spec.wCm - 3, h: 7, d: spec.dCm - 4 }
  });

  const bottom = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const top = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
  top.position.set(0, plinthH + bodyH - t / 2, 0);
  registerPart(top, { x: 0, y: 0.55, z: 0 }, {
    name: 'Tampo Superior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(boxGeo(t, bodyH - t * 2, d), createPartWoodMaterial(false));
    side.position.set(sx, plinthH + bodyH / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.48 : 0.48, y: 0.1, z: 0 }, {
      name: idx === 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
    });
  });

  const shelves = Math.max(3, Math.round(bodyH / 0.36));
  for (let s = 1; s < shelves; s++) {
    const sy = plinthH + (bodyH / shelves) * s;
    const sh = new THREE.Mesh(boxGeo(w - t * 2 - 0.006, t, d - 0.05), createPartWoodMaterial(true));
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

    const panel = new THREE.Mesh(boxGeo(singleDoorW, doorH, t), createPartWoodMaterial(false));
    panel.position.set(isLeft ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(panel);

    const knob = new THREE.Mesh(boxGeo(0.014, 0.22, 0.02), chromeMat);
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

/* CONSTRUTOR 7: MÓVEIS DE SERRALHERIA METALON (mesa, rack, estante, banco, aparador) */
function buildMetalon(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const s = 0.03;
  const tt = 0.03;
  const legH = Math.max(0.2, h - tt);
  const inset = 0.01;
  const frame = new THREE.Group();

  const tube = (x, y, z, sx, sy, sz, rz = 0) => {
    const m = new THREE.Mesh(boxGeo(sx, sy, sz), metalMat);
    m.position.set(x, y, z);
    m.rotation.z = rz;
    m.userData.nonPaintable = true;
    frame.add(m);
  };

  const lx = w / 2 - s / 2 - inset;
  const lz = d / 2 - s / 2 - inset;
  [-1, 1].forEach((ix) => [-1, 1].forEach((iz) => tube(ix * lx, legH / 2, iz * lz, s, legH, s)));
  if (spec.legs6) [-1, 1].forEach((iz) => tube(0, legH / 2, iz * lz, s, legH, s));

  const levels = spec.levels || 0;
  const ys = [];
  for (let i = 1; i <= levels; i++) ys.push((legH * i) / (levels + 1));
  ys.push(legH);

  const rw = w - 2 * inset - 2 * s;
  const rd = d - 2 * inset - 2 * s;
  ys.forEach((y) => {
    [-1, 1].forEach((k) => {
      tube(0, y - s / 2, k * lz, rw, s, s);
      tube(k * lx, y - s / 2, 0, s, s, rd);
    });
  });

  if (spec.brace === 'H') {
    [-1, 1].forEach((k) => tube(k * lx, legH * 0.22, 0, s, s, rd));
  }
  if (spec.brace === 'X') {
    const len = Math.hypot(rw, Math.max(0.1, legH - 0.1));
    const ang = Math.atan2(Math.max(0.1, legH - 0.1), rw);
    [-1, 1].forEach((k) => tube(0, legH / 2, -lz, len, s, s, k * ang));
  }

  registerPart(frame, { x: 0, y: -0.2, z: 0 }, {
    name: 'Estrutura Metalon 30×30',
    dimsCm: { w: spec.wCm, h: Math.max(3, spec.hCm - 3), d: spec.dCm },
    paintable: false
  });

  ys.forEach((y, i) => {
    const top = i === ys.length - 1;
    const slab = new THREE.Mesh(
      boxGeo(top ? w : w - 0.01, tt, top ? d : d - 0.01),
      createPartWoodMaterial(true)
    );
    slab.position.set(0, y + tt / 2, 0);
    registerPart(slab, { x: 0, y: 0.25 + i * 0.12, z: 0.3 }, {
      name: top ? 'Tampo' : `Prateleira ${i + 1}`,
      dimsCm: { w: top ? spec.wCm : spec.wCm - 1, h: 3, d: top ? spec.dCm : spec.dCm - 1 }
    });
  });

  if (spec.back) {
    const bk = new THREE.Mesh(boxGeo(w - 0.02, Math.max(0.1, legH - 0.04), 0.012), createPartWoodMaterial(false));
    bk.position.set(0, legH / 2, -lz - s / 2 - 0.006);
    registerPart(bk, { x: 0, y: 0.1, z: -0.4 }, {
      name: 'Fundo',
      dimsCm: { w: spec.wCm - 2, h: Math.max(3, spec.hCm - 7), d: 1.2 }
    });
  }

  if (spec.drawer) {
    const dw = rw * 0.55;
    const g = new THREE.Group();
    g.position.set(0, legH - 0.1, lz + s / 2 + 0.011);
    g.add(new THREE.Mesh(boxGeo(dw, 0.14, 0.022), createPartWoodMaterial(false)));
    const hd = new THREE.Mesh(boxGeo(0.12, 0.012, 0.02), chromeMat);
    hd.position.z = 0.02;
    hd.userData.nonPaintable = true;
    g.add(hd);
    const bx = new THREE.Mesh(boxGeo(dw - 0.05, 0.1, Math.max(0.08, rd - 0.04)), createPartWoodMaterial(false));
    bx.position.set(0, -0.01, -Math.max(0.08, rd - 0.04) / 2 - 0.011);
    g.add(bx);
    const p = registerPart(g, { x: 0, y: 0.2, z: 0.45 }, {
      name: 'Gaveta 1',
      dimsCm: { w: Math.round(dw * 100), h: 14, d: Math.round(rd * 100) }
    });
    registerOpenable(p, { openOffset: new THREE.Vector3(0, 0, 0.26) });
  }
}

/* CONSTRUTOR 8: CÔMODA / GAVETEIRO */
function buildChest(spec) {
  clearFurniture();
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const plinthH = 0.07;
  const bodyH = Math.max(0.25, h - plinthH);
  const levels = Math.max(2, spec.levels || 4);

  const plinthBox = new THREE.Mesh(boxGeo(w - 0.03, plinthH, d - 0.04), createPartWoodMaterial(true));
  plinthBox.position.set(0, plinthH / 2, -0.01);
  registerPart(plinthBox, { x: 0, y: -0.25, z: 0 }, {
    name: 'Rodapé Base',
    dimsCm: { w: spec.wCm - 3, h: 7, d: spec.dCm - 4 }
  });

  const bottom = new THREE.Mesh(boxGeo(w, t, d), createPartWoodMaterial(true));
  bottom.position.set(0, plinthH + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.15, z: 0.25 }, {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });

  const top = new THREE.Mesh(boxGeo(w, t, d + 0.02), createPartWoodMaterial(true));
  top.position.set(0, plinthH + bodyH - t / 2, 0.01);
  registerPart(top, { x: 0, y: 0.55, z: 0 }, {
    name: 'Tampo Superior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm + 2 }
  });

  [-w / 2 + t / 2, w / 2 - t / 2].forEach((sx, idx) => {
    const side = new THREE.Mesh(boxGeo(t, bodyH - t * 2, d), createPartWoodMaterial(false));
    side.position.set(sx, plinthH + bodyH / 2, 0);
    registerPart(side, { x: idx === 0 ? -0.45 : 0.45, y: 0.1, z: 0 }, {
      name: idx === 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
      dimsCm: { w: 2.2, h: Math.round((bodyH - t * 2) * 100), d: spec.dCm }
    });
  });

  const availH = bodyH - t * 2 - 0.012;
  const drawerH = availH / levels;
  const drawerW = w - t * 2 - 0.008;

  for (let i = 0; i < levels; i++) {
    const dg = new THREE.Group();
    const gy = plinthH + t + drawerH * (i + 0.5) + i * 0.003;
    dg.position.set(0, gy, d / 2 - t / 2 + 0.002);

    const dMat = createPartWoodMaterial(false);
    dg.add(new THREE.Mesh(boxGeo(drawerW, drawerH - 0.004, t), dMat));

    const handle = new THREE.Mesh(boxGeo(0.14, 0.012, 0.02), chromeMat);
    handle.position.set(0, drawerH * 0.18, 0.018);
    handle.userData.nonPaintable = true;
    dg.add(handle);

    const boxDepth = Math.max(0.12, d - 0.08);
    const inner = new THREE.Mesh(boxGeo(drawerW - 0.04, drawerH * 0.65, boxDepth), dMat);
    inner.position.set(0, -0.01, -boxDepth / 2 - t / 2);
    dg.add(inner);

    const pInfo = registerPart(dg, { x: 0, y: 0.04 * i, z: 0.55 + i * 0.08 }, {
      name: `Gaveta ${levels - i}`,
      dimsCm: { w: Math.round(drawerW * 100), h: Math.round(drawerH * 100), d: Math.round(boxDepth * 100) }
    });
    registerOpenable(pInfo, {
      openOffset: new THREE.Vector3(0, 0, 0.24 - i * 0.03)
    });
  }
}

/* CONSTRUTOR 7B: MÓDULO PARAMÉTRICO (DNA do catálogo): colunas x células */
function buildModular(spec) {
  clearFurniture();
  const { base, top, cols } = parseDna(spec.dna);
  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const t = 0.022;
  const baseH = base === 'r' ? 0.08 : base === 'p' ? 0.12 : 0;
  const topT = top === 'p' ? 0.036 : top === 't' ? 0.03 : t;
  const over = top === 'n' ? 0 : 0.02;
  const bodyH = Math.max(0.2, h - baseH - topT);
  const cm = (v) => Math.round(v * 100);

  const mk = (sx, sy, sz, x, y, z, rot = false, mat = null) => {
    const m = new THREE.Mesh(boxGeo(sx, sy, sz), mat || createPartWoodMaterial(rot));
    m.position.set(x, y, z);
    return m;
  };
  const ex = (x, y) => ({ x: x * 0.5, y: (y - h / 2) * 0.35, z: 0.2 + Math.abs(x) * 0.15 });
  const handle = (parent, x, y, z, vertical = true) => {
    const m = new THREE.Mesh(boxGeo(vertical ? 0.012 : 0.1, vertical ? 0.1 : 0.012, 0.02), chromeMat);
    m.position.set(x, y, z);
    m.userData.nonPaintable = true;
    parent.add(m);
  };

  registerPart(mk(w, t, d, 0, baseH + t / 2, 0, true), ex(0, 0), {
    name: 'Base Inferior',
    dimsCm: { w: spec.wCm, h: 2.2, d: spec.dCm }
  });
  registerPart(
    mk(w + 2 * over, topT, d + over, 0, h - topT / 2, over / 2, true, top === 'p' ? createStonePartMaterial() : null),
    { x: 0, y: 0.55, z: 0 },
    {
      name: 'Tampo Superior',
      dimsCm: { w: Math.round((w + 2 * over) * 100), h: Math.round(topT * 100), d: Math.round((d + over) * 100) },
      paintable: top !== 'p'
    }
  );
  [-1, 1].forEach((k) => {
    registerPart(
      mk(t, Math.max(0.05, bodyH - t), d, k * (w / 2 - t / 2), baseH + t + Math.max(0.05, bodyH - t) / 2, 0),
      ex(k * w / 2, h / 2),
      {
        name: k < 0 ? 'Parede Lateral Esquerda' : 'Parede Lateral Direita',
        dimsCm: { w: 2.2, h: cm(Math.max(0.05, bodyH - t)), d: spec.dCm }
      }
    );
  });
  registerPart(
    mk(Math.max(0.05, w - 2 * t), Math.max(0.05, bodyH - t), 0.006, 0, baseH + t + Math.max(0.05, bodyH - t) / 2, -d / 2 + 0.003),
    { x: 0, y: 0, z: -0.45 },
    {
      name: 'Fundo',
      dimsCm: { w: cm(Math.max(0.05, w - 2 * t)), h: cm(Math.max(0.05, bodyH - t)), d: 0.6 }
    }
  );
  if (base === 'r') {
    registerPart(mk(w - 0.04, baseH, d - 0.06, 0, baseH / 2, -0.01), { x: 0, y: -0.25, z: 0 }, {
      name: 'Rodapé Base',
      dimsCm: { w: spec.wCm - 4, h: 8, d: spec.dCm - 6 }
    });
  }
  if (base === 'p') {
    const fg = new THREE.Group();
    [-1, 1].forEach((ix) => [-1, 1].forEach((iz) => {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, baseH, 16), createPartWoodMaterial(false));
      f.position.set(ix * (w / 2 - 0.06), baseH / 2, iz * (d / 2 - 0.06));
      fg.add(f);
    }));
    registerPart(fg, { x: 0, y: -0.25, z: 0 }, {
      name: 'Pés (4)',
      dimsCm: { w: 4.4, h: 12, d: 4.4 }
    });
  }

  const n = cols.length;
  const sumW = cols.reduce((a, c) => a + c.w, 0) || 1;
  const innerW = Math.max(0.1, w - (n + 1) * t);
  const yTop0 = h - topT;
  const yBot0 = baseH + t;
  const cnt = { P: 0, G: 0, C: 0, B: 0, R: 0, T: 0 };
  let cursor = -w / 2 + t;

  cols.forEach((c, i) => {
    const cw = (c.w / sumW) * innerW;
    const cx = cursor + cw / 2;
    const z0 = d / 2 + t / 2 + 0.001;
    const m = c.cells.length;
    const sumH = c.cells.reduce((a, k) => a + k.h, 0) || 1;
    const avail = Math.max(0.08, yTop0 - yBot0 - (m - 1) * t);
    let y = yTop0;

    c.cells.forEach((k, j) => {
      const ch = (k.h / sumH) * avail;
      const cyc = y - ch / 2;
      const fh = Math.max(0.02, ch - 0.004);

      if (k.t === 'P') {
        const leaves = cw > 0.62 ? 2 : 1;
        for (let li = 0; li < leaves; li++) {
          const left = leaves === 2 ? li === 0 : i % 2 === 0;
          const lw = leaves === 2 ? cw / 2 - 0.003 : cw - 0.004;
          const pv = new THREE.Group();
          pv.position.set(left ? cx - cw / 2 + 0.002 : cx + cw / 2 - 0.002, cyc, z0);
          const pn = new THREE.Mesh(boxGeo(lw, fh, t), createPartWoodMaterial(false));
          pn.position.x = left ? lw / 2 : -lw / 2;
          pv.add(pn);
          handle(pv, left ? lw - 0.03 : -lw + 0.03, 0, t / 2 + 0.008);
          const p = registerPart(pv, ex(cx, cyc), {
            name: `Porta ${++cnt.P}`,
            dimsCm: { w: cm(lw), h: cm(fh), d: 2.2 }
          });
          registerOpenable(p, { openRotY: left ? -Math.PI * 0.54 : Math.PI * 0.54 });
        }
      } else if (k.t === 'G') {
        const g = new THREE.Group();
        g.position.set(cx, cyc, z0);
        g.add(new THREE.Mesh(boxGeo(cw - 0.004, fh, t), createPartWoodMaterial(false)));
        handle(g, 0, 0, t / 2 + 0.008, false);
        const boxD = Math.max(0.08, d - 0.08);
        const bx = new THREE.Mesh(boxGeo(Math.max(0.04, cw - 0.05), fh * 0.7, boxD), createPartWoodMaterial(false));
        bx.position.set(0, -0.01, -boxD / 2 - t / 2);
        g.add(bx);
        const p = registerPart(g, ex(cx, cyc), {
          name: `Gaveta ${++cnt.G}`,
          dimsCm: { w: cm(cw - 0.004), h: cm(fh), d: Math.max(4, spec.dCm - 4) }
        });
        registerOpenable(p, { openOffset: new THREE.Vector3(0, 0, 0.26) });
      } else if (k.t === 'L') {
        hasLedFeature = true;
        ledStripMat.color.setHex(0xffd27d);
        ledStripMat.emissive.setHex(0xffa733);
        registerPart(
          mk(Math.max(0.04, cw - 0.03), 0.01, 0.012, cx, y - 0.012, d / 2 - 0.03, false, ledStripMat),
          { x: 0, y: 0.3, z: 0.25 },
          { name: 'Perfil LED', dimsCm: { w: cm(Math.max(0.04, cw - 0.03)), h: 1, d: 1.2 }, paintable: false }
        );
        if (!ledLight) {
          ledLight = new THREE.PointLight(0xffb84d, 0, 2.4, 1.6);
          ledLight.position.set(0, h * 0.6, d / 2 + 0.2);
          furnitureRoot.add(ledLight);
        }
      } else if (k.t === 'C') {
        const dir = (i + j) % 2 === 0 ? 1 : -1;
        const lw = cw * 0.54;
        const m2 = mk(lw, fh, 0.018, cx - dir * cw * 0.23, cyc, z0 + (dir > 0 ? 0 : 0.02));
        const p = registerPart(m2, ex(cx, cyc), {
          name: `Porta de Correr ${++cnt.C}`,
          dimsCm: { w: cm(lw), h: cm(fh), d: 1.8 }
        });
        registerOpenable(p, { openOffset: new THREE.Vector3(dir * cw * 0.46, 0, 0) });
      } else if (k.t === 'B') {
        const pv = new THREE.Group();
        pv.position.set(cx, y - 0.002, z0);
        const pn = new THREE.Mesh(boxGeo(cw - 0.004, fh, t), createPartWoodMaterial(false));
        pn.position.y = -fh / 2;
        pv.add(pn);
        handle(pv, 0, -fh + 0.04, t / 2 + 0.008, false);
        const p = registerPart(pv, ex(cx, cyc), {
          name: `Porta Basculante ${++cnt.B}`,
          dimsCm: { w: cm(cw - 0.004), h: cm(fh), d: 2.2 }
        });
        registerOpenable(p, { openRotX: -Math.PI * 0.45 });
      } else if (k.t === 'R') {
        const ns = Math.max(4, Math.round(cw / 0.032));
        const g = new THREE.Group();
        const sm = createPartWoodMaterial(false);
        g.position.set(cx, cyc, z0);
        for (let q = 0; q < ns; q++) {
          const sl = new THREE.Mesh(boxGeo(0.02, fh, 0.018), sm);
          sl.position.x = -cw / 2 + 0.01 + q * ((cw - 0.02) / (ns - 1));
          g.add(sl);
        }
        registerPart(g, ex(cx, cyc), {
          name: `Painel Ripado (${ns} ripas)`,
          dimsCm: { w: cm(cw), h: cm(fh), d: 1.8 }
        });
      }

      y -= ch;
      if (j < m - 1) {
        registerPart(
          mk(cw, t, Math.max(0.05, d - 0.012), cx, y - t / 2, -0.006, true),
          ex(cx, y),
          { name: `Travessa Fixa ${++cnt.T}`, dimsCm: { w: cm(cw), h: 2.2, d: Math.max(2, spec.dCm - 1.2) } }
        );
        y -= t;
      }
    });

    cursor += cw;
    if (i < n - 1) {
      registerPart(
        mk(t, Math.max(0.04, yTop0 - yBot0), Math.max(0.05, d - 0.012), cursor + t / 2, (yTop0 + yBot0) / 2, -0.006),
        ex(cursor, h / 2),
        { name: `Divisória ${i + 1}`, dimsCm: { w: 2.2, h: cm(Math.max(0.04, yTop0 - yBot0)), d: Math.max(2, spec.dCm - 1.2) } }
      );
    }
    cursor += t;
  });
}

/* CONSTRUTOR 9: PROJETO DO MODO EDITOR (lista de peças em cm) */
function cfgFor(c) {
  return FINISHES[c] || PAINT_BUCKETS.find((b) => b.id === c) || FINISHES[currentFinish] || Object.values(FINISHES)[0];
}

function buildCustom(spec) {
  clearFurniture();
  const cy = spec.hCm / 2;
  (spec.parts || []).forEach((q) => {
    const w = q.w / 100;
    const h = q.h / 100;
    const d = q.d / 100;
    const pos = new THREE.Vector3(q.x / 100, q.y / 100, q.z / 100);
    const metal = q.c === 'metal';
    const stone = q.c === 'stone';
    const acc = isAcc(q.c);
    const fixed = metal || stone || acc;
    const mat = metal
      ? metalMat
      : stone
        ? createStonePartMaterial()
        : acc
          ? accMaterial(q.c)
          : createPartWoodMaterial(h < w && h < d, cfgFor(q.c));
    const mesh = new THREE.Mesh(partGeometry(q), mat);
    if (fixed) mesh.userData.nonPaintable = true;

    const exOff = { x: pos.x * 0.5, y: (q.y - cy) * 0.0035, z: 0.2 + Math.abs(pos.x) * 0.15 };
    const dimsCm = { w: q.w, h: q.h, d: q.d };
    let info;

    if (q.t === 'porta') {
      const pv = new THREE.Group();
      pv.position.set(pos.x - w / 2, pos.y, pos.z);
      mesh.position.x = w / 2;
      pv.add(mesh);
      info = registerPart(pv, exOff, { name: q.n, dimsCm, paintable: !fixed });
      registerOpenable(info, { openRotY: -Math.PI * 0.54 });
    } else {
      mesh.position.copy(pos);
      if (q.r) mesh.rotation.set(...rotRad(q.r));
      info = registerPart(mesh, exOff, { name: q.n, dimsCm, paintable: !fixed });
      if (q.t === 'gaveta') registerOpenable(info, { openOffset: new THREE.Vector3(0, 0, 0.26) });
    }
    info.acc = q.acc || 0;

    const bucket = PAINT_BUCKETS.find((b2) => b2.id === q.c);
    if (bucket) {
      info.paintedBucketId = bucket.id;
      info.paintedColorName = bucket.short;
    }
  });
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
    color: 0xc86d51,
    transparent: true,
    opacity: 0.9
  });

  const points = [pStart, pEnd];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, lineMat);
  dimensionLinesGroup.add(line);

  [pStart, pEnd].forEach((pt) => {
    const tickGeo = new THREE.SphereGeometry(0.018, 10, 10);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x4a3525 });
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.copy(pt);
    dimensionLinesGroup.add(tick);
  });

  const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
  const el = document.createElement('div');
  el.className = 'dim-callout overall';
  el.textContent = labelText;
  const dimOverlay = document.getElementById('dimensionOverlay');
  if (dimOverlay) dimOverlay.appendChild(el);

  overallDimAnchors.push({ pos: mid, el });
}

function setupDetailedBlueprint(spec) {
  clearDimensionLines3D();
  const dimOverlay = document.getElementById('dimensionOverlay');
  if (dimOverlay) dimOverlay.innerHTML = '';

  const w = spec.wCm / 100;
  const h = spec.hCm / 100;
  const d = spec.dCm / 100;
  const margin = 0.24;

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

  const summaryList = document.getElementById('detailSummaryList');
  if (summaryList) summaryList.innerHTML = '';

  const totalBadge = document.getElementById('detailTotalBadge');
  if (totalBadge) {
    totalBadge.textContent = `${formatCmAndM(spec.wCm)} × ${formatCmAndM(spec.hCm)} × ${formatCmAndM(spec.dCm)}`;
  }

  animatedParts.forEach((part) => {
    if (!part.dimsCm) return;
    const dimsStr = formatDimsShort(part.dimsCm);
    const widthM = (part.dimsCm.w / 100).toFixed(2).replace('.', ',');
    const heightM = (part.dimsCm.h / 100).toFixed(2).replace('.', ',');

    if (summaryList) {
      const item = document.createElement('div');
      item.className = 'detail-part-item';
      item.innerHTML = `<strong>${part.name}</strong><span>${dimsStr} (${widthM}m × ${heightM}m)</span>`;
      summaryList.appendChild(item);
    }

    if (dimOverlay) {
      const tag = document.createElement('div');
      tag.className = 'dim-callout';
      tag.innerHTML = `${part.name}<small>${dimsStr}</small>`;
      dimOverlay.appendChild(tag);
      part.calloutEl = tag;
    }
  });

  renderBOM(spec);
  dimensionLinesGroup.visible = detailModeActive;
  if (dimOverlay) dimOverlay.classList.toggle('hidden', !detailModeActive);
}

function renderBOM(spec) {
  const el = document.getElementById('bomBox');
  if (!el) return;
  const bom = computeBOM(spec, animatedParts);
  el.innerHTML =
    `<div class="bom-head"><strong>Ferragens e parafusos</strong><span>${countScrews(bom)} parafusos/pinos no total</span></div>` +
    bom.map((b) => `<div class="bom-row"><b>${b.qty}×</b><span>${b.item}${b.note ? `<small>${b.note}</small>` : ''}</span></div>`).join('');
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
  if (!row) return;
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
  if (icon) {
    icon.style.backgroundColor = activePaintBucket.baseColor;
    icon.style.color =
      activePaintBucket.id === 'naval_white' || activePaintBucket.id === 'oat_paint' ? '#1D130E' : '#F4F2ED';
  }
  if (nameEl) {
    nameEl.textContent = activePaintBucket.name;
  }
  bristleMat.color.set(activePaintBucket.baseColor);
}

function applyPaintToPart(partInfo, bucketCfg, hitPoint = null) {
  if (!partInfo || !partInfo.paintable) return;

  partInfo.obj.traverse((child) => {
    if (child.isMesh && !child.userData.nonPaintable && child.material) {
      const mat = child.material;
      const { map, bumpMap } = createWoodTexturesFromConfig(bucketCfg);
      applyGrainRotation(map, Boolean(mat.userData.rotateGrain));
      applyGrainRotation(bumpMap, Boolean(mat.userData.rotateGrain));

      if (mat.map) mat.map.dispose();
      if (mat.bumpMap) mat.bumpMap.dispose();
      mat.map = map;
      mat.bumpMap = bumpMap;
      mat.roughness = bucketCfg.roughness;
      mat.metalness = bucketCfg.metalness;
      if (mat.emissive) mat.emissive.setHex(0x000000);
      mat.needsUpdate = true;
    }
  });

  partInfo.paintedColorName = bucketCfg.short;
  partInfo.paintedBucketId = bucketCfg.id;
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
    p.paintedBucketId = null;
  });
  updatePaintedSummary();
}

function updatePaintedSummary() {
  const painted = paintableParts.filter((p) => p.paintedColorName);
  const statusEl = document.getElementById('paintedStatusText');
  const notesInput = document.getElementById('projectNotes');

  if (statusEl) {
    if (painted.length === 0) {
      statusEl.textContent = 'Clique ou passe o pincel sobre cada porta, parede lateral, gaveta ou tampo para pintar.';
    } else {
      const summary = painted.map((p) => `${p.name}: ${p.paintedColorName}`).join(' · ');
      statusEl.textContent = `Pintado: ${summary}`;
    }
  }

  if (currentSpec && notesInput) {
    const baseSpecText = `Modelo: ${currentSpec.displayTitle} | Medidas: ${currentSpec.wCm}cm (L) × ${currentSpec.hCm}cm (A) × ${currentSpec.dCm}cm (P).`;
    const paintText =
      painted.length > 0
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
  color: 0xc86d51,
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
let isAROr360Active = false;

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

  if (spec.suggestedFinish && FINISHES[spec.suggestedFinish]) {
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
  if (spec.category === 'metalon') buildMetalon(spec);
  if (spec.category === 'comoda') buildChest(spec);
  if (spec.category === 'modular') buildModular(spec);
  if (spec.category === 'custom') buildCustom(spec);

  setupDetailedBlueprint(spec);
  addHardware(spec);

  if (doorsBtnText) {
    doorsBtnText.textContent = hasLedFeature ? 'Acender LED' : 'Abrir portas';
  }
  if (doorsBtn) {
    doorsBtn.style.display = spec.category === 'metalon' && !spec.drawer ? 'none' : '';
  }
  frameCameraToModel(spec.wCm / 100, spec.hCm / 100);

  const originTag =
    (spec.isAutoImagined ? ' · Medidas sugeridas pelo site' : '') +
    (spec.fallback ? ' · Não identifiquei o tipo de móvel: use o Modo Editor para personalizar' : '');

  const doorsInfo =
    spec.category === 'balcao_ripado'
      ? `Ripado + LED ${(spec.opts && spec.opts.led) || 'quente'}${spec.opts && spec.opts.divider ? ` + ${spec.opts.divider} divisória(s)` : ''}${spec.opts && spec.opts.backShelves ? ` + ${spec.opts.backShelves} prateleiras atrás (gire o 3D)` : ''}`
      : spec.category === 'estante'
        ? 'Nichos sob medida'
        : spec.category === 'modular' || spec.category === 'custom'
          ? `${animatedParts.length} peças`
          : spec.category === 'metalon'
            ? 'Estrutura Metalon 30×30'
            : spec.category === 'comoda'
              ? `${spec.levels} gavetas`
              : `${spec.doorCount} portas`;

  if (generatedSpecsEl) {
    generatedSpecsEl.innerHTML = `Projeto ativo: <strong>${spec.displayTitle}</strong> · ${formatCmAndM(spec.wCm)} × ${formatCmAndM(spec.hCm)} · ${doorsInfo}${originTag}`;
  }

  const projectTypeInput = document.getElementById('projectType');
  if (projectTypeInput) {
    projectTypeInput.value = `${spec.displayTitle} (${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm)`;
  }
  updatePaintedSummary();

  if (detailModeActive) {
    isAutoBuilding = false;
    targetAssembly = 0.28;
    if (explodeRange) explodeRange.value = 72;
    if (assemblyStatus) assemblyStatus.textContent = 'Modo Detalhado';
  } else {
    triggerFullAssembly();
  }
}

function runCreator(overridePrompt = null) {
  const promptInput = document.getElementById('customPrompt');
  const textToUse = overridePrompt !== null ? overridePrompt : (promptInput ? promptInput.value : '');

  const dimW = document.getElementById('dimWidth');
  const dimH = document.getElementById('dimHeight');
  const dimD = document.getElementById('dimDepth');

  const manualDims = {
    w: dimW ? parseFloat(dimW.value) : NaN,
    h: dimH ? parseFloat(dimH.value) : NaN,
    d: dimD ? parseFloat(dimD.value) : NaN
  };

  const spec = parseFurnitureRequest(textToUse, manualDims);
  buildFromSpec(spec);
}

function triggerFullAssembly() {
  assemblyProgress = 0;
  targetAssembly = 1;
  isAutoBuilding = true;
  if (explodeRange) explodeRange.value = 0;
  if (assemblyStatus) assemblyStatus.textContent = 'Montando...';
  updateStepChips(1);
}

function updateStepChips(stageVal) {
  document.querySelectorAll('.step-chip').forEach((chip) => {
    chip.classList.toggle('active', Number(chip.dataset.stage) === stageVal);
  });
}

function applyFinish(finishKey) {
  const cfg = FINISHES[finishKey];
  if (!cfg) return;
  currentFinish = finishKey;
  if (finishLabel) finishLabel.textContent = cfg.name;

  const finishSelect = document.getElementById('finishChoice');
  if (finishSelect) {
    finishSelect.value = cfg.labelSelect;
  }

  partMaterials.forEach((mat) => {
    if (mat.userData.isStone) return;
    const { map, bumpMap } = createWoodTexturesFromConfig(cfg);
    applyGrainRotation(map, Boolean(mat.userData.rotateGrain));
    applyGrainRotation(bumpMap, Boolean(mat.userData.rotateGrain));

    if (mat.map) mat.map.dispose();
    if (mat.bumpMap) mat.bumpMap.dispose();
    mat.map = map;
    mat.bumpMap = bumpMap;
    mat.roughness = cfg.roughness;
    mat.metalness = cfg.metalness;
    mat.needsUpdate = true;
  });
}

function syncPartsTransformsImmediate() {
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

    if (part.openable && assemblyProgress > 0.85) {
      const op = part.openable.currentProgress;
      px += part.openable.openOffset.x * op;
      py += part.openable.openOffset.y * op;
      pz += part.openable.openOffset.z * op;
      ry += part.openable.openRotY * op;
      rx += part.openable.openRotX * op;
    }

    part.obj.position.set(px, py, pz);
    part.obj.rotation.set(rx, ry, rz);
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

if (painterModeBtn) {
  painterModeBtn.addEventListener('click', () => {
    painterModeActive = !painterModeActive;
    painterModeBtn.classList.toggle('active', painterModeActive);
    painterModeBtn.setAttribute('aria-pressed', String(painterModeActive));
    if (painterPanel) painterPanel.classList.toggle('hidden', !painterModeActive);
    container.classList.toggle('painter-cursor', painterModeActive);

    if (!painterModeActive) {
      brush3D.visible = false;
      if (painterTooltip) painterTooltip.classList.add('hidden');
      setHoveredPaintPart(null);
      if (stageHint) stageHint.textContent = 'Arraste para girar · Clique na porta para abrir';
    } else if (stageHint) {
      stageHint.textContent = 'Modo Pintor: clique nas portas ou paredes para pintar';
    }
  });
}

if (detailModeBtn) {
  detailModeBtn.addEventListener('click', () => {
    detailModeActive = !detailModeActive;
    detailModeBtn.classList.toggle('active', detailModeActive);
    detailModeBtn.setAttribute('aria-pressed', String(detailModeActive));
    if (detailPanel) detailPanel.classList.toggle('hidden', !detailModeActive);

    dimensionLinesGroup.visible = detailModeActive;
    setHardwareVisible(detailModeActive);
    const dimOverlay = document.getElementById('dimensionOverlay');
    if (dimOverlay) dimOverlay.classList.toggle('hidden', !detailModeActive);

    isAutoBuilding = false;
    if (detailModeActive) {
      targetAssembly = 0.28;
      if (explodeRange) explodeRange.value = 72;
      if (assemblyStatus) assemblyStatus.textContent = 'Expandido (cm / m)';
      updateStepChips(0.35);
    } else {
      targetAssembly = 1;
      if (explodeRange) explodeRange.value = 0;
      if (assemblyStatus) assemblyStatus.textContent = 'Montado';
      updateStepChips(1);
    }
  });
}

const toolBrushBtn = document.getElementById('toolBrushBtn');
const toolRollerBtn = document.getElementById('toolRollerBtn');
const clearPaintBtn = document.getElementById('clearPaintBtn');

if (toolBrushBtn) {
  toolBrushBtn.addEventListener('click', () => {
    activePainterTool = 'brush';
    toolBrushBtn.classList.add('active');
    if (toolRollerBtn) toolRollerBtn.classList.remove('active');
  });
}

if (toolRollerBtn) {
  toolRollerBtn.addEventListener('click', () => {
    activePainterTool = 'roller';
    toolRollerBtn.classList.add('active');
    if (toolBrushBtn) toolBrushBtn.classList.remove('active');
    paintAllPartsWithActiveBucket();
  });
}

if (clearPaintBtn) {
  clearPaintBtn.addEventListener('click', resetAllPaintedParts);
}

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

function updatePointerNDC(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const w = Math.max(rect.width, 1);
  const h = Math.max(rect.height, 1);
  pointerNDC.x = ((clientX - rect.left) / w) * 2 - 1;
  pointerNDC.y = -((clientY - rect.top) / h) * 2 + 1;
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

    if (painterTooltip) {
      painterTooltip.classList.remove('hidden');
      painterTooltip.style.left = `${local.localX}px`;
      painterTooltip.style.top = `${local.localY}px`;
      painterTooltip.textContent = `Pintar ${partRef.name} (${activePaintBucket.short})`;
    }

    if (isBrushingStroke) {
      applyPaintToPart(partRef, activePaintBucket, hitWithPart.point);
    }
  } else {
    setHoveredPaintPart(null);
    brush3D.visible = false;
    if (painterTooltip) painterTooltip.classList.add('hidden');
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
          if (explodeRange) explodeRange.value = 0;
        }
        ref.targetProgress = ref.targetProgress > 0.5 ? 0 : 1;
        const anyOpen = interactiveOpenables.some((item) => item.targetProgress > 0.5);
        doorsOpen = anyOpen;
        if (!hasLedFeature && doorsBtnText) {
          doorsBtnText.textContent = anyOpen ? 'Fechar portas' : 'Abrir portas';
        }
      }
    }
  }
});

function toggleDoorsOrLedAction() {
  if (hasLedFeature) {
    const isBright = ledStripMat.emissiveIntensity > 1.2;
    ledStripMat.emissiveIntensity = isBright ? 0.35 : 2.2;
    if (ledLight) ledLight.intensity = isBright ? 0.4 : 2.4;
    if (doorsBtnText) doorsBtnText.textContent = isBright ? 'Acender LED' : 'Suavizar LED';
    return;
  }

  if (targetAssembly < 0.95 || assemblyProgress < 0.95) {
    isAutoBuilding = false;
    targetAssembly = 1;
    assemblyProgress = 1;
    if (explodeRange) explodeRange.value = 0;
    if (assemblyStatus) assemblyStatus.textContent = 'Montado';
    if (detailModeActive) {
      detailModeActive = false;
      if (detailModeBtn) detailModeBtn.classList.remove('active');
      if (detailPanel) detailPanel.classList.add('hidden');
      dimensionLinesGroup.visible = false;
      setHardwareVisible(false);
      const dimOverlay = document.getElementById('dimensionOverlay');
      if (dimOverlay) dimOverlay.classList.add('hidden');
    }
  }

  doorsOpen = !doorsOpen;
  interactiveOpenables.forEach((item) => {
    item.targetProgress = doorsOpen ? 1 : 0;
  });
  if (doorsBtnText) {
    doorsBtnText.textContent = doorsOpen ? 'Fechar portas' : 'Abrir portas';
  }
}

if (doorsBtn) {
  doorsBtn.addEventListener('click', toggleDoorsOrLedAction);
}

const generateFurnitureBtn = document.getElementById('generateFurnitureBtn');
if (generateFurnitureBtn) {
  generateFurnitureBtn.addEventListener('click', () => runCreator());
}

const customPromptEl = document.getElementById('customPrompt');
if (customPromptEl) {
  customPromptEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runCreator();
    }
  });
}

function clearManualDimInputs() {
  const wEl = document.getElementById('dimWidth');
  const hEl = document.getElementById('dimHeight');
  const dEl = document.getElementById('dimDepth');
  if (wEl) wEl.value = '';
  if (hEl) hEl.value = '';
  if (dEl) dEl.value = '';
}

document.querySelectorAll('.idea-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const idea = chip.dataset.idea;
    if (customPromptEl) customPromptEl.value = idea;
    clearManualDimInputs();
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

const surpriseBtn = document.getElementById('surpriseFurnitureBtn');
if (surpriseBtn) {
  surpriseBtn.addEventListener('click', () => {
    const chosen = SURPRISE_PROMPTS[surpriseIndex % SURPRISE_PROMPTS.length];
    surpriseIndex += 1;
    if (customPromptEl) customPromptEl.value = chosen;
    clearManualDimInputs();
    runCreator(chosen);
  });
}

document.querySelectorAll('.work-card[data-preset-prompt]').forEach((card) => {
  card.addEventListener('click', () => {
    const preset = card.dataset.presetPrompt;
    if (customPromptEl) customPromptEl.value = preset;
    clearManualDimInputs();
    runCreator(preset);
    const inicio = document.getElementById('inicio');
    if (inicio) inicio.scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelectorAll('.swatch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    applyFinish(btn.dataset.finish);
  });
});

const replayBtn = document.getElementById('replayBtn');
if (replayBtn) replayBtn.addEventListener('click', triggerFullAssembly);

const animateBuildBtn = document.getElementById('animateBuildBtn');
if (animateBuildBtn) animateBuildBtn.addEventListener('click', triggerFullAssembly);

document.querySelectorAll('.step-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const stage = Number(chip.dataset.stage);
    isAutoBuilding = false;
    targetAssembly = stage;
    if (explodeRange) explodeRange.value = Math.round((1 - stage) * 100);
    if (assemblyStatus) assemblyStatus.textContent = stage < 1 ? 'Estrutura' : 'Montado';
    updateStepChips(stage);
  });
});

if (explodeRange) {
  explodeRange.addEventListener('input', (e) => {
    isAutoBuilding = false;
    const explodeRatio = Number(e.target.value) / 100;
    targetAssembly = 1 - explodeRatio;
    if (assemblyStatus) {
      assemblyStatus.textContent = explodeRatio > 0.05 ? 'Vista explodida' : 'Montado';
    }
  });
}

/* ==========================================================================
   11. LOOP PRINCIPAL DE ANIMAÇÃO (60 FPS)
   ========================================================================== */
const clock = new THREE.Clock();

let rafId = 0;
let stageVisible = true;
new IntersectionObserver(([e]) => {
  stageVisible = e.isIntersecting;
  if ((stageVisible || isAROr360Active) && !rafId) {
    clock.getDelta();
    animate();
  }
}).observe(container);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && (stageVisible || isAROr360Active) && !rafId) {
    clock.getDelta();
    animate();
  }
});

function animate() {
  if ((!stageVisible && !isAROr360Active) || document.hidden) {
    rafId = 0;
    return;
  }
  rafId = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (isAutoBuilding) {
    assemblyProgress += delta * 0.45;
    if (assemblyProgress >= 1) {
      assemblyProgress = 1;
      isAutoBuilding = false;
      if (assemblyStatus) {
        assemblyStatus.textContent = detailModeActive ? 'Expandido (cm / m)' : 'Montado';
      }
    }
    if (explodeRange) explodeRange.value = Math.round((1 - assemblyProgress) * 100);
  } else {
    assemblyProgress += (targetAssembly - assemblyProgress) * Math.min(1, delta * 7.5);
  }

  interactiveOpenables.forEach((item) => {
    item.currentProgress += (item.targetProgress - item.currentProgress) * Math.min(1, delta * 8.5);
  });

  syncPartsTransformsImmediate();

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
      if (sp.mat) sp.mat.dispose();
      paintSplashes.splice(i, 1);
    }
  }

  if (hasLedFeature && ledLight) {
    const targetGlow = assemblyProgress > 0.78 ? 1.8 : 0;
    ledLight.intensity += (targetGlow - ledLight.intensity) * Math.min(1, delta * 4);
    ledStripMat.emissiveIntensity = ledLight.intensity;
    if (doorsBtnText) {
      doorsBtnText.textContent = ledLight.intensity > 1 ? 'Suavizar LED' : 'Acender LED';
    }
  }

  if (!isAROr360Active) {
    woodDust.rotation.y = elapsed * 0.04;
    furnitureRoot.position.y = Math.sin(elapsed * 1.1) * 0.004;

    controls.update();
    renderer.render(scene, camera);
    updateDetailedCalloutsProjection();
  }
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

/* ==========================================================================
   FERRAGENS NO 3D (aparecem só no Modo Detalhado, em "raio-X" cobre)
   ========================================================================== */
const hwMat = new THREE.MeshBasicMaterial({ color: 0xc86d51, depthTest: false, transparent: true, opacity: 0.95 });
const hwGeo = {
  screw: new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 10),
  cup: new THREE.CylinderGeometry(0.0175, 0.0175, 0.004, 20),
  plate: new THREE.BoxGeometry(0.045, 0.04, 0.004)
};
let hardwareMarks = [];

function clearHardwareMarks() {
  hardwareMarks.forEach((m) => {
    if (m.parent) m.parent.remove(m);
    if (m.geometry && m.geometry !== hwGeo.screw && m.geometry !== hwGeo.cup && m.geometry !== hwGeo.plate) {
      m.geometry.dispose();
    }
  });
  hardwareMarks = [];
}

function setHardwareVisible(v) {
  hardwareMarks.forEach((m) => {
    m.visible = v;
  });
}

function addHardware(spec) {
  clearHardwareMarks();
  furnitureRoot.updateMatrixWorld(true);

  const mk = (geo, parent, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, hwMat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.renderOrder = 10;
    m.visible = detailModeActive;
    m.raycast = () => {};
    parent.add(m);
    hardwareMarks.push(m);
  };

  const boxes = animatedParts.map((p) => ({ p, b: new THREE.Box3().setFromObject(p.obj) }));
  const v3 = new THREE.Vector3();

  const sides = boxes.filter((o) => /^(Parede Lateral|Lateral Aéreo)/.test(o.p.name));
  const horiz = boxes.filter(
    (o) =>
      /^(Base Inferior|Tampo Superior|Travessa|Prateleira Maleiro|Base Balcão|Base Armário Aéreo|Tampo Armário Aéreo)/.test(o.p.name) ||
      (spec.category === 'estante' && /^Prateleira/.test(o.p.name))
  );

  horiz.forEach((hz) => {
    const yC = (hz.b.min.y + hz.b.max.y) / 2;
    const depth = hz.b.max.z - hz.b.min.z;
    const n = Math.max(2, Math.ceil((depth * 100) / 25));
    sides.forEach((sd) => {
      const cx = (sd.b.min.x + sd.b.max.x) / 2;
      if (yC < sd.b.min.y - 0.01 || yC > sd.b.max.y + 0.01 || hz.b.min.x > cx + 0.05 || hz.b.max.x < cx - 0.05) return;
      const outer = cx < 0 ? sd.b.min.x : sd.b.max.x;
      for (let i = 0; i < n; i++) {
        v3.set(outer, yC, hz.b.min.z + 0.05 + (depth - 0.1) * (i / (n - 1)));
        sd.p.obj.worldToLocal(v3);
        mk(hwGeo.screw, sd.p.obj, v3.x, v3.y, v3.z, 0, 0, Math.PI / 2);
      }
    });
  });

  animatedParts.forEach((p) => {
    const first = p.obj.isMesh ? p.obj : p.obj.children.find((c) => c.isMesh);
    const gp = first && first.geometry && first.geometry.parameters;

    if (/^Porta/.test(p.name) && !/Correr|Basculante/.test(p.name) && gp) {
      const sign = Math.sign(first.position.x) || 1;
      const H = gp.height;
      const hn = H * 100 <= 100 ? 2 : H * 100 <= 160 ? 3 : H * 100 <= 200 ? 4 : 5;
      for (let i = 0; i < hn; i++) {
        const y = hn === 1 ? 0 : -H / 2 + 0.1 + (i * (H - 0.2)) / (hn - 1);
        mk(hwGeo.cup, p.obj, sign * 0.0225, y, -0.011, Math.PI / 2);
        mk(hwGeo.plate, p.obj, -sign * 0.02, y, -0.018);
      }
    }

    if (/Basculante/.test(p.name) && gp) {
      [-1, 1].forEach((k) => mk(hwGeo.cup, p.obj, k * (gp.width / 2 - 0.05), -0.015, -0.011, Math.PI / 2));
    }

    if (/^Gaveta/.test(p.name) && p.dimsCm) {
      const sl = [60, 55, 50, 45, 40, 35, 30, 25].find((v) => v <= p.dimsCm.d - 3) || 25;
      const wdt = p.dimsCm.w / 100;
      const railGeo = new THREE.BoxGeometry(0.012, 0.022, sl / 100);
      [-1, 1].forEach((k) => {
        mk(railGeo, p.obj, k * (wdt / 2 - 0.004), -0.02, -sl / 200);
        [0.1, 0.5, 0.9].forEach((f) => mk(hwGeo.screw, p.obj, k * (wdt / 2 - 0.004), -0.02, -(sl / 100) * f, 0, 0, Math.PI / 2));
      });
    }

    if (spec.category === 'metalon' && /^(Tampo|Prateleira \d)/.test(p.name) && gp) {
      [-1, 1].forEach((ix) => [-1, 1].forEach((iz) => mk(hwGeo.screw, p.obj, ix * (gp.width / 2 - 0.05), gp.height / 2 + 0.002, iz * (gp.depth / 2 - 0.05))));
    }
  });

  if (spec.category === 'metalon') {
    const fr = animatedParts.find((p) => /Estrutura Metalon/.test(p.name));
    if (fr) {
      fr.obj.children.forEach((t) => {
        if (t.geometry && t.geometry.parameters && t.geometry.parameters.height <= 0.031) {
          mk(
            hwGeo.screw,
            fr.obj,
            t.position.x + (t.geometry.parameters.width / 2 - 0.004) * (t.position.x > 0 ? 1 : -1),
            t.position.y,
            t.position.z,
            Math.PI / 2
          );
        }
      });
    }
  }
}

/* ==========================================================================
   MODO EDITOR: exportar peças do modelo atual, abrir editor.html e restaurar
   ========================================================================== */
function exportParts() {
  if (currentSpec.category === 'custom' && currentSpec.parts && currentSpec.parts.length === animatedParts.length) {
    return {
      name: currentSpec.displayTitle,
      finish: currentFinish,
      parts: currentSpec.parts.map((q, i) => ({ ...q, c: animatedParts[i].paintedBucketId || q.c }))
    };
  }
  animatedParts.forEach((p) => {
    p.obj.position.copy(p.targetPos);
    p.obj.rotation.copy(p.targetRot);
  });
  furnitureRoot.updateMatrixWorld(true);

  const raw = [];
  const c = new THREE.Vector3();
  const box = new THREE.Box3();
  const colorOf = (p, m) => p.paintedBucketId || (m && m.userData && m.userData.isStone ? 'stone' : null) || currentFinish;

  animatedParts.forEach((p) => {
    const typ = /^Porta/.test(p.name)
      ? 'porta'
      : /^Gaveta/.test(p.name)
        ? 'gaveta'
        : /Ripad/.test(p.name)
          ? 'ripado'
          : /^Pés/.test(p.name)
            ? 'pe'
            : 'painel';

    if (/Estrutura Metalon/.test(p.name)) {
      p.obj.children.forEach((m, i) => {
        if (hardwareMarks.includes(m) || !m.geometry || !m.geometry.parameters || !m.geometry.parameters.width) return;
        const g = m.geometry.parameters;
        m.getWorldPosition(c);
        raw.push({
          t: 'tubo',
          n: `Tubo Metalon ${i + 1}`,
          w: g.width * 100,
          h: g.height * 100,
          d: g.depth * 100,
          x: c.x * 100,
          y: c.y * 100,
          z: c.z * 100,
          c: 'metal'
        });
      });
      return;
    }

    const real = (m) => m.isMesh && !hardwareMarks.includes(m);
    const first =
      p.obj.isMesh
        ? p.obj
        : p.obj.children.find((m) => real(m) && !m.userData.nonPaintable) || p.obj.children.find(real);
    const g = first && first.geometry && first.geometry.parameters;
    const useBox = !g || !g.width || typ === 'ripado' || typ === 'pe';
    let sz;
    if (useBox) {
      box.setFromObject(p.obj);
      box.getCenter(c);
      sz = box.getSize(new THREE.Vector3());
    } else {
      first.getWorldPosition(c);
      sz = new THREE.Vector3(g.width, g.height, g.depth);
    }
    const isStone = Boolean(first && first.material && ((first.material.userData && first.material.userData.isStone) || (first.material.color && first.material.color.getHex() === 0xefe7da)));
    raw.push({
      t: typ,
      n: p.name,
      w: sz.x * 100,
      h: sz.y * 100,
      d: sz.z * 100,
      x: c.x * 100,
      y: c.y * 100,
      z: c.z * 100,
      c: isStone ? 'stone' : colorOf(p, first)
    });
  });

  if (!raw.length) {
    return { name: (currentSpec && currentSpec.displayTitle) || 'Projeto', finish: currentFinish, parts: [] };
  }

  const minX = Math.min(...raw.map((q) => q.x - q.w / 2));
  const maxX = Math.max(...raw.map((q) => q.x + q.w / 2));
  const minZ = Math.min(...raw.map((q) => q.z - q.d / 2));
  const maxZ = Math.max(...raw.map((q) => q.z + q.d / 2));
  const r1 = (v) => Math.round(v * 10) / 10;

  return {
    name: (currentSpec && currentSpec.displayTitle) || 'Projeto',
    finish: currentFinish,
    parts: raw.map((q) => ({
      ...q,
      w: r1(q.w),
      h: r1(q.h),
      d: r1(q.d),
      x: r1(q.x - (minX + maxX) / 2),
      y: r1(q.y),
      z: r1(q.z - (minZ + maxZ) / 2)
    }))
  };
}

function customSpecFrom(data) {
  const ps = data.parts || [];
  if (!ps.length) {
    return {
      category: 'custom',
      displayTitle: data.name || 'Projeto do Editor',
      parts: [],
      wCm: 100,
      hCm: 80,
      dCm: 50,
      doorCount: 0,
      hasShelf: true,
      hasDrawers: true,
      isAutoImagined: false,
      catalogId: 'editor',
      suggestedFinish: data.finish || null
    };
  }
  const W = Math.max(...ps.map((q) => q.x + q.w / 2)) - Math.min(...ps.map((q) => q.x - q.w / 2));
  const H = Math.max(...ps.map((q) => q.y + q.h / 2));
  const D = Math.max(...ps.map((q) => q.z + q.d / 2)) - Math.min(...ps.map((q) => q.z - q.d / 2));
  return {
    category: 'custom',
    displayTitle: data.name || 'Projeto do Editor',
    parts: ps,
    wCm: Math.max(10, Math.round(W)),
    hCm: Math.max(10, Math.round(H)),
    dCm: Math.max(10, Math.round(D)),
    doorCount: 0,
    hasShelf: true,
    hasDrawers: true,
    isAutoImagined: false,
    catalogId: 'editor',
    suggestedFinish: data.finish || null
  };
}

function openEditor() {
  try {
    localStorage.setItem('zf_project', JSON.stringify(exportParts()));
  } catch (e) {
    /* sem storage */
  }
  location.href = 'editor.html';
}

const openEditorBtn = document.getElementById('openEditorBtn');
if (openEditorBtn) {
  openEditorBtn.addEventListener('click', openEditor);
}

function restoreProject(data) {
  buildFromSpec(data.s);
  if (data.f && FINISHES[data.f]) {
    applyFinish(data.f);
    document.querySelectorAll('.swatch-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.finish === data.f);
    });
  }
  (data.p || []).forEach(([i, id]) => {
    const bucket = PAINT_BUCKETS.find((x) => x.id === id);
    if (bucket && animatedParts[i]) applyPaintToPart(animatedParts[i], bucket);
  });
}

let sharedProject = null;
try {
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) sharedProject = JSON.parse(decodeURIComponent(m[1]));
} catch (err) {
  sharedProject = null;
}

function readHashProject() {
  try {
    const mc = location.hash.match(/^#c=(.+)$/);
    if (mc) {
      const [name, ...rows] = mc[1].split('~');
      const parts = rows
        .filter(Boolean)
        .map((r) => {
          const f = r.split('_');
          const q = { t: f[0], n: decodeURIComponent(f[1] || ''), w: +f[2], h: +f[3], d: +f[4], x: +f[5], y: +f[6], z: +f[7], c: f[8] };
          if (f[9]) q.s = f[9];
          if (f[10]) q.r = f[10].split('.').map(Number);
          if (f[11]) q.acc = +f[11];
          return q;
        });
      return { kind: 'custom', data: { name: decodeURIComponent(name || 'Projeto'), parts } };
    }
    if (location.hash === '#edit') {
      const data = JSON.parse(localStorage.getItem('zf_project') || 'null');
      if (data && data.parts) {
        history.replaceState(null, '', location.pathname);
        return { kind: 'custom', data, fromEditor: true };
      }
    }
  } catch (err) {
    /* ignora */
  }
  return null;
}

const hashProject = readHashProject();

if (hashProject) {
  buildFromSpec(customSpecFrom(hashProject.data));
  if (!hashProject.fromEditor && detailModeBtn) detailModeBtn.click();
} else if (sharedProject && sharedProject.s) {
  restoreProject(sharedProject);
  if (detailModeBtn) detailModeBtn.click();
} else {
  runCreator('Quero criar um armário de pia com 2 portas e prateleira interna');
}
animate();

/* ==========================================================================
   12. CÂMERA EM TAMANHO REAL (AR), IMAGEM 360° INTERATIVA & FORMULÁRIO
   ========================================================================== */
const arAnd360 = initARAnd360({
  THREE,
  scene,
  camera,
  renderer,
  controls,
  furnitureRoot,
  plinth,
  woodDust,
  dimensionLinesGroup,
  getCurrentSpec: () => currentSpec,
  getCurrentFinish: () => currentFinish,
  getAnimatedParts: () => animatedParts,
  getFinishLabel: () => (FINISHES[currentFinish] ? FINISHES[currentFinish].labelSelect : currentFinish),
  toggleDoorsOrLed: toggleDoorsOrLedAction,
  onBeforeCapture: () => {
    isAROr360Active = true;
    brush3D.visible = false;
    if (painterTooltip) painterTooltip.classList.add('hidden');
    setHoveredPaintPart(null);

    if (isAutoBuilding || assemblyProgress < 0.99) {
      isAutoBuilding = false;
      assemblyProgress = 1;
      targetAssembly = 1;
      if (explodeRange) explodeRange.value = 0;
      if (assemblyStatus) assemblyStatus.textContent = 'Montado';
    }
    syncPartsTransformsImmediate();

    const dimOverlay = document.getElementById('dimensionOverlay');
    if (dimOverlay) dimOverlay.classList.add('hidden');
    setHardwareVisible(false);

    if (!rafId) {
      clock.getDelta();
      animate();
    }
  },
  onAfterCapture: () => {
    isAROr360Active = false;
    const dimOverlay = document.getElementById('dimensionOverlay');
    if (dimOverlay) dimOverlay.classList.toggle('hidden', !detailModeActive);
    dimensionLinesGroup.visible = detailModeActive;
    setHardwareVisible(detailModeActive);
  }
});

const arCameraBtn = document.getElementById('arCameraBtn');
if (arCameraBtn) {
  arCameraBtn.addEventListener('click', () => {
    arAnd360.openARMode();
  });
}

const stageSave360Btn = document.getElementById('stageSave360Btn');
if (stageSave360Btn) {
  stageSave360Btn.addEventListener('click', () => {
    arAnd360.open360Studio();
  });
}

const saveImageBtn = document.getElementById('saveImageBtn');
if (saveImageBtn) {
  saveImageBtn.addEventListener('click', () => {
    arAnd360.open360Studio();
  });
}

const menuToggle = document.getElementById('menuToggle');
const mobileDrawer = document.getElementById('mobileDrawer');

if (menuToggle && mobileDrawer) {
  menuToggle.addEventListener('click', () => {
    mobileDrawer.classList.toggle('open');
  });
}

document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => {
    if (mobileDrawer) mobileDrawer.classList.remove('open');
  });
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

const WHATS_NUMBER = '5521982814880';

function encodeProject() {
  if (!currentSpec) return '';
  if (currentSpec.category === 'custom') {
    return (
      'c=' +
      encodeURIComponent(currentSpec.displayTitle) +
      '~' +
      (currentSpec.parts || [])
        .map((q) => [q.t, encodeURIComponent(q.n), q.w, q.h, q.d, q.x, q.y, q.z, q.c, q.s || '', q.r ? q.r.join('.') : '', q.acc || ''].join('_'))
        .join('~')
    );
  }
  const paints = [];
  animatedParts.forEach((p, i) => {
    if (p.paintedBucketId) paints.push([i, p.paintedBucketId]);
  });
  return encodeURIComponent(JSON.stringify({ s: currentSpec, f: currentFinish, p: paints }));
}

function buildWhatsMessage(name, notes) {
  const sp = currentSpec || { displayTitle: 'Móvel Sob Medida', wCm: 120, hCm: 85, dCm: 56 };
  const bom = computeBOM(sp, animatedParts);
  const paints =
    animatedParts
      .filter((p) => p.paintedColorName)
      .map((p) => `${p.name}: ${p.paintedColorName}`)
      .join('; ') || 'sem pintura personalizada';
  const ep = encodeProject();
  const link = `${location.href.split('#')[0]}#${ep.startsWith('c=') ? ep : 'p=' + ep}`;
  const finishCfg = FINISHES[currentFinish] || Object.values(FINISHES)[0];

  return [
    '*Pedido de móvel — ZacFurniture*',
    `Cliente: ${name}`,
    `Móvel: ${sp.displayTitle} — ${sp.wCm} × ${sp.hCm} × ${sp.dCm} cm`,
    `Código: ${sp.catalogId || 'sob medida'}`,
    `Acabamento: ${finishCfg ? finishCfg.labelSelect : currentFinish}`,
    `Pintura: ${paints}`,
    notes ? `Observações: ${notes}` : '',
    '',
    `*Ferragens (${countScrews(bom)} parafusos/pinos):*`,
    ...bom.map((b) => `• ${b.qty}× ${b.item}`),
    '',
    `Ver o projeto 3D exato (abre com medidas e ferragens): ${link}`
  ]
    .filter((l, idx, arr) => l !== '' || arr[idx - 1] !== '')
    .join('\n');
}

if (quoteForm) {
  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('clientName');
    const notesEl = document.getElementById('projectNotes');
    const name = nameEl ? nameEl.value.trim() : '';
    const notes = notesEl ? notesEl.value.trim() : '';
    const url = `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(buildWhatsMessage(name, notes))}`;
    window.open(url, '_blank', 'noopener');
    if (formFeedback) {
      formFeedback.textContent = `Obrigado, ${name}! Abrindo o WhatsApp com o projeto exato do seu móvel.`;
    }
  });
}

/* ==========================================================================
   13. CATÁLOGO ESTRUTURAL (miniaturas SVG; renderiza aos poucos)
   ========================================================================== */
const catGrid = document.getElementById('catalogGrid');
const catMore = document.getElementById('catalogMore');
const catCount = document.getElementById('catalogCount');
const catById = new Map(CATALOG.map((it) => [it.id, it]));
const norm = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let catFamily = 'all';
let catQuery = '';
let catShown = 24;

function renderCatalog() {
  if (!catGrid) return;
  const q = norm(catQuery);
  const list = CATALOG.filter(
    (it) => (catFamily === 'all' || it.fam === catFamily) && (!q || norm(`${it.name} ${it.famName}`).includes(q))
  );
  if (catCount) catCount.textContent = `${list.length.toLocaleString('pt-BR')} modelos`;
  catGrid.innerHTML = list
    .slice(0, catShown)
    .map(
      (it) => `
    <article class="cat-card">
      ${thumbSvg(it)}
      <span class="cat-tag fam-${it.fam}">${it.famName}</span>
      <strong>${it.name}</strong>
      <small>${it.w} × ${it.h} × ${it.d} cm · ${it.id}</small>
      <button type="button" class="text-action" data-id="${it.id}">Montar no 3D &rarr;</button>
    </article>`
    )
    .join('');
  if (catMore) catMore.style.display = list.length > catShown ? '' : 'none';
}

if (catGrid) {
  catGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;
    const it = catById.get(btn.dataset.id);
    if (!it) return;
    if (customPromptEl) customPromptEl.value = it.name;
    buildFromSpec(specFromItem(it));
    const inicio = document.getElementById('inicio');
    if (inicio) inicio.scrollIntoView({ behavior: 'smooth' });
  });
}

if (catMore) {
  catMore.addEventListener('click', () => {
    catShown += 24;
    renderCatalog();
  });
}

const catSearch = document.getElementById('catalogSearch');
if (catSearch) {
  catSearch.addEventListener('input', (e) => {
    catQuery = e.target.value;
    catShown = 24;
    renderCatalog();
  });
}

document.querySelectorAll('.cat-filter').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.cat-filter').forEach((x) => x.classList.toggle('active', x === b));
    catFamily = b.dataset.fam;
    catShown = 24;
    renderCatalog();
  });
});

renderCatalog();
