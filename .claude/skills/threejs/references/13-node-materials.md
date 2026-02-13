# Node Materials (TSL - Three Shading Language)

Modern node-based material system for creating custom shaders visually.

## What is TSL?

Three Shading Language (TSL) is a node-based system for creating materials and shaders:
- Functional approach to shader composition
- Type-safe node graph
- Unified GLSL/WGSL output (WebGL & WebGPU)
- No manual shader code required

## Basic Node Material

```javascript
import * as THREE from 'three/webgpu';
import { color, texture, normalMap, MeshStandardNodeMaterial } from 'three/nodes';

const material = new MeshStandardNodeMaterial();

// Set base color node
material.colorNode = color(0xff0000);

// Or use texture
material.colorNode = texture(colorTexture);

// Combine nodes
material.colorNode = texture(colorTexture).mul(color(0xffffff));

// Normal mapping
material.normalNode = normalMap(normalTexture);
```

## Node Types

### Input Nodes

```javascript
import {
  attribute,
  uniform,
  texture,
  cubeTexture,
  instancedArray,
  storage
} from 'three/nodes';

// Geometry attributes
const positionNode = attribute('position');
const normalNode = attribute('normal');
const uvNode = attribute('uv');

// Uniforms
const timeNode = uniform(0); // value

// Textures
const colorNode = texture(diffuseTexture);
const envNode = cubeTexture(cubeMapTexture);

// Instanced data
const instanceColorNode = instancedArray('instanceColor');

// Storage buffers (compute)
const storageNode = storage(buffer, 'vec4', count);
```

### Math Nodes

```javascript
import { add, sub, mul, div, pow, sin, cos, length, normalize } from 'three/nodes';

// Basic operations
const result = add(a, b);     // a + b
const result = sub(a, b);     // a - b
const result = mul(a, b);     // a * b
const result = div(a, b);     // a / b

// Trigonometry
const result = sin(angle);
const result = cos(angle);

// Vector operations
const result = length(vector);
const result = normalize(vector);

// Chaining
const result = mul(texture(tex), color(0xff0000));
```

### Procedural Nodes

```javascript
import { checker, dots, noise, voronoi } from 'three/nodes';

// Checker pattern
material.colorNode = checker(uvNode.mul(10));

// Noise
material.colorNode = noise(uvNode.mul(5));

// Voronoi cells
material.colorNode = voronoi(uvNode.mul(3));
```

## Custom Shader Function

```javascript
import { Fn, vec3, float } from 'three/nodes';

// Define custom function
const customColor = Fn(([uv, time]) => {
  const r = sin(uv.x.mul(10).add(time));
  const g = cos(uv.y.mul(10).add(time));
  const b = float(0.5);
  return vec3(r, g, b);
});

// Use in material
material.colorNode = customColor(uvNode, timeNode);
```

## Animation with Nodes

```javascript
import { uniform, oscSine, timerLocal } from 'three/nodes';

// Oscillating value
const oscillator = oscSine(timerLocal(0.5)); // frequency = 0.5

// Pulsing color
material.colorNode = color(0xff0000).mul(oscillator.add(0.5));

// Rotating UV
const rotatedUV = uvNode.rotateUV(timerLocal());
material.colorNode = texture(tex, rotatedUV);
```

## Advanced Effects

### Fresnel Effect

```javascript
import { normalView, positionView, dot, pow } from 'three/nodes';

const fresnel = pow(
  float(1).sub(dot(normalView, positionView.normalize())),
  3
);

material.colorNode = mix(baseColor, edgeColor, fresnel);
```

### Vertex Displacement

```javascript
import { positionLocal, normalLocal, timerLocal, sin } from 'three/nodes';

// Displace vertices along normal
const displacement = sin(positionLocal.y.add(timerLocal())).mul(0.5);
material.positionNode = positionLocal.add(normalLocal.mul(displacement));
```

### Custom Normal Mapping

```javascript
import { normalMap, normalView, TBNViewMatrix } from 'three/nodes';

const normalMapNode = normalMap(normalTexture);
const transformedNormal = TBNViewMatrix.mul(normalMapNode);
material.normalNode = transformedNormal;
```

## Compute Shaders (WebGPU)

```javascript
import { compute, uniform, storage, Fn } from 'three/nodes';

// Define compute shader
const computeShader = Fn(() => {
  const storageBuffer = storage(buffer, 'vec4', count);
  const index = instanceIndex; // built-in

  // Modify buffer
  const value = storageBuffer.element(index);
  storageBuffer.element(index).assign(value.mul(2));
})();

// Create compute node
const computeNode = compute(computeShader, 256); // workgroup size

// Execute
renderer.compute(computeNode);
```

## Node Material Types

```javascript
import {
  MeshStandardNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshBasicNodeMaterial,
  PointsNodeMaterial,
  LineBasicNodeMaterial,
  SpriteNodeMaterial
} from 'three/nodes';

// Standard PBR
const material = new MeshStandardNodeMaterial();
material.colorNode = colorNode;
material.roughnessNode = roughnessNode;
material.metalnessNode = metalnessNode;

// Physical (clearcoat, transmission, etc.)
const material = new MeshPhysicalNodeMaterial();
material.clearcoatNode = clearcoatNode;
material.transmissionNode = transmissionNode;
```

## Post-Processing with Nodes

```javascript
import { pass, PassNode } from 'three/nodes';

// Custom post-processing pass
const customPass = new PassNode('customPass', (input, output) => {
  // input: previous pass texture
  // output: render target

  // Apply effect
  const modifiedColor = input.mul(color(1, 0.5, 0.5));
  output.assign(modifiedColor);
});

// Add to post-processing chain
postProcessing.addPass(customPass);
```

## Practical Example: Animated Material

```javascript
import * as THREE from 'three/webgpu';
import {
  MeshStandardNodeMaterial,
  texture,
  uniform,
  timerLocal,
  sin,
  cos,
  vec2
} from 'three/nodes';

const material = new MeshStandardNodeMaterial();

// Animated UV scroll
const time = timerLocal();
const scrollSpeed = uniform(0.1);
const uvOffset = vec2(
  time.mul(scrollSpeed),
  sin(time).mul(0.1)
);
const scrolledUV = uv().add(uvOffset);

// Apply to color
material.colorNode = texture(diffuseTexture, scrolledUV);

// Animated emission
const pulseSpeed = uniform(2);
const emission = sin(time.mul(pulseSpeed)).mul(0.5).add(0.5);
material.emissiveNode = color(1, 0.5, 0).mul(emission);
```

## Migration from ShaderMaterial

```javascript
// Old way (ShaderMaterial)
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader: `...`,
  fragmentShader: `...`
});

// New way (Node Material)
const material = new MeshStandardNodeMaterial();
material.colorNode = customFunction(timerLocal());
// Much cleaner, type-safe, and reusable
```

## When to Use Node Materials

- Creating complex procedural materials
- Need both WebGL and WebGPU support
- Want visual/functional shader composition
- Reusable shader components
- Compute shader integration (WebGPU only)

**Note**: Node materials require WebGPU renderer for full features. Some features work with WebGL backend but compute shaders require WebGPU.
