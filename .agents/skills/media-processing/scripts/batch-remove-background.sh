#!/bin/bash
# Batch background removal script using RMBG CLI
# Usage: ./batch-remove-background.sh <input_dir> [output_dir] [model] [resolution]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
INPUT_DIR=""
OUTPUT_DIR=""
MODEL="modnet"
MAX_RESOLUTION="2048"

# Parse arguments
INPUT_DIR="$1"
if [ -n "$2" ]; then
    OUTPUT_DIR="$2"
fi
if [ -n "$3" ]; then
    MODEL="$3"
fi
if [ -n "$4" ]; then
    MAX_RESOLUTION="$4"
fi

# Validate input directory
if [ -z "$INPUT_DIR" ]; then
    echo -e "${RED}Error: Input directory is required${NC}"
    echo ""
    echo "Usage: $0 <input_dir> [output_dir] [model] [resolution]"
    echo ""
    echo "Arguments:"
    echo "  input_dir   Input directory with images (required)"
    echo "  output_dir  Output directory (default: input_dir/no-bg)"
    echo "  model       Model name: u2netp, modnet, briaai, isnet-anime, silueta, u2net-cloth (default: modnet)"
    echo "  resolution  Max resolution in pixels (default: 2048)"
    echo ""
    echo "Examples:"
    echo "  $0 ./photos"
    echo "  $0 ./photos ./output"
    echo "  $0 ./photos ./output briaai"
    echo "  $0 ./photos ./output briaai 4096"
    exit 1
fi

if [ ! -d "$INPUT_DIR" ]; then
    echo -e "${RED}Error: Input directory '$INPUT_DIR' not found${NC}"
    exit 1
fi

# Set default output directory
if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="$INPUT_DIR/no-bg"
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if rmbg-cli is installed
if ! command -v rmbg &> /dev/null; then
    echo -e "${YELLOW}Warning: rmbg-cli not found${NC}"
    echo "Installing rmbg-cli globally..."
    npm install -g rmbg-cli
    echo -e "${GREEN}✓ rmbg-cli installed${NC}"
fi

# Find all image files
IMAGE_FILES=$(find "$INPUT_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \))
TOTAL_FILES=$(echo "$IMAGE_FILES" | grep -v '^$' | wc -l | tr -d ' ')

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo -e "${YELLOW}Warning: No image files found in '$INPUT_DIR'${NC}"
    exit 0
fi

# Display configuration
echo -e "${GREEN}Batch Background Removal Configuration:${NC}"
echo "  Input Dir:  $INPUT_DIR"
echo "  Output Dir: $OUTPUT_DIR"
echo "  Model:      $MODEL"
echo "  Resolution: $MAX_RESOLUTION"
echo "  Total Files: $TOTAL_FILES"
echo ""

# Process each image
SUCCESS_COUNT=0
FAIL_COUNT=0
CURRENT=0

while IFS= read -r file; do
    [ -z "$file" ] && continue

    CURRENT=$((CURRENT + 1))
    BASENAME=$(basename "$file")
    OUTPUT_FILE="$OUTPUT_DIR/${BASENAME%.*}.png"

    echo -e "${BLUE}[$CURRENT/$TOTAL_FILES]${NC} Processing: $BASENAME"

    if rmbg "$file" -m "$MODEL" -o "$OUTPUT_FILE" -r "$MAX_RESOLUTION" 2>/dev/null; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "  ${GREEN}✓ Success${NC}"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo -e "  ${RED}✗ Failed${NC}"
    fi
done <<< "$IMAGE_FILES"

# Display summary
echo ""
echo -e "${GREEN}Batch Processing Complete${NC}"
echo "  Total:   $TOTAL_FILES files"
echo "  Success: $SUCCESS_COUNT files"
echo "  Failed:  $FAIL_COUNT files"
echo "  Output:  $OUTPUT_DIR"

if [ "$FAIL_COUNT" -gt 0 ]; then
    exit 1
fi
