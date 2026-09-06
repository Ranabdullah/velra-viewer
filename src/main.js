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
controls.minDistance = 0.5;
controls.maxDistance = 600;

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
// 3. Model Hierarchy & Transform System
// ---------------------------------------------------------------------------
// modelRoot (centered at origin) -> modelGroup (has user position & rotation)
const modelGroup = new THREE.Group();
scene.add(modelGroup);

let modelRoot = null;
let modelSize = new THREE.Vector3();
let modelCenter = new THREE.Vector3();
let maxDim = 50;

// Default Model Transform
const DEFAULT_MODEL_TRANSFORM = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0, // degrees
  rotY: 0, // degrees
  rotZ: 0, // degrees
  scale: 1.0
};

let currentModelTransform = { ...DEFAULT_MODEL_TRANSFORM };

// Load saved model transform from localStorage
function loadSavedModelTransform() {
  try {
    const saved = localStorage.getItem('velra_3d_model_transform');
    if (saved) {
      const parsed = JSON.parse(saved);
      currentModelTransform = { ...DEFAULT_MODEL_TRANSFORM, ...parsed };
    }
  } catch (e) {
    console.warn('Could not load saved model transform:', e);
  }
}

function applyModelTransform() {
  modelGroup.position.set(
    currentModelTransform.posX,
    currentModelTransform.posY,
    currentModelTransform.posZ
  );
  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(currentModelTransform.rotX),
    THREE.MathUtils.degToRad(currentModelTransform.rotY),
    THREE.MathUtils.degToRad(currentModelTransform.rotZ)
  );
  modelGroup.scale.setScalar(currentModelTransform.scale || 1.0);
}

loadSavedModelTransform();
applyModelTransform();

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

// ---------------------------------------------------------------------------
// 4. GLTF / DRACO Loader
// ---------------------------------------------------------------------------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load(
  '/assets/model.glb',
  (gltf) => {
    modelRoot = gltf.scene;
    
    // 1. Calculate Bounding Box
    const box = new THREE.Box3().setFromObject(modelRoot);
    box.getCenter(modelCenter);
    box.getSize(modelSize);
    maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);

    // 2. Center model inside modelRoot and rest base at y = 0
    modelRoot.position.x = -modelCenter.x;
    modelRoot.position.y = -box.min.y;
    modelRoot.position.z = -modelCenter.z;

    modelRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        enhanceMeshMaterial(child);
      }
    });

    modelGroup.add(modelRoot);
    applyModelTransform();

    // 3. Initialize Camera Presets and fly to initial preset
    initCameraPresets();
    setCameraPreset('front');
    console.log('Vel Ra 3D Model loaded, centered, and transform applied.');

    // Notify UI that model is ready
    if (window.onVelraModelReady) window.onVelraModelReady();
  },
  undefined,
  (err) => console.warn('Model loading notice:', err)
);

// ---------------------------------------------------------------------------
// 5. Camera Presets & Location / Rotation Persistence
// ---------------------------------------------------------------------------
let defaultCameraPresets = {};

function initCameraPresets() {
  defaultCameraPresets = {
    'front': {
      name: '01 // Front Entrance',
      pos: [0, modelSize.y * 0.65, maxDim * 0.90],
      target: [0, modelSize.y * 0.35, 0]
    },
    'island': {
      name: '02 // Central Island',
      pos: [maxDim * 0.18, modelSize.y * 0.42, maxDim * 0.28],
      target: [0, modelSize.y * 0.22, 0]
    },
    'pos': {
      name: '03 // POS Cashier Desk',
      pos: [-maxDim * 0.24, modelSize.y * 0.38, maxDim * 0.20],
      target: [-maxDim * 0.08, modelSize.y * 0.18, -maxDim * 0.05]
    },
    'alcoves': {
      name: '04 // Perfume Wall Alcoves',
      pos: [maxDim * 0.26, modelSize.y * 0.40, -maxDim * 0.08],
      target: [maxDim * 0.10, modelSize.y * 0.28, -maxDim * 0.12]
    },
    'top': {
      name: '05 // Top-Down Plan',
      pos: [0, maxDim * 1.35, 0.01],
      target: [0, 0, 0]
    },
    // Render Passes Viewpoints
    'pass1': {
      name: 'Pass 01 // Front Entrance Perspective',
      pos: [0, modelSize.y * 0.62, maxDim * 0.85],
      target: [0, modelSize.y * 0.32, 0]
    },
    'pass2': {
      name: 'Pass 02 // Façade & Window Vitrine',
      pos: [-maxDim * 0.35, modelSize.y * 0.55, maxDim * 0.70],
      target: [-maxDim * 0.10, modelSize.y * 0.30, maxDim * 0.10]
    },
    'pass3': {
      name: 'Pass 03 // Back Wall & Monogram',
      pos: [0, modelSize.y * 0.45, maxDim * 0.30],
      target: [0, modelSize.y * 0.35, -maxDim * 0.45]
    },
    'pass4': {
      name: 'Pass 04 // VIP Consultation Lounge',
      pos: [-maxDim * 0.28, modelSize.y * 0.35, -maxDim * 0.15],
      target: [-maxDim * 0.35, modelSize.y * 0.30, -maxDim * 0.35]
    },
    'pass5': {
      name: 'Pass 05 // Fluted Glass Partition',
      pos: [maxDim * 0.15, modelSize.y * 0.38, maxDim * 0.05],
      target: [maxDim * 0.30, modelSize.y * 0.30, -maxDim * 0.10]
    },
    'pass6': {
      name: 'Pass 06 // Arched Display Wall',
      pos: [maxDim * 0.22, modelSize.y * 0.38, -maxDim * 0.05],
      target: [maxDim * 0.40, modelSize.y * 0.30, -maxDim * 0.15]
    },
    'pass7': {
      name: 'Pass 07 // Ceiling Lighting Cove',
      pos: [0, modelSize.y * 0.25, maxDim * 0.40],
      target: [0, modelSize.y * 0.85, 0]
    },
    'pass8': {
      name: 'Pass 08 // Calacatta Floor Inlay',
      pos: [0, modelSize.y * 0.75, maxDim * 0.25],
      target: [0, 0, 0]
    },
    'pass9': {
      name: 'Pass 09 // Fragrance Island Centerpiece',
      pos: [maxDim * 0.14, modelSize.y * 0.36, maxDim * 0.22],
      target: [0, modelSize.y * 0.20, 0]
    }
  };
}

let activeCameraPresets = {};

function loadSavedCameraLocations() {
  try {
    const saved = localStorage.getItem('velra_3d_camera_locations');
    if (saved) {
      const parsed = JSON.parse(saved);
      activeCameraPresets = { ...defaultCameraPresets, ...parsed };
      return;
    }
  } catch (e) {
    console.warn('Could not load saved camera locations:', e);
  }
  activeCameraPresets = { ...defaultCameraPresets };
}

// ---------------------------------------------------------------------------
// 6. Smooth Camera Fly Animation
// ---------------------------------------------------------------------------
let isTransitioning = false;

function flyCamera(targetPos, targetLookAt, duration = 1100) {
  if (isTransitioning) return;
  isTransitioning = true;
  controls.enabled = false;

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  const destPos = Array.isArray(targetPos) ? new THREE.Vector3(...targetPos) : targetPos;
  const destTarget = Array.isArray(targetLookAt) ? new THREE.Vector3(...targetLookAt) : targetLookAt;

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
    }
  }
  requestAnimationFrame(animate);
}

function setCameraPreset(presetKey) {
  if (!modelRoot) return;
  loadSavedCameraLocations();

  const data = activeCameraPresets[presetKey] || defaultCameraPresets[presetKey];
  if (!data) return;

  // Update active button state in preset bar
  document.querySelectorAll('.cam-preset-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-cam-' + presetKey);
  if (activeBtn) activeBtn.classList.add('active');

  flyCamera(data.pos, data.target);
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
// 7. PUBLIC 3D STUDIO API (Location, Rotation & Persistence)
// ---------------------------------------------------------------------------
window.velra3D = {
  // Model Transform Controls
  getModelTransform() {
    return { ...currentModelTransform };
  },

  setModelTransform(transform) {
    currentModelTransform = { ...currentModelTransform, ...transform };
    applyModelTransform();
  },

  saveModelTransform() {
    try {
      localStorage.setItem('velra_3d_model_transform', JSON.stringify(currentModelTransform));
      console.log('Model transform saved permanently:', currentModelTransform);
      return true;
    } catch (e) {
      console.error('Failed to save model transform:', e);
      return false;
    }
  },

  resetModelTransform() {
    currentModelTransform = { ...DEFAULT_MODEL_TRANSFORM };
    applyModelTransform();
    localStorage.removeItem('velra_3d_model_transform');
  },

  // Camera Telemetry & Viewpoints
  getCameraTelemetry() {
    const pos = camera.position;
    const target = controls.target;
    const distance = pos.distanceTo(target);
    
    // Euler angles of camera
    const rot = new THREE.Euler().setFromRotationMatrix(camera.matrix);
    return {
      pos: { x: Number(pos.x.toFixed(2)), y: Number(pos.y.toFixed(2)), z: Number(pos.z.toFixed(2)) },
      target: { x: Number(target.x.toFixed(2)), y: Number(target.y.toFixed(2)), z: Number(target.z.toFixed(2)) },
      rotDeg: {
        x: Number(THREE.MathUtils.radToDeg(rot.x).toFixed(1)),
        y: Number(THREE.MathUtils.radToDeg(rot.y).toFixed(1)),
        z: Number(THREE.MathUtils.radToDeg(rot.z).toFixed(1))
      },
      distance: Number(distance.toFixed(2)),
      fov: camera.fov
    };
  },

  getAllPresets() {
    loadSavedCameraLocations();
    return { ...activeCameraPresets };
  },

  setCameraPreset(presetKey) {
    setCameraPreset(presetKey);
  },

  saveCurrentCameraView(presetKey, customName) {
    loadSavedCameraLocations();
    const tel = this.getCameraTelemetry();
    const name = customName || (activeCameraPresets[presetKey] ? activeCameraPresets[presetKey].name : presetKey);
    
    activeCameraPresets[presetKey] = {
      name: name,
      pos: [tel.pos.x, tel.pos.y, tel.pos.z],
      target: [tel.target.x, tel.target.y, tel.target.z]
    };

    try {
      localStorage.setItem('velra_3d_camera_locations', JSON.stringify(activeCameraPresets));
      console.log(`Saved camera location & rotation for "${presetKey}":`, activeCameraPresets[presetKey]);
      return true;
    } catch (e) {
      console.error('Failed to save camera location:', e);
      return false;
    }
  },

  resetCameraPreset(presetKey) {
    loadSavedCameraLocations();
    if (defaultCameraPresets[presetKey]) {
      activeCameraPresets[presetKey] = { ...defaultCameraPresets[presetKey] };
      localStorage.setItem('velra_3d_camera_locations', JSON.stringify(activeCameraPresets));
      setCameraPreset(presetKey);
    }
  },

  // Full Configuration Export & Import
  exportAllConfig() {
    return JSON.stringify({
      version: '1.0',
      modelTransform: currentModelTransform,
      cameraLocations: activeCameraPresets
    }, null, 2);
  },

  importConfig(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (data.modelTransform) {
        currentModelTransform = { ...DEFAULT_MODEL_TRANSFORM, ...data.modelTransform };
        applyModelTransform();
        localStorage.setItem('velra_3d_model_transform', JSON.stringify(currentModelTransform));
      }
      if (data.cameraLocations) {
        activeCameraPresets = { ...data.cameraLocations };
        localStorage.setItem('velra_3d_camera_locations', JSON.stringify(activeCameraPresets));
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  resetAllToDefault() {
    this.resetModelTransform();
    localStorage.removeItem('velra_3d_camera_locations');
    activeCameraPresets = { ...defaultCameraPresets };
    setCameraPreset('front');
  }
};

// ---------------------------------------------------------------------------
// 8. Responsive Resize & Animation Loop
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

  // If studio panel is open, update live telemetry
  if (window.updateStudioTelemetry) {
    window.updateStudioTelemetry();
  }
}

renderLoop();
