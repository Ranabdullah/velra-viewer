import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// 1. Viewport & Canvas Setup
// ---------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d14);

const camera = new THREE.PerspectiveCamera(
  38,
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

// ---------------------------------------------------------------------------
// 2. Post-Processing: Cinematic Bloom for Glowing Light Materials
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Threshold > 1.0 ensures only emissive light fixtures glow, not standard walls
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(container ? container.clientWidth : window.innerWidth, container ? container.clientHeight : window.innerHeight),
  0.55, // Bloom strength (warm radiant glow)
  0.45, // Bloom radius
  1.05  // Bloom threshold (only emissive materials glow)
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.4;
controls.maxDistance = 12;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.0;

// ---------------------------------------------------------------------------
// 3. HDRI Environment Lighting (Subtle Diffuse + Specular only for metals)
// ---------------------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const exrLoader = new EXRLoader();
exrLoader.load(
  '/assets/urban_street_02_2k.exr',
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.45; // Subtle natural IBL fill without making walls glossy
    texture.dispose();
    pmremGenerator.dispose();
    requestRender();
    console.log('HDRI Environment Map loaded.');
  },
  undefined,
  (err) => console.warn('Notice loading EXR map:', err)
);

// ---------------------------------------------------------------------------
// 4. Realistic Sun, Shadows, and Actual Light Sources at Fixtures
// ---------------------------------------------------------------------------
// 4.1 Ambient Base (Darker for rich shadow depth and contrast)
const ambientLight = new THREE.AmbientLight(0xffeedd, 0.22);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff5ea, 0x111622, 0.30);
scene.add(hemiLight);

// 4.2 Strong Angled Sunlight Streaming Through Front Glazing
const sunLight = new THREE.DirectionalLight(0xfff4e2, 3.8);
sunLight.position.set(6.0, 7.0, 8.5);
sunLight.target.position.set(-0.6, 0.8, -0.6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.bias = -0.0001;
sunLight.shadow.normalBias = 0.035; // Eliminates shadow acne, keeps crisp contact shadows
sunLight.shadow.radius = 2.0;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 26;
sunLight.shadow.camera.left = -5.5;
sunLight.shadow.camera.right = 5.5;
sunLight.shadow.camera.top = 5.5;
sunLight.shadow.camera.bottom = -5.5;
scene.add(sunLight);
scene.add(sunLight.target);

// 4.3 Floor Sun-Bounce Light
const floorBounce = new THREE.PointLight(0xffdfb0, 1.2, 7, 1.8);
floorBounce.position.set(0.4, 0.3, 0.8);
scene.add(floorBounce);

// 4.4 Ceiling Cove Warm LED Light (Light Physically Emanating from Cove)
const coveLight = new THREE.PointLight(0xffe2a8, 2.2, 8, 1.8);
coveLight.position.set(0, 2.35, 0);
scene.add(coveLight);

// 4.5 Central Island Light (Light Physically Emanating from Ceiling Fixture)
const islandLight = new THREE.SpotLight(0xffeed8, 4.0, 7.5, Math.PI / 4.5, 0.7, 1.8);
islandLight.position.set(0, 2.55, 0.2);
islandLight.target.position.set(0, 0.85, 0.2);
islandLight.castShadow = true;
islandLight.shadow.mapSize.set(1024, 1024);
islandLight.shadow.bias = -0.0001;
islandLight.shadow.normalBias = 0.02;
scene.add(islandLight);
scene.add(islandLight.target);

// 4.6 Backwall 3D Monogram Halo Light
const monogramLight = new THREE.PointLight(0xffdf88, 3.4, 4.5, 1.8);
monogramLight.position.set(-0.2, 1.7, -1.6);
scene.add(monogramLight);

// 4.7 Arched Wall Niches Downward Display Lights
const rightNicheLight = new THREE.SpotLight(0xffe8c8, 3.0, 6.5, Math.PI / 3.5, 0.75, 1.8);
rightNicheLight.position.set(1.4, 2.4, 0.5);
rightNicheLight.target.position.set(1.6, 0.8, 0.5);
scene.add(rightNicheLight);
scene.add(rightNicheLight.target);

const leftNicheLight = new THREE.SpotLight(0xffe8c8, 3.0, 6.5, Math.PI / 3.5, 0.75, 1.8);
leftNicheLight.position.set(-1.4, 2.4, 0.5);
leftNicheLight.target.position.set(-1.6, 0.8, 0.5);
scene.add(leftNicheLight);
scene.add(leftNicheLight.target);

// ---------------------------------------------------------------------------
// 5. Accurate PBR Materials (Only Metals Reflect, Walls & Plaster are MATTE)
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

    // 1. LIGHT-EMITTING MATERIALS (Physically Glowing with Bloom)
    if (matName.includes('light') || matName.includes('lamp') || matName.includes('emissive') || meshName.includes('text') || meshName.includes('signage')) {
      mat.emissive = new THREE.Color(0xffe090);
      mat.emissiveIntensity = 3.6; // Radiant glow triggering bloom pass
      mat.toneMapped = false;
      mat.roughness = 0.3;
      mat.metalness = 0.0;
    }
    // 2. GOLD & BRASS METALS (Only these have high metalness & reflections)
    else if (matName.includes('gold') || matName.includes('brass') || meshName.includes('brass') || meshName.includes('gold') || matName.includes('m03') || matName.includes('m04')) {
      mat.metalness = 0.95;
      mat.roughness = 0.22;
      mat.color = new THREE.Color(0xd4af37); // True Champagne Gold
      mat.emissive = new THREE.Color(0x181002);
      mat.emissiveIntensity = 0.2;
    } 
    // 3. CALACATTA MARBLE (Subtle natural stone polish, NOT a mirror)
    else if (matName.includes('marble') || matName.includes('calacatta') || matName.includes('floor') || meshName.includes('floor') || matName.includes('m02') || matName.includes('m06')) {
      mat.roughness = 0.32; // Soft satin hone (realistic marble, not plastic shine)
      mat.metalness = 0.02;
      mat.color = new THREE.Color(0xfcfaf6);
    } 
    // 4. WALLS, PLASTER, CEILING (Completely MATTE, Zero Shininess)
    else if (matName.includes('wall') || matName.includes('plaster') || meshName.includes('wall') || matName.includes('cement') || meshName.includes('ceiling') || matName.includes('ceiling')) {
      mat.color = new THREE.Color(0xf1eee7); // Soft matte warm plaster
      mat.roughness = 0.98; // 100% MATTE - No plastic shine
      mat.metalness = 0.0;  // Zero metal reflection
    } 
    // 5. CLEAR VITRINE & WINDOW GLASS
    else if (matName.includes('glass') || matName.includes('vitrine') || matName.includes('window') || meshName.includes('glass')) {
      mat.transparent = true;
      mat.opacity = 0.22;
      mat.roughness = 0.04;
      mat.metalness = 0.05;
      mat.color = new THREE.Color(0xf4f7fa);
    } 
    // 6. SMOKED TIMBER & WOOD
    else if (matName.includes('oak') || matName.includes('wood') || matName.includes('timber') || meshName.includes('door')) {
      mat.roughness = 0.80; // Natural matte wood
      mat.metalness = 0.0;
    }
    // 7. DEFAULT MATTE FALLBACK FOR ALL OTHER OBJECTS
    else {
      mat.roughness = 0.85;
      mat.metalness = 0.0;
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
    console.log('Vel Ra 3D Model loaded with accurate matte PBR materials, glowing emissives, and realistic sunlight.');
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 6. Calibrated Camera Presets (Matching User Screenshots)
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
// 10. High-Performance IntersectionObserver & Smart Render Loop
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
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
  requestRender();
}

window.addEventListener('resize', onWindowResize);

function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (!isViewportVisible) return;

  if (controls.autoRotate || isTransitioning || renderRequested) {
    controls.update();
    clampCameraInsideWalls();
    composer.render();
    renderRequested = false;
  }
}

renderLoop();
