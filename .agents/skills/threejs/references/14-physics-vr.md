# Physics & VR/XR

Integrate physics simulations and virtual reality.

## Physics Integration

Three.js doesn't include physics - use external libraries:

### Rapier Physics (Recommended)

Rust-based, high-performance:

```javascript
import { RapierPhysics } from 'three/addons/physics/RapierPhysics.js';

// Initialize
const physics = await RapierPhysics();

// Create physics body
const box = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial()
);
scene.add(box);

// Add physics (mass > 0 = dynamic)
physics.addMesh(box, 1); // mass = 1

// Static ground
const ground = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.5, 10),
  new THREE.MeshStandardMaterial()
);
ground.position.y = -2;
scene.add(ground);
physics.addMesh(ground); // no mass = static

// Update in animation loop
function animate() {
  physics.step();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Ammo Physics

Port of Bullet physics engine:

```javascript
import { AmmoPhysics } from 'three/addons/physics/AmmoPhysics.js';

const physics = await AmmoPhysics();

// Same API as Rapier
physics.addMesh(mesh, mass);

function animate() {
  physics.step();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Jolt Physics

High-performance alternative:

```javascript
import { JoltPhysics } from 'three/addons/physics/JoltPhysics.js';

const physics = await JoltPhysics();
physics.addMesh(mesh, mass);
```

### Physics Constraints

```javascript
// After initialization
const physics = await RapierPhysics();

// Point-to-point constraint
physics.addConstraint(meshA, meshB, 'fixed');
physics.addConstraint(meshA, meshB, 'spring', { stiffness: 100 });

// Remove constraint
physics.removeConstraint(constraint);
```

## VR/XR Setup

### Basic WebXR

```javascript
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Enable XR
renderer.xr.enabled = true;

// Add VR button to page
document.body.appendChild(VRButton.createButton(renderer));

// Animation loop for VR
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

// Stop using requestAnimationFrame, use setAnimationLoop instead
```

### AR Mode

```javascript
import { ARButton } from 'three/addons/webxr/ARButton.js';

renderer.xr.enabled = true;
document.body.appendChild(ARButton.createButton(renderer));

// AR-specific features
const session = renderer.xr.getSession();
session.requestHitTestSource({ space: viewerSpace }).then((hitTestSource) => {
  // Use hit testing for placing objects
});
```

### VR Controllers

```javascript
// Get controllers
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

scene.add(controller1);
scene.add(controller2);

// Controller events
controller1.addEventListener('selectstart', () => {
  console.log('Trigger pressed');
});

controller1.addEventListener('selectend', () => {
  console.log('Trigger released');
});

// Add visual controller models
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const controllerModelFactory = new XRControllerModelFactory();

const grip1 = renderer.xr.getControllerGrip(0);
grip1.add(controllerModelFactory.createControllerModel(grip1));
scene.add(grip1);

const grip2 = renderer.xr.getControllerGrip(1);
grip2.add(controllerModelFactory.createControllerModel(grip2));
scene.add(grip2);
```

### Hand Tracking

```javascript
import { OculusHandModel } from 'three/addons/webxr/OculusHandModel.js';

const hand1 = renderer.xr.getHand(0);
const handModel1 = new OculusHandModel(hand1);
hand1.add(handModel1);
scene.add(hand1);

const hand2 = renderer.xr.getHand(1);
const handModel2 = new OculusHandModel(hand2);
hand2.add(handModel2);
scene.add(hand2);
```

### Teleportation

```javascript
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

function handleController(controller) {
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    // Teleport on button release
    controller.addEventListener('selectend', () => {
      const offset = intersection.point.y;
      camera.position.y += offset;
    });
  }
}

function getIntersections(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  return raycaster.intersectObjects(scene.children, true);
}
```

### Spatial Audio for VR

```javascript
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('sound.ogg', (buffer) => {
  sound.setBuffer(buffer);
  sound.setRefDistance(1);
  sound.setLoop(true);
  sound.play();
});

// Attach to object
object.add(sound);

// Update listener in VR
renderer.setAnimationLoop(() => {
  // Listener automatically updates with camera in VR
  renderer.render(scene, camera);
});
```

### Room-Scale VR

```javascript
// Request room-scale experience
navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['local-floor']
}).then((session) => {
  // Session setup
});

// Get play area bounds
session.requestReferenceSpace('bounded-floor').then((space) => {
  const bounds = space.boundsGeometry;
  // Create visual boundary
});
```

### Performance Tips for VR

- Target 90 FPS (11.1ms per frame)
- Use lower polygon counts
- Reduce shadow quality
- Limit post-processing
- Use instancing for repeated objects
- Enable foveated rendering if available
- Test on actual VR hardware

```javascript
// Foveated rendering (Quest 2+)
const gl = renderer.getContext();
const ext = gl.getExtension('WEBGL_foveated_rendering');
if (ext) {
  ext.foveatedRenderingModeWEBGL(gl.FOVEATED_RENDERING_MODE_ENABLE_WEBGL);
}
```

## Mixed Reality (MR)

```javascript
import { XRButton } from 'three/addons/webxr/XRButton.js';

// Request MR features
document.body.appendChild(
  XRButton.createButton(renderer, {
    requiredFeatures: ['hand-tracking', 'layers'],
    optionalFeatures: ['local-floor', 'bounded-floor']
  })
);

// Passthrough mode (Quest Pro, etc.)
const session = renderer.xr.getSession();
const baseLayer = session.renderState.baseLayer;
baseLayer.compositionDisabled = true; // enable passthrough
```

## Common VR Patterns

```javascript
// Detect if in VR
if (renderer.xr.isPresenting) {
  // In VR mode
}

// Get VR camera (for raycasting)
const vrCamera = renderer.xr.getCamera(camera);

// Different behavior for VR vs desktop
renderer.setAnimationLoop(() => {
  if (renderer.xr.isPresenting) {
    // VR rendering logic
  } else {
    // Desktop rendering logic
  }
  renderer.render(scene, camera);
});
```
