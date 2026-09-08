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

// ---------------------------------------------------------------------------
// 0. Loading Screen Controller
// ---------------------------------------------------------------------------
function updateLoadingProgress(percent, statusText) {
  const bar = document.getElementById('viewer-loading-bar');
  const label = document.getElementById('viewer-loading-percent');
  const status = document.getElementById('viewer-loading-status');
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.innerText = `${Math.round(percent)}%`;
  if (status && statusText) status.innerText = statusText;
}

function hideLoadingScreen() {
  updateLoadingProgress(100, '3D Digital Twin Ready');
  const screen = document.getElementById('viewer-loading-screen');
  if (screen) {
    setTimeout(() => {
      screen.style.opacity = '0';
      screen.style.pointerEvents = 'none';
      setTimeout(() => {
        screen.style.display = 'none';
      }, 800);
    }, 350);
  }
}

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

// 3.4 Multi-Source Interior Architectural Lighting

// Central Island Spot
const islandLight = new THREE.SpotLight(0xffeed8, 2.8, 6.5, Math.PI / 4.8, 0.82, 2.0);
islandLight.position.set(0, 2.45, 0.15);
islandLight.target.position.set(0, 0.85, 0.15);
islandLight.castShadow = true;
islandLight.shadow.mapSize.set(1024, 1024);
islandLight.shadow.bias = -0.0001;
islandLight.shadow.normalBias = 0.02;
scene.add(islandLight);
scene.add(islandLight.target);

// Right Wall Perfume Alcoves Wash Spot
const rightShelfLight = new THREE.SpotLight(0xffecd0, 2.2, 5.8, Math.PI / 3.8, 0.75, 2.0);
rightShelfLight.position.set(-1.4, 2.45, -0.4);
rightShelfLight.target.position.set(-2.4, 1.2, -0.4);
scene.add(rightShelfLight);
scene.add(rightShelfLight.target);

// Left Wall Perfume Shelves Wash Spot
const leftShelfLight = new THREE.SpotLight(0xffecd0, 2.2, 5.8, Math.PI / 3.8, 0.75, 2.0);
leftShelfLight.position.set(1.4, 2.45, -0.4);
leftShelfLight.target.position.set(2.4, 1.2, -0.4);
scene.add(leftShelfLight);
scene.add(leftShelfLight.target);

// Cashier & Packaging Desk Spot
const cashierLight = new THREE.SpotLight(0xfff0dc, 2.4, 4.5, Math.PI / 4.2, 0.70, 2.0);
cashierLight.position.set(0.6, 2.45, -1.3);
cashierLight.target.position.set(0.6, 0.9, -1.3);
scene.add(cashierLight);
scene.add(cashierLight.target);

// Rear Storage Room Interior Light
const storageLight = new THREE.PointLight(0xffe5ba, 2.0, 5.0, 2.0);
storageLight.position.set(0.0, 2.2, -3.2);
scene.add(storageLight);

// Storage Corridor & Pivot Door Focused Downlight
const storageDoorLight = new THREE.SpotLight(0xfff0dc, 2.6, 5.5, Math.PI / 3.2, 0.75, 2.0);
storageDoorLight.position.set(1.65, 2.45, -1.8);
storageDoorLight.target.position.set(2.15, 1.15, -3.15);
scene.add(storageDoorLight);
scene.add(storageDoorLight.target);

// Backwall Monogram Accent Spot
const monogramLight = new THREE.SpotLight(0xffe4aa, 2.2, 4.8, Math.PI / 4.0, 0.75, 2.0);
monogramLight.position.set(-0.2, 2.4, -0.2);
monogramLight.target.position.set(-0.2, 1.6, -1.8);
scene.add(monogramLight);
scene.add(monogramLight.target);

// Ceiling Cove LED Strip Fill
const coveLight = new THREE.PointLight(0xffe2b4, 1.4, 6.0, 2.0);
coveLight.position.set(0, 2.3, 0);
scene.add(coveLight);

// ---------------------------------------------------------------------------
// 3.7 Visible Architectural Ceiling Luminaire Fixtures
// ---------------------------------------------------------------------------
const fixtureGroup = new THREE.Group();
scene.add(fixtureGroup);

const fixturePositions = [
  { x: -0.4, y: 2.50, z: 0.15, label: 'Island Spot L' },
  { x:  0.4, y: 2.50, z: 0.15, label: 'Island Spot R' },
  { x: -1.6, y: 2.50, z: -0.4, label: 'Right Alcove Spot' },
  { x: -1.6, y: 2.50, z:  1.2, label: 'Right Front Spot' },
  { x:  1.6, y: 2.50, z: -0.4, label: 'Left Alcove Spot' },
  { x:  1.6, y: 2.50, z:  1.2, label: 'Left Front Spot' },
  { x:  0.6, y: 2.50, z: -1.3, label: 'Cashier Downlight' },
  { x:  0.0, y: 2.35, z: -3.2, label: 'Storage Downlight' }
];

const bezelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.025, 20);
const bezelMat = new THREE.MeshStandardMaterial({ color: 0x241d14, metalness: 0.85, roughness: 0.35 });

const lensGeo = new THREE.CircleGeometry(0.075, 20);
lensGeo.rotateX(Math.PI / 2);
const lensMat = new THREE.MeshBasicMaterial({ color: 0xffedd0 });

fixturePositions.forEach(pos => {
  const fixture = new THREE.Group();
  
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.y = 0.01;
  fixture.add(bezel);
  
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.position.y = -0.005;
  fixture.add(lens);
  
  fixture.position.set(pos.x, pos.y, pos.z);
  fixtureGroup.add(fixture);
});

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
const roofMeshes = [];

// Load High-Res Engineered Hardwood Texture
const textureLoader = new THREE.TextureLoader();
const woodFloorTexture = textureLoader.load('/materials/mat_wooden_floor.jpg');
woodFloorTexture.wrapS = THREE.RepeatWrapping;
woodFloorTexture.wrapT = THREE.RepeatWrapping;
woodFloorTexture.repeat.set(4.0, 6.0);
woodFloorTexture.colorSpace = THREE.SRGBColorSpace;

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
    // 4. ENGINEERED HARDWOOD TIMBER FLOOR (Applies high-res wooden floor texture)
    else if (matName.includes('wooden parquets') || matName.includes('wood') || meshName.includes('floor')) {
      mat.map = woodFloorTexture;
      mat.color = new THREE.Color(0xffffff); // Pure white base so natural wood grain texture details show crisply
      mat.roughness = 0.55;
      mat.metalness = 0.01;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
      mat.needsUpdate = true;
    }
    else if (matName.includes('marble') || matName.includes('calacatta') || matName.includes('m02') || matName.includes('m06')) {
      mat.roughness = 0.35;
      mat.metalness = 0.0;
      mat.color = new THREE.Color(0xf6f3ea);
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    }
    // 5. JOINED WALL SHELVES & CENTER STORAGE WALL
    else if (meshName.includes('shelf') || meshName.includes('shelves') || meshName.includes('center wall') || meshName.includes('main_unit') || meshName.includes('main_counter')) {
      const isGold = matName.includes('gold') || matName.includes('metal') || matName.includes('brass');
      mat.roughness = isGold ? 0.28 : 0.85;
      mat.metalness = isGold ? 0.90 : 0.0;
      mat.color = isGold ? new THREE.Color(0xd4af37) : new THREE.Color(0xf4f1ea);
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    }
    // 6. WALLS, PLASTER, CEILING, MOLDINGS (Warm Architectural Alabaster - 100% Matte)
    else if (matName.includes('wall') || matName.includes('plaster') || meshName.includes('wall') || matName.includes('cement') || meshName.includes('ceiling') || matName.includes('facade') || meshName.includes('center wall') || matName.includes('white plastic') || meshName.includes('plane.005') || meshName.includes('cube.002')) {
      mat.color = new THREE.Color(0xf6f2ea); // Clean architectural warm alabaster
      mat.roughness = 0.95;
      mat.metalness = 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    }
    // 6b. CONCEALED PIVOT DOOR & TIMBER HARDWARE
    else if (matName.includes('door') || meshName.includes('door') || matName.includes('frame') || meshName.includes('frame') || matName.includes('furni')) {
      const isMetal = matName.includes('metal') || meshName.includes('handle');
      mat.color = isMetal ? new THREE.Color(0xd4af37) : new THREE.Color(0xf2ede4);
      mat.roughness = isMetal ? 0.28 : 0.68;
      mat.metalness = isMetal ? 0.90 : 0.0;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    } 
    // 7. VITRINE & WINDOW GLASS (Ultra-clear, lets sunlight & ambient light illuminate interior properly)
    else if (matName.includes('glass') || matName.includes('vitrine') || matName.includes('window') || meshName.includes('glass')) {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mat.transparent = true;
      mat.opacity = 0.10; // High clarity architectural glazing
      mat.depthWrite = false; // Does not block interior shading
      mat.roughness = 0.02;
      mat.metalness = 0.05;
      mat.color = new THREE.Color(0xffffff);
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0.0;
    } 
    // 8. TIMBER / DOORS
    else if (matName.includes('oak') || matName.includes('timber') || meshName.includes('door')) {
      mat.roughness = 0.82;
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
        const cName = (child.name || '').toLowerCase();
        
        // Collect roof / ceiling meshes for interior vs exterior visibility
        if (cName.includes('ceiling')) {
          roofMeshes.push(child);
        }

        // Window & vitrine glass should not cast shadows so sunlight properly falls inside
        const mName = child.material ? (Array.isArray(child.material) ? child.material.map(m=>m.name||'').join(' ') : (child.material.name||'')).toLowerCase() : '';
        if (cName.includes('glass') || cName.includes('window') || mName.includes('glass') || mName.includes('window')) {
          child.castShadow = false;
          child.receiveShadow = false;
        } else {
          child.castShadow = true;
          child.receiveShadow = true;
        }

        enhanceMeshMaterial(child);
      }
    });

    modelGroup.add(modelRoot);

    // Initial Camera View & Golden Hour
    setCameraPreset('front');
    calculateLightingForTime(16.5);
    setQualityTier('high');
    requestRender();
    hideLoadingScreen();
    console.log('Vel Ra 3D Model loaded with optimized physical lighting system.');
  },
  (xhr) => {
    if (xhr.lengthComputable && xhr.total > 0) {
      const p = Math.min(95, Math.max(15, (xhr.loaded / xhr.total) * 100));
      updateLoadingProgress(p, `Loading Geometry & Textures (${Math.round(p)}%)...`);
    } else {
      updateLoadingProgress(70, 'Decompressing Draco Geometry...');
    }
  },
  (err) => {
    console.warn('Model loading notice:', err);
    hideLoadingScreen();
  }
);

// ---------------------------------------------------------------------------
// 7. Calibrated Camera Presets (Elevated Front Entrance)
// ---------------------------------------------------------------------------
const cameraPresets = {
  'front': {
    name: '01 // Front Entrance',
    pos: new THREE.Vector3(0.15, 1.65, 4.70),
    target: new THREE.Vector3(0.25, 1.20, 0.50),
    maxDist: 7.0,
    minDist: 0.5
  },
  'island': {
    name: '02 // Central Island',
    pos: new THREE.Vector3(1.75, 1.50, 1.80),
    target: new THREE.Vector3(0.30, 0.90, 0.50),
    maxDist: 5.0,
    minDist: 0.4
  },
  'pos': {
    name: '03 // POS Cashier Desk',
    pos: new THREE.Vector3(-0.75, 1.50, 1.60),
    target: new THREE.Vector3(0.65, 0.90, 0.25),
    maxDist: 4.5,
    minDist: 0.4
  },
  'alcoves': {
    name: '04 // Perfume Wall Alcoves',
    pos: new THREE.Vector3(-0.60, 1.45, 1.80),
    target: new THREE.Vector3(2.50, 1.30, 1.20),
    maxDist: 5.5,
    minDist: 0.4
  },
  'storage': {
    name: '05 // Storage Access Door',
    pos: new THREE.Vector3(0.20, 1.45, 1.80),
    target: new THREE.Vector3(0.52, 1.30, 0.00),
    maxDist: 5.0,
    minDist: 0.3
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

  // For interior add roof, for exterior no roof
  if (presetKey === 'front') {
    roofMeshes.forEach(m => m.visible = false);
  } else {
    roofMeshes.forEach(m => m.visible = true);
  }

  // Set Control Limits
  controls.maxDistance = data.maxDist || 14;
  controls.minDistance = data.minDist || 0.4;

  // Fly Camera to calibrated position
  flyCamera(data.pos, data.target);
}

// ---------------------------------------------------------------------------
// 8. User Controls: Presets, Auto-Rotate Inside & Wireframe
// ---------------------------------------------------------------------------
['front', 'island', 'pos', 'alcoves', 'storage'].forEach(key => {
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
  const minX = -3.20;
  const maxX = 3.60;
  const minY = 0.40;
  const maxY = 2.80;
  const minZ = -1.80;
  const maxZ = 5.50;

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


// ---------------------------------------------------------------------------
// 10. Interactive Architectural Component Inspector & Raycasting
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Architectural Component Catalog (Human-Readable Names & Handover Specs)
const architecturalCatalog = [
  {
    id: 'island',
    name: 'Central Fragrance Consultation Island Counter',
    category: 'PRIMARY CENTERPIECE JOINERY',
    finish: 'Book-Matched Calacatta Gold Marble & Reeded Brass Pedestal',
    specs: '230 cm (L) × 90 cm (W) × 95 cm (H)',
    desc: 'Monolithic discovery island featuring reverse shark-nose chamfered marble edges, fluted brass pedestal cladding, and dual-sided client fragrance consultation bays.',
    keywords: ['counter_1', 'counter_groves', 'island', 'cube.020', 'cube.040', 'cube.041', 'cube.042', 'cube.043', 'cube.044', 'cube.064']
  },
  {
    id: 'alcoves_right',
    name: 'Right Wall Arched Perfume Display Alcoves',
    category: 'PERIMETER VITRINE JOINERY',
    finish: 'Roman-Arch Plaster Framing & 10mm Floating Low-Iron Glass',
    specs: '40 cm Standardized Clear Vertical Shelf Intervals',
    desc: 'Bespoke continuous display units along the right boutique wall with integrated 3000K continuous perimeter halo ribbon and individual bottle pedestals.',
    keywords: ['shelves_2', 'small_shelf_1', 'small_shelf_6']
  },
  {
    id: 'alcoves_left',
    name: 'Left Wall Fragrance Wall Showcase Bays',
    category: 'PERIMETER VITRINE JOINERY',
    finish: 'Warm Alabaster Satin Framing with Gold Niche Inlays',
    specs: '40 cm Clear Clearance per Shelf Bay',
    desc: 'Continuous wall-mounted fragrance vitrines featuring floating low-iron glass shelves, 3D gold monogram relief inlays, and anti-glare micro-downlights.',
    keywords: ['shelves_9', 'shelves_10', 'shelves_11', 'small_shelf_7', 'small_shelf_8', 'small_shelf_9']
  },
  {
    id: 'cashier',
    name: 'Cashier Transaction & Gift-Wrapping POS Desk',
    category: 'TRANSACTION JOINERY',
    finish: 'Calacatta Marble Top & Reeded Fluted Brass Cladding',
    specs: '95 cm Ergonomic Standing Height • Recessed Cable Tray',
    desc: 'Dedicated checkout counter featuring velvet-lined packaging drawers, integrated DALI-2 LED driver tray, and brushed gold perimeter trims.',
    keywords: ['main_counter', 'display 1']
  },
  {
    id: 'storage_door',
    name: 'Concealed Pivot Door to Rear Storage Room',
    category: 'SPECIALIST ARCHITECTURAL HARDWARE',
    finish: 'Flush Wall Plaster with Backlit Mashrabiya Header',
    specs: '80 cm Width × 210 cm Height (Door D)',
    desc: 'Concealed hydraulic pivot door providing flush, private staff access directly into the rear 155 cm × 543 cm inventory storage room.',
    keywords: ['door', 'frame', 'furni', 'modern door']
  },
  {
    id: 'storage_room',
    name: 'Rear Back-of-House Storage & Inventory Room',
    category: 'BACK-OF-HOUSE DEMISE',
    finish: 'Internal Dividing Partition & Full-Height Inventory Shelving',
    specs: '155 cm (Depth) × 543 cm (Width) • Laser Verified',
    desc: 'Dedicated back-of-house storage facility for fragrance inventory, gift packaging boxes, and operational staff supplies.',
    keywords: ['center wall', 'plane.005', 'board']
  },
  {
    id: 'floor',
    name: 'Engineered Hardwood Timber Parquet Flooring',
    category: 'PRIMARY FLOORING FINISH',
    finish: 'Warm Natural Oak Hardwood Planks',
    specs: '590 cm × 797 cm Full Boutique Coverage',
    desc: 'Architectural-grade natural oak timber floor with acoustic decoupling underlayment and precision brushed brass perimeter boundary inlay bands.',
    keywords: ['floor', 'wooden parquets', 'parquets']
  },
  {
    id: 'vitrine_window',
    name: 'Capel Street Glazed Storefront Display Vitrine',
    category: 'EXTERIOR ARCHITECTURAL DEMISE',
    finish: 'Ultra-Clear Low-Iron Glass & Book-Matched Marble Pilasters',
    specs: '590 cm Primary Frontage Boundary',
    desc: 'Full-height street-facing architectural showcase welcoming pedestrians into the boutique with transparent display vitrines and campaign posters.',
    keywords: ['display', 'balcony_door', 'balcony door 130x210', 'window_glass']
  },
  {
    id: 'signage',
    name: 'VEL RA 3D Backlit Titanium Gold Monogram',
    category: 'BRAND IDENTITY & SIGNAGE',
    finish: 'Waterjet Titanium Gold with 3000K Perimeter Halo Glow',
    specs: 'Rear Focal Wall Demise Axis',
    desc: 'Signature brand identity insignia mounted on the rear vertical smoked oak feature wall, anchoring the sightline from Capel Street entrance.',
    keywords: ['logo', 'text', 'vel ra', 'perfumes', 'svgmat']
  },
  {
    id: 'bottles',
    name: 'Vel Ra Luxury Fragrance Flacons & Tester Bottles',
    category: 'MERCHANDISE PRESENTATION',
    finish: 'Heavyweight Crystalline Glass & Brushed Brass Caps',
    specs: 'Bespoke 50ml & 100ml Eau de Parfum Flacons',
    desc: 'Handcrafted perfume flacons presented on marble pedestals and floating glass shelves across the boutique sensory alcoves.',
    keywords: ['bottle', 'perfume', 'drop', 'stopper', 'atomizer', 'cap', 'water', 'liquid']
  }
];

function getComponentForMesh(mesh) {
  if (!mesh) return null;
  const mName = (mesh.name || '').toLowerCase();
  const matName = mesh.material ? (Array.isArray(mesh.material) ? mesh.material.map(m => (m.name||'').toLowerCase()).join(' ') : (mesh.material.name||'').toLowerCase()) : '';
  const searchStr = `${mName} ${matName}`;

  for (const comp of architecturalCatalog) {
    for (const kw of comp.keywords) {
      if (searchStr.includes(kw)) {
        return comp;
      }
    }
  }
  return null;
}

function showInspectorHUD(comp) {
  if (!comp) return;
  const hud = document.getElementById('inspector-hud');
  if (!hud) return;

  document.getElementById('inspector-badge').innerText = comp.category;
  document.getElementById('inspector-name').innerText = comp.name;
  document.getElementById('inspector-category').innerText = comp.finish;
  document.getElementById('inspector-desc').innerText = comp.desc;
  document.getElementById('inspector-specs').innerHTML = `
    <div><strong>📐 Dimensions:</strong> ${comp.specs}</div>
    <div><strong>✨ Specification:</strong> ${comp.finish}</div>
  `;
  hud.style.display = 'block';
}

window.closeInspectorHUD = function() {
  const hud = document.getElementById('inspector-hud');
  if (hud) hud.style.display = 'none';
};

window.inspectComponentById = function(id) {
  const comp = architecturalCatalog.find(c => c.id === id);
  if (!comp) return;
  showInspectorHUD(comp);
  
  // Focus camera towards that component
  if (id === 'island') setCameraPreset('island');
  else if (id === 'cashier') setCameraPreset('pos');
  else if (id === 'alcoves_right' || id === 'alcoves_left') setCameraPreset('alcoves');
  else if (id === 'storage_door' || id === 'storage_room') {
    setCameraPreset('storage');
  } else if (id === 'floor') {
    flyCamera(new THREE.Vector3(0, 2.2, 1.5), new THREE.Vector3(0, 0, 0));
  } else if (id === 'vitrine_window') {
    setCameraPreset('front');
  }
};

// Canvas Raycasting on Click
if (container) {
  container.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(modelGroup.children, true);

    if (intersects.length > 0) {
      // Find first valid mesh
      for (const hit of intersects) {
        if (hit.object && hit.object.isMesh) {
          const comp = getComponentForMesh(hit.object);
          if (comp) {
            showInspectorHUD(comp);
            break;
          }
        }
      }
    }
  });

  // Hover cursor change
  container.addEventListener('pointermove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(modelGroup.children, true);
    let hitFound = false;
    for (const hit of intersects) {
      if (hit.object && hit.object.isMesh && getComponentForMesh(hit.object)) {
        hitFound = true;
        break;
      }
    }
    container.style.cursor = hitFound ? 'pointer' : 'default';
  });
}
