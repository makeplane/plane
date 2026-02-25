# Post-Processing

Apply visual effects after rendering.

## EffectComposer Setup

Post-processing pipeline (addon):

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Create composer
const composer = new EffectComposer(renderer);

// Add render pass (required first pass)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add effect passes
// ... (see below)

// Add output pass (required last pass)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// Render with composer instead of renderer
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

// Handle resize
window.addEventListener('resize', () => {
  composer.setSize(window.innerWidth, window.innerHeight);
});
```

## Bloom Effect

Glow effect for bright areas:

```javascript
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold (brightness trigger)
);
composer.addPass(bloomPass);

// Adjust parameters
bloomPass.strength = 2.0;
bloomPass.radius = 1.0;
bloomPass.threshold = 0.5;
```

## SSAO (Screen Space Ambient Occlusion)

Realistic shadowing in crevices:

```javascript
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

const ssaoPass = new SSAOPass(scene, camera, width, height);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
composer.addPass(ssaoPass);
```

## SSR (Screen Space Reflections)

Real-time reflections:

```javascript
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';

const ssrPass = new SSRPass({
  renderer,
  scene,
  camera,
  width: window.innerWidth,
  height: window.innerHeight
});

ssrPass.opacity = 0.5;
ssrPass.maxDistance = 0.1;
composer.addPass(ssrPass);
```

## Depth of Field (Bokeh)

Blur based on depth:

```javascript
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

const bokehPass = new BokehPass(scene, camera, {
  focus: 10.0,      // focal distance
  aperture: 0.025,  // blur amount
  maxblur: 0.01     // max blur size
});
composer.addPass(bokehPass);
```

## FXAA (Anti-Aliasing)

Smooth jagged edges:

```javascript
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.x = 1 / window.innerWidth;
fxaaPass.material.uniforms['resolution'].value.y = 1 / window.innerHeight;
composer.addPass(fxaaPass);
```

## Outline Pass

Highlight selected objects:

```javascript
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);

outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#190a05');

// Set objects to outline
outlinePass.selectedObjects = [mesh1, mesh2];

composer.addPass(outlinePass);
```

## Film/Grain Effect

Add film grain and scanlines:

```javascript
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';

const filmPass = new FilmPass(
  0.35,  // noise intensity
  0.5,   // scanline intensity
  648,   // scanline count
  false  // grayscale
);
composer.addPass(filmPass);
```

## Glitch Effect

Digital glitch distortion:

```javascript
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';

const glitchPass = new GlitchPass();
composer.addPass(glitchPass);
```

## Custom Shader Pass

Create custom effects:

```javascript
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const customShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // Apply custom effect
      color.r *= amount;
      gl_FragColor = color;
    }
  `
};

const customPass = new ShaderPass(customShader);
customPass.material.uniforms.amount.value = 1.5;
composer.addPass(customPass);
```

## Common Pass Patterns

```javascript
// Combine multiple effects
composer.addPass(renderPass);
composer.addPass(ssaoPass);
composer.addPass(bloomPass);
composer.addPass(fxaaPass);
composer.addPass(outputPass);

// Selective rendering
bloomPass.renderToScreen = false; // render to texture, not screen

// Clear pass
import { ClearPass } from 'three/addons/postprocessing/ClearPass.js';
const clearPass = new ClearPass();
composer.addPass(clearPass);
```

## Performance Tips

- Post-processing is GPU-intensive
- Use lower resolution for expensive effects (SSAO, SSR)
- Limit number of passes (3-5 for good performance)
- Disable passes when not needed
- Use FXAA instead of MSAA (cheaper)
- Test on target devices
