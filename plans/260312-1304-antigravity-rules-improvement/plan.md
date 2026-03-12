---
title: "Antigravity Rules Improvement"
description: "Fix contradictions, add missing rules, and add verification gates to .agent/rules/ to match updated .claude/rules/"
status: completed
priority: P1
effort: 2h
branch: duonglx/refactor/antigravity-rules-sync
tags: [antigravity, rules, ai-agent, quality]
created: 2026-03-12
---

# Antigravity Rules Improvement

Sync `.agent/rules/` with already-improved `.claude/rules/`. Four P1 contradictions, three P2 missing rule sets, one P3 clarification.

## Scope

**In scope:** `.agent/rules/` Markdown files + `.agent/skills/` SKILL.md references (no code changes, no ESLint plugin, no codebase token cleanup)
**Out of scope:** Orchestration rules (primary-workflow.md, orchestration-protocol.md) -- single-agent Antigravity has no subagent delegation

## Phases

| #   | Phase                                                            | Priority | Effort | Status  | File                                                    |
| --- | ---------------------------------------------------------------- | -------- | ------ | ------- | ------------------------------------------------------- |
| 1   | Fix Critical Rule Contradictions + paths: cleanup (all 18 files) | P1       | 40 min | pending | [phase-01](phase-01-fix-critical-contradictions.md)     |
| 2   | Add Missing Rule Files (backend-testing, prettier)               | P2       | 30 min | pending | [phase-02](phase-02-add-missing-rules.md)               |
| 3   | Add Verification & Anti-Hallucination                            | P2       | 30 min | pending | [phase-03](phase-03-verification-anti-hallucination.md) |
| 4   | Update Skills & Workflows References                             | P1       | 25 min | pending | [phase-04](phase-04-update-skills-references.md)        |

## Execution Order

Sequential: Phase 1 -> Phase 2 -> Phase 3 -> Phase 4. Phase 1 must complete first as Phase 3 references corrected token naming. Phase 4 after Phase 2+3 (needs new rule file names).

## Key Constraint

Antigravity rules have NO `paths:` frontmatter auto-loading (unlike Claude Code). Replace YAML `paths:` blocks with markdown comments (`<!-- Scope: apps/web/**/*.tsx -->`). Avoids false impression that path-scoping is active.

## Validation

After all phases, grep `.agent/rules/` for:

- Zero occurrences of `text-color-` (except in "WRONG"/"legacy" examples)
- Zero occurrences of `from "mobx"` for `set` import
- Zero occurrences of `apps/admin` in i18n scope
- Presence of `backend-testing.md`, `prettier-formatting.md`, `development-rules.md`, `frontend-canonical-imports.md`, `backend-canonical-imports.md`
- Zero YAML `paths:` frontmatter across ALL 18 .agent/rules/ files -- replaced with markdown comments
- Skills (cook, review) and workflows (implement-feature, code-review) reference new rule files

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Plan giữ `paths:` frontmatter trong .agent/rules/ dù Antigravity không hỗ trợ auto-loading theo path. Điều này có đúng không? Hay nên bỏ `paths:` để tránh nhầm lẫn?
   - Options: Giữ paths: (Recommended) | Bỏ paths: hoàn toàn | Thay paths: bằng comment
   - **Answer:** Thay paths: bằng comment
   - **Rationale:** Markdown comment (`<!-- Scope: ... -->`) giữ scope info cho reference mà không gây false impression rằng path-scoping đang hoạt động.

2. **[Scope]** Plan tạo `.agent/rules/development-rules.md` mới (~65 dòng). Antigravity có 16 rule files rồi. Thêm file nữa có thể làm context window bị bloat. Bạn muốn xử lý thế nào?
   - Options: Tạo file riêng (Recommended) | Merge vào file có sẵn | Bỏ development-rules.md
   - **Answer:** Tạo file riêng (Recommended)
   - **Rationale:** Verification gates + ESLint là domain riêng biệt. Tách ra giúp file ngắn, dễ maintain.

3. **[Tradeoff]** Duy trì 2 bộ rules song song (.claude/ + .agent/) tạo maintenance burden. Có nên tạo script tự động sync không?
   - Options: Không, sync thủ công (Recommended) | Tạo sync script đơn giản | Single source of truth
   - **Answer:** Không, sync thủ công (Recommended)
   - **Rationale:** Rules thay đổi hiếm. Manual sync khi cần. Tránh over-engineering.

4. **[Scope]** Plan chỉ update .agent/rules/ mà không update skills (cook, implement, review). Các skills này reference rule files. Có nên update skills để reference rules mới (backend-testing.md, prettier-formatting.md, development-rules.md) không?
   - Options: Update skills tham chiếu (Recommended) | Không update skills | Update chỉ cook + review
   - **Answer:** Update skills tham chiếu (Recommended)
   - **Rationale:** cook SKILL.md, review SKILL.md nên biết về verification gates và new rules. Thêm 1-2 dòng mỗi file.

#### Confirmed Decisions

- **paths: frontmatter**: Replace YAML `paths:` with markdown comments `<!-- Scope: ... -->` across all .agent/rules/ files
- **development-rules.md**: Create as separate file (confirmed)
- **Sync strategy**: Manual sync, no automation needed
- **Skills update**: Add Phase 4 to update cook, implement, review, test SKILL.md files with new rule references

#### Action Items

- [x] Update all phase files: replace `paths:` frontmatter examples with markdown comments
- [x] Create Phase 4: Update skills references (cook, implement, review, test SKILL.md)
- [x] Update plan.md effort total (add 15 min for Phase 4)
- [x] Phase 1: also replace `paths:` in existing .agent/rules/ files being modified

#### Impact on Phases

- Phase 1: When modifying color-tokens.md, mobx-stores.md, i18n-rules.md — also replace `paths:` YAML frontmatter with markdown comments
- Phase 1: Remove SWR section addition from mobx-stores.md — move to Phase 2 as separate file
- Phase 1 Step 6: Expand scope to ALL 18 .agent/rules/ files with `paths:` frontmatter (not just modified ones)
- Phase 2: New files (backend-testing.md, prettier-formatting.md, data-fetching-swr.md) use markdown comments instead of `paths:` frontmatter
- Phase 3: New file (development-rules.md) uses markdown comments instead of `paths:` frontmatter
- New Phase 4: Update cook SKILL.md (add verification gates reference), review SKILL.md (add new rule files to checklist), implement SKILL.md (reference development-rules.md), test SKILL.md (reference backend-testing.md)

### Session 2 — 2026-03-12

**Trigger:** Second validation pass — checking remaining decision points (file size limits, scope, commit strategy)
**Questions asked:** 3

#### Questions & Answers

1. **[File Size]** Phase 1 Step 2 adds ~30 lines (SWR vs Store section) to mobx-stores.md (125 lines) → ~155 lines, vượt 150-line limit. Xử lý thế nào?
   - Options: Giữ nguyên, chấp nhận 155 lines | Tách SWR section ra file riêng (Recommended) | Bỏ SWR section, không port sang Antigravity
   - **Answer:** Tách SWR section ra file riêng (Recommended)
   - **Rationale:** Tạo `.agent/rules/data-fetching-swr.md` (~35 lines). mobx-stores.md giữ ~125 lines. Đúng chuẩn modularization.

2. **[Scope]** Thay `paths:` frontmatter bằng markdown comments: chỉ các files modified trong plan này, hay TẤT CẢ .agent/rules/ files?
   - Options: Chỉ files modified trong plan (Recommended) | Tất cả .agent/rules/ files có paths:
   - **Answer:** Tất cả .agent/rules/ files có paths:
   - **Rationale:** Dọn dẹp triệt để 1 lần. 18 files cần update. Tăng diff size nhưng consistent.

3. **[Git]** Commit strategy: single commit cho cả 4 phases hay tách per-phase?
   - Options: Single commit (Recommended) | Per-phase commits (4 commits) | 2 commits: fixes + new files
   - **Answer:** Single commit (Recommended)
   - **Rationale:** Tất cả là 1 logical change: sync .agent/ rules. Atomic, dễ revert nếu cần.

#### Confirmed Decisions

- **SWR section**: Extract to separate `.agent/rules/data-fetching-swr.md` file (~35 lines), remove from mobx-stores.md addition
- **paths: cleanup scope**: ALL 18 .agent/rules/ files with `paths:` frontmatter → markdown comments
- **Commit strategy**: Single commit for all 4 phases

#### Action Items

- [x] Phase 1 Step 2: Remove "add SWR section to mobx-stores.md" — move to Phase 2
- [x] Phase 1 Step 6: Expand to all 18 files (list them explicitly)
- [x] ~~Phase 2: Add Step 3 — create `data-fetching-swr.md`~~ — REMOVED (Session 5)
- [x] Update plan.md effort (Phase 1 Step 6 +10 min for 13 extra files)

#### Impact on Phases

- Phase 1: Step 2 removes SWR section addition. Step 6 expands to all 18 .agent/rules/ files with `paths:`.
- Phase 2: Add Step 3 to create `.agent/rules/data-fetching-swr.md` (content from Claude Code mobx-stores.md lines 107-135)

### Session 3 — 2026-03-12

**Trigger:** Third validation pass — naming overlap, workflow scope, plan text cleanup
**Questions asked:** 3

#### Questions & Answers

1. **[Naming]** Đã có `backend-testing-i18n.md` (test structure + i18n) và Phase 2 tạo thêm `backend-testing.md` (test runner commands). Tên gần giống nhau có thể gây nhầm lẫn. Xử lý thế nào?
   - Options: Giữ cả 2 file (Recommended) | Merge vào backend-testing-i18n.md | Rename file cũ
   - **Answer:** Giữ cả 2 file (Recommended)
   - **Rationale:** Nội dung khác nhau: -i18n.md = test structure/fixtures, mới = runner commands/markers. Tên đủ phân biệt.

2. **[Scope]** `.agent/workflows/` có implement-feature.md và code-review.md — có thể reference rule files. Phase 4 chỉ update skills. Có nên update workflows nữa không?
   - Options: Không, chỉ skills (Recommended) | Update cả workflows | Tạo Phase 5 riêng
   - **Answer:** Update cả workflows
   - **Rationale:** implement-feature.md + code-review.md nên biết về verification gates và new rules. Thêm vào Phase 4 scope.

3. **[Plan cleanup]** Phase 2 Steps 1-2 có text mâu thuẫn: vừa nói 'Keep paths: as-is' vừa nói 'replacing paths: with markdown comment'. Có nên clean up plan files trước khi implement không?
   - Options: Clean up ngay (Recommended) | Không cần, follow validation log
   - **Answer:** Clean up ngay (Recommended)
   - **Rationale:** Xóa text mâu thuẫn, chỉ giữ validated decisions. Implementer sẽ không bị confused.

#### Confirmed Decisions

- **File naming**: Keep both `backend-testing-i18n.md` (structure) and `backend-testing.md` (runner commands) — different content
- **Workflows**: Phase 4 expanded to include `.agent/workflows/implement-feature.md` + `code-review.md`
- **Plan cleanup**: Clean up contradictory text in Phase 2 before implementation

#### Action Items

- [x] Clean up Phase 2 Steps 1-2: remove "Keep `paths:` frontmatter as-is" contradictions
- [x] Phase 4: Add Steps 5-6 to update implement-feature.md + code-review.md workflows
- [x] Update plan.md Phase 4 effort (+10 min for workflow updates)

#### Impact on Phases

- Phase 2: Clean up contradictory "keep paths: as-is" text in Steps 1-2 (replace with consistent "use markdown comment" instruction)
- Phase 4: Add workflow updates — implement-feature.md (reference development-rules.md verification gates) + code-review.md (reference new rule files in checklist)

### Session 4 — 2026-03-12

**Trigger:** Final validation — git strategy, plan text contradictions, source-of-truth conflicts
**Questions asked:** 3

#### Questions & Answers

1. **[Git Strategy]** Plan frontmatter nói `branch: develop` và Session 2 chọn 'single commit'. Nhưng CLAUDE.md rules nói 'NEVER push directly to develop (PR required, 1 review)'. Implementer nên làm gì?
   - Options: Feature branch + PR (Recommended) | Commit trực tiếp develop | Feature branch + squash merge
   - **Answer:** Feature branch + PR (Recommended)
   - **Rationale:** Git rules are non-negotiable. Create `duonglx/refactor/antigravity-rules-sync`, single commit, PR to develop.

2. **[Plan Cleanup]** Phase 1 Step 3 (i18n-rules.md) vẫn show YAML `paths:` trong phần 'New', mâu thuẫn với quyết định Session 1-2 (replace ALL paths: bằng markdown comments). Fix plan text trước khi implement?
   - Options: Fix ngay (Recommended) | Không cần fix
   - **Answer:** Fix ngay (Recommended)
   - **Rationale:** Eliminates ambiguity. Implementer reads phase file text, not validation log.

3. **[Source of Truth]** Validation log có nhiều action items `[ ]` chưa check. Effort mismatch giữa plan.md table và phase frontmatter. Khi conflict, follow cái nào?
   - Options: Validation log wins (Recommended) | Fix phase files to match | Phase files win
   - **Answer:** Fix phase files to match
   - **Rationale:** Eliminates all ambiguity. Phase files are implementation spec — they must be accurate.

#### Confirmed Decisions

- **Git strategy**: Feature branch `duonglx/refactor/antigravity-rules-sync` → single commit → PR to develop
- **Plan cleanup**: Phase 1 Step 3 fixed — YAML `paths:` replaced with markdown comment in "New" example
- **Source of truth**: Phase files updated to match validation log (effort values synced)

#### Action Items

- [x] Fix Phase 1 Step 3 "New" section: replace YAML `paths:` with `<!-- Scope: ... -->` comment
- [x] Update Phase 1 frontmatter effort: 30 min → 40 min (matches plan.md table)
- [x] Update Phase 2 frontmatter effort: 30 min → 35 min (matches plan.md table)
- [x] Update plan.md branch: `develop` → `duonglx/refactor/antigravity-rules-sync`

#### Impact on Phases

- Phase 1: Step 3 "New" section corrected to use markdown comment. Effort frontmatter synced to 40 min.
- Phase 2: Effort frontmatter synced to 35 min.
- All phases: Implementer creates feature branch before starting, PRs to develop after all phases complete.

### Session 5 — 2026-03-12

**Trigger:** Final implementation readiness validation — research on Antigravity rule discovery + canonical imports accuracy
**Questions asked:** 5

#### Research Findings

**Antigravity Rule Discovery:**

- NO auto-discovery. Rules are explicitly referenced in `SKILL.md` files
- `paths:` frontmatter is purely informational, ignored by the system
- No config file exists — rules are hard-coded into skill instruction text
- New rules REQUIRE explicit skill updates to be loaded

**Canonical Imports Accuracy:**

- All 17 planned import paths verified accurate against codebase
- SWR: only 2 files use `useSWR` — effectively deprecated, not worth a rule file
- `computedFn` from `mobx-utils`: only 1 file uses it (low usage but valid)

#### Questions & Answers

1. **[Plan Cleanup]** Sessions 1-3 có 11 action items chưa check, hầu hết đã propagated (có `<!-- Updated -->` markers). Phase 2 line 27 còn contradiction "(keep for consistency)". Xử lý thế nào?
   - Options: Auto-fix tất cả (Recommended) | Fix chỉ contradiction | Bỏ qua, implement luôn
   - **Answer:** Auto-fix tất cả (Recommended)
   - **Rationale:** Clean plan = clean implementation. Checked off completed items, fixed Phase 2 contradiction.

2. **[File Growth]** Phase 3 thêm ~30 lines vào plane-design-system.md (62→~92) và plane-backend-architecture.md (69→~99). Tách canonical imports ra file riêng không?
   - Options: Giữ inline (Recommended) | Tách canonical-imports.md | Tách chỉ backend
   - **Answer:** Tách canonical-imports.md
   - **Rationale:** Future-proof. Create `frontend-canonical-imports.md` + `backend-canonical-imports.md`. Existing files chỉ thêm Rule Maintenance section (~8 lines).

3. **[SWR Rule]** SWR chỉ có 2 files sử dụng. Tạo data-fetching-swr.md hay bỏ?
   - Options: Bỏ data-fetching-swr.md (Recommended) | Giữ | Bỏ SWR hoàn toàn
   - **Answer:** Bỏ data-fetching-swr.md (Recommended)
   - **Rationale:** YAGNI. Thêm 1 dòng deprecation note vào mobx-stores.md thay vì tạo file mới.

4. **[Phase 4 Priority]** Research xác nhận Phase 4 là BẮT BUỘC — không update skills thì new rules không được load. Nâng priority?
   - Options: Nâng lên P1 (Recommended) | Giữ P3
   - **Answer:** Nâng lên P1 (Recommended)
   - **Rationale:** Antigravity has no auto-discovery. Without Phase 4, Phases 2-3 are useless — new rules exist but never loaded.

5. **[Readiness]** Plan đã qua 4 sessions (13 questions). Ready to implement?
   - Options: Ready, implement luôn | Cần review 1 phase | Cần thêm research
   - **Answer:** Cần thêm research (Antigravity rule discovery + Canonical imports accuracy)
   - **Rationale:** Both topics researched and resolved in this session.

#### Confirmed Decisions

- **Plan cleanup**: All 11 unchecked action items checked off, Phase 2 contradiction fixed
- **Canonical imports**: Extracted to separate files (`frontend-canonical-imports.md` + `backend-canonical-imports.md`)
- **SWR**: data-fetching-swr.md REMOVED. Add deprecation note to mobx-stores.md instead
- **Phase 4 priority**: P3 → P1 (mandatory for rule discovery)
- **All canonical import paths**: Verified accurate against actual codebase

#### Action Items

- [x] Check off all completed action items from Sessions 1-3
- [x] Fix Phase 2 line 27 contradiction "(keep for consistency)"
- [x] Update Phase 3: Steps 2-3 create separate canonical import files
- [x] Remove data-fetching-swr.md from Phase 2 (Step 3 removed)
- [x] Update plan.md phases table: Phase 2 remove SWR ref, Phase 4 P3→P1
- [x] Update Phase 4 frontmatter priority P3→P1
- [x] Phase 1 Step 2: Add SWR deprecation note to mobx-stores.md changes
- [x] Phase 4: Add references to new canonical import files in relevant skills

#### Impact on Phases

- Phase 1: Step 2 adds SWR deprecation note to mobx-stores.md changes
- Phase 2: Step 3 (data-fetching-swr.md) REMOVED. Now 2 files instead of 3. Effort reduced 35→30 min.
- Phase 3: Steps 2-3 changed from inline additions to separate file creation. Steps renumbered 1-5. Now creates 3 files + modifies 2.
- Phase 4: Priority P3→P1. Must also reference `frontend-canonical-imports.md` + `backend-canonical-imports.md` in relevant skills.

### Session 6 — 2026-03-12

**Trigger:** Final cleanup validation — propagate Session 5 unchecked items, confirm readiness
**Questions asked:** 3

#### Questions & Answers

1. **[Cleanup]** Session 5 có 2 action items chưa propagate vào phase files: (1) Phase 1 Step 2 thêm SWR deprecation note vào mobx-stores.md, (2) Phase 4 thêm references đến canonical import files. Auto-fix trước khi implement?
   - Options: Auto-fix ngay (Recommended) | Bỏ qua, implement luôn
   - **Answer:** Auto-fix ngay (Recommended)
   - **Rationale:** Clean phase files = no ambiguity for implementer.

2. **[Phase 4]** Phase 4 Steps 1-3 chưa mention frontend-canonical-imports.md và backend-canonical-imports.md (tạo ở Session 5). Thêm vào cook + review + implement SKILL.md?
   - Options: Thêm vào Steps 1-3 (Recommended) | Không cần, đã có trong Step 2
   - **Answer:** Thêm vào Steps 1-3 (Recommended)
   - **Rationale:** Explicit references ensure all skills know about canonical import files.

3. **[Readiness]** Plan đã qua 5 sessions, 18 questions. Ready to implement?
   - Options: Ready, fix cleanup rồi implement | Ready, implement luôn | Cần review thêm
   - **Answer:** Cần review thêm
   - **Rationale:** User wants additional review before implementation.

#### Confirmed Decisions

- **Session 5 action items**: Propagated to phase files (Phase 1 Step 2 + Phase 4 Step 1)
- **Phase 2 effort**: Frontmatter synced 35→30 min (matches Session 5 decision)
- **Phase 4 canonical imports**: Added backend-canonical-imports.md reference to Step 1

#### Action Items

- [x] Propagate SWR deprecation note to Phase 1 Step 2
- [x] Add canonical import references to Phase 4 Step 1
- [x] Fix Phase 2 frontmatter effort 35→30 min
- [x] Check off Session 5 unchecked action items
- [x] User review: full plan overview reviewed, confirmed ready to implement

#### Impact on Phases

- Phase 1: Step 2 now explicitly includes SWR deprecation note instruction
- Phase 2: Effort frontmatter synced to 30 min
- Phase 4: Step 1 (cook) now references backend-canonical-imports.md
