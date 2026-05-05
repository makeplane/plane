# Plan: Nâng cấp View Filter Operators

## Tổng quan

Thêm các điều kiện lọc mới cho Views (workspace & project): **is not**, **greater than**, **less than**.

Hiện tại hệ thống rich-filter chỉ hỗ trợ:

- `exact` ("is") — single/date field
- `in` ("is any of") — multi-select
- `range` ("between") — date range

Mục tiêu thêm:

- `not_exact` → **"is not"** (phủ định của `exact`) — áp dụng cho single-select, date
- `not_in` → **"is not any of"** (phủ định của `in`) — áp dụng cho multi-select
- `gt` → **"greater than"** — áp dụng cho date fields
- `lt` → **"less than"** — áp dụng cho date fields

## Kiến trúc hiện tại

```
packages/
  types/src/rich-filters/
    operators/core.ts          ← EXACT, IN, RANGE
    operators/extended.ts      ← rỗng (nơi thêm operators mới)
    operator-configs/core.ts   ← type mapping operator → config
    operator-configs/extended.ts ← rỗng
    field-types/core.ts        ← DATE, DATE_RANGE, SINGLE_SELECT, MULTI_SELECT
    field-types/extended.ts    ← rỗng
  constants/src/rich-filters/
    operator-labels/core.ts    ← "is", "is any of", "between"
    operator-labels/extended.ts ← rỗng (thêm label mới ở đây)
  utils/src/rich-filters/
    factories/configs/properties/shared.ts  ← getSupportedDateOperators
    operators/core.ts          ← getOperatorLabel, isDateFilterOperator

apps/
  api/plane/utils/filters/
    filterset.py               ← IssueFilterSet với fields Meta
    filter_backend.py          ← ComplexFilterBackend (xử lý not/and/or)
```

## Phân tích thay đổi cần thiết

### Frontend (packages)

1. **`packages/types`**: Thêm operators mới vào `extended.ts`:
   - `NOT_EXACT = "not_exact"`, `NOT_IN = "not_in"`, `GT = "gt"`, `LT = "lt"`
   - Thêm type configs tương ứng
   - Thêm `SINGLE_VALUE_DATE` field-type mới (cho gt/lt — chỉ cần 1 ngày)

2. **`packages/constants`**: Thêm labels vào `extended.ts`:
   - `"not_exact"` → `"is not"`, `"not_in"` → `"is not any of"`
   - `"gt"` → `"greater than"`, `"lt"` → `"less than"`

3. **`packages/utils`**: Cập nhật `getSupportedDateOperators` để include `gt`, `lt`

### Backend

4. **`apps/api/plane/utils/filters/filterset.py`**: Thêm Django lookups mới:
   - `start_date__gt`, `start_date__lt`, `target_date__gt`, `target_date__lt`
   - `created_at__gt`, `created_at__lt`, `updated_at__gt`, `updated_at__lt`
   - `state_id__not_exact` → sử dụng `NOT` wrapper của filter_backend

5. **`apps/api/plane/utils/filters/filter_backend.py`**: Backend đã hỗ trợ `{"not": {...}}` nhưng frontend cần map `not_exact`/`not_in` → `{"not": {...exact/in...}}`

> **Lưu ý**: Backend `filter_backend.py` đã sử dụng `{"not": node}` để wrap negation.
> Frontend cần convert `not_exact` → gửi `{"not": {"field__exact": value}}` lên BE.

## Bảng Phase

| Phase | Tên               | Nội dung                                                     | Độ phức tạp |
| ----- | ----------------- | ------------------------------------------------------------ | ----------- |
| 01    | types-operators   | Thêm operators & types vào packages/types                    | Thấp        |
| 02    | constants-labels  | Thêm labels vào packages/constants                           | Thấp        |
| 03    | utils-factories   | Cập nhật factory functions, getSupportedDateOperators        | Trung bình  |
| 04    | backend-filterset | Thêm **gt/**lt lookups vào IssueFilterSet                    | Trung bình  |
| 05    | frontend-ui       | Thêm UI input cho gt/lt (single date picker), xử lý negation | Cao         |

## File thay đổi (tóm tắt)

### Modify:

- `packages/types/src/rich-filters/operators/extended.ts`
- `packages/types/src/rich-filters/operator-configs/extended.ts`
- `packages/types/src/rich-filters/field-types/extended.ts`
- `packages/types/src/rich-filters/operators/index.ts` (MULTI_VALUE_OPERATORS)
- `packages/constants/src/rich-filters/operator-labels/extended.ts`
- `packages/utils/src/rich-filters/factories/configs/properties/shared.ts`
- `packages/utils/src/rich-filters/operators/core.ts` (getOperatorForPayload nếu cần)
- `apps/api/plane/utils/filters/filterset.py`

### Create:

- `apps/web/core/components/rich-filters/filter-value-input/date/single-bounded.tsx` (optional, nếu cần variant của date picker cho gt/lt)

## Status

| Phase | Status  |
| ----- | ------- |
| 01    | ✅ Done |
| 02    | ✅ Done |
| 03    | ✅ Done |
| 04    | ✅ Done |
| 05    | ✅ Done |

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan creation — validating before implementation begins
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 05 notes that `_isNegation` in `_updateCondition` may be ignored. Where should negation (`not_exact`/`not_in`) be converted to `{"not": {...}}` format?
   - Options: Adapter `toExternal` (Recommended) | Internal expression tree
   - **Answer:** Adapter `toExternal` (Recommended)
   - **Rationale:** Keeps internal expression tree unchanged. `not_exact`/`not_in` are stored as-is in the expression; only converted to `{"not": {...}}` when serializing to API payload in `toExternal`. Simpler, avoids restructuring filter-helpers.ts.

2. **[Scope]** Which fields should expose the new `not_exact` / `not_in` operators in the UI dropdown?
   - Options: All select + date fields (Recommended) | Date fields only | State field only
   - **Answer:** All select + date fields (Recommended)
   - **Rationale:** State, priority, assignee, label, and all date fields will get negation operators. Factory helpers for single-select and multi-select must include `NOT_EXACT` and `NOT_IN` respectively.

3. **[UI Labels]** What UI labels should `gt` and `lt` operators display for date fields?
   - Options: "after" / "before" (Recommended) | "greater than" / "less than"
   - **Answer:** "greater than" / "less than"
   - **Rationale:** User chose consistent naming with operator type names. Constants in Phase 02 should use "greater than" / "less than" labels. Phase 03 success criteria "after"/"before" references must be corrected to "greater than"/"less than".

4. **[Backend Scope]** Phase 04 mentions there may be separate ViewFilterSets for workspace/project views. What is the backend scope?
   - Options: IssueFilterSet only (Recommended) | All FilterSets (full scope)
   - **Answer:** IssueFilterSet only (Recommended)
   - **Rationale:** Only `IssueFilterSet.Meta.fields` will be updated. ViewFilterSets (if any) are deferred to a future scope. Reduces risk of unintended regressions.

#### Confirmed Decisions

- **Negation conversion**: Adapter `toExternal` layer — not internal expression tree
- **Field scope**: All select + date fields expose negation operators
- **Date operator labels**: "greater than" / "less than" (not "after" / "before")
- **Backend scope**: IssueFilterSet only

#### Action Items

- [ ] Phase 02: Use "greater than" / "less than" labels (not "after"/"before")
- [ ] Phase 03: Update `getSupportedDateOperators` to add `NOT_EXACT` for date fields; add `NOT_EXACT`/`NOT_IN` to ALL select field factory helpers
- [ ] Phase 05: Implement negation conversion in `toExternal` adapter, NOT in `_updateCondition`

#### Impact on Phases

- Phase 02: Label constants must use "greater than" / "less than" for `gt`/`lt`
- Phase 03: Factory helpers for single-select AND multi-select must include negation operators (not only date fields)
- Phase 05: Negation handling in adapter `toExternal` — skip any `_updateCondition` negation logic

---

### Session 2 — 2026-03-13

**Trigger:** Re-validation to surface remaining unresolved decision points before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Consistency]** Phase 05 requirements/checklist still reference 'after'/'before' labels (inconsistent with Session 1 decision of 'greater than'/'less than'). How should this be handled?
   - Options: Auto-fix Phase 05 (Recommended) | Leave as-is
   - **Answer:** Auto-fix Phase 05 (Recommended)
   - **Rationale:** Phase 05 Requirements + Post-Phase Checklist must be updated to use "greater than"/"less than" so implementer doesn't get confused by conflicting labels.

2. **[Scope]** When user switches operator from 'is any of' (multi-select) to 'is not' (single-select), what should happen to the selected values?
   - Options: Reset to empty (Recommended) | Keep first value | Keep all, let UI handle
   - **Answer:** Reset to empty (Recommended)
   - **Rationale:** Prevents type mismatch when transitioning multi→single operator. `_shouldResetValueOnOperatorChange` must return `true` for multi→single transitions.

3. **[i18n]** Operator labels come from constants, not hardcoded in components. Should i18n translation keys be added now or deferred?
   - Options: Add i18n keys now (Recommended) | Defer i18n
   - **Answer:** Add i18n keys now (Recommended)
   - **Rationale:** Add translation keys in en/ko/vi alongside Phase 02 constant changes. Prevents a follow-up task and ensures full i18n coverage from day one.

#### Confirmed Decisions

- **Phase 05 labels**: Fix "after"/"before" → "greater than"/"less than" in Requirements + Checklist
- **Value reset**: Reset to empty on multi→single operator switch (`_shouldResetValueOnOperatorChange`)
- **i18n scope**: Add translation keys in Phase 02 (en/ko/vi)

#### Action Items

- [ ] Phase 02: Add i18n translation keys for all 4 operators in en/ko/vi translation files
- [ ] Phase 03: `_shouldResetValueOnOperatorChange` must return `true` for multi→single transitions (e.g. `in`→`not_exact`, `not_in`→`exact`)
- [ ] Phase 05: Fix "after"/"before" labels → "greater than"/"less than" in Requirements + Post-Phase Checklist

#### Impact on Phases

- Phase 02: Add i18n keys alongside constant changes
- Phase 03: Document value reset logic in `_shouldResetValueOnOperatorChange`
- Phase 05: Update Requirements + Checklist to replace "after"/"before" with "greater than"/"less than"

---

### Session 3 — 2026-03-13

**Trigger:** Re-validation to resolve remaining implementation unknowns (function locations, config ownership)
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 03 needs to update `getOperatorForPayload` but will grep first to locate it. If the function doesn't exist yet, where should it be created?
   - Options: packages/utils (Recommended) | packages/shared-state | Grep first, decide at runtime
   - **Answer:** packages/utils (Recommended)
   - **Rationale:** If `getOperatorForPayload` is not found via grep, create it in `packages/utils/src/rich-filters/operators/core.ts` alongside other operator helpers (getOperatorLabel, isDateFilterOperator). Keeps operator transformation logic in one package.

2. **[Architecture]** Phase 05 needs to find the `toExternal` adapter to implement negation serialization (`not_exact` → `{"not": {...}}`). If it doesn't exist, where should this serialization be implemented?
   - Options: shared-state filter store (Recommended) | Separate adapter file | Grep first, decide at runtime
   - **Answer:** shared-state filter store (Recommended)
   - **Rationale:** Implement negation serialization inside `packages/shared-state/src/store/rich-filters/filter.ts` where the `toPayload`/`buildQuery` method already lives. No new files needed.

3. **[Scope]** For `not_in` multi-select config, `TMultiSelectFilterFieldConfig` needs a `singleValueOperator` set to `NOT_EXACT`. Which phase should handle this?
   - Options: Phase 01 — types (Recommended) | Phase 03 — factory helpers | Phase 05 — UI integration
   - **Answer:** Phase 01 — types (Recommended)
   - **Rationale:** Add `singleValueOperator: "not_exact"` to `TExtendedNotInOperatorConfigs` in `operator-configs/extended.ts` so TypeScript enforces it at the type level. Phase 03 factory then sets the value when constructing the config object.

#### Confirmed Decisions

- **getOperatorForPayload location**: `packages/utils/src/rich-filters/operators/core.ts` (create if not found)
- **Negation serialization**: Inside `filter.ts` toPayload/buildQuery method in `packages/shared-state`
- **singleValueOperator for not_in**: Declared in Phase 01 types (`operator-configs/extended.ts`)

#### Action Items

- [ ] Phase 01: Add `singleValueOperator: typeof EXTENDED_EQUALITY_OPERATOR.NOT_EXACT` field to `TExtendedNotInOperatorConfigs`
- [ ] Phase 03: If `getOperatorForPayload` not found via grep → create in `packages/utils/src/rich-filters/operators/core.ts`
- [ ] Phase 05: Implement negation serialization (`not_exact`/`not_in` → `{"not": {...}}`) inside existing `toPayload`/`buildQuery` in `packages/shared-state/src/store/rich-filters/filter.ts`

#### Impact on Phases

- Phase 01: `TExtendedNotInOperatorConfigs` must include `singleValueOperator: "not_exact"` field
- Phase 03: Fallback location for `getOperatorForPayload` is `packages/utils/src/rich-filters/operators/core.ts`
- Phase 05: Negation serialization goes in `filter.ts` `toPayload`/`buildQuery` — not a new file
