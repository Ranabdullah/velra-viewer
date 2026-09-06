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
// Warm luxury architectural studio background
scene.background = new THREE.Color(0x101524);

const camera = new THREE.PerspectiveCamera(
  42,
  container ? (container.clientWidth / container.clientHeight) : (window.innerWidth / window.innerHeight),
  0.1,
  2000
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
renderer.toneMappingExposure = 1.35; // Rich bright illumination
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 1;
controls.maxDistance = 500;

// ---------------------------------------------------------------------------
// 2. Rich Multi-Directional Architectural Illumination (Warm 3000K)
// ---------------------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xfffaee, 1.9);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff6e5, 0x1a243b, 1.4);
scene.add(hemiLight);

const mainSun = new THREE.DirectionalLight(0xfff5e0, 2.8);
mainSun.position.set(35, 75, 45);
mainSun.castShadow = true;
mainSun.shadow.mapSize.set(2048, 2048);
scene.add(mainSun);

const fillLightLeft = new THREE.DirectionalLight(0xffebcf, 1.6);
fillLightLeft.position.set(-40, 50, -30);
scene.add(fillLightLeft);

const fillLightRight = new THREE.DirectionalLight(0xfffaec, 1.4);
fillLightRight.position.set(40, 45, -30);
scene.add(fillLightRight);

const bottomBounce = new THREE.DirectionalLight(0xffe8c8, 0.8);
bottomBounce.position.set(0, -20, 0);
scene.add(bottomBounce);

// ---------------------------------------------------------------------------
// 3. GLTF / DRACO Loader with Auto-Center & Floor Alignment
// ---------------------------------------------------------------------------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let modelRoot = null;
let modelSize = new THREE.Vector3();
let modelCenter = new THREE.Vector3();
let maxDim = 50;

function enhanceMeshMaterial(mesh) {
  if (!mesh.material) return;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  
  mats.forEach(mat => {
    const name = (mat.name || '').toLowerCase();
    
    if (name.includes('light') || name.includes('lamp') || name.includes('emissive')) {
      mat.emissive = new THREE.Color(0xffe29d);
      mat.emissiveIntensity = 3.0;
    } else if (name.includes('gold') || name.includes('brass') || name.includes('metallic')) {
      mat.metalness = 0.94;
      mat.roughness = 0.22;
    } else if (name.includes('marble') || name.includes('calacatta') || name.includes('floor')) {
      mat.roughness = 0.24;
      mat.metalness = 0.04;
    } else if (name.includes('glass') || name.includes('vitrine') || name.includes('window')) {
      mat.transparent = true;
      mat.opacity = 0.38;
      mat.roughness = 0.08;
      mat.metalness = 0.1;
    }
  });
}

gltfLoader.load(
  '/assets/model.glb',
  (gltf) => {
    modelRoot = gltf.scene;
    
    // 1. Calculate Bounding Box
    const box = new THREE.Box3().setFromObject(modelRoot);
    box.getCenter(modelCenter);
    box.getSize(modelSize);
    maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);

    // 2. Center model and rest base at y = 0
    modelRoot.position.x -= modelCenter.x;
    modelRoot.position.y -= box.min.y;
    modelRoot.position.z -= modelCenter.z;

    modelRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        enhanceMeshMaterial(child);
      }
    });

    scene.add(modelRoot);

    // 3. Initial Framing
    setCameraPreset('front');
    console.log('Vel Ra 3D Model loaded and framed.');
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 4. Smooth Camera Animation & Architectural Presets
// ---------------------------------------------------------------------------
let isTransitioning = false;

function flyCamera(targetPos, targetLookAt, duration = 1200) {
  if (isTransitioning) return;
  isTransitioning = true;
  controls.enabled = false;

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  function animate(now) {
    const elapsed = Math.min(1, (now - startTime) / duration);
    const ease = elapsed < 0.5 ? 4 * elapsed * elapsed * elapsed : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;

    camera.position.lerpVectors(startPos, targetPos, ease);
    controls.target.lerpVectors(startTarget, targetLookAt, ease);
    camera.lookAt(controls.target);

    if (elapsed < 1) {
      requestAnimationFrame(animate);
    } else {
      isTransitioning = false;
      controls.enabled = true;
      controls.target.copy(targetLookAt);
      controls.update();
    }
  }
  requestAnimationFrame(animate);
}

function setCameraPreset(preset) {
  if (!modelRoot) return;

  // Update active button state
  document.querySelectorAll('.cam-preset-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-cam-' + preset);
  if (activeBtn) activeBtn.classList.add('active');

  if (preset === 'front') {
    // 01: Front Façade / Entrance
    flyCamera(
      new THREE.Vector3(0, modelSize.y * 0.65, maxDim * 0.90),
      new THREE.Vector3(0, modelSize.y * 0.35, 0)
    );
  } else if (preset === 'island') {
    // 02: Central Consultation Island
    flyCamera(
      new THREE.Vector3(maxDim * 0.18, modelSize.y * 0.42, maxDim * 0.28),
      new THREE.Vector3(0, modelSize.y * 0.22, 0)
    );
  } else if (preset === 'pos') {
    // 03: Cashier & POS Desk
    flyCamera(
      new THREE.Vector3(-maxDim * 0.24, modelSize.y * 0.38, maxDim * 0.20),
      new THREE.Vector3(-maxDim * 0.08, modelSize.y * 0.18, -maxDim * 0.05)
    );
  } else if (preset === 'alcoves') {
    // 04: Arched Perfume Display Wall
    flyCamera(
      new THREE.Vector3(maxDim * 0.26, modelSize.y * 0.40, -maxDim * 0.08),
      new THREE.Vector3(maxDim * 0.10, modelSize.y * 0.28, -maxDim * 0.12)
    );
  } else if (preset === 'top') {
    // 05: Top-Down Plan View
    flyCamera(
      new THREE.Vector3(0, maxDim * 1.35, 0.01),
      new THREE.Vector3(0, 0, 0)
    );
  }
}

// Attach preset buttons
['front', 'island', 'pos', 'alcoves', 'top'].forEach(key => {
  const btn = document.getElementById('btn-cam-' + key);
  if (btn) btn.addEventListener('click', () => setCameraPreset(key));
});

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
// 5. Responsive Resize & Animation Loop
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
  renderer.render(scene, camera);
}

renderLoop();
