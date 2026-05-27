# File-Based Workflow (Playwright Rendering)

Generate `.excalidraw` JSON files and render to PNG via headless Chromium.
No server needed — fully offline after initial setup.

## Setup

```bash
cd ~/.claude/skills/excalidraw/references
uv sync
uv run playwright install chromium
```

Requires: Python >=3.11, uv package manager.

---

## Workflow

### Step 1: Design (see SKILL.md + design-methodology.md)

Assess depth, map concepts to patterns, plan layout.

### Step 2: Generate JSON

Create `.excalidraw` file with this structure:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [...],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

For element JSON templates, see `element-templates.md`.
For JSON schema details, see `json-schema.md`.
For colors, see `color-palette.md`.

### Step 3: Large Diagrams — Section-by-Section

**Critical**: Build JSON one section at a time for large diagrams.
See `design-methodology.md` -> "Large Diagram Strategy".

1. Create base file with wrapper + first section
2. Add one section per edit
3. Use descriptive IDs: `"trigger_rect"`, `"arrow_fan_left"`
4. Namespace seeds by section (100xxx, 200xxx, etc.)
5. Update cross-section bindings as you go

### Step 4: Render to PNG

```bash
cd ~/.claude/skills/excalidraw/references && uv run python render_excalidraw.py <path-to-file.excalidraw>
```

Options:

- `--output path.png` — custom output path (default: same name .png)
- `--scale 2` — device scale factor (default: 2)
- `--width 1920` — max viewport width (default: 1920)

### Step 5: View & Validate

Use the **Read tool** on the PNG to view it. Then audit:

1. **Vision check**: Does structure match planned design?
2. **Defect check**: Text clipped? Overlaps? Misrouted arrows? Uneven spacing?
3. **Fix**: Edit JSON to address issues
4. **Re-render**: Repeat until clean (typically 2-4 iterations)

### When to Stop

- Rendered diagram matches conceptual design
- No clipped, overlapping, or unreadable text
- Arrows route cleanly to correct elements
- Consistent spacing and balanced composition

---

## Text Rules

The JSON `text` property contains ONLY readable words:

```json
{
  "id": "myElement1",
  "text": "Start",
  "originalText": "Start"
}
```

Settings: `fontSize: 16`, `fontFamily: 3`, `textAlign: "center"`, `verticalAlign: "middle"`

---

## Technical Constraints

- `fontFamily: 3` (monospace) always
- `opacity: 100` for all elements
- `roughness: 0` for modern (unless hand-drawn requested)
- `strokeWidth: 2` standard
- For arrow curves: use 3+ points in `points` array
- Rectangle rounded corners: `"roundness": {"type": 3}`
