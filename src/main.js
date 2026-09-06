import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ===========================================================================
// VEL RA PERFUMES — ARCHITECTURAL 3D LIGHTING & RENDERING ENGINE
// Maximum Photorealism with Minimum Draw-Call & GPU Memory Cost
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. Viewport & Canvas Setup
// ---------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d14);

const camera = new THREE.PerspectiveCamera(
  38, // 38mm architectural prime focal length
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

// Selective, Ultra-Subtle Bloom Pipeline (High Quality Tier)
let composer = null;
let bloomPass = null;
let usePostProcessing = true;

try {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container ? container.clientWidth : window.innerWidth, container ? container.clientHeight : window.innerHeight),
    0.16, // Bloom strength (restrained & physically believable)
    0.28, // Bloom radius (tight around fixtures)
    1.04  // Luminance threshold (ensures normal materials/metals NEVER bloom)
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);
} catch (e) {
  console.warn('Notice setting up post-processing:', e);
  usePostProcessing = false;
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.4;
controls.maxDistance = 14;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.0;

// ---------------------------------------------------------------------------
// 2. HDRI Environment Lighting (PMREM 2K Preprocessed)
// ---------------------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const exrLoader = new EXRLoader();
exrLoader.load(
  '/assets/urban_street_02_2k.exr',
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.24; // Subtle environment & reflection fill
    texture.dispose();
    pmremGenerator.dispose();
    requestRender();
  },
  undefined,
  (err) => console.warn('Notice loading EXR map:', err)
);

// ---------------------------------------------------------------------------
// 3. Physical Lighting Architecture (Single Sun, Soft Shadows, Minimal Spots)
// ---------------------------------------------------------------------------
// 3.1 Ambient & Sky Fill
const ambientLight = new THREE.AmbientLight(0xffecd8, 0.10);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff2e0, 0x141824, 0.14);
scene.add(hemiLight);

// 3.2 Single Main Directional Sunlight
const sunLight = new THREE.DirectionalLight(0xfff3dc, 3.8);
sunLight.position.set(5.2, 4.4, 6.5);
sunLight.target.position.set(-0.6, 0.4, -0.4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.bias = -0.00008;
sunLight.shadow.normalBias = 0.035;
sunLight.shadow.radius = 2.0;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 22;
sunLight.shadow.camera.left = -4.8;
sunLight.shadow.camera.right = 4.8;
sunLight.shadow.camera.top = 4.8;
sunLight.shadow.camera.bottom = -4.8;
scene.add(sunLight);
scene.add(sunLight.target);

// 3.3 Warm Floor Sun-Bounce
const floorBounce = new THREE.PointLight(0xffdda0, 1.0, 5.5, 2.0);
floorBounce.position.set(0.6, 0.25, 0.8);
scene.add(floorBounce);

// 3.4 Central Island Spot (Physically Radiating Downward with Soft Decay)
const islandLight = new THREE.SpotLight(0xffeed8, 2.8, 6.5, Math.PI / 4.8, 0.82, 2.0);
islandLight.position.set(0, 2.45, 0.15);
islandLight.target.position.set(0, 0.85, 0.15);
islandLight.castShadow = true;
islandLight.shadow.mapSize.set(1024, 1024);
islandLight.shadow.bias = -0.0001;
islandLight.shadow.normalBias = 0.02;
scene.add(islandLight);
scene.add(islandLight.target);

// 3.5 Backwall Monogram Accent Spot
const monogramLight = new THREE.SpotLight(0xffe4aa, 2.2, 4.8, Math.PI / 4.0, 0.75, 2.0);
monogramLight.position.set(-0.2, 2.4, -0.2);
monogramLight.target.position.set(-0.2, 1.6, -1.8);
scene.add(monogramLight);
scene.add(monogramLight.target);

// 3.6 Ceiling Cove LED Strip Fill
const coveLight = new THREE.PointLight(0xffe2b4, 1.2, 5.5, 2.0);
coveLight.position.set(0, 2.3, 0);
scene.add(coveLight);

// ---------------------------------------------------------------------------
// 4. Smooth Time-of-Day System (0–24 Parameter with Physical Interpolation)
// ---------------------------------------------------------------------------
let currentTimeOfDay = 16.5;
let isTimeTransitioning = false;

function calculateLightingForTime(h) {
  const time = Math.max(0, Math.min(24, parseFloat(h)));
  currentTimeOfDay = time;

  const label = document.getElementById('label-time-of-day');
  const slider = document.getElementById('slider-time-of-day');
  if (slider && parseFloat(slider.value) !== time) {
    slider.value = time;
  }

  // Update visual presets active buttons
  document.querySelectorAll('.time-preset-btn').forEach(btn => {
    const val = parseFloat(btn.getAttribute('data-time') || '-1');
    if (Math.abs(val - time) < 0.6) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  let timeDesc = '';
  if (time < 5) timeDesc = `${Math.floor(time)}:00 Night Twilight`;
  else if (time < 7.5) timeDesc = `${Math.floor(time)}:00 Sunrise`;
  else if (time < 11) timeDesc = `${Math.floor(time)}:00 Morning Sun`;
  else if (time < 14) timeDesc = `${Math.floor(time)}:00 Midday Natural`;
  else if (time < 17) timeDesc = `${Math.floor(time)}:00 Afternoon Daylight`;
  else if (time < 19.5) timeDesc = `${Math.floor(time)}:30 Golden Hour`;
  else timeDesc = `${Math.floor(time)}:00 Evening Boutique Glow`;

  if (label) label.innerText = timeDesc;

  // Day calculations (06:00 to 19:00)
  if (time >= 6.0 && time <= 19.0) {
    const dayProgress = (time - 6.0) / 13.0;
    const angle = dayProgress * Math.PI;

    // Continuous celestial sun trajectory through storefront window
    const sunX = 6.8 * Math.cos(angle * 0.8);
    const sunY = 3.2 + 4.8 * Math.sin(angle);
    const sunZ = 4.8 + 3.2 * Math.sin(angle);
    sunLight.position.set(sunX, sunY, sunZ);

    if (time < 8.0) {
      // 06:00 Sunrise (Warm Amber)
      const t = (time - 6.0) / 2.0;
      sunLight.color.setHex(0xffc28c);
      sunLight.intensity = 2.8 + t * 0.8;
      ambientLight.intensity = 0.08 + t * 0.02;
      hemiLight.intensity = 0.10 + t * 0.02;
    } else if (time < 11.0) {
      // 09:00 Morning (Warm Directional Light)
      sunLight.color.setHex(0xffe0ba);
      sunLight.intensity = 3.8;
      ambientLight.intensity = 0.10;
      hemiLight.intensity = 0.14;
    } else if (time < 14.0) {
      // 12:00 Midday (Crisp Architectural Daylight)
      sunLight.color.setHex(0xfffaee);
      sunLight.intensity = 4.2;
      ambientLight.intensity = 0.14;
      hemiLight.intensity = 0.18;
    } else if (time < 17.0) {
      // 15:00 Afternoon (Bright Soft Natural)
      sunLight.color.setHex(0xfff0d8);
      sunLight.intensity = 3.9;
      ambientLight.intensity = 0.11;
      hemiLight.intensity = 0.15;
    } else {
      // 18:00 Sunset / Golden Hour (Rich Golden Ray)
      const t = (time - 17.0) / 2.0;
      sunLight.color.setHex(0xffcb86);
      sunLight.intensity = 3.8 * (1.0 - t * 0.3);
      ambientLight.intensity = 0.08;
      hemiLight.intensity = 0.11;
    }

    floorBounce.intensity = 1.0;
    scene.background.setHex(0x0a0d14);
    scene.environmentIntensity = 0.24;

    islandLight.intensity = 2.4;
    monogramLight.intensity = 1.8;
    coveLight.intensity = 1.0;
  } else {
    // Night Mode (Sun set, boutique lights take over)
    sunLight.intensity = 0.0;
    floorBounce.intensity = 0.12;
    ambientLight.intensity = 0.04;
    hemiLight.intensity = 0.06;
    scene.background.setHex(0x03050a);
    scene.environmentIntensity = 0.10;

    islandLight.intensity = 4.2;
    monogramLight.intensity = 3.2;
    coveLight.intensity = 2.0;
  }

  requestRender();
}

function transitionTimeTo(targetHour, duration = 600) {
  if (isTimeTransitioning) return;
  isTimeTransitioning = true;

  const startHour = currentTimeOfDay;
  const startTime = performance.now();

  function step(now) {
    const elapsed = Math.min(1, (now - startTime) / duration);
    const ease = elapsed < 0.5 ? 2 * elapsed * elapsed : 1 - Math.pow(-2 * elapsed + 2, 2) / 2;
    const current = startHour + (targetHour - startHour) * ease;
    calculateLightingForTime(current);

    if (elapsed < 1) {
      requestAnimationFrame(step);
    } else {
      isTimeTransitioning = false;
      calculateLightingForTime(targetHour);
    }
  }
  requestAnimationFrame(step);
}

function setTimeOfDay(hour, smooth = false) {
  const h = parseFloat(hour);
  if (smooth) {
    transitionTimeTo(h);
  } else {
    calculateLightingForTime(h);
  }
}

window.setTimeOfDay = setTimeOfDay;

// ---------------------------------------------------------------------------
// 5. Adaptive Quality Tier System (High PBR / Medium Balanced / Low Eco)
// ---------------------------------------------------------------------------
let currentQualityTier = 'high';

function setQualityTier(tier) {
  currentQualityTier = tier;

  document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'btn-quality-' + tier);
  });

  const width = container ? container.clientWidth : window.innerWidth;
  const height = container ? container.clientHeight : window.innerHeight;

  if (tier === 'high') {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    islandLight.castShadow = true;
    islandLight.shadow.mapSize.set(1024, 1024);
    usePostProcessing = !!composer;
    if (bloomPass) bloomPass.strength = 0.16;
  } else if (tier === 'medium') {
    renderer.setPixelRatio(1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    islandLight.castShadow = false;
    usePostProcessing = false;
  } else if (tier === 'low') {
    renderer.setPixelRatio(1.0);
    renderer.shadowMap.enabled = false;
    sunLight.castShadow = false;
    islandLight.castShadow = false;
    usePostProcessing = false;
  }

  renderer.setSize(width, height);
  if (composer) composer.setSize(width, height);
  requestRender();
  console.log(`[VEL RA 3D] Active Quality Tier: ${tier.toUpperCase()}`);
}

window.setQualityTier = setQualityTier;

// ---------------------------------------------------------------------------
// 6. Accurate Physical Materials (PBR Standards, Controlled Emissive)
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

    // 1. SIGNAGE, BANNER & LOGO (Crisp, clean, matte architectural lettering - ZERO GLOW)
    if (matName.includes('svgmat') || meshName.includes('text') || meshName.includes('signage') || matName.includes('logo') || meshName.includes('logo')) {
      mat.color = new THREE.Color(0xf5f3ee);
      mat.roughness = 0.95;
      mat.metalness = 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    }
    // 2. LIGHT-DIFFUSER STRIPS (Controlled local glowing surface - NO runaway halo)
    else if (matName.includes('lamp') || matName.includes('cove') || (matName.includes('light') && !matName.includes('sun'))) {
      mat.color = new THREE.Color(0xffeed4);
      mat.emissive = new THREE.Color(0xffe2b0);
      mat.emissiveIntensity = 0.70;
      mat.roughness = 0.5;
      mat.metalness = 0.0;
    }
    // 3. GOLD & BRASS METALS (Physical metallic reflection - ZERO artificial glow)
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
    // 5. WALLS, PLASTER, CEILING, MOLDINGS (100% Completely MATTE - Zero Gloss)
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
    calculateLightingForTime(16.5);
    setQualityTier('high');
    requestRender();
    console.log('Vel Ra 3D Model loaded with optimized physical lighting system.');
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 7. Calibrated Camera Presets (Elevated Front Entrance)
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
// 8. User Controls: Presets, Auto-Rotate Inside & Wireframe
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
// 9. Camera Wall Boundary & Interior Collision Clamping
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
// 10. Global API for Top Passes & Section Integration
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
  },
  setTimeOfDay(hour, smooth) {
    setTimeOfDay(hour, smooth);
  },
  setQualityTier(tier) {
    setQualityTier(tier);
  }
};

// ---------------------------------------------------------------------------
// 11. High-Performance IntersectionObserver & Smart Render Loop
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
  if (composer) {
    composer.setSize(width, height);
    if (bloomPass) bloomPass.setSize(width, height);
  }
  requestRender();
}

window.addEventListener('resize', onWindowResize);

function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (!isViewportVisible) return;

  if (controls.autoRotate || isTransitioning || isTimeTransitioning || renderRequested) {
    controls.update();
    clampCameraInsideWalls();

    if (usePostProcessing && composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    renderRequested = false;
  }
}

renderLoop();
