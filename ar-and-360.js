import * as THREE from 'three';

/**
 * ZacFurniture — Módulo de Realidade Aumentada (Tamanho Real 1:1)
 * e Exportação de Imagem 360° Interativa ao Toque
 */
export function initARAnd360(ctx) {
  const {
    THREE: T,
    scene,
    camera,
    renderer,
    controls,
    furnitureRoot,
    plinth,
    woodDust,
    dimensionLinesGroup,
    getCurrentSpec,
    getCurrentFinish,
    getAnimatedParts,
    getFinishLabel,
    toggleDoorsOrLed,
    onBeforeCapture,
    onAfterCapture
  } = ctx;

  injectStyles();
  const { arOverlay, fallbackOverlay, modal360 } = createOverlays();

  /* ========================================================================
     PARTE A: CÂMERA / REALIDADE AUMENTADA EM TAMANHO REAL (ESCALA 1:1)
     ======================================================================== */
  let arActive = false;
  let xrSession = null;
  let xrHitTestSource = null;
  let xrHitTestSourceRequested = false;
  let reticle = null;
  let furniturePlacedInXR = false;

  // Fallback Câmera ao Vivo (iOS Safari / Desktop / Navegadores sem WebXR)
  let fallbackStream = null;
  let fallbackRenderer = null;
  let fallbackScene = null;
  let fallbackCamera = null;
  let fallbackRaf = 0;
  let fallbackDistMeters = 2.2;
  let fallbackRotY = 0;
  let fallbackOffset = { x: 0, y: -0.38 };
  let fallbackDrag = null;
  let fallbackPinchDist = null;
  let useRearCamera = true;
  let floorGuideGroup = null;

  function formatM(cm) {
    return (cm / 100).toFixed(2).replace('.', ',') + ' m';
  }

  function updateARSpecLabels(spec) {
    if (!spec) return;
    const text = `${spec.displayTitle} · Tamanho Real: ${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm (${formatM(spec.wCm)} × ${formatM(spec.hCm)})`;
    arOverlay.querySelector('[data-ar-spec]').textContent = text;
    fallbackOverlay.querySelector('[data-ar-spec]').textContent = text;
  }

  async function openARMode() {
    const spec = getCurrentSpec();
    if (!spec) return;
    updateARSpecLabels(spec);

    if (onBeforeCapture) onBeforeCapture();

    // Tenta WebXR nativo (Android Chrome com detecção real de piso)
    if (navigator.xr && navigator.xr.isSessionSupported) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (supported) {
          await startNativeWebXR(spec);
          return;
        }
      } catch (err) {
        // Segue para o modo câmera calibrada
      }
    }

    // Fallback universal: Câmera ao Vivo com Escala Real Calibrada
    await startCalibratedCameraAR(spec);
  }

  /* --- MODO 1: WebXR Nativo (Detecção Real de Superfície) --- */
  async function startNativeWebXR(spec) {
    arActive = true;
    furniturePlacedInXR = false;
    xrHitTestSource = null;
    xrHitTestSourceRequested = false;

    plinth.visible = false;
    woodDust.visible = false;
    dimensionLinesGroup.visible = false;

    arOverlay.classList.remove('hidden');
    arOverlay.querySelector('[data-ar-status]').textContent =
      'Aponte a câmera para o chão e mova devagar para detectar o piso...';

    if (!reticle) {
      const ringGeo = new T.RingGeometry(0.14, 0.19, 36).rotateX(-Math.PI / 2);
      const ringMat = new T.MeshBasicMaterial({ color: 0x9caf88, side: T.DoubleSide });
      reticle = new T.Mesh(ringGeo, ringMat);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
    }

    const prevPos = furnitureRoot.position.clone();
    const prevRot = furnitureRoot.rotation.clone();
    const prevCamPos = camera.position.clone();
    const prevTarget = controls.target.clone();

    furnitureRoot.visible = false;
    controls.enabled = false;

    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    try {
      xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: arOverlay }
      });
    } catch (err) {
      renderer.xr.enabled = false;
      plinth.visible = true;
      woodDust.visible = true;
      furnitureRoot.visible = true;
      controls.enabled = true;
      arOverlay.classList.add('hidden');
      await startCalibratedCameraAR(spec);
      return;
    }

    await renderer.xr.setSession(xrSession);

    const placeHere = () => {
      if (reticle && reticle.visible) {
        furnitureRoot.visible = true;
        furnitureRoot.position.setFromMatrixPosition(reticle.matrix);
        furniturePlacedInXR = true;
        arOverlay.querySelector('[data-ar-status]').textContent =
          `Móvel posicionado em tamanho real (${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm).`;
      }
    };

    const placeBtn = arOverlay.querySelector('[data-ar-place]');
    const rotLeftBtn = arOverlay.querySelector('[data-ar-rot-left]');
    const rotRightBtn = arOverlay.querySelector('[data-ar-rot-right]');
    const doorsActionBtn = arOverlay.querySelector('[data-ar-doors]');
    const closeBtn = arOverlay.querySelector('[data-ar-close]');

    const onRotLeft = () => { furnitureRoot.rotation.y -= Math.PI / 12; };
    const onRotRight = () => { furnitureRoot.rotation.y += Math.PI / 12; };
    const onDoors = () => { if (toggleDoorsOrLed) toggleDoorsOrLed(); };
    const onClose = () => { if (xrSession) xrSession.end(); };

    placeBtn.addEventListener('click', placeHere);
    rotLeftBtn.addEventListener('click', onRotLeft);
    rotRightBtn.addEventListener('click', onRotRight);
    doorsActionBtn.addEventListener('click', onDoors);
    closeBtn.addEventListener('click', onClose);

    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && xrSession) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!xrHitTestSourceRequested) {
          session.requestReferenceSpace('viewer').then((viewerSpace) => {
            session.requestHitTestSource({ space: viewerSpace }).then((source) => {
              xrHitTestSource = source;
            });
          });
          xrHitTestSourceRequested = true;
        }

        if (xrHitTestSource) {
          const hitTestResults = frame.getHitTestResults(xrHitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose) {
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
              if (!furniturePlacedInXR) {
                furnitureRoot.visible = true;
                furnitureRoot.position.setFromMatrixPosition(reticle.matrix);
                arOverlay.querySelector('[data-ar-status]').textContent =
                  'Piso detectado! Toque em "Fixar no local" ou gire o móvel.';
              }
            }
          } else {
            reticle.visible = false;
          }
        }
      }
      renderer.render(scene, camera);
    });

    xrSession.addEventListener('end', () => {
      renderer.setAnimationLoop(null);
      renderer.xr.enabled = false;
      xrSession = null;
      arActive = false;

      if (reticle) reticle.visible = false;
      plinth.visible = true;
      woodDust.visible = true;
      furnitureRoot.visible = true;
      furnitureRoot.position.copy(prevPos);
      furnitureRoot.rotation.copy(prevRot);
      camera.position.copy(prevCamPos);
      controls.target.copy(prevTarget);
      controls.enabled = true;
      controls.update();

      placeBtn.removeEventListener('click', placeHere);
      rotLeftBtn.removeEventListener('click', onRotLeft);
      rotRightBtn.removeEventListener('click', onRotRight);
      doorsActionBtn.removeEventListener('click', onDoors);
      closeBtn.removeEventListener('click', onClose);

      arOverlay.classList.add('hidden');
      if (onAfterCapture) onAfterCapture();
    });
  }

  /* --- MODO 2: Câmera ao Vivo + Escala Real Óptica (iPhone / Desktop) --- */
  async function startCalibratedCameraAR(spec) {
    fallbackOverlay.classList.remove('hidden');
    const videoEl = fallbackOverlay.querySelector('#arFallbackVideo');
    const canvasMount = fallbackOverlay.querySelector('#arFallbackCanvasMount');
    const statusEl = fallbackOverlay.querySelector('[data-fb-status]');
    const distSlider = fallbackOverlay.querySelector('#arDistSlider');
    const distLabel = fallbackOverlay.querySelector('#arDistValue');

    fallbackDistMeters = 2.2;
    fallbackRotY = 0;
    fallbackOffset = { x: 0, y: -(spec.hCm / 100) * 0.45 };
    distSlider.value = '2.2';
    distLabel.textContent = '2,20 m';

    await startCameraStream(videoEl, statusEl);

    // Cena dedicada para sobrepor o móvel em escala real 1:1 sobre o vídeo
    fallbackScene = new T.Scene();
    const hemi = new T.HemisphereLight(0xfff7ec, 0x7c6a58, 1.15);
    fallbackScene.add(hemi);

    const key = new T.DirectionalLight(0xfff2e0, 1.85);
    key.position.set(2.5, 4.5, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    fallbackScene.add(key);

    const shadowPlane = new T.Mesh(
      new T.PlaneGeometry(10, 10),
      new T.ShadowMaterial({ opacity: 0.35 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    fallbackScene.add(shadowPlane);

    // Grade guia de escala real no piso (mostra largura e profundidade reais)
    floorGuideGroup = buildRealScaleFloorGuide(spec);
    fallbackScene.add(floorGuideGroup);

    // Transfere temporariamente o móvel real (1 unidade = 1 metro) para a cena da câmera
    const prevPos = furnitureRoot.position.clone();
    const prevRot = furnitureRoot.rotation.clone();
    scene.remove(furnitureRoot);
    furnitureRoot.position.set(0, 0, 0);
    furnitureRoot.rotation.set(0, 0, 0);
    fallbackScene.add(furnitureRoot);

    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    // FOV vertical ~54° equivalente à lente principal 26mm de smartphone
    fallbackCamera = new T.PerspectiveCamera(54, w / h, 0.1, 30);
    fallbackCamera.position.set(0, 0.35, fallbackDistMeters);

    fallbackRenderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    fallbackRenderer.setSize(w, h);
    fallbackRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    fallbackRenderer.shadowMap.enabled = true;
    fallbackRenderer.toneMapping = T.ACESFilmicToneMapping;
    fallbackRenderer.toneMappingExposure = 1.15;

    canvasMount.innerHTML = '';
    canvasMount.appendChild(fallbackRenderer.domElement);

    const updateTransform = () => {
      const zDist = -fallbackDistMeters;
      furnitureRoot.position.set(fallbackOffset.x, fallbackOffset.y, zDist);
      furnitureRoot.rotation.y = fallbackRotY;
      shadowPlane.position.set(fallbackOffset.x, fallbackOffset.y, zDist);
      if (floorGuideGroup) {
        floorGuideGroup.position.set(fallbackOffset.x, fallbackOffset.y + 0.002, zDist);
        floorGuideGroup.rotation.y = fallbackRotY;
      }
      fallbackCamera.position.set(0, 0.32, 0);
      fallbackCamera.lookAt(0, 0.15, -2.0);
    };
    updateTransform();

    // Gestos de toque e mouse: arrastar para posicionar, 2 dedos para girar/aproximar
    const dom = fallbackRenderer.domElement;
    const onPointerDown = (e) => {
      fallbackDrag = { x: e.clientX, y: e.clientY, ox: fallbackOffset.x, oy: fallbackOffset.y };
    };
    const onPointerMove = (e) => {
      if (!fallbackDrag) return;
      const factor = fallbackDistMeters * 0.0014;
      fallbackOffset.x = THREE.MathUtils.clamp(
        fallbackDrag.ox + (e.clientX - fallbackDrag.x) * factor,
        -2.5,
        2.5
      );
      fallbackOffset.y = THREE.MathUtils.clamp(
        fallbackDrag.oy - (e.clientY - fallbackDrag.y) * factor,
        -2.2,
        1.2
      );
      updateTransform();
    };
    const onPointerUp = () => { fallbackDrag = null; };

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (fallbackPinchDist !== null) {
          const delta = (fallbackPinchDist - dist) * 0.006;
          fallbackDistMeters = THREE.MathUtils.clamp(fallbackDistMeters + delta, 1.0, 5.0);
          distSlider.value = fallbackDistMeters.toFixed(2);
          distLabel.textContent = fallbackDistMeters.toFixed(2).replace('.', ',') + ' m';
          updateTransform();
        }
        fallbackPinchDist = dist;
      }
    };
    const onTouchEnd = () => { fallbackPinchDist = null; };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd);

    const onDistInput = () => {
      fallbackDistMeters = parseFloat(distSlider.value);
      distLabel.textContent = fallbackDistMeters.toFixed(2).replace('.', ',') + ' m';
      updateTransform();
    };
    distSlider.addEventListener('input', onDistInput);

    const onRotL = () => { fallbackRotY -= Math.PI / 12; updateTransform(); };
    const onRotR = () => { fallbackRotY += Math.PI / 12; updateTransform(); };
    const onFlipCam = async () => {
      useRearCamera = !useRearCamera;
      await startCameraStream(videoEl, statusEl);
    };
    const onDoors = () => { if (toggleDoorsOrLed) toggleDoorsOrLed(); };
    const onSnapPhoto = () => {
      captureCompositeARPhoto(videoEl, fallbackRenderer.domElement, spec);
    };

    const btnRotL = fallbackOverlay.querySelector('[data-fb-rot-left]');
    const btnRotR = fallbackOverlay.querySelector('[data-fb-rot-right]');
    const btnFlip = fallbackOverlay.querySelector('[data-fb-flip]');
    const btnDoors = fallbackOverlay.querySelector('[data-fb-doors]');
    const btnSnap = fallbackOverlay.querySelector('[data-fb-snap]');
    const btnClose = fallbackOverlay.querySelector('[data-fb-close]');

    btnRotL.addEventListener('click', onRotL);
    btnRotR.addEventListener('click', onRotR);
    btnFlip.addEventListener('click', onFlipCam);
    btnDoors.addEventListener('click', onDoors);
    btnSnap.addEventListener('click', onSnapPhoto);

    const onResize = () => {
      if (!fallbackRenderer || !fallbackCamera) return;
      const nw = Math.max(window.innerWidth, 1);
      const nh = Math.max(window.innerHeight, 1);
      fallbackCamera.aspect = nw / nh;
      fallbackCamera.updateProjectionMatrix();
      fallbackRenderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    const loop = () => {
      fallbackRaf = requestAnimationFrame(loop);
      fallbackRenderer.render(fallbackScene, fallbackCamera);
    };
    loop();

    const cleanupFallback = () => {
      cancelAnimationFrame(fallbackRaf);
      if (fallbackStream) {
        fallbackStream.getTracks().forEach((tr) => tr.stop());
        fallbackStream = null;
      }
      videoEl.srcObject = null;

      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      distSlider.removeEventListener('input', onDistInput);
      btnRotL.removeEventListener('click', onRotL);
      btnRotR.removeEventListener('click', onRotR);
      btnFlip.removeEventListener('click', onFlipCam);
      btnDoors.removeEventListener('click', onDoors);
      btnSnap.removeEventListener('click', onSnapPhoto);
      btnClose.removeEventListener('click', cleanupFallback);
      window.removeEventListener('resize', onResize);

      // Devolve o móvel para a cena principal
      fallbackScene.remove(furnitureRoot);
      furnitureRoot.position.copy(prevPos);
      furnitureRoot.rotation.copy(prevRot);
      scene.add(furnitureRoot);

      if (fallbackRenderer) {
        fallbackRenderer.dispose();
        fallbackRenderer = null;
      }
      fallbackOverlay.classList.add('hidden');
      if (onAfterCapture) onAfterCapture();
    };

    btnClose.addEventListener('click', cleanupFallback);
  }

  async function startCameraStream(videoEl, statusEl) {
    if (fallbackStream) {
      fallbackStream.getTracks().forEach((tr) => tr.stop());
      fallbackStream = null;
    }
    try {
      fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: useRearCamera ? { ideal: 'environment' } : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      videoEl.srcObject = fallbackStream;
      await videoEl.play();
      statusEl.textContent = 'Arraste o móvel até o local desejado · Ajuste a distância para escala 1:1';
    } catch (err) {
      statusEl.textContent = 'Permissão de câmera não concedida (usando fundo neutro de simulação).';
    }
  }

  function buildRealScaleFloorGuide(spec) {
    const group = new T.Group();
    const w = spec.wCm / 100;
    const d = spec.dCm / 100;
    const pad = 0.04;

    const pts = [
      new T.Vector3(-w / 2 - pad, 0, -d / 2 - pad),
      new T.Vector3(w / 2 + pad, 0, -d / 2 - pad),
      new T.Vector3(w / 2 + pad, 0, d / 2 + pad),
      new T.Vector3(-w / 2 - pad, 0, d / 2 + pad),
      new T.Vector3(-w / 2 - pad, 0, -d / 2 - pad)
    ];
    const geo = new T.BufferGeometry().setFromPoints(pts);
    const mat = new T.LineBasicMaterial({ color: 0x9caf88 });
    group.add(new T.Line(geo, mat));
    return group;
  }

  function captureCompositeARPhoto(videoEl, webglCanvas, spec) {
    const out = document.createElement('canvas');
    out.width = webglCanvas.width;
    out.height = webglCanvas.height;
    const c2d = out.getContext('2d');

    if (videoEl && videoEl.readyState >= 2) {
      const vw = videoEl.videoWidth || out.width;
      const vh = videoEl.videoHeight || out.height;
      const scale = Math.max(out.width / vw, out.height / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      c2d.drawImage(videoEl, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh);
    } else {
      c2d.fillStyle = '#E8E3D9';
      c2d.fillRect(0, 0, out.width, out.height);
    }

    c2d.drawImage(webglCanvas, 0, 0);

    // Selo discreto com medidas reais
    c2d.fillStyle = 'rgba(29, 19, 14, 0.78)';
    c2d.fillRect(24, out.height - 84, Math.min(out.width - 48, 540), 56);
    c2d.fillStyle = '#F7F5F0';
    c2d.font = '600 20px "Plus Jakarta Sans", sans-serif';
    c2d.fillText(
      `ZacFurniture AR · ${spec.displayTitle} (${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm)`,
      40,
      out.height - 50
    );

    const a = document.createElement('a');
    a.href = out.toDataURL('image/jpeg', 0.92);
    a.download = `ZacFurniture-Ambiente-${slugify(spec.displayTitle)}.jpg`;
    a.click();
  }

  /* ========================================================================
     PARTE B: IMAGEM 360° INTERATIVA AO TOQUE E BAIXÁVEL
     ======================================================================== */
  let capturedFrames = [];
  let previewFrameIdx = 0;
  let previewDragStart = null;

  async function open360Studio() {
    const spec = getCurrentSpec();
    if (!spec) return;

    modal360.classList.remove('hidden');
    const progressWrap = modal360.querySelector('[data-360-progress-wrap]');
    const progressBar = modal360.querySelector('[data-360-bar]');
    const progressText = modal360.querySelector('[data-360-progress-text]');
    const viewerBox = modal360.querySelector('[data-360-viewer]');
    const previewImg = modal360.querySelector('#preview360Img');
    const angleBadge = modal360.querySelector('[data-360-angle]');
    const actionsRow = modal360.querySelector('[data-360-actions]');

    progressWrap.classList.remove('hidden');
    viewerBox.classList.add('hidden');
    actionsRow.classList.add('hidden');

    if (onBeforeCapture) onBeforeCapture();

    // Salva estado atual da câmera e elementos auxiliares
    const prevCamPos = camera.position.clone();
    const prevTarget = controls.target.clone();
    const prevDustVis = woodDust.visible;
    const prevDimVis = dimensionLinesGroup.visible;
    const prevRootY = furnitureRoot.position.y;

    woodDust.visible = false;
    dimensionLinesGroup.visible = false;
    furnitureRoot.position.y = 0;

    const wUnits = spec.wCm / 100;
    const hUnits = spec.hCm / 100;
    const dUnits = spec.dCm / 100;
    const centerY = hUnits * 0.5;
    const maxDim = Math.max(wUnits, hUnits * 1.12, dUnits);
    const radius = THREE.MathUtils.clamp(maxDim * 1.82, 2.2, 5.4);

    const TOTAL_FRAMES = 36; // 1 frame a cada 10 graus = 360° fluido ao toque
    capturedFrames = [];

    // Buffer offscreen quadrado de alta nitidez para o 360°
    const capSize = 680;
    const capCanvas = document.createElement('canvas');
    capCanvas.width = capSize;
    capCanvas.height = capSize;
    const capCtx = capCanvas.getContext('2d');

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const theta = (i / TOTAL_FRAMES) * Math.PI * 2 + 0.55;
      camera.position.set(
        Math.sin(theta) * radius,
        centerY + radius * 0.34,
        Math.cos(theta) * radius
      );
      camera.lookAt(0, centerY, 0);
      renderer.render(scene, camera);

      // Fundo estúdio quente suave (#F4F1EA) + recorte central do render
      capCtx.fillStyle = '#F4F1EA';
      capCtx.fillRect(0, 0, capSize, capSize);

      const src = renderer.domElement;
      const srcAspect = src.width / src.height;
      let sx = 0, sy = 0, sw = src.width, sh = src.height;
      if (srcAspect > 1) {
        sw = src.height;
        sx = (src.width - sw) / 2;
      } else {
        sh = src.width;
        sy = (src.height - sh) / 2;
      }
      capCtx.drawImage(src, sx, sy, sw, sh, 0, 0, capSize, capSize);

      capturedFrames.push(capCanvas.toDataURL('image/webp', 0.85));

      const pct = Math.round(((i + 1) / TOTAL_FRAMES) * 100);
      progressBar.style.width = `${pct}%`;
      progressText.textContent = `Renderizando ângulo ${i + 1} de ${TOTAL_FRAMES} (${pct}%)...`;

      if (i % 3 === 0) {
        await new Promise((r) => requestAnimationFrame(r));
      }
    }

    // Restaura câmera e cena originais
    camera.position.copy(prevCamPos);
    controls.target.copy(prevTarget);
    controls.update();
    woodDust.visible = prevDustVis;
    dimensionLinesGroup.visible = prevDimVis;
    furnitureRoot.position.y = prevRootY;
    if (onAfterCapture) onAfterCapture();

    // Ativa prévia interativa 360° no modal
    previewFrameIdx = 0;
    previewImg.src = capturedFrames[0];
    angleBadge.textContent = '0°';
    progressWrap.classList.add('hidden');
    viewerBox.classList.remove('hidden');
    actionsRow.classList.remove('hidden');
  }

  // Interação de toque/arraste na prévia 360° dentro do modal
  const previewStage = modal360.querySelector('[data-360-viewer]');
  const previewImgEl = modal360.querySelector('#preview360Img');
  const previewAngleEl = modal360.querySelector('[data-360-angle]');

  const setPreviewFrame = (idx) => {
    if (!capturedFrames.length) return;
    const n = capturedFrames.length;
    previewFrameIdx = ((idx % n) + n) % n;
    previewImgEl.src = capturedFrames[previewFrameIdx];
    previewAngleEl.textContent = `${Math.round((previewFrameIdx / n) * 360)}°`;
  };

  previewStage.addEventListener('pointerdown', (e) => {
    previewDragStart = { x: e.clientX, frame: previewFrameIdx };
    previewStage.setPointerCapture(e.pointerId);
  });

  previewStage.addEventListener('pointermove', (e) => {
    if (!previewDragStart || !capturedFrames.length) return;
    const dx = e.clientX - previewDragStart.x;
    const step = Math.round(dx / 9);
    setPreviewFrame(previewDragStart.frame + step);
  });

  previewStage.addEventListener('pointerup', () => {
    previewDragStart = null;
  });

  // Botão 1: Baixar Arquivo 360° Interativo ao Toque (HTML autônomo offline)
  modal360.querySelector('[data-download-360-html]').addEventListener('click', () => {
    const spec = getCurrentSpec();
    if (!spec || !capturedFrames.length) return;

    const parts = getAnimatedParts ? getAnimatedParts() : [];
    const paintedSummary = parts
      .filter((p) => p.paintedColorName)
      .map((p) => `${p.name}: ${p.paintedColorName}`)
      .join(' · ') || 'Acabamento padrão';

    const htmlContent = buildStandalone360HTML({
      title: spec.displayTitle,
      dims: `${spec.wCm} × ${spec.hCm} × ${spec.dCm} cm (${formatM(spec.wCm)} × ${formatM(spec.hCm)} × ${formatM(spec.dCm)})`,
      finish: getFinishLabel ? getFinishLabel() : getCurrentFinish(),
      paints: paintedSummary,
      frames: capturedFrames
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZacFurniture-360-Interativo-${slugify(spec.displayTitle)}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  // Botão 2: Baixar Tira / Grade 360° em PNG
  modal360.querySelector('[data-download-360-sprite]').addEventListener('click', async () => {
    const spec = getCurrentSpec();
    if (!spec || !capturedFrames.length) return;

    const cols = 6;
    const rows = 6;
    const cell = 340;
    const sheet = document.createElement('canvas');
    sheet.width = cols * cell;
    sheet.height = rows * cell;
    const sctx = sheet.getContext('2d');
    sctx.fillStyle = '#F4F1EA';
    sctx.fillRect(0, 0, sheet.width, sheet.height);

    for (let i = 0; i < capturedFrames.length; i++) {
      const img = await loadImage(capturedFrames[i]);
      const c = i % cols;
      const r = Math.floor(i / cols);
      sctx.drawImage(img, c * cell, r * cell, cell, cell);
    }

    const a = document.createElement('a');
    a.href = sheet.toDataURL('image/png');
    a.download = `ZacFurniture-360-Grade-${slugify(spec.displayTitle)}.png`;
    a.click();
  });

  // Botão 3: Baixar Foto PNG Atual
  modal360.querySelector('[data-download-png]').addEventListener('click', () => {
    const spec = getCurrentSpec();
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.href = renderer.domElement.toDataURL('image/png');
    a.download = `ZacFurniture-${slugify((spec && spec.displayTitle) || 'projeto')}.png`;
    a.click();
  });

  modal360.querySelector('[data-close-360]').addEventListener('click', () => {
    modal360.classList.add('hidden');
  });

  return {
    openARMode,
    open360Studio
  };
}

/* ==========================================================================
   GERADOR DO ARQUIVO 360° INTERATIVO AUTÔNOMO (FUNCIONA OFFLINE NO CELULAR/PC)
   ========================================================================== */
function buildStandalone360HTML({ title, dims, finish, paints, frames }) {
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const waText = encodeURIComponent(
    `Olá! Vi o projeto 360° *${title}* (${dims}) da ZacFurniture e gostaria de um orçamento.`
  );

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0" />
<title>${esc(title)} — Visualização 360° Interativa | ZacFurniture</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  body{background:#F7F5F0;color:#1D130E;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}
  .card{width:100%;max-width:620px;background:#fff;border-radius:24px;box-shadow:0 20px 50px rgba(29,19,14,.12);overflow:hidden;border:1px solid rgba(29,19,14,.08)}
  .head{padding:18px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(29,19,14,.08);background:#FAF8F4}
  .brand{font-weight:700;font-size:15px;letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
  .dot{width:10px;height:10px;border-radius:50%;background:#8FA37B;display:inline-block}
  .badge{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:#EFECE4;color:#4A3525}
  .stage{position:relative;width:100%;aspect-ratio:1/1;background:#F4F1EA;touch-action:none;cursor:grab;user-select:none;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .stage:active{cursor:grabbing}
  .stage img{width:100%;height:100%;object-fit:contain;pointer-events:none;transition:transform .12s ease-out}
  .hint{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(29,19,14,.78);color:#fff;font-size:12px;padding:6px 14px;border-radius:999px;backdrop-filter:blur(6px);white-space:nowrap}
  .angle{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.9);color:#1D130E;font-weight:700;font-size:12px;padding:5px 10px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.08)}
  .toolbar{display:flex;gap:8px;padding:12px 20px;background:#FAF8F4;border-top:1px solid rgba(29,19,14,.06);justify-content:center;flex-wrap:wrap}
  .tbtn{border:1px solid rgba(29,19,14,.14);background:#fff;color:#1D130E;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer}
  .tbtn.active{background:#8FA37B;color:#fff;border-color:#8FA37B}
  .info{padding:20px 22px}
  h1{font-size:20px;margin-bottom:6px}
  .meta{font-size:13px;color:#5C4D42;line-height:1.5;margin-bottom:16px}
  .cta{display:block;width:100%;text-align:center;background:#8FA37B;color:#fff;text-decoration:none;font-weight:700;padding:14px;border-radius:14px;font-size:15px}
</style>
</head>
<body>
<div class="card">
  <div class="head">
    <div class="brand"><span class="dot"></span>ZacFurniture · 360°</div>
    <span class="badge">Interativo ao toque</span>
  </div>
  <div class="stage" id="stage">
    <img id="viewer" alt="${esc(title)}" />
    <span class="angle" id="angleLabel">0°</span>
    <span class="hint">Arraste com o dedo ou mouse para girar 360°</span>
  </div>
  <div class="toolbar">
    <button class="tbtn" id="prevBtn">↺ Girar</button>
    <button class="tbtn" id="autoBtn">Auto-giro</button>
    <button class="tbtn" id="zoomBtn">Zoom 1x</button>
    <button class="tbtn" id="nextBtn">Girar ↻</button>
  </div>
  <div class="info">
    <h1>${esc(title)}</h1>
    <p class="meta">
      <strong>Medidas:</strong> ${esc(dims)}<br/>
      <strong>Acabamento:</strong> ${esc(finish)}<br/>
      <strong>Pintura:</strong> ${esc(paints)}
    </p>
    <a class="cta" href="https://wa.me/5521982814880?text=${waText}" target="_blank" rel="noopener">Solicitar orçamento deste projeto no WhatsApp</a>
  </div>
</div>
<script>
const FRAMES = ${JSON.stringify(frames)};
const img = document.getElementById('viewer');
const stage = document.getElementById('stage');
const angleLabel = document.getElementById('angleLabel');
let idx = 0, drag = null, velocity = 0, autoSpin = false, zoom = 1;

function show(i){
  const n = FRAMES.length;
  idx = ((Math.round(i) % n) + n) % n;
  img.src = FRAMES[idx];
  angleLabel.textContent = Math.round((idx / n) * 360) + '°';
}
show(0);

stage.addEventListener('pointerdown', (e) => {
  autoSpin = false;
  document.getElementById('autoBtn').classList.remove('active');
  drag = { x: e.clientX, lastX: e.clientX, startIdx: idx };
  velocity = 0;
  stage.setPointerCapture(e.pointerId);
});

stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  velocity = (e.clientX - drag.lastX) * 0.14;
  drag.lastX = e.clientX;
  show(drag.startIdx + dx / 8);
});

stage.addEventListener('pointerup', () => { drag = null; });

document.getElementById('prevBtn').onclick = () => show(idx - 2);
document.getElementById('nextBtn').onclick = () => show(idx + 2);
document.getElementById('autoBtn').onclick = (e) => {
  autoSpin = !autoSpin;
  e.target.classList.toggle('active', autoSpin);
};
document.getElementById('zoomBtn').onclick = (e) => {
  zoom = zoom === 1 ? 1.55 : 1;
  img.style.transform = 'scale(' + zoom + ')';
  e.target.textContent = zoom === 1 ? 'Zoom 1x' : 'Zoom 1.5x';
};

let floatIdx = 0;
function tick(){
  if (!drag) {
    if (autoSpin) {
      floatIdx += 0.22;
      show(floatIdx);
    } else if (Math.abs(velocity) > 0.04) {
      floatIdx += velocity;
      velocity *= 0.92;
      show(floatIdx);
    } else {
      floatIdx = idx;
    }
  } else {
    floatIdx = idx;
  }
  requestAnimationFrame(tick);
}
tick();
</script>
</body>
</html>`;
}

/* ==========================================================================
   UTILITÁRIOS & OVERLAYS HTML/CSS
   ========================================================================== */
function slugify(str) {
  return String(str || 'movel')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'movel';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function createOverlays() {
  // 1. Overlay WebXR Nativo
  const arOverlay = document.createElement('div');
  arOverlay.id = 'zfXrOverlay';
  arOverlay.className = 'zf-ar-overlay hidden';
  arOverlay.innerHTML = `
    <div class="zf-ar-top">
      <div class="zf-ar-pill" data-ar-spec>Tamanho Real 1:1</div>
      <button type="button" class="zf-ar-close" data-ar-close>✕ Sair</button>
    </div>
    <div class="zf-ar-status" data-ar-status>Aponte para o chão...</div>
    <div class="zf-ar-bottom">
      <button type="button" class="zf-ar-btn" data-ar-rot-left>↺ -15°</button>
      <button type="button" class="zf-ar-btn primary" data-ar-place>Fixar no local</button>
      <button type="button" class="zf-ar-btn" data-ar-doors>Portas / LED</button>
      <button type="button" class="zf-ar-btn" data-ar-rot-right>↻ +15°</button>
    </div>
  `;
  document.body.appendChild(arOverlay);

  // 2. Overlay Câmera ao Vivo Calibrada (iPhone / Desktop / Fallback)
  const fallbackOverlay = document.createElement('div');
  fallbackOverlay.id = 'zfFallbackArOverlay';
  fallbackOverlay.className = 'zf-fb-overlay hidden';
  fallbackOverlay.innerHTML = `
    <video id="arFallbackVideo" autoplay playsinline muted></video>
    <div id="arFallbackCanvasMount"></div>
    <div class="zf-ar-top">
      <div class="zf-ar-pill" data-ar-spec>Tamanho Real 1:1</div>
      <div class="zf-ar-top-btns">
        <button type="button" class="zf-ar-btn" data-fb-flip title="Trocar câmera">⇄ Câmera</button>
        <button type="button" class="zf-ar-close" data-fb-close>✕ Fechar</button>
      </div>
    </div>
    <div class="zf-ar-status" data-fb-status>Arraste o móvel para posicionar no ambiente</div>
    <div class="zf-fb-controls">
      <label class="zf-dist-bar">
        <span>Distância real até o local: <strong id="arDistValue">2,20 m</strong></span>
        <input type="range" id="arDistSlider" min="1.0" max="5.0" step="0.05" value="2.2" />
      </label>
      <div class="zf-ar-bottom">
        <button type="button" class="zf-ar-btn" data-fb-rot-left>↺ Girar</button>
        <button type="button" class="zf-ar-btn" data-fb-doors>Portas / LED</button>
        <button type="button" class="zf-ar-btn primary" data-fb-snap>📸 Foto no local</button>
        <button type="button" class="zf-ar-btn" data-fb-rot-right>Girar ↻</button>
      </div>
    </div>
  `;
  document.body.appendChild(fallbackOverlay);

  // 3. Modal Estúdio 360° Interativo
  const modal360 = document.createElement('div');
  modal360.id = 'zfModal360';
  modal360.className = 'zf-360-modal hidden';
  modal360.innerHTML = `
    <div class="zf-360-card">
      <div class="zf-360-head">
        <div>
          <strong>Imagem 360° Interativa</strong>
          <small>Toque e arraste para girar o móvel em todos os ângulos</small>
        </div>
        <button type="button" class="zf-360-close" data-close-360>✕</button>
      </div>

      <div class="zf-360-progress" data-360-progress-wrap>
        <div class="zf-360-track"><div class="zf-360-fill" data-360-bar></div></div>
        <span data-360-progress-text>Gerando visualização 360°...</span>
      </div>

      <div class="zf-360-viewer hidden" data-360-viewer>
        <img id="preview360Img" alt="Prévia 360 graus do móvel" />
        <span class="zf-360-angle" data-360-angle>0°</span>
        <span class="zf-360-hint">Arraste com o dedo ou mouse para girar 360°</span>
      </div>

      <div class="zf-360-actions hidden" data-360-actions>
        <button type="button" class="btn btn-sage btn-block" data-download-360-html>
          Baixar Imagem 360° Interativa (Toque)
        </button>
        <div class="zf-360-subactions">
          <button type="button" class="btn btn-glass" data-download-360-sprite>
            Baixar Grade 360° (.PNG)
          </button>
          <button type="button" class="btn btn-glass" data-download-png>
            Baixar Foto Atual (.PNG)
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal360);

  return { arOverlay, fallbackOverlay, modal360 };
}

function injectStyles() {
  if (document.getElementById('zf-ar-360-styles')) return;
  const style = document.createElement('style');
  style.id = 'zf-ar-360-styles';
  style.textContent = `
    .zf-ar-overlay, .zf-fb-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 16px; pointer-events: none;
    }
    .zf-fb-overlay { background: #14110f; pointer-events: auto; }
    .zf-ar-overlay.hidden, .zf-fb-overlay.hidden, .zf-360-modal.hidden { display: none !important; }
    #arFallbackVideo {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; z-index: 1;
    }
    #arFallbackCanvasMount {
      position: absolute; inset: 0; z-index: 2; touch-action: none;
    }
    .zf-ar-top, .zf-ar-status, .zf-ar-bottom, .zf-fb-controls {
      position: relative; z-index: 5; pointer-events: auto;
    }
    .zf-ar-top {
      display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    }
    .zf-ar-top-btns { display: flex; gap: 8px; }
    .zf-ar-pill {
      background: rgba(29, 19, 14, 0.82); color: #F7F5F0;
      padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
      backdrop-filter: blur(8px);
    }
    .zf-ar-status {
      align-self: center; background: rgba(29, 19, 14, 0.78); color: #fff;
      padding: 8px 16px; border-radius: 999px; font-size: 13px; text-align: center;
      backdrop-filter: blur(8px); max-width: 92vw;
    }
    .zf-fb-controls {
      display: flex; flex-direction: column; gap: 10px; align-items: center;
    }
    .zf-dist-bar {
      width: 100%; max-width: 440px; background: rgba(29, 19, 14, 0.84);
      color: #F7F5F0; padding: 10px 16px; border-radius: 16px;
      display: flex; flex-direction: column; gap: 6px; font-size: 13px;
      backdrop-filter: blur(8px);
    }
    .zf-dist-bar input[type="range"] { width: 100%; accent-color: #9CAF88; }
    .zf-ar-bottom {
      display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
    }
    .zf-ar-btn, .zf-ar-close {
      border: 1px solid rgba(255,255,255,0.22); background: rgba(29, 19, 14, 0.84);
      color: #fff; padding: 10px 15px; border-radius: 999px; font-size: 13px;
      font-weight: 600; cursor: pointer; backdrop-filter: blur(8px);
    }
    .zf-ar-btn.primary { background: #8FA37B; border-color: #8FA37B; color: #fff; }
    .zf-ar-close { background: rgba(166, 62, 46, 0.9); }

    /* Modal 360° */
    .zf-360-modal {
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(20, 14, 10, 0.68); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .zf-360-card {
      width: 100%; max-width: 520px; background: #FAF8F4; color: #1D130E;
      border-radius: 24px; padding: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      display: flex; flex-direction: column; gap: 14px;
    }
    .zf-360-head {
      display: flex; align-items: center; justify-content: space-between;
    }
    .zf-360-head strong { display: block; font-size: 18px; }
    .zf-360-head small { color: #6B5B4F; font-size: 13px; }
    .zf-360-close {
      width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(29,19,14,0.14);
      background: #fff; cursor: pointer; font-weight: 700;
    }
    .zf-360-progress {
      padding: 36px 16px; text-align: center; display: flex; flex-direction: column; gap: 10px;
    }
    .zf-360-track {
      width: 100%; height: 10px; background: #E7E1D5; border-radius: 999px; overflow: hidden;
    }
    .zf-360-fill {
      width: 0%; height: 100%; background: #8FA37B; transition: width 0.1s linear;
    }
    .zf-360-viewer {
      position: relative; width: 100%; aspect-ratio: 1/1; background: #F4F1EA;
      border-radius: 18px; overflow: hidden; touch-action: none; cursor: grab;
      user-select: none; border: 1px solid rgba(29,19,14,0.08);
    }
    .zf-360-viewer:active { cursor: grabbing; }
    .zf-360-viewer img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
    .zf-360-angle {
      position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.92);
      padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
    }
    .zf-360-hint {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(29,19,14,0.78); color: #fff; font-size: 12px;
      padding: 5px 12px; border-radius: 999px; white-space: nowrap;
    }
    .zf-360-actions { display: flex; flex-direction: column; gap: 8px; }
    .zf-360-subactions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  `;
  document.head.appendChild(style);
}
