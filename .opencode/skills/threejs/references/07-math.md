# Math Utilities

Essential mathematical objects for 3D programming.

## Vector3

3D position, direction, or scale:

```javascript
const v = new THREE.Vector3(x, y, z);

// Operations
v.add(otherVector);
v.sub(otherVector);
v.multiply(otherVector);
v.multiplyScalar(scalar);
v.divide(otherVector);
v.divideScalar(scalar);

// Analysis
v.length();           // magnitude
v.lengthSq();         // magnitude squared (faster)
v.normalize();        // make length = 1
v.dot(otherVector);   // dot product
v.cross(otherVector); // cross product
v.distanceTo(otherVector);
v.angleTo(otherVector);

// Interpolation
v.lerp(targetVector, alpha); // linear interpolation
v.lerpVectors(v1, v2, alpha);

// Clamping
v.clamp(minVector, maxVector);
v.clampLength(minLength, maxLength);
```

## Vector2 & Vector4

Similar to Vector3 but 2D and 4D:

```javascript
const v2 = new THREE.Vector2(x, y);
const v4 = new THREE.Vector4(x, y, z, w);
```

## Quaternion

Rotation representation (avoids gimbal lock):

```javascript
const q = new THREE.Quaternion(x, y, z, w);

// From Euler angles
q.setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));

// From axis-angle
const axis = new THREE.Vector3(0, 1, 0);
q.setFromAxisAngle(axis, Math.PI / 2);

// From rotation matrix
q.setFromRotationMatrix(matrix);

// Interpolation
q.slerp(targetQuaternion, alpha); // spherical linear interpolation

// Apply to vector
const v = new THREE.Vector3(1, 0, 0);
v.applyQuaternion(q);
```

## Euler

Rotation as XYZ angles (degrees):

```javascript
const euler = new THREE.Euler(x, y, z, 'XYZ');
// Order: 'XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'

// From quaternion
euler.setFromQuaternion(q);

// From rotation matrix
euler.setFromRotationMatrix(matrix);

// Apply to object
object.rotation.copy(euler);
```

## Matrix4

4x4 transformation matrix:

```javascript
const m = new THREE.Matrix4();

// Compose transformation
m.compose(position, quaternion, scale);

// Decompose
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scale = new THREE.Vector3();
m.decompose(pos, quat, scale);

// Transform operations
m.makeTranslation(x, y, z);
m.makeRotationX(theta);
m.makeRotationY(theta);
m.makeRotationZ(theta);
m.makeScale(x, y, z);

// Combine matrices
m.multiply(otherMatrix);
m.premultiply(otherMatrix);

// Invert
m.invert();

// Apply to vector
const v = new THREE.Vector3(1, 2, 3);
v.applyMatrix4(m);
```

## Color

Color manipulation:

```javascript
const color = new THREE.Color(0xff0000); // hex
const color = new THREE.Color('red');    // CSS
const color = new THREE.Color(1, 0, 0);  // RGB 0-1

// Conversions
color.getHex();      // 0xff0000
color.getHexString(); // "ff0000"
color.getStyle();    // "rgb(255,0,0)"

// Color spaces
color.setHSL(h, s, l); // hue, saturation, lightness
const hsl = {};
color.getHSL(hsl); // fills hsl object

// Operations
color.add(otherColor);
color.multiply(otherColor);
color.lerp(targetColor, alpha);
```

## Raycaster

Ray intersection testing:

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Convert mouse to normalized device coordinates
mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

// Set ray from camera
raycaster.setFromCamera(mouse, camera);

// Find intersections
const intersects = raycaster.intersectObjects(scene.children, true);
// recursive = true to check children

if (intersects.length > 0) {
  const hit = intersects[0];
  console.log(hit.object);   // intersected object
  console.log(hit.point);    // intersection point (Vector3)
  console.log(hit.distance); // distance from camera
  console.log(hit.face);     // intersected face
}
```

## Box3

Axis-aligned bounding box:

```javascript
const box = new THREE.Box3();

// From object
box.setFromObject(mesh);

// From points
box.setFromPoints(arrayOfVector3);

// Properties
box.min; // Vector3
box.max; // Vector3
box.getCenter(target); // fills target Vector3
box.getSize(target);   // fills target Vector3

// Tests
box.containsPoint(point);
box.intersectsBox(otherBox);
```

## Sphere

Bounding sphere:

```javascript
const sphere = new THREE.Sphere(center, radius);

// From box
sphere.setFromPoints(arrayOfVector3);

// From object
const box = new THREE.Box3().setFromObject(mesh);
box.getBoundingSphere(sphere);

// Tests
sphere.containsPoint(point);
sphere.intersectsSphere(otherSphere);
```

## Plane

Infinite plane:

```javascript
const plane = new THREE.Plane(normal, constant);
// normal: Vector3, constant: distance from origin

// From coplanar points
plane.setFromCoplanarPoints(p1, p2, p3);

// Distance to point
plane.distanceToPoint(point);

// Project point onto plane
const projected = new THREE.Vector3();
plane.projectPoint(point, projected);
```

## Curves

Parametric curves:

```javascript
// Bezier curve
const curve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-10, 0, 0),
  new THREE.Vector3(-5, 15, 0),
  new THREE.Vector3(20, 15, 0),
  new THREE.Vector3(10, 0, 0)
);

// Sample points
const points = curve.getPoints(50);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(geometry, material);

// Get point at t (0-1)
const point = curve.getPoint(0.5);
```
