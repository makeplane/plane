# Asset Loading

Load 3D models, textures, and other assets.

## Loading Manager

Coordinate multiple loads, track progress:

```javascript
const manager = new THREE.LoadingManager();
manager.onStart = (url, loaded, total) => console.log('Loading:', url);
manager.onProgress = (url, loaded, total) => console.log(`${loaded}/${total}`);
manager.onLoad = () => console.log('Complete');
manager.onError = (url) => console.error('Error:', url);

const loader = new THREE.TextureLoader(manager);
```

## GLTF Loader (Recommended Format)

Industry standard, supports PBR materials, animations, bones:

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load(
  'model.gltf',
  (gltf) => {
    scene.add(gltf.scene);

    // Access animations
    const mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  },
  (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
  (error) => console.error(error)
);
```

## FBX Loader

Autodesk format, common in game dev:

```javascript
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const loader = new FBXLoader();
loader.load('model.fbx', (object) => {
  scene.add(object);
});
```

## OBJ Loader

Simple geometry format:

```javascript
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const loader = new OBJLoader();
loader.load('model.obj', (object) => {
  scene.add(object);
});

// With MTL (material library)
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const mtlLoader = new MTLLoader();
mtlLoader.load('model.mtl', (materials) => {
  materials.preload();
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load('model.obj', (object) => scene.add(object));
});
```

## Texture Loader

Load images as textures:

```javascript
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texture.jpg');

// Use in material
const material = new THREE.MeshStandardMaterial({ map: texture });

// Load with callback
textureLoader.load(
  'texture.jpg',
  (texture) => {
    material.map = texture;
    material.needsUpdate = true;
  },
  (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
  (error) => console.error(error)
);
```

## Cube Texture Loader

Load environment maps (skybox):

```javascript
const cubeLoader = new THREE.CubeTextureLoader();
const envMap = cubeLoader.load([
  'px.jpg', 'nx.jpg',  // positive x, negative x
  'py.jpg', 'ny.jpg',  // positive y, negative y
  'pz.jpg', 'nz.jpg'   // positive z, negative z
]);

scene.background = envMap;
material.envMap = envMap;
```

## DRACO Compressed Models

Smaller file sizes for GLTF:

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('path/to/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('compressed.gltf', (gltf) => scene.add(gltf.scene));
```

## KTX2 Compressed Textures

GPU-optimized texture compression:

```javascript
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('path/to/basis/');
ktx2Loader.detectSupport(renderer);
ktx2Loader.load('texture.ktx2', (texture) => {
  material.map = texture;
  material.needsUpdate = true;
});
```

## Common Other Loaders

```javascript
// STL (3D printing)
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

// Collada (.dae)
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';

// 3DS Max
import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';
```

## Best Practices

- Use GLTF/GLB for web (best compression, features)
- Compress with DRACO for large models
- Use KTX2 for textures (GPU-friendly)
- Enable caching: `THREE.Cache.enabled = true;`
- Show loading progress to users
- Handle errors gracefully
