# RMBG - Background Removal CLI

Local AI-powered background removal tool. Repository: https://github.com/mrgoonie/rmbg

## Installation

```bash
npm install -g rmbg-cli
# or
pnpm install -g rmbg-cli
```

## Usage

```bash
# Basic usage (uses modnet model)
rmbg input.jpg

# Specify output path
rmbg input.jpg -o output.png

# Choose model
rmbg input.jpg -m briaai -o high-quality.png

# Set max resolution
rmbg image.jpg -r 4096 -o image-4k.png
```

## CLI Options

- `-o, --output <path>` - Output path (default: `input-no-bg.png`)
- `-m, --model <model>` - Model name (default: `modnet`)
- `-r, --max-resolution <n>` - Max resolution in pixels (default: `2048`)

## Available Models

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| `u2netp` | 4.5MB | ⚡⚡⚡ Fastest | Fair | Batch processing |
| `modnet` | 25MB | ⚡⚡ Fast | Good | Default, balanced |
| `briaai` | 44MB | ⚡ Slower | Excellent | High-quality |
| `isnet-anime` | 168MB | ⚡ Slower | Specialized | Anime/manga |
| `silueta` | 43MB | ⚡⚡⚡ Fast | Good | Portraits |
| `u2net-cloth` | 170MB | ⚡ Slower | Specialized | Fashion/clothing |

## Examples

```bash
# Fast processing
rmbg photo.jpg -m u2netp -o fast-result.png

# High quality output
rmbg photo.jpg -m briaai -r 4096 -o hq-result.png

# Batch processing
for img in *.jpg; do
  rmbg "$img" -m u2netp -o "output/${img%.jpg}.png"
done
```

## Notes

- Models download automatically on first use (~4-170MB depending on model)
- Cache location: `macOS: /var/folders/.../T/rmbg-cache/` | `Linux: /tmp/rmbg-cache/` | `Windows: %TEMP%\rmbg-cache\`
- Supported formats: JPEG, PNG, WebP
- Max file size: 50MB
