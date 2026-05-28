# Effects

Use Remotion's effects system when a composition needs visual post-processing that should stay synchronized with the frame timeline.

## When to use effects

- Blur, distort, or warp a clip without pre-rendering external assets.
- Apply reusable looks across images, videos, GIFs, or HTML-in-canvas content.
- Chain multiple visual treatments while keeping props and timing inside React.

## Guidance

- Prefer official `@remotion/effects` helpers over custom canvas or CSS filters when an equivalent effect exists.
- Keep effect parameters deterministic from frame, props, or composition metadata.
- Test chained 2D and WebGL effects in the Remotion preview and a real render before shipping.
- When using GIFs or transition presentations, confirm the effect applies to the intended layer rather than the full scene.

## Common effects

- `blur()` for animated or axis-specific blur.
- `wave()` for WebGL2 warp/distortion.
- `dissolve()` from transitions when a scene needs an HTML-in-canvas dissolve presentation.
