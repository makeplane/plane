# Patterns in GLSL

Create repeating patterns using tiling and coordinate transformations.

## Basic Tiling with fract()

```glsl
// Tile space into grid
vec2 tile(vec2 st, float n) {
    return fract(st * n);
}

// Usage: 4x4 grid
vec2 tiled = tile(st, 4.0);
```

## Grid with Cell Index

```glsl
// Get both cell index and position within cell
vec2 grid(vec2 st, float n, out vec2 cellIndex) {
    st *= n;
    cellIndex = floor(st);
    return fract(st);
}

// Usage
vec2 idx;
vec2 local = grid(st, 4.0, idx);
```

## Brick Pattern (Offset Rows)

```glsl
vec2 brickTile(vec2 st, float n) {
    st *= n;
    float row = floor(st.y);
    st.x += mod(row, 2.0) * 0.5;  // Offset odd rows
    return fract(st);
}
```

## Hex Grid

```glsl
vec2 hexGrid(vec2 st, float scale) {
    st *= scale;
    vec2 r = vec2(1.0, 1.73205);  // sqrt(3)
    vec2 h = r * 0.5;
    vec2 a = mod(st, r) - h;
    vec2 b = mod(st - h, r) - h;
    return dot(a, a) < dot(b, b) ? a : b;
}
```

## 2D Rotation Matrix

```glsl
mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

// Rotate around center
vec2 rotateAround(vec2 st, vec2 center, float angle) {
    return rotate2d(angle) * (st - center) + center;
}
```

## Scale Matrix

```glsl
mat2 scale2d(vec2 scale) {
    return mat2(scale.x, 0.0, 0.0, scale.y);
}

vec2 scaleFrom(vec2 st, vec2 center, vec2 s) {
    return scale2d(s) * (st - center) + center;
}
```

## Checkerboard

```glsl
float checker(vec2 st, float n) {
    st *= n;
    vec2 idx = floor(st);
    return mod(idx.x + idx.y, 2.0);
}
```

## Stripes

```glsl
// Horizontal stripes
float stripes(float y, float n) {
    return step(0.5, fract(y * n));
}

// Diagonal stripes
float diagonalStripes(vec2 st, float n, float angle) {
    vec2 rotated = rotate2d(angle) * st;
    return step(0.5, fract(rotated.x * n));
}
```

## Polar Patterns

```glsl
// Convert to polar for radial patterns
vec2 toPolar(vec2 st) {
    vec2 pos = st - 0.5;
    float r = length(pos) * 2.0;
    float a = atan(pos.y, pos.x);
    return vec2(r, a);
}

// Repeat around center
float radialRepeat(vec2 st, float n) {
    vec2 polar = toPolar(st);
    polar.y = fract(polar.y * n / TWO_PI);
    return polar.y;
}

// Spiral
float spiral(vec2 st, float turns) {
    vec2 polar = toPolar(st);
    return fract(polar.x - polar.y * turns / TWO_PI);
}
```

See also: `glsl-pattern-symmetry-truchet-domain-warping.md`
