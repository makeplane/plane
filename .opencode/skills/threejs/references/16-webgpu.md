# WebGPU Rendering

Modern GPU API for next-generation graphics.

## WebGPU Renderer

Next-generation rendering backend:

```javascript
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';

// Check support
if (WebGPU.isAvailable()) {
  const renderer = new WebGPURenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Use setAnimationLoop (not requestAnimationFrame)
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
} else {
  const warning = WebGPU.getErrorMessage();
  document.body.appendChild(warning);
}
```

## Benefits of WebGPU

- Better performance (lower CPU overhead)
- Compute shaders
- Modern GPU features
- Unified shading language (WGSL)
- Better multi-threading support
- More predictable behavior

## Compute Shaders

GPU-accelerated computation:

```javascript
import { storageBuffer, uniform, Fn } from 'three/nodes';
import { StorageBufferAttribute } from 'three/addons/renderers/common/StorageBufferAttribute.js';

// Create storage buffer
const particleCount = 10000;
const positionBuffer = new StorageBufferAttribute(particleCount * 3, 3);

// Fill initial positions
for (let i = 0; i < particleCount; i++) {
  positionBuffer.setXYZ(
    i,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5
  );
}

// Create compute shader
const computeParticles = Fn(() => {
  const position = storageBuffer(positionBuffer);
  const time = uniform('time', 0);
  const index = instanceIndex;

  // Update position
  const pos = position.element(index);
  pos.y.addAssign(sin(time.add(index)).mul(0.01));

  // Wrap around
  If(pos.y.greaterThan(5), () => {
    pos.y.assign(-5);
  });
})();

// Create compute node
const computeNode = computeParticles.compute(particleCount);

// Execute in render loop
renderer.setAnimationLoop(() => {
  renderer.compute(computeNode);
  renderer.render(scene, camera);
});
```

## Storage Buffers

GPU-accessible memory:

```javascript
import { storage, Fn, vec3, float } from 'three/nodes';

// Define storage buffer structure
const particleData = storage(
  new THREE.StorageBufferAttribute(count * 7, 7), // 7 floats per particle
  'vec3', // position
  'vec3', // velocity
  'float' // life
);

// Access in compute shader
const updateParticle = Fn(() => {
  const data = particleData.element(instanceIndex);
  const position = data.xyz;
  const velocity = data.toVec3(3); // offset 3
  const life = data.element(6);

  // Update
  position.addAssign(velocity.mul(deltaTime));
  life.subAssign(deltaTime);
})();
```

## WebGPU Node Materials

Use TSL (Three Shading Language) with WebGPU:

```javascript
import { MeshStandardNodeMaterial, texture, normalMap } from 'three/nodes';

const material = new MeshStandardNodeMaterial();

// Node-based material definition
material.colorNode = texture(diffuseTexture);
material.normalNode = normalMap(normalTexture);
material.roughnessNode = float(0.5);
material.metalnessNode = float(0.8);

// Works with both WebGL and WebGPU automatically
```

## Indirect Drawing

Efficient rendering with compute-generated draw calls:

```javascript
import { IndirectStorageBufferAttribute } from 'three/addons/renderers/common/IndirectStorageBufferAttribute.js';

// Create indirect buffer
const indirectBuffer = new IndirectStorageBufferAttribute(count, 5);
// 5 elements: count, instanceCount, first, baseInstance, (padding)

// Update with compute shader
const updateIndirect = Fn(() => {
  const indirect = storage(indirectBuffer);
  // Compute visibility and update instance count
  const visible = computeVisibility();
  If(visible, () => {
    indirect.element(1).addAssign(1); // increment instanceCount
  });
})();

// Render using indirect buffer
renderer.drawIndirect(mesh, indirectBuffer);
```

## Multi-Render-Target (MRT)

Render to multiple textures simultaneously:

```javascript
import { WebGPURenderTarget } from 'three/addons/renderers/webgpu/WebGPURenderTarget.js';

const renderTarget = new WebGPURenderTarget(width, height, {
  count: 3, // number of render targets
  format: THREE.RGBAFormat
});

// Access individual textures
const albedoTexture = renderTarget.textures[0];
const normalTexture = renderTarget.textures[1];
const depthTexture = renderTarget.textures[2];

// Use in deferred rendering pipeline
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
```

## Async Shader Compilation

Avoid frame drops:

```javascript
// Compile materials ahead of time
await renderer.compileAsync(scene, camera);

// Start rendering after compilation
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
```

## Performance Monitoring

GPU timestamp queries:

```javascript
// Query GPU timing
const timestampQuery = renderer.getTimestampQuery();

timestampQuery.begin();
renderer.render(scene, camera);
timestampQuery.end();

timestampQuery.getResult().then((duration) => {
  console.log(`GPU time: ${duration}ms`);
});
```

## WebGPU-Specific Features

### Texture Compression

```javascript
// BC7 compression (higher quality)
const texture = new THREE.CompressedTexture(
  mipmaps,
  width,
  height,
  THREE.RGBA_BPTC_Format
);
```

### Depth Textures

```javascript
const depthTexture = new THREE.DepthTexture(width, height);
depthTexture.type = THREE.FloatType; // 32-bit depth
depthTexture.format = THREE.DepthFormat;
```

### Storage Textures

```javascript
import { storageTexture } from 'three/nodes';

// Read-write texture in compute shader
const writeableTexture = storageTexture(texture);

const computeShader = Fn(() => {
  const coord = vec2(instanceIndex % width, instanceIndex / width);
  const color = vec4(1, 0, 0, 1);
  writeableTexture.store(coord, color);
})();
```

## Migration from WebGL

Most Three.js code works with both:

```javascript
// WebGL
const renderer = new THREE.WebGLRenderer();

// WebGPU (drop-in replacement for most cases)
const renderer = new WebGPURenderer();

// Exceptions:
// - Custom shaders: need to use Node materials or WGSL
// - Some extensions not available
// - Compute shaders only in WebGPU
```

## WGSL (WebGPU Shading Language)

Native shader language for WebGPU:

```wgsl
@group(0) @binding(0) var<storage, read_write> positions: array<vec3f>;
@group(0) @binding(1) var<uniform> time: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let index = global_id.x;
  if (index >= arrayLength(&positions)) {
    return;
  }

  var pos = positions[index];
  pos.y += sin(time + f32(index)) * 0.01;
  positions[index] = pos;
}
```

## Browser Support

As of 2025:
- ✅ Chrome 113+
- ✅ Edge 113+
- ✅ Safari 18+ (macOS/iOS)
- ❌ Firefox (in development)

Check support: `WebGPU.isAvailable()`

## Best Practices

- Use compute shaders for particle systems, physics
- Leverage storage buffers for large datasets
- Async compile before rendering
- Use Node materials instead of custom GLSL
- Test on both WebGL and WebGPU
- Provide WebGL fallback for unsupported browsers
