# /design — animation mode

Build animated GIFs (Slack-optimized) with a PIL-based frame pipeline:
easing functions, a frame composer, a GIF assembler, and validators.
Merged from the former `slack-gif-creator` skill.

## When you use it (entry triggers)

User asks for a gif / animation, "make me a GIF of X doing Y", "animate
this icon", or "make a loading spinner / emoji GIF". A single-frame image
that merely needs motion → this mode. An animated *presentation* → the
`presentation` mode instead.

## Where on the spine

Animation is a **build-heavy mode**: there is no variant-exploration step
by default.

- **Consult** — adopt `design/DESIGN.md` (colors, type scale,
  motion feel). If none exists, the orchestrator's Consult writes it
  first. Pick the Slack target (emoji 128×128 vs message 480×480) and the
  motion concept.
- **Explore** — *optional*, only when the user is torn between motion
  directions: produce 1–2 alternate motion treatments (e.g. bounce vs
  pulse) and let them choose. Otherwise go straight to Build.
- **Build** — render the GIF, verify against the Slack constraints +
  validators + taste gate, settle.

## Output layout (D17 + D19)

```
design/<name>/
├── v1.gif  v2.gif …     ← optional variants
└── <name>.gif            ← settled GIF (version suffix dropped)
```

Never `final`/`finalized`. Frames, source scripts, and any preview PNGs
are transient — keep them in the same folder or `design/state/`.

## Slack constraints (hard target)

| Kind | Dimensions | FPS | Colors | Duration |
|---|---|---|---|---|
| Emoji GIF | **128×128** (recommended) | 10–30 (lower = smaller) | 48–128 (fewer = smaller) | keep under **3 s** |
| Message GIF | **480×480** | 10–30 | 48–128 | as needed |

## Mechanics

### 1. Dependencies

```bash
python -m pip install -r scripts/gif/requirements.txt
# or: python -m pip install "pillow>=10.0.0" "imageio>=2.31.0" "imageio-ffmpeg>=0.4.9" "numpy>=1.24.0"
```

Version floors live in `scripts/gif/requirements.txt` (merged from the
source skill's pinned set — includes `imageio-ffmpeg`, needed for GIF
encode/decode on some platforms).

### 2. Core workflow

Run from the skill's `scripts/gif/` directory (or put it on the import
path) so the modules resolve:

```python
from gif_builder import GIFBuilder
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=10)

for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    # draw your animation using PIL primitives…
    builder.add_frame(frame)

builder.save('design/name/v1.gif', num_colors=48, optimize_for_emoji=True)
```

### 3. Drawing primitives (PIL ImageDraw)

```python
draw.ellipse([x1, y1, x2, y2], fill=(r,g,b), outline=(r,g,b), width=3)  # circles/ovals
draw.polygon([(x1,y1),(x2,y2),(x3,y3)], fill=(r,g,b), outline=(r,g,b), width=3)  # stars, triangles
draw.line([(x1,y1),(x2,y2)], fill=(r,g,b), width=5)   # lines
draw.rectangle([x1,y1,x2,y2], fill=(r,g,b), outline=(r,g,b), width=3)
```

**Don't use** emoji fonts (unreliable across platforms) or assume any
pre-packaged graphics ship with the skill.

**Making it look good** (not placeholder graphics):

- **Thicker lines** — always `width=2` or higher; `width=1` looks choppy.
- **Depth** — gradient backgrounds (`create_gradient_background`), layered
  shapes (a star inside a star), glow (draw a larger semi-transparent copy
  behind).
- **Interesting shapes** — not a plain circle: add highlights, rings,
  patterns. Combine stars + sparkles, circles + rings.
- **Color** — vibrant, complementary; dark outlines on light shapes and
  vice-versa; watch overall composition.
- **Complex shapes** (hearts, snowflakes) — combine polygons and ellipses,
  compute symmetric points, add detail.

If the user uploads an image: ask yourself whether they want it **used
directly** (animate/split into frames) or **as inspiration** (colors /
style). `Image.open('file.png')` handles either.

### 4. Utilities

**GIFBuilder** (`gif_builder.py`) — assemble + optimize:

```python
builder = GIFBuilder(width=128, height=128, fps=10)
builder.add_frame(frame)          # PIL Image or numpy array (auto-RGB, auto-resize)
builder.add_frames(frames)        # list
builder.save('out.gif', num_colors=48, optimize_for_emoji=True, remove_duplicates=True)
```

`optimize_colors(num_colors, use_global_palette=True)` builds one global
palette across sampled frames (better compression); `deduplicate_frames()`
removes near-identical consecutive frames. `save()` prints size/dims/
frames/duration and warns if the file is > 1 MB.

**Validators** (`validators.py`):

```python
from validators import validate_gif, is_slack_ready
passes, info = validate_gif('out.gif', is_emoji=True, verbose=True)
if is_slack_ready('out.gif'):
    print('Ready!')
```

Validation logic folded: emoji → `width == height` and `64 ≤ side ≤ 128`
(128×128 optimal); message → aspect ratio ≤ 2.0 and
`320 ≤ min(width,height) ≤ 640`; reports size, frame count, fps, duration;
flags >5 MB.

**Easing** (`easing.py`) — smooth motion instead of linear:

```python
from easing import interpolate
t = i / (num_frames - 1)
y = interpolate(start=0, end=400, t=t, easing='ease_out')
```

Available: `linear`, `ease_in`, `ease_out`, `ease_in_out`, `bounce_out`,
`elastic_out`, `back_out` (plus `ease_back_*`, squash-stretch, arc-motion
helpers).

**Frame helpers** (`frame_composer.py`):

```python
from frame_composer import (
    create_blank_frame,          # solid color background
    create_gradient_background,  # vertical gradient
    draw_circle,                 # ellipse helper
    draw_text,                   # default-font text
    draw_star                    # 5-pointed star
)
```

### 5. Animation concepts

- **Shake/Vibrate** — offset the object with oscillation; `math.sin()` /
  `math.cos()` over the frame index on x and/or y, plus small random
  jitter for natural feel.
- **Pulse/Heartbeat** — scale rhythmically with
  `math.sin(t * frequency * 2 * math.pi)`; heartbeat = two quick pulses
  then a pause; scale between 0.8 and 1.2 of base size.
- **Bounce** — `easing='ease_in'` while falling (accelerating), then
  `bounce_out` on landing; add gravity by increasing y velocity per frame.
- **Spin/Rotate** — `image.rotate(angle, resample=Image.BICUBIC)`; wobble
  = sine-wave the angle.
- **Fade In/Out** — RGBA image + adjust alpha, or `Image.blend(image1,
  image2, alpha)` from 0→1 (in) / 1→0 (out).
- **Slide** — start off-frame, end at the target; `ease_out` for a smooth
  stop, `back_out` for overshoot.
- **Zoom** — in: scale 0.1→2.0 cropping center; out: 2.0→1.0; motion blur
  optional via PIL filter.
- **Explode / particle burst** — particles with random angle + velocity;
  update `x += vx, y += vy`; apply `vy += gravity`; fade alpha over time.

Combine concepts freely (bouncing + rotating, pulsing + sliding).

### 6. Optimization (only when asked to shrink the file)

1. Fewer frames — lower FPS (10 instead of 20) or shorter duration.
2. Fewer colors — `num_colors=48` instead of 128.
3. Smaller dimensions — 128×128 instead of 480×480.
4. `remove_duplicates=True` in `save()`.
5. `optimize_for_emoji=True` auto-resizes to 128×128, caps colors at 48,
   and trims to ~12 frames.

## Verify

1. **Validators** — `is_slack_ready()` passes for the target class
   (emoji vs message).
2. **Slack table** — dimensions, fps, colors, duration against the table
   above.
3. **Motion check** — the eased motion reads intentionally (no jarring
   linear snaps at loop boundaries; looping joins cleanly on a 360° or
   rest position).
4. **Taste gate** — anti-slop, voice, no placeholder look; shapes are
   detailed, colors are deliberate (see `references/taste-gate.md`).
5. **Visual check** — open the GIF and step frames if needed.
6. **Settle** — delete losing `v*` files, rename the survivor
   `<name>.gif`.

## Inputs

`[what to animate] [how it moves / concept] [emoji vs message]` — e.g.
"make a loading spinner GIF of a gear that spins and pulses, emoji size".
Optional: an uploaded image to animate directly or use as reference.
