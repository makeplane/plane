# Noise in GLSL

Generate pseudo-random and noise patterns for organic textures.

## Pseudo-Random Function

```glsl
// 1D random
float random(float x) {
    return fract(sin(x) * 43758.5453);
}

// 2D random
float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

// 2D random returning vec2
vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
    return fract(sin(st) * 43758.5453123);
}
```

## Value Noise

Interpolate between random values at grid points:

```glsl
float valueNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
```

## Gradient Noise (Perlin-like)

```glsl
vec2 grad(vec2 i) {
    float a = random(i) * TWO_PI;
    return vec2(cos(a), sin(a));
}

float gradientNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = dot(grad(i), f);
    float b = dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    // Quintic interpolation
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
}
```

## Simplex Noise (2D)

More efficient, fewer artifacts:

```glsl
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float simplexNoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}
```

## Animated Noise

```glsl
float animatedNoise(vec2 st, float time) {
    return valueNoise(st + vec2(time * 0.1));
}

float flowingNoise(vec2 st, float time) {
    vec2 offset = vec2(sin(time * 0.5), cos(time * 0.3)) * 2.0;
    return valueNoise(st + offset);
}
```

See also: `glsl-cellular-voronoi-worley-noise-patterns.md`
