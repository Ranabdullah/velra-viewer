import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------
const threeContainer = document.getElementById('three-container');
const viewport = document.getElementById('three-viewport') || document.getElementById('app') || threeContainer;
const loadingEl = document.getElementById('loading');
const barFill = document.getElementById('bar-fill');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const topBar = document.getElementById('top-bar');
const hintEl = document.getElementById('hint');
const infoPanel = document.getElementById('info-panel');
const btnWalkthrough = document.getElementById('btn-walkthrough');
const btnTopdown = document.getElementById('btn-topdown');
const btnToggleDims = document.getElementById('btn-toggle-dims');
const toastEl = document.getElementById('toast');
const btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
const fsBtnText = document.getElementById('fs-btn-text');

// Camera Director Studio DOM
const cameraStudioToggle = document.getElementById('camera-studio-toggle');
const cameraStudioPanel = document.getElementById('camera-studio-panel');
const btnTopbarStudio = document.getElementById('btn-topbar-studio');
const btnAdjustStart = document.getElementById('btn-adjust-start');
const btnCloseStudio = document.getElementById('btn-close-studio');
const camCoordsEl = document.getElementById('cam-coords');
const btnSaveStart = document.getElementById('btn-save-start');
const btnSaveEntrance = document.getElementById('btn-save-entrance');
const btnSaveCounter = document.getElementById('btn-save-counter');
const btnSaveShowcase = document.getElementById('btn-save-showcase');
const btnSaveFragrance = document.getElementById('btn-save-fragrance');
const btnCopyCam = document.getElementById('btn-copy-cam');
const btnResetCam = document.getElementById('btn-reset-cam');

// Lightbox DOM
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDesc = document.getElementById('lightbox-desc');
const lightboxCounter = document.getElementById('lightbox-counter');
const btnCloseLightbox = document.getElementById('btn-close-lightbox');
const btnPrevLightbox = document.getElementById('btn-prev-lightbox');
const btnNextLightbox = document.getElementById('btn-next-lightbox');
const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));

// Sign-Off DOM
const btnConfirmSign = document.getElementById('btn-confirm-sign');
const signNameInput = document.getElementById('sign-name');
const signStamp = document.getElementById('sign-stamp');
const signStampText = document.getElementById('sign-stamp-text');
const btnPrintDossier = document.getElementById('btn-print-dossier');
const btnPrintHandover = document.getElementById('btn-print-handover');

// ---------------------------------------------------------------------------
// Utility: Camera Angles & LocalStorage
// ---------------------------------------------------------------------------
function loadSavedCam(key, defaultPos, defaultLookAt) {
  try {
    const raw = localStorage.getItem('velra_cam_' + key);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        pos: new THREE.Vector3(p.pos.x, p.pos.y, p.pos.z),
        lookAt: new THREE.Vector3(p.lookAt.x, p.lookAt.y, p.lookAt.z)
      };
    }
  } catch (e) {}
  return { pos: defaultPos.clone(), lookAt: defaultLookAt.clone() };
}

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 2200);
}

// User-calibrated exterior and interior default views
const CALIBRATED_START = loadSavedCam('start', new THREE.Vector3(2.45, 1.62, 4.60), new THREE.Vector3(2.45, 1.55, 0.15));
const EXTERIOR_POS = CALIBRATED_START.pos;
const EXTERIOR_LOOKAT = CALIBRATED_START.lookAt;

const DEFAULT_EXTERIOR = { pos: EXTERIOR_POS.clone(), lookAt: EXTERIOR_LOOKAT.clone() };
const DEFAULT_ENTRANCE = loadSavedCam('entrance', new THREE.Vector3(4.18, 1.64, -0.69), new THREE.Vector3(2.46, 1.11, -3.80));
const DEFAULT_COUNTER = loadSavedCam('counter', new THREE.Vector3(4.13, 1.98, -1.94), new THREE.Vector3(2.41, 0.56, -4.07));
const DEFAULT_SHOWCASE = loadSavedCam('showcase', new THREE.Vector3(4.64, 2.38, -4.18), new THREE.Vector3(3.45, 2.03, -4.18));

const INTERIOR_ENTRY_POS = DEFAULT_ENTRANCE.pos;
const INTERIOR_ENTRY_LOOKAT = DEFAULT_ENTRANCE.lookAt;

const TOPDOWN_POS = new THREE.Vector3(2.4, 11.0, -3.6);
const TOPDOWN_LOOKAT = new THREE.Vector3(2.4, 0, -3.6);

const WAYPOINTS = {
  entrance: DEFAULT_ENTRANCE,
  counter: DEFAULT_COUNTER,
  showcase: DEFAULT_SHOWCASE,
  'perfume-wall': { pos: new THREE.Vector3(1.5, 1.6, -2.4), lookAt: new THREE.Vector3(4.2, 1.45, -4.6) }
};

let currentMode = 'exterior';
let showDimensions = false;
let isInside = false;
let selectedTarget = null;

// ---------------------------------------------------------------------------
// Scene & Renderer Setup (Responsive to Viewport)
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e11);

function getContainerSize() {
  const w = viewport ? (viewport.clientWidth || window.innerWidth) : window.innerWidth;
  const h = viewport ? (viewport.clientHeight || window.innerHeight) : window.innerHeight;
  return { width: Math.max(w, 320), height: Math.max(h, 320) };
}

const initialSize = getContainerSize();

const camera = new THREE.PerspectiveCamera(
  42,
  initialSize.width / initialSize.height,
  0.05,
  120
);
camera.position.copy(EXTERIOR_POS);
camera.lookAt(EXTERIOR_LOOKAT);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(initialSize.width, initialSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.4;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.copy(EXTERIOR_LOOKAT);
controls.enabled = false; // Locked until 'Enter Showroom' is clicked

// ---------------------------------------------------------------------------
// Post-Processing: Crisp Outline & Controlled Bloom
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
  new THREE.Vector2(initialSize.width, initialSize.height),
  scene,
  camera
);
outlinePass.edgeStrength = 4.5;
outlinePass.edgeGlow = 0.6;
outlinePass.edgeThickness = 1.6;
outlinePass.pulsePeriod = 0;
outlinePass.visibleEdgeColor.set(0xffffff); // Crisp white selection
outlinePass.hiddenEdgeColor.set(0xffffff);
outlinePass.selectedObjects = [];
composer.addPass(outlinePass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(initialSize.width, initialSize.height),
  0.18, // Subtle bloom
  0.30,
  1.20  // Higher threshold prevents floor blowouts
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// ---------------------------------------------------------------------------
// HDRI Environment & Balanced Balanced Lighting
// ---------------------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new EXRLoader().load(
  '/assets/urban_street_02_2k.exr',
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  },
  undefined,
  (err) => console.warn('Could not load EXR HDRI:', err)
);

const hemiLight = new THREE.HemisphereLight(0xfff6ea, 0x222228, 0.45);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff2de, 0.75);
sunLight.position.set(5, 8, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 30;
sunLight.shadow.camera.left = -9;
sunLight.shadow.camera.right = 9;
sunLight.shadow.camera.top = 9;
sunLight.shadow.camera.bottom = -9;
scene.add(sunLight);

const interiorLightsGroup = new THREE.Group();

const ceilingLight1 = new THREE.PointLight(0xffe8c8, 1.3, 9, 2.0);
ceilingLight1.position.set(2.4, 2.6, -2.0);
interiorLightsGroup.add(ceilingLight1);

const ceilingLight2 = new THREE.PointLight(0xffe8c8, 1.4, 9, 2.0);
ceilingLight2.position.set(2.4, 2.6, -4.8);
interiorLightsGroup.add(ceilingLight2);

const counterSpot = new THREE.SpotLight(0xfff4e2, 2.2, 8, Math.PI / 4, 0.7, 1.5);
counterSpot.position.set(2.4, 2.75, -4.15);
counterSpot.target.position.set(2.4, 0.5, -4.15);
interiorLightsGroup.add(counterSpot);
interiorLightsGroup.add(counterSpot.target);

const leftShowcaseSpot = new THREE.PointLight(0xffdfa8, 1.2, 7, 1.8);
leftShowcaseSpot.position.set(1.2, 2.2, -4.0);
interiorLightsGroup.add(leftShowcaseSpot);

const rightShowcaseSpot = new THREE.PointLight(0xffdfa8, 1.2, 7, 1.8);
rightShowcaseSpot.position.set(3.6, 2.2, -4.0);
interiorLightsGroup.add(rightShowcaseSpot);

scene.add(interiorLightsGroup);

// ---------------------------------------------------------------------------
// Model Loading & Material Enhancements
// ---------------------------------------------------------------------------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let sceneRoot = null;
const ceilingMeshes = [];
const frontSideMeshes = [];
let floorMesh = null;
const counterMeshes = [];
const shelfMeshes = [];

function enhanceMaterial(mat) {
  if (!mat) return;
  const name = (mat.name || '').toLowerCase();

  // Emissive Light Strips
  if (
    name.includes('light') ||
    name.includes('ar3dmat') ||
    name.includes('lamp') ||
    name.includes('emissive') ||
    name === 'background light'
  ) {
    mat.emissive = new THREE.Color(0xffe8b4);
    mat.emissiveIntensity = 2.0;
  }
  // Floor Material
  else if (name.includes('floor')) {
    mat.roughness = 0.42;
    mat.metalness = 0.0;
    mat.envMapIntensity = 0.35;
  }
  else if (name.includes('marble') || name.includes('calacatta')) {
    mat.roughness = 0.28;
    mat.metalness = 0.02;
    mat.envMapIntensity = 0.7;
  }
  // Gold Trims & Signage
  else if (
    name.includes('gold') ||
    name.includes('palegold') ||
    name.includes('metallic') ||
    name.includes('metalic') ||
    name.includes('brass') ||
    name.includes('geometric') ||
    name === 'pattern_gold'
  ) {
    mat.metalness = 0.95;
    mat.roughness = 0.22;
    mat.envMapIntensity = 1.6;
  }
  // Glass Shelves & Storefront
  else if (name.includes('glass') || name.includes('window')) {
    mat.transparent = true;
    mat.opacity = 0.32;
    mat.roughness = 0.08;
    mat.metalness = 0.1;
    mat.envMapIntensity = 1.2;
  }
  // Perfume Liquids
  else if (name.includes('liquid') || name.includes('perfume')) {
    mat.transparent = true;
    mat.opacity = 0.85;
    mat.roughness = 0.08;
    mat.metalness = 0.1;
  }
  // Plaster Walls
  else if (name.includes('plaster') || name.includes('wall')) {
    mat.roughness = 0.88;
    mat.metalness = 0.0;
    mat.envMapIntensity = 0.3;
  }
}

loader.load(
  '/assets/model.glb',
  (gltf) => {
    sceneRoot = gltf.scene;

    sceneRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(enhanceMaterial);
          } else {
            enhanceMaterial(child.material);
          }
        }

        const nameLower = child.name.toLowerCase();
        const box = new THREE.Box3().setFromObject(child);

        if (
          nameLower.includes('ceiling') ||
          nameLower.includes('roof') ||
          (box.min.y >= 2.3 && box.max.z < 0.2)
        ) {
          ceilingMeshes.push(child);
        } else if (nameLower.includes('floor')) {
          floorMesh = child;
        }

        if (
          (box.min.z > -0.6 || box.max.z > 0.05) &&
          box.min.y > 0.4 &&
          !nameLower.includes('floor') &&
          !nameLower.includes('road') &&
          !nameLower.includes('ground') &&
          !nameLower.includes('counter')
        ) {
          frontSideMeshes.push(child);
        }

        if (nameLower.includes('counter')) {
          counterMeshes.push(child);
        } else if (nameLower.includes('shelf') || nameLower.includes('showcase')) {
          shelfMeshes.push(child);
        }
      }
    });

    scene.add(sceneRoot);
    if (loadingEl) loadingEl.style.display = 'none';

    buildInSceneDimensionBadges();
    buildFloorPlanDimensions();

    dimensionBadgesGroup.visible = false;
    floorPlanDimensionsGroup.visible = false;
  },
  (progress) => {
    if (progress.total && barFill) {
      barFill.style.width = Math.min(100, (progress.loaded / progress.total) * 100) + '%';
    }
  },
  (error) => {
    console.error('Failed to load model.glb:', error);
    if (loadingEl) loadingEl.querySelector('div').textContent = 'Could not load model.glb';
  }
);

// ---------------------------------------------------------------------------
// Camera Animation (flyTo)
// ---------------------------------------------------------------------------
let isAnimatingCamera = false;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function flyTo(targetPos, targetLookAt, duration = 1800, onComplete = null) {
  isAnimatingCamera = true;
  controls.enabled = false;

  const startPos = camera.position.clone();
  const startLookAt = controls.target.clone();
  const t0 = performance.now();

  function step(now) {
    const elapsed = Math.min(1, (now - t0) / duration);
    const eased = easeInOutCubic(elapsed);

    camera.position.lerpVectors(startPos, targetPos, eased);
    const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, eased);
    controls.target.copy(currentLookAt);
    camera.lookAt(currentLookAt);

    if (elapsed < 1) {
      requestAnimationFrame(step);
    } else {
      isAnimatingCamera = false;
      controls.target.copy(targetLookAt);
      controls.enabled = true;
      controls.update();
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// Interior Collision Detection
// ---------------------------------------------------------------------------
function resolveInteriorCollisions() {
  if (!isInside || currentMode !== 'walkthrough' || isAnimatingCamera) return;

  const MIN_X = 0.70;
  const MAX_X = 4.15;
  const MIN_Y = 1.05;
  const MAX_Y = 2.45;
  const MIN_Z = -6.55;
  const MAX_Z = -0.50;

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, MIN_X, MAX_X);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, MIN_Y, MAX_Y);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, MIN_Z, MAX_Z);
}

// ---------------------------------------------------------------------------
// Dimension Badges & Architectural Lines
// ---------------------------------------------------------------------------
const dimensionBadgesGroup = new THREE.Group();
dimensionBadgesGroup.visible = false;
scene.add(dimensionBadgesGroup);

function createTextBadge(title, dimsText, accentColor = '#d4af37') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 380;
  canvas.height = 96;

  ctx.fillStyle = 'rgba(12, 12, 16, 0.92)';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.40)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(4, 4, 372, 88, 16);
  ctx.fill();
  ctx.stroke();

  if (title) {
    ctx.fillStyle = accentColor;
    ctx.font = '600 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title.toUpperCase(), 190, 14);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = title ? 'top' : 'middle';
  ctx.fillText(dimsText, 190, title ? 46 : 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, opacity: 0.85 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.60, 0.15, 1);
  return sprite;
}

function buildInSceneDimensionBadges() {
  dimensionBadgesGroup.clear();

  const counterBadge = createTextBadge('Island Counter', '238 × 98 × 82 cm');
  counterBadge.position.set(2.4, 1.25, -4.15);
  dimensionBadgesGroup.add(counterBadge);

  const bigShowcaseBadge = createTextBadge('Arched Showcase', '110 × 240 × 35 cm');
  bigShowcaseBadge.position.set(0.65, 1.65, -4.0);
  dimensionBadgesGroup.add(bigShowcaseBadge);

  const smallShelfBadge = createTextBadge('Niche Shelf', '65 × 180 × 25 cm');
  smallShelfBadge.position.set(4.2, 1.65, -4.0);
  dimensionBadgesGroup.add(smallShelfBadge);

  const wcSignBadge = createTextBadge('WC Restroom Door', '77 × 210 cm');
  wcSignBadge.position.set(3.8, 1.80, -6.6);
  dimensionBadgesGroup.add(wcSignBadge);
}

const floorPlanDimensionsGroup = new THREE.Group();
floorPlanDimensionsGroup.visible = false;
scene.add(floorPlanDimensionsGroup);

function createArchitecturalBadge(dimsText, colorHex = '#ef4444') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 240;
  canvas.height = 70;

  ctx.fillStyle = 'rgba(10, 14, 20, 0.95)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 4, 232, 62, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colorHex;
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dimsText, 120, 35);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.65, 0.19, 1);
  return sprite;
}

function createArchitecturalDimension({
  start,
  end,
  labelText,
  color = 0xef4444,
  colorHex = '#ef4444',
  witnessLen = 0.30,
  arrowSize = 0.14,
  offsetLabel = new THREE.Vector3(0, 0.12, 0)
}) {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, depthTest: false });

  const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
  const mainLine = new THREE.Line(lineGeo, mat);
  group.add(mainLine);

  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

  function makeWitness(pt) {
    const p1 = pt.clone().addScaledVector(perp, witnessLen * 0.5);
    const p2 = pt.clone().addScaledVector(perp, -witnessLen * 0.5);
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), mat);
  }
  group.add(makeWitness(start));
  group.add(makeWitness(end));

  function makeArrow(pt, toward) {
    const tip = pt.clone();
    const back = pt.clone().addScaledVector(toward, arrowSize);
    const left = back.clone().addScaledVector(perp, arrowSize * 0.45);
    const right = back.clone().addScaledVector(perp, -arrowSize * 0.45);
    const geo = new THREE.BufferGeometry().setFromPoints([left, tip, right]);
    return new THREE.Line(geo, mat);
  }
  group.add(makeArrow(start, dir));
  group.add(makeArrow(end, dir.clone().negate()));

  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const badge = createArchitecturalBadge(labelText, colorHex);
  badge.position.copy(mid).add(offsetLabel);
  group.add(badge);

  return group;
}

function buildFloorPlanDimensions() {
  floorPlanDimensionsGroup.clear();
  const yLevel = 0.40;

  // 1. Back Wall Span (543 cm)
  floorPlanDimensionsGroup.add(
    createArchitecturalDimension({
      start: new THREE.Vector3(0.30, yLevel, -7.05),
      end: new THREE.Vector3(4.55, yLevel, -7.05),
      labelText: '543 cm',
      offsetLabel: new THREE.Vector3(0, 0, -0.45)
    })
  );

  // 2. Front Glazing Span (590 cm)
  floorPlanDimensionsGroup.add(
    createArchitecturalDimension({
      start: new THREE.Vector3(0.00, yLevel, 0.40),
      end: new THREE.Vector3(4.85, yLevel, 0.40),
      labelText: '590 cm',
      offsetLabel: new THREE.Vector3(0, 0, 0.45)
    })
  );

  // 3. Store Depth (730 cm)
  floorPlanDimensionsGroup.add(
    createArchitecturalDimension({
      start: new THREE.Vector3(-0.35, yLevel, 0.20),
      end: new THREE.Vector3(-0.35, yLevel, -6.90),
      labelText: '730 cm',
      offsetLabel: new THREE.Vector3(-0.55, 0, 0)
    })
  );

  // 4. WC Doorway Clearance (77 cm)
  floorPlanDimensionsGroup.add(
    createArchitecturalDimension({
      start: new THREE.Vector3(3.90, yLevel, -6.65),
      end: new THREE.Vector3(4.52, yLevel, -6.65),
      labelText: '77 cm',
      color: 0x38bdf8,
      colorHex: '#38bdf8',
      offsetLabel: new THREE.Vector3(0, 0, 0.35)
    })
  );
}

// ---------------------------------------------------------------------------
// Raycasting & Object Selection
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getObjectMetadata(mesh) {
  const name = (mesh.name || '').toLowerCase();

  if (name.includes('counter')) {
    return {
      category: 'Consultation Joinery',
      name: 'Central Consultation Island',
      desc: 'Custom 240 × 90 × 95 cm consultation bar with bookmatched marble countertop, fluted brass pedestal base, and lockable fragrance tester vitrines.',
      w: '240 cm', h: '95 cm', d: '90 cm',
      details: 'Bookmatched Italian Marble top, PVD brushed gold base, 3000K LED vitrine.'
    };
  } else if (name.includes('shelf') || name.includes('showcase') || name.includes('wall')) {
    return {
      category: 'Display Architecture',
      name: 'Illuminated Perfume Feature Wall',
      desc: 'Modular 240 × 90 × 35 cm full-height display units with geometric 3D relief gold backplates and 3000K edge-lit floating glass shelves.',
      w: '90 cm', h: '240 cm', d: '35 cm',
      details: 'Concealed 24V LED channels, 1.0 cm tempered glass, bottom stock drawers.'
    };
  } else if (name.includes('floor')) {
    return {
      category: 'Architectural Surface',
      name: 'Italian Porcelain Marble Flooring',
      desc: 'Bookmatched polished porcelain tile with delicate warm amber veining and 1.5mm color-matched epoxy grout.',
      w: '120 cm', h: '1 cm', d: '60 cm',
      details: 'High-gloss polished finish, R9 slip rating, brass threshold trims.'
    };
  } else if (name.includes('door') || name.includes('wc') || name.includes('sign')) {
    return {
      category: 'Service Corridor',
      name: 'Concealed Restroom / Service Door',
      desc: 'Seamlessly integrated flush pivot door (~77 cm clearance) matching wall cladding with magnetic acoustic drop seal.',
      w: '77 cm', h: '210 cm', d: '5 cm',
      details: 'Concealed pivot hinge, acoustic perimeter drop seal, staff access.'
    };
  }

  return {
    category: 'Showroom Element',
    name: mesh.name || 'Architectural Component',
    desc: 'Bespoke interior element finished to Velra Perfumes luxury retail standards.',
    w: 'Custom', h: 'Custom', d: 'Custom',
    details: 'PVD Brushed Gold, Low-Iron Glass, Bookmatched Marble.'
  };
}

function handleObjectSelection(mesh) {
  selectedTarget = mesh;
  const meta = getObjectMetadata(mesh);

  if (mesh.name.toLowerCase().includes('counter')) {
    outlinePass.selectedObjects = counterMeshes.length ? counterMeshes : [mesh];
  } else {
    outlinePass.selectedObjects = [mesh];
  }

  if (infoPanel) {
    infoPanel.innerHTML = `
      <div class="header-row">
        <span class="category">${meta.category}</span>
        <button class="close-btn" id="btn-close-info">&times;</button>
      </div>
      <div class="name">${meta.name}</div>
      <div class="desc">${meta.desc}</div>
      <div class="section-title">Verified Specifications</div>
      <div class="dim-grid">
        <div class="dim-box"><span class="dim-lbl">Length/W</span><span class="dim-val">${meta.w}</span></div>
        <div class="dim-box"><span class="dim-lbl">Height</span><span class="dim-val">${meta.h}</span></div>
        <div class="dim-box"><span class="dim-lbl">Depth</span><span class="dim-val">${meta.d}</span></div>
      </div>
      <div class="design-details">${meta.details}</div>
    `;
    infoPanel.classList.add('visible');

    const closeBtn = document.getElementById('btn-close-info');
    if (closeBtn) closeBtn.addEventListener('click', clearSelection);
  }
}

function clearSelection() {
  selectedTarget = null;
  outlinePass.selectedObjects = [];
  if (infoPanel) infoPanel.classList.remove('visible');
}

let pointerDownPos = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('click', (e) => {
  if (!controls.enabled || !sceneRoot) return;
  if (!isInside && currentMode === 'exterior') return;

  const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dragDist > 10) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(sceneRoot, true);

  if (hits.length > 0) {
    handleObjectSelection(hits[0].object);
  } else {
    clearSelection();
  }
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!controls.enabled || !sceneRoot) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(sceneRoot, true);

  if (hits.length > 0) {
    renderer.domElement.style.cursor = 'pointer';
    if (!selectedTarget) {
      outlinePass.selectedObjects = hits[0].object.name.toLowerCase().includes('counter') ? counterMeshes : [hits[0].object];
    }
  } else {
    renderer.domElement.style.cursor = 'default';
    if (!selectedTarget) {
      outlinePass.selectedObjects = [];
    }
  }
});

// ---------------------------------------------------------------------------
// View Mode Switching (Walkthrough vs Top-Down)
// ---------------------------------------------------------------------------
function setViewMode(mode) {
  if (currentMode === mode || isAnimatingCamera) return;
  currentMode = mode;
  clearSelection();

  if (mode === 'topdown') {
    if (btnWalkthrough) btnWalkthrough.classList.remove('active');
    if (btnTopdown) btnTopdown.classList.add('active');

    ceilingMeshes.forEach((m) => (m.visible = false));
    frontSideMeshes.forEach((m) => (m.visible = false));

    sunLight.intensity = 0.25;
    hemiLight.intensity = 0.50;
    bloomPass.strength = 0.05;
    renderer.toneMappingExposure = 0.82;
    scene.background = new THREE.Color(0x0c1017);

    floorPlanDimensionsGroup.visible = showDimensions;
    dimensionBadgesGroup.visible = false;

    controls.maxDistance = 25.0;
    controls.minDistance = 2.0;

    flyTo(TOPDOWN_POS, TOPDOWN_LOOKAT, 1600);
  } else if (mode === 'walkthrough') {
    if (btnTopdown) btnTopdown.classList.remove('active');
    if (btnWalkthrough) btnWalkthrough.classList.add('active');

    ceilingMeshes.forEach((m) => (m.visible = true));
    frontSideMeshes.forEach((m) => (m.visible = true));

    sunLight.intensity = 0.75;
    hemiLight.intensity = 0.45;
    bloomPass.strength = 0.18;
    renderer.toneMappingExposure = 0.88;
    scene.background = new THREE.Color(0x0e0e11);

    floorPlanDimensionsGroup.visible = false;
    dimensionBadgesGroup.visible = showDimensions;

    controls.maxDistance = 4.2;
    controls.minDistance = 0.4;

    flyTo(INTERIOR_ENTRY_POS, INTERIOR_ENTRY_LOOKAT, 1600);
  }
}

if (btnWalkthrough) btnWalkthrough.addEventListener('click', () => setViewMode('walkthrough'));
if (btnTopdown) btnTopdown.addEventListener('click', () => setViewMode('topdown'));

if (btnToggleDims) {
  btnToggleDims.addEventListener('click', () => {
    showDimensions = !showDimensions;
    btnToggleDims.classList.toggle('active', showDimensions);

    if (currentMode === 'topdown') {
      floorPlanDimensionsGroup.visible = showDimensions;
      dimensionBadgesGroup.visible = false;
    } else {
      floorPlanDimensionsGroup.visible = false;
      dimensionBadgesGroup.visible = showDimensions;
    }
  });
}

// Waypoint Navigation Buttons
document.querySelectorAll('.btn-group button[data-target]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const targetKey = e.currentTarget.getAttribute('data-target');
    const waypoint = WAYPOINTS[targetKey];
    if (waypoint) {
      if (currentMode === 'topdown' || currentMode === 'exterior') {
        currentMode = 'walkthrough';
        if (btnTopdown) btnTopdown.classList.remove('active');
        if (btnWalkthrough) btnWalkthrough.classList.add('active');
        ceilingMeshes.forEach((m) => (m.visible = true));
        frontSideMeshes.forEach((m) => (m.visible = true));
        sunLight.intensity = 0.75;
        hemiLight.intensity = 0.45;
        bloomPass.strength = 0.18;
        renderer.toneMappingExposure = 0.88;
        scene.background = new THREE.Color(0x0e0e11);
        floorPlanDimensionsGroup.visible = false;
        dimensionBadgesGroup.visible = showDimensions;
      }
      flyTo(waypoint.pos, waypoint.lookAt, 1400);
    }
  });
});

// ---------------------------------------------------------------------------
// Camera Director Studio Controls
// ---------------------------------------------------------------------------
if (cameraStudioPanel) {
  function openStudio() {
    cameraStudioPanel.classList.add('visible');
    controls.enabled = true;
    showToast('🎥 Camera Director active: orbit to position camera');
  }

  function closeStudio() {
    cameraStudioPanel.classList.remove('visible');
  }

  if (cameraStudioToggle) cameraStudioToggle.addEventListener('click', openStudio);
  if (btnTopbarStudio) btnTopbarStudio.addEventListener('click', openStudio);
  if (btnAdjustStart) btnAdjustStart.addEventListener('click', openStudio);
  if (btnCloseStudio) btnCloseStudio.addEventListener('click', closeStudio);

  function saveCurrentCam(key, label) {
    const data = {
      pos: { x: parseFloat(camera.position.x.toFixed(2)), y: parseFloat(camera.position.y.toFixed(2)), z: parseFloat(camera.position.z.toFixed(2)) },
      lookAt: { x: parseFloat(controls.target.x.toFixed(2)), y: parseFloat(controls.target.y.toFixed(2)), z: parseFloat(controls.target.z.toFixed(2)) }
    };
    localStorage.setItem('velra_cam_' + key, JSON.stringify(data));
    showToast(`Saved as ${label}!`);
  }

  if (btnSaveStart) btnSaveStart.addEventListener('click', () => saveCurrentCam('start', 'Start View'));
  if (btnSaveEntrance) btnSaveEntrance.addEventListener('click', () => saveCurrentCam('entrance', 'Entrance View'));
  if (btnSaveCounter) btnSaveCounter.addEventListener('click', () => saveCurrentCam('counter', 'Counter View'));
  if (btnSaveShowcase) btnSaveShowcase.addEventListener('click', () => saveCurrentCam('showcase', 'Showcase View'));
  if (btnSaveFragrance) btnSaveFragrance.addEventListener('click', () => saveCurrentCam('perfume-wall', 'Fragrance Wall View'));

  if (btnCopyCam) {
    btnCopyCam.addEventListener('click', () => {
      const rx = (THREE.MathUtils.radToDeg(camera.rotation.x)).toFixed(2);
      const ry = (THREE.MathUtils.radToDeg(camera.rotation.y)).toFixed(2);
      const rz = (THREE.MathUtils.radToDeg(camera.rotation.z)).toFixed(2);
      const code = `const POS = new THREE.Vector3(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)});\nconst TARGET = new THREE.Vector3(${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)});\n// Rot: (${rx}°, ${ry}°, ${rz}°)`;
      navigator.clipboard.writeText(code).then(() => showToast('Copied coordinates to clipboard!'));
    });
  }

  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      localStorage.clear();
      showToast('Reset saved angles! Refreshing...');
      setTimeout(() => window.location.reload(), 800);
    });
  }
}

// ---------------------------------------------------------------------------
// Enter Showroom Button Transition
// ---------------------------------------------------------------------------
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (startOverlay) startOverlay.classList.add('hidden');
    isInside = true;
    currentMode = 'walkthrough';
    controls.maxDistance = 4.2;
    controls.minDistance = 0.4;

    flyTo(INTERIOR_ENTRY_POS, INTERIOR_ENTRY_LOOKAT, 2400, () => {
      controls.enabled = true;
      if (topBar) topBar.classList.add('visible');
      if (hintEl) hintEl.classList.add('visible');
    });
  });
}

// ---------------------------------------------------------------------------
// Fullscreen 3D Toggle
// ---------------------------------------------------------------------------
if (btnFullscreenToggle && threeContainer) {
  btnFullscreenToggle.addEventListener('click', () => {
    const isFs = threeContainer.classList.toggle('fullscreen');
    if (fsBtnText) fsBtnText.textContent = isFs ? 'Exit Fullscreen' : 'Fullscreen 3D';
    updateViewportSize();
  });
}

// ---------------------------------------------------------------------------
// Resize Handling
// ---------------------------------------------------------------------------
function updateViewportSize() {
  const { width, height } = getContainerSize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
  outlinePass.setSize(width, height);
  bloomPass.setSize(width, height);
}

window.addEventListener('resize', updateViewportSize);
if (window.ResizeObserver && threeContainer) {
  const ro = new ResizeObserver(() => updateViewportSize());
  ro.observe(threeContainer);
}

// ---------------------------------------------------------------------------
// 4K Render Gallery Lightbox Handler
// ---------------------------------------------------------------------------
let currentGalleryIndex = 0;

function openLightbox(index) {
  if (index < 0 || index >= galleryCards.length) return;
  currentGalleryIndex = index;
  const card = galleryCards[index];
  const src = card.getAttribute('data-src');
  const title = card.getAttribute('data-title');
  const desc = card.getAttribute('data-desc');

  if (lightboxImg) lightboxImg.src = src;
  if (lightboxTitle) lightboxTitle.textContent = title;
  if (lightboxDesc) lightboxDesc.textContent = desc;
  if (lightboxCounter) lightboxCounter.textContent = `PASS ${index + 1} OF ${galleryCards.length}`;
  if (lightboxModal) lightboxModal.classList.add('active');
}

function closeLightbox() {
  if (lightboxModal) lightboxModal.classList.remove('active');
}

galleryCards.forEach((card, idx) => {
  card.addEventListener('click', () => openLightbox(idx));
});

if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);
if (btnPrevLightbox) btnPrevLightbox.addEventListener('click', () => openLightbox((currentGalleryIndex - 1 + galleryCards.length) % galleryCards.length));
if (btnNextLightbox) btnNextLightbox.addEventListener('click', () => openLightbox((currentGalleryIndex + 1) % galleryCards.length));

window.addEventListener('keydown', (e) => {
  if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') openLightbox((currentGalleryIndex - 1 + galleryCards.length) % galleryCards.length);
  if (e.key === 'ArrowRight') openLightbox((currentGalleryIndex + 1) % galleryCards.length);
});

// ---------------------------------------------------------------------------
// Technical Schedule Tabs
// ---------------------------------------------------------------------------
document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');
  });
});

// ---------------------------------------------------------------------------
// Client Review & Sign-Off Portal
// ---------------------------------------------------------------------------
function initSignOff() {
  const savedApproval = localStorage.getItem('velra_handover_approved');
  if (savedApproval && signStamp && signStampText) {
    signStamp.classList.add('verified');
    signStampText.textContent = `VERIFIED APPROVAL RECORDED: ${savedApproval}`;
  }
}
initSignOff();

if (btnConfirmSign) {
  btnConfirmSign.addEventListener('click', () => {
    const signer = (signNameInput && signNameInput.value) || 'Velra Executive Team';
    const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const approvalRecord = `${signer} on ${now} • REV 1.0 FINAL`;
    localStorage.setItem('velra_handover_approved', approvalRecord);

    if (signStamp && signStampText) {
      signStamp.classList.add('verified');
      signStampText.textContent = `VERIFIED APPROVAL RECORDED: ${approvalRecord}`;
    }
    showToast('Handover Approval Saved & Recorded!');
  });
}

function handlePrint() {
  window.print();
}
if (btnPrintDossier) btnPrintDossier.addEventListener('click', handlePrint);
if (btnPrintHandover) btnPrintHandover.addEventListener('click', handlePrint);

// ---------------------------------------------------------------------------
// Animation Loop
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  if (controls.enabled) {
    controls.update();
    resolveInteriorCollisions();

    if (camCoordsEl && cameraStudioPanel && cameraStudioPanel.classList.contains('visible')) {
      const rx = (THREE.MathUtils.radToDeg(camera.rotation.x)).toFixed(1);
      const ry = (THREE.MathUtils.radToDeg(camera.rotation.y)).toFixed(1);
      const rz = (THREE.MathUtils.radToDeg(camera.rotation.z)).toFixed(1);
      camCoordsEl.innerHTML = `Pos: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})<br>Target: (${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)})<br>Rot: (${rx}°, ${ry}°, ${rz}°)`;
    }
  }

  composer.render();
}
animate();
