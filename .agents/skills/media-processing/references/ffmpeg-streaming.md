# FFmpeg Streaming & Live Video

Complete guide to HLS/DASH streaming, live streaming platforms, and adaptive bitrate encoding.

## HLS (HTTP Live Streaming)

### Basic HLS Stream
Generate playlist for on-demand streaming.

```bash
# Simple HLS with default settings
ffmpeg -i input.mp4 \
  -c:v libx264 -c:a aac \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8
```

**Key parameters:**
- `-hls_time` - Segment duration (seconds, default 2)
- `-hls_playlist_type` - `vod` (on-demand) or `event` (live)
- `-hls_segment_filename` - Naming pattern for segments

### Optimized HLS
Better quality and compatibility.

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset fast -crf 22 \
  -g 48 -sc_threshold 0 \
  -c:a aac -b:a 128k \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8
```

**Parameters explained:**
- `-g 48` - Keyframe every 48 frames (2s @ 24fps)
- `-sc_threshold 0` - Disable scene detection (consistent segments)

### Multi-Bitrate HLS (Adaptive)
Create multiple quality levels for adaptive streaming.

```bash
ffmpeg -i input.mp4 \
  -map 0:v -map 0:a -map 0:v -map 0:a -map 0:v -map 0:a \
  -c:v libx264 -crf 22 -c:a aac -b:a 128k \
  -b:v:0 800k  -s:v:0 640x360   -maxrate:v:0 856k  -bufsize:v:0 1200k \
  -b:v:1 1400k -s:v:1 842x480   -maxrate:v:1 1498k -bufsize:v:1 2100k \
  -b:v:2 2800k -s:v:2 1280x720  -maxrate:v:2 2996k -bufsize:v:2 4200k \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -master_pl_name master.m3u8 \
  -f hls -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename "stream_%v/segment_%03d.ts" \
  stream_%v/playlist.m3u8
```

**Creates:**
- `master.m3u8` - Master playlist (entry point)
- `stream_0/playlist.m3u8` - 360p stream
- `stream_1/playlist.m3u8` - 480p stream
- `stream_2/playlist.m3u8` - 720p stream

### HLS with Encryption
Protect content with AES-128 encryption.

```bash
# Generate encryption key
openssl rand 16 > enc.key
echo "enc.key" > enc.keyinfo
echo "enc.key" >> enc.keyinfo
openssl rand -hex 16 >> enc.keyinfo

# Encode with encryption
ffmpeg -i input.mp4 \
  -c:v libx264 -c:a aac \
  -f hls -hls_time 6 \
  -hls_key_info_file enc.keyinfo \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8
```

## DASH (Dynamic Adaptive Streaming)

### Basic DASH
MPEG-DASH format for adaptive streaming.

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -c:a aac \
  -f dash -seg_duration 6 \
  -use_template 1 -use_timeline 1 \
  manifest.mpd
```

### Multi-Bitrate DASH
Multiple quality levels.

```bash
ffmpeg -i input.mp4 \
  -map 0:v -map 0:a -map 0:v -map 0:a \
  -c:v libx264 -c:a aac \
  -b:v:0 800k  -s:v:0 640x360 \
  -b:v:1 1400k -s:v:1 1280x720 \
  -b:a:0 128k -b:a:1 128k \
  -f dash -seg_duration 6 \
  -use_template 1 -use_timeline 1 \
  manifest.mpd
```

## RTMP Live Streaming

### Stream to Twitch
```bash
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k \
  -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

### Stream to YouTube
```bash
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset veryfast -maxrate 2500k -bufsize 5000k \
  -pix_fmt yuv420p -g 60 -c:a aac -b:a 128k \
  -f flv rtmp://a.rtmp.youtube.com/live2/STREAM_KEY
```

### Stream to Facebook
```bash
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k \
  -pix_fmt yuv420p -g 60 -c:a aac -b:a 128k \
  -f flv rtmps://live-api-s.facebook.com:443/rtmp/STREAM_KEY
```

### Custom RTMP Server
```bash
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -maxrate 2500k -bufsize 5000k \
  -pix_fmt yuv420p -g 50 \
  -c:a aac -b:a 128k -ar 44100 \
  -f flv rtmp://your-server.com/live/stream-key
```

## Screen Capture + Stream

### Linux (X11)
```bash
ffmpeg -f x11grab -s 1920x1080 -framerate 30 -i :0.0 \
  -f pulse -ac 2 -i default \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 44100 \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

### macOS (AVFoundation)
```bash
# List devices
ffmpeg -f avfoundation -list_devices true -i ""

# Capture and stream
ffmpeg -f avfoundation -framerate 30 -i "1:0" \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

### Windows (DirectShow)
```bash
ffmpeg -f dshow -i video="screen-capture-recorder":audio="Stereo Mix" \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -maxrate 750k -bufsize 3000k \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

## Thumbnail Generation

### Single Thumbnail
Extract frame at specific time.

```bash
# At 5 seconds
ffmpeg -ss 00:00:05 -i input.mp4 -vframes 1 -vf scale=320:-1 thumb.jpg

# At 10% duration
ffmpeg -ss $(ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 input.mp4 | \
  awk '{print $1*0.1}') -i input.mp4 -vframes 1 thumb.jpg
```

### Multiple Thumbnails
Generate thumbnails at intervals.

```bash
# One per minute
ffmpeg -i input.mp4 -vf fps=1/60,scale=320:-1 thumb_%03d.jpg

# One per 10 seconds
ffmpeg -i input.mp4 -vf fps=1/10,scale=320:-1 thumb_%03d.jpg

# First 10 frames
ffmpeg -i input.mp4 -vframes 10 -vf scale=320:-1 thumb_%02d.jpg
```

### Thumbnail Sprite Sheet
Create single image with multiple thumbnails.

```bash
# Generate frames
ffmpeg -i input.mp4 -vf fps=1/10,scale=160:90 frames/thumb_%03d.jpg

# Combine into sprite (requires ImageMagick)
montage frames/thumb_*.jpg -tile 5x -geometry +0+0 sprite.jpg
```

## Preview Generation

### Video Preview (Trailer)
Extract multiple short clips.

```bash
# Extract 3 segments
ffmpeg -i input.mp4 \
  -ss 00:00:30 -t 00:00:10 -c copy segment1.mp4
ffmpeg -i input.mp4 \
  -ss 00:05:00 -t 00:00:10 -c copy segment2.mp4
ffmpeg -i input.mp4 \
  -ss 00:10:00 -t 00:00:10 -c copy segment3.mp4

# Concatenate segments
echo "file 'segment1.mp4'" > concat.txt
echo "file 'segment2.mp4'" >> concat.txt
echo "file 'segment3.mp4'" >> concat.txt
ffmpeg -f concat -safe 0 -i concat.txt -c copy preview.mp4
```

### Fast Preview (Low Quality)
Quick preview for review.

```bash
ffmpeg -i input.mp4 \
  -vf scale=640:-1 \
  -c:v libx264 -preset ultrafast -crf 28 \
  -c:a aac -b:a 64k \
  preview.mp4
```

## Streaming Parameters

### Important RTMP Parameters

**Real-time reading:**
- `-re` - Read input at native frame rate

**Low latency:**
- `-tune zerolatency` - Optimize for minimal latency
- `-preset ultrafast` or `veryfast` - Fast encoding

**Keyframes:**
- `-g 50` - Keyframe interval (GOP size)
- Recommended: 2 seconds (fps * 2)

**Rate control:**
- `-maxrate` - Maximum bitrate (e.g., 3000k)
- `-bufsize` - Buffer size (typically 2x maxrate)

**Compatibility:**
- `-pix_fmt yuv420p` - Compatible pixel format

### Bitrate Recommendations

**1080p 60fps:**
- 4500-6000 kbps video
- 160 kbps audio

**1080p 30fps:**
- 3000-4500 kbps video
- 128 kbps audio

**720p 60fps:**
- 2500-4000 kbps video
- 128 kbps audio

**720p 30fps:**
- 1500-2500 kbps video
- 128 kbps audio

**480p:**
- 500-1000 kbps video
- 128 kbps audio

## UDP/RTP Streaming

### UDP Stream
Simple network streaming.

```bash
# Sender
ffmpeg -re -i input.mp4 -c copy -f mpegts udp://192.168.1.100:1234

# Receiver
ffplay udp://192.168.1.100:1234
```

### RTP Stream
Real-Time Protocol for low latency.

```bash
# Audio only
ffmpeg -re -i audio.mp3 -c:a libopus -f rtp rtp://192.168.1.100:5004

# Video + audio
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset ultrafast \
  -c:a aac -f rtp rtp://192.168.1.100:5004
```

### Multicast Stream
Stream to multiple receivers.

```bash
# Sender (multicast address)
ffmpeg -re -i input.mp4 -c copy -f mpegts udp://239.255.0.1:1234

# Receiver
ffplay udp://239.255.0.1:1234
```

## Advanced Streaming

### Hardware-Accelerated Streaming
Use GPU for faster encoding.

```bash
# NVIDIA NVENC
ffmpeg -re -i input.mp4 \
  -c:v h264_nvenc -preset fast -maxrate 3000k -bufsize 6000k \
  -c:a aac -b:a 128k \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY

# Intel QSV
ffmpeg -re -hwaccel qsv -i input.mp4 \
  -c:v h264_qsv -preset fast -maxrate 3000k -bufsize 6000k \
  -c:a aac -b:a 128k \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

### Stream with Overlay
Add graphics during stream.

```bash
ffmpeg -re -i input.mp4 -i logo.png \
  -filter_complex "[0:v][1:v]overlay=10:10" \
  -c:v libx264 -preset veryfast -maxrate 3000k \
  -c:a copy \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

### Loop Stream
Continuously loop video for 24/7 stream.

```bash
ffmpeg -stream_loop -1 -re -i input.mp4 \
  -c:v libx264 -preset veryfast -maxrate 2500k \
  -c:a aac -b:a 128k \
  -f flv rtmp://live.twitch.tv/app/STREAM_KEY
```

## Troubleshooting

### Buffering Issues
```bash
# Reduce buffer size
ffmpeg -re -i input.mp4 -maxrate 2000k -bufsize 2000k -c:v libx264 -f flv rtmp://...

# Use faster preset
ffmpeg -re -i input.mp4 -preset ultrafast -c:v libx264 -f flv rtmp://...
```

### Audio/Video Desync
```bash
# Force constant frame rate
ffmpeg -re -i input.mp4 -r 30 -c:v libx264 -f flv rtmp://...

# Use -vsync 1
ffmpeg -re -i input.mp4 -vsync 1 -c:v libx264 -f flv rtmp://...
```

### Connection Drops
```bash
# Increase timeout
ffmpeg -timeout 5000000 -re -i input.mp4 -c:v libx264 -f flv rtmp://...

# Reconnect on failure (use wrapper script)
while true; do
  ffmpeg -re -i input.mp4 -c:v libx264 -f flv rtmp://...
  sleep 5
done
```
