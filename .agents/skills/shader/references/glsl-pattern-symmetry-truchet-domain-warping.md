# Pattern Symmetry & Advanced Techniques

Advanced pattern generation including symmetry, Truchet tiles, and domain warping.

## Mirror/Reflection

```glsl
// Mirror horizontally
vec2 mirrorX(vec2 st) {
    return vec2(abs(st.x - 0.5) + 0.5, st.y);
}

// Mirror vertically
vec2 mirrorY(vec2 st) {
    return vec2(st.x, abs(st.y - 0.5) + 0.5);
}

// Kaleidoscope (4-fold symmetry)
vec2 kaleidoscope(vec2 st) {
    st -= 0.5;
    st = abs(st);
    return st + 0.5;
}
```

## N-fold Radial Symmetry

```glsl
vec2 radialSymmetry(vec2 st, float n) {
    st -= 0.5;
    float angle = atan(st.y, st.x);
    float segment = TWO_PI / n;
    angle = mod(angle, segment);
    float r = length(st);
    return vec2(cos(angle), sin(angle)) * r + 0.5;
}

// Usage: 6-fold snowflake symmetry
vec2 sym = radialSymmetry(st, 6.0);
```

## Truchet Tiles

Random orientation per cell:

```glsl
float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

float truchet(vec2 st, float n) {
    st *= n;
    vec2 idx = floor(st);
    vec2 local = fract(st);

    // Random rotation per cell (0, 90, 180, 270 degrees)
    float r = random(idx);
    if (r < 0.25) local = local;
    else if (r < 0.5) local = vec2(1.0 - local.y, local.x);
    else if (r < 0.75) local = 1.0 - local;
    else local = vec2(local.y, 1.0 - local.x);

    // Draw quarter circles
    float d1 = length(local);
    float d2 = length(local - 1.0);
    return min(abs(d1 - 0.5), abs(d2 - 0.5));
}

// Usage
float pattern = 1.0 - smoothstep(0.0, 0.05, truchet(st, 8.0));
```

## Truchet Variations

```glsl
// Line-based Truchet
float truchetLines(vec2 st, float n) {
    st *= n;
    vec2 idx = floor(st);
    vec2 local = fract(st);

    float r = random(idx);
    if (r > 0.5) local = vec2(local.y, local.x);  // Flip diagonal

    // Diagonal line
    return abs(local.x - local.y);
}

// Maze pattern
float truchetMaze(vec2 st, float n) {
    st *= n;
    vec2 idx = floor(st);
    vec2 local = fract(st) - 0.5;

    float r = random(idx);
    if (r > 0.5) local.x = -local.x;

    return smoothstep(0.0, 0.1, abs(local.x + local.y));
}
```

## Domain Warping

```glsl
vec2 warp(vec2 st, float a) {
    return st + vec2(sin(st.y * 10.0), sin(st.x * 10.0)) * a;
}

vec2 animatedWarp(vec2 st, float t, float a) {
    return st + vec2(sin(st.y * 5.0 + t), cos(st.x * 5.0 + t * 1.3)) * a;
}
```

## Iterative Domain Warping

```glsl
vec2 iterativeWarp(vec2 st, int iterations) {
    for (int i = 0; i < iterations; i++) {
        st = vec2(valueNoise(st), valueNoise(st + 5.0)) * 2.0 - 1.0 + st;
    }
    return st;
}
```

## Practical Pattern Examples

```glsl
// Islamic-style pattern
float islamicPattern(vec2 st, float n) {
    st = radialSymmetry(st, 8.0);
    st = tile(st, n);
    return smoothstep(0.4, 0.41, length(st - 0.5));
}
```
