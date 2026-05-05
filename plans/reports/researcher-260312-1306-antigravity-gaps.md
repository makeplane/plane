# Antigravity Rules Gap Analysis

**Report Date**: 2026-03-12 | **Scope**: `.agent/rules/` (18 files) vs `.claude/rules/` (24 files)

---

## Summary

Antigravity rules are outdated on **2 critical issues** and missing **3 essential rule sets** needed for modern development workflow. Focus areas: color token naming (P1), missing workflow/verification rules (P2), and new formatting standard (P3).

---

## P1 — Critical Contradictions (Must Fix Immediately)

| Rule File                      | Antigravity                                                      | Claude Code                                             | Impact                                                                    |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| **color-tokens.md**            | `text-color-*`, `border-color-*` (WITH infix)                    | `text-*`, `border-*` (NO infix)                         | Causes wrong CSS var generation & token misuse                            |
| **mobx-stores.md**             | `import { set } from "mobx"`                                     | `import { set } from "lodash-es"`                       | MobX's `set()` mutates observables incorrectly; lodash-es version is safe |
| **i18n-rules.md**              | Scope: `apps/web/**` + `apps/admin/**`                           | Scope: `apps/web` only (NOT admin)                      | Admin app has no i18n; Antigravity enforces wrong scope                   |
| **frontend-impl-checklist.md** | Check for legacy tokens: `text-tertiary` → `text-color-tertiary` | Check for NEW tokens: `text-tertiary` (legacy is WRONG) | Checklist enforces obsolete token style                                   |

---

## P2 — Missing Rule Sets (Essential for Workflow)

### Not in `.agent/rules/` but in `.claude/rules/`:

| Rule                          | Purpose                                                                       | Why Needed                                                                |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **development-rules.md**      | Post-implementation verification, ESLint typed linting, import style          | Prevents broken code merge; catches unsafe `any`, floating promises       |
| **primary-workflow.md**       | Orchestration pipeline: planner → research → implement → test → review → docs | Single-agent .agent/ has no workflow — Claude Code delegates to subagents |
| **orchestration-protocol.md** | Task delegation context (paths, reports, plans)                               | Not applicable to single-agent Antigravity — can be ignored               |

### New in `.claude/rules/` without `.agent/` equivalents:

| Rule                       | Scope         | Content                                                            |
| -------------------------- | ------------- | ------------------------------------------------------------------ |
| **backend-testing.md**     | `apps/api/**` | Test runner commands, markers (`-u`, `-c`, `-s`), coverage options |
| **prettier-formatting.md** | Frontend code | Print width 120, trailing comma es5, oxide plugin — new standard   |

---

## P3 — Minor Gaps & Notes

| Gap                       | Antigravity       | Claude                                    | Recommendation                            |
| ------------------------- | ----------------- | ----------------------------------------- | ----------------------------------------- |
| MobX `observer()` source  | Not specified     | `from "mobx-react"` (NOT mobx-react-lite) | Update .agent/ rules                      |
| Backend test command docs | Absent            | Comprehensive in `backend-testing.md`     | Create `.agent/rules/backend-testing.md`  |
| Formatter spec            | No formatter rule | `.prettier/plugin-oxc`, 120 char width    | Add `.agent/rules/prettier-formatting.md` |

---

## Antigravity-Specific Constraints

.agent/rules/ serves single-agent context (no subagent delegation):

- ❌ No `primary-workflow.md` (orchestration irrelevant)
- ❌ No `orchestration-protocol.md` (single context, no path scoping)
- ✅ All content rules (color-tokens, mobx, i18n, etc.) remain critical

---

## Action Items

### Immediate (P1)

1. Update `.agent/rules/color-tokens.md`: Remove `-color-` infix from text/border tokens
2. Update `.agent/rules/mobx-stores.md`: Change `set()` import from `"mobx"` to `"lodash-es"`
3. Update `.agent/rules/i18n-rules.md`: Restrict scope to `apps/web` only (remove `apps/admin`)
4. Update `.agent/rules/frontend-implementation-checklist.md`: Line 47-48 grep pattern and line 89 common trap

### Add (P2)

5. Create `.agent/rules/backend-testing.md` (copy from Claude + single-agent context)
6. Create `.agent/rules/prettier-formatting.md` (copy from Claude)
7. Optionally create `.agent/rules/development-rules.md` subset (post-impl verification, ESLint rules)

### Optional (P3)

8. Clarify `observer()` source in `.agent/rules/mobx-stores.md`

---

## Files Needing Updates

```
.agent/rules/
├── color-tokens.md                    ← FIX (token naming)
├── mobx-stores.md                     ← FIX (set() import)
├── i18n-rules.md                      ← FIX (scope)
├── frontend-implementation-checklist.md ← FIX (grep patterns, traps)
├── backend-testing.md                 ← CREATE
└── prettier-formatting.md             ← CREATE
```
