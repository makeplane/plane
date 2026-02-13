# Getting Started with Three.js

Core concepts for building your first 3D scene.

## Essential Components

Every Three.js app needs 3 core elements:

### 1. Scene
Container for all 3D objects, lights, cameras.

```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // black background
scene.fog = new THREE.Fog(0xffffff, 1, 5000); // distance fog
```

### 2. Camera
Viewpoint into the 3D scene.

**PerspectiveCamera** (realistic, most common):
```javascript
const camera = new THREE.PerspectiveCamera(
  75,  // fov - field of view in degrees
  window.innerWidth / window.innerHeight,  // aspect ratio
  0.1,  // near clipping plane
  1000  // far clipping plane
);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);
```

**OrthographicCamera** (no perspective distortion):
```javascript
const camera = new THREE.OrthographicCamera(
  left, right, top, bottom, near, far
);
```

### 3. Renderer
Renders scene using camera perspective.

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
```

## Basic Geometries

Primitive shapes ready to use:

```javascript
// Box
new THREE.BoxGeometry(width, height, depth);

// Sphere
new THREE.SphereGeometry(radius, widthSegments, heightSegments);

// Plane
new THREE.PlaneGeometry(width, height);

// Cylinder
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);

// Cone
new THREE.ConeGeometry(radius, height, radialSegments);

// Torus
new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
```

## Basic Materials

Materials define surface appearance:

**MeshBasicMaterial** - unlit, flat color:
```javascript
new THREE.MeshBasicMaterial({ color: 0xff0000 });
```

**MeshStandardMaterial** - PBR, responds to lights:
```javascript
new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.5,
  roughness: 0.5
});
```

**MeshPhongMaterial** - specular highlights:
```javascript
new THREE.MeshPhongMaterial({
  color: 0x0000ff,
  shininess: 100
});
```

## Creating Mesh

Combine geometry + material:

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

## Basic Lights

Materials (except Basic) need lights to be visible:

```javascript
// Ambient - global illumination
const ambient = new THREE.AmbientLight(0x404040); // soft white
scene.add(ambient);

// Directional - sun-like, infinite distance
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 5, 5);
scene.add(directional);

// Point - lightbulb, radiates in all directions
const point = new THREE.PointLight(0xff0000, 1, 100);
point.position.set(0, 10, 0);
scene.add(point);
```

## Animation Loop

Continuously render and update scene:

```javascript
function animate() {
  requestAnimationFrame(animate);

  // Update objects
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // Render
  renderer.render(scene, camera);
}
animate();
```

## Handle Window Resize

Keep aspect ratio correct:

```javascript
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

## Object3D Hierarchy

Transform and group objects:

```javascript
const group = new THREE.Group();
group.add(cube1);
group.add(cube2);
scene.add(group);

// Transform
object.position.set(x, y, z);
object.rotation.set(x, y, z); // Euler angles
object.scale.set(x, y, z);

// Hierarchy transforms are relative to parent
```
