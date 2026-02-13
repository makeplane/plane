# FFmpeg Filters & Effects

Complete guide to video and audio filters, complex filtergraphs, and effect chains.

## Filter Basics

### Filter Syntax
Filters are applied with `-vf` (video) or `-af` (audio).

```bash
# Single filter
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# Chain filters with comma
ffmpeg -i input.mp4 -vf "scale=1280:720,hqdn3d" output.mp4

# Complex filtergraph with -filter_complex
ffmpeg -i input.mp4 -i logo.png \
  -filter_complex "[0:v][1:v]overlay=10:10" \
  output.mp4
```

## Video Filters

### Scale (Resize)
Change video dimensions.

```bash
# Specific dimensions
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# Maintain aspect ratio (auto height)
ffmpeg -i input.mp4 -vf scale=1280:-1 output.mp4

# Maintain aspect ratio (auto width)
ffmpeg -i input.mp4 -vf scale=-1:720 output.mp4

# Scale to half
ffmpeg -i input.mp4 -vf scale=iw/2:ih/2 output.mp4

# Scale with algorithm
ffmpeg -i input.mp4 -vf scale=1280:-1:flags=lanczos output.mp4
```

**Scaling algorithms:**
- `bilinear` - Fast, default
- `bicubic` - Better quality
- `lanczos` - Best quality, slower

### Crop
Extract portion of video.

```bash
# Crop width:height:x:y
ffmpeg -i input.mp4 -vf crop=1280:720:0:0 output.mp4

# Crop from center
ffmpeg -i input.mp4 -vf crop=1280:720:(iw-1280)/2:(ih-720)/2 output.mp4

# Auto-detect black borders
ffmpeg -i input.mp4 -vf cropdetect -f null -

# Apply detected crop
ffmpeg -i input.mp4 -vf crop=1920:800:0:140 output.mp4
```

### Rotate & Flip
Change video orientation.

```bash
# Rotate 90° clockwise
ffmpeg -i input.mp4 -vf transpose=1 output.mp4

# Rotate 90° counter-clockwise
ffmpeg -i input.mp4 -vf transpose=2 output.mp4

# Rotate 180°
ffmpeg -i input.mp4 -vf transpose=1,transpose=1 output.mp4

# Flip horizontal
ffmpeg -i input.mp4 -vf hflip output.mp4

# Flip vertical
ffmpeg -i input.mp4 -vf vflip output.mp4

# Rotate arbitrary angle
ffmpeg -i input.mp4 -vf rotate=45*PI/180 output.mp4
```

### Overlay (Watermark)
Composite images over video.

```bash
# Top-left corner
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex overlay=10:10 output.mp4

# Top-right corner
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex "overlay=W-w-10:10" output.mp4

# Bottom-right corner
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex "overlay=W-w-10:H-h-10" output.mp4

# Center
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex "overlay=(W-w)/2:(H-h)/2" output.mp4

# With transparency
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex "[1:v]format=rgba,colorchannelmixer=aa=0.5[logo];[0:v][logo]overlay=10:10" \
  output.mp4
```

### Denoise
Reduce video noise.

```bash
# High-quality denoise (hqdn3d)
ffmpeg -i input.mp4 -vf hqdn3d output.mp4

# Stronger denoise
ffmpeg -i input.mp4 -vf hqdn3d=4:3:6:4.5 output.mp4

# Temporal denoise (nlmeans - slow but best)
ffmpeg -i input.mp4 -vf nlmeans output.mp4

# Fast denoise
ffmpeg -i input.mp4 -vf dctdnoiz output.mp4
```

### Deinterlace
Remove interlacing artifacts.

```bash
# YADIF (fast, good quality)
ffmpeg -i input.mp4 -vf yadif output.mp4

# YADIF with frame doubling
ffmpeg -i input.mp4 -vf yadif=1 output.mp4

# Bwdif (better quality)
ffmpeg -i input.mp4 -vf bwdif output.mp4
```

### Speed & Slow Motion
Change playback speed.

```bash
# 2x speed (video + audio)
ffmpeg -i input.mp4 -vf setpts=0.5*PTS -af atempo=2.0 output.mp4

# 0.5x speed (slow motion)
ffmpeg -i input.mp4 -vf setpts=2.0*PTS -af atempo=0.5 output.mp4

# 4x speed (chain atempo)
ffmpeg -i input.mp4 -vf setpts=0.25*PTS -af atempo=2.0,atempo=2.0 output.mp4
```

### Pad (Add Borders)
Add borders or letterbox.

```bash
# Add black borders to make 16:9
ffmpeg -i input.mp4 -vf "pad=1920:1080:(ow-iw)/2:(oh-ih)/2" output.mp4

# Add colored borders
ffmpeg -i input.mp4 -vf "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=white" output.mp4

# Letterbox for Instagram (1:1)
ffmpeg -i input.mp4 -vf "scale=1080:-1,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black" output.mp4
```

### Sharpen & Blur
Adjust image sharpness.

```bash
# Sharpen (unsharp mask)
ffmpeg -i input.mp4 -vf unsharp=5:5:1.0 output.mp4

# Stronger sharpen
ffmpeg -i input.mp4 -vf unsharp=7:7:2.5 output.mp4

# Gaussian blur
ffmpeg -i input.mp4 -vf gblur=sigma=8 output.mp4

# Box blur
ffmpeg -i input.mp4 -vf boxblur=5:1 output.mp4
```

### Color Adjustments
Modify colors and exposure.

```bash
# Brightness (+/- 1.0)
ffmpeg -i input.mp4 -vf eq=brightness=0.1 output.mp4

# Contrast (+/- 2.0)
ffmpeg -i input.mp4 -vf eq=contrast=1.2 output.mp4

# Saturation (0-3)
ffmpeg -i input.mp4 -vf eq=saturation=1.5 output.mp4

# Gamma (0.1-10)
ffmpeg -i input.mp4 -vf eq=gamma=1.2 output.mp4

# Combined adjustments
ffmpeg -i input.mp4 -vf eq=brightness=0.05:contrast=1.1:saturation=1.2 output.mp4

# Curves (color grading)
ffmpeg -i input.mp4 -vf curves=vintage output.mp4

# Hue shift
ffmpeg -i input.mp4 -vf hue=h=90 output.mp4
```

### Grayscale & Effects
Convert to monochrome or apply effects.

```bash
# Grayscale
ffmpeg -i input.mp4 -vf hue=s=0 output.mp4

# Sepia tone
ffmpeg -i input.mp4 -vf colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131 output.mp4

# Negative
ffmpeg -i input.mp4 -vf negate output.mp4

# Edge detection
ffmpeg -i input.mp4 -vf edgedetect output.mp4

# Vignette
ffmpeg -i input.mp4 -vf vignette output.mp4
```

### Fade In/Out
Smooth transitions.

```bash
# Fade in from black (2 seconds)
ffmpeg -i input.mp4 -vf fade=in:0:60 output.mp4

# Fade out to black (last 2 seconds)
ffmpeg -i input.mp4 -vf fade=out:st=28:d=2 output.mp4

# Both fade in and out
ffmpeg -i input.mp4 -vf "fade=in:0:30,fade=out:st=28:d=2" output.mp4
```

### Stabilization
Reduce camera shake.

```bash
# Two-pass stabilization
# Pass 1: detect motion
ffmpeg -i input.mp4 -vf vidstabdetect=shakiness=10:accuracy=15 -f null -

# Pass 2: stabilize
ffmpeg -i input.mp4 -vf vidstabtransform=smoothing=30:input="transforms.trf" output.mp4
```

### Text Overlay
Add text to video.

```bash
# Simple text
ffmpeg -i input.mp4 -vf "drawtext=text='Hello World':fontsize=24:x=10:y=10" output.mp4

# With styling
ffmpeg -i input.mp4 -vf "drawtext=text='Title':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=50:box=1:boxcolor=black@0.5:boxborderw=5" output.mp4

# Timestamp
ffmpeg -i input.mp4 -vf "drawtext=text='%{pts\:hms}':fontsize=20:x=10:y=10:fontcolor=white" output.mp4
```

## Audio Filters

### Volume
Adjust audio level.

```bash
# Increase by 10dB
ffmpeg -i input.mp4 -af volume=10dB output.mp4

# Decrease to 50%
ffmpeg -i input.mp4 -af volume=0.5 output.mp4

# Double volume
ffmpeg -i input.mp4 -af volume=2.0 output.mp4
```

### Normalize
Balance audio levels.

```bash
# Loudness normalization (EBU R128)
ffmpeg -i input.mp4 -af loudnorm output.mp4

# With specific target
ffmpeg -i input.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11 output.mp4

# Two-pass normalization (better quality)
# Pass 1: analyze
ffmpeg -i input.mp4 -af loudnorm=print_format=json -f null -

# Pass 2: normalize with measured values
ffmpeg -i input.mp4 -af loudnorm=measured_I=-23:measured_LRA=7:measured_TP=-2:measured_thresh=-33 output.mp4
```

### Equalizer
Adjust frequency bands.

```bash
# Bass boost
ffmpeg -i input.mp4 -af equalizer=f=100:width_type=h:width=200:g=10 output.mp4

# Treble boost
ffmpeg -i input.mp4 -af equalizer=f=10000:width_type=h:width=2000:g=5 output.mp4

# Multiple bands
ffmpeg -i input.mp4 -af "equalizer=f=100:g=5,equalizer=f=1000:g=-3" output.mp4
```

### Compressor
Dynamic range compression.

```bash
# Basic compression
ffmpeg -i input.mp4 -af acompressor output.mp4

# Custom settings
ffmpeg -i input.mp4 -af acompressor=threshold=-20dB:ratio=4:attack=200:release=1000 output.mp4
```

### Noise Reduction
Remove background noise.

```bash
# High-pass filter (remove low frequency noise)
ffmpeg -i input.mp4 -af highpass=f=200 output.mp4

# Low-pass filter (remove high frequency noise)
ffmpeg -i input.mp4 -af lowpass=f=3000 output.mp4

# Band-pass filter
ffmpeg -i input.mp4 -af "highpass=f=200,lowpass=f=3000" output.mp4
```

### Fade Audio
Smooth audio transitions.

```bash
# Fade in (2 seconds)
ffmpeg -i input.mp4 -af afade=t=in:st=0:d=2 output.mp4

# Fade out (last 3 seconds)
ffmpeg -i input.mp4 -af afade=t=out:st=27:d=3 output.mp4

# Both
ffmpeg -i input.mp4 -af "afade=t=in:st=0:d=2,afade=t=out:st=27:d=3" output.mp4
```

### Audio Mixing
Combine multiple audio tracks.

```bash
# Mix two audio files
ffmpeg -i audio1.mp3 -i audio2.mp3 \
  -filter_complex amix=inputs=2:duration=longest output.mp3

# Mix with volume adjustment
ffmpeg -i audio1.mp3 -i audio2.mp3 \
  -filter_complex "[0:a]volume=0.8[a1];[1:a]volume=0.5[a2];[a1][a2]amix=inputs=2" \
  output.mp3
```

## Complex Filtergraphs

### Multiple Outputs
Create multiple versions simultaneously.

```bash
# Generate 3 resolutions at once
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3]; \
    [v1]scale=1920:1080[out1]; \
    [v2]scale=1280:720[out2]; \
    [v3]scale=640:360[out3]" \
  -map "[out1]" -c:v libx264 -crf 22 output_1080p.mp4 \
  -map "[out2]" -c:v libx264 -crf 23 output_720p.mp4 \
  -map "[out3]" -c:v libx264 -crf 24 output_360p.mp4 \
  -map 0:a -c:a copy
```

### Picture-in-Picture
Overlay small video on main video.

```bash
ffmpeg -i main.mp4 -i small.mp4 \
  -filter_complex "[1:v]scale=320:180[pip]; \
    [0:v][pip]overlay=W-w-10:H-h-10" \
  output.mp4
```

### Side-by-Side Comparison
Compare two videos.

```bash
# Horizontal
ffmpeg -i left.mp4 -i right.mp4 \
  -filter_complex "[0:v][1:v]hstack=inputs=2" \
  output.mp4

# Vertical
ffmpeg -i top.mp4 -i bottom.mp4 \
  -filter_complex "[0:v][1:v]vstack=inputs=2" \
  output.mp4
```

### Crossfade Transition
Smooth transition between videos.

```bash
ffmpeg -i video1.mp4 -i video2.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=2:offset=8" \
  output.mp4
```

**Transition types:** fade, wipeleft, wiperight, wipeup, wipedown, slideleft, slideright, slideup, slidedown, circlecrop, rectcrop, distance, fadeblack, fadewhite, radial, smoothleft, smoothright, smoothup, smoothdown

### Color Correction Pipeline
Professional color grading.

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]eq=contrast=1.1:brightness=0.05:saturation=1.2[v1]; \
    [v1]curves=vintage[v2]; \
    [v2]vignette[v3]; \
    [v3]unsharp=5:5:1.0[out]" \
  -map "[out]" -c:v libx264 -crf 18 output.mp4
```

## Filter Performance

### GPU Acceleration
Use hardware filters when available.

```bash
# NVIDIA CUDA scale
ffmpeg -hwaccel cuda -i input.mp4 \
  -vf scale_cuda=1280:720 \
  -c:v h264_nvenc output.mp4

# Multiple GPU filters
ffmpeg -hwaccel cuda -i input.mp4 \
  -vf "scale_cuda=1280:720,hwdownload,format=nv12" \
  -c:v h264_nvenc output.mp4
```

### Optimize Filter Order
More efficient filter chains.

```bash
# Bad: scale after complex operations
ffmpeg -i input.mp4 -vf "hqdn3d,unsharp=5:5:1.0,scale=1280:720" output.mp4

# Good: scale first (fewer pixels to process)
ffmpeg -i input.mp4 -vf "scale=1280:720,hqdn3d,unsharp=5:5:1.0" output.mp4
```

## Common Filter Recipes

### YouTube Optimized
```bash
ffmpeg -i input.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k \
  output.mp4
```

### Instagram Portrait
```bash
ffmpeg -i input.mp4 \
  -vf "scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=white" \
  -c:v libx264 -preset fast -crf 23 -c:a aac \
  output.mp4
```

### Vintage Film Look
```bash
ffmpeg -i input.mp4 \
  -vf "curves=vintage,vignette=angle=PI/4,eq=saturation=0.8,noise=alls=10:allf=t" \
  -c:v libx264 -crf 20 output.mp4
```

### Clean & Enhance
```bash
ffmpeg -i input.mp4 \
  -vf "hqdn3d=4:3:6:4.5,unsharp=5:5:1.0,eq=contrast=1.05:saturation=1.1" \
  -c:v libx264 -crf 20 output.mp4
```
