# Shapes in GLSL

Drawing shapes using Signed Distance Fields (SDF) and distance calculations.

## Distance Fields Concept

SDF returns distance from any point to shape edge:
- **Negative**: Inside shape
- **Zero**: On edge
- **Positive**: Outside shape

## Circle

```glsl
// Basic circle
float circle(vec2 st, vec2 center, float radius) {
    float d = distance(st, center);
    return 1.0 - step(radius, d);
}

// Smooth edge circle
float circleSDF(vec2 st, vec2 center, float radius) {
    return length(st - center) - radius;
}

// Usage
float d = circleSDF(st, vec2(0.5), 0.3);
vec3 color = vec3(1.0 - smoothstep(0.0, 0.01, d));
```

## Rectangle

```glsl
// Basic rectangle
float rect(vec2 st, vec2 pos, vec2 size) {
    vec2 bl = step(pos, st);
    vec2 tr = step(1.0 - pos - size, 1.0 - st);
    return bl.x * bl.y * tr.x * tr.y;
}

// Rectangle SDF
float rectSDF(vec2 st, vec2 center, vec2 size) {
    vec2 d = abs(st - center) - size * 0.5;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Rounded rectangle SDF
float roundedRectSDF(vec2 st, vec2 center, vec2 size, float radius) {
    vec2 d = abs(st - center) - size * 0.5 + radius;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
}
```

## Line

```glsl
// Line segment SDF
float lineSDF(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Draw line with thickness
float line(vec2 st, vec2 a, vec2 b, float thickness) {
    float d = lineSDF(st, a, b);
    return 1.0 - smoothstep(0.0, thickness, d);
}
```

## Shape Outlines

```glsl
// Outline only
float outline(float d, float thickness) {
    return 1.0 - smoothstep(0.0, thickness, abs(d));
}

// Fill with outline
vec3 fillWithOutline(float d, vec3 fill, vec3 stroke, float thick) {
    float fillMask = 1.0 - smoothstep(0.0, 0.01, d);
    float edge = 1.0 - smoothstep(0.0, thick, abs(d));
    return mix(fill * fillMask, stroke, edge * (1.0 - fillMask));
}
```

## 2D Transformations

```glsl
// Rotate point around center
vec2 rotate(vec2 st, vec2 center, float angle) {
    st -= center;
    float c = cos(angle);
    float s = sin(angle);
    st = mat2(c, -s, s, c) * st;
    return st + center;
}

// Scale from center
vec2 scale(vec2 st, vec2 center, vec2 s) {
    return (st - center) / s + center;
}
```

See also: `glsl-shapes-polygon-star-polar-sdf-combinations.md`
