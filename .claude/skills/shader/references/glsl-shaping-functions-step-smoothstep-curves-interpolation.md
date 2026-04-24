# Shaping Functions

Control value interpolation for smooth transitions and effects.

## Core Functions

### step(edge, x)
Hard threshold - returns 0.0 if x < edge, else 1.0.

```glsl
float y = step(0.5, st.x);  // Black left, white right
```

### smoothstep(edge0, edge1, x)
Smooth Hermite interpolation between edges.

```glsl
float y = smoothstep(0.2, 0.8, st.x);  // Gradual transition
```

Internally: `t = clamp((x-edge0)/(edge1-edge0), 0.0, 1.0); return t*t*(3.0-2.0*t);`

### mix(a, b, t)
Linear interpolation: `a*(1-t) + b*t`

```glsl
vec3 color = mix(colorA, colorB, st.x);  // Gradient
```

## Power Functions

```glsl
float y = pow(st.x, 5.0);     // Exponential curve
float y = sqrt(st.x);         // Square root
float y = exp(st.x);          // Natural exponential
float y = log(st.x);          // Natural logarithm
```

Exponent controls curve shape:
- `pow(x, n)` where n > 1: Slow start, fast end
- `pow(x, n)` where n < 1: Fast start, slow end

## Trigonometric Functions

```glsl
float y = sin(st.x * PI);           // Wave (0 to 1 to 0)
float y = cos(st.x * TWO_PI);       // Full cycle
float y = sin(st.x * 10.0 + u_time); // Animated wave
```

Normalize sin/cos from [-1,1] to [0,1]:
```glsl
float y = sin(x) * 0.5 + 0.5;
```

## Fractional & Modulo

```glsl
float y = fract(st.x * 5.0);  // Sawtooth wave (0 to 1 repeating)
float y = mod(st.x, 0.2);     // Modulo, repeats every 0.2
float y = floor(st.x * 5.0);  // Integer part (0,1,2,3,4...)
float y = ceil(st.x * 5.0);   // Round up
```

## Absolute & Sign

```glsl
float y = abs(st.x - 0.5);    // V-shape centered at 0.5
float y = sign(st.x - 0.5);   // -1.0, 0.0, or 1.0
```

## Clamping

```glsl
float y = clamp(x, 0.0, 1.0);         // Constrain range
float y = min(a, b);                   // Smaller value
float y = max(a, b);                   // Larger value
```

## Custom Shaping Curves

### Polynomial smoothstep (quintic)
```glsl
float smootherStep(float x) {
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}
```

### Exponential impulse
```glsl
float impulse(float k, float x) {
    float h = k * x;
    return h * exp(1.0 - h);
}
```

### Parabola
```glsl
float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}
```

### Cubic pulse
```glsl
float cubicPulse(float c, float w, float x) {
    x = abs(x - c);
    if (x > w) return 0.0;
    x /= w;
    return 1.0 - x * x * (3.0 - 2.0 * x);
}
```

## Combining Functions

Create band with two smoothsteps:
```glsl
float y = smoothstep(0.2, 0.4, st.x) - smoothstep(0.6, 0.8, st.x);
```

Smooth edges on shapes:
```glsl
float edge = 0.01;
float circle = smoothstep(radius + edge, radius - edge, dist);
```

## Animation Patterns

```glsl
// Oscillate 0-1
float t = sin(u_time) * 0.5 + 0.5;

// Sawtooth
float t = fract(u_time);

// Triangle wave
float t = abs(fract(u_time) * 2.0 - 1.0);

// Ping-pong
float t = abs(mod(u_time, 2.0) - 1.0);
```
