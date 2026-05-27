# CLAUDE.md Rules Summary — Review/Audit + Comments + Self-Decision

## 1. Verified Decisions Are Sticky — Audit Does Not Auto-Reverse

- Once a decision is verified (read source, ran tests, empirical experiment), lock it with a source note: `verified by {file:line}` or `verified by test {name}`.
- An audit/red-team counter-argument **alone is insufficient** to revise. Only revise when:
  - Audit finds a **new** issue the verification missed (state the issue + why prior check missed it).
  - Or context changed since verification (codebase moved, business decision changed).
- After verifying, prune stale risk rows / unresolved questions from reports.
- Surface contradictions on verified decisions to user as: "audit says X, but Y is verified by {source} — does the audit bring new data to justify a reverse?" Do NOT silently flip.

## 2. Validate Audit Findings Against Real Threat Model

Before applying a finding flagged "too narrow / too loose / risky":

1. Identify what the code **actually stores/protects**.
2. Walk each scenario the reviewer flagged through that lens. Does it actually produce the bad outcome? Often "theoretically yes, practically no".
3. Separate real risks from abstract worries. Real → fix; non-real → document rationale; borderline → ask user.
4. Look for the failure mode the reviewer missed — often the real bug sits one step away from what was flagged.

Anti-pattern: accepting every "widen/harden/add-check" recommendation without tracing it to a real failure mode.

## 3. Guard User Decisions Against Audit/YAGNI Drift

**NEVER silently reverse decisions the user has already confirmed.**

Before any cut/change from audit:

1. **Trace before cutting:** check if user explicitly chose that value/design.
2. **Categorize:**
   - ✅ Safe to apply: cuts of items Claude proposed that user never explicitly confirmed.
   - ⚠️ Must confirm first: anything touching user's explicit answer — thresholds, scope, library, schema, phase, feature inclusion/exclusion.
   - 🚫 Never auto-reverse: business decisions (pricing, timing, scope boundaries, compliance).
3. **Surface reversals:** present (a) user's original decision verbatim, (b) audit reasoning, (c) trade-off, (d) explicit ask "keep / change per audit / hybrid?". Do NOT apply.
4. **Document drift:** annotate cuts with reason + user-confirmation trail.
5. **Auditor bias awareness:** audits lean YAGNI/minimalism — they are **input to user**, not orders to Claude.

Red flags: changing a numeric threshold user picked, removing a column/field user mentioned, swapping library, moving scope across phases, cutting a feature user confirmed.

Rule of thumb: if unsure whether a cut reverses user intent, ask. Cost of 1 clarifying question ≪ cost of silent regression at demo.

## 4. Scout-First, Ask-Second (Confidence Score)

For any question answerable by grep/read on the codebase:

1. **Scout first:** grep, read live code, check current state.
2. **Self-rate confidence (0–100%):**
   - **≥ ~85%** → answer directly with `path:line` citation.
   - **< 85%** → ask user.
3. **Only ask when:**
   - Confidence < 85% (missing data, ambiguous).
   - Real conflict between 2+ sources (not a stale note already verified).
   - Anomaly requiring user judgment (business decision, UX trade-off, scope expansion).
   - High-reversibility risk (destructive op, breaking change, deploy-affecting).

Anti-pattern: asking what grep can answer in 5s.
Good pattern: scout → "verified at `file:line`, confidence 95%, applying X" — verified + concise.

## 5. Code Comments & Artifact Naming — No Plan References

Code comments and file names (including SQL migrations) **must not reference plan artifacts**: phase numbers, finding codes (F1, F13, Y1, CU2…), audit labels (audit A4), red-team labels, brainstorm sections (§5.4), plan taxonomy.

**Why:** plan headers change/get renumbered/disappear → references become unresolvable noise. The _reason_ for code (invariant, race, trade-off) must be stable and self-contained.

### Rules

- **Explain the why, not the origin.** Write "org-scoped advisory lock serializes concurrent reassigns" — NOT "per F13 advisory-lock fix".
- **Migration filenames:** domain slug only — `000003_polymorphic_permission_groups.up.sql` (NOT `000003_phase_0a_...`).
- **Test names:** describe scenario — `TestReassignPrimaryDept_Concurrent` (NOT `_F13`).
- **Commit messages:** describe the change, not the finding code.
- Plan refs belong in `plans/…/phase-XX-*.md` and PR descriptions, not in code.

### Allowed in code

- Function/symbol names in the same codebase.
- Stable external IDs: RFC numbers, PostgreSQL SQLSTATE, CVE IDs, durable issue numbers.

---

## Open Questions

None — all 5 rules are clear. Flag if any rule should be expanded further.
