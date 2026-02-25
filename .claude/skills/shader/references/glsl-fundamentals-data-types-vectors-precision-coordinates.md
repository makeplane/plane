# GLSL Fundamentals

Basic GLSL fragment shader structure, data types, and coordinate systems.

## Minimal Shader

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    gl_FragColor = vec4(st.x, st.y, 0.0, 1.0);
}
```

## Data Types

| Type | Description | Example |
|------|-------------|---------|
| `float` | Single decimal | `float x = 1.0;` |
| `vec2` | 2D vector | `vec2 pos = vec2(0.5, 0.5);` |
| `vec3` | 3D vector / RGB | `vec3 color = vec3(1.0, 0.0, 0.0);` |
| `vec4` | 4D vector / RGBA | `vec4 rgba = vec4(1.0, 0.0, 0.0, 1.0);` |
| `mat2/mat3/mat4` | Matrices | `mat2 rotation;` |
| `sampler2D` | 2D texture | `uniform sampler2D u_tex;` |

## Precision Qualifiers

```glsl
precision lowp float;    // Fast, low quality
precision mediump float; // Default, balanced
precision highp float;   // Slow, high quality
```

## Vector Swizzling

Access components via `.xyzw`, `.rgba`, or `.stpq`:

```glsl
vec4 color = vec4(1.0, 0.5, 0.0, 1.0);
vec3 rgb = color.rgb;      // (1.0, 0.5, 0.0)
vec2 rg = color.rg;        // (1.0, 0.5)
float r = color.r;         // 1.0
vec3 bgr = color.bgr;      // (0.0, 0.5, 1.0) - reorder
vec4 rrrr = color.rrrr;    // (1.0, 1.0, 1.0, 1.0) - repeat
```

## Vector Construction

```glsl
vec3 a = vec3(1.0);                    // (1.0, 1.0, 1.0)
vec3 b = vec3(1.0, 2.0, 3.0);          // (1.0, 2.0, 3.0)
vec4 c = vec4(a, 1.0);                 // (1.0, 1.0, 1.0, 1.0)
vec4 d = vec4(vec2(0.5), vec2(0.8));   // (0.5, 0.5, 0.8, 0.8)
```

## Type Casting

GLSL requires explicit types:

```glsl
float x = 1.0;      // Correct
float y = 1;        // May fail - use 1.0
int i = int(x);     // Explicit cast
float z = float(i); // Explicit cast
```

## Coordinate System

- `gl_FragCoord.xy` - Pixel coordinates (0 to resolution)
- Normalize to 0.0-1.0: `vec2 st = gl_FragCoord.xy / u_resolution;`
- Origin (0,0) is bottom-left

## Output

Assign final color to `gl_FragColor`:

```glsl
gl_FragColor = vec4(red, green, blue, alpha);
// Values clamped to 0.0-1.0
```

## Preprocessor

```glsl
#define PI 3.14159265359
#define TWO_PI 6.28318530718

#ifdef GL_ES
precision mediump float;
#endif
```

## Common Mistakes

1. **Missing decimal**: `1` instead of `1.0`
2. **Integer division**: `1/2` = 0, use `1.0/2.0`
3. **Uninitialized uniforms**: Always check uniform availability
4. **Precision issues**: Use `highp` for complex math
