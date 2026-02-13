# Cameras

Define viewpoint and projection for rendering.

## Perspective Camera

Realistic camera with field of view (most common):

```javascript
const camera = new THREE.PerspectiveCamera(
  fov,    // field of view in degrees (typically 45-75)
  aspect, // width / height
  near,   // near clipping plane (typically 0.1)
  far     // far clipping plane (typically 1000)
);

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Update after changing parameters
camera.fov = 60;
camera.updateProjectionMatrix();
```

## Orthographic Camera

No perspective distortion (parallel projection):

```javascript
const frustumSize = 10;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  frustumSize * aspect / -2, // left
  frustumSize * aspect / 2,  // right
  frustumSize / 2,           // top
  frustumSize / -2,          // bottom
  0.1,                       // near
  1000                       // far
);

// Useful for: 2D games, CAD, isometric views
```

## Camera Controls (Addons)

### OrbitControls (Most Common)
```javascript
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;   // smooth motion
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2; // prevent going below ground

// In animation loop
function animate() {
  controls.update(); // required if enableDamping = true
  renderer.render(scene, camera);
}
```

### FirstPersonControls
```javascript
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

const controls = new FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 10;
controls.lookSpeed = 0.1;

const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  controls.update(delta);
  renderer.render(scene, camera);
}
```

### FlyControls
```javascript
import { FlyControls } from 'three/addons/controls/FlyControls.js';

const controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 10;
controls.rollSpeed = Math.PI / 24;
controls.dragToLook = true;
```

### TransformControls
```javascript
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const controls = new TransformControls(camera, renderer.domElement);
controls.attach(mesh);
scene.add(controls);

// Switch modes
controls.setMode('translate'); // or 'rotate', 'scale'

// Events
controls.addEventListener('change', () => renderer.render(scene, camera));
controls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value;
});
```

## Camera Methods

```javascript
// Position and orientation
camera.position.set(x, y, z);
camera.lookAt(x, y, z); // or lookAt(vector3) or lookAt(object.position)
camera.up.set(0, 1, 0); // define "up" direction

// Get world direction
const direction = new THREE.Vector3();
camera.getWorldDirection(direction);

// Screen to world conversion
const mouse = new THREE.Vector2(x, y); // normalized device coords (-1 to 1)
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouse, camera);

// World to screen
const vector = new THREE.Vector3(x, y, z);
vector.project(camera); // now in normalized device coords
```

## Layers

Selective rendering with layers:

```javascript
// Set object layers
mesh.layers.set(1);

// Set camera layers
camera.layers.enable(0); // render layer 0
camera.layers.enable(1); // render layer 1
camera.layers.disable(2); // don't render layer 2

// Objects on disabled layers won't be rendered
```

## Frustum Culling

Automatic optimization (objects outside view are not rendered):

```javascript
// Manually check if object is in view
const frustum = new THREE.Frustum();
const matrix = new THREE.Matrix4().multiplyMatrices(
  camera.projectionMatrix,
  camera.matrixWorldInverse
);
frustum.setFromProjectionMatrix(matrix);

if (frustum.containsPoint(object.position)) {
  // Object is visible
}
```

## Multiple Cameras

```javascript
const mainCamera = new THREE.PerspectiveCamera(...);
const minimapCamera = new THREE.OrthographicCamera(...);

// Render with different viewports
renderer.setViewport(0, 0, width, height);
renderer.render(scene, mainCamera);

renderer.setViewport(width - 200, height - 200, 200, 200);
renderer.render(scene, minimapCamera);
```

## Resize Handling

```javascript
window.addEventListener('resize', () => {
  // Perspective camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Orthographic camera
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -frustumSize * aspect / 2;
  camera.right = frustumSize * aspect / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
```
