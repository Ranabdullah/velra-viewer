import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

// ---------------------------------------------------------------------------
// 1. Viewport & Canvas Setup (Performance Optimized)
// ---------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e18);

const camera = new THREE.PerspectiveCamera(
  40,
  container ? (container.clientWidth / container.clientHeight) : (window.innerWidth / window.innerHeight),
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: 'high-performance',
  precision: 'mediump' // Smooth mobile and desktop GPU performance
});
// 1.5x pixel ratio provides ultra-crisp Retina visuals while saving ~45% GPU overhead
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(container ? container.clientWidth : window.innerWidth, container ? container.clientHeight : window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02; // Calibrated realistic exposure
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.4;
controls.maxDistance = 12;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.2;

// ---------------------------------------------------------------------------
// 2. Photorealistic IBL Environment Map (EXR Studio Reflection)
// ---------------------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const exrLoader = new EXRLoader();
exrLoader.load(
  '/assets/urban_street_02_2k.exr',
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.85; // Natural metallic and marble specular reflections
    texture.dispose();
    pmremGenerator.dispose();
    requestRender();
    console.log('Photorealistic EXR Environment Map loaded successfully.');
  },
  undefined,
  (err) => console.warn('Notice loading EXR map:', err)
);

// ---------------------------------------------------------------------------
// 3. Realistic Architectural Retail Lighting Scheme (Optimized Draw-Calls)
// ---------------------------------------------------------------------------
// 3.1 Soft Warm Ambient Base Fill
const ambientLight = new THREE.AmbientLight(0xfff3e0, 0.42);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff0dc, 0x141a28, 0.52);
scene.add(hemiLight);

// 3.2 Key Sun Light (Single Optimized Shadow Map)
const mainSun = new THREE.DirectionalLight(0xfffaee, 1.8);
mainSun.position.set(12, 24, 18);
mainSun.castShadow = true;
mainSun.shadow.mapSize.set(1024, 1024); // Fast, sharp 1024 map with soft filter
mainSun.shadow.bias = -0.0001;
mainSun.shadow.radius = 2.0;
scene.add(mainSun);

// 3.3 Ceiling Cove Warm Uplight
const coveBounce = new THREE.PointLight(0xffe4b5, 1.2, 10, 1.8);
coveBounce.position.set(0, 1.9, 0);
scene.add(coveBounce);

// 3.4 Central Consultation Island Downward Spotlight
const islandSpot = new THREE.SpotLight(0xffedd0, 4.2, 9, Math.PI / 4, 0.7, 1.8);
islandSpot.position.set(0, 2.55, 0.15);
islandSpot.target.position.set(0, 0.85, 0.15);
scene.add(islandSpot);
scene.add(islandSpot.target);

// 3.5 Backwall Brand Monogram Pin-Spot
const monogramSpot = new THREE.SpotLight(0xffdf88, 3.6, 7.5, Math.PI / 3.8, 0.65, 1.8);
monogramSpot.position.set(-0.2, 2.3, -0.8);
monogramSpot.target.position.set(-0.2, 1.4, -2.4);
scene.add(monogramSpot);
scene.add(monogramSpot.target);

// 3.6 Right Perfume Wall Alcoves Downward Grazer
const rightWallSpot = new THREE.SpotLight(0xffebd0, 3.4, 7.5, Math.PI / 3, 0.75, 1.8);
rightWallSpot.position.set(1.4, 2.45, 0.5);
rightWallSpot.target.position.set(1.6, 0.8, 0.5);
scene.add(rightWallSpot);
scene.add(rightWallSpot.target);

// 3.7 Left Perfume Wall Alcoves Downward Grazer
const leftWallSpot = new THREE.SpotLight(0xffebd0, 3.4, 7.5, Math.PI / 3, 0.75, 1.8);
leftWallSpot.position.set(-1.4, 2.45, 0.5);
leftWallSpot.target.position.set(-1.6, 0.8, 0.5);
scene.add(leftWallSpot);
scene.add(leftWallSpot.target);

// 3.8 Storefront Vitrine Accent
const storefrontPoint = new THREE.PointLight(0xfffaea, 2.0, 7, 1.6);
storefrontPoint.position.set(0, 2.0, 3.4);
scene.add(storefrontPoint);

// ---------------------------------------------------------------------------
// 4. GLTF Loader & Physically Based Material (PBR) Shaders
// ---------------------------------------------------------------------------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

let modelRoot = null;
let currentPresetKey = 'front';

function enhanceMeshMaterial(mesh) {
  if (!mesh.material) return;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  
  mats.forEach(mat => {
    const matName = (mat.name || '').toLowerCase();
    const meshName = (mesh.name || '').toLowerCase();

    // 1. Gold / Brass PVD Metals
    if (matName.includes('gold') || matName.includes('brass') || meshName.includes('brass') || meshName.includes('gold') || matName.includes('m03') || matName.includes('m04')) {
      mat.metalness = 0.98;
      mat.roughness = 0.15;
      mat.color = new THREE.Color(0xd4af37);
      mat.emissive = new THREE.Color(0x1a1204);
      mat.emissiveIntensity = 0.25;
    } 
    // 2. Calacatta Gold Marble Flooring & Island Counter
    else if (matName.includes('marble') || matName.includes('calacatta') || matName.includes('floor') || meshName.includes('floor') || matName.includes('m02') || matName.includes('m06')) {
      mat.roughness = 0.12;
      mat.metalness = 0.04;
      mat.color = new THREE.Color(0xfcfaf6);
    } 
    // 3. Architectural Alabaster Walls & Niches
    else if (matName.includes('wall') || matName.includes('plaster') || meshName.includes('wall') || matName.includes('cement')) {
      mat.color = new THREE.Color(0xf3efe6);
      mat.roughness = 0.88;
      mat.metalness = 0.0;
    } 
    // 4. Low-Iron Ultra-Clear Vitrine Glass
    else if (matName.includes('glass') || matName.includes('vitrine') || matName.includes('window') || meshName.includes('glass')) {
      mat.transparent = true;
      mat.opacity = 0.22;
      mat.roughness = 0.02;
      mat.metalness = 0.10;
      mat.color = new THREE.Color(0xf5f8fa);
    } 
    // 5. Emissive Lighting Strips & Monogram Signage
    else if (matName.includes('light') || matName.includes('lamp') || matName.includes('emissive') || meshName.includes('text') || meshName.includes('signage')) {
      mat.emissive = new THREE.Color(0xffdf88);
      mat.emissiveIntensity = 2.4;
    } 
    // 6. Smoked Oak & Dark Accent Wood
    else if (matName.includes('oak') || matName.includes('wood') || matName.includes('timber') || meshName.includes('door')) {
      mat.roughness = 0.45;
      mat.metalness = 0.04;
    }
  });
}

gltfLoader.load(
  '/assets/model.glb',
  (gltf) => {
    modelRoot = gltf.scene;
    
    // Calculate Bounding Box and Center
    const box = new THREE.Box3().setFromObject(modelRoot);
    const center = new THREE.Vector3();
    box.getCenter(center);

    modelRoot.position.x = -center.x;
    modelRoot.position.y = -box.min.y;
    modelRoot.position.z = -center.z;

    modelRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        enhanceMeshMaterial(child);
      }
    });

    modelGroup.add(modelRoot);

    // Initial Camera View: 01 // Front Entrance
    setCameraPreset('front');
    requestRender();
    console.log('Vel Ra 3D Model loaded with optimized realistic PBR lighting.');
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 5. Calibrated Camera Presets (Matching User Screenshots Exactly)
// ---------------------------------------------------------------------------
const cameraPresets = {
  'front': {
    name: '01 // Front Entrance',
    pos: new THREE.Vector3(-0.31, 1.45, 7.25),
    target: new THREE.Vector3(-0.31, 1.22, -0.11),
    maxDist: 12.0,
    minDist: 1.0
  },
  'island': {
    name: '02 // Central Island',
    pos: new THREE.Vector3(1.46, 1.55, 2.27),
    target: new THREE.Vector3(0, 0.9, 0),
    maxDist: 4.2,
    minDist: 0.5
  },
  'pos': {
    name: '03 // POS Cashier Desk',
    pos: new THREE.Vector3(1.57, 1.73, -1.32),
    target: new THREE.Vector3(-0.92, 1.33, -1.34),
    maxDist: 4.0,
    minDist: 0.5
  },
  'alcoves': {
    name: '04 // Perfume Wall Alcoves',
    pos: new THREE.Vector3(-1.32, 1.4, 1.72),
    target: new THREE.Vector3(1.55, 1.15, -0.48),
    maxDist: 4.5,
    minDist: 0.5
  }
};

let isTransitioning = false;

function flyCamera(destPos, destTarget, duration = 1100, onComplete) {
  if (isTransitioning) return;
  isTransitioning = true;
  controls.enabled = false;

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  function animate(now) {
    const elapsed = Math.min(1, (now - startTime) / duration);
    const ease = elapsed < 0.5 ? 4 * elapsed * elapsed * elapsed : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;

    camera.position.lerpVectors(startPos, destPos, ease);
    controls.target.lerpVectors(startTarget, destTarget, ease);
    camera.lookAt(controls.target);

    requestRender();

    if (elapsed < 1) {
      requestAnimationFrame(animate);
    } else {
      isTransitioning = false;
      controls.enabled = true;
      controls.target.copy(destTarget);
      controls.update();
      requestRender();
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(animate);
}

function setCameraPreset(presetKey) {
  const data = cameraPresets[presetKey];
  if (!data) return;

  currentPresetKey = presetKey;

  // Update Active Button State
  document.querySelectorAll('.cam-preset-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-cam-' + presetKey);
  if (activeBtn) activeBtn.classList.add('active');

  // Set Control Limits
  controls.maxDistance = data.maxDist || 12;
  controls.minDistance = data.minDist || 0.4;

  // Fly Camera to calibrated position
  flyCamera(data.pos, data.target);
}

// ---------------------------------------------------------------------------
// 6. User Controls: Presets, Auto-Rotate Inside & Wireframe
// ---------------------------------------------------------------------------
['front', 'island', 'pos', 'alcoves'].forEach(key => {
  const btn = document.getElementById('btn-cam-' + key);
  if (btn) btn.addEventListener('click', () => setCameraPreset(key));
});

// Auto-Rotate Inside Button
let isRotatingInside = false;
const btnAutoRotate = document.getElementById('btn-auto-rotate');
if (btnAutoRotate) {
  btnAutoRotate.addEventListener('click', () => {
    isRotatingInside = !isRotatingInside;
    controls.autoRotate = isRotatingInside;
    btnAutoRotate.classList.toggle('active', isRotatingInside);
    if (isRotatingInside) {
      btnAutoRotate.style.background = 'var(--gold-gradient)';
      btnAutoRotate.style.color = '#ffffff';
    } else {
      btnAutoRotate.style.background = '';
      btnAutoRotate.style.color = '';
    }
    requestRender();
  });
}

// Wireframe Toggle
let isWireframe = false;
const btnWireframe = document.getElementById('btn-wireframe');
if (btnWireframe) {
  btnWireframe.addEventListener('click', () => {
    isWireframe = !isWireframe;
    if (modelRoot) {
      modelRoot.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => m.wireframe = isWireframe);
        }
      });
    }
    btnWireframe.classList.toggle('active', isWireframe);
    requestRender();
  });
}

// ---------------------------------------------------------------------------
// 7. Camera Wall Boundary & Interior Collision Clamping
// ---------------------------------------------------------------------------
function clampCameraInsideWalls() {
  if (currentPresetKey === 'front') return;

  const minX = -2.05;
  const maxX = 2.05;
  const minY = 0.55;
  const maxY = 2.55;
  const minZ = -2.60;
  const maxZ = 3.80;

  camera.position.x = Math.max(minX, Math.min(maxX, camera.position.x));
  camera.position.y = Math.max(minY, Math.min(maxY, camera.position.y));
  camera.position.z = Math.max(minZ, Math.min(maxZ, camera.position.z));
}

// ---------------------------------------------------------------------------
// 8. Global API for Top Passes & Section Integration
// ---------------------------------------------------------------------------
window.velra3D = {
  setCameraPreset(presetKey) {
    const passMap = {
      'pass1': 'front',
      'pass2': 'front',
      'pass3': 'pos',
      'pass4': 'pos',
      'pass5': 'alcoves',
      'pass6': 'alcoves',
      'pass7': 'island',
      'pass8': 'island',
      'pass9': 'island'
    };
    const key = cameraPresets[presetKey] ? presetKey : (passMap[presetKey] || 'front');
    setCameraPreset(key);
  }
};

// ---------------------------------------------------------------------------
// 9. High-Performance IntersectionObserver & Smart Render Loop
// ---------------------------------------------------------------------------
let isViewportVisible = true;
let renderRequested = false;

function requestRender() {
  if (!renderRequested) {
    renderRequested = true;
  }
}

controls.addEventListener('change', () => {
  clampCameraInsideWalls();
  requestRender();
});

// Pause WebGL rendering when user scrolls away to save 100% GPU / CPU
if ('IntersectionObserver' in window && container) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isViewportVisible = entry.isIntersecting;
      if (isViewportVisible) requestRender();
    });
  }, { threshold: 0.05 });

  observer.observe(container);
}

function onWindowResize() {
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  requestRender();
}

window.addEventListener('resize', onWindowResize);

function renderLoop() {
  requestAnimationFrame(renderLoop);

  // Only render when viewport is visible
  if (!isViewportVisible) return;

  if (controls.autoRotate || isTransitioning || renderRequested) {
    controls.update();
    clampCameraInsideWalls();
    renderer.render(scene, camera);
    renderRequested = false;
  }
}

renderLoop();
