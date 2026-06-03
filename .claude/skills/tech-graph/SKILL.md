---
name: ck:tech-graph
description: >-
  Generate production-quality SVG+PNG technical diagrams — architecture, data
  flow, flowchart, sequence, agent/memory, or concept maps — across 7 visual
  styles. Use when user wants "generate diagram", "draw diagram", "visualize",
  "architecture diagram", "flowchart", or any system/flow they want illustrated.
  Pairs with /ck:preview --diagram for visual self-review and /ck:mermaidjs-v11
  for inline-doc diagrams; this skill is the publish-grade output mode.
user-invocable: true
when_to_use: "Invoke for publish-grade architecture or flow diagrams."
category: dev-tools
keywords: [diagrams, architecture, flowchart, sequence, svg, png, agent, memory, visualization]
argument-hint: "[diagram-type or system description]"
metadata:
  author: claudekit
  version: "1.0.0"
  attribution: "Vendored from fireworks-tech-graph by yizhiyanhua-ai (MIT)"
  license: MIT
  upstream: "github.com/yizhiyanhua-ai/fireworks-tech-graph"
  upstream_sha: "7b22cdd"
  imported_at: "2026-04-28"
---

# Tech Graph

Generate production-quality SVG technical diagrams exported as PNG via `rsvg-convert`.

> Vendored from upstream `fireworks-tech-graph` (yizhiyanhua-ai, MIT). System dep `librsvg` (provides `rsvg-convert`) is installed via `claude/skills/install.sh`. Do NOT use upstream's `npx skills add` instructions — this skill is part of the CK Engineer stack.

## Vendoring Notes

This skill is vendored — installation is handled by `claude/skills/install.sh` (no manual `npx skills add` step). The required system dependency `librsvg` (`rsvg-convert` binary) is installed automatically alongside FFmpeg/ImageMagick when `ck install` runs. Drift from upstream is tracked in `~/claudekit/.maintainer/external-sources.json` (Mode A entry) — see CLAUDE.md "External Source Drift Watcher" in the monorepo for the update procedure.

## Helper Scripts (Recommended)

Four helper scripts in `scripts/` directory provide stable SVG generation and validation:

### 1. `generate-diagram.sh` - Validate SVG + export PNG

```bash
./scripts/generate-diagram.sh -t architecture -s 1 -o ./output/arch.svg
```

- Validates an existing SVG file
- Exports PNG after validation
- Example: `./scripts/generate-diagram.sh -t architecture -s 1 -o ./output/arch.svg`

### 2. `generate-from-template.py` - Create starter SVG from template

```bash
python3 ./scripts/generate-from-template.py architecture ./output/arch.svg '{"title":"My Diagram","nodes":[],"arrows":[]}'
```

- Loads a built-in SVG template
- Renders nodes, arrows, and legend entries from JSON input
- Escapes text content to keep output XML-valid

### 3. `validate-svg.sh` - Validate SVG syntax

```bash
./scripts/validate-svg.sh <svg-file>
```

- Checks XML syntax
- Verifies tag balance
- Validates marker references
- Checks attribute completeness
- Validates path data

### 4. `test-all-styles.sh` - Batch test all styles

```bash
./scripts/test-all-styles.sh
```

- Tests multiple diagram sizes
- Validates all generated SVGs
- Generates test report

**When to use scripts:**

- Use scripts when generating complex SVGs to avoid syntax errors
- Scripts provide automatic validation and error reporting
- Recommended for production diagrams

**When to generate SVG directly:**

- Simple diagrams with few elements
- Quick prototypes
- When you need full control over SVG structure

## Workflow (Always Follow This Order)

1. **Classify** the diagram type (see Diagram Types below)
2. **Extract structure** — identify layers, nodes, edges, flows, and semantic groups from user description
3. **Plan layout** — apply the layout rules for the diagram type
4. **Load style reference** — always load `references/style-1-flat-icon.md` unless user specifies another; load the matching `references/style-N.md` for exact color tokens and SVG patterns
5. **Map nodes to shapes** — use Shape Vocabulary below
6. **Check icon needs** — load `references/icons.md` for known products
7. **Write SVG** with adaptive strategy (see SVG Generation Strategy below)
8. **Validate**: Run `rsvg-convert file.svg -o /dev/null 2>&1` to check syntax
9. **Export PNG**: `rsvg-convert -w 1920 file.svg -o file.png`
10. **Report** the generated file paths
11. **(Optional) Visual self-review** — if your runtime can read images, load the exported PNG back and inspect it. Syntactic validity does not guarantee visual correctness: arrows may cross through component interiors, labels may collide with lifelines or other labels, boxes may overlap, alt-frame text may sit on top of a message, or a legend may cover content. If you see any of these, revise the SVG and re-export; repeat until the rendered image is clean. Common fixes:
    - Route arrows through gaps between boxes, not through box interiors
    - Add background rects behind arrow labels (opacity 0.95, matching canvas color)
    - Widen inter-row/inter-column gutters so same-layer arrows have clear corridors
    - Collapse repeated cross-layer arrows into a single "delegates down" rail outside the content area
    - Move legend/notes out of any region where arrows or labels land
    - Increase viewBox height/width rather than packing elements tighter
      Skip this step silently if image reading is unavailable — do not guess.

## Diagram Types & Layout Rules

### Architecture Diagram

Nodes = services/components. Group into **horizontal layers** (top→bottom or left→right).

- Typical layers: Client → Gateway/LB → Services → Data/Storage
- Use `<rect>` dashed containers to group related services in the same layer
- Arrow direction follows data/request flow
- ViewBox: `0 0 960 600` standard, `0 0 960 800` for tall stacks

### Data Flow Diagram

Emphasizes **what data moves where**. Focus on data transformation.

- Label every arrow with the data type (e.g., "embeddings", "query", "context")
- Use wider arrows (`stroke-width: 2.5`) for primary data paths
- Dashed arrows for control/trigger flows
- Color arrows by data category (not just Agent/RAG — use semantics)

### Flowchart / Process Flow

Sequential decision/process steps.

- Top-to-bottom preferred; left-to-right for wide flows
- Diamond shapes for decisions, rounded rects for processes, parallelograms for I/O
- Keep node labels short (≤3 words); put detail in sub-labels
- Align nodes on a grid: x positions snap to 120px intervals, y to 80px

### Agent Architecture Diagram

Shows how an AI agent reasons, uses tools, and manages memory.
Key conceptual layers to always consider:

- **Input layer**: User, query, trigger
- **Agent core**: LLM, reasoning loop, planner
- **Memory layer**: Short-term (context window), Long-term (vector/graph DB), Episodic
- **Tool layer**: Tool calls, APIs, search, code execution
- **Output layer**: Response, action, side-effects
  Use cyclic arrows (loop arcs) to show iterative reasoning. Separate memory types visually.

### Memory Architecture Diagram (Mem0, MemGPT-style)

Specialized agent diagram focused on memory operations.

- Show memory **write path** and **read path** separately (different arrow colors)
- Memory tiers: Working Memory → Short-term → Long-term → External Store
- Label memory operations: `store()`, `retrieve()`, `forget()`, `consolidate()`
- Use stacked rects or layered cylinders for storage tiers

### Sequence Diagram

Time-ordered message exchanges between participants.

- Participants as vertical **lifelines** (top labels + vertical dashed lines)
- Messages as horizontal arrows between lifelines, top-to-bottom time order
- Activation boxes (thin filled rects on lifeline) show active processing
- Group with `<rect>` loop/alt frames with label in top-left corner
- ViewBox height = 80 + (num_messages × 50)

### Comparison / Feature Matrix

Side-by-side comparison of approaches, systems, or components.

- Column headers = systems, row headers = attributes
- Row height: 40px; column width: min 120px; header row height: 50px
- Checked cell: tinted background (e.g. `#dcfce7`) + `✓` checkmark; unsupported: `#f9fafb` fill
- Alternating row fills (`#f9fafb` / `#ffffff`) for readability
- Max readable columns: 5; beyond that, split into two diagrams

### Timeline / Gantt

Horizontal time axis showing durations, phases, and milestones.

- X-axis = time (weeks/months/quarters); Y-axis = items/tasks/phases
- Bars: rounded rects, colored by category, labeled inside or beside
- Milestone markers: diamond or filled circle at specific x position with label above
- ViewBox: `0 0 960 400` typical; wider for many time periods: `0 0 1200 400`

### Mind Map / Concept Map

Radial layout from central concept.

- Central node at `cx=480, cy=280`
- First-level branches: evenly distributed around center (360/N degrees)
- Second-level branches: branch off first-level at 30-45° offset
- Use curved `<path>` with cubic bezier for branches, not straight lines

### Class Diagram (UML)

Static structure showing classes, attributes, methods, and relationships.

- **Class box**: 3-compartment rect (name / attributes / methods), min width 160px
  - Top compartment: class name, bold, centered (abstract = _italic_)
  - Middle: attributes with visibility (`+` public, `-` private, `#` protected)
  - Bottom: method signatures, same visibility notation
- **Relationships**:
  - Inheritance (extends): solid line + hollow triangle arrowhead, child → parent
  - Implementation (interface): dashed line + hollow triangle, class → interface
  - Association: solid line + open arrowhead, label with multiplicity (1, 0.._, 1.._)
  - Aggregation: solid line + hollow diamond on container side
  - Composition: solid line + filled diamond on container side
  - Dependency: dashed line + open arrowhead
- **Interface**: `<<interface>>` stereotype above name, or circle/lollipop notation
- **Enum**: compartment rect with `<<enumeration>>` stereotype, values in bottom
- Layout: parent classes top, children below; interfaces to the left/right of implementors
- ViewBox: `0 0 960 600` standard; `0 0 960 800` for deep hierarchies

### Use Case Diagram (UML)

System functionality from user perspective.

- **Actor**: stick figure (circle head + body line) placed outside system boundary
  - Label below figure, 13-14px
  - Primary actors on left, secondary/supporting on right
- **Use case**: ellipse with label centered inside, min 140×60px
  - Keep names verb phrases: "Create Order", "Process Payment"
- **System boundary**: large rect with dashed border + system name in top-left
- **Relationships**:
  - Include: dashed arrow `<<include>>` from base to included use case
  - Extend: dashed arrow `<<extend>>` from extension to base use case
  - Generalization: solid line + hollow triangle (specialized → general)
- Layout: system boundary centered, actors outside, use cases inside
- ViewBox: `0 0 960 600` standard

### State Machine Diagram (UML)

Lifecycle states and transitions of an entity.

- **State**: rounded rect with state name, min 120×50px
  - Internal activities: small text `entry/ action`, `exit/ action`, `do/ activity`
  - **Initial state**: filled black circle (r=8), one outgoing arrow
  - **Final state**: filled circle (r=8) inside hollow circle (r=12)
  - **Choice**: small hollow diamond, guard labels on outgoing arrows `[condition]`
- **Transition**: arrow with optional label `event [guard] / action`
  - Guard conditions in square brackets
  - Actions after `/`
- **Composite/nested state**: larger rect containing sub-states, with name tab
- **Fork/join**: thick horizontal or vertical black bar (synchronization)
- Layout: initial state top-left, final state bottom-right, flow top-to-bottom
- ViewBox: `0 0 960 600` standard

### ER Diagram (Entity-Relationship)

Database schema and data relationships.

- **Entity**: rect with entity name in header (bold), attributes below
  - Primary key attribute: underlined
  - Foreign key: italic or marked with (FK)
  - Min width: 160px; attribute font-size: 12px
- **Relationship**: diamond shape on connecting line
  - Label inside diamond: "has", "belongs to", "enrolls in"
  - Cardinality labels near entity: `1`, `N`, `0..1`, `0..*`, `1..*`
- **Weak entity**: double-bordered rect with double diamond relationship
- **Associative entity**: diamond + rect hybrid (rect with diamond inside)
- Line style: solid for identifying relationships, dashed for non-identifying
- Layout: entities in 2-3 rows, relationships between related entities
- ViewBox: `0 0 960 600` standard; wider `0 0 1200 600` for many entities

### Network Topology

Physical or logical network infrastructure.

- **Devices**: icon-like rects or rounded rects
  - Router: circle with cross arrows
  - Switch: rect with arrow grid
  - Server: stacked rect (rack icon)
  - Firewall: brick-pattern rect or shield shape
  - Load Balancer: horizontal split rect with arrows
  - Cloud: cloud path (overlapping arcs)
- **Connections**: lines between device centers
  - Ethernet/wired: solid line, label bandwidth
  - Wireless: dashed line with WiFi symbol
  - VPN: dashed line with lock icon
- **Subnets/Zones**: dashed rect containers with zone label (DMZ, Internal, External)
- **Labels**: device hostname + IP below, 12-13px
- Layout: tiered top-to-bottom (Internet → Edge → Core → Access → Endpoints)
- ViewBox: `0 0 960 600` standard

## UML Coverage Map

Full mapping of UML 14 diagram types to supported diagram types:

| UML Diagram          | Supported As             | Notes                                 |
| -------------------- | ------------------------ | ------------------------------------- |
| Class                | Class Diagram            | Full UML notation                     |
| Component            | Architecture Diagram     | Use colored fills per component type  |
| Deployment           | Architecture Diagram     | Add node/instance labels              |
| Package              | Architecture Diagram     | Use dashed grouping containers        |
| Composite Structure  | Architecture Diagram     | Nested rects within components        |
| Object               | Class Diagram            | Instance boxes with underlined name   |
| Use Case             | Use Case Diagram         | Full actor/ellipse/relationship       |
| Activity             | Flowchart / Process Flow | Add fork/join bars                    |
| State Machine        | State Machine Diagram    | Full UML notation                     |
| Sequence             | Sequence Diagram         | Add alt/opt/loop frames               |
| Communication        | —                        | Approximate with Sequence (swap axes) |
| Timing               | Timeline                 | Adapt time axis                       |
| Interaction Overview | Flowchart                | Combine activity + sequence fragments |
| ER Diagram           | ER Diagram               | Chen/Crow's foot notation             |

## Shape Vocabulary

Map semantic concepts to consistent shapes across all diagram types:

| Concept              | Shape                                               | Notes                       |
| -------------------- | --------------------------------------------------- | --------------------------- |
| User / Human         | Circle + body path                                  | Stick figure or avatar      |
| LLM / Model          | Rounded rect with brain/spark icon or gradient fill | Use accent color            |
| Agent / Orchestrator | Hexagon or rounded rect with double border          | Signals "active controller" |
| Memory (short-term)  | Rounded rect, dashed border                         | Ephemeral = dashed          |
| Memory (long-term)   | Cylinder (database shape)                           | Persistent = solid cylinder |
| Vector Store         | Cylinder with grid lines inside                     | Add 3 horizontal lines      |
| Graph DB             | Circle cluster (3 overlapping circles)              |                             |
| Tool / Function      | Gear-like rect or rect with wrench icon             |                             |
| API / Gateway        | Hexagon (single border)                             |                             |
| Queue / Stream       | Horizontal tube (pipe shape)                        |                             |
| File / Document      | Folded-corner rect                                  |                             |
| Browser / UI         | Rect with 3-dot titlebar                            |                             |
| Decision             | Diamond                                             | Flowcharts only             |
| Process / Step       | Rounded rect                                        | Standard box                |
| External Service     | Rect with cloud icon or dashed border               |                             |
| Data / Artifact      | Parallelogram                                       | I/O in flowcharts           |

## Arrow Semantics

Always assign arrow meaning, not just color:

| Flow Type             | Color            | Stroke       | Dash  | Meaning                       |
| --------------------- | ---------------- | ------------ | ----- | ----------------------------- |
| Primary data flow     | blue `#2563eb`   | 2px solid    | none  | Main request/response path    |
| Control / trigger     | orange `#ea580c` | 1.5px solid  | none  | One system triggering another |
| Memory read           | green `#059669`  | 1.5px solid  | none  | Retrieval from store          |
| Memory write          | green `#059669`  | 1.5px        | `5,3` | Write/store operation         |
| Async / event         | gray `#6b7280`   | 1.5px        | `4,2` | Non-blocking, event-driven    |
| Embedding / transform | purple `#7c3aed` | 1px solid    | none  | Data transformation           |
| Feedback / loop       | purple `#7c3aed` | 1.5px curved | none  | Iterative reasoning loop      |

Always include a **legend** when 2+ arrow types are used.

## Layout Rules & Validation

**Spacing**:

- Same-layer nodes: 80px horizontal, 120px vertical between layers
- Canvas margins: 40px minimum, 60px between node edges
- Snap to 8px grid: horizontal 120px intervals, vertical 120px intervals

**Arrow Labels** (CRITICAL):

- MUST have background rect: `<rect fill="canvas_bg" opacity="0.95"/>` with 4px horizontal, 2px vertical padding
- Place mid-arrow, ≤3 words, stagger by 15-20px when multiple arrows converge
- Maintain 10px safety distance from nodes

**Arrow Routing**:

- Prefer orthogonal (L-shaped) paths to minimize crossings
- Anchor arrows on component edges, not geometric centers
- Route around dense node clusters, use different y-offsets for parallel arrows
- Jump-over arcs (5px radius) for unavoidable crossings

**Line Overlap Prevention** (CRITICAL - most common bug on Codex):
When two arrows must cross each other, ALWAYS use jump-over arcs to prevent visual overlap:

- Crossing horizontal arrows: add a small semicircle arc (radius 5px, stroke same color as arrow, fill none) that "jumps over" the other line
- SVG pattern for jump-over: use a white/matching-background arc on the lower layer, then draw the upper arc on top
- Multiple crossings: stagger arc radii (5px, 7px, 9px) so arcs don't overlap each other
- Never let two arrows' straight-line segments cross without a jump-over arc

**Validation Checklist** (run before finalizing):

1. **Arrow-Component Collision**: Arrows MUST NOT pass through component interiors (route around with orthogonal paths)
2. **Text Overflow**: All text MUST fit with 8px padding (estimate: `text.length × 7px ≤ shape_width - 16px`)
3. **Arrow-Text Alignment**: Arrow endpoints MUST connect to shape edges (not floating); all arrow labels MUST have background rects
4. **Container Discipline**: Prefer arrows entering and leaving section containers through open gaps between components, not through inner component bodies

## SVG Technical Rules

- ViewBox: `0 0 960 600` default; `0 0 960 800` tall; `0 0 1200 600` wide
- Fonts: embed via `<style>font-family: ...</style>` — no external `@import` (breaks rsvg-convert)
- `<defs>`: arrow markers, gradients, filters, clip paths
- Text: minimum 12px, prefer 13-14px labels, 11px sub-labels, 16-18px titles
- All arrows: `<marker>` with `markerEnd`, sized `markerWidth="10" markerHeight="7"`
- Drop shadows: `<feDropShadow>` in `<filter>`, apply sparingly (key nodes only)
- Curved paths: use `M x1,y1 C cx1,cy1 cx2,cy2 x2,y2` cubic bezier for loops/feedback arrows
- Clip content: use `<clipPath>` if text might overflow a node box

## SVG Generation & Error Prevention

**MANDATORY: Python List Method** (ALWAYS use this):

```python
python3 << 'EOF'
lines = []
lines.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 700">')
lines.append('  <defs>')
# ... each line separately
lines.append('</svg>')

with open('/path/to/output.svg', 'w') as f:
    f.write('\n'.join(lines))
print("SVG generated successfully")
EOF
```

**Why mandatory**: Prevents character truncation, typos, and syntax errors. Each line is independent and easy to verify.

**Pre-Tool-Call Checklist** (CRITICAL - use EVERY time):

1. ✅ Can I write out the COMPLETE command/content right now?
2. ✅ Do I have ALL required parameters ready?
3. ✅ Have I checked for syntax errors in my prepared content?

**If ANY answer is NO**: STOP. Do NOT call the tool. Prepare the content first.

**Error Recovery Protocol**:

- **First error**: Analyze root cause, apply targeted fix
- **Second error**: Switch method entirely (Python list → chunked generation)
- **Third error**: STOP and report to user - do NOT loop endlessly
- **Never**: Retry the same failing command or call tools with empty parameters

**Validation** (run after generation):

```bash
rsvg-convert file.svg -o /tmp/test.png 2>&1 && echo "✓ Valid" && rm /tmp/test.png
```

**If using `generate-from-template.py`**:

- Prefer `source` / `target` node ids in arrow JSON so the generator can snap to node edges
- Keep `x1,y1,x2,y2` as hints or fallback coordinates, not the main routing primitive
- Let the generator choose orthogonal routes; avoid hardcoding center-to-center straight lines unless the path is guaranteed clear

**Common Syntax Errors to Avoid**:

- ❌ `yt-anchor` → ✅ `y="60" text-anchor="middle"`
- ❌ `x="390` (missing y) → ✅ `x="390" y="250"`
- ❌ `fill=#fff` → ✅ `fill="#ffffff"`
- ❌ `marker-end=` → ✅ `marker-end="url(#arrow)"`
- ❌ `L 29450` → ✅ `L 290,220`
- ❌ Missing `</svg>` at end

## Output

- **Default**: `./[derived-name].svg` and `./[derived-name].png` in current directory
- **Custom**: user specifies path with `--output /path/` or `输出到 /path/`
- **PNG export**: `rsvg-convert -w 1920 file.svg -o file.png` (1920px = 2x retina)

## Styles

| #   | Name                    | Background           | Best For                   |
| --- | ----------------------- | -------------------- | -------------------------- |
| 1   | **Flat Icon** (default) | White                | Blogs, docs, presentations |
| 2   | **Dark Terminal**       | `#0f0f1a`            | GitHub, dev articles       |
| 3   | **Blueprint**           | `#0a1628`            | Architecture docs          |
| 4   | **Notion Clean**        | White, minimal       | Notionnce                  |
| 5   | **Glassmorphism**       | Dark gradient        | Product sites, keynotes    |
| 6   | **Claude Official**     | Warm cream `#f8f6f3` | Anthropic-style diagrams   |
| 7   | **OpenAI Official**     | Pure white `#ffffff` | OpenAI-style diagrams      |

Load `references/style-N.md` for exact color tokens and SVG patterns.

## Style Selection

**Default**: Style 1 (Flat Icon) for most diagrams. Load `references/style-diagram-matrix.md` for detailed style-to-diagram-type recommendations.

These patterns appear frequently — internalize them:

**RAG Pipeline**: Query → Embed → VectorSearch → Retrieve → Augment → LLM → Response
**Agentic RAG**: adds Agent loop with Tool use between Query and LLM
**Agentic Search**: Query → Planner → [Search Tool / Calculator / Code] → Synthesizer → Response
**Mem0 / Memory Layer**: Input → Memory Manager → [Write: VectorDB + GraphDB] / [Read: Retrieve+Rank] → Context
**Agent Memory Types**: Sensory (raw input) → Working (context window) → Episodic (past interactions) → Semantic (facts) → Procedural (skills)
**Multi-Agent**: Orchestrator → [SubAgent A / SubAgent B / SubAgent C] → Aggregator → Output
**Tool Call Flow**: LLM → Tool Selector → Tool Execution → Result Parser → LLM (loop)
