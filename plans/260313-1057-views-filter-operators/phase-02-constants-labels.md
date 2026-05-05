# Phase 02: Constants — Operator Labels

## Overview

Thêm labels hiển thị người dùng cho các operators mới vào `packages/constants`.
Labels này được hiển thị trong dropdown chọn operator trên UI filter.

**Priority**: Cao — UI phụ thuộc labels để hiển thị đúng  
**Dependencies**: Phase 01 phải hoàn thành trước  
**Status**: ⏳ Pending

---

## Requirements

<!-- Updated: Validation Session 1 - Use "greater than"/"less than" for gt/lt (not "after"/"before") -->

### Functional

- Operator `"not_exact"` → label `"is not"`
- Operator `"not_in"` → label `"is not any of"` (hoặc `"is none of"`)
- Operator `"gt"` → label `"greater than"`
- Operator `"lt"` → label `"less than"`
- i18n: thêm translation keys cho cả 4 operators vào `en/ko/vi` translation files trong cùng phase này <!-- Updated: Validation Session 2 - Add i18n keys now alongside constants -->

### Non-functional

- Chỉ thêm vào `extended.ts` — KHÔNG sửa `core.ts`
- `Record<TExtendedSupportedOperators, string>` phải type-safe

---

## Related Code Files

### Modify:

- `packages/constants/src/rich-filters/operator-labels/extended.ts`

---

## Embedded Rules

1. **Label convention** — Labels ngắn gọn, rõ ràng về ngữ nghĩa:
   - `"is not"` thay vì `"is not equal to"`
   - `"after"` thay vì `"greater than"` (ngữ cảnh date thân thiện hơn)
   - `"before"` thay vì `"less than"`
2. **Date-specific labels** — `DATE_OPERATOR_LABELS_MAP` dành riêng cho date fields. `gt` và `lt` chỉ áp dụng cho date nên cần thêm vào cả `EXTENDED_OPERATOR_LABELS_MAP` (generic) và `EXTENDED_DATE_OPERATOR_LABELS_MAP`.

3. **Negated labels** — `NEGATED_OPERATOR_LABELS_MAP` và `NEGATED_DATE_OPERATOR_LABELS_MAP` hiện đã là `Record<never, string>`. Với approach hiện tại (not_exact, not_in là operators riêng biệt thay vì "negated versions"), KHÔNG cần thêm vào negated maps.

---

## Implementation Steps

### Step 1: Cập nhật `operator-labels/extended.ts`

**File**: `packages/constants/src/rich-filters/operator-labels/extended.ts`

```typescript
import type { TExtendedSupportedOperators } from "@plane/types";
import { EXTENDED_EQUALITY_OPERATOR, EXTENDED_COLLECTION_OPERATOR, EXTENDED_COMPARISON_OPERATOR } from "@plane/types";

/**
 * Extended operator labels — generic labels for all field types
 */
export const EXTENDED_OPERATOR_LABELS_MAP: Record<TExtendedSupportedOperators, string> = {
  [EXTENDED_EQUALITY_OPERATOR.NOT_EXACT]: "is not",
  [EXTENDED_COLLECTION_OPERATOR.NOT_IN]: "is not any of",
  [EXTENDED_COMPARISON_OPERATOR.GT]: "greater than",
  [EXTENDED_COMPARISON_OPERATOR.LT]: "less than",
} as const;

/**
 * Extended date-specific operator labels
 * Used when the filter field is a date type
 */
export const EXTENDED_DATE_OPERATOR_LABELS_MAP: Record<TExtendedSupportedOperators, string> = {
  [EXTENDED_EQUALITY_OPERATOR.NOT_EXACT]: "is not",
  [EXTENDED_COLLECTION_OPERATOR.NOT_IN]: "is not any of",
  [EXTENDED_COMPARISON_OPERATOR.GT]: "greater than",
  [EXTENDED_COMPARISON_OPERATOR.LT]: "less than",
} as const;

/**
 * Negated operator labels — not used with this approach
 */
export const NEGATED_OPERATOR_LABELS_MAP: Record<never, string> = {} as const;

/**
 * Negated date operator labels — not used with this approach
 */
export const NEGATED_DATE_OPERATOR_LABELS_MAP: Record<never, string> = {} as const;
```

> **Note về date labels**: `"after"` và `"before"` thân thiện hơn về ngữ nghĩa với người dùng khi áp dụng cho ngày tháng. Nếu muốn label chính xác hơn cho non-date fields, có thể điều chỉnh sau.

---

## Post-Phase Checklist

- [ ] `EXTENDED_OPERATOR_LABELS_MAP` có đủ 4 keys mới (`not_exact`, `not_in`, `gt`, `lt`)
- [ ] `EXTENDED_DATE_OPERATOR_LABELS_MAP` có đủ 4 keys mới
- [ ] TypeScript không báo lỗi thiếu keys trong `Record<TExtendedSupportedOperators, string>`
- [ ] `OPERATOR_LABELS_MAP` (index.ts) compose đúng (spread extended vào)
- [ ] `DATE_OPERATOR_LABELS_MAP` (index.ts) compose đúng
- [ ] Build `packages/constants` không lỗi

---

## Success Criteria

- UI dropdown operator hiển thị: "is", "is any of", "between", "is not", "is not any of", "greater than", "less than"
- Gọi `getOperatorLabel("not_exact")` trả về `"is not"`
- Gọi `getDateOperatorLabel("gt")` trả về `"greater than"`
