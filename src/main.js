import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ---------------------------------------------------------------------------
// 1. Viewport & Canvas Setup
// ---------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

if (!container || !canvas) {
  console.warn('Three.js container or canvas missing');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e121e);

const camera = new THREE.PerspectiveCamera(
  45,
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
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49; // Prevent going below floor
controls.minDistance = 1;
controls.maxDistance = 500;

// ---------------------------------------------------------------------------
// 2. Comprehensive Architectural Lighting Setup
// ---------------------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x1e293b, 1.0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
sunLight.position.set(40, 80, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);

const fillLight1 = new THREE.DirectionalLight(0xffecd2, 1.2);
fillLight1.position.set(-40, 50, -40);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
fillLight2.position.set(0, 40, -60);
scene.add(fillLight2);

// ---------------------------------------------------------------------------
// 3. GLTF / DRACO Model Loader with Auto-Framing
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
    
    // Light strips & Emissives
    if (name.includes('light') || name.includes('lamp') || name.includes('emissive')) {
      mat.emissive = new THREE.Color(0xffe29d);
      mat.emissiveIntensity = 2.5;
    }
    // Gold & Brass metals
    else if (name.includes('gold') || name.includes('brass') || name.includes('metallic')) {
      mat.metalness = 0.92;
      mat.roughness = 0.24;
    }
    // Marble & Porcelain
    else if (name.includes('marble') || name.includes('calacatta') || name.includes('floor')) {
      mat.roughness = 0.28;
      mat.metalness = 0.05;
    }
    // Glass
    else if (name.includes('glass') || name.includes('vitrine') || name.includes('window')) {
      mat.transparent = true;
      mat.opacity = 0.35;
      mat.roughness = 0.1;
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

    // 2. Center model so its base sits at y = 0
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

    // 3. Frame camera based on model size
    const fov = camera.fov * (Math.PI / 180);
    const cameraDist = Math.abs(maxDim / Math.sin(fov / 2)) * 0.75;
    
    camera.position.set(0, modelSize.y * 0.7, cameraDist);
    controls.target.set(0, modelSize.y * 0.4, 0);
    controls.maxDistance = maxDim * 4;
    controls.minDistance = maxDim * 0.05;
    controls.update();

    console.log('Vel Ra 3D Model Loaded & Framed Successfully!');
  },
  undefined,
  (err) => {
    console.warn('Could not load /assets/model.glb:', err);
  }
);

// ---------------------------------------------------------------------------
// 4. Smooth Camera Transitions & Presets
// ---------------------------------------------------------------------------
let isTransitioning = false;

function flyCamera(targetPos, targetLookAt, duration = 1400) {
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

// Preset Handlers
const btnFront = document.getElementById('btn-cam-front');
const btnIsland = document.getElementById('btn-cam-island');
const btnPos = document.getElementById('btn-cam-pos');
const btnTop = document.getElementById('btn-cam-top');
const btnWireframe = document.getElementById('btn-wireframe');

if (btnFront) {
  btnFront.addEventListener('click', () => {
    flyCamera(new THREE.Vector3(0, modelSize.y * 0.6, maxDim * 0.85), new THREE.Vector3(0, modelSize.y * 0.35, 0));
  });
}

if (btnIsland) {
  btnIsland.addEventListener('click', () => {
    flyCamera(new THREE.Vector3(maxDim * 0.25, modelSize.y * 0.45, maxDim * 0.3), new THREE.Vector3(0, modelSize.y * 0.25, 0));
  });
}

if (btnPos) {
  btnPos.addEventListener('click', () => {
    flyCamera(new THREE.Vector3(-maxDim * 0.28, modelSize.y * 0.4, maxDim * 0.25), new THREE.Vector3(-maxDim * 0.1, modelSize.y * 0.2, 0));
  });
}

if (btnTop) {
  btnTop.addEventListener('click', () => {
    flyCamera(new THREE.Vector3(0, maxDim * 1.3, 0.01), new THREE.Vector3(0, 0, 0));
  });
}

let isWireframe = false;
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
    btnWireframe.style.background = isWireframe ? 'rgba(212, 175, 55, 0.6)' : 'rgba(15, 23, 42, 0.75)';
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
