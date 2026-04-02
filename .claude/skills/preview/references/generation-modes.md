# Generation Modes

## Step 1: Determine Output Location

1. Check if there's an active plan context (from `## Plan Context` in hook injection)
2. If active plan exists: save to `{plan_dir}/visuals/{topic-slug}.md`
3. If no active plan: save to `plans/visuals/{topic-slug}.md`
4. Create `visuals/` directory if it doesn't exist

## Step 2: Generate Content

**Mermaid Diagram Syntax:**
When generating mermaid code blocks, use `/ck:mermaidjs-v11` skill for v11 syntax rules.

**Essential rules (always apply):**
- Quote node text with special characters: `A["text with /slashes"]`
- Escape brackets in labels: `A["array[0]"]`

Use the appropriate template based on flag:

### --explain (Visual Explanation)
```markdown
# Visual Explanation: {topic}

## Overview
Brief description of what we're explaining.

## Quick View (ASCII)
[ASCII diagram of component relationships]

## Detailed Flow
[Mermaid sequence/flowchart diagram]

## Key Concepts
1. **Concept A** - Explanation
2. **Concept B** - Explanation

## Code Example (if applicable)
[Relevant code snippet with comments]
```

### --slides (Presentation Format)
```markdown
# {Topic} - Visual Presentation

---
## Slide 1: Introduction
- One concept per slide
- Bullet points only

---
## Slide 2: The Problem
[Mermaid flowchart]

---
## Slide 3: The Solution
- Key point 1
- Key point 2

---
## Slide 4: Summary
Key takeaways...
```

### --diagram (Focused Diagram)
```markdown
# Diagram: {topic}

## ASCII Version
[ASCII architecture diagram]

## Mermaid Version
[Mermaid flowchart/graph]
```

### --ascii (Terminal-Friendly Only)
```
[ASCII-only box diagram with legend]
```

## Step 3: Save and Preview

1. Write generated content to determined path
2. Start preview server with the generated file:
```bash
node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --file "<generated-file-path>" --host 0.0.0.0 --open --foreground
```

## Step 4: Report to User

Report:
- Generated file path
- Preview URL (local + network)
- Remind: file saved in plan's `visuals/` folder for future reference

---

## HTML Mode Generation

When `--html` flag is present (or implied by `--diff`, `--plan-review`, `--recap`), generate self-contained HTML instead of Markdown.

### HTML Step 1: Determine Output Location
- Same plan-aware logic as markdown mode but with `.html` extension
- Active plan: `{plan_dir}/visuals/{topic-slug}.html`
- No plan: `plans/visuals/{topic-slug}.html`
- Create `visuals/` directory if needed

### HTML Step 2: Read References
Always read `html-design-guidelines.md` first (anti-slop rules, style presets).

Then read mode-specific references:

| Mode | References | Templates to study |
|------|------------|-------------------|
| --html --explain | html-css-patterns.md, html-libraries.md | architecture.html |
| --html --diagram | html-css-patterns.md, html-libraries.md | mermaid-flowchart.html or architecture.html |
| --html --slides | html-slide-patterns.md, html-css-patterns.md, html-libraries.md | slide-deck.html |
| --html --diff | html-css-patterns.md, html-libraries.md | data-table.html, architecture.html |
| --html --plan-review | html-css-patterns.md, html-libraries.md | architecture.html, data-table.html |
| --html --recap | html-css-patterns.md, html-libraries.md | architecture.html, data-table.html |

For multi-section pages (explain, diff, plan-review, recap): also read `html-responsive-nav.md`.

### HTML Step 3: Generate Content

Follow the 4-phase workflow:

**Think:** Determine content-type routing:
- Mermaid for topology (flowcharts, sequence, ER, state, mind maps, class, C4)
- CSS Grid for text-heavy architecture (cards with descriptions, code references)
- HTML `<table>` for data (requirement audits, comparisons, matrices)
- Chart.js for real charts (KPI dashboards, sparklines)
- Hybrid for complex systems (15+ elements): simple Mermaid overview + detailed CSS Grid cards

**Structure:** Pick template pattern, plan sections, assign depth tiers (hero/elevated/default/recessed).

**Style:** Select font pairing + palette from curated presets. Vary from previous outputs. Apply anti-slop checks:
- No Inter/Roboto/system-ui alone as body font
- No indigo/violet (#8b5cf6, #7c3aed) as accent
- No animated glowing box-shadows
- No gradient text on headings
- No emoji icons in section headers
- No three-dot window chrome on code blocks

**Deliver:** Write single self-contained `.html` file — all CSS and JavaScript inline. External resources: CDN only (Google Fonts, Mermaid.js v11, Chart.js, anime.js).

**MANDATORY — Theme Toggle:** Every HTML page MUST include the light/dark theme toggle button from `html-css-patterns.md` → "Theme Toggle Button" section. This is non-negotiable. The toggle button (`<button class="theme-toggle">`) must be the first child of `<body>`, with its CSS and JS inlined. Pages without the toggle are considered incomplete.

For `--slides`: recommend invoking `/ck:ui-ux-pro-max` for richer style selection.
Must use `/ck:mermaidjs-v11` for any Mermaid diagrams.

### HTML Step 4: Open in Browser
- macOS: `open "{output-path}"`
- Linux: `xdg-open "{output-path}"`
- Windows: `start "{output-path}"`
- No server needed — file is self-contained
- Report file path and confirm browser opened

### Data Gathering for HTML-Only Modes

#### --diff [ref]
1. Detect scope: branch name → working tree diff; commit hash → `git show`; HEAD → uncommitted; PR number → `gh pr diff`; range → two commits; no arg → diff against main
2. Run: `git diff --stat`, `git diff --name-status`, line counts
3. Read all changed files + surrounding context
4. Scan new public API surface (grep exports, functions, classes, interfaces)
5. Check CHANGELOG.md, README.md, docs updates
6. Reconstruct decision rationale from commits/conversation/progress docs

#### --plan-review [plan-file]
1. Input: explicit plan file path OR detect from active plan context
2. Read plan in full (problem, changes, rejected alternatives, scope)
3. Read every file the plan references + their dependencies
4. Map blast radius (imports, tests, config, public API)
5. Cross-reference: plan assumptions vs actual code state

#### --recap [timeframe]
1. Parse time window: shorthand (2w, 30d, 3m) → git `--since` format; default 2w
2. Project identity: README, CHANGELOG, package.json, file structure
3. Recent activity: `git log --oneline --since=...`, `git shortlog`
4. Current state: `git status`, stale branches, TODOs, progress docs
5. Decision context: commit messages, plans, ADRs
6. Architecture scan: key files, module structure, frequently changed areas

### Quality Checklist
Before delivering HTML output, verify:
- [ ] **Squint test:** Visual hierarchy visible at arm's length?
- [ ] **Swap test:** Would this look AI-generated? Check against forbidden patterns
- [ ] **Theme toggle (MANDATORY):** Toggle button present as first child of `<body>`? Both light and dark modes render correctly? See `html-css-patterns.md` → "Theme Toggle Button".
- [ ] **Overflow:** No horizontal scroll on content (tables excepted, wrapped in scroll container)
- [ ] **Mermaid:** Zoom controls present? ELK layout for 10+ nodes?
- [ ] **Responsiveness:** Readable on mobile width?
