# Specialized Loaders

Domain-specific file format loaders.

## SVG Loader

Load and extrude SVG paths:

```javascript
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const loader = new SVGLoader();
loader.load('image.svg', (data) => {
  const paths = data.paths;
  const group = new THREE.Group();

  paths.forEach((path) => {
    const material = new THREE.MeshBasicMaterial({
      color: path.color,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    });
  });

  // Extrude SVG
  paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 10,
      bevelEnabled: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  });

  scene.add(group);
});
```

## Collada (.dae) Loader

XML-based format from Blender, SketchUp:

```javascript
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';

const loader = new ColladaLoader();
loader.load('model.dae', (collada) => {
  const model = collada.scene;
  scene.add(model);

  // Access animations
  const animations = collada.animations;
  const mixer = new THREE.AnimationMixer(model);
  animations.forEach(clip => mixer.clipAction(clip).play());
});
```

## STL Loader

3D printing format:

```javascript
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const loader = new STLLoader();
loader.load('model.stl', (geometry) => {
  const material = new THREE.MeshPhongMaterial({ color: 0xff5533 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // STL doesn't include normals, compute them
  geometry.computeVertexNormals();
});
```

## 3MF Loader

Modern 3D printing format:

```javascript
import { 3MFLoader } from 'three/addons/loaders/3MFLoader.js';

const loader = new 3MFLoader();
loader.load('model.3mf', (object) => {
  scene.add(object);
});
```

## VRML/X3D Loader

Virtual Reality Modeling Language:

```javascript
import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';

const loader = new VRMLLoader();
loader.load('model.wrl', (object) => {
  scene.add(object);
});
```

## PDB Loader

Protein Data Bank (chemistry/molecular):

```javascript
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';

const loader = new PDBLoader();
loader.load('molecule.pdb', (pdb) => {
  const geometryAtoms = pdb.geometryAtoms;
  const geometryBonds = pdb.geometryBonds;
  const json = pdb.json;

  // Render atoms as spheres
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const atoms = new THREE.Mesh(geometryAtoms, material);
  scene.add(atoms);

  // Render bonds as cylinders
  const bondMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  const bonds = new THREE.Mesh(geometryBonds, bondMaterial);
  scene.add(bonds);
});
```

## LDraw Loader

LEGO models:

```javascript
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';

const loader = new LDrawLoader();
loader.setPath('ldraw/');

loader.load('model.mpd', (group) => {
  scene.add(group);

  // Smooth LEGO bricks
  group.traverse((child) => {
    if (child.isMesh) {
      child.material.flatShading = false;
    }
  });
});
```

## VTK Loader

Visualization Toolkit (scientific data):

```javascript
import { VTKLoader } from 'three/addons/loaders/VTKLoader.js';

const loader = new VTKLoader();
loader.load('model.vtk', (geometry) => {
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

## PLY Loader

Polygon file format (scanned 3D data):

```javascript
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

const loader = new PLYLoader();
loader.load('model.ply', (geometry) => {
  geometry.computeVertexNormals();

  // Check if has vertex colors
  const material = geometry.attributes.color ?
    new THREE.MeshStandardMaterial({ vertexColors: true }) :
    new THREE.MeshStandardMaterial({ color: 0x888888 });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

## 3DS Loader

3DS Max format:

```javascript
import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';

const loader = new TDSLoader();
loader.load('model.3ds', (object) => {
  scene.add(object);
});
```

## USDZ Loader/Exporter

Apple's AR format:

```javascript
// Export to USDZ (for iOS AR)
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';

const exporter = new USDZExporter();
const arraybuffer = await exporter.parse(scene);
const blob = new Blob([arraybuffer], { type: 'application/octet-stream' });

// Download or serve for AR Quick Look
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'model.usdz';
link.click();
```

## Font Loader (Text)

Load fonts for 3D text:

```javascript
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const fontLoader = new FontLoader();
fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
  const geometry = new TextGeometry('Hello World', {
    font: font,
    size: 80,
    height: 5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 10,
    bevelSize: 8,
    bevelSegments: 5
  });

  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

## EXR Loader

High dynamic range images:

```javascript
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

const loader = new EXRLoader();
loader.load('env.exr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = texture;
  scene.environment = texture;
});
```

## RGBE/HDR Loader

HDR environment maps:

```javascript
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const loader = new RGBELoader();
loader.load('env.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = texture;
  scene.environment = texture;

  // Use with PMREM generator for better quality
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  texture.dispose();
  pmremGenerator.dispose();
});
```

## Basis/KTX2 Texture Loader

GPU-optimized texture compression:

```javascript
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const loader = new KTX2Loader();
loader.setTranscoderPath('basis/');
loader.detectSupport(renderer);

loader.load('texture.ktx2', (texture) => {
  material.map = texture;
  material.needsUpdate = true;
});
```

## Common Patterns

```javascript
// Load with progress
loader.load(
  'file.ext',
  (result) => { /* success */ },
  (xhr) => {
    const percent = (xhr.loaded / xhr.total * 100);
    console.log(`${percent}% loaded`);
  },
  (error) => { /* error */ }
);

// Center imported model
const box = new THREE.Box3().setFromObject(model);
const center = box.getCenter(new THREE.Vector3());
model.position.sub(center);

// Scale to fit
const size = box.getSize(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);
const scale = 10 / maxDim;
model.scale.setScalar(scale);
```
