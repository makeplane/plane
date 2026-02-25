---
name: shader
description: "Write GLSL fragment shaders for procedural graphics. Topics: shapes (SDF), patterns, noise (Perlin/simplex/cellular), fBm, colors (HSB/RGB), matrices, gradients, animations. Use for generative art, textures, visual effects, WebGL, Three.js shaders."
version: 1.0.0
---

# GLSL Fragment Shaders

Write GPU-accelerated fragment shaders for procedural graphics, textures, and visual effects.

## When to Use

- Creating procedural textures (wood, marble, clouds, terrain)
- Drawing shapes with distance fields (SDF)
- Generating patterns, noise, gradients
- Building visual effects and animations
- Writing custom shaders for Three.js, WebGL, Processing

## Core Concepts

Fragment shaders execute **simultaneously on every pixel**. Each thread:
- Receives pixel position via `gl_FragCoord`
- Returns color via `gl_FragColor` (vec4: RGBA 0.0-1.0)
- Cannot communicate with other threads (stateless)

## Standard Uniforms

```glsl
uniform float u_time;       // Elapsed seconds
uniform vec2 u_resolution;  // Canvas size (width, height)
uniform vec2 u_mouse;       // Mouse position in pixels
```

Normalize coordinates: `vec2 st = gl_FragCoord.xy / u_resolution;`

## Essential Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `mix(a,b,t)` | Linear interpolate | `mix(red, blue, 0.5)` |
| `step(edge,x)` | Hard threshold | `step(0.5, st.x)` |
| `smoothstep(e0,e1,x)` | Smooth threshold | `smoothstep(0.2, 0.8, st.x)` |
| `fract(x)` | Fractional part | `fract(st * 3.0)` for tiling |
| `mod(x,y)` | Modulo | `mod(st.x, 0.25)` |
| `clamp(x,min,max)` | Constrain value | `clamp(col, 0.0, 1.0)` |
| `length(v)` | Vector magnitude | `length(st - 0.5)` |
| `distance(a,b)` | Euclidean distance | `distance(st, center)` |
| `dot(a,b)` | Dot product | `dot(normal, lightDir)` |
| `normalize(v)` | Unit vector | `normalize(direction)` |
| `atan(y,x)` | Angle (radians) | `atan(st.y-0.5, st.x-0.5)` |
| `sin/cos/pow/abs` | Math | Hardware-accelerated |

## Quick Patterns

**Circle:**
```glsl
float d = distance(st, vec2(0.5));
float circle = 1.0 - smoothstep(0.2, 0.21, d);
```

**Rectangle:**
```glsl
vec2 bl = step(vec2(0.1), st);
vec2 tr = step(vec2(0.1), 1.0 - st);
float rect = bl.x * bl.y * tr.x * tr.y;
```

**Tiling:**
```glsl
st = fract(st * 4.0);  // 4x4 grid
```

**Animation:**
```glsl
float wave = sin(st.x * 10.0 + u_time) * 0.5 + 0.5;
```

## References (Progressive Disclosure)

### Fundamentals
- `references/glsl-fundamentals-data-types-vectors-precision-coordinates.md`
- `references/glsl-shaping-functions-step-smoothstep-curves-interpolation.md`

### Drawing
- `references/glsl-colors-rgb-hsb-gradients-mixing-color-spaces.md`
- `references/glsl-shapes-sdf-circles-rectangles-polar-distance-fields.md`
- `references/glsl-shapes-polygon-star-polar-sdf-combinations.md`

### Procedural
- `references/glsl-patterns-tiling-fract-matrices-transformations.md`
- `references/glsl-pattern-symmetry-truchet-domain-warping.md`
- `references/glsl-noise-random-perlin-simplex-cellular-voronoi.md`
- `references/glsl-cellular-voronoi-worley-noise-patterns.md`
- `references/glsl-fbm-fractional-brownian-motion-turbulence-octaves.md`
- `references/glsl-procedural-textures-clouds-marble-wood-terrain.md`

### API Reference
- `references/glsl-shader-builtin-functions-complete-api-reference.md`

## Tools

- **Online Editor:** editor.thebookofshaders.com
- **glslViewer:** CLI tool for running .frag files
- **glslCanvas:** HTML embed for live shaders
- **ShaderToy:** iTime, iResolution, iMouse uniforms

## External Resources

- The Book of Shaders: https://thebookofshaders.com
- LYGIA Library: https://lygia.xyz (reusable shader functions)
- ShaderToy: https://shadertoy.com
- Inigo Quilez Articles: https://iquilezles.org/articles/
