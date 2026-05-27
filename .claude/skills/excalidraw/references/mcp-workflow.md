# MCP Canvas Workflow

Live Excalidraw canvas via MCP tools. Canvas runs in browser, updates real-time.

## Setup

Canvas server must be running at `http://localhost:3000`.

**Option 1 — Docker:**

```bash
docker run -d -p 3000:3000 ghcr.io/yctimlin/mcp_excalidraw-canvas:latest
```

**Option 2 — From source:**

```bash
git clone https://github.com/yctimlin/mcp_excalidraw.git ~/.excalidraw-canvas
cd ~/.excalidraw-canvas && npm ci && npm run build
node dist/server.js &
```

Then open `http://localhost:3000` in browser.

**MCP config** (add to `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "excalidraw": {
      "command": "npx",
      "args": ["-y", "mcp-excalidraw-server"],
      "env": { "EXPRESS_SERVER_URL": "http://localhost:3000" }
    }
  }
}
```

---

## Core Tools

| Tool                    | Purpose                        | When               |
| ----------------------- | ------------------------------ | ------------------ |
| `read_diagram_guide`    | Color palette + sizing rules   | First call         |
| `batch_create_elements` | Create shapes + arrows at once | Main workhorse     |
| `get_canvas_screenshot` | Visual verification            | After every batch  |
| `clear_canvas`          | Wipe canvas                    | Before new diagram |
| `export_to_image`       | Save PNG/SVG                   | Final export       |

**Other tools**: `describe_scene`, `create_from_mermaid`, `export_scene`,
`set_viewport`, `export_to_excalidraw_url`, `query_elements`,
`snapshot_scene`, `restore_snapshot`, `update_element`, `delete_element`.

---

## Shape Syntax

```json
{
  "type": "rectangle",
  "id": "my-box",
  "x": 100,
  "y": 100,
  "width": 180,
  "height": 70,
  "backgroundColor": "#a5d8ff",
  "strokeColor": "#1971c2",
  "roughness": 0,
  "text": "My Service\nPort 8080"
}
```

- `text` puts label inside shape (MCP handles binding)
- `\n` for multi-line labels
- Shapes: `rectangle`, `ellipse`, `diamond`, `text` (standalone)

## Arrow Syntax

```json
{
  "type": "arrow",
  "x": 0,
  "y": 0,
  "startElementId": "my-box",
  "endElementId": "other-box",
  "strokeColor": "#1971c2",
  "text": "HTTP"
}
```

- Arrows auto-route to nearest edges — no edge point calculation needed
- `strokeStyle: "dashed"` for async, `"dotted"` for weak dependency

---

## Step-by-Step Workflow

### 1. Understand what to draw

Read codebase. Identify components, connections, layers.
**If sample provided**: preserve ALL text verbatim — sample is source of truth for content.

### 2. Read design guide

```
mcp__excalidraw__read_diagram_guide()
```

### 3. Clear and VERIFY canvas

```
mcp__excalidraw__clear_canvas()
mcp__excalidraw__get_canvas_screenshot()  // MUST verify empty
```

### 4. Plan layout mentally

```
Vertical flow (most common):
  Row 1 (y=0):    Zone backgrounds
  Row 2 (y=60):   Entry points
  Row 3 (y=350):  Middle layer
  Row 4 (y=650):  Data layer
  Columns: x = 40, 440, 840 (400px apart for labeled arrows)
```

### 5. Create everything in one batch

`batch_create_elements` with ALL elements at once.

**Order**: Zone backgrounds -> Shapes (with id) -> Arrows -> Standalone text

### 6. Self-critique loop

Skip for diagrams with <6 elements.

**6a.** Snapshot: `mcp__excalidraw__snapshot_scene()`

**6b.** Geometric validation via `query_elements({ type: "all" })`:

- Overlapping shapes? Move +200px
- Cramped spacing (<100px)? Shift apart
- Zone not wrapping children? Recalculate with 50px padding
- Unconnected shapes? Add missing arrow

**6c.** Visual validation via `get_canvas_screenshot()`:

- Arrow labels clipped? Increase gap to 200px+
- Text too small? Min 16px
- No title? Add at y = top - 60
- Off-center? `set_viewport({ scrollToContent: true })`

**6d.** Fix and re-check. Max 2 rounds. If fix made things worse, restore snapshot.

### 7. Present to user

```
mcp__excalidraw__set_viewport({ scrollToContent: true })
mcp__excalidraw__get_canvas_screenshot()
```

### 8. Export (if requested)

```
mcp__excalidraw__export_to_image({ format: "png", filePath: "output.png" })
mcp__excalidraw__export_scene({ filePath: "output.excalidraw" })
mcp__excalidraw__export_to_excalidraw_url()  // shareable link
```

---

## Complete Example: 3-Layer Architecture

```json
{
  "elements": [
    {
      "type": "rectangle",
      "id": "zone-fe",
      "x": 0,
      "y": 0,
      "width": 500,
      "height": 160,
      "backgroundColor": "#e9ecef",
      "strokeColor": "#868e96",
      "strokeStyle": "dashed",
      "opacity": 40,
      "roughness": 0
    },
    { "type": "text", "x": 10, "y": 10, "text": "Frontend Layer", "fontSize": 14, "strokeColor": "#868e96" },

    {
      "type": "rectangle",
      "id": "react-app",
      "x": 40,
      "y": 50,
      "width": 180,
      "height": 70,
      "backgroundColor": "#a5d8ff",
      "strokeColor": "#1971c2",
      "roughness": 0,
      "text": "React App\nFrontend"
    },
    {
      "type": "rectangle",
      "id": "api",
      "x": 40,
      "y": 250,
      "width": 180,
      "height": 70,
      "backgroundColor": "#d0bfff",
      "strokeColor": "#7048e8",
      "roughness": 0,
      "text": "API Server\nExpress.js"
    },
    {
      "type": "rectangle",
      "id": "db",
      "x": 280,
      "y": 250,
      "width": 180,
      "height": 70,
      "backgroundColor": "#b2f2bb",
      "strokeColor": "#2f9e44",
      "roughness": 0,
      "text": "PostgreSQL\nDatabase"
    },

    {
      "type": "arrow",
      "x": 130,
      "y": 120,
      "startElementId": "react-app",
      "endElementId": "api",
      "strokeColor": "#1971c2",
      "text": "REST API"
    },
    {
      "type": "arrow",
      "x": 220,
      "y": 285,
      "startElementId": "api",
      "endElementId": "db",
      "strokeColor": "#2f9e44",
      "text": "SQL"
    },

    { "type": "text", "x": 100, "y": -40, "text": "System Architecture", "fontSize": 24, "strokeColor": "#1e1e1e" }
  ]
}
```

---

## Common Mistakes

| Mistake                    | Fix                                                     |
| -------------------------- | ------------------------------------------------------- |
| Ghost elements after clear | Screenshot after clear, clear again if needed           |
| Arrows don't connect       | Use valid shape `id` in `startElementId`/`endElementId` |
| Shapes overlap             | Increase spacing (240px column gap, 140px row gap)      |
| Labels cut off             | Make boxes wider (200px+)                               |
| Too many colors            | Limit to 3-4 fill colors                                |
| Self-critique >2 rounds    | Stop, present, list remaining issues                    |
