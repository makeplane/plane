# Camera Controls (Addons)

Interactive camera navigation systems.

## OrbitControls (Most Common)

Orbit camera around a target:

```javascript
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);

// Target point
controls.target.set(0, 0, 0);

// Damping (smooth motion)
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Zoom limits
controls.minDistance = 5;
controls.maxDistance = 50;

// Rotation limits
controls.minPolarAngle = 0;                // radians
controls.maxPolarAngle = Math.PI / 2;      // prevent going below ground
controls.minAzimuthAngle = -Math.PI / 4;   // horizontal limit
controls.maxAzimuthAngle = Math.PI / 4;

// Behavior
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;

// Mouse buttons
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};

// In animation loop (required if damping enabled)
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Events
controls.addEventListener('change', () => {
  renderer.render(scene, camera);
});
```

## MapControls

Bird's-eye map navigation (like OrbitControls but different mouse behavior):

```javascript
import { MapControls } from 'three/addons/controls/MapControls.js';

const controls = new MapControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

// Mouse buttons
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
};
```

## FirstPersonControls

FPS-style camera movement:

```javascript
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

const controls = new FirstPersonControls(camera, renderer.domElement);

controls.movementSpeed = 10;
controls.lookSpeed = 0.1;
controls.lookVertical = true;
controls.constrainVertical = true;
controls.verticalMin = 1.0;
controls.verticalMax = 2.0;

// Requires delta time
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  controls.update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## FlyControls

Free-form flying navigation:

```javascript
import { FlyControls } from 'three/addons/controls/FlyControls.js';

const controls = new FlyControls(camera, renderer.domElement);

controls.movementSpeed = 10;
controls.rollSpeed = Math.PI / 24;
controls.autoForward = false;
controls.dragToLook = false;

const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  controls.update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## PointerLockControls

Locked pointer FPS controls:

```javascript
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const controls = new PointerLockControls(camera, renderer.domElement);

// Lock pointer on click
renderer.domElement.addEventListener('click', () => {
  controls.lock();
});

controls.addEventListener('lock', () => {
  console.log('Locked');
});

controls.addEventListener('unlock', () => {
  console.log('Unlocked');
});

// Movement
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
  }
});

function animate() {
  if (controls.isLocked) {
    // Calculate movement
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    controls.moveForward(direction.z * 10);
    controls.moveRight(direction.x * 10);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## TrackballControls

Intuitive rotation (no gimbal lock):

```javascript
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

const controls = new TrackballControls(camera, renderer.domElement);

controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## ArcballControls

3D rotation with virtual ball metaphor:

```javascript
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';

const controls = new ArcballControls(camera, renderer.domElement, scene);

controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;
controls.cursorZoom = true;

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## Controls Comparison

**OrbitControls**: Product viewers, 3D models, general use
**MapControls**: Top-down maps, strategy games
**FirstPersonControls**: Architectural walkthroughs
**FlyControls**: Space navigation, creative tools
**PointerLockControls**: FPS games
**TrackballControls**: CAD applications
**ArcballControls**: Scientific visualization

## Common Patterns

```javascript
// Disable controls during UI interaction
transformControls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value;
});

// Reset camera position
function resetCamera() {
  controls.reset();
}

// Animate camera to position
function moveCameraTo(position, target) {
  gsap.to(camera.position, {
    duration: 1,
    x: position.x,
    y: position.y,
    z: position.z,
    onUpdate: () => controls.update()
  });
  gsap.to(controls.target, {
    duration: 1,
    x: target.x,
    y: target.y,
    z: target.z
  });
}
```
