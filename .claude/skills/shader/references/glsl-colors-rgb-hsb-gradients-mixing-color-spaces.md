# Colors in GLSL

Color spaces, gradients, and color manipulation techniques.

## RGB Color Space

Colors as vec3/vec4 with channels 0.0-1.0:

```glsl
vec3 red = vec3(1.0, 0.0, 0.0);
vec3 green = vec3(0.0, 1.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 white = vec3(1.0);
vec3 black = vec3(0.0);
vec3 gray = vec3(0.5);
```

## Hex to GLSL

Divide by 255: `#FF6600` = `vec3(1.0, 0.4, 0.0)`

```glsl
vec3 hexToRgb(int hex) {
    return vec3(
        float((hex >> 16) & 0xFF) / 255.0,
        float((hex >> 8) & 0xFF) / 255.0,
        float(hex & 0xFF) / 255.0
    );
}
```

## Color Mixing

```glsl
// Linear interpolation
vec3 color = mix(colorA, colorB, 0.5);

// Per-channel mixing
vec3 color = mix(colorA, colorB, vec3(0.2, 0.5, 0.8));

// Multiply (darken)
vec3 color = colorA * colorB;

// Screen (lighten)
vec3 color = 1.0 - (1.0 - colorA) * (1.0 - colorB);

// Add (glow)
vec3 color = colorA + colorB;
```

## Gradients

### Horizontal gradient
```glsl
vec3 color = mix(colorA, colorB, st.x);
```

### Vertical gradient
```glsl
vec3 color = mix(colorA, colorB, st.y);
```

### Radial gradient
```glsl
float d = distance(st, vec2(0.5));
vec3 color = mix(centerColor, edgeColor, d);
```

### Multi-stop gradient
```glsl
vec3 gradient(float t) {
    vec3 a = vec3(0.0, 0.0, 0.5);  // Dark blue
    vec3 b = vec3(0.0, 0.5, 1.0);  // Light blue
    vec3 c = vec3(1.0, 1.0, 0.0);  // Yellow
    vec3 d = vec3(1.0, 0.5, 0.0);  // Orange

    if (t < 0.33) return mix(a, b, t * 3.0);
    if (t < 0.66) return mix(b, c, (t - 0.33) * 3.0);
    return mix(c, d, (t - 0.66) * 3.0);
}
```

## HSB/HSV Color Space

More intuitive: Hue (color wheel), Saturation (intensity), Brightness.

### RGB to HSB
```glsl
vec3 rgb2hsb(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
```

### HSB to RGB
```glsl
vec3 hsb2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
                     0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}
```

### HSB Usage
```glsl
// Rainbow across x-axis
vec3 color = hsb2rgb(vec3(st.x, 1.0, 1.0));

// Color wheel (polar coordinates)
vec2 toCenter = st - 0.5;
float angle = atan(toCenter.y, toCenter.x);
float hue = angle / TWO_PI + 0.5;  // Normalize to 0-1
float sat = length(toCenter) * 2.0;
vec3 color = hsb2rgb(vec3(hue, sat, 1.0));
```

## Animated Colors

```glsl
// Cycling hue
float hue = fract(u_time * 0.1);
vec3 color = hsb2rgb(vec3(hue, 1.0, 1.0));

// Pulsing brightness
float brightness = sin(u_time) * 0.5 + 0.5;
vec3 color = baseColor * brightness;

// Color oscillation
vec3 color = mix(colorA, colorB, sin(u_time) * 0.5 + 0.5);
```

## Color Correction

```glsl
vec3 gamma(vec3 c, float g) { return pow(c, vec3(1.0 / g)); }
vec3 contrast(vec3 c, float a) { return (c - 0.5) * a + 0.5; }
vec3 saturation(vec3 c, float a) { return mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, a); }
```
