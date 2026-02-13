# Interaction & Picking

Handle user input and object interaction.

## Mouse/Touch Raycasting

Detect which object user clicked:

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickableObjects = []; // array of meshes

function onPointerMove(event) {
  // Normalize mouse coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Find intersections
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    // Hover effect
    intersects[0].object.material.emissive.setHex(0xff0000);
  }
}

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    console.log('Clicked:', object.name);
    console.log('Point:', intersects[0].point);
  }
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('click', onClick);
```

## DragControls (Addon)

Drag objects with mouse:

```javascript
import { DragControls } from 'three/addons/controls/DragControls.js';

const controls = new DragControls(objectsArray, camera, renderer.domElement);

// Events
controls.addEventListener('dragstart', (event) => {
  orbitControls.enabled = false; // disable camera controls during drag
  event.object.material.emissive.set(0xaaaaaa);
});

controls.addEventListener('drag', (event) => {
  console.log(event.object.position);
});

controls.addEventListener('dragend', (event) => {
  orbitControls.enabled = true;
  event.object.material.emissive.set(0x000000);
});
```

## TransformControls (Addon)

Interactive 3D gizmo for translate/rotate/scale:

```javascript
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

// Attach to object
transformControls.attach(mesh);

// Switch modes
transformControls.setMode('translate'); // or 'rotate', 'scale'

// Switch space
transformControls.setSpace('world'); // or 'local'

// Events
transformControls.addEventListener('change', () => {
  renderer.render(scene, camera);
});

transformControls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value; // disable orbit during transform
});

// Keyboard shortcuts
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'g': transformControls.setMode('translate'); break;
    case 'r': transformControls.setMode('rotate'); break;
    case 's': transformControls.setMode('scale'); break;
    case 'x': transformControls.showX = !transformControls.showX; break;
    case 'Escape': transformControls.detach(); break;
  }
});
```

## Selection Box (Addon)

Box selection for multiple objects:

```javascript
import { SelectionBox } from 'three/addons/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/addons/interactive/SelectionHelper.js';

const selectionBox = new SelectionBox(camera, scene);
const helper = new SelectionHelper(renderer, 'selectBox');

let isSelecting = false;

renderer.domElement.addEventListener('pointerdown', (event) => {
  isSelecting = true;
  selectionBox.startPoint.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  );
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (isSelecting) {
    selectionBox.endPoint.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    );
    const allSelected = selectionBox.select();
    console.log('Selected:', allSelected.length);
  }
});

renderer.domElement.addEventListener('pointerup', () => {
  isSelecting = false;
});
```

## Keyboard Input

Handle keyboard controls:

```javascript
const keysPressed = {};

window.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;
});

window.addEventListener('keyup', (event) => {
  keysPressed[event.key] = false;
});

// In animation loop
function animate() {
  const speed = 0.1;

  if (keysPressed['w']) object.position.z -= speed;
  if (keysPressed['s']) object.position.z += speed;
  if (keysPressed['a']) object.position.x -= speed;
  if (keysPressed['d']) object.position.x += speed;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## Pointer Lock (First Person)

Lock pointer for FPS controls:

```javascript
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const controls = new PointerLockControls(camera, renderer.domElement);

// Lock on click
renderer.domElement.addEventListener('click', () => {
  controls.lock();
});

controls.addEventListener('lock', () => {
  console.log('Pointer locked');
});

controls.addEventListener('unlock', () => {
  console.log('Pointer unlocked');
});

// Movement
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function animate() {
  if (controls.isLocked) {
    // Apply movement
    controls.moveForward(velocity.z);
    controls.moveRight(velocity.x);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## Object Highlighting

Visual feedback on hover/selection:

```javascript
let hoveredObject = null;
const originalEmissive = new THREE.Color();

function onPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Reset previous
  if (hoveredObject) {
    hoveredObject.material.emissive.copy(originalEmissive);
    hoveredObject = null;
  }

  // Highlight new
  if (intersects.length > 0) {
    hoveredObject = intersects[0].object;
    originalEmissive.copy(hoveredObject.material.emissive);
    hoveredObject.material.emissive.setHex(0x555555);
  }

  renderer.domElement.style.cursor = hoveredObject ? 'pointer' : 'default';
}
```

## Tooltips & UI Overlays

Show HTML tooltip at 3D position:

```javascript
function updateTooltip(object3D, text) {
  const vector = object3D.position.clone();
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.textContent = text;
}
```
