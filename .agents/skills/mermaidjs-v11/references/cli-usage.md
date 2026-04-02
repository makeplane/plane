# Mermaid.js CLI Usage

Command-line interface for converting Mermaid diagrams to SVG/PNG/PDF.

## Installation

**Global Install:**
```bash
npm install -g @mermaid-js/mermaid-cli
```

**Local Install:**
```bash
npm install @mermaid-js/mermaid-cli
./node_modules/.bin/mmdc -h
```

**No Install (npx):**
```bash
npx -p @mermaid-js/mermaid-cli mmdc -h
```

**Docker:**
```bash
docker pull ghcr.io/mermaid-js/mermaid-cli/mermaid-cli
```

**Requirements:** Node.js ^18.19 || >=20.0

## Basic Commands

**Convert to SVG:**
```bash
mmdc -i input.mmd -o output.svg
```

**Convert to PNG:**
```bash
mmdc -i input.mmd -o output.png
```

**Convert to PDF:**
```bash
mmdc -i input.mmd -o output.pdf
```

Output format determined by file extension.

## CLI Flags

**Core Options:**
- `-i, --input <file>` - Input file (use `-` for stdin)
- `-o, --output <file>` - Output file path
- `-t, --theme <name>` - Theme: default, dark, forest, neutral
- `-b, --background <color>` - Background: transparent, white, #hex
- `--cssFile <file>` - Custom CSS for styling
- `--configFile <file>` - Mermaid configuration file
- `-h, --help` - Show all options

**Example with All Options:**
```bash
mmdc -i diagram.mmd -o output.png \
  -t dark \
  -b transparent \
  --cssFile custom.css \
  --configFile mermaid-config.json
```

## Advanced Usage

**Stdin Piping:**
```bash
cat diagram.mmd | mmdc --input - -o output.svg

# Or inline
cat << EOF | mmdc --input - -o output.svg
graph TD
  A[Start] --> B[End]
EOF
```

**Batch Processing:**
```bash
for file in *.mmd; do
  mmdc -i "$file" -o "${file%.mmd}.svg"
done
```

**Markdown Files:**
Process markdown with embedded diagrams:
```bash
mmdc -i README.template.md -o README.md
```

## Docker Workflows

**Basic Docker Usage:**
```bash
docker run --rm \
  -u $(id -u):$(id -g) \
  -v /path/to/diagrams:/data \
  ghcr.io/mermaid-js/mermaid-cli/mermaid-cli \
  -i diagram.mmd -o output.svg
```

**Mount Working Directory:**
```bash
docker run --rm -v $(pwd):/data \
  ghcr.io/mermaid-js/mermaid-cli/mermaid-cli \
  -i /data/input.mmd -o /data/output.png
```

**Podman (with SELinux):**
```bash
podman run --userns keep-id --user ${UID} \
  --rm -v /path/to/diagrams:/data:z \
  ghcr.io/mermaid-js/mermaid-cli/mermaid-cli \
  -i diagram.mmd
```

## Configuration Files

**Mermaid Config (JSON):**
```json
{
  "theme": "dark",
  "look": "handDrawn",
  "fontFamily": "Arial",
  "flowchart": {
    "curve": "basis"
  }
}
```

**Usage:**
```bash
mmdc -i input.mmd --configFile config.json -o output.svg
```

**Custom CSS:**
```css
.node rect {
  fill: #f9f;
  stroke: #333;
}
.edgeLabel {
  background-color: white;
}
```

**Usage:**
```bash
mmdc -i input.mmd --cssFile styles.css -o output.svg
```

## Node.js API

**Programmatic Usage:**
```javascript
import { run } from '@mermaid-js/mermaid-cli';

await run('input.mmd', 'output.svg', {
  theme: 'dark',
  backgroundColor: 'transparent'
});
```

**With Options:**
```javascript
import { run } from '@mermaid-js/mermaid-cli';

await run('diagram.mmd', 'output.png', {
  theme: 'forest',
  backgroundColor: '#ffffff',
  cssFile: 'custom.css',
  configFile: 'config.json'
});
```

## Common Workflows

**Documentation Generation:**
```bash
# Convert all diagrams in docs/
find docs/ -name "*.mmd" -exec sh -c \
  'mmdc -i "$1" -o "${1%.mmd}.svg"' _ {} \;
```

**Styled Output:**
```bash
# Create dark-themed transparent diagrams
mmdc -i architecture.mmd -o arch.png \
  -t dark \
  -b transparent \
  --cssFile animations.css
```

**CI/CD Pipeline:**
```yaml
# GitHub Actions example
- name: Generate Diagrams
  run: |
    npm install -g @mermaid-js/mermaid-cli
    mmdc -i docs/diagram.mmd -o docs/diagram.svg
```

**Accessibility-Enhanced:**
```bash
# Diagrams with accTitle/accDescr preserved
mmdc -i accessible-diagram.mmd -o output.svg
```

## Troubleshooting

**Permission Issues (Docker):**
Use `-u $(id -u):$(id -g)` to match host user permissions.

**Large Diagrams:**
Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" mmdc -i large.mmd -o out.svg
```

**Validation:**
Check syntax before rendering:
```bash
mmdc -i diagram.mmd -o /dev/null || echo "Invalid syntax"
```
