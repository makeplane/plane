# Lights

Illuminate 3D scenes with various light types.

## Ambient Light

Global illumination affecting all objects equally:

```javascript
const light = new THREE.AmbientLight(0x404040); // soft white
scene.add(light);

// Often used as base illumination with other lights
```

## Directional Light

Infinite distance light with parallel rays (sun-like):

```javascript
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 5);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target); // target must be in scene

// With shadows
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.shadow.camera.left = -10;
light.shadow.camera.right = 10;
light.shadow.camera.top = 10;
light.shadow.camera.bottom = -10;

// Visualize shadow camera
const helper = new THREE.CameraHelper(light.shadow.camera);
scene.add(helper);
```

## Point Light

Omnidirectional light from a point (lightbulb-like):

```javascript
const light = new THREE.PointLight(0xff0000, 1, 100, 2);
// params: color, intensity, distance (0 = infinite), decay

light.position.set(0, 10, 0);
scene.add(light);

// With shadows
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
```

## Spot Light

Cone-shaped light (spotlight-like):

```javascript
const light = new THREE.SpotLight(0xffffff, 1);
light.position.set(0, 10, 0);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);

// Cone parameters
light.angle = Math.PI / 6; // cone angle
light.penumbra = 0.1;      // edge softness (0-1)
light.decay = 2;           // light falloff
light.distance = 100;      // max range (0 = infinite)

// With shadows
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
```

## Hemisphere Light

Sky/ground two-color lighting:

```javascript
const light = new THREE.HemisphereLight(
  0x0000ff, // sky color (blue)
  0x00ff00, // ground color (green)
  0.6       // intensity
);
scene.add(light);

// Good for outdoor scenes
```

## RectArea Light (Addon)

Rectangular area light (realistic surface illumination):

```javascript
import { RectAreaLight } from 'three/addons/lights/RectAreaLight.js';

const light = new RectAreaLight(0xffffff, 5, 10, 10);
// params: color, intensity, width, height

light.position.set(0, 5, 0);
light.lookAt(0, 0, 0);
scene.add(light);

// Requires WebGL 2.0
```

## Shadow Configuration

Global renderer settings:

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft shadows

// Shadow types:
// THREE.BasicShadowMap - fast, aliased
// THREE.PCFShadowMap - smoother
// THREE.PCFSoftShadowMap - softer (default)
// THREE.VSMShadowMap - variance shadow maps

// Objects must opt-in to shadows
mesh.castShadow = true;    // object casts shadows
mesh.receiveShadow = true; // object receives shadows
```

## Light Helpers

Visualize light positions and directions:

```javascript
// Directional light
const helper = new THREE.DirectionalLightHelper(light, 5);
scene.add(helper);

// Point light
const helper = new THREE.PointLightHelper(light, 1);
scene.add(helper);

// Spot light
const helper = new THREE.SpotLightHelper(light);
scene.add(helper);

// Hemisphere light
const helper = new THREE.HemisphereLightHelper(light, 5);
scene.add(helper);

// RectArea light
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
const helper = new RectAreaLightHelper(light);
light.add(helper);
```

## Light Intensity & Units

```javascript
// Intensity values depend on physically-based rendering:
// - Lower values (0.1-1) for ambient/hemisphere
// - Higher values (1-10) for directional/point/spot
// - Very high (10-100+) for small area lights

// Physical light units (optional)
renderer.physicallyCorrectLights = true; // deprecated in newer versions
// Use intensity in candelas (cd) for point/spot lights
```

## Performance Tips

- Limit number of lights (3-5 for good performance)
- Use ambient + 1-2 directional lights for outdoor scenes
- Bake lighting into textures for static scenes
- Use lightmaps for complex static lighting
- Shadows are expensive - use selectively
- Lower shadow map resolution for better performance
