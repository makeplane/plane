# Fast Workflow (`--fast`)

**Thinking level:** Think hard
**User gates:** None. Fully autonomous from start to finish.

## Step 1: Combined Research & Planning

All research happens in parallel, then feeds into planning:

**Parallel research batch** (spawn these simultaneously):
- 2 `researcher` subagents (max 5 sources each): explore request, validate idea, find solutions
- 2 `researcher` subagents (max 5 sources each): find best-fit tech stack
- 2 `researcher` subagents (max 5 sources each): research design style, trends, fonts, colors, spacing, positions
  - Predict Google Fonts name (NOT just Inter/Poppins)
  - Describe assets for `ck:ai-multimodal` generation

Keep all reports ≤150 lines.

## Step 2: Design

1. `ui-ux-designer` subagent analyzes research, creates:
   - Design guidelines at `./docs/design-guidelines.md`
   - Wireframes in HTML at `./docs/wireframe/`
2. If no logo provided: generate with `ck:ai-multimodal` skill
3. Screenshot wireframes with `ck:chrome-devtools` → save to `./docs/wireframes/`

**Image tools:** `ck:ai-multimodal` for generation/analysis, `imagemagick` for crop/resize, background removal tool as needed.

No user gate — proceed directly.

## Step 3: Planning

Activate **ck:plan** skill: `/ck:plan --fast <requirements>`
- Skip research (already done above)
- Read codebase docs → create plan directly
- Plan directory using `## Naming` pattern
- Overview at `plan.md` (<80 lines) + `phase-XX-*.md` files

No user gate — proceed to implementation.

## Step 4: Implementation → Final Report

Load `references/shared-phases.md` for remaining phases.

Activate **ck:cook** skill: `/ck:cook --auto <plan-path>`
- Skips all review gates (fast planning pairs with fast execution)
- Auto-approves if score≥9.5 and 0 critical issues
- Continues through all phases without stopping

**Note:** Fast mode uses `git-manager` to auto-commit (no push) at the end.
