---
name: excalidraw
description: >-
  Create Excalidraw diagrams — architecture, data flow, workflows, system design.
  Use when user wants to visualize, diagram, draw architecture, show data flow,
  create flowcharts, map components, or export .excalidraw files to PNG/SVG.
  Supports two modes: live MCP canvas (real-time) or file-based JSON + Playwright
  rendering. Also supports zero-config codebase auto-diagramming — just say
  "diagram this repo" or "visualize the architecture".
user-invocable: true
when_to_use: "Invoke for editable canvas diagrams or codebase visual maps."
category: dev-tools
keywords: [diagrams, architecture, flowcharts, whiteboard, SVG]
metadata:
  author: claudekit
  version: "1.2.0"
---

# Excalidraw Diagram Skill

Generate diagrams that **argue visually** — shapes mirror meaning, not just labeled boxes.

## Mode Detection (Do This First)

This skill supports two rendering backends. Detect which is available:

**Mode A — MCP Canvas (preferred):** Test with `mcp__excalidraw__read_diagram_guide()`.
If it works, use MCP tools for live canvas editing. See `references/mcp-workflow.md`.

**Mode B — File-based (fallback):** Generate `.excalidraw` JSON files, render to PNG
via Playwright. No server needed. See `references/file-workflow.md`.

If neither is set up, guide the user through setup (see respective workflow files).

---

## Core Philosophy

**Diagrams should ARGUE, not DISPLAY.**

- **Isomorphism Test**: Remove all text — does the structure alone communicate the concept?
- **Education Test**: Could someone learn something concrete, or does it just label boxes?
- **Container Test**: Could any boxed element work as free-floating text? If yes, remove the box.

Default to free-floating text. Add containers only when shapes carry meaning.
Aim for <30% of text elements inside containers.

---

## Design Process (Before Generating Anything)

### Step 0: Assess Depth

| Simple/Conceptual                      | Comprehensive/Technical                     |
| -------------------------------------- | ------------------------------------------- |
| Abstract shapes, labels, relationships | Concrete examples, code snippets, real data |
| Mental models, philosophies            | Systems, architectures, tutorials           |
| ~30 seconds to explain                 | ~2-3 minutes of teaching                    |

**For technical diagrams**: Research actual specs, event names, APIs before drawing.
Include evidence artifacts. See `references/design-methodology.md`.

### Step 1: Map Concepts to Visual Patterns

| Concept behavior            | Pattern                                  |
| --------------------------- | ---------------------------------------- |
| Spawns multiple outputs     | **Fan-out** (radial arrows)              |
| Combines inputs into one    | **Convergence** (funnel)                 |
| Has hierarchy/nesting       | **Tree** (lines + text, no boxes)        |
| Sequence of steps           | **Timeline** (line + dots + labels)      |
| Loops/improves continuously | **Spiral/Cycle**                         |
| Abstract state/context      | **Cloud** (overlapping ellipses)         |
| Transforms input→output     | **Assembly line** (before→process→after) |
| Compares two things         | **Side-by-side**                         |
| Separates into phases       | **Gap/Break**                            |

Each major concept should use a **different** visual pattern — no uniform card grids.

### Step 2: Plan Layout

Guide the eye: typically left→right or top→bottom. Important elements get more whitespace.

### Step 3: Generate & Validate

Follow the workflow for your active mode (MCP or file-based).

---

## Auto-Diagram (Zero-Config Codebase Analysis)

When user says "diagram this repo", "visualize the architecture", or "auto diagram":

Follow the full pipeline in `references/auto-diagram-guide.md`:

1. **Detect** project type and framework
2. **Discover** components (max 15 tool calls)
3. **Map** connections (max 10 tool calls)
4. **Verify** with user before drawing
5. **Select** layout pattern
6. **Generate** diagram using active mode

**Limits**: Max 12 components, 20 arrows per diagram. Group if more found.

---

## Color Quick Reference

Pull colors from `references/color-palette.md` (single source of truth).

| Role         | Background | Stroke    |
| ------------ | ---------- | --------- |
| Frontend/UI  | `#a5d8ff`  | `#1971c2` |
| Backend/API  | `#d0bfff`  | `#7048e8` |
| Database     | `#b2f2bb`  | `#2f9e44` |
| Storage      | `#ffec99`  | `#f08c00` |
| AI/ML        | `#e599f7`  | `#9c36b5` |
| External API | `#ffc9c9`  | `#e03131` |
| Queue/Event  | `#fff3bf`  | `#fab005` |
| Cache        | `#ffe8cc`  | `#fd7e14` |
| Decision     | `#ffd8a8`  | `#e8590c` |
| Zone/Group   | `#e9ecef`  | `#868e96` |

**Rule**: Same-role shapes get same colors. Max 3-4 fill colors per diagram.

---

## Shape Reference

| Concept              | Shape                     | Why                    |
| -------------------- | ------------------------- | ---------------------- |
| Labels, descriptions | **none** (free text)      | Typography = hierarchy |
| Timeline markers     | small `ellipse` (10-20px) | Anchor, not container  |
| Start/trigger/input  | `ellipse`                 | Soft, origin-like      |
| Decision/condition   | `diamond`                 | Classic decision       |
| Process/action/step  | `rectangle`               | Contained action       |
| Abstract state       | overlapping `ellipse`     | Cloud-like             |

---

## Sizing Rules

**Err on the side of too much space.** Tight spacing is the #1 mistake.

| Property               | Value                   |
| ---------------------- | ----------------------- |
| Box width              | 200-240px               |
| Box height             | 120-160px               |
| Gap (labeled arrows)   | **150-200px**           |
| Gap (unlabeled arrows) | 100-120px               |
| Row spacing            | 280-350px               |
| Font (labels)          | 16px                    |
| Font (titles)          | 20-24px                 |
| Zone opacity           | 25-40                   |
| Zone padding           | 50-60px around children |

---

## Modern Aesthetics

- `roughness: 0` for clean/modern (default), `1` for hand-drawn
- `strokeWidth: 2` standard, `1` subtle, `3` emphasis
- `opacity: 100` always — use color/size for hierarchy, not transparency
- `fontFamily: 3` (monospace)
- Arrow labels: `strokeStyle: "dashed"` for async, `"dotted"` for weak deps

---

## Self-Critique Loop (Both Modes)

After generating, validate before presenting:

1. **Render/screenshot** — view the actual output
2. **Audit vs. vision** — does structure match the planned design?
3. **Check defects** — overlaps, clipped text, misrouted arrows, uneven spacing
4. **Fix** — adjust coordinates, widen containers, reroute arrows
5. **Re-render** — repeat until clean (typically 2-4 iterations, max 2 for MCP)

**Stop when**: no clipped text, arrows connect correctly, spacing consistent, balanced composition.

---

## Quality Checklist

- [ ] Research done (for technical diagrams)
- [ ] Evidence artifacts included (code snippets, real data)
- [ ] Multi-zoom: summary + sections + detail
- [ ] Each concept uses different visual pattern
- [ ] Minimal containers (<30% text in boxes)
- [ ] Lines as structure for trees/timelines
- [ ] All relationships have arrows
- [ ] Clear visual flow path
- [ ] `roughness: 0`, `opacity: 100`, `fontFamily: 3`
- [ ] Rendered and visually validated
- [ ] No overlapping/clipped elements
- [ ] Balanced composition

---

## References (Load As Needed)

| File                               | Content                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `references/design-methodology.md` | Deep design philosophy, evidence artifacts, multi-zoom, large diagram strategy |
| `references/mcp-workflow.md`       | MCP canvas tools, batch creation, examples, self-critique                      |
| `references/file-workflow.md`      | JSON generation, section-by-section, render script usage                       |
| `references/auto-diagram-guide.md` | Zero-config codebase analysis pipeline                                         |
| `references/color-palette.md`      | All colors: semantic, platform (AWS/Azure/GCP/K8s), text hierarchy             |
| `references/element-templates.md`  | Copy-paste JSON templates for file-based mode                                  |
| `references/json-schema.md`        | Excalidraw JSON format reference                                               |

For universal SVG layout rules (component spacing, arrow routing, label placement, z-index ordering, anti-pattern catalog) that apply across any rendered SVG output, see `/ck:tech-graph`'s `references/svg-layout-best-practices.md`. Useful when reviewing exported Excalidraw SVGs for collisions or unreadable labels.
