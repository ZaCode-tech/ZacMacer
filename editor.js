import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { boxGeo, FINISHES, PAINT_BUCKETS, createWoodTexturesFromConfig, accMaterial, isAcc, partGeometry, rotRad } from './shared.js';
import { ACC, ACC_CATS } from './accessories.js';

/* ---------- Dados do projeto (tudo em centímetros; x/z centrados, y = altura do centro da peça) ---------- */
const TYPES = {
  lateral:    { label: 'Lateral',      n: 'Parede Lateral',  t: 'painel', w: 2.2, h: 80, d: 50 },
  base:       { label: 'Base',         n: 'Base Inferior',   t: 'painel', w: 80, h: 2.2, d: 50 },
  tampo:      { label: 'Tampo',        n: 'Tampo Superior',  t: 'painel', w: 80, h: 2.2, d: 50 },
  travessa:   { label: 'Travessa fixa', n: 'Travessa Fixa',  t: 'painel', w: 76, h: 2.2, d: 48 },
  prateleira: { label: 'Prateleira',   n: 'Prateleira',      t: 'painel', w: 76, h: 2.2, d: 46 },
  divisoria:  { label: 'Divisória',    n: 'Divisória',       t: 'painel', w: 2.2, h: 76, d: 48 },
  porta:      { label: 'Porta',        n: 'Porta',           t: 'porta',  w: 40, h: 76, d: 2.2 },
  gaveta:     { label: 'Gaveta',       n: 'Gaveta',          t: 'gaveta', w: 40, h: 16, d: 46 },
  ripado:     { label: 'Painel ripado', n: 'Painel Ripado',  t: 'ripado', w: 60, h: 80, d: 2.2 },
  fundo:      { label: 'Fundo',        n: 'Fundo',           t: 'painel', w: 80, h: 80, d: 0.6 },
  tubo:       { label: 'Tubo metalon', n: 'Tubo Metalon',    t: 'tubo',   w: 3, h: 80, d: 3, c: 'metal' },
  pe:         { label: 'Pé',           n: 'Pés',             t: 'pe',     w: 4, h: 10, d: 4 }
};
let project = { name: 'Meu móvel', finish: 'espresso', parts: [] };
try { const s = JSON.parse(localStorage.getItem('zf_project') || 'null'); if (s && s.parts && s.parts.length) project = { finish: 'espresso', ...s }; } catch (e) { /* vazio */ }
if (!project.parts.length) {
  const f = project.finish;
  project.name = 'Caixa simples';
  project.parts = [
    { t: 'painel', n: 'Parede Lateral Esquerda', w: 2.2, h: 80, d: 50, x: -39, y: 40, z: 0, c: f },
    { t: 'painel', n: 'Parede Lateral Direita', w: 2.2, h: 80, d: 50, x: 39, y: 40, z: 0, c: f },
    { t: 'painel', n: 'Base Inferior', w: 76, h: 2.2, d: 50, x: 0, y: 1.1, z: 0, c: f },
    { t: 'painel', n: 'Tampo Superior', w: 80, h: 2.2, d: 50, x: 0, y: 81.1, z: 0, c: f }
  ];
}
let sel = -1, step = 1, color = project.finish || 'espresso';
const undo = [], redo = [];
const snap = () => JSON.stringify(project);

/* ---------- Cena ---------- */
const stage = document.getElementById('edStage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.7;
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
camera.position.set(1.7, 1.4, 2.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.target.set(0, 0.45, 0);
scene.add(new THREE.HemisphereLight(0xfff5e8, 0x8a7560, 0.8));
const key = new THREE.DirectionalLight(0xfff1de, 1.8);
key.position.set(2.5, 4, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
scene.add(key);
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshStandardMaterial({ color: 0xe4dac8, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
scene.add(new THREE.GridHelper(5, 50, 0xc86d51, 0xd7ccb8).translateY(0.001));
const group = new THREE.Group(); scene.add(group);
const metalMat = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.45, metalness: 0.8 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0xefe7da, roughness: 0.3 });
const matCache = new Map();
let outline = null;

function cfgFor(c) { return FINISHES[c] || PAINT_BUCKETS.find((b) => b.id === c) || FINISHES[project.finish] || FINISHES.espresso; }
function matFor(c, rotate) {
  if (c === 'metal') return metalMat;
  if (isAcc(c)) return accMaterial(c);
  if (c === 'stone') return stoneMat;
  const k = `${c}|${rotate}`;
  if (!matCache.has(k)) {
    const cfg = cfgFor(c), { map, bumpMap } = createWoodTexturesFromConfig(cfg);
    if (rotate) { map.center.set(0.5, 0.5); map.rotation = Math.PI / 2; bumpMap.center.set(0.5, 0.5); bumpMap.rotation = Math.PI / 2; }
    matCache.set(k, new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: 0.008, roughness: cfg.roughness, metalness: cfg.metalness }));
  }
  return matCache.get(k);
}

function rebuild() {
  while (group.children.length) group.remove(group.children[0]);
  project.parts.forEach((q, i) => {
    const m = new THREE.Mesh(partGeometry(q), matFor(q.c, q.h < q.w && q.h < q.d));
    m.position.set(q.x / 100, q.y / 100, q.z / 100);
    if (q.r) m.rotation.set(...rotRad(q.r));
    m.castShadow = m.receiveShadow = true; m.userData.i = i;
    group.add(m);
  });
  if (outline) { scene.remove(outline); outline = null; }
  if (sel >= 0 && group.children[sel]) { outline = new THREE.BoxHelper(group.children[sel], 0xc86d51); scene.add(outline); }
  ui();
}

/* ---------- Interface ---------- */
const $ = (id) => document.getElementById(id);
const r1 = (v) => Math.round(v * 10) / 10;
const SW = () => [...Object.entries(FINISHES).map(([id, f]) => [id, f.baseColor, f.name]), ...PAINT_BUCKETS.map((b) => [b.id, b.baseColor, b.name]), ['metal', '#2a2b2e', 'Metalon preto'], ['stone', '#efe7da', 'Pedra clara']];

function ui() {
  $('projName').value = project.name;
  const ps = project.parts;
  const W = ps.length ? Math.max(...ps.map((q) => q.x + q.w / 2)) - Math.min(...ps.map((q) => q.x - q.w / 2)) : 0;
  const H = ps.length ? Math.max(...ps.map((q) => q.y + q.h / 2)) : 0;
  const D = ps.length ? Math.max(...ps.map((q) => q.z + q.d / 2)) - Math.min(...ps.map((q) => q.z - q.d / 2)) : 0;
  $('projDims').textContent = `Tamanho total: ${r1(W)} × ${r1(H)} × ${r1(D)} cm (L × A × P)`;
  $('partCount').textContent = ps.length;
  $('partList').innerHTML = ps.map((q, i) => `<button class="ed-item ${i === sel ? 'on' : ''}" data-i="${i}">${q.n} <small>${r1(q.w)}×${r1(q.h)}×${r1(q.d)}</small></button>`).join('');
  $('selCard').style.opacity = sel >= 0 ? 1 : 0.45;
  const q = ps[sel];
  $('selName').value = q ? q.n : '';
  const field = (lab, k) => `<div class="ed-field"><label>${lab}</label><div class="ed-step"><button data-k="${k}" data-s="-1">−</button><input type="number" step="0.1" data-k="${k}" value="${q ? r1(q[k]) : ''}" /><button data-k="${k}" data-s="1">+</button></div></div>`;
  $('sizeFields').innerHTML = field('Largura', 'w') + field('Altura', 'h') + field('Profund.', 'd');
  $('posFields').innerHTML = field('Posição X', 'x') + field('Altura Y', 'y') + field('Posição Z', 'z');
  $('colors').innerHTML = SW().map(([id, c, n]) => `<button class="ed-sw ${id === color ? 'on' : ''}" style="background:${c}" data-c="${id}" title="${n}" aria-label="${n}"></button>`).join('');
}

function commit() { undo.push(snap()); if (undo.length > 80) undo.shift(); redo.length = 0; }
function change(fn) { commit(); fn(); rebuild(); }

$('addGrid').innerHTML = Object.entries(TYPES).map(([k, v]) => `<button class="ed-chip" data-add="${k}">+ ${v.label}</button>`).join('');
$('addGrid').addEventListener('click', (e) => {
  const k = e.target.dataset.add; if (!k) return;
  const T = TYPES[k], n = project.parts.filter((p) => p.n.startsWith(T.n)).length + 1;
  change(() => { project.parts.push({ t: T.t, n: `${T.n} ${n}`, w: T.w, h: T.h, d: T.d, x: 0, y: T.h / 2, z: 0, c: T.c || color }); sel = project.parts.length - 1; });
});
/* ---------- Acessórios (1–115): busca + filtro por categoria ---------- */
let accCat = 'all', accQ = '';
const norm = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
$('accCat').innerHTML = '<option value="all">Todas as categorias</option>' + Object.entries(ACC_CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
function renderAcc() {
  const q = norm(accQ);
  const list = ACC.filter((a) => (accCat === 'all' || a.cat === accCat) && (!q || norm(a.n).includes(q)));
  $('accCount').textContent = list.length;
  $('accList').innerHTML = list.map((a) => `<button class="ed-item" data-acc="${a.id}">${a.id}. ${a.n} <small>${a.w}×${a.h}×${a.d}</small></button>`).join('');
}
$('accSearch').addEventListener('input', (e) => { accQ = e.target.value; renderAcc(); });
$('accCat').addEventListener('change', (e) => { accCat = e.target.value; renderAcc(); });
$('accList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-acc]'); if (!b) return;
  const a = ACC[+b.dataset.acc - 1], base = sel >= 0 ? project.parts[sel] : null;
  change(() => {
    project.parts.push({ t: 'acc', acc: a.id, n: a.n, w: a.w, h: a.h, d: a.d, x: base ? base.x : 0, y: base ? base.y : Math.max(a.h / 2, a.s === 'c' ? a.h / 2 : a.h / 2), z: base ? base.z + base.d / 2 + a.d / 2 : 0, c: a.c, ...(a.s === 'c' ? { s: 'c' } : {}), ...(a.r ? { r: a.r } : {}) });
    sel = project.parts.length - 1;
  });
});
renderAcc();

$('partList').addEventListener('click', (e) => { const i = e.target.closest('[data-i]'); if (i) { sel = +i.dataset.i; rebuild(); } });
$('projName').addEventListener('change', (e) => { project.name = e.target.value || 'Meu móvel'; });
$('selName').addEventListener('change', (e) => { if (sel >= 0) change(() => { project.parts[sel].n = e.target.value; }); });
$('stepSel').addEventListener('change', (e) => { step = +e.target.value; });
document.querySelector('.ed-panel').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-s]');
  if (b && sel >= 0) { const k = b.dataset.k; change(() => { const q = project.parts[sel]; q[k] = Math.max(['w', 'h', 'd'].includes(k) ? 0.5 : -999, r1(q[k] + step * +b.dataset.s)); }); return; }
  const sw = e.target.closest('[data-c]');
  if (sw) { color = sw.dataset.c; if (sel >= 0 && !isAcc(project.parts[sel].c) && project.parts[sel].c !== 'metal') change(() => { project.parts[sel].c = color; }); else ui(); }
});
document.querySelector('.ed-panel').addEventListener('change', (e) => {
  const k = e.target.dataset.k;
  if (k && sel >= 0) change(() => { project.parts[sel][k] = r1(parseFloat(e.target.value) || 0); });
});
$('dupBtn').addEventListener('click', () => { if (sel >= 0) change(() => { const q = { ...project.parts[sel] }; q.n += ' (cópia)'; q.x += 5; project.parts.push(q); sel = project.parts.length - 1; }); });
$('delBtn').addEventListener('click', () => { if (sel >= 0) change(() => { project.parts.splice(sel, 1); sel = -1; }); });
$('paintAllBtn').addEventListener('click', () => change(() => { project.parts.forEach((q) => { if (q.c !== 'metal' && q.c !== 'stone' && !isAcc(q.c)) q.c = color; }); }));
$('undoBtn').addEventListener('click', () => { if (undo.length) { redo.push(snap()); project = JSON.parse(undo.pop()); sel = -1; rebuild(); } });
$('redoBtn').addEventListener('click', () => { if (redo.length) { undo.push(snap()); project = JSON.parse(redo.pop()); sel = -1; rebuild(); } });
$('saveBtn').addEventListener('click', () => {
  localStorage.setItem('zf_project', JSON.stringify(project));
  location.href = 'index.html#edit';
});

/* ---------- Toque: selecionar e arrastar no chão ---------- */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
let drag = null;
function setPtr(e) { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); }
renderer.domElement.addEventListener('pointerdown', (e) => {
  setPtr(e);
  const h = ray.intersectObjects(group.children, false)[0];
  if (!h) return;
  sel = h.object.userData.i; rebuild();
  const q = project.parts[sel];
  plane.constant = -q.y / 100;
  ray.ray.intersectPlane(plane, hit);
  drag = { sx: hit.x, sz: hit.z, x0: q.x, z0: q.z, moved: false, before: snap() };
  controls.enabled = false;
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  setPtr(e);
  if (!ray.ray.intersectPlane(plane, hit)) return;
  const q = project.parts[sel], g = group.children[sel];
  q.x = Math.round(drag.x0 + (hit.x - drag.sx) * 100); q.z = Math.round(drag.z0 + (hit.z - drag.sz) * 100);
  drag.moved = true; g.position.set(q.x / 100, q.y / 100, q.z / 100);
  if (outline) outline.update();
});
window.addEventListener('pointerup', () => {
  if (drag && drag.moved) { undo.push(drag.before); redo.length = 0; ui(); }
  drag = null; controls.enabled = true;
});

function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage);
(function loop() { requestAnimationFrame(loop); if (document.hidden) return; controls.update(); renderer.render(scene, camera); })();
rebuild(); resize();
