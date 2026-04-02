# Media Processing Scripts

Helper scripts for common media processing tasks.

## Background Removal Scripts

### remove-background.sh
Remove background from a single image using RMBG CLI.

```bash
# Basic usage
./remove-background.sh photo.jpg

# With specific model
./remove-background.sh photo.jpg briaai

# With custom output and resolution
./remove-background.sh photo.jpg briaai output.png 4096
```

**Arguments:**
- `input` - Input image file (required)
- `model` - Model name: u2netp, modnet, briaai, isnet-anime, silueta, u2net-cloth (default: modnet)
- `output` - Output file path (default: auto-generated)
- `resolution` - Max resolution in pixels (default: 2048)

### batch-remove-background.sh
Remove backgrounds from all images in a directory.

```bash
# Basic usage
./batch-remove-background.sh ./photos

# With custom output directory
./batch-remove-background.sh ./photos ./output

# With specific model and resolution
./batch-remove-background.sh ./photos ./output briaai 4096
```

**Arguments:**
- `input_dir` - Input directory with images (required)
- `output_dir` - Output directory (default: input_dir/no-bg)
- `model` - Model name (default: modnet)
- `resolution` - Max resolution in pixels (default: 2048)

### remove-bg-node.js
Node.js script for background removal with progress tracking.

```bash
# Basic usage
node remove-bg-node.js photo.jpg

# With options
node remove-bg-node.js photo.jpg -m briaai -o output.png -r 4096 -p
```

**Options:**
- `-o, --output <path>` - Output file path
- `-m, --model <name>` - Model: briaai, modnet, u2netp
- `-r, --resolution <n>` - Max resolution
- `-p, --progress` - Show progress

## Image Processing Scripts

### batch_resize.py
Batch resize images with various options.

```bash
python batch_resize.py -i ./input -o ./output -w 800 -h 600
```

## Video Processing Scripts

### video_optimize.py
Optimize videos for web with quality and size optimization.

```bash
python video_optimize.py -i input.mp4 -o output.mp4 --preset slow --crf 23
```

### media_convert.py
Convert media files between different formats.

```bash
python media_convert.py -i input.mkv -o output.mp4 --codec h264
```

## Requirements

### Shell Scripts
- Bash (macOS, Linux)
- rmbg-cli: `npm install -g rmbg-cli`
- FFmpeg: `brew install ffmpeg` or `apt-get install ffmpeg`
- ImageMagick: `brew install imagemagick` or `apt-get install imagemagick`

### Node.js Scripts
- Node.js 14+
- Dependencies: `npm install rmbg`

### Python Scripts
- Python 3.7+
- Dependencies: `pip install -r requirements.txt`

## Testing

Run tests:
```bash
cd tests
bash test_all.sh
```
