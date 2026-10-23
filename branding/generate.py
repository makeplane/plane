"""Generate the Xplication brand assets (logo components, favicons, PWA icons,
social preview, email logos) from the originals in branding/source/.

usage (from the repo root):
  uv run --no-project --with pillow --with numpy python branding/generate.py

source/xplication-icon.jpeg  1954px X mark on white (xplication.ro)
source/xplication-logo.png   color logo, dark text, transparent background
"""

import base64
import io
from pathlib import Path

import numpy as np
from PIL import Image

repo = Path(__file__).resolve().parent.parent
src = repo / "branding" / "source"


def white_to_alpha(im: Image.Image) -> Image.Image:
    """Remove a white background. Every brand color has a channel at least ~200 below
    white, so anything 120+ away is solid; only the anti-aliased edges get blended."""
    rgb = np.asarray(im.convert("RGB")).astype(np.float64)
    a = np.clip((255.0 - rgb).max(axis=2) / 120.0, 0.0, 1.0)
    a[a < 0.08] = 0.0  # JPEG noise in the white background
    safe = np.where(a > 0, a, 1.0)[..., None]
    col = 255.0 - (255.0 - rgb) / safe
    out = np.dstack([np.clip(col, 0, 255), a * 255.0]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def crop_to_content(im: Image.Image, pad: int = 0) -> Image.Image:
    l, t, r, b = im.getchannel("A").getbbox()
    return im.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, im.width), min(b + pad, im.height)))


def fit(im: Image.Image, h: int) -> Image.Image:
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def on_square(mark: Image.Image, size: int, pad_ratio: float, bg=None) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    inner = round(size * (1 - 2 * pad_ratio))
    m = mark.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return canvas


def png_bytes(im: Image.Image) -> bytes:
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def save(im: Image.Image, rel: str) -> None:
    path = repo / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".ico":
        im.save(path, sizes=[(16, 16), (32, 32), (48, 48)])
    else:
        path.write_bytes(png_bytes(im))
    print(f"wrote {rel} ({path.stat().st_size} B)")


# --- sources -------------------------------------------------------------------
mark = crop_to_content(white_to_alpha(Image.open(src / "xplication-icon.jpeg")))
logo = crop_to_content(Image.open(src / "xplication-logo.png").convert("RGBA"))

arr = np.asarray(logo).astype(np.int16)
rgb, alpha = arr[..., :3], arr[..., 3]
saturated = (rgb.max(axis=2) - rgb.min(axis=2)) > 40  # the colored X; text is near-black
x_part = np.where(saturated[..., None], arr, 0).astype(np.uint8)
text_alpha = np.where(saturated, 0, alpha).astype(np.uint8)

x_img = Image.fromarray(x_part, "RGBA")
text_mask = Image.fromarray(np.dstack([np.full_like(text_alpha, 255)] * 3 + [text_alpha]), "RGBA")

# Lockup without the tagline: keep rows down to the bottom of "XPLICATION"
# (the tagline is the lower text block, separated from the wordmark by a gap).
text_rows = (text_alpha > 0).any(axis=1)
rows = np.flatnonzero(text_rows)
gaps = np.flatnonzero(np.diff(rows) > 1)
word_bottom = rows[gaps[0]] + 1 if len(gaps) else rows[-1] + 1
lockup_h = logo.height
x_lock = x_img
text_lock = Image.new("RGBA", (logo.width, lockup_h), (255, 255, 255, 0))
text_lock.paste(text_mask.crop((0, 0, logo.width, word_bottom)), (0, 0))

# Scale the lockup layers to 96px tall (2x the largest in-app use, h-10/h-12)
LOCK_H = 96
x_lock_s, text_lock_s = fit(x_lock, LOCK_H), fit(text_lock, LOCK_H)
mark_s = fit(mark, 128)


def data_uri(im: Image.Image) -> str:
    return "data:image/png;base64," + base64.b64encode(png_bytes(im)).decode()


ts = f'''/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Xplication brand artwork, generated from the xplication.ro originals. Inlined as
// data URIs so the logo components work in every app regardless of base path.

/** Colored X mark, {mark_s.width}x{mark_s.height}. */
export const XPLICATION_MARK_SRC =
  "{data_uri(mark_s)}";
export const XPLICATION_MARK_SIZE = {{ width: {mark_s.width}, height: {mark_s.height} }} as const;

/** Lockup layers, {x_lock_s.width}x{x_lock_s.height}: the colored X, and an alpha mask of the
 * "XPLICATION" wordmark that the component fills with currentColor. */
export const XPLICATION_LOCKUP_MARK_SRC =
  "{data_uri(x_lock_s)}";
export const XPLICATION_LOCKUP_TEXT_MASK_SRC =
  "{data_uri(text_lock_s)}";
export const XPLICATION_LOCKUP_SIZE = {{ width: {x_lock_s.width}, height: {x_lock_s.height} }} as const;
'''
(repo / "packages/blocks/src/icons/brand/xplication-assets.ts").write_text(ts)
print(f"wrote xplication-assets.ts ({len(ts)} B), lockup {x_lock_s.size}, word_bottom {word_bottom}/{logo.height}")

# --- favicons / app icons ------------------------------------------------------
fav = on_square(mark, 256, 0.02)
for app in ("web", "admin", "space"):
    base = f"apps/{app}/app/assets/favicon"
    save(fav, f"{base}/favicon.ico")
    save(on_square(mark, 16, 0.0), f"{base}/favicon-16x16.png")
    save(on_square(mark, 32, 0.0), f"{base}/favicon-32x32.png")
    save(on_square(mark, 180, 0.12, (255, 255, 255, 255)), f"{base}/apple-touch-icon.png")
# PWA / home-screen icons: white background, padded for maskable safe zones
WHITE = (255, 255, 255, 255)
save(on_square(mark, 192, 0.18, WHITE), "apps/web/public/favicon/android-chrome-192x192.png")
save(on_square(mark, 512, 0.18, WHITE), "apps/web/public/favicon/android-chrome-512x512.png")
for size in (192, 348, 512):
    save(on_square(mark, size, 0.18, WHITE), f"apps/web/public/icons/icon-{size}x{size}.png")
save(on_square(mark, 180, 0.12, WHITE), "apps/web/app/assets/icons/icon-180x180.png")
save(on_square(mark, 512, 0.12, WHITE), "apps/web/app/assets/icons/icon-512x512.png")

# --- social preview ------------------------------------------------------------
og = Image.new("RGBA", (1200, 630), (255, 255, 255, 255))
big = logo.copy()
big.thumbnail((820, 340), Image.LANCZOS)
og.alpha_composite(big, ((1200 - big.width) // 2, (630 - big.height) // 2))
save(og.convert("RGB"), "apps/web/app/assets/og-image.png")

# --- email logos (served by the API at /static/logos/) --------------------------
# dark text: every email template has a white header
save(fit(logo, 120), "apps/api/plane/static/logos/xplication-logo-on-light.png")
save(fit(logo, 368), "apps/api/plane/static/logos/Logo.png")
