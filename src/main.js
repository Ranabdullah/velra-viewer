import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

// ---------------------------------------------------------------------------
// 1. Viewport & Canvas Setup (Lumen Studio Architectural Standard - Direct WebGL)
// ---------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d14);

const camera = new THREE.PerspectiveCamera(
  38, // Architectural prime focal length
  container ? (container.clientWidth / container.clientHeight) : (window.innerWidth / window.innerHeight),
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(container ? container.clientWidth : window.innerWidth, container ? container.clientHeight : window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.4;
controls.maxDistance = 14;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.0;

// ---------------------------------------------------------------------------
// 2. HDRI Environment (Subtle Specular Reflection on Brass & Marble)
// ---------------------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const exrLoader = new EXRLoader();
exrLoader.load(
  '/assets/urban_street_02_2k.exr',
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.25;
    texture.dispose();
    pmremGenerator.dispose();
    requestRender();
  },
  undefined,
  (err) => console.warn('Notice loading EXR map:', err)
);

// ---------------------------------------------------------------------------
// 3. Physical Architectural Lighting (Sun Beam, Soft Shadows, Discrete Spots)
// ---------------------------------------------------------------------------
// 3.1 Ambient Fill (Soft & Warm, No Flat Glare)
const ambientLight = new THREE.AmbientLight(0xffecd8, 0.12);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff0dc, 0x141820, 0.16);
scene.add(hemiLight);

// 3.2 Directional Sunlight (Crisp-to-Soft Sunlight streaming through front window)
const sunLight = new THREE.DirectionalLight(0xfff3da, 3.8);
sunLight.position.set(5.2, 4.4, 6.5);
sunLight.target.position.set(-0.6, 0.4, -0.4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.bias = -0.0001;
sunLight.shadow.normalBias = 0.04;
sunLight.shadow.radius = 2.0;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 25;
sunLight.shadow.camera.left = -5.5;
sunLight.shadow.camera.right = 5.5;
sunLight.shadow.camera.top = 5.5;
sunLight.shadow.camera.bottom = -5.5;
scene.add(sunLight);
scene.add(sunLight.target);

// 3.3 Warm Floor Sun-Bounce
const floorBounce = new THREE.PointLight(0xffdda8, 1.2, 6, 2.0);
floorBounce.position.set(0.6, 0.25, 0.8);
scene.add(floorBounce);

// 3.4 Central Island Spot (Physically Radiating Downward with Soft Decay)
const islandLight = new THREE.SpotLight(0xffeed8, 3.0, 7.0, Math.PI / 4.6, 0.8, 2.0);
islandLight.position.set(0, 2.45, 0.15);
islandLight.target.position.set(0, 0.85, 0.15);
islandLight.castShadow = true;
islandLight.shadow.mapSize.set(1024, 1024);
islandLight.shadow.bias = -0.0001;
islandLight.shadow.normalBias = 0.02;
scene.add(islandLight);
scene.add(islandLight.target);

// 3.5 Backwall Monogram Accent Spot
const monogramLight = new THREE.SpotLight(0xffe4aa, 2.4, 5.0, Math.PI / 4.0, 0.7, 2.0);
monogramLight.position.set(-0.2, 2.4, -0.2);
monogramLight.target.position.set(-0.2, 1.6, -1.8);
scene.add(monogramLight);
scene.add(monogramLight.target);

// 3.6 Ceiling Cove LED Strip
const coveLight = new THREE.PointLight(0xffe2b0, 1.4, 6.5, 2.0);
coveLight.position.set(0, 2.3, 0);
scene.add(coveLight);

// ---------------------------------------------------------------------------
// 4. Dynamic Time of Day Controller Function
// ---------------------------------------------------------------------------
function setTimeOfDay(hour) {
  const h = parseFloat(hour);
  const label = document.getElementById('label-time-of-day');
  const slider = document.getElementById('slider-time-of-day');
  if (slider) slider.value = h;

  let timeName = '';
  if (h < 10) timeName = `${Math.floor(h)}:00 Morning Sun`;
  else if (h < 15) timeName = `${Math.floor(h)}:00 Midday Natural`;
  else if (h < 18) timeName = `${Math.floor(h)}:30 Golden Hour`;
  else timeName = `${Math.floor(h)}:00 Evening Boutique Glow`;

  if (label) label.innerText = timeName;

  // Day / Afternoon / Evening Calculation
  if (h < 18.5) {
    const dayProgress = Math.max(0, Math.min(1, (h - 6) / 12.5));
    const angle = dayProgress * Math.PI;

    const sunX = 7.0 * Math.cos(angle * 0.8);
    const sunY = 3.5 + 4.5 * Math.sin(angle);
    const sunZ = 5.0 + 3.0 * Math.sin(angle);
    sunLight.position.set(sunX, sunY, sunZ);

    if (h < 10) {
      // Warm Morning Sun
      sunLight.color.setHex(0xffdfb8);
      sunLight.intensity = 3.6 * Math.sin(angle);
      ambientLight.intensity = 0.10;
    } else if (h < 15) {
      // Crisp Midday
      sunLight.color.setHex(0xfffaee);
      sunLight.intensity = 4.2;
      ambientLight.intensity = 0.14;
    } else {
      // Golden Hour
      sunLight.color.setHex(0xffd59e);
      sunLight.intensity = 4.0;
      ambientLight.intensity = 0.10;
    }

    floorBounce.intensity = 1.2;
    scene.background.setHex(0x0a0d14);
    scene.environmentIntensity = 0.25;
    islandLight.intensity = 2.4;
    monogramLight.intensity = 2.0;
    coveLight.intensity = 1.0;
  } else {
    // Evening / Night Mode (Boutique Interior Glow)
    sunLight.intensity = 0.0;
    floorBounce.intensity = 0.15;
    ambientLight.intensity = 0.05;
    hemiLight.intensity = 0.08;
    scene.background.setHex(0x04060a);
    scene.environmentIntensity = 0.12;

    // Interior recessed spots take over
    islandLight.intensity = 4.2;
    monogramLight.intensity = 3.4;
    coveLight.intensity = 2.0;
  }

  requestRender();
}

window.setTimeOfDay = setTimeOfDay;

// ---------------------------------------------------------------------------
// 5. Accurate Physical Materials (100% Matte Walls, Real Gold, Natural Marble)
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

    // 1. SIGNAGE, BANNER & TEXT (Crisp, clean, matte architectural lettering - ZERO NEON GLOW)
    if (matName.includes('svgmat') || meshName.includes('text') || meshName.includes('signage') || matName.includes('logo') || meshName.includes('logo')) {
      mat.color = new THREE.Color(0xf5f3ee);
      mat.roughness = 0.95;
      mat.metalness = 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    }
    // 2. LIGHT-DIFFUSER STRIPS (Gentle natural soft self-illumination)
    else if (matName.includes('lamp') || matName.includes('cove') || (matName.includes('light') && !matName.includes('sun'))) {
      mat.color = new THREE.Color(0xffeed4);
      mat.emissive = new THREE.Color(0xffe6b0);
      mat.emissiveIntensity = 0.6;
      mat.roughness = 0.5;
      mat.metalness = 0.0;
    }
    // 3. GOLD & BRASS METALS (Real physical metal reflection - ZERO GLOW)
    else if (matName.includes('gold') || matName.includes('brass') || meshName.includes('brass') || meshName.includes('gold') || matName.includes('m03') || matName.includes('m04') || matName.includes('metalic')) {
      mat.metalness = 0.90;
      mat.roughness = 0.28;
      mat.color = new THREE.Color(0xd4af37);
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    } 
    // 4. CALACATTA MARBLE & FLOORS (Natural stone hone - ZERO GLOW)
    else if (matName.includes('marble') || matName.includes('calacatta') || matName.includes('floor') || meshName.includes('floor') || matName.includes('m02') || matName.includes('m06')) {
      mat.roughness = 0.38;
      mat.metalness = 0.0;
      mat.color = new THREE.Color(0xf6f3ea);
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    } 
    // 5. WALLS, PLASTER, CEILING, MOLDINGS (100% Completely MATTE - Zero Gloss, Zero Glow)
    else if (matName.includes('wall') || matName.includes('plaster') || meshName.includes('wall') || matName.includes('cement') || meshName.includes('ceiling') || matName.includes('ceiling') || matName.includes('facade')) {
      mat.color = new THREE.Color(0xede8de);
      mat.roughness = 0.99;
      mat.metalness = 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    } 
    // 6. VITRINE & WINDOW GLASS
    else if (matName.includes('glass') || matName.includes('vitrine') || matName.includes('window') || meshName.includes('glass')) {
      mat.transparent = true;
      mat.opacity = 0.18;
      mat.roughness = 0.04;
      mat.metalness = 0.0;
      mat.color = new THREE.Color(0xffffff);
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    } 
    // 7. TIMBER / WOOD
    else if (matName.includes('oak') || matName.includes('wood') || matName.includes('timber') || meshName.includes('door')) {
      mat.roughness = 0.85;
      mat.metalness = 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    }
    // 8. ALL OTHER SURFACES (Clean physical matte finish)
    else {
      mat.roughness = 0.92;
      mat.metalness = 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
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

    // Initial Camera View & Golden Hour
    setCameraPreset('front');
    setTimeOfDay(16.5);
    requestRender();
    console.log('Vel Ra 3D Model loaded with clean physical materials and lighting.');
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 6. Calibrated Camera Presets (Elevated Front Entrance for Full Banner View)
// ---------------------------------------------------------------------------
const cameraPresets = {
  'front': {
    name: '01 // Front Entrance',
    pos: new THREE.Vector3(-0.15, 2.20, 8.50),
    target: new THREE.Vector3(-0.15, 1.70, 0.0),
    maxDist: 14.0,
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
  controls.maxDistance = data.maxDist || 14;
  controls.minDistance = data.minDist || 0.4;

  // Fly Camera to calibrated position
  flyCamera(data.pos, data.target);
}

// ---------------------------------------------------------------------------
// 7. User Controls: Presets, Auto-Rotate Inside & Wireframe
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
// 8. Camera Wall Boundary & Interior Collision Clamping
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
// 9. Global API for Top Passes & Section Integration
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
// 10. High-Performance IntersectionObserver & Direct WebGL Render Loop
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

  if (!isViewportVisible) return;

  if (controls.autoRotate || isTransitioning || renderRequested) {
    controls.update();
    clampCameraInsideWalls();
    renderer.render(scene, camera);
    renderRequested = false;
  }
}

renderLoop();
