# Cellular and Voronoi Noise

Distance-based noise for organic cell patterns. See `glsl-noise-random-perlin-simplex-cellular-voronoi.md` for random functions.

## Basic Cellular Noise

Distance to nearest feature point:

```glsl
float cellularNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float minDist = 1.0;

    // Check 3x3 neighborhood
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i + neighbor);
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }

    return minDist;
}
```

## Voronoi with Cell ID

```glsl
vec3 voronoi(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float minDist = 1.0;
    vec2 minPoint;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i + neighbor);
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            if (dist < minDist) {
                minDist = dist;
                minPoint = i + neighbor + point;
            }
        }
    }

    // Returns: distance, cell id x, cell id y
    return vec3(minDist, minPoint);
}

// Color cells by ID
vec3 voronoiColor(vec2 st, float scale) {
    vec3 v = voronoi(st * scale);
    return vec3(random(v.yz), random(v.yz + 1.0), random(v.yz + 2.0));
}
```

## Worley Noise (F1, F2)

```glsl
vec2 worleyNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float f1 = 1.0;  // Nearest
    float f2 = 1.0;  // Second nearest

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i + neighbor);
            float dist = length(neighbor + point - f);

            if (dist < f1) {
                f2 = f1;
                f1 = dist;
            } else if (dist < f2) {
                f2 = dist;
            }
        }
    }

    return vec2(f1, f2);
}
```

## Worley Variations

```glsl
float worleyF1(vec2 st) { return worleyNoise(st).x; }
float worleyEdges(vec2 st) { vec2 w = worleyNoise(st); return w.y - w.x; }
float worleyBlobs(vec2 st) { vec2 w = worleyNoise(st); return w.x * w.y; }
```

## Animated Voronoi

```glsl
float animatedVoronoi(vec2 st, float time) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float minDist = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i + neighbor);
            // Animate point position
            point = 0.5 + 0.5 * sin(time + 6.2831 * point);
            float dist = length(neighbor + point - f);
            minDist = min(minDist, dist);
        }
    }

    return minDist;
}
```

## Distance Metrics

```glsl
float euclidean(vec2 v) { return length(v); }
float manhattan(vec2 v) { return abs(v.x) + abs(v.y); }
float chebyshev(vec2 v) { return max(abs(v.x), abs(v.y)); }
```

## Practical Applications

```glsl
// Cracked ground
vec3 crackedGround(vec2 st) {
    float edges = worleyEdges(st * 5.0);
    return mix(vec3(0.1), vec3(0.5, 0.4, 0.3), smoothstep(0.0, 0.05, edges));
}
```
