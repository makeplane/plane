# Animations

Animate objects, cameras, and imported models.

## Animation System

Three.js uses AnimationMixer for playback:

```javascript
// Create mixer for object
const mixer = new THREE.AnimationMixer(object);

// Play animation clip
const action = mixer.clipAction(animationClip);
action.play();

// Update in render loop
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  mixer.update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## Loading Animations

From GLTF/FBX files:

```javascript
const loader = new GLTFLoader();
loader.load('model.gltf', (gltf) => {
  scene.add(gltf.scene);

  const mixer = new THREE.AnimationMixer(gltf.scene);

  // Play all animations
  gltf.animations.forEach((clip) => {
    mixer.clipAction(clip).play();
  });

  // Or play specific animation
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'Walk');
  const action = mixer.clipAction(clip);
  action.play();
});
```

## Animation Actions

Control playback:

```javascript
const action = mixer.clipAction(clip);

// Playback control
action.play();
action.stop();
action.pause();
action.reset();

// Loop modes
action.setLoop(THREE.LoopRepeat, Infinity);    // loop forever
action.setLoop(THREE.LoopOnce, 1);             // play once, stop at end
action.setLoop(THREE.LoopPingPong, Infinity);  // reverse on each loop

// Speed control
action.timeScale = 1.5; // 1.5x speed
action.timeScale = -1;  // reverse

// Weight (for blending)
action.setEffectiveWeight(0.5); // 50% influence

// Enable/disable
action.enabled = true;
```

## Animation Blending

Smooth transitions between animations:

```javascript
// Crossfade between two actions
currentAction.crossFadeTo(nextAction, 0.5, true); // 0.5 second transition

// Or manually control weights
currentAction.fadeOut(0.5);
nextAction.reset().fadeIn(0.5).play();
```

## Creating Custom Animations

Using KeyframeTracks:

```javascript
// Position animation
const times = [0, 1, 2]; // keyframe times in seconds
const values = [0, 0, 0,  10, 0, 0,  0, 0, 0]; // x,y,z for each time

const positionKF = new THREE.VectorKeyframeTrack(
  '.position', // property path
  times,
  values
);

// Rotation animation (quaternions)
const quaternion1 = new THREE.Quaternion();
const quaternion2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
const rotationKF = new THREE.QuaternionKeyframeTrack(
  '.quaternion',
  [0, 1],
  [
    quaternion1.x, quaternion1.y, quaternion1.z, quaternion1.w,
    quaternion2.x, quaternion2.y, quaternion2.z, quaternion2.w
  ]
);

// Create clip from tracks
const clip = new THREE.AnimationClip('custom', 2, [positionKF, rotationKF]);

const mixer = new THREE.AnimationMixer(object);
mixer.clipAction(clip).play();
```

## Keyframe Track Types

```javascript
// Different track types for different properties
new THREE.VectorKeyframeTrack('.position', times, values);
new THREE.VectorKeyframeTrack('.scale', times, values);
new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
new THREE.ColorKeyframeTrack('.material.color', times, values);
new THREE.NumberKeyframeTrack('.material.opacity', times, values);
new THREE.BooleanKeyframeTrack('.visible', times, values);
```

## Skeletal Animation

For rigged characters:

```javascript
// Object must be SkinnedMesh with skeleton
const mesh = gltf.scene.children.find(child => child.isSkinnedMesh);

// Access bones
const skeleton = mesh.skeleton;
const bones = skeleton.bones;

// Manually control bones
bones[0].rotation.x = Math.PI / 4;

// Use SkeletonHelper to visualize
const helper = new THREE.SkeletonHelper(mesh);
scene.add(helper);
```

## Morph Target Animation

Blend shapes:

```javascript
// Morph targets are defined in geometry
const mesh = new THREE.Mesh(geometry, material);

// Animate morph influences
mesh.morphTargetInfluences[0] = 0.5; // 50% of first morph target

// Create animation clip for morphs
const track = new THREE.NumberKeyframeTrack(
  '.morphTargetInfluences[0]',
  [0, 1, 2],
  [0, 1, 0]
);
const clip = new THREE.AnimationClip('morph', 2, [track]);
```

## Manual Animation

Simple transform animations:

```javascript
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  // Rotate
  object.rotation.y = elapsed;

  // Oscillate position
  object.position.y = Math.sin(elapsed * 2) * 5;

  // Pulse scale
  const scale = 1 + Math.sin(elapsed * 3) * 0.1;
  object.scale.set(scale, scale, scale);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## Tween Libraries

For complex easing (use with external lib like GSAP):

```javascript
// With GSAP
gsap.to(object.position, {
  duration: 1,
  x: 10,
  ease: "power2.inOut"
});
```
