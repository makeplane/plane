---
phase: 7
title: "Documentation (+ EN/KO path)"
status: done
priority: P3
effort: "0.5d"
dependencies: [6]
---

# Phase 7: Documentation (+ EN/KO path)

## Overview

Document the content-as-code workflow so the team can maintain the guide, add screenshots, and add the
deferred EN/KO translations.

## Requirements

- Update `docs/help-center-authoring-guide.md`: add a "Content-as-code" section — where source lives
  (`fixtures/help_center/`), how to add a category/article (frontmatter + `.vi.md`), the screenshot
  placeholder + capture workflow, and the seed/inject command order.
- Update `docs/deployment-guide.md`: the per-instance run order (content seed → demo seed [staging only]
  → capture → inject); note images are captured-once-per-instance; no new extension prereqs.
- Update `docs/system-architecture.md`: note the content pipeline (MD→HTML→sanitize loader, screenshot
  asset injection) as part of the Help Center subsystem.
- **EN/KO path:** document that adding `<article>.en.md` / `<article>.ko.md` beside the VI file makes the
  loader seed those locales; until then the reader's locale-fallback shows VI. Keep terminology
  "Shinhan Workspace".

## Related Code Files

- Modify: `docs/help-center-authoring-guide.md`, `docs/deployment-guide.md`, `docs/system-architecture.md`
- Delegate: `docs-manager` (paths verified against final code)

## Implementation Steps

1. `docs-manager` updates the three docs with the content-as-code workflow + run order + EN/KO path.
2. No plan/phase/finding refs in shipped docs; "Shinhan Workspace" only.
3. PR notes: list the new commands (`seed_help_center` extended, `seed_help_demo_data`,
   `inject_help_screenshots`) + the capture tool.

## Success Criteria

- [ ] Authoring guide explains add-article + add-screenshot + add-EN/KO workflow
- [ ] Deployment guide has the exact per-instance command order; images captured-once noted
- [ ] System-architecture notes the content/screenshot pipeline
- [ ] No plan artifacts in shipped docs; "Shinhan Workspace" throughout

## Risk Assessment

- **Docs drift from final command names** → write after P5/P6 freeze the commands; verify paths.
- **EN/KO expectations** → clearly mark as deferred; fallback behavior documented so VI-only launch
  isn't perceived as a bug.
