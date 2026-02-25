# ImageMagick Batch Processing

Complete guide to batch operations, mogrify command, parallel processing, and automation.

## Mogrify Command

### Basic Mogrify
Modify files in-place (overwrites originals).

```bash
# Resize all JPEGs
mogrify -resize 800x600 *.jpg

# Convert format (creates new files)
mogrify -format png *.jpg

# Apply effect to all images
mogrify -quality 85 -strip *.jpg
```

**Warning:** mogrify modifies files in-place. Always backup originals or use `-path` to output to different directory.

### Output to Different Directory
Preserve originals.

```bash
# Create output directory first
mkdir output

# Process to output directory
mogrify -path ./output -resize 800x600 *.jpg

# With format conversion
mogrify -path ./optimized -format webp -quality 80 *.png
```

## Common Batch Operations

### Resize All Images

```bash
# Resize to width 800
mogrify -resize 800x *.jpg

# Resize to height 600
mogrify -resize x600 *.jpg

# Fit within 800×600
mogrify -resize 800x600 *.jpg

# Resize to exact dimensions
mogrify -resize 800x600! *.jpg

# Only shrink, never enlarge
mogrify -resize 800x600\> *.jpg
```

### Format Conversion

```bash
# PNG to JPEG
mogrify -path ./jpg -format jpg -quality 85 *.png

# JPEG to WebP
mogrify -path ./webp -format webp -quality 80 *.jpg

# Any format to PNG
mogrify -path ./png -format png *.{jpg,gif,bmp}
```

### Optimize Images

```bash
# Strip metadata from all JPEGs
mogrify -strip *.jpg

# Optimize JPEGs for web
mogrify -quality 85 -strip -interlace Plane *.jpg

# Compress PNGs
mogrify -quality 95 *.png

# Combined optimization
mogrify -quality 85 -strip -interlace Plane -sampling-factor 4:2:0 *.jpg
```

### Apply Effects

```bash
# Add watermark to all images
mogrify -gravity southeast -draw "image over 10,10 0,0 'watermark.png'" *.jpg

# Convert all to grayscale
mogrify -colorspace Gray *.jpg

# Apply sepia tone
mogrify -sepia-tone 80% *.jpg

# Sharpen all images
mogrify -sharpen 0x1 *.jpg
```

### Thumbnail Generation

```bash
# Create square thumbnails
mogrify -path ./thumbnails -resize 200x200^ -gravity center -extent 200x200 *.jpg

# Create thumbnails with max dimension
mogrify -path ./thumbs -thumbnail 300x300 *.jpg

# Thumbnails with quality control
mogrify -path ./thumbs -thumbnail 200x200 -quality 80 -strip *.jpg
```

## Shell Loops

### Basic For Loop
More control than mogrify.

```bash
# Resize with custom naming
for img in *.jpg; do
  magick "$img" -resize 800x600 "resized_$img"
done

# Process to subdirectory
mkdir processed
for img in *.jpg; do
  magick "$img" -resize 1920x1080 "processed/$img"
done
```

### Multiple Operations

```bash
# Complex processing pipeline
for img in *.jpg; do
  magick "$img" \
    -resize 1920x1080^ \
    -gravity center \
    -crop 1920x1080+0+0 +repage \
    -unsharp 0x1 \
    -quality 85 -strip \
    "processed_$img"
done
```

### Format Conversion with Rename

```bash
# Convert PNG to JPEG with new names
for img in *.png; do
  magick "$img" -quality 90 "${img%.png}.jpg"
done

# Add prefix during conversion
for img in *.jpg; do
  magick "$img" -resize 800x "web_${img}"
done
```

### Conditional Processing

```bash
# Only process large images
for img in *.jpg; do
  width=$(identify -format "%w" "$img")
  if [ $width -gt 2000 ]; then
    magick "$img" -resize 2000x "resized_$img"
  fi
done

# Skip existing output files
for img in *.jpg; do
  output="output_$img"
  if [ ! -f "$output" ]; then
    magick "$img" -resize 800x "$output"
  fi
done
```

## Parallel Processing

### GNU Parallel
Process multiple images simultaneously.

```bash
# Install GNU Parallel
# Ubuntu/Debian: sudo apt-get install parallel
# macOS: brew install parallel

# Basic parallel resize
parallel magick {} -resize 800x600 resized_{} ::: *.jpg

# Parallel with function
resize_image() {
  magick "$1" -resize 1920x1080 -quality 85 "processed_$1"
}
export -f resize_image
parallel resize_image ::: *.jpg

# Limit concurrent jobs
parallel -j 4 magick {} -resize 800x {} ::: *.jpg

# Progress indicator
parallel --progress magick {} -resize 800x {} ::: *.jpg
```

### Xargs Parallel

```bash
# Using xargs for parallel processing
ls *.jpg | xargs -I {} -P 4 magick {} -resize 800x processed_{}

# With find
find . -name "*.jpg" -print0 | \
  xargs -0 -I {} -P 4 magick {} -resize 800x {}
```

## Advanced Batch Patterns

### Recursive Processing

```bash
# Process all JPEGs in subdirectories
find . -name "*.jpg" -exec magick {} -resize 800x {} \;

# With output directory structure
find . -name "*.jpg" -type f | while read img; do
  outdir="output/$(dirname "$img")"
  mkdir -p "$outdir"
  magick "$img" -resize 800x "$outdir/$(basename "$img")"
done
```

### Batch with Different Sizes

```bash
# Generate multiple sizes
for size in 320 640 1024 1920; do
  mkdir -p "output/${size}w"
  for img in *.jpg; do
    magick "$img" -resize ${size}x -quality 85 "output/${size}w/$img"
  done
done

# Parallel version
for size in 320 640 1024 1920; do
  mkdir -p "output/${size}w"
  parallel magick {} -resize ${size}x -quality 85 "output/${size}w/{}" ::: *.jpg
done
```

### Responsive Image Set

```bash
# Create responsive image set with srcset
mkdir -p responsive
for img in *.jpg; do
  base="${img%.jpg}"
  for width in 320 640 1024 1920; do
    magick "$img" -resize ${width}x -quality 85 \
      "responsive/${base}-${width}w.jpg"
  done
done
```

### Watermark Batch

```bash
# Add watermark to all images
for img in *.jpg; do
  magick "$img" watermark.png \
    -gravity southeast -geometry +10+10 \
    -composite "watermarked_$img"
done

# Different watermark positions for portrait vs landscape
for img in *.jpg; do
  width=$(identify -format "%w" "$img")
  height=$(identify -format "%h" "$img")

  if [ $width -gt $height ]; then
    # Landscape
    magick "$img" watermark.png -gravity southeast -composite "marked_$img"
  else
    # Portrait
    magick "$img" watermark.png -gravity south -composite "marked_$img"
  fi
done
```

## Error Handling

### Check Before Processing

```bash
# Verify image before processing
for img in *.jpg; do
  if identify "$img" > /dev/null 2>&1; then
    magick "$img" -resize 800x "processed_$img"
  else
    echo "Skipping corrupt image: $img"
  fi
done
```

### Log Processing

```bash
# Log successful and failed operations
log_file="batch_process.log"
error_log="errors.log"

for img in *.jpg; do
  if magick "$img" -resize 800x "output/$img" 2>> "$error_log"; then
    echo "$(date): Processed $img" >> "$log_file"
  else
    echo "$(date): Failed $img" >> "$error_log"
  fi
done
```

### Dry Run Mode

```bash
# Test without modifying files
dry_run=true

for img in *.jpg; do
  cmd="magick $img -resize 800x processed_$img"
  if [ "$dry_run" = true ]; then
    echo "Would run: $cmd"
  else
    eval $cmd
  fi
done
```

## Optimization Workflows

### Web Publishing Pipeline

```bash
# Complete web optimization workflow
mkdir -p web/{original,optimized,thumbnails}

# Copy originals
cp *.jpg web/original/

# Create optimized versions
mogrify -path web/optimized \
  -resize 1920x1080\> \
  -quality 85 \
  -strip \
  -interlace Plane \
  web/original/*.jpg

# Create thumbnails
mogrify -path web/thumbnails \
  -thumbnail 300x300 \
  -quality 80 \
  -strip \
  web/original/*.jpg
```

### Archive to Web Conversion

```bash
# Convert high-res archives to web formats
for img in archives/*.jpg; do
  base=$(basename "$img" .jpg)

  # Full size web version
  magick "$img" -resize 2048x2048\> -quality 90 -strip "web/${base}.jpg"

  # Thumbnail
  magick "$img" -thumbnail 400x400 -quality 85 "web/${base}_thumb.jpg"

  # WebP version
  magick "$img" -resize 2048x2048\> -quality 85 "web/${base}.webp"
done
```

### Print to Web Workflow

```bash
# Convert print-ready images to web
for img in print/*.tif; do
  base=$(basename "$img" .tif)

  # Convert colorspace and optimize
  magick "$img" \
    -colorspace sRGB \
    -resize 2000x2000\> \
    -quality 90 \
    -strip \
    -interlace Plane \
    "web/${base}.jpg"
done
```

## Batch Reporting

### Generate Report

```bash
# Create processing report
report="batch_report.txt"
echo "Batch Processing Report - $(date)" > "$report"
echo "================================" >> "$report"

total=0
success=0
failed=0

for img in *.jpg; do
  ((total++))
  if magick "$img" -resize 800x "output/$img" 2>/dev/null; then
    ((success++))
    echo "✓ $img" >> "$report"
  else
    ((failed++))
    echo "✗ $img" >> "$report"
  fi
done

echo "" >> "$report"
echo "Total: $total, Success: $success, Failed: $failed" >> "$report"
```

### Image Inventory

```bash
# Create inventory of images
inventory="image_inventory.csv"
echo "Filename,Width,Height,Format,Size,ColorSpace" > "$inventory"

for img in *.{jpg,png,gif}; do
  [ -f "$img" ] || continue
  info=$(identify -format "%f,%w,%h,%m,%b,%[colorspace]" "$img")
  echo "$info" >> "$inventory"
done
```

## Performance Tips

### Optimize Loop Performance

```bash
# Bad: Launch mogrify for each file
for img in *.jpg; do
  mogrify -resize 800x "$img"
done

# Good: Process all files in one mogrify call
mogrify -resize 800x *.jpg

# Best: Use parallel processing for complex operations
parallel magick {} -resize 800x -quality 85 processed_{} ::: *.jpg
```

### Memory Management

```bash
# Limit memory for batch processing
for img in *.jpg; do
  magick -limit memory 2GB -limit map 4GB \
    "$img" -resize 50% "output/$img"
done
```

### Progress Tracking

```bash
# Show progress for long batch operations
total=$(ls *.jpg | wc -l)
current=0

for img in *.jpg; do
  ((current++))
  echo "Processing $current/$total: $img"
  magick "$img" -resize 800x "output/$img"
done
```

## Automation Scripts

### Complete Bash Script

```bash
#!/bin/bash

# Configuration
INPUT_DIR="./input"
OUTPUT_DIR="./output"
QUALITY=85
MAX_WIDTH=1920
THUMBNAIL_SIZE=300

# Create output directories
mkdir -p "$OUTPUT_DIR"/{full,thumbnails}

# Process images
echo "Processing images..."
for img in "$INPUT_DIR"/*.{jpg,jpeg,png}; do
  [ -f "$img" ] || continue

  filename=$(basename "$img")
  base="${filename%.*}"

  # Full size
  magick "$img" \
    -resize ${MAX_WIDTH}x\> \
    -quality $QUALITY \
    -strip \
    "$OUTPUT_DIR/full/${base}.jpg"

  # Thumbnail
  magick "$img" \
    -thumbnail ${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE} \
    -quality 80 \
    -strip \
    "$OUTPUT_DIR/thumbnails/${base}_thumb.jpg"

  echo "✓ $filename"
done

echo "Done!"
```

### Python Batch Script

```python
#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path

INPUT_DIR = Path("./input")
OUTPUT_DIR = Path("./output")
SIZES = [320, 640, 1024, 1920]

# Create output directories
for size in SIZES:
    (OUTPUT_DIR / f"{size}w").mkdir(parents=True, exist_ok=True)

# Process images
for img in INPUT_DIR.glob("*.jpg"):
    for size in SIZES:
        output = OUTPUT_DIR / f"{size}w" / img.name
        subprocess.run([
            "magick", str(img),
            "-resize", f"{size}x",
            "-quality", "85",
            "-strip",
            str(output)
        ])
        print(f"✓ {img.name} -> {size}w")
```

## Common Batch Recipes

### Social Media Sizes

```bash
# Generate social media image sizes
for img in *.jpg; do
  base="${img%.jpg}"

  # Instagram square (1080×1080)
  magick "$img" -resize 1080x1080^ -gravity center -extent 1080x1080 "${base}_ig_square.jpg"

  # Instagram portrait (1080×1350)
  magick "$img" -resize 1080x1350^ -gravity center -extent 1080x1350 "${base}_ig_portrait.jpg"

  # Facebook post (1200×630)
  magick "$img" -resize 1200x630^ -gravity center -extent 1200x630 "${base}_fb_post.jpg"

  # Twitter post (1200×675)
  magick "$img" -resize 1200x675^ -gravity center -extent 1200x675 "${base}_tw_post.jpg"
done
```

### Email Newsletter Images

```bash
# Optimize images for email
mogrify -path ./email \
  -resize 600x\> \
  -quality 75 \
  -strip \
  -interlace Plane \
  *.jpg
```

### Backup and Archive

```bash
# Create web versions and keep originals
mkdir -p {originals,web}

# Move originals
mv *.jpg originals/

# Create optimized copies
for img in originals/*.jpg; do
  base=$(basename "$img")
  magick "$img" -resize 2000x2000\> -quality 85 -strip "web/$base"
done
```
