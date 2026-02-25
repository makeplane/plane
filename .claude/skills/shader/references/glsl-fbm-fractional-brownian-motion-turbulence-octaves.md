# Fractional Brownian Motion (fBm)

Layer noise octaves for natural-looking textures like clouds, terrain, and wood.

## Basic fBm

```glsl
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    // 6 octaves
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;    // Lacunarity
        amplitude *= 0.5;    // Gain (persistence)
    }

    return value;
}
```

## fBm Parameters

| Parameter | Effect | Typical Value |
|-----------|--------|---------------|
| **Octaves** | Detail level | 4-8 |
| **Lacunarity** | Frequency multiplier | 2.0 |
| **Gain** | Amplitude multiplier | 0.5 |

```glsl
float fbm(vec2 st, int octaves, float lacunarity, float gain) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= lacunarity;
        amplitude *= gain;
    }

    return value;
}
```

## Turbulence

Use absolute value for sharper valleys:

```glsl
float turbulence(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        value += amplitude * abs(noise(st * frequency) * 2.0 - 1.0);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}
```

## Ridged Noise

Inverted turbulence for mountain ridges:

```glsl
float ridged(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float prev = 1.0;

    for (int i = 0; i < 6; i++) {
        float n = abs(noise(st * frequency) * 2.0 - 1.0);
        n = 1.0 - n;           // Invert
        n = n * n;             // Sharpen
        n *= prev;             // Weight by previous
        prev = n;
        value += n * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}
```

## Warped fBm (Domain Warping)

Feed fBm into itself for organic distortion:

```glsl
float warpedFbm(vec2 st) {
    vec2 q = vec2(fbm(st), fbm(st + vec2(5.2, 1.3)));
    vec2 r = vec2(
        fbm(st + 4.0 * q + vec2(1.7, 9.2)),
        fbm(st + 4.0 * q + vec2(8.3, 2.8))
    );
    return fbm(st + 4.0 * r);
}
```

## Animated fBm

```glsl
float animatedFbm(vec2 st, float time) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        vec2 offset = vec2(time * 0.1 * float(i + 1));
        value += amplitude * noise(st * frequency + offset);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}
```

## Multifractal

Multiply instead of add for different character:

```glsl
float multifractal(vec2 st, float H, float lacunarity, int octaves) {
    float value = 1.0;
    float frequency = 1.0;

    for (int i = 0; i < octaves; i++) {
        value *= noise(st * frequency) * pow(frequency, -H) + 1.0;
        frequency *= lacunarity;
    }

    return value;
}
```

See also: `glsl-procedural-textures-clouds-marble-wood-terrain.md`
