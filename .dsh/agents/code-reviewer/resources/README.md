# resources/specialists/ — do not hand-edit

Every file in `specialists/` is a **mechanical mirror**, synced verbatim from `review-fix-technical-code`'s canonical checklists (`library/skills/review-fix-technical-code/sections/specialists/*.md` + `sections/design-checklist.md`) by `scripts/sync-code-reviewer-specialists.ps1`.

**Never edit a file in `specialists/` directly** — the next sync run will silently overwrite it with no warning, and the edit is lost. If a specialist checklist needs to change, edit it in `review-fix-technical-code`'s own `sections/specialists/` (or `sections/design-checklist.md`), then re-run:

```
powershell -File scripts/sync-code-reviewer-specialists.ps1
```

**That command only works from inside the Arsenal vault** (where `scripts/` and `review-fix-technical-code` both actually live) — if you're reading this from a *deployed* copy of `code-reviewer` inside some other project's `.claude/agents/code-reviewer/resources/`, the sync script isn't there and this folder is just a frozen snapshot from whenever it was last deployed. Go make the edit in the Arsenal vault itself, sync there, then redeploy (`/project-sync`) — don't try to run the sync command from inside a project.

This file itself lives in `resources/`, not `resources/specialists/`, so the sync script's own stale-file cleanup (which only touches `*.md` inside `specialists/`) never deletes it.

See `references.md` (sibling to this agent's `AGENT.md`) for the full rationale — this mirror exists so `code-reviewer` can dispatch the same specialist-domain checklists `review-fix-technical-code`'s `diff-analysis.md` does, without the two copies drifting apart the way an earlier version of `ship`/`review-fix-technical-code` once did.
