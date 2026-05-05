---
title: "Draft State — Optional Fields on Workitem Creation"
description: "Skip required-field validation when draft state selected; only title required"
status: completed
priority: P2
effort: 3h
branch: ngoc-feat/workspaces
tags: [workitem, draft, validation, form]
created: 2026-03-12
---

# Draft State — Skip Required-Field Validation

## Problem

When creating a new workitem and selecting a state in the "backlog" group (labeled "Draft" in UI), users must still fill all required fields (assignee, start date, due date). Draft items are incomplete by nature — forcing these fields is friction.

## Solution

When the selected state's group is `"backlog"`, disable required-field validation on the creation form. Only `title` (name) remains mandatory.

## Phases

| #   | Phase                      | Effort | Details                                                              |
| --- | -------------------------- | ------ | -------------------------------------------------------------------- |
| 1   | Frontend validation bypass | 2h     | [phase-01-frontend-validation.md](./phase-01-frontend-validation.md) |
| 2   | Backend tolerance check    | 1h     | Verify backend already tolerates nulls; add guard if not             |

## Key Decisions

- **Draft = state group `"backlog"`** (matches existing UI label "Draft")
- **No new DB fields** — use existing `state.group` to determine draft status
- **Frontend-only change** — backend already accepts null for all optional fields
- **CE override via hook** — create `useIssueFormValidation` hook in `ce/hooks/`; `default-properties.tsx` calls the hook (only hook call added to core); validation logic lives in CE
- **All fields except title** — all required fields in the form become optional in draft state (not just assignee/dates)

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before implementation
**Questions asked:** 5

#### Questions & Answers

1. **[Architecture]** The plan modifies `default-properties.tsx` in `core/` — an exception to the CE pattern rule. Is this acceptable, or should we find a CE override path?
   - Options: Accept core edit | Refactor to CE override
   - **Answer:** Refactor to CE override
   - **Rationale:** Keeps core untouched per CLAUDE.md rules. Requires creating a `useIssueFormValidation` hook in `ce/` that returns draft state + field rules.

2. **[Assumptions]** The plan assumes `state.group === "backlog"` always means "Draft". Are there projects where backlog states should still enforce required fields?
   - Options: Backlog = Draft always | Only explicit Draft state | Configurable per project
   - **Answer:** Backlog = Draft always (Recommended)
   - **Rationale:** Consistent with UI label "Draft"; all backlog states skip validation.

3. **[Scope]** The plan only relaxes validation for 3 fields: assignee_ids, start_date, target_date. Are there other required fields in the form that should also become optional in draft state?
   - Options: Only these 3 fields | All fields except title
   - **Answer:** All fields except title
   - **Rationale:** Future-proofs the implementation; any required field added later is automatically optional in draft state.

4. **[Architecture]** Phase 2 is backend verification. Should it run before Phase 1 to confirm assumptions, or after?
   - Options: Phase 1 first | Phase 2 first | Parallel
   - **Answer:** Phase 1 first (Recommended)
   - **Rationale:** Backend tolerance already documented in phase-01 key insights; verification can follow.

5. **[Architecture]** Which CE override approach for inline Controller rules?
   - Options: Hook: useIssueFormValidation | Prop: validationRules from parent | Context provider in CE
   - **Answer:** Hook: useIssueFormValidation (Recommended)
   - **Rationale:** Hook in `ce/hooks/` returns `{ isDraftState, getFieldRules }`. Only the hook call is added to core, all logic stays in CE.

#### Confirmed Decisions

- Draft definition: `state.group === "backlog"` always — consistent with UI
- Architecture: CE hook `useIssueFormValidation` in `apps/web/ce/hooks/`
- Field scope: all fields except `name` (title) become optional in draft state
- Phase order: Phase 1 → Phase 2

#### Action Items

- [ ] Update Phase 1 architecture to use `useIssueFormValidation` hook pattern
- [ ] Update Phase 1 scope to cover all required fields (not just 3)
- [ ] Create hook shim in `apps/web/core/hooks/store/use-issue-form-validation.ts`

#### Impact on Phases

- Phase 1: Architecture change — extract logic into CE hook; update scope to all-fields-except-title

---

### Session 2 — 2026-03-12

**Trigger:** Re-validation to surface remaining implementation details before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** When switching to draft state, `clearErrors()` clears ALL form errors including any title validation error. Should it only clear non-title field errors?
   - Options: Clear all errors | Clear only non-title errors
   - **Answer:** Clear all errors (Recommended)
   - **Rationale:** Simple approach; title will re-validate on submit. No extra complexity in hook.

2. **[Architecture]** Does `apps/web/ce/hooks/` directory already exist, or should we verify first?
   - Options: Verify & create if needed | Assume it exists
   - **Answer:** Verify & create if needed (Recommended)
   - **Rationale:** CE pattern doesn't guarantee directory pre-existence; safe to check during implementation.

3. **[Scope]** Should the draft-state validation bypass also apply to the workitem **edit** form, not just creation?
   - Options: Creation only | Both create & edit
   - **Answer:** Both create & edit (Recommended)
   - **Rationale:** Consistent UX — draft items should never enforce required fields whether creating or editing.

#### Confirmed Decisions

- clearErrors scope: clear all (simple, title re-validates on submit)
- ce/hooks/ dir: check & create if missing
- Form scope expanded: **both creation and edit forms** must apply the draft validation bypass

#### Action Items

- [ ] Verify `apps/web/ce/hooks/` exists; create if not
- [ ] Identify edit form component and apply the same `getFieldRules` pattern

#### Impact on Phases

- Phase 1: Scope expanded — also update workitem **edit** form (identify the edit form's properties component and apply `getFieldRules` there too)

---

---

### Session 3 — 2026-03-12

**Trigger:** Final pre-implementation check on remaining unknowns
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** The edit form properties component is still unidentified. Should we locate it during implementation, or specify the path now?
   - Options: Find during impl | I know the file
   - **Answer:** Find during impl
   - **Rationale:** Keeps plan lean; agent searches at implementation time.

2. **[Scope]** Phase 2 is read-only verification — should it run or be skipped given Phase 1 already documents backend tolerance?
   - Options: Skip — already verified | Run during impl
   - **Answer:** Skip — already verified
   - **Rationale:** Phase 1 Key Insights already confirms backend tolerance; Phase 2 is redundant.

3. **[Assumptions]** The CE hook uses `useFormContext<TIssue>()` — assumes both create and edit forms use react-hook-form with FormProvider. Is this safe?
   - Options: Yes, both use RHF | Unsure — verify first
   - **Answer:** Yes, both use RHF
   - **Rationale:** Proceed with hook implementation; no pre-check needed.

#### Confirmed Decisions

- Edit form: locate component at implementation time
- Phase 2: skipped — backend tolerance already confirmed
- FormProvider assumption: safe to use `useFormContext` in both forms

#### Action Items

- [ ] Remove Phase 2 from implementation scope (mark as pre-verified)
- [ ] During Phase 1 Step 4, search for edit form properties component inline

#### Impact on Phases

- Phase 2: Skipped — evidence already in Phase 1 Key Insights; mark as done without code changes

---

---

### Session 4 — 2026-03-12

**Trigger:** Final pre-implementation validation — remaining implementation details
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** The CE hook uses `useEffect([isDraftState, clearErrors])` to auto-clear errors on draft transition. `clearErrors` from RHF is not always referentially stable — this could trigger infinite re-renders. How should we handle it?
   - Options: Suppress lint warning | useRef to stabilize clearErrors | Omit clearErrors from deps
   - **Answer:** Suppress lint warning (Recommended)
   - **Rationale:** Depend only on `isDraftState`; add `// eslint-disable-next-line react-hooks/exhaustive-deps` — `clearErrors` is invoked once per transition, no real re-render risk.

2. **[Scope]** When switching from draft → non-draft state, should required-field validation kick in immediately (on state change), or only when user tries to submit?
   - Options: On submit only | Immediately on state switch
   - **Answer:** On submit only (Recommended)
   - **Rationale:** RHF re-validates on submit naturally. No `trigger()` call needed on state switch — least surprising UX, no extra complexity.

3. **[Scope]** The edit form properties component is unknown. Find & verify it now to confirm FormProvider wrapping.
   - Options: Find & verify now | Trust & find during impl
   - **Answer:** Find & verify now
   - **Rationale:** Confirmed: edit form (`issue-detail/sidebar.tsx`) uses **direct MobX mutations**, NOT react-hook-form FormProvider. It has **zero validation rules** already. The `useFormContext` hook cannot apply there — and doesn't need to. Session 2 decision to expand to edit form is **effectively a no-op** (edit form already has no required fields).

#### Confirmed Decisions

- `useEffect` dep array: `[isDraftState]` only + `// eslint-disable-next-line react-hooks/exhaustive-deps`
- Re-enable timing: submit only — no `trigger()` call
- Edit form: **no changes needed** — `sidebar.tsx` uses MobX, not RHF, and has no validation rules

#### Action Items

- [ ] Update phase-01 to remove edit form from scope (it has no validation to bypass)
- [ ] Add eslint-disable comment to useEffect in CE hook implementation

#### Impact on Phases

- Phase 1: Edit form scope **removed** — sidebar.tsx has no FormProvider or validation rules; no changes needed there. Session 2 expansion is resolved as a no-op.

---

## Phases

| #   | Phase                      | Effort | Details                                                                  |
| --- | -------------------------- | ------ | ------------------------------------------------------------------------ |
| 1   | Frontend validation bypass | 2h     | [phase-01-frontend-validation.md](./phase-01-frontend-validation.md)     |
| 2   | Backend tolerance check    | —      | Skipped — already verified in Phase 1 Key Insights                       |
| 3   | Edit form draft→non-draft  | 1h     | [phase-03-edit-draft-transition.md](./phase-03-edit-draft-transition.md) |

---

### Session 5 — 2026-03-13

**Trigger:** New requirement — enforce required fields when editing a draft workitem and switching to a non-draft state

#### New Requirement

When a workitem is in draft (backlog group) state and the user changes the state to non-draft via the **edit form (sidebar)**, all required fields (`assignee_ids`, `start_date`, `target_date`) must be filled before the state change is applied. If not filled, the transition is blocked with a user-visible error.

#### Key Decisions

- **Edit form uses MobX** (confirmed Session 4) — no RHF FormProvider, so can't use `getFieldRules`; need imperative validation before `issueOperations.update()` call
- **Block the update** if required fields missing — don't proceed to API call
- **Show error feedback** via toast notification listing missing fields
- **Same 3 required fields** as creation form: `assignee_ids`, `start_date`, `target_date`
- **CE hook pattern** — validation logic in `ce/hooks/use-draft-state-transition.ts`; minimal change to `sidebar.tsx` (core shim pattern)
- **One-direction only** — only draft → non-draft triggers validation; non-draft → draft is free (no new restrictions)

#### Confirmed Decisions

- Validation scope: `assignee_ids`, `start_date`, `target_date` (same as creation form)
- Feedback mechanism: toast notification listing missing required fields + abort state update
- Architecture: CE hook `useDraftStateTransition` with `validateTransition(issue, newStateId)` → string[] of missing field names
- Core change: `sidebar.tsx` state onChange — add CE hook call before `issueOperations.update`

#### Action Items

- [ ] Create `apps/web/ce/hooks/use-draft-state-transition.ts`
- [ ] Create core shim `apps/web/core/hooks/store/use-draft-state-transition.ts`
- [ ] Update `sidebar.tsx` state dropdown onChange to validate before update

---

### Session 6 — 2026-03-13

**Trigger:** Validation of Phase 3 implementation decisions before coding
**Questions asked:** 3

#### Questions & Answers

1. **[UX Feedback]** Khi thiếu required fields và state change bị block, cách thông báo lỗi nào phù hợp nhất?
   - Options: Toast + highlight fields (Recommended) | Toast only | Inline error dưới state dropdown
   - **Answer:** Toast + highlight fields (Recommended)
   - **Rationale:** Toast lists missing fields; fields in sidebar get red border indicator so user knows exactly what to fill without hunting.

2. **[Dropdown Revert]** StateDropdown trong sidebar có thể tự reset về giá trị cũ khi validation fail không? Hay cần xử lý riêng?
   - Options: Dropdown tự revert (Recommended) | Cần xử lý thủ công
   - **Answer:** Dropdown tự revert (Recommended)
   - **Rationale:** `StateDropdown` is controlled via `value={issue.state_id}`. When update is aborted, `state_id` stays unchanged → dropdown reverts automatically. No manual reset needed.

3. **[Field Config]** Required fields nên được hardcode (assignee_ids, start_date, target_date) hay lấy từ project configuration?
   - Options: Hardcode 3 fields (Recommended) | Lấy từ project config
   - **Answer:** Hardcode 3 fields (Recommended)
   - **Rationale:** Matches creation form behavior. YAGNI — project-level config is a future concern.

#### Confirmed Decisions

- Error feedback: toast + red border highlight on empty required fields in sidebar
- Dropdown revert: automatic (controlled component, no extra handling)
- Required fields: hardcoded `assignee_ids`, `start_date`, `target_date`

#### Action Items

- [ ] Update phase-03 to include field highlight logic: CE hook returns `missingFields: string[]`; sidebar applies error CSS class to empty fields

#### Impact on Phases

- Phase 3: Add field highlight — CE hook returns `{ missingFields }` (array of field keys); sidebar applies `error` or `border-danger` class to fields in `missingFields`

---

### Session 7 — 2026-03-13

**Trigger:** Validation of Phase 3 remaining implementation details (error clearing, i18n, toast API)
**Questions asked:** 3

#### Questions & Answers

1. **[UX]** When should the red border highlights on missing fields clear? The plan mentions 'clear fieldErrors when user fills a field' but the implementation diff only clears them on a successful state change.
   - Options: Clear on successful transition | Clear individually per field | Clear all on any field change
   - **Answer:** Clear on successful transition
   - **Rationale:** Simple implementation — `setFieldErrors([])` only on successful state change. No extra onChange watchers on MemberDropdown/DateDropdown needed.

2. **[i18n]** The i18n key `issue.required_fields_missing` likely doesn't exist yet. What strategy?
   - Options: Add new key to i18n files | Hardcode English fallback | Reuse existing key
   - **Answer:** Add new key to i18n files
   - **Rationale:** Proper i18n support; add the key during Phase 3 implementation alongside the code change.

3. **[Architecture]** The exact toast API in sidebar.tsx is unconfirmed. Use `setToastAlert` assumption or `@plane/propel` toast?
   - Options: Check at implementation time | Use @plane/propel toast
   - **Answer:** Use @plane/propel toast
   - **Rationale:** Matches CLAUDE.md preference for `@plane/propel` over legacy patterns.

#### Confirmed Decisions

- `fieldErrors` clearing: successful transition only — no per-field onChange watchers
- i18n: add `issue.required_fields_missing` key to i18n JSON files during implementation
- Toast: use `toast` from `@plane/propel` (not `setToastAlert`)

#### Action Items

- [ ] Update phase-03 toast import to use `@plane/propel` toast
- [ ] Add `issue.required_fields_missing` i18n key during implementation
- [ ] Remove "clear when user fills a field" from phase-03 todo — clear on transition only

#### Impact on Phases

- Phase 3: Toast pattern → use `toast` from `@plane/propel`; add i18n key step; remove per-field clear logic

---

## Out of Scope

- Backend enforcement of required fields (currently not enforced)
- Changing existing draft issue (`is_draft` flag) behavior
- Workspace-level draft settings
