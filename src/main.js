import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ---------------------------------------------------------------------------
// 1. Viewport & Canvas Setup
// ---------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

const scene = new THREE.Scene();
// Deep cinematic studio backdrop
scene.background = new THREE.Color(0x0e1322);

const camera = new THREE.PerspectiveCamera(
  40,
  container ? (container.clientWidth / container.clientHeight) : (window.innerWidth / window.innerHeight),
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container ? container.clientWidth : window.innerWidth, container ? container.clientHeight : window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.42; // Rich cinematic luminescence
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.4;
controls.maxDistance = 15;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.4;

// ---------------------------------------------------------------------------
// 2. Realistic Cinematic Lighting Scheme (Warm 3000K Luxury Boutique)
// ---------------------------------------------------------------------------
// 2.1 Ambient & Sky Fill
const ambientLight = new THREE.AmbientLight(0xfff7ea, 1.5);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff2dc, 0x182033, 1.2);
scene.add(hemiLight);

// 2.2 Key Directional Sun Light (Exterior & Window Wash)
const mainSun = new THREE.DirectionalLight(0xfff5e6, 2.4);
mainSun.position.set(15, 30, 20);
mainSun.castShadow = true;
mainSun.shadow.mapSize.set(2048, 2048);
mainSun.shadow.bias = -0.0001;
scene.add(mainSun);

// 2.3 Interior Central Island Pendant / Chandelier Spot
const islandSpot = new THREE.PointLight(0xffe8b8, 3.2, 12, 1.2);
islandSpot.position.set(0, 2.4, 0.2);
islandSpot.castShadow = true;
scene.add(islandSpot);

// 2.4 Backwall Brand Signage & Monogram Illuminator
const monogramSpot = new THREE.PointLight(0xffdf95, 2.8, 8, 1.4);
monogramSpot.position.set(-0.2, 1.7, -1.6);
scene.add(monogramSpot);

// 2.5 Left & Right Arched Perfume Display Wall Grazers
const leftWallLight = new THREE.PointLight(0xffeccc, 2.2, 7, 1.5);
leftWallLight.position.set(-1.4, 1.6, 0.4);
scene.add(leftWallLight);

const rightWallLight = new THREE.PointLight(0xffeccc, 2.2, 7, 1.5);
rightWallLight.position.set(1.4, 1.6, 0.4);
scene.add(rightWallLight);

// 2.6 Storefront Vitrine Accent
const storefrontLight = new THREE.PointLight(0xfffaea, 2.0, 8, 1.5);
storefrontLight.position.set(0, 2.1, 3.5);
scene.add(storefrontLight);

// ---------------------------------------------------------------------------
// 3. GLTF Loader & Mesh Material Enhancement
// ---------------------------------------------------------------------------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

let modelRoot = null;
let ceilingMesh = null;
let currentPresetKey = 'front';

function enhanceMeshMaterial(mesh) {
  if (!mesh.material) return;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  
  mats.forEach(mat => {
    const name = (mat.name || '').toLowerCase();
    const meshName = (mesh.name || '').toLowerCase();
    
    // Check if this is the ceiling
    if (meshName.includes('ceiling') || name.includes('ceiling')) {
      ceilingMesh = mesh;
    }

    if (name.includes('light') || name.includes('lamp') || name.includes('emissive') || meshName.includes('text') || meshName.includes('signage')) {
      mat.emissive = new THREE.Color(0xffdf88);
      mat.emissiveIntensity = 2.4;
    } else if (name.includes('gold') || name.includes('brass') || meshName.includes('brass') || meshName.includes('gold')) {
      mat.metalness = 0.95;
      mat.roughness = 0.18;
      mat.emissive = new THREE.Color(0x281c08);
      mat.emissiveIntensity = 0.35;
    } else if (name.includes('marble') || name.includes('calacatta') || name.includes('floor') || meshName.includes('floor')) {
      mat.roughness = 0.16;
      mat.metalness = 0.05;
    } else if (name.includes('glass') || name.includes('vitrine') || name.includes('window') || meshName.includes('glass')) {
      mat.transparent = true;
      mat.opacity = 0.32;
      mat.roughness = 0.04;
      mat.metalness = 0.1;
    } else if (name.includes('wall') || name.includes('plaster')) {
      mat.roughness = 0.65;
      mat.metalness = 0.02;
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
    console.log('Vel Ra 3D Model loaded and cinematic lighting initialized.');
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 4. Calibrated Camera Presets (Matching User Screenshots Exactly)
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
  },
  'top': {
    name: '05 // Top-Down Plan',
    pos: new THREE.Vector3(0, 17.67, 0.01),
    target: new THREE.Vector3(0, 0, 0),
    maxDist: 35.0,
    minDist: 4.0
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

    if (elapsed < 1) {
      requestAnimationFrame(animate);
    } else {
      isTransitioning = false;
      controls.enabled = true;
      controls.target.copy(destTarget);
      controls.update();
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(animate);
}

function setCameraPreset(presetKey) {
  const data = cameraPresets[presetKey];
  if (!data) return;

  currentPresetKey = presetKey;

  // 1. Top-Down Ceiling Visibility Control
  if (presetKey === 'top') {
    if (ceilingMesh) ceilingMesh.visible = false;
  } else {
    if (ceilingMesh) ceilingMesh.visible = true;
  }

  // 2. Update Active Button State
  document.querySelectorAll('.cam-preset-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-cam-' + presetKey);
  if (activeBtn) activeBtn.classList.add('active');

  // 3. Set Control Limits
  controls.maxDistance = data.maxDist || 15;
  controls.minDistance = data.minDist || 0.4;

  // 4. Fly Camera to calibrated position
  flyCamera(data.pos, data.target);
}

// ---------------------------------------------------------------------------
// 5. User Controls: Presets, Auto-Rotate Inside & Wireframe
// ---------------------------------------------------------------------------
['front', 'island', 'pos', 'alcoves', 'top'].forEach(key => {
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
  });
}

// ---------------------------------------------------------------------------
// 6. Camera Wall Boundary & Interior Collision Clamping
// ---------------------------------------------------------------------------
function clampCameraInsideWalls() {
  // Only clamp when inspecting the interior (not in Top-Down or Front Façade view)
  if (currentPresetKey === 'top' || currentPresetKey === 'front') return;

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
// 7. Global API for Top Passes & Section Integration
// ---------------------------------------------------------------------------
window.velra3D = {
  setCameraPreset(presetKey) {
    // Map pass keys to closest interior views if needed
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
// 8. Animation & Resize Loop
// ---------------------------------------------------------------------------
function onWindowResize() {
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);

function renderLoop() {
  requestAnimationFrame(renderLoop);
  controls.update();
  clampCameraInsideWalls();
  renderer.render(scene, camera);
}

renderLoop();
