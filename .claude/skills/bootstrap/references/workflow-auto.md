# Auto Workflow (`--auto`) — Default

**Thinking level:** Ultrathink
**User gates:** Design approval only. All other phases proceed automatically.

## Step 1: Research

Spawn multiple `researcher` subagents in parallel:
- Explore request, idea validation, challenges, best solutions
- Keep every report ≤150 lines

No user gate — proceed automatically.

## Step 2: Tech Stack

1. Use `planner` + multiple `researcher` subagents in parallel for best-fit stack
2. Write tech stack to `./docs` directory

No user gate — auto-select best option.

## Step 3: Wireframe & Design

1. Use `ui-ux-designer` + `researcher` subagents in parallel:
   - Research style, trends, fonts (predict Google Fonts name, NOT just Inter/Poppins), colors, spacing, positions
   - Describe assets for `ck:ai-multimodal` skill generation
2. `ui-ux-designer` creates:
   - Design guidelines at `./docs/design-guidelines.md`
   - Wireframes in HTML at `./docs/wireframe/`
3. If no logo provided: generate with `ck:ai-multimodal` skill
4. Screenshot wireframes with `ck:chrome-devtools` → save to `./docs/wireframes/`

**Gate:** Ask user to approve design. Repeat if rejected.

**Image tools:** `ck:ai-multimodal` for generation/analysis, `imagemagick` for crop/resize, background removal tool as needed.

## Step 4: Planning

Activate **ck:plan** skill: `/ck:plan --auto <requirements>`
- Planning skill auto-detects complexity and picks appropriate mode
- Creates plan directory using `## Naming` pattern
- Overview at `plan.md` (<80 lines) + `phase-XX-*.md` files

No user gate — proceed to implementation.

## Step 5: Implementation → Final Report

Load `references/shared-phases.md` for remaining phases.

Activate **ck:cook** skill: `/ck:cook --auto <plan-path>`
- Skips all review gates
- Auto-approves if score≥9.5 and 0 critical issues
- Continues through all phases without stopping
