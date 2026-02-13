# Three.js - Advanced Materials

PBR materials and custom shaders.

## MeshStandardMaterial (PBR)

Physically-based rendering with metallic/roughness workflow:

```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.5,     // 0 = dielectric, 1 = metal
  roughness: 0.5,     // 0 = smooth/shiny, 1 = rough/matte

  map: colorTexture,          // base color
  normalMap: normalTexture,   // surface detail
  roughnessMap: roughnessTexture,
  metalnessMap: metalnessTexture,
  aoMap: aoTexture,           // ambient occlusion
  emissive: 0xff0000,         // glow color
  emissiveMap: emissiveTexture,
  emissiveIntensity: 1.0,

  envMap: environmentMap,     // reflections
  envMapIntensity: 1.0,

  alphaMap: alphaTexture,     // transparency control
  transparent: true,
  opacity: 1.0,

  side: THREE.DoubleSide,     // render both sides
  flatShading: false          // smooth normals
});
```

## MeshPhysicalMaterial (Enhanced PBR)

Extended PBR with clearcoat, transmission, sheen:

```javascript
const material = new THREE.MeshPhysicalMaterial({
  // All MeshStandardMaterial properties plus:

  // Clearcoat (protective layer)
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  clearcoatMap: clearcoatTexture,
  clearcoatRoughnessMap: clearcoatRoughTexture,
  clearcoatNormalMap: clearcoatNormalTexture,

  // Transmission (transparency with refraction)
  transmission: 1.0,          // 0-1, glass-like
  thickness: 0.5,             // volumetric thickness
  ior: 1.5,                   // index of refraction (glass = 1.5)

  // Sheen (fabric-like edge glow)
  sheen: 1.0,
  sheenRoughness: 0.5,
  sheenColor: new THREE.Color(0xffffff),

  // Iridescence (rainbow effect)
  iridescence: 1.0,
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [100, 400],

  // Anisotropy (directional reflections)
  anisotropy: 1.0,
  anisotropyRotation: 0
});
```

## ShaderMaterial (Custom Shaders)

Full control over vertex and fragment shaders:

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    color: { value: new THREE.Color(0xff0000) },
    texture1: { value: texture }
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    uniform sampler2D texture1;

    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec4 texColor = texture2D(texture1, vUv);
      vec3 light = vec3(0.5, 0.2, 1.0);
      float dProd = max(0.0, dot(vNormal, light));

      gl_FragColor = vec4(color * dProd * texColor.rgb, 1.0);
    }
  `,

  transparent: true,
  side: THREE.DoubleSide
});

// Update uniform in animation loop
material.uniforms.time.value += 0.01;
```

## RawShaderMaterial

Like ShaderMaterial but without Three.js shader injection:

```javascript
const material = new THREE.RawShaderMaterial({
  uniforms: {
    // ...
  },
  vertexShader: `
    precision mediump float;
    precision mediump int;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    attribute vec3 position;
    attribute vec2 uv;

    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;

    varying vec2 vUv;

    void main() {
      gl_FragColor = vec4(vUv, 0.0, 1.0);
    }
  `
});
```

## Common Shader Patterns

### Fresnel Effect
```glsl
// In fragment shader
float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 3.0);
gl_FragColor = vec4(mix(baseColor, edgeColor, fresnel), 1.0);
```

### Noise/Distortion
```glsl
// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// UV distortion
vec2 distortedUV = vUv + vec2(
  noise(vUv + time) * 0.1,
  noise(vUv.yx + time) * 0.1
);
```

### Scrolling Texture
```glsl
uniform float time;
varying vec2 vUv;

vec2 scrollUV = vUv + vec2(time * 0.1, 0.0);
vec4 color = texture2D(map, scrollUV);
```

## Material Blending

```javascript
material.blending = THREE.AdditiveBlending;
// Options:
// THREE.NoBlending
// THREE.NormalBlending (default)
// THREE.AdditiveBlending (glow/light effects)
// THREE.SubtractiveBlending
// THREE.MultiplyBlending

// Custom blending
material.blending = THREE.CustomBlending;
material.blendEquation = THREE.AddEquation;
material.blendSrc = THREE.SrcAlphaFactor;
material.blendDst = THREE.OneMinusSrcAlphaFactor;
```

## Depth & Stencil

```javascript
// Depth testing
material.depthTest = true;
material.depthWrite = true;
material.depthFunc = THREE.LessEqualDepth;

// Alpha testing (discard transparent pixels)
material.alphaTest = 0.5;

// Render order
mesh.renderOrder = 1; // higher renders later

// Polygonoffset (prevent z-fighting)
material.polygonOffset = true;
material.polygonOffsetFactor = 1;
material.polygonOffsetUnits = 1;
```

## Material Cloning & Disposal

```javascript
// Clone material
const material2 = material.clone();

// Dispose when done (free GPU memory)
material.dispose();
texture.dispose();
geometry.dispose();
```

## Common Built-in Uniforms

Available in ShaderMaterial (automatic):

```glsl
// Matrices
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;

// Camera
uniform vec3 cameraPosition;

// Attributes (vertex shader)
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec2 uv2;
```

## Performance Tips

- Use MeshStandardMaterial for most cases (good balance)
- MeshPhysicalMaterial is expensive (use sparingly)
- ShaderMaterial requires GPU knowledge
- Avoid transparent materials when possible
- Use alphaTest instead of transparency for cutouts
- Minimize uniform updates
- Share materials between meshes
