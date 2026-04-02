# Media Processing Troubleshooting

## FFmpeg Issues

### Unknown Encoder Error
```bash
# Check available encoders
ffmpeg -encoders | grep h264

# Install codec libraries (Ubuntu/Debian)
sudo apt-get install libx264-dev libx265-dev libvpx-dev
```

### Memory Errors
```bash
# Limit thread usage
ffmpeg -threads 4 input.mp4 output.mp4

# Process in segments for large files
ffmpeg -i large.mp4 -ss 0 -t 600 segment1.mp4
ffmpeg -i large.mp4 -ss 600 -t 600 segment2.mp4
```

### Slow Encoding
```bash
# Use faster preset (trades compression for speed)
ffmpeg -i input.mp4 -c:v libx264 -preset ultrafast output.mp4

# Use hardware acceleration
ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc output.mp4
```

## ImageMagick Issues

### "Not Authorized" Error
```bash
# Edit policy file
sudo nano /etc/ImageMagick-7/policy.xml

# Change from:
# <policy domain="coder" rights="none" pattern="PDF" />

# To:
# <policy domain="coder" rights="read|write" pattern="PDF" />
```

### Memory Limit Errors
```bash
# Increase memory limits
magick -limit memory 2GB -limit map 4GB input.jpg output.jpg

# Process in batches for large sets
ls *.jpg | xargs -n 10 -P 4 mogrify -resize 800x
```

### Slow Batch Processing
```bash
# Use parallel processing with GNU Parallel
ls *.jpg | parallel -j 4 magick {} -resize 800x resized-{}

# Or use mogrify for in-place edits (faster)
mogrify -resize 800x *.jpg
```

## RMBG Issues

### Model Download Failures
```bash
# Check network connectivity
curl https://unpkg.com/@rmbg/model-modnet/modnet-256.onnx

# Use custom cache directory
RMBG_CACHE_DIR=/tmp/rmbg-cache rmbg input.jpg

# Clear cache and retry
rm -rf /tmp/rmbg-cache
rmbg input.jpg
```

### Out of Memory
```bash
# Use smaller model
rmbg input.jpg -m u2netp -o output.png

# Reduce resolution
rmbg input.jpg -r 1024 -o output.png
```

### Slow Processing
```bash
# Use fastest model
rmbg input.jpg -m u2netp -o output.png

# Process smaller resolution
rmbg input.jpg -r 1024 -o output.png
```

## Performance Tips

1. **Use CRF for quality control** - Better than bitrate for video encoding
2. **Copy streams when possible** - Avoid re-encoding with `-c copy`
3. **Hardware acceleration** - GPU encoding 5-10x faster than CPU
4. **Appropriate presets** - Balance speed vs compression (`fast`, `medium`, `slow`)
5. **Batch with mogrify** - In-place image processing faster than individual commands
6. **Strip metadata** - Reduce file size with `-strip` flag
7. **Progressive JPEG** - Better web loading with `-interlace Plane`
8. **Test on samples** - Verify settings before processing large batches
9. **Parallel processing** - Use GNU Parallel for multiple files
10. **Limit memory** - Prevent crashes on large batches with `-limit` flags
