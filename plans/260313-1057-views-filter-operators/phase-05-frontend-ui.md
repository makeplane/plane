# Phase 05: Frontend UI — Value Inputs & Filter Config Integration

## Overview

Kết nối toàn bộ operator mới vào UI:

1. `FilterItem` component sẽ hiển thị operators mới trong dropdown
2. `FilterValueInput` cần handle `gt`/`lt` (single date picker) — thực ra giống `exact`
3. Các filter configs (`getSupportedDateOperators`, single-select config) expose operators mới
4. Store adapter (`filter.ts`) convert `not_exact`/`not_in` → isNegation wrapper khi gửi BE

**Priority**: Cao  
**Dependencies**: Phase 01 + 02 + 03 (types, labels, utils)  
**Status**: ⏳ Pending

---

## Requirements

<!-- Updated: Validation Session 2 - Replace "after"/"before" with "greater than"/"less than" per Session 1 decision -->

### Functional

- User thấy operators mới trong dropdown: "is not", "is not any of", "greater than", "less than"
- Chọn "greater than" / "less than" → hiển thị single date picker (giống "is" với date)
- Chọn "is not" → hiển thị single value input tương ứng field type
- Chọn "is not any of" → hiển thị multi-select dropdown
- Khi apply filter, payload gửi BE đúng format

### Non-functional

- `observer()` trên tất cả MobX-connected components
- Semantic color tokens: không hardcode `text-gray-*`
- i18n: sử dụng `t()` cho tất cả user-facing text (labels đến từ constants, nên OK)

---

## Related Code Files

### Verify (thường không cần modify nếu architecture đúng):

- `apps/web/core/components/rich-filters/filter-item/root.tsx` — Đã dùng `getAllDisplayOperatorOptionsByValue()` từ store
- `apps/web/core/components/rich-filters/filter-value-input/root.tsx` — Đã dispatch dựa trên `filterFieldConfig.type`
- `apps/web/core/components/rich-filters/filter-value-input/date/single.tsx` — Component date picker đơn

### Likely modify:

- `packages/shared-state/src/store/rich-filters/filter.ts` — `updateConditionOperator()` method cần handle `not_exact` → wrap với NOT group
- `packages/shared-state/src/store/rich-filters/filter-helpers.ts` — `restructureExpressionForOperatorChange` hoặc `_updateCondition`

### Verify no change needed:

- `apps/web/ce/components/rich-filters/filter-value-input/root.tsx` — AdditionalFilterValueInput (CE extension point)

---

## Embedded Rules

1. **`observer()` required** — Mọi component đọc MobX store phải wrap với `observer(function ComponentName(...) {...})`.

2. **Semantic tokens** — Dùng `text-color-primary`, `bg-surface-1`, `border-color-subtle` — KHÔNG hardcode colors.

3. **CE pattern** — Modifications to filter UI phải xem xét CE vs core. `filter-value-input/root.tsx` đã có `AdditionalFilterValueInput` là CE extension point — không cần modify CE nếu không thêm field type mới.

4. **`getOperatorForPayload` in store** — `filter.ts` gọi `getOperatorForPayload(operator)` khi user thay đổi operator. Hàm này (sau Phase 03) sẽ trả về `{operator: "exact", isNegation: true}` cho "not_exact". Store sau đó gọi `filter.updateConditionOperator(conditionId, "exact", true)`.

5. **Negation in expression** — Trong `filter-helpers.ts`, `_updateCondition` nhận `isNegation`. Cần verify rằng khi `isNegation=true`, condition được wrap trong NOT group trong internal expression format.

6. **`FilterValueInput` dispatch** — Component `filter-value-input/root.tsx` dispatch dựa trên `filterFieldConfig.type`:
   - `FILTER_FIELD_TYPE.DATE` → `SingleDateFilterValueInput`
   - `FILTER_FIELD_TYPE.DATE_RANGE` → `DateRangeFilterValueInput`
   - `FILTER_FIELD_TYPE.SINGLE_SELECT` → `SingleSelectFilterValueInput`
   - `FILTER_FIELD_TYPE.MULTI_SELECT` → `MultiSelectFilterValueInput`

   Vì `gt` và `lt` được map sang `TDateFilterFieldConfig` (type: DATE), chúng sẽ tự động dùng `SingleDateFilterValueInput`. ✅

---

## Implementation Steps

### Step 1: Verify FilterValueInput dispatch (no change likely needed)

**File**: `apps/web/core/components/rich-filters/filter-value-input/root.tsx`

Trace lại dispatch logic:

- `getOperatorConfig(condition.operator)` → trả về config cho operator đang chọn
- Config type → dispatch đến đúng component

Với `gt` → config type là `DATE` → `SingleDateFilterValueInput`.
Với `not_exact` (date field) → config type là `DATE` → `SingleDateFilterValueInput`. ✅

**Action**: Đọc file, confirm không cần thay đổi.

<!-- Updated: Validation Session 1 - Negation must be handled in toExternal adapter, NOT in _updateCondition / internal expression tree -->

### Step 2: Verify `updateConditionOperator` xử lý negation

**File**: `packages/shared-state/src/store/rich-filters/filter.ts`

Tìm `updateConditionOperator`:

```typescript
updateConditionOperator(conditionId, operator, isNegation) {
  const shouldResetValue = this._shouldResetValueOnOperatorChange(operator, isNegation);
  const updatedExpression = this.helper.restructureExpressionForOperatorChange(
    this.expression,
    conditionId,
    operator,
    isNegation,
    shouldResetValue
  );
  // ...
}
```

Check `_shouldResetValueOnOperatorChange`:

- Khi chuyển từ `in` (multi-select) sang `not_exact` (single select), value phải reset
- Khi chuyển từ `exact` sang `not_exact`, value có thể giữ nguyên

### Step 3: Verify internal expression format cho negation

**File**: `packages/shared-state/src/store/rich-filters/filter-helpers.ts`

`_updateCondition` hiện truyền `_isNegation` parameter nhưng không sử dụng (tên có `_` prefix). Cần verify:

1. Nếu architecture dùng `isNegation` để wrap condition trong NOT group trong expression tree → cần implement
2. Nếu architecture giữ `not_exact` as-is trong expression tree và chỉ convert khi serialize → cần implement serialize

**Khả năng cao**: Architecture hiện tại đã có `filter_backend.py NOT wrapper` → frontend nên convert `not_exact` → `{"not": {...exact...}}` khi build payload (trong adapter/serializer), KHÔNG phải trong internal expression.

### Step 4: Verify/Update Serialization in filter.ts

<!-- Updated: Validation Session 3 - Negation serialization goes inside filter.ts toPayload/buildQuery, NOT a new file -->

**File**: `packages/shared-state/src/store/rich-filters/filter.ts`

Tìm phương thức `toPayload` hoặc `buildQuery` (hoặc equivalent serialization method):

```bash
grep -r "toPayload\|buildQuery\|toExternal\|serialize" packages/shared-state/src/store/rich-filters/ --include="*.ts"
```

Trong phương thức đó, thêm handling cho `not_exact`/`not_in`:

```typescript
// When operator is not_exact or not_in, wrap in NOT group
if (operator === "not_exact") {
  return { not: { [`${field}__exact`]: value } };
}
if (operator === "not_in") {
  return { not: { [`${field}__in`]: value } };
}
```

Nếu không tìm thấy phương thức tương đương, implement trực tiếp trong `filter.ts` — KHÔNG tạo file adapter mới.

### Step 5: Kiểm tra Filter dropdown operators hiển thị đúng

**File**: `apps/web/core/components/rich-filters/filter-item/root.tsx`

```typescript
const operatorOptions = filterConfig
  ?.getAllDisplayOperatorOptionsByValue(condition.value as TFilterValue)
  .map((option) => ({
    value: option.value,
    content: option.label, // ← sẽ hiển thị "after", "before", "is not"
    query: option.label.toLowerCase(),
  }));
```

`getAllDisplayOperatorOptionsByValue` đã iterate qua `allEnabledSupportedOperators` trong `FilterConfig`. Sau Phase 03, `getSupportedDateOperators()` bao gồm operators mới → chúng sẽ xuất hiện trong dropdown. ✅

### Step 6: i18n — Kiểm tra hard-coded strings

Tìm các string trong code cần được i18n:

```bash
grep -r '"is not"\|"after"\|"before"\|"greater than"\|"less than"' apps/web/ --include="*.tsx"
```

Labels của operators đến từ `OPERATOR_LABELS_MAP` (constants), không phải hardcoded trong component. Nếu constants không dùng `t()`, xem xét thêm translation keys sau.

---

## Post-Phase Checklist

- [ ] Date filter dropdown hiển thị: "is", "between", "greater than", "less than", "is not"
- [ ] State filter dropdown hiển thị: "is" hoặc "is any of" (và sau khi thêm config: "is not", "is not any of")
- [ ] Chọn "greater than" → hiển thị single date picker
- [ ] Chọn "less than" → hiển thị single date picker
- [ ] Chọn "is not" (date) → hiển thị single date picker
- [ ] Chọn "is not" (state/select) → hiển thị single select dropdown
- [ ] Adapter `toExternal` convert `not_exact` → `{"not": {...exact...}}`
- [ ] Adapter `toExternal` convert `not_in` → `{"not": {...in...}}`
- [ ] Adapter `toExternal` convert `gt` → `{"field__gt": value}`
- [ ] Adapter `toExternal` convert `lt` → `{"field__lt": value}`
- [ ] End-to-end test: Set "start_date after 2025-01-01", apply → API gọi với `start_date__gt`
- [ ] End-to-end test: Set "state is not Done", apply → API gọi với `{"not": {"state_id__exact": "..."}}`
- [ ] `pnpm check:lint` không lỗi
- [ ] TypeScript không lỗi trong affected files

---

## Success Criteria

- UI filter hiển thị đầy đủ 5+ operators cho date fields
- UI filter hiển thị "is not" / "is not any of" cho select fields (khi config enable)
- Payload gửi backend đúng format, backend trả về data filtered đúng
- Không regressions với các filters hiện có ("is", "is any of", "between")

---

## Potential Issues & Mitigations

| Issue                                                   | Mitigation                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `_isNegation` param bị ignore trong `_updateCondition`  | Implement serialize/adapter logic thay vì internal tree                     |
| `singleValueOperator` cho `not_in` config               | Set `singleValueOperator = NOT_EXACT` trong `TMultiSelectFilterFieldConfig` |
| Value reset logic (multi→single operator)               | Implement trong `_shouldResetValueOnOperatorChange`                         |
| Filter config chưa expose `not_exact` cho select fields | Cập nhật factory helpers (Phase 03 Step 3)                                  |
