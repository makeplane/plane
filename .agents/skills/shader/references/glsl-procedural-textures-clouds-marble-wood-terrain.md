# Procedural Textures

Practical texture recipes using fBm and noise. See `glsl-fbm-fractional-brownian-motion-turbulence-octaves.md` for core functions.

## Clouds

```glsl
vec3 clouds(vec2 st, float time) {
    float n = fbm(st * 3.0 + vec2(time * 0.1, 0.0));
    n = smoothstep(0.4, 0.6, n);
    return mix(vec3(0.4, 0.6, 0.9), vec3(1.0), n);
}
```

## Marble

```glsl
float marble(vec2 st) {
    float n = fbm(st * 4.0);
    return sin(st.x * 10.0 + n * 20.0) * 0.5 + 0.5;
}

vec3 marbleColor(vec2 st) {
    float v = marble(st);
    vec3 white = vec3(0.95);
    vec3 gray = vec3(0.3);
    return mix(gray, white, v);
}
```

## Wood Grain

```glsl
float wood(vec2 st) {
    float n = fbm(st * 2.0);
    float grain = sin((st.x + n * 0.5) * 50.0) * 0.5 + 0.5;
    return mix(0.3, 0.6, grain);
}

vec3 woodColor(vec2 st) {
    float v = wood(st);
    vec3 light = vec3(0.76, 0.60, 0.42);
    vec3 dark = vec3(0.44, 0.30, 0.18);
    return mix(dark, light, v);
}
```

## Terrain Height

```glsl
float terrain(vec2 st) {
    float h = fbm(st * 2.0);
    h += ridged(st * 4.0) * 0.5;
    return h;
}

vec3 terrainColor(vec2 st) {
    float h = terrain(st);
    vec3 water = vec3(0.1, 0.3, 0.5);
    vec3 sand = vec3(0.76, 0.70, 0.50);
    vec3 grass = vec3(0.2, 0.5, 0.2);
    vec3 rock = vec3(0.5, 0.5, 0.5);
    vec3 snow = vec3(1.0);

    if (h < 0.3) return mix(water, sand, h / 0.3);
    if (h < 0.5) return mix(sand, grass, (h - 0.3) / 0.2);
    if (h < 0.7) return mix(grass, rock, (h - 0.5) / 0.2);
    return mix(rock, snow, (h - 0.7) / 0.3);
}
```

## Fire / Smoke

```glsl
vec3 fire(vec2 st, float time) {
    vec2 q = st;
    q.y -= time * 0.5;  // Rise

    float n = turbulence(q * 3.0);
    n *= smoothstep(1.0, 0.0, st.y);  // Fade at top

    vec3 col = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), n);
    return col * n;
}

vec3 smoke(vec2 st, float time) {
    vec2 q = st;
    q.y -= time * 0.2;

    float n = fbm(q * 4.0);
    n *= smoothstep(1.0, 0.0, st.y);

    return vec3(0.3 + n * 0.3) * n;
}
```

## Water Caustics

```glsl
float caustics(vec2 st, float time) {
    vec2 p = st * 8.0;
    float c = 0.0;
    for (int i = 0; i < 3; i++) {
        float t = time * (0.5 + float(i) * 0.1);
        c += abs(sin(p.x + sin(p.y + t)) * sin(p.y + sin(p.x + t * 1.3)));
        p *= 1.5;
    }
    return c / 3.0;
}
```

## Lava

```glsl
vec3 lava(vec2 st, float time) {
    float n = warpedFbm(st + vec2(time * 0.05));
    vec3 cold = vec3(0.1, 0.0, 0.0);
    vec3 hot = vec3(1.0, 0.3, 0.0);
    vec3 bright = vec3(1.0, 0.9, 0.3);
    return mix(cold, mix(hot, bright, n), smoothstep(0.3, 0.7, n));
}
```

## Grass/Fur

```glsl
float grass(vec2 st) {
    float n = fbm(st * 20.0);
    float blade = smoothstep(0.3, 0.5, n);
    return blade * (0.8 + fbm(st * 5.0) * 0.2);
}
```

## Stone/Rock

```glsl
vec3 stone(vec2 st) {
    float n1 = fbm(st * 4.0);
    float n2 = fbm(st * 8.0 + 5.0) * 0.5;
    float crack = smoothstep(0.48, 0.52, n1);
    vec3 base = vec3(0.5 + n2 * 0.2);
    return mix(base * 0.7, base, crack);
}
```
