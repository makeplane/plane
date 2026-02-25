---
description: ⚡⚡⚡⚡⚡ Bootstrap project with parallel execution
argument-hint: [user-requirements]
---

**Ultrathink parallel** to bootstrap: <user-requirements>$ARGUMENTS</user-requirements>

**IMPORTANT:** Activate needed skills. Ensure token efficiency. Sacrifice grammar for concision.
**YAGNI, KISS, DRY** principles apply.

## Workflow

### 1. Git Init
- Check if Git initialized, if not: use `git-manager` (main branch)

### 2. Research
- Use max 2 `researcher` agents in parallel
- Explore requirements, validation, challenges, solutions
- Keep reports ≤150 lines

### 3. Tech Stack
- Use `planner` + multiple `researcher` agents in parallel for best fit tech stack
- Write to `./docs` directory (≤150 lines)

### 4. Wireframe & Design
- Use `ui-ux-designer` + `researcher` agents in parallel
- Research: style, trends, fonts, colors, spacing, positions
- Describe assets for `ai-multimodal` generation
- Create design guidelines at `./docs/design-guidelines.md`
- Generate wireframes HTML at `./docs/wireframe`
- Generate logo with `ai-multimodal` if needed
- Screenshot with `chrome-devtools` → save to `./docs/wireframes/`
- Ask user to approve (repeat if rejected)

### 5. Parallel Planning & Implementation
- Trigger `/plan:parallel <detailed-instruction>` for parallel-executable plan
- Read `plan.md` for dependency graph and execution strategy
- Launch multiple `fullstack-developer` agents in PARALLEL for concurrent phases
  - Pass: phase file path, environment info
- Use `ui-ux-designer` for frontend (generate/analyze assets with `ai-multimodal`, edit with `imagemagick`)
- Run type checking after implementation

### 6. Testing
- Write real tests (NO fake data/mocks)
- Use `tester` subagent
- If fail: `debugger` → fix → repeat

### 7. Code Review
- Use `code-reviewer`
- If critical: fix → retest → repeat

### 8. Documentation
- Use `docs-manager` to create/update:
  - `./docs/README.md` (≤300 lines)
  - `./docs/project-overview-pdr.md`
  - `./docs/code-standards.md`
  - `./docs/system-architecture.md`
- Use `project-manager` for `./docs/project-roadmap.md`

### 9. Onboarding
- Guide user to get started (1 question at a time)
- Help configure (API keys, env vars, etc.)

### 10. Final Report
- Summary, guide, next steps
- Ask to commit (use `git-manager` if yes)
