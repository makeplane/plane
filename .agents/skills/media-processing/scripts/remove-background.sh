#!/bin/bash
# Background removal script using RMBG CLI
# Usage: ./remove-background.sh <input> [model] [output] [resolution]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
INPUT=""
MODEL="modnet"
OUTPUT=""
MAX_RESOLUTION="2048"

# Parse arguments
INPUT="$1"
if [ -n "$2" ]; then
    MODEL="$2"
fi
if [ -n "$3" ]; then
    OUTPUT="$3"
fi
if [ -n "$4" ]; then
    MAX_RESOLUTION="$4"
fi

# Validate input
if [ -z "$INPUT" ]; then
    echo -e "${RED}Error: Input file is required${NC}"
    echo ""
    echo "Usage: $0 <input> [model] [output] [resolution]"
    echo ""
    echo "Arguments:"
    echo "  input       Input image file (required)"
    echo "  model       Model name: u2netp, modnet, briaai, isnet-anime, silueta, u2net-cloth (default: modnet)"
    echo "  output      Output file path (default: auto-generated)"
    echo "  resolution  Max resolution in pixels (default: 2048)"
    echo ""
    echo "Examples:"
    echo "  $0 photo.jpg"
    echo "  $0 photo.jpg briaai"
    echo "  $0 photo.jpg briaai output.png"
    echo "  $0 photo.jpg briaai output.png 4096"
    exit 1
fi

if [ ! -f "$INPUT" ]; then
    echo -e "${RED}Error: Input file '$INPUT' not found${NC}"
    exit 1
fi

# Check if rmbg-cli is installed
if ! command -v rmbg &> /dev/null; then
    echo -e "${YELLOW}Warning: rmbg-cli not found${NC}"
    echo "Installing rmbg-cli globally..."
    npm install -g rmbg-cli
    echo -e "${GREEN}✓ rmbg-cli installed${NC}"
fi

# Generate output filename if not provided
if [ -z "$OUTPUT" ]; then
    BASENAME=$(basename "$INPUT" | sed 's/\.[^.]*$//')
    OUTPUT="${BASENAME}-no-bg.png"
fi

# Display configuration
echo -e "${GREEN}Background Removal Configuration:${NC}"
echo "  Input:      $INPUT"
echo "  Model:      $MODEL"
echo "  Output:     $OUTPUT"
echo "  Resolution: $MAX_RESOLUTION"
echo ""

# Remove background
echo "Processing..."
rmbg "$INPUT" -m "$MODEL" -o "$OUTPUT" -r "$MAX_RESOLUTION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Background removed successfully${NC}"
    echo "  Output: $OUTPUT"

    # Display file sizes
    INPUT_SIZE=$(du -h "$INPUT" | cut -f1)
    OUTPUT_SIZE=$(du -h "$OUTPUT" | cut -f1)
    echo ""
    echo "File sizes:"
    echo "  Input:  $INPUT_SIZE"
    echo "  Output: $OUTPUT_SIZE"
else
    echo -e "${RED}✗ Background removal failed${NC}"
    exit 1
fi
