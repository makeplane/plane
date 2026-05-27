# Design Methodology (Deep Guide)

## Research Mandate (Technical Diagrams)

**Before drawing anything technical, research actual specifications.**

If diagramming a protocol, API, or framework:

1. Look up actual JSON/data formats
2. Find real event names, method names, API endpoints
3. Understand how pieces actually connect
4. Use real terminology, not generic placeholders

Bad: "Protocol" -> "Frontend"
Good: "AG-UI streams events (RUN_STARTED, STATE_DELTA)" -> "CopilotKit renders via createA2UIMessageRenderer()"

---

## Evidence Artifacts

Concrete examples that prove accuracy and help viewers learn.

| Artifact Type      | When to Use              | How to Render                                  |
| ------------------ | ------------------------ | ---------------------------------------------- |
| Code snippets      | APIs, integrations       | Dark rect (`#1e293b`) + syntax-colored text    |
| Data/JSON examples | Schemas, payloads        | Dark rect (`#1e293b`) + green text (`#22c55e`) |
| Event sequences    | Protocols, workflows     | Timeline pattern (line + dots + labels)        |
| UI mockups         | Showing actual output    | Nested rectangles mimicking real UI            |
| Real input content | What goes IN to a system | Rectangle with sample content                  |
| API/method names   | Real function calls      | Actual names from docs                         |

**Key**: Show what things actually look like, not just what they're called.

---

## Multi-Zoom Architecture

Comprehensive diagrams operate at 3 zoom levels simultaneously:

### Level 1: Summary Flow

Simplified overview of the full pipeline. Often placed at top/bottom.
_Example_: `Input -> Processing -> Output`

### Level 2: Section Boundaries

Labeled regions grouping related components. Creates visual "rooms".
_Example_: Grouping by responsibility (Backend/Frontend), phase (Setup/Execution/Cleanup)

### Level 3: Detail Inside Sections

Evidence artifacts, code snippets, concrete examples within each section.
_Example_: Inside "Backend" section, show actual API response format.

**For comprehensive diagrams, include all three levels.**

---

## Large Diagram Strategy (Section-by-Section)

**For comprehensive diagrams, build JSON one section at a time.** Do NOT generate entire file in one pass — Claude Code has ~32k token output limit.

### Phase 1: Build Each Section

1. Create base file with JSON wrapper + first section
2. Add one section per edit — think carefully about layout and connections
3. Use descriptive string IDs (e.g., `"trigger_rect"`, `"arrow_fan_left"`)
4. Namespace seeds by section (section 1: 100xxx, section 2: 200xxx)
5. Update cross-section bindings as you go

### Phase 2: Review the Whole

- Cross-section arrows bound correctly on both ends?
- Overall spacing balanced?
- All IDs reference existing elements?

### Phase 3: Render & Validate

Run the render-view-fix loop.

### Section Boundaries

Plan around natural visual groupings:

- Section 1: Entry point / trigger
- Section 2: First decision or routing
- Section 3: Main content (hero section — largest)
- Section 4-N: Remaining phases, outputs

### What NOT to Do

- Don't generate entire diagram in one response (token limit, lower quality)
- Don't use a coding agent (insufficient context)
- Don't write a Python generator script (indirection makes debugging harder)

---

## Container vs. Free-Floating Text

| Use Container When...                    | Use Free-Floating Text When...     |
| ---------------------------------------- | ---------------------------------- |
| Focal point of a section                 | Label or description               |
| Needs visual grouping                    | Supporting detail or metadata      |
| Arrows connect to it                     | Describes something nearby         |
| Shape carries meaning (decision diamond) | Section title, annotation          |
| Represents a distinct "thing"            | Typography alone creates hierarchy |

**Typography as hierarchy**: 28px title doesn't need a rectangle around it.

---

## Layout Principles

### Hierarchy Through Scale

- **Hero**: 300x150 — visual anchor
- **Primary**: 180x90
- **Secondary**: 120x60
- **Small**: 60x40

### Whitespace = Importance

Most important element has 200px+ empty space around it.

### Flow Direction

Left->right or top->bottom for sequences, radial for hub-and-spoke.

### Connections Required

Position alone doesn't show relationships. Every relationship needs an arrow.

---

## Lines as Structure

Use lines (`type: "line"`, not arrows) as primary structural elements:

- **Timelines**: Line + small dots (10-20px ellipses) + free-floating labels
- **Tree structures**: Vertical trunk + horizontal branches + text labels (no boxes)
- **Dividers**: Thin dashed lines to separate sections
- **Flow spines**: Central line that elements relate to

Lines + free-floating text creates cleaner results than boxes + contained text.
