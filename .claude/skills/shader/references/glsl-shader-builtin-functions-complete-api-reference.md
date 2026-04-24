# GLSL Built-in Functions Reference

Complete reference for GLSL ES 1.0 / WebGL functions.

## Trigonometric Functions

| Function | Description | Range |
|----------|-------------|-------|
| `sin(x)` | Sine | [-1, 1] |
| `cos(x)` | Cosine | [-1, 1] |
| `tan(x)` | Tangent | unbounded |
| `asin(x)` | Arc sine | [-PI/2, PI/2] |
| `acos(x)` | Arc cosine | [0, PI] |
| `atan(y, x)` | Arc tangent (quadrant-aware) | [-PI, PI] |
| `atan(y_over_x)` | Arc tangent | [-PI/2, PI/2] |

All accept float, vec2, vec3, vec4. Input in radians.

## Exponential Functions

| Function | Description |
|----------|-------------|
| `pow(x, y)` | x raised to power y |
| `exp(x)` / `exp2(x)` | e^x / 2^x |
| `log(x)` / `log2(x)` | Natural / Base-2 logarithm |
| `sqrt(x)` / `inversesqrt(x)` | Square root / 1/sqrt(x) |

## Common Functions

| Function | Description |
|----------|-------------|
| `abs(x)` / `sign(x)` | Absolute value / -1, 0, or 1 |
| `floor(x)` / `ceil(x)` | Round down / up |
| `fract(x)` | x - floor(x) |
| `mod(x, y)` | x - y * floor(x/y) |
| `min(x, y)` / `max(x, y)` | Minimum / Maximum |
| `clamp(x, min, max)` | Constrain to range |
| `mix(a, b, t)` | Linear interpolation: a*(1-t) + b*t |
| `step(edge, x)` | 0.0 if x < edge, else 1.0 |
| `smoothstep(e0, e1, x)` | Hermite interpolation |

## Geometric Functions

| Function | Description |
|----------|-------------|
| `length(v)` / `distance(a, b)` | Magnitude / Distance |
| `dot(a, b)` / `cross(a, b)` | Dot / Cross product |
| `normalize(v)` | Unit vector |
| `reflect(i, n)` / `refract(i, n, eta)` | Reflection / Refraction |

## Vector Relational Functions

`lessThan`, `lessThanEqual`, `greaterThan`, `greaterThanEqual`, `equal`, `notEqual` - Return bvec.
`any(bvec)`, `all(bvec)`, `not(bvec)` - Boolean operations.

## Texture Functions

| Function | Description |
|----------|-------------|
| `texture2D(sampler, coord)` | Sample 2D texture |
| `textureCube(sampler, coord)` | Sample cube map |

## Constants

```glsl
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define HALF_PI 1.57079632679
```

## Type Constructors

```glsl
vec2(x), vec2(x, y)
vec3(x), vec3(xy, z), vec3(x, y, z)
vec4(x), vec4(xyz, w), vec4(xy, zw)
mat2(a, b, c, d), mat3(...), mat4(...)
```

## Operators

```glsl
+  -  *  /           // Arithmetic (component-wise)
<  >  <=  >=  ==  != // Comparison
&&  ||  !            // Logical
mat * mat            // Matrix multiply
mat * vec            // Transform vector
```

## Qualifiers

```glsl
attribute  // Vertex input
uniform    // Constant across draw
varying    // Interpolated vertex->fragment
lowp / mediump / highp  // Precision
in / out / inout / const // Parameters
```

## Built-in Variables

```glsl
// Fragment Shader
vec4 gl_FragCoord;   // Window coordinates
vec4 gl_FragColor;   // Output color (write only)
bool gl_FrontFacing; // Front face?
vec2 gl_PointCoord;  // Point sprite [0,1]

// Vertex Shader
vec4 gl_Position;    // Clip-space position
float gl_PointSize;  // Point size
```
