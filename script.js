```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ==========================================================================
   1. CONFIGURAÇÃO DE ACABAMENTOS E TEXTURAS REALISTAS DE MADEIRA (PBR)
   ========================================================================== */
const FINISHES = {
  espresso: {
    name: 'Espresso & Quartzo Aveia',
    baseColor: '#5B3D2B',
    grainColor: '#2B1D16',
    highlightColor: '#75513B',
    roughness: 0.42,
    metalness: 0.04,
    isLacquer: false
  },
  oat: {
    name: 'Oat Natural & Pedra Clara',
    baseColor: '#DFD2BE',
    grainColor: '#BFA98C',
    highlightColor: '#EFE6D8',
    roughness: 0.48,
    metalness: 0.02,
    isLacquer: false
  },
  sage: {
    name: 'Sage Green Acetinado & Carvalho',
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

  // Veios orgânicos da madeira
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

  // Poros finos verticais
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
  container.clientWidth / container.clientHeight,
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

// Ambiente reflexivo realista para ferragens e pedra
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 1.45;
controls.maxDistance = 5.4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 0.52, 0);

// Iluminação arquitetônica quente
const hemiLight = new THREE.HemisphereLight(0xfff5e8, 0x2b1d16, 0.75);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff1de, 1.85);
keyLight.position.set(3.2, 4.6, 3.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 14;
keyLight.shadow.camera.left = -2.2;
keyLight.shadow.camera.right = 2.2;
keyLight.shadow.camera.top = 2.2;
keyLight.shadow.camera.bottom = -2.2;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9caf88, 0.65);
rimLight.position.set(-3.0, 2.5, -2.5);
scene.add(rimLight);

// Piso invisível receptor de sombra suave
const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.ShadowMaterial({ opacity: 0.34 })
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = 0;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

// Base circular sutil de apresentação
const plinthGeo = new THREE.CylinderGeometry(1.38, 1.42, 0.025, 64);
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

// Pedra Quartzo Oat (#E9DFCF)
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0xefe7da,
  roughness: 0.22,
  metalness: 0.04
});

// Metal cromado / escovado para torneira, puxadores e dobradiças
const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xe6e8ea,
  roughness: 0.16,
  metalness: 0.92
});

// Interior escuro das tubulações / cavidade
const cavityMat = new THREE.MeshStandardMaterial({
  color: 0x231711,
  roughness: 0.8
});

// Luz LED quente para o Balcão Ripado
const ledStripMat = new THREE.MeshStandardMaterial({
  color: 0xffd27d,
  emissive: 0xffaa2b,
  emissiveIntensity: 0.0,
  roughness: 0.2
});

/* ==========================================================================
   4. CONSTRUTORES DE MÓVEIS REALISTAS (PEÇA POR PEÇA PARA ANIMAÇÃO)
   ========================================================================== */
const furnitureRoot = new THREE.Group();
scene.add(furnitureRoot);

let animatedParts = [];
let interactiveOpenables = [];
let ledLight = null;
let doorsOpen = false;

function registerPart(obj, explodeOffset, order, explodeRot = { x: 0, y: 0, z: 0 }) {
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
  ledStripMat.emissiveIntensity = 0;
}

/* --------------------------------------------------------------------------
   MODELO A: GABINETE SUSPENSO DE BANHEIRO
   -------------------------------------------------------------------------- */
function buildVanityCabinet() {
  clearFurniture();
  const w = 1.48;
  const h = 0.62;
  const d = 0.52;
  const t = 0.022;
  const baseY = 0.24;

  // 1. Base inferior
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  bottom.position.set(0, baseY + t / 2, 0);
  registerPart(bottom, { x: 0, y: -0.35, z: 0.25 }, 0);

  // 2. Lateral esquerda
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), woodVerticalMat);
  leftSide.position.set(-w / 2 + t / 2, baseY + h / 2 + t / 2, 0);
  registerPart(leftSide, { x: -0.45, y: 0.1, z: 0 }, 1);

  // 3. Lateral direita
  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), woodVerticalMat);
  rightSide.position.set(w / 2 - t / 2, baseY + h / 2 + t / 2, 0);
  registerPart(rightSide, { x: 0.45, y: 0.1, z: 0 }, 1);

  // 4. Divisória central
  const dividerX = 0.22;
  const divider = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d - 0.03), woodVerticalMat);
  divider.position.set(dividerX, baseY + h / 2 + t / 2, -0.01);
  registerPart(divider, { x: 0, y: 0.35, z: -0.2 }, 2);

  // 5. Prateleira interna esquerda + travessa superior frontal
  const leftSpan = dividerX - (-w / 2 + t);
  const leftCenterX = (-w / 2 + t) + leftSpan / 2;

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(leftSpan - 0.004, t, d - 0.06), woodHorizontalMat);
  shelf.position.set(leftCenterX, baseY + h * 0.48, -0.015);
  registerPart(shelf, { x: -0.2, y: 0.15, z: 0.45 }, 3);

  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(leftSpan, 0.055, t), woodHorizontalMat);
  frontRail.position.set(leftCenterX, baseY + h - 0.028, d / 2 - t / 2);
  registerPart(frontRail, { x: 0, y: 0.25, z: 0.35 }, 3);

  // 6. Três gavetas à direita
  const drawerSpan = (w / 2 - t) - (dividerX + t / 2);
  const drawerCenterX = (dividerX + t / 2) + drawerSpan / 2;
  const drawerH = (h - t - 0.016) / 3;

  for (let i = 0; i < 3; i++) {
    const drawerGroup = new THREE.Group();
    const dy = baseY + t + drawerH * (i + 0.5) + i * 0.005;
    drawerGroup.position.set(drawerCenterX, dy, d / 2 - t / 2);

    const front = new THREE.Mesh(
      new THREE.BoxGeometry(drawerSpan - 0.006, drawerH - 0.006, t),
      woodVerticalMat
    );
    drawerGroup.add(front);

    const boxD = d - 0.08;
    const innerBox = new THREE.Mesh(
      new THREE.BoxGeometry(drawerSpan - 0.04, drawerH * 0.65, boxD),
      woodHorizontalMat
    );
    innerBox.position.set(0, -0.01, -boxD / 2);
    drawerGroup.add(innerBox);

    registerPart(drawerGroup, { x: 0.38, y: 0.05 * i, z: 0.55 + i * 0.12 }, 4);

    interactiveOpenables.push({
      obj: drawerGroup,
      closedPos: drawerGroup.position.clone(),
      openPos: drawerGroup.position.clone().add(new THREE.Vector3(0, 0, 0.18 - i * 0.045)),
      closedRotY: 0,
      openRotY: 0
    });
  }

  // 7. Duas portas articuladas à esquerda com dobradiças metálicas
  const doorW = (leftSpan - 0.008) / 2;
  const doorH = h - 0.068;
  const doorY = baseY + t + doorH / 2;

  const leftDoorPivot = new THREE.Group();
  leftDoorPivot.position.set(-w / 2 + t + 0.002, doorY, d / 2 - t / 2);
  const leftDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, t), woodVerticalMat);
  leftDoorMesh.position.set(doorW / 2, 0, 0);
  leftDoorPivot.add(leftDoorMesh);

  [-doorH * 0.32, doorH * 0.32].forEach((hy) => {
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.045, 0.02), chromeMat);
    hinge.position.set(0.012, hy, -0.016);
    leftDoorPivot.add(hinge);
  });

  registerPart(leftDoorPivot, { x: -0.35, y: 0, z: 0.65 }, 5, { x: 0, y: -0.35, z: 0 });
  interactiveOpenables.push({
    obj: leftDoorPivot,
    closedPos: leftDoorPivot.position.clone(),
    openPos: leftDoorPivot.position.clone(),
    closedRotY: 0,
    openRotY: -Math.PI * 0.42
  });

  const rightDoorPivot = new THREE.Group();
  rightDoorPivot.position.set(dividerX - t / 2 - 0.002, doorY, d / 2 - t / 2);
  const rightDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, t), woodVerticalMat);
  rightDoorMesh.position.set(-doorW / 2, 0, 0);
  rightDoorPivot.add(rightDoorMesh);

  [-doorH * 0.32, doorH * 0.32].forEach((hy) => {
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.045, 0.02), chromeMat);
    hinge.position.set(-0.012, hy, -0.016);
    rightDoorPivot.add(hinge);
  });

  registerPart(rightDoorPivot, { x: 0.15, y: 0, z: 0.72 }, 5, { x: 0, y: 0.35, z: 0 });
  interactiveOpenables.push({
    obj: rightDoorPivot,
    closedPos: rightDoorPivot.position.clone(),
    openPos: rightDoorPivot.position.clone(),
    closedRotY: 0,
    openRotY: Math.PI * 0.38
  });

  // 8. Tampo de Quartzo Oat com Cuba Embutida e Torneira Cromada
  const topGroup = new THREE.Group();
  topGroup.position.set(0, baseY + h + 0.02, 0.01);

  const counterSlab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.036, d + 0.04), stoneMat);
  topGroup.add(counterSlab);

  const basinRim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.01, 0.34), stoneMat);
  basinRim.position.set(leftCenterX, 0.02, 0.01);
  topGroup.add(basinRim);

  const basinHollow = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.012, 0.29), cavityMat);
  basinHollow.position.set(leftCenterX, 0.021, 0.01);
  topGroup.add(basinHollow);

  const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.15, 24), chromeMat);
  faucetBase.position.set(leftCenterX, 0.09, -0.19);
  topGroup.add(faucetBase);

  const faucetSpout = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.11), chromeMat);
  faucetSpout.position.set(leftCenterX, 0.155, -0.14);
  topGroup.add(faucetSpout);

  registerPart(topGroup, { x: 0, y: 0.65, z: 0 }, 6);
}

/* --------------------------------------------------------------------------
   MODELO B: BALCÃO RIPADO COM LED QUENTE
   -------------------------------------------------------------------------- */
function buildSlattedCounter() {
  clearFurniture();
  const w = 1.78;
  const h = 0.94;
  const d = 0.56;
  const t = 0.025;

  // 1. Base e caixa interna estrutural
  const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, t, d - 0.04), woodHorizontalMat);
  base.position.set(0, t / 2, 0);
  registerPart(base, { x: 0, y: -0.25, z: 0 }, 0);

  const coreBox = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.08, d - 0.07), woodVerticalMat);
  coreBox.position.set(0, (h - 0.08) / 2 + t, -0.01);
  registerPart(coreBox, { x: 0, y: 0.35, z: -0.35 }, 1);

  // 2. 32 Ripas Verticais de Madeira
  const slatCount = 32;
  const slatW = 0.024;
  const slatDepth = 0.022;
  const slatH = h - 0.055;
  const startX = -(w - 0.06) / 2 + slatW / 2;
  const stepX = (w - 0.06 - slatW) / (slatCount - 1);

  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(slatW, slatH, slatDepth),
      woodVerticalMat
    );
    const sx = startX + i * stepX;
    slat.position.set(sx, slatH / 2 + 0.015, d / 2 - 0.02);

    const waveZ = 0.45 + Math.sin(i * 0.25) * 0.25;
    const waveY = 0.15 + (i % 4) * 0.06;
    registerPart(slat, { x: (i - slatCount / 2) * 0.012, y: waveY, z: waveZ }, 2 + i * 0.04);
  }

  // Ripas laterais esquerda e direita
  const sideSlatCount = 9;
  const sideStartZ = -(d - 0.08) / 2 + slatW / 2;
  const sideStepZ = (d - 0.08 - slatW) / (sideSlatCount - 1);

  for (let j = 0; j < sideSlatCount; j++) {
    const sz = sideStartZ + j * sideStepZ;

    const leftSlat = new THREE.Mesh(
      new THREE.BoxGeometry(slatDepth, slatH, slatW),
      woodVerticalMat
    );
    leftSlat.position.set(-w / 2 + 0.02, slatH / 2 + 0.015, sz);
    registerPart(leftSlat, { x: -0.48, y: 0.12, z: 0 }, 3.3);

    const rightSlat = new THREE.Mesh(
      new THREE.BoxGeometry(slatDepth, slatH, slatW),
      woodVerticalMat
    );
    rightSlat.position.set(w / 2 - 0.02, slatH / 2 + 0.015, sz);
    registerPart(rightSlat, { x: 0.48, y: 0.12, z: 0 }, 3.3);
  }

  // 3. Canaleta de LED quente embutida sob o tampo
  const ledBar = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.04, 0.014, 0.018),
    ledStripMat
  );
  ledBar.position.set(0, h - 0.042, d / 2 - 0.008);
  registerPart(ledBar, { x: 0, y: 0.45, z: 0.25 }, 4);

  ledLight = new THREE.PointLight(0xffb84d, 0, 2.2, 1.6);
  ledLight.position.set(0, h - 0.08, d / 2 + 0.18);
  furnitureRoot.add(ledLight);

  // 4. Tampo superior encabeçado em madeira nobre
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.05, 0.042, d + 0.05),
    woodHorizontalMat
  );
  counterTop.position.set(0, h - 0.015, 0.01);
  registerPart(counterTop, { x: 0, y: 0.65, z: 0 }, 5);
}

/* --------------------------------------------------------------------------
   MODELO C: BANCADA GOURMET COM 4 PORTAS
   -------------------------------------------------------------------------- */
function buildGourmetBench() {
  clearFurniture();
  const w = 1.88;
  const h = 0.84;
  const d = 0.56;
  const t = 0.024;

  // 1. Base e quadro estrutural em madeira
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), woodHorizontalMat);
  bottom.position.set(0, 0.06, 0);
  registerPart(bottom, { x: 0, y: -0.25, z: 0 }, 0);

  // 5 montantes verticais do quadro
  for (let i = 0; i < 5; i++) {
    const px = -w / 2 + t / 2 + i * ((w - t) / 4);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, h - 0.08, d - 0.04), woodVerticalMat);
    post.position.set(px, 0.06 + (h - 0.08) / 2, -0.01);
    registerPart(post, { x: (i - 2) * 0.12, y: 0.35, z: -0.25 }, 1);
  }

  // Travessa superior do quadro
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, t), woodHorizontalMat);
  topRail.position.set(0, h - 0.04, d / 2 - t / 2);
  registerPart(topRail, { x: 0, y: 0.45, z: 0.35 }, 2);

  // 2. Quatro portas almofadadas com puxadores cromados
  const doorAreaW = w - 0.12;
  const singleDoorW = (doorAreaW - 0.036) / 4;
  const doorH = h - 0.18;
  const doorY = 0.09 + doorH / 2;

  for (let dIdx = 0; dIdx < 4; dIdx++) {
    const isLeftHinged = dIdx % 2 === 0;
    const slotCenterX = -doorAreaW / 2 + singleDoorW * (dIdx + 0.5) + dIdx * 0.012;

    const pivot = new THREE.Group();
    const hingeX = isLeftHinged ? slotCenterX - singleDoorW / 2 : slotCenterX + singleDoorW / 2;
    pivot.position.set(hingeX, doorY, d / 2 + 0.008);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(singleDoorW, doorH, 0.022),
      woodVerticalMat
    );
    doorPanel.position.set(isLeftHinged ? singleDoorW / 2 : -singleDoorW / 2, 0, 0);
    pivot.add(doorPanel);

    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, 0.024, 20), chromeMat);
    knob.rotation.x = Math.PI / 2;
    const knobOffsetX = isLeftHinged ? singleDoorW - 0.035 : -singleDoorW + 0.035;
    knob.position.set(knobOffsetX, doorH / 2 - 0.045, 0.02);
    pivot.add(knob);

    registerPart(
      pivot,
      { x: (dIdx - 1.5) * 0.18, y: 0.08, z: 0.58 + dIdx * 0.08 },
      3 + dIdx * 0.25
    );

    interactiveOpenables.push({
      obj: pivot,
      closedPos: pivot.position.clone(),
      openPos: pivot.position.clone(),
      closedRotY: 0,
      openRotY: isLeftHinged ? -Math.PI * 0.36 : Math.PI * 0.36
    });
  }

  // 3. Bancada superior em pedra branca Oat
  const stoneTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.04, d + 0.04), stoneMat);
  stoneTop.position.set(0, h + 0.02, 0.01);
  registerPart(stoneTop, { x: 0, y: 0.68, z: 0 }, 5);
}

/* ==========================================================================
   5. PARTÍCULAS SUTIS DE PÓ DE MADEIRA DOURADO NA LUZ
   ========================================================================== */
const dustCount = 55;
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 2.4;
  dustPositions[i * 3 + 1] = 0.1 + Math.random() * 1.4;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
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
   6. MOTOR DE ANIMAÇÃO DE MONTAGEM E CONTROLES DA INTERFACE
   ========================================================================== */
let assemblyProgress = 0;
let targetAssembly = 1;
let isAutoBuilding = true;
let currentModelKey = 'vanity';

const explodeRange = document.getElementById('explodeRange');
const assemblyStatus = document.getElementById('assemblyStatus');
const doorsBtn = document.getElementById('doorsBtn');
const doorsBtnText = document.getElementById('doorsBtnText');
const finishLabel = document.getElementById('currentFinishLabel');

function easeOutBack(x) {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function loadModel(modelKey) {
  currentModelKey = modelKey;
  doorsOpen = false;
  doorsBtnText.textContent = 'Abrir portas';

  if (modelKey === 'vanity') buildVanityCabinet();
  if (modelKey === 'counter') buildSlattedCounter();
  if (modelKey === 'kitchen') buildGourmetBench();

  triggerFullAssembly();
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

// Eventos dos botões de modelo
document.querySelectorAll('.piece-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.piece-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    loadModel(btn.dataset.model);
  });
});

// Cartões da galeria também carregam o móvel no palco
document.querySelectorAll('.work-card[data-select-model]').forEach((card) => {
  card.addEventListener('click', () => {
    const targetModel = card.dataset.selectModel;
    document.querySelectorAll('.piece-btn').forEach((b) => {
      const match = b.dataset.model === targetModel;
      b.classList.toggle('active', match);
      b.setAttribute('aria-selected', match ? 'true' : 'false');
    });
    loadModel(targetModel);
    document.getElementById('inicio').scrollIntoView({ behavior: 'smooth' });
  });
});

// Eventos das amostras de cor (Espresso, Oat, Sage Green)
document.querySelectorAll('.swatch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    applyFinish(btn.dataset.finish);
  });
});

// Botões de montagem e etapas
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

// Controle deslizante manual de encaixe / vista explodida
explodeRange.addEventListener('input', (e) => {
  isAutoBuilding = false;
  const explodeRatio = Number(e.target.value) / 100;
  targetAssembly = 1 - explodeRatio;
  assemblyStatus.textContent = explodeRatio > 0.05 ? 'Vista explodida' : 'Montado';
});

// Abrir / fechar portas e gavetas
doorsBtn.addEventListener('click', () => {
  if (currentModelKey === 'counter') {
    const isBright = ledStripMat.emissiveIntensity > 1.2;
    ledStripMat.emissiveIntensity = isBright ? 0.35 : 2.2;
    if (ledLight) ledLight.intensity = isBright ? 0.4 : 2.4;
    doorsBtnText.textContent = isBright ? 'Acender LED' : 'Suavizar LED';
    return;
  }
  doorsOpen = !doorsOpen;
  doorsBtnText.textContent = doorsOpen ? 'Fechar portas' : 'Abrir portas';
});

// Loop principal de renderização
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

  if (assemblyProgress > 0.92) {
    interactiveOpenables.forEach((item) => {
      const targetP = doorsOpen ? item.openPos : item.closedPos;
      const targetR = doorsOpen ? item.openRotY : item.closedRotY;
      item.obj.position.lerp(targetP, Math.min(1, delta * 6));
      item.obj.rotation.y += (targetR - item.obj.rotation.y) * Math.min(1, delta * 6);
    });
  }

  if (currentModelKey === 'counter' && ledLight) {
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

window.addEventListener('resize', () => {
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

loadModel('vanity');
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

  formFeedback.textContent = `Obrigado, ${name}! Recebemos seu interesse em ${project} (${finish}) e retornaremos em breve.`;
  quoteForm.reset();
});
```
