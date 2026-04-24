# Format Compatibility & Conversion Guide

Complete guide to media format support, codec recommendations, and conversion best practices.

## Image Format Support

### ImageMagick Formats

**Raster Formats (Full Support):**
- JPEG (.jpg, .jpeg) - Lossy, universal
- PNG (.png) - Lossless, transparency
- WebP (.webp) - Modern, lossy/lossless
- GIF (.gif) - Animation, limited colors
- TIFF (.tif, .tiff) - Professional, lossless
- BMP (.bmp) - Uncompressed, legacy
- ICO (.ico) - Icons, multi-size

**Raw Formats (Read Support):**
- CR2, NEF, ARW, DNG (Canon, Nikon, Sony, Adobe RAW)
- Requires dcraw or ufraw-batch

**Vector Formats (Limited):**
- SVG (.svg) - Read only, converts to raster
- PDF (.pdf) - Read/write, may have policy restrictions

**Other Formats:**
- HEIC (.heic) - Apple format, requires libheif
- AVIF (.avif) - Next-gen, requires libavif
- PSD (.psd) - Photoshop, basic support

### FFmpeg Image Support

**Input Formats:**
- JPEG, PNG, BMP, TIFF, WebP, GIF
- Image sequences (frame_%04d.png)

**Output Formats:**
- JPEG, PNG, BMP, TIFF
- Video from images

## Video Format Support

### Container Formats

**Universal Containers:**
- MP4 (.mp4) - Most compatible, streaming
- MKV (.mkv) - Feature-rich, flexible
- WebM (.webm) - Web-optimized, open
- AVI (.avi) - Legacy, broad support
- MOV (.mov) - Apple, professional

**Streaming Containers:**
- TS (.ts) - Transport stream, HLS segments
- M3U8 (.m3u8) - HLS playlist
- MPD (.mpd) - DASH manifest
- FLV (.flv) - Flash (legacy)

**Professional Formats:**
- ProRes (.mov) - Apple professional
- DNxHD/DNxHR (.mxf, .mov) - Avid professional
- MXF (.mxf) - Broadcast

### Video Codecs

**Modern Codecs:**
- H.264/AVC (libx264) - Universal, excellent balance
- H.265/HEVC (libx265) - Better compression, 4K
- VP9 (libvpx-vp9) - Open, YouTube
- AV1 (libaom-av1, libsvtav1) - Next-gen, best compression

**Legacy Codecs:**
- MPEG-4 (mpeg4) - Older devices
- MPEG-2 (mpeg2video) - DVD, broadcast
- VP8 (libvpx) - WebM predecessor

**Professional Codecs:**
- ProRes (prores) - Apple post-production
- DNxHD (dnxhd) - Avid editing
- Uncompressed (rawvideo) - Maximum quality

### Audio Codecs

**Modern Codecs:**
- AAC (aac) - Universal, streaming
- Opus (libopus) - Best low-bitrate
- MP3 (libmp3lame) - Universal compatibility

**Lossless Codecs:**
- FLAC (flac) - Open, archival
- ALAC (alac) - Apple lossless
- WAV (pcm_s16le) - Uncompressed

**Other Codecs:**
- Vorbis (libvorbis) - Open, WebM
- AC-3 (ac3) - Dolby Digital, surround
- DTS (dts) - Cinema surround

## Format Recommendations

### Use Case Matrix

| Use Case | Image Format | Video Container | Video Codec | Audio Codec |
|----------|--------------|-----------------|-------------|-------------|
| Web general | JPEG 85% | MP4 | H.264 | AAC 128k |
| Web transparency | PNG | - | - | - |
| Web modern | WebP | WebM | VP9 | Opus |
| Social media | JPEG 85% | MP4 | H.264 | AAC 128k |
| 4K streaming | - | MP4 | H.265 | AAC 192k |
| Archive | PNG/TIFF | MKV | H.265 CRF 18 | FLAC |
| Email | JPEG 75% | - | - | - |
| Print | TIFF/PNG | - | - | - |
| YouTube | - | MP4/WebM | H.264/VP9 | AAC/Opus |
| Live stream | - | FLV | H.264 | AAC |
| Editing | - | MOV/MXF | ProRes/DNxHD | PCM |

### Platform Compatibility

**Web Browsers (2025):**
- Images: JPEG, PNG, WebP, GIF, SVG
- Video: MP4 (H.264), WebM (VP9), MP4 (AV1)
- Audio: AAC, MP3, Opus, Vorbis

**Mobile Devices:**
- iOS: JPEG, PNG, HEIC, MP4 (H.264/H.265), AAC
- Android: JPEG, PNG, WebP, MP4 (H.264/H.265), AAC

**Smart TVs:**
- Most: MP4 (H.264), AAC
- Modern: MP4 (H.265), AC-3

**Social Media:**
- All platforms: JPEG, MP4 (H.264), AAC

## Quality vs Size Trade-offs

### Image Quality Comparison

**JPEG Quality Levels:**
- 95-100: ~5-10 MB (large image), minimal artifacts
- 85-94: ~1-3 MB, imperceptible loss
- 75-84: ~500 KB-1 MB, slight artifacts
- 60-74: ~200-500 KB, visible artifacts
- Below 60: <200 KB, poor quality

**Format Comparison (Same quality):**
- WebP: 25-35% smaller than JPEG
- HEIC: 40-50% smaller than JPEG
- AVIF: 50-60% smaller than JPEG
- PNG: 2-5x larger than JPEG (lossless)

### Video Quality Comparison

**H.264 CRF Values:**
- CRF 18: Visually lossless, ~8-15 Mbps (1080p)
- CRF 23: High quality, ~4-8 Mbps (1080p)
- CRF 28: Medium quality, ~2-4 Mbps (1080p)

**Codec Comparison (Same quality):**
- H.265: 40-50% smaller than H.264
- VP9: 30-40% smaller than H.264
- AV1: 50-60% smaller than H.264

### Audio Quality Comparison

**AAC Bitrates:**
- 320 kbps: Transparent, archival
- 192 kbps: High quality, music
- 128 kbps: Good quality, streaming
- 96 kbps: Acceptable, low bandwidth
- 64 kbps: Poor, voice only

**Codec Efficiency (Same quality):**
- Opus: Best at low bitrates (<128k)
- AAC: Best overall balance
- MP3: Less efficient but universal

## Conversion Best Practices

### Image Conversions

**PNG to JPEG:**
```bash
# Standard conversion
magick input.png -quality 85 -strip output.jpg

# With transparency handling
magick input.png -background white -flatten -quality 85 output.jpg
```

**JPEG to WebP:**
```bash
# FFmpeg
ffmpeg -i input.jpg -quality 80 output.webp

# ImageMagick
magick input.jpg -quality 80 output.webp
```

**RAW to JPEG:**
```bash
# Requires dcraw
magick input.CR2 -quality 90 output.jpg
```

**HEIC to JPEG:**
```bash
# Requires libheif
magick input.heic -quality 85 output.jpg
```

### Video Conversions

**MKV to MP4:**
```bash
# Copy streams (fast)
ffmpeg -i input.mkv -c copy output.mp4

# Re-encode if needed
ffmpeg -i input.mkv -c:v libx264 -crf 23 -c:a aac output.mp4
```

**AVI to MP4:**
```bash
# Modern codecs
ffmpeg -i input.avi -c:v libx264 -crf 23 -c:a aac output.mp4
```

**MOV to MP4:**
```bash
# Copy if H.264 already
ffmpeg -i input.mov -c copy output.mp4

# Convert ProRes to H.264
ffmpeg -i input.mov -c:v libx264 -crf 18 -c:a aac output.mp4
```

**Any to WebM:**
```bash
# VP9 encoding
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm
```

### Audio Conversions

**Extract Audio from Video:**
```bash
# Keep original codec
ffmpeg -i video.mp4 -vn -c:a copy audio.m4a

# Convert to MP3
ffmpeg -i video.mp4 -vn -q:a 0 audio.mp3

# Convert to FLAC (lossless)
ffmpeg -i video.mp4 -vn -c:a flac audio.flac
```

**Audio Format Conversion:**
```bash
# WAV to MP3
ffmpeg -i input.wav -c:a libmp3lame -b:a 192k output.mp3

# MP3 to AAC
ffmpeg -i input.mp3 -c:a aac -b:a 192k output.m4a

# Any to Opus
ffmpeg -i input.wav -c:a libopus -b:a 128k output.opus
```

## Codec Selection Guide

### Choose H.264 When:
- Maximum compatibility needed
- Targeting older devices
- Streaming to unknown devices
- Social media upload
- Fast encoding required

### Choose H.265 When:
- 4K video encoding
- Storage space limited
- Modern device targets
- Archival quality needed
- Bandwidth constrained

### Choose VP9 When:
- YouTube upload
- Open-source requirement
- Chrome/Firefox primary
- Royalty-free needed

### Choose AV1 When:
- Future-proofing content
- Maximum compression needed
- Encoding time not critical
- Modern platform targets

## Format Migration Strategies

### Archive to Web

```bash
# High-res archive -> Web-optimized
for img in archive/*.tif; do
  base=$(basename "$img" .tif)
  magick "$img" -resize 2000x2000\> -quality 85 -strip "web/${base}.jpg"
  magick "$img" -resize 2000x2000\> -quality 85 "web/${base}.webp"
done
```

### Legacy to Modern

```bash
# Convert old formats to modern codecs
for video in legacy/*.avi; do
  base=$(basename "$video" .avi)
  ffmpeg -i "$video" \
    -c:v libx264 -crf 23 -preset slow \
    -c:a aac -b:a 128k \
    "modern/${base}.mp4"
done
```

### Multi-Format Publishing

```bash
# Create multiple formats for compatibility
input="source.mp4"

# Modern browsers
ffmpeg -i "$input" -c:v libx264 -crf 23 -c:a aac output.mp4
ffmpeg -i "$input" -c:v libvpx-vp9 -crf 30 -c:a libopus output.webm

# Images
ffmpeg -ss 5 -i "$input" -vframes 1 poster.jpg
magick poster.jpg -quality 80 poster.webp
```

## Troubleshooting

### Unsupported Format

```bash
# Check FFmpeg formats
ffmpeg -formats

# Check ImageMagick formats
magick identify -list format

# Install missing codec support
sudo apt-get install libx264-dev libx265-dev libvpx-dev
```

### Compatibility Issues

```bash
# Force compatible encoding
ffmpeg -i input.mp4 \
  -c:v libx264 -profile:v high -level 4.0 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  output.mp4
```

### Quality Loss

```bash
# Avoid multiple conversions
# Bad: source -> edit -> web -> social
# Good: source -> final (single conversion)

# Use lossless intermediate
ffmpeg -i source.mp4 -c:v ffv1 intermediate.mkv
# Edit intermediate
ffmpeg -i intermediate.mkv -c:v libx264 final.mp4
```
