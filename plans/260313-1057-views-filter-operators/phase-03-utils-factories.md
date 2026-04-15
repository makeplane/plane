# Phase 03: Utils — Factory Functions & Adapter

## Overview

Cập nhật factory functions trong `packages/utils` để các operators mới có thể được sử dụng
khi tạo filter config cho date fields. Đồng thời xử lý adapter logic để convert
`not_exact`/`not_in` sang format backend (`{"not": {...}}`).

**Priority**: Cao  
**Dependencies**: Phase 01 (types) + Phase 02 (labels)  
**Status**: ⏳ Pending

---

## Requirements

<!-- Updated: Validation Session 1 - All select+date fields must expose NOT_EXACT/NOT_IN; negation in adapter toExternal, not _updateCondition -->

### Functional

- `getSupportedDateOperators()` phải bao gồm `gt` và `lt` operators
- `not_exact` và `not_in` được thêm vào **tất cả** select + date field types (single-select, multi-select, date)
- `getOperatorForPayload()` phải xử lý `not_exact` → `{operator: "exact", isNegation: true}`
- `getOperatorForPayload()` phải xử lý `not_in` → `{operator: "in", isNegation: true}`
- `gt` và `lt` là independent operators (không phải negation) → pass through
- `_shouldResetValueOnOperatorChange` phải return `true` khi chuyển multi→single operator (e.g. `in`→`not_exact`, `not_in`→`exact`, `in`→`exact`) <!-- Updated: Validation Session 2 - Reset value on multi→single transition -->
- Single-select fields: cần thêm option `not_exact`
- Multi-select fields: cần thêm option `not_in`

### Non-functional

- Backward compatible — existing filter configs không bị ảnh hưởng
- `getSupportedDateOperators` vẫn trả về `Map<operator, config>`

---

## Related Code Files

### Modify:

- `packages/utils/src/rich-filters/factories/configs/properties/shared.ts`
- `packages/utils/src/rich-filters/operators/core.ts` (hàm `getOperatorForPayload`)
- `packages/utils/src/rich-filters/factories/configs/core.ts` (nếu cần thêm `getGtDatePickerConfig`, `getLtDatePickerConfig`)

### Reference (không modify):

- `packages/utils/src/rich-filters/factories/configs/properties/date.ts`

---

## Embedded Rules

1. **`getOperatorForPayload` pattern** — Hàm này convert một display operator (có thể là `not_exact`) sang `{operator, isNegation}` tuple. Backend `filter_backend.py` đã hỗ trợ `{"not": {field: value}}` wrapper. Frontend sẽ gọi `getOperatorForPayload` khi build payload.

2. **`getSupportedDateOperators` returns `TOperatorConfigMap`** — `Map<TSupportedOperators, config>`. Cần thêm entries cho `GT` và `LT`. Mỗi entry dùng `TDateFilterFieldConfig` với `type: DATE`.

3. **`NOT_EXACT` trong single-select** — Thêm vào factory helper `getSingleSelectFilterConfig` (nếu có) hoặc tạo helper riêng. User sẽ thấy cả "is" và "is not" trong dropdown.

4. **`NOT_IN` trong multi-select** — Tương tự `NOT_EXACT`. Config của `not_in` cũng là `TMultiSelectFilterFieldConfig` với `singleValueOperator = NOT_EXACT`.

---

## Implementation Steps

### Step 1: Cập nhật `getOperatorForPayload` trong `operators/core.ts`

<!-- Updated: Validation Session 3 - If getOperatorForPayload not found, create in packages/utils/src/rich-filters/operators/core.ts -->

**File**: `packages/utils/src/rich-filters/operators/core.ts`

Grep để tìm trước:

```bash
grep -r "getOperatorForPayload" packages/
```

Nếu không tìm thấy → **tạo mới** trong `packages/utils/src/rich-filters/operators/core.ts`.
Nếu tìm thấy ở nơi khác → cập nhật tại đó và export từ `packages/utils` nếu cần.

```typescript
// Ánh xạ display operator → {real operator, isNegation}
export const getOperatorForPayload = (
  displayOperator: TAllAvailableOperatorsForDisplay
): { operator: TSupportedOperators; isNegation: boolean } => {
  switch (displayOperator) {
    case EXTENDED_EQUALITY_OPERATOR.NOT_EXACT:
      return { operator: EQUALITY_OPERATOR.EXACT, isNegation: true };
    case EXTENDED_COLLECTION_OPERATOR.NOT_IN:
      return { operator: COLLECTION_OPERATOR.IN, isNegation: true };
    default:
      // gt, lt, exact, in, range → no negation
      return { operator: displayOperator as TSupportedOperators, isNegation: false };
  }
};
```

> **Quan trọng**: Trước khi implement, grep để tìm location thực sự của `getOperatorForPayload`.

### Step 2: Cập nhật `getSupportedDateOperators` trong `properties/shared.ts`

**File**: `packages/utils/src/rich-filters/factories/configs/properties/shared.ts`

```typescript
import {
  EQUALITY_OPERATOR,
  COMPARISON_OPERATOR,
  EXTENDED_COMPARISON_OPERATOR,
  EXTENDED_EQUALITY_OPERATOR,
} from "@plane/types";

export const getSupportedDateOperators = (params: TCreateDateFilterParams): TOperatorConfigMap =>
  new Map([
    // Existing
    createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, params, (p) => getDatePickerConfig(p)),
    createOperatorConfigEntry(COMPARISON_OPERATOR.RANGE, params, (p) => getDateRangePickerConfig(p)),
    // New
    createOperatorConfigEntry(EXTENDED_COMPARISON_OPERATOR.GT, params, (p) => getDatePickerConfig(p)),
    createOperatorConfigEntry(EXTENDED_COMPARISON_OPERATOR.LT, params, (p) => getDatePickerConfig(p)),
    // "is not" for date (single date)
    createOperatorConfigEntry(EXTENDED_EQUALITY_OPERATOR.NOT_EXACT, params, (p) => getDatePickerConfig(p)),
  ]);
```

> **Lưu ý**: `GT` và `LT` dùng `getDatePickerConfig` (single date picker, `type: DATE`) — KHÔNG phải date range.

### Step 3: Thêm `not_exact` vào single-select helpers (nếu cần)

Tìm helper `getSingleSelectOperators` hoặc `getSupportedSingleSelectOperators`:

```bash
grep -r "getSupportedSingleSelectOperators\|getSingleSelectConfig" packages/utils/src/rich-filters/
```

Nếu có, thêm `NOT_EXACT` vào. Nếu không, mỗi filter config phải tự thêm vào `supportedOperatorConfigsMap` khi khai báo.

### Step 4: Thêm `not_in` vào multi-select helpers

Tương tự step 3 nhưng cho `NOT_IN`.

---

## Post-Phase Checklist

- [ ] `getOperatorForPayload("not_exact")` → `{ operator: "exact", isNegation: true }`
- [ ] `getOperatorForPayload("not_in")` → `{ operator: "in", isNegation: true }`
- [ ] `getOperatorForPayload("gt")` → `{ operator: "gt", isNegation: false }`
- [ ] `getOperatorForPayload("lt")` → `{ operator: "lt", isNegation: false }`
- [ ] `getSupportedDateOperators()` trả về Map có keys: `exact`, `range`, `gt`, `lt`, `not_exact`
- [ ] Filter `FilterConfig.getOperatorConfig("gt")` trả về `TDateFilterFieldConfig`
- [ ] Filter `FilterConfig.getOperatorConfig("not_exact")` trả về `TSingleSelectFilterFieldConfig` hoặc `TDateFilterFieldConfig`
- [ ] Build `packages/utils` không lỗi

---

## Success Criteria

- Date filter dropdown hiển thị options: "is", "between", "greater than", "less than", "is not"
- Single-select dropdown hiển thị: "is", "is not" (all select fields)
- Multi-select dropdown hiển thị: "is any of", "is not any of" (all multi-select fields)
- Khi chọn "is not", UI hiển thị đúng value input (single select / date picker)
