# Excalidraw JSON Schema

## Element Types

| Type        | Use For                              |
| ----------- | ------------------------------------ |
| `rectangle` | Processes, actions, components       |
| `ellipse`   | Entry/exit points, external systems  |
| `diamond`   | Decisions, conditionals              |
| `arrow`     | Connections between shapes           |
| `text`      | Labels (standalone or inside shapes) |
| `line`      | Structural lines (not arrows)        |
| `frame`     | Grouping containers                  |

## Common Properties

| Property          | Type   | Description                        |
| ----------------- | ------ | ---------------------------------- |
| `id`              | string | Unique identifier                  |
| `type`            | string | Element type                       |
| `x`, `y`          | number | Position in pixels                 |
| `width`, `height` | number | Size in pixels                     |
| `strokeColor`     | string | Border color (hex)                 |
| `backgroundColor` | string | Fill color (hex or "transparent")  |
| `fillStyle`       | string | "solid", "hachure", "cross-hatch"  |
| `strokeWidth`     | number | 1, 2, or 4                         |
| `strokeStyle`     | string | "solid", "dashed", "dotted"        |
| `roughness`       | number | 0 (smooth), 1 (default), 2 (rough) |
| `opacity`         | number | 0-100                              |
| `seed`            | number | Random seed for roughness          |

## Text-Specific

| Property        | Description                                |
| --------------- | ------------------------------------------ |
| `text`          | Display text                               |
| `originalText`  | Same as text                               |
| `fontSize`      | Size in pixels (16-20 recommended)         |
| `fontFamily`    | 3 for monospace (always use this)          |
| `textAlign`     | "left", "center", "right"                  |
| `verticalAlign` | "top", "middle", "bottom"                  |
| `containerId`   | ID of parent shape (null if free-floating) |
| `lineHeight`    | 1.25 (default)                             |

## Arrow-Specific

| Property         | Description                             |
| ---------------- | --------------------------------------- |
| `points`         | Array of [x, y] coordinates             |
| `startBinding`   | Connection to start shape               |
| `endBinding`     | Connection to end shape                 |
| `startArrowhead` | null, "arrow", "bar", "dot", "triangle" |
| `endArrowhead`   | null, "arrow", "bar", "dot", "triangle" |

## Binding Format

```json
{
  "elementId": "shapeId",
  "focus": 0,
  "gap": 2
}
```

## Rectangle Roundness

```json
"roundness": { "type": 3 }
```

## File Wrapper

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
