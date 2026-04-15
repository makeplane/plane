# Phase 01: Types — Operators & Field Types

## Overview

Thêm các operators mới (`not_exact`, `not_in`, `gt`, `lt`) và field-types tương ứng vào `packages/types`.
Đây là nền tảng type-safe cho toàn bộ hệ thống rich-filter.

**Priority**: Cao — các phase sau đều phụ thuộc vào phase này  
**Status**: ⏳ Pending

---

## Requirements

### Functional

- Thêm 4 operators mới vào `EXTENDED_EQUALITY_OPERATOR` và `EXTENDED_COMPARISON_OPERATOR`
- Đảm bảo TypeScript nhận diện trong `TSupportedOperators` union
- `NOT_EXACT`, `NOT_IN` → semantics negation (sẽ được convert ở adapter layer)
- `GT`, `LT` → semantics greater than / less than (áp dụng cho date)

### Non-functional

- Không phá vỡ `TCoreSupportedOperators` — chỉ extend `extended.ts`
- Các type map phải consistent (operator → config type)

---

## Related Code Files

### Modify:

- `packages/types/src/rich-filters/operators/extended.ts`
- `packages/types/src/rich-filters/operators/index.ts`
- `packages/types/src/rich-filters/operator-configs/extended.ts`
- `packages/types/src/rich-filters/field-types/extended.ts`
- `packages/types/src/rich-filters/field-types/index.ts` (FILTER_FIELD_TYPE composed)

---

## Embedded Rules

1. **Extended pattern** — Luôn thêm operators mới vào `extended.ts`, KHÔNG thêm vào `core.ts`. Core là upstream Plane OSS, extended là CE/SHB customization.

2. **Type composition** — `index.ts` ở mỗi layer đã compose core + extended tự động. Chỉ cần update `extended.ts`, không cần chỉnh `index.ts` trừ khi cần thêm `MULTI_VALUE_OPERATORS`.

3. **MULTI_VALUE_OPERATORS** — Nếu operator nhận nhiều giá trị, phải thêm vào `EXTENDED_MULTI_VALUE_OPERATORS` array trong `operators/extended.ts`. Hiện `RANGE` và `IN` đã có trong core.

4. **`not_exact` / `not_in` semantics** — Đây là operators hiển thị (display operators). Ở layer adapter, chúng sẽ được chuyển thành `{"not": {...}}` wrapper khi gửi lên backend. Do đó KHÔNG thêm chúng vào `MULTI_VALUE_OPERATORS`.

---

## Implementation Steps

### Step 1: Thêm operators vào `extended.ts`

**File**: `packages/types/src/rich-filters/operators/extended.ts`

```typescript
export const EXTENDED_LOGICAL_OPERATOR = {} as const;

export const EXTENDED_EQUALITY_OPERATOR = {
  NOT_EXACT: "not_exact",
} as const;

export const EXTENDED_COLLECTION_OPERATOR = {
  NOT_IN: "not_in",
} as const;

export const EXTENDED_COMPARISON_OPERATOR = {
  GT: "gt",
  LT: "lt",
} as const;

// NOT_IN là multi-value (array of values)
export const EXTENDED_MULTI_VALUE_OPERATORS = [EXTENDED_COLLECTION_OPERATOR.NOT_IN] as const;

export const EXTENDED_OPERATORS = {
  ...EXTENDED_EQUALITY_OPERATOR,
  ...EXTENDED_COLLECTION_OPERATOR,
  ...EXTENDED_COMPARISON_OPERATOR,
} as const;

export type TExtendedSupportedOperators = (typeof EXTENDED_OPERATORS)[keyof typeof EXTENDED_OPERATORS];
```

### Step 2: Cập nhật `operator-configs/extended.ts`

**File**: `packages/types/src/rich-filters/operator-configs/extended.ts`

Import types cần thiết từ `field-types` rồi map operators mới:

```typescript
import type { TFilterValue } from "../expression";
import type {
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
  TDateFilterFieldConfig,
} from "../field-types";
import type {
  EXTENDED_EQUALITY_OPERATOR,
  EXTENDED_COLLECTION_OPERATOR,
  EXTENDED_COMPARISON_OPERATOR,
} from "../operators";

// not_exact: nhận 1 giá trị (single select hoặc date)
export type TExtendedNotExactOperatorConfigs =
  | TSingleSelectFilterFieldConfig<TFilterValue>
  | TDateFilterFieldConfig<TFilterValue>;

// not_in: nhận nhiều giá trị (multi-select), singleValueOperator = NOT_EXACT
// Updated: Validation Session 3 - singleValueOperator must be declared at type level in Phase 01
export type TExtendedNotInOperatorConfigs = TMultiSelectFilterFieldConfig<TFilterValue> & {
  singleValueOperator: typeof EXTENDED_EQUALITY_OPERATOR.NOT_EXACT;
};

// gt / lt: nhận 1 ngày (date single)
export type TExtendedGtOperatorConfigs = TDateFilterFieldConfig<TFilterValue>;
export type TExtendedLtOperatorConfigs = TDateFilterFieldConfig<TFilterValue>;

// Existing ranges (không thay đổi)
export type TExtendedExactOperatorConfigs = never;
export type TExtendedInOperatorConfigs = never;
export type TExtendedRangeOperatorConfigs = never;

export type TExtendedOperatorSpecificConfigs = {
  [EXTENDED_EQUALITY_OPERATOR.NOT_EXACT]: TExtendedNotExactOperatorConfigs;
  [EXTENDED_COLLECTION_OPERATOR.NOT_IN]: TExtendedNotInOperatorConfigs;
  [EXTENDED_COMPARISON_OPERATOR.GT]: TExtendedGtOperatorConfigs;
  [EXTENDED_COMPARISON_OPERATOR.LT]: TExtendedLtOperatorConfigs;
};
```

> ⚠️ **Lưu ý**: `operator-configs/index.ts` đã compose `TExtendedOperatorSpecificConfigs` vào `TOperatorSpecificConfigs` qua `& TExtendedOperatorSpecificConfigs`. Sau khi thêm mapping ở extended, TypeScript sẽ enforce type cho `getOperatorConfig()` tự động.

### Step 3: Kiểm tra `field-types/extended.ts`

File hiện tại chỉ có `EXTENDED_FILTER_FIELD_TYPE = {}` và `TExtendedFilterFieldConfigs = never`.

- **KHÔNG cần** thêm field type mới — `gt` và `lt` đều dùng `FILTER_FIELD_TYPE.DATE` (single date picker).
- `not_exact` dùng `SINGLE_SELECT` hoặc `DATE`, `not_in` dùng `MULTI_SELECT` — đều đã có trong core.

File `field-types/extended.ts` **không cần thay đổi**.

### Step 4: Verify types compose đúng

Check `operators/index.ts` — tại `MULTI_VALUE_OPERATORS`:

```typescript
// packages/types/src/rich-filters/operators/index.ts
export const MULTI_VALUE_OPERATORS: ReadonlyArray<TSupportedOperators> = [
  ...CORE_MULTI_VALUE_OPERATORS,
  ...EXTENDED_MULTI_VALUE_OPERATORS, // ← sẽ bao gồm NOT_IN
] as const;
```

`EXTENDED_MULTI_VALUE_OPERATORS` export từ `extended.ts` sẽ tự động được pick up bởi `index.ts`. ✅

---

## Post-Phase Checklist

- [ ] `EXTENDED_EQUALITY_OPERATOR.NOT_EXACT = "not_exact"` tồn tại và được export
- [ ] `EXTENDED_COLLECTION_OPERATOR.NOT_IN = "not_in"` tồn tại và được export
- [ ] `EXTENDED_COMPARISON_OPERATOR.GT = "gt"` và `LT = "lt"` tồn tại
- [ ] `TExtendedSupportedOperators` include 4 operators mới
- [ ] `TSupportedOperators` (index.ts) include cả core lẫn extended
- [ ] `TExtendedOperatorSpecificConfigs` có đủ 4 mappings
- [ ] `EXTENDED_MULTI_VALUE_OPERATORS` chứa `NOT_IN`
- [ ] `TypeScript` compile không lỗi: `pnpm check:build` hoặc check types trong packages/types

---

## Success Criteria

- `TSupportedOperators` = `"exact" | "in" | "range" | "not_exact" | "not_in" | "gt" | "lt"`
- `TAllAvailableOperatorsForDisplay` = same (since it's `TSupportedOperators`)
- `TOperatorSpecificConfigs` có key cho cả 7 operators
- Không có TypeScript errors trong `packages/types`
