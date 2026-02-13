# ImageMagick Image Editing

Complete guide to format conversion, resizing, effects, transformations, and composition.

## Format Conversion

### Basic Conversion
Convert between image formats.

```bash
# PNG to JPEG
magick input.png output.jpg

# JPEG to WebP
magick input.jpg output.webp

# Multiple outputs simultaneously
magick input.png output.jpg output.webp output.gif

# Convert with quality setting
magick input.png -quality 85 output.jpg
```

### Quality Settings

**JPEG Quality (0-100):**
- 95-100: Archival, minimal compression
- 85-94: High quality, web publishing
- 75-84: Medium quality, web optimized
- 60-74: Lower quality, smaller files
- Below 60: Visible artifacts

```bash
# High quality
magick input.png -quality 95 output.jpg

# Web optimized (recommended)
magick input.png -quality 85 -strip output.jpg

# Smaller file size
magick input.png -quality 75 -sampling-factor 4:2:0 -strip output.jpg
```

**PNG Quality (0-9 = compression level):**
```bash
# Maximum compression (slower)
magick input.jpg -quality 95 output.png

# Faster compression
magick input.jpg -quality 75 output.png
```

**WebP Quality:**
```bash
# Lossy with quality
magick input.jpg -quality 80 output.webp

# Lossless
magick input.png -define webp:lossless=true output.webp
```

### Progressive & Optimization

```bash
# Progressive JPEG (better web loading)
magick input.png -quality 85 -interlace Plane output.jpg

# Strip metadata (reduce file size)
magick input.jpg -strip output.jpg

# Combined optimization
magick input.png -quality 85 -interlace Plane -strip output.jpg
```

## Resizing Operations

### Basic Resize
Maintain aspect ratio.

```bash
# Fit within 800×600
magick input.jpg -resize 800x600 output.jpg

# Resize to specific width (auto height)
magick input.jpg -resize 800x output.jpg

# Resize to specific height (auto width)
magick input.jpg -resize x600 output.jpg

# Scale by percentage
magick input.jpg -resize 50% output.jpg
```

### Advanced Resize

```bash
# Resize only if larger (shrink only)
magick input.jpg -resize 800x600\> output.jpg

# Resize only if smaller (enlarge only)
magick input.jpg -resize 800x600\< output.jpg

# Force exact dimensions (ignore aspect ratio)
magick input.jpg -resize 800x600! output.jpg

# Fill dimensions (may crop)
magick input.jpg -resize 800x600^ output.jpg

# Minimum dimensions
magick input.jpg -resize 800x600^ output.jpg
```

### Resize Algorithms

```bash
# High quality (Lanczos)
magick input.jpg -filter Lanczos -resize 50% output.jpg

# Fast resize (Box)
magick input.jpg -filter Box -resize 50% output.jpg

# Mitchel filter (good balance)
magick input.jpg -filter Mitchell -resize 50% output.jpg
```

**Filter comparison:**
- `Lanczos` - Highest quality, slower
- `Mitchell` - Good quality, fast
- `Catrom` - Sharp, good for downscaling
- `Box` - Fastest, acceptable quality
- `Cubic` - Smooth results

## Cropping

### Basic Crop
Extract region from image.

```bash
# Crop width×height+x+y
magick input.jpg -crop 400x400+100+100 output.jpg

# Remove virtual canvas after crop
magick input.jpg -crop 400x400+100+100 +repage output.jpg

# Crop from center
magick input.jpg -gravity center -crop 400x400+0+0 output.jpg

# Crop to aspect ratio
magick input.jpg -gravity center -crop 16:9 +repage output.jpg
```

### Smart Crop
Content-aware cropping.

```bash
# Trim transparent/same-color borders
magick input.png -trim +repage output.png

# Trim with fuzz tolerance
magick input.jpg -fuzz 10% -trim +repage output.jpg
```

### Thumbnail Generation
Create square thumbnails from any aspect ratio.

```bash
# Resize and crop to square
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg

# Alternative method
magick input.jpg -thumbnail 200x200^ -gravity center -crop 200x200+0+0 +repage thumb.jpg

# With background (no crop)
magick input.jpg -resize 200x200 -background white -gravity center -extent 200x200 thumb.jpg
```

## Effects & Filters

### Blur Effects

```bash
# Standard blur (radius 0 = auto)
magick input.jpg -blur 0x8 output.jpg

# Gaussian blur (radius×sigma)
magick input.jpg -gaussian-blur 5x3 output.jpg

# Motion blur (angle)
magick input.jpg -motion-blur 0x20+45 output.jpg

# Radial blur
magick input.jpg -radial-blur 10 output.jpg
```

### Sharpen

```bash
# Basic sharpen
magick input.jpg -sharpen 0x1 output.jpg

# Stronger sharpen
magick input.jpg -sharpen 0x3 output.jpg

# Unsharp mask (advanced)
magick input.jpg -unsharp 0x1 output.jpg
```

### Color Effects

```bash
# Grayscale
magick input.jpg -colorspace Gray output.jpg

# Sepia tone
magick input.jpg -sepia-tone 80% output.jpg

# Negate (invert colors)
magick input.jpg -negate output.jpg

# Posterize (reduce colors)
magick input.jpg -posterize 8 output.jpg

# Solarize
magick input.jpg -solarize 50% output.jpg
```

### Artistic Effects

```bash
# Edge detection
magick input.jpg -edge 3 output.jpg

# Emboss
magick input.jpg -emboss 2 output.jpg

# Oil painting
magick input.jpg -paint 4 output.jpg

# Charcoal drawing
magick input.jpg -charcoal 2 output.jpg

# Sketch
magick input.jpg -sketch 0x20+120 output.jpg

# Swirl
magick input.jpg -swirl 90 output.jpg
```

## Adjustments

### Brightness & Contrast

```bash
# Increase brightness
magick input.jpg -brightness-contrast 10x0 output.jpg

# Increase contrast
magick input.jpg -brightness-contrast 0x20 output.jpg

# Both
magick input.jpg -brightness-contrast 10x20 output.jpg

# Negative values to decrease
magick input.jpg -brightness-contrast -10x-10 output.jpg
```

### Color Adjustments

```bash
# Adjust saturation (HSL modulation)
# Format: brightness,saturation,hue
magick input.jpg -modulate 100,150,100 output.jpg

# Adjust hue
magick input.jpg -modulate 100,100,120 output.jpg

# Combined adjustments
magick input.jpg -modulate 105,120,100 output.jpg

# Adjust specific color channels
magick input.jpg -channel Red -evaluate multiply 1.2 output.jpg
```

### Auto Corrections

```bash
# Auto level (normalize contrast)
magick input.jpg -auto-level output.jpg

# Auto gamma correction
magick input.jpg -auto-gamma output.jpg

# Normalize (stretch histogram)
magick input.jpg -normalize output.jpg

# Enhance (digital enhancement)
magick input.jpg -enhance output.jpg

# Equalize (histogram equalization)
magick input.jpg -equalize output.jpg
```

## Transformations

### Rotation

```bash
# Rotate 90° clockwise
magick input.jpg -rotate 90 output.jpg

# Rotate 180°
magick input.jpg -rotate 180 output.jpg

# Rotate counter-clockwise
magick input.jpg -rotate -90 output.jpg

# Rotate with background
magick input.jpg -background white -rotate 45 output.jpg

# Auto-orient based on EXIF
magick input.jpg -auto-orient output.jpg
```

### Flip & Mirror

```bash
# Flip vertically
magick input.jpg -flip output.jpg

# Flip horizontally (mirror)
magick input.jpg -flop output.jpg

# Both
magick input.jpg -flip -flop output.jpg
```

## Borders & Frames

### Simple Borders

```bash
# Add 10px black border
magick input.jpg -border 10x10 output.jpg

# Colored border
magick input.jpg -bordercolor red -border 10x10 output.jpg

# Different width/height
magick input.jpg -bordercolor blue -border 20x10 output.jpg
```

### Advanced Frames

```bash
# Raised frame
magick input.jpg -mattecolor gray -frame 10x10+5+5 output.jpg

# Shadow effect
magick input.jpg \
  \( +clone -background black -shadow 80x3+5+5 \) \
  +swap -background white -layers merge +repage \
  output.jpg

# Rounded corners
magick input.jpg \
  \( +clone -threshold -1 -draw "fill black polygon 0,0 0,15 15,0 fill white circle 15,15 15,0" \
  \( +clone -flip \) -compose multiply -composite \
  \( +clone -flop \) -compose multiply -composite \
  \) -alpha off -compose copy_opacity -composite \
  output.png
```

## Text & Annotations

### Basic Text

```bash
# Simple text overlay
magick input.jpg -pointsize 30 -fill white -annotate +10+30 "Hello" output.jpg

# Positioned text
magick input.jpg -gravity south -pointsize 20 -fill white \
  -annotate +0+10 "Copyright 2025" output.jpg

# Text with background
magick input.jpg -gravity center -pointsize 40 -fill white \
  -undercolor black -annotate +0+0 "Watermark" output.jpg
```

### Advanced Text

```bash
# Semi-transparent watermark
magick input.jpg \
  \( -background none -fill "rgba(255,255,255,0.5)" \
  -pointsize 50 label:"DRAFT" \) \
  -gravity center -compose over -composite \
  output.jpg

# Text with stroke
magick input.jpg -gravity center \
  -stroke black -strokewidth 2 -fill white \
  -pointsize 60 -annotate +0+0 "Title" \
  output.jpg

# Custom font
magick input.jpg -font Arial-Bold -pointsize 40 \
  -gravity center -fill white -annotate +0+0 "Text" \
  output.jpg
```

## Image Composition

### Overlay Images

```bash
# Basic overlay (top-left)
magick input.jpg overlay.png -composite output.jpg

# Position with gravity
magick input.jpg watermark.png -gravity southeast -composite output.jpg

# Position with offset
magick input.jpg watermark.png -gravity southeast \
  -geometry +10+10 -composite output.jpg

# Center overlay
magick input.jpg logo.png -gravity center -composite output.jpg
```

### Composite Modes

```bash
# Over (default)
magick input.jpg overlay.png -compose over -composite output.jpg

# Multiply
magick input.jpg texture.png -compose multiply -composite output.jpg

# Screen
magick input.jpg light.png -compose screen -composite output.jpg

# Overlay blend mode
magick input.jpg pattern.png -compose overlay -composite output.jpg
```

### Side-by-Side

```bash
# Horizontal append
magick image1.jpg image2.jpg +append output.jpg

# Vertical append
magick image1.jpg image2.jpg -append output.jpg

# With spacing
magick image1.jpg image2.jpg -gravity center \
  -background white -splice 10x0 +append output.jpg
```

## Transparency

### Create Transparency

```bash
# Make color transparent
magick input.jpg -transparent white output.png

# Make similar colors transparent (with fuzz)
magick input.jpg -fuzz 10% -transparent white output.png

# Alpha channel operations
magick input.png -alpha set -channel A -evaluate multiply 0.5 +channel output.png
```

### Remove Transparency

```bash
# Flatten with white background
magick input.png -background white -flatten output.jpg

# Flatten with custom color
magick input.png -background "#ff0000" -flatten output.jpg
```

## Advanced Techniques

### Vignette Effect

```bash
# Default vignette
magick input.jpg -vignette 0x20 output.jpg

# Custom vignette
magick input.jpg -background black -vignette 0x25+10+10 output.jpg
```

### Depth of Field Blur

```bash
# Radial blur from center
magick input.jpg \
  \( +clone -blur 0x8 \) \
  \( +clone -fill white -colorize 100 \
  -fill black -draw "circle %[fx:w/2],%[fx:h/2] %[fx:w/2],%[fx:h/4]" \
  -blur 0x20 \) \
  -composite output.jpg
```

### HDR Effect

```bash
magick input.jpg \
  \( +clone -colorspace gray \) \
  \( -clone 0 -auto-level -modulate 100,150,100 \) \
  -delete 0 -compose overlay -composite \
  output.jpg
```

### Tilt-Shift Effect

```bash
magick input.jpg \
  \( +clone -sparse-color Barycentric '0,%[fx:h*0.3] gray0 0,%[fx:h*0.5] white 0,%[fx:h*0.7] gray0' \) \
  \( +clone -blur 0x20 \) \
  -compose blend -define compose:args=100 -composite \
  output.jpg
```

## Color Management

### Color Profiles

```bash
# Strip color profile
magick input.jpg -strip output.jpg

# Assign color profile
magick input.jpg -profile sRGB.icc output.jpg

# Convert between profiles
magick input.jpg -profile AdobeRGB.icc -profile sRGB.icc output.jpg
```

### Color Space Conversion

```bash
# Convert to sRGB
magick input.jpg -colorspace sRGB output.jpg

# Convert to CMYK (print)
magick input.jpg -colorspace CMYK output.tif

# Convert to LAB
magick input.jpg -colorspace LAB output.jpg
```

## Performance Optimization

### Memory Management

```bash
# Limit memory usage
magick -limit memory 2GB -limit map 4GB input.jpg -resize 50% output.jpg

# Set thread count
magick -limit thread 4 input.jpg -resize 50% output.jpg

# Streaming for large files
magick -define stream:buffer-size=0 huge.jpg -resize 50% output.jpg
```

### Quality vs Size

```bash
# Maximum quality (large file)
magick input.jpg -quality 95 output.jpg

# Balanced (recommended)
magick input.jpg -quality 85 -strip output.jpg

# Smaller file (acceptable quality)
magick input.jpg -quality 70 -sampling-factor 4:2:0 -strip output.jpg

# Progressive JPEG
magick input.jpg -quality 85 -interlace Plane -strip output.jpg
```

## Common Recipes

### Avatar/Profile Picture

```bash
# Square thumbnail
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 avatar.jpg

# Circular avatar (PNG)
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 \
  \( +clone -threshold -1 -negate -fill white -draw "circle 100,100 100,0" \) \
  -alpha off -compose copy_opacity -composite avatar.png
```

### Responsive Images

```bash
# Generate multiple sizes
for size in 320 640 1024 1920; do
  magick input.jpg -resize ${size}x -quality 85 -strip "output-${size}w.jpg"
done
```

### Photo Enhancement

```bash
# Auto-enhance workflow
magick input.jpg \
  -auto-level \
  -unsharp 0x1 \
  -brightness-contrast 5x10 \
  -modulate 100,110,100 \
  -quality 90 -strip \
  output.jpg
```
