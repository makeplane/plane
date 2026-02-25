# Advanced Shapes & SDF Combinations

Polygons, stars, polar shapes, and combining multiple SDFs.

## Regular Polygon (N sides)

```glsl
float polygonSDF(vec2 st, vec2 center, float radius, int sides) {
    st -= center;
    float a = atan(st.y, st.x) + PI;
    float r = TWO_PI / float(sides);
    float d = cos(floor(0.5 + a / r) * r - a) * length(st);
    return d - radius;
}

// Usage: hexagon
float hex = polygonSDF(st, vec2(0.5), 0.3, 6);
```

## Star Shape

```glsl
float starSDF(vec2 st, vec2 center, float r1, float r2, int points) {
    st -= center;
    float a = atan(st.y, st.x);
    float seg = TWO_PI / float(points);
    a = mod(a, seg) - seg * 0.5;
    float r = length(st);
    float inner = r2 / cos(seg * 0.5);
    float d = mix(r1, inner, step(0.0, a) * 2.0 - 1.0);
    return r - d;
}
```

## Polar Shapes

```glsl
// Convert to polar coordinates
vec2 toPolar(vec2 st) {
    vec2 pos = st - 0.5;
    float r = length(pos) * 2.0;
    float a = atan(pos.y, pos.x);
    return vec2(r, a);
}

// Polar flower
float flowerSDF(vec2 st, int petals, float amplitude) {
    vec2 polar = toPolar(st);
    float shape = 0.5 + amplitude * cos(float(petals) * polar.y);
    return polar.x - shape;
}

// Gear shape
float gearSDF(vec2 st, int teeth, float innerR, float outerR) {
    vec2 polar = toPolar(st);
    float tooth = step(0.5, fract(polar.y * float(teeth) / TWO_PI));
    float radius = mix(innerR, outerR, tooth);
    return polar.x - radius;
}

// Heart
float heartSDF(vec2 st) {
    st -= vec2(0.5, 0.4);
    st.x *= 0.8;
    float a = atan(st.x, st.y) / PI;
    float r = length(st);
    float h = abs(a);
    float d = (13.0 * h - 22.0 * h * h + 10.0 * h * h * h) / (6.0 - 5.0 * h);
    return r - d * 0.3;
}
```

## Combining SDFs

```glsl
// Union (OR) - combine shapes
float sdfUnion(float d1, float d2) {
    return min(d1, d2);
}

// Intersection (AND) - overlap only
float sdfIntersect(float d1, float d2) {
    return max(d1, d2);
}

// Subtraction - cut out
float sdfSubtract(float d1, float d2) {
    return max(d1, -d2);
}

// XOR - either but not both
float sdfXor(float d1, float d2) {
    return max(min(d1, d2), -max(d1, d2));
}
```

## Smooth Boolean Operations

```glsl
// Smooth union (blended edges)
float sdfSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

// Smooth subtraction
float sdfSmoothSubtract(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d1, -d2, h) + k * h * (1.0 - h);
}

// Smooth intersection
float sdfSmoothIntersect(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}
```

## SDF Modifications

```glsl
float ring(float d, float thickness) { return abs(d) - thickness; }
float roundSDF(float d, float r) { return d - r; }
```
