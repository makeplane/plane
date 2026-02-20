# Code Review: Widget Config Modal Select Fix

**Reviewer:** code-reviewer
**Date:** 2026-02-15
**Commit Context:** Fix Dashboard Pro widget config modal dropdown interaction bug

---

## Scope

- **Files Changed:** 1
  - `apps/web/core/components/dashboards/config/basic-settings-section.tsx`
- **LOC Changed:** ~20 lines (replaced CustomSelect with native `<select>`)
- **Focus:** Bug fix - Headless UI Dialog focus trap conflict with CustomSelect dropdown

---

## Overall Assessment

**Rating: 8.5/10**

This is a **pragmatic, well-targeted fix** that correctly addresses a real Dialog focus trap issue. The change is minimal, focused, and solves the immediate UX problem. Build passes successfully with no type errors or linting issues.

**Strengths:**

- Correctly identifies root cause (Headless UI Dialog vs portaled Combobox)
- Minimal, surgical change
- Maintains form validation behavior
- Consistent styling with design system tokens
- TypeScript-safe implementation

**Areas for Improvement:**

- Missing placeholder/default option handling
- Accessibility regression (keyboard nav, ARIA attrs)
- Styling could be extracted to reusable pattern
- No visual feedback for disabled/loading states

---

## Critical Issues

**None** - No blocking security, data loss, or breaking changes.

---

## High Priority

### 1. Missing Default/Placeholder Option

**Issue:** Native `<select>` has no empty placeholder option. First option auto-selected on render, potentially hiding validation errors.

**Current Behavior:**

```tsx
<select value={field.value}>
  {ANALYTICS_CHART_PROPERTY_OPTIONS.map((option) => (
    <option key={option.key} value={option.key}>
      {option.label}
    </option>
  ))}
</select>
```

**Risk:** If `field.value` is `undefined` or empty string initially, browser auto-selects first option silently. Validation may not trigger until user explicitly changes selection.

**Recommendation:**

```tsx
<select value={field.value || ""}>
  <option value="" disabled>
    Select property
  </option>
  {ANALYTICS_CHART_PROPERTY_OPTIONS.map((option) => (
    <option key={option.key} value={option.key}>
      {option.label}
    </option>
  ))}
</select>
```

**Verification Needed:**

- Check `defaultValues` in `widget-config-modal.tsx` (lines 92-102)
- Current defaults: `chart_property: "priority"`, `chart_metric: "count"`
- Since defaults exist, auto-selection is intentional, but empty state handling unclear for edge cases

---

### 2. Accessibility Regression

**Issue:** Lost keyboard navigation and screen reader features from Headless UI CustomSelect.

**What's Missing:**

- No `aria-label` or `aria-describedby` linking to error messages
- No visual focus indicators beyond browser defaults
- No connection between error message and select element for assistive tech

**Current Error Display:**

```tsx
{
  errors.chart_property && <p className="mt-1 text-xs text-red-500">{errors.chart_property.message}</p>;
}
```

**Recommendation:**

```tsx
<select
  id="chart_property"
  value={field.value || ""}
  onChange={(e) => field.onChange(e.target.value)}
  aria-invalid={!!errors.chart_property}
  aria-describedby={errors.chart_property ? "chart_property-error" : undefined}
  className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 outline-none focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/20"
>
  {/* options */}
</select>;

{
  errors.chart_property && (
    <p id="chart_property-error" className="mt-1 text-xs text-red-500" role="alert">
      {errors.chart_property.message}
    </p>
  );
}
```

---

## Medium Priority

### 3. Code Duplication - Extract Reusable Component

**Issue:** Identical `<select>` blocks for `chart_property` and `chart_metric` (lines 57-67, 87-97). If another dropdown is needed, pattern will repeat.

**Impact:** Maintainability - future style/accessibility fixes need updating in multiple places.

**Recommendation:** Extract `FormSelect` component.

```tsx
// form-select.tsx
interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ key: string; label: string }>;
  error?: string;
  id: string;
  placeholder?: string;
  required?: boolean;
}

export const FormSelect = ({
  value,
  onChange,
  options,
  error,
  id,
  placeholder = "Select option",
  required = false,
}: FormSelectProps) => (
  <div>
    <select
      id={id}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 outline-none focus:border-custom-primary-100"
    >
      {!required && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p id={`${id}-error`} className="mt-1 text-xs text-red-500" role="alert">
        {error}
      </p>
    )}
  </div>
);
```

**Usage:**

```tsx
<Controller
  name="chart_property"
  control={control}
  rules={{ required: "Property is required" }}
  render={({ field }) => (
    <FormSelect
      id="chart_property"
      value={field.value}
      onChange={field.onChange}
      options={ANALYTICS_CHART_PROPERTY_OPTIONS}
      error={errors.chart_property?.message}
      placeholder="Select property"
    />
  )}
/>
```

---

### 4. Styling Consistency Check

**Issue:** Inline className may diverge from other form inputs in the project.

**Current Input Style (lines 34-38):**

```tsx
<Input {...field} placeholder="Issues by Priority" hasError={!!errors.title} className="w-full" />
```

**Current Select Style (lines 60):**

```tsx
className =
  "w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 outline-none focus:border-custom-primary-100";
```

**Observation:** `Input` component from `@plane/ui` likely uses similar tokens internally. Verified by checking other components using native `input[type="range"]` in `style-settings-section.tsx` (lines 60-69).

**Verification:** Check if `Input` component source has reusable style constants.

**Recommendation:** Extract shared form input classes to `@plane/utils` or Tailwind config if not already done.

---

## Low Priority

### 5. No Disabled State Styling

**Observation:** If select is disabled in future (e.g., loading state), no explicit `disabled:` Tailwind classes.

**Current:**

```tsx
className = "... focus:border-custom-primary-100";
```

**Suggestion:**

```tsx
className = "... focus:border-custom-primary-100 disabled:cursor-not-allowed disabled:opacity-50";
```

---

### 6. Browser Compatibility - Native Select Styling

**Issue:** Custom styling for native `<select>` has limited cross-browser support.

**Context:** Current styling uses `border`, `bg`, `padding`, `text-sm`. These work universally, but arrow icon customization (not attempted here) is inconsistent across browsers.

**Status:** **Not an issue** - current implementation doesn't customize dropdown arrow, relies on browser defaults.

**Note:** If custom arrow needed in future, consider using `appearance-none` with custom SVG icon, but this adds complexity (see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#styling_with_css)).

---

## Edge Cases Found by Scouting

### 7. Empty Options Array Handling

**Scenario:** What if `ANALYTICS_CHART_PROPERTY_OPTIONS` is empty due to data loading error?

**Current Behavior:** Renders empty `<select>`, validation fails silently.

**Recommendation:** Add defensive check.

```tsx
{
  ANALYTICS_CHART_PROPERTY_OPTIONS.length === 0 ? (
    <p className="text-sm text-custom-text-300">No options available</p>
  ) : (
    <select>{/* ... */}</select>
  );
}
```

**Likelihood:** Low - constants are hardcoded, but good defensive pattern.

---

### 8. React Hook Form Controller Integration - Event Handler Type Safety

**Issue:** `onChange` handler receives `ChangeEvent<HTMLSelectElement>`, not raw string.

**Current Implementation (line 59):**

```tsx
onChange={(e) => field.onChange(e.target.value)}
```

**Analysis:** ✅ **Correct** - extracts `e.target.value` (string) before passing to `field.onChange`.

**Previous CustomSelect Implementation:**

```tsx
onChange={field.onChange}
```

**Why Changed:** CustomSelect's `onChange` callback passed value directly. Native select passes event object.

**Type Safety:** ✅ **Verified** - `e.target.value` returns `string`, matches `field.onChange` expected type.

---

### 9. Form Reset Behavior

**Scenario:** User opens modal, changes selects, clicks Cancel. Form resets to defaults.

**Code Path:** `widget-config-modal.tsx` lines 167-171:

```tsx
const handleClose = () => {
  reset();
  setActiveTab("type");
  onClose();
};
```

**Verification:** Native `<select>` controlled by `value={field.value}`. When `reset()` called, `field.value` updates to `defaultValues`.

**Status:** ✅ **Works as expected** - no issues found.

---

### 10. Tab Navigation Flow

**Scenario:** User in "Basic" tab, interacts with select, navigates to "Style" tab.

**Current Behavior:** Form state persists across tabs (shared `control` from `useForm`).

**Verification:** `widget-config-modal.tsx` lines 218-234 conditionally renders sections based on `activeTab`, but all use same `control`.

**Status:** ✅ **No issues** - state management correct.

---

## Positive Observations

1. **Root Cause Identified Correctly** - Dialog focus trap + portaled Combobox is well-known Headless UI issue. Native select is appropriate solution.

2. **Consistent Design Tokens** - Uses `custom-border-200`, `custom-background-100`, `custom-text-100` matching Plane design system.

3. **Minimal Scope** - Only changed affected file, didn't over-engineer or refactor unrelated code.

4. **TypeScript Safety** - No `any` types introduced, proper event handling.

5. **Build Success** - No compilation errors, linting passes (verified via `npm run build`).

6. **Functional Parity** - Maintains validation rules (`required: "Property is required"`), error display, controlled component pattern.

---

## Recommended Actions

### Immediate (Before Merge)

1. **Add placeholder option** to handle empty/undefined initial values gracefully
2. **Add ARIA attributes** (`aria-invalid`, `aria-describedby`) for accessibility
3. **Add focus ring** via `focus:ring-2 focus:ring-custom-primary-100/20` for better UX

### Short-term (Next Sprint)

4. **Extract FormSelect component** to eliminate duplication (if more selects planned)
5. **Add disabled state styles** for future loading/disabled scenarios
6. **Audit other modals** for similar Headless UI Dialog + portaled component conflicts

### Long-term (Backlog)

7. **Design system audit** - document when to use native vs CustomSelect
8. **Accessibility testing** - screen reader validation across Dashboard Pro features

---

## Metrics

- **Type Safety:** ✅ 100% - No `any` types, proper event handling
- **Build Status:** ✅ Pass - No TypeScript or linting errors
- **Code Duplication:** ⚠️ Medium - Two identical select blocks
- **Accessibility:** ⚠️ Needs improvement - Missing ARIA attributes
- **Test Coverage:** ❓ Unknown - No unit tests for this component visible

---

## Unresolved Questions

1. **Is there a design system guideline** for when to use native `<select>` vs `CustomSelect`? Should this be documented to prevent future confusion?

2. **Are there other Headless UI modals** in the codebase with similar portaled component conflicts? Should we audit and proactively fix?

3. **Is automated accessibility testing** (e.g., `axe-core`, `jest-axe`) part of CI/CD? This would catch missing ARIA attributes.

4. **What is the form's behavior on initial load** if backend data is delayed? Do selects show loading state or fallback values?

5. **Browser support matrix** - Does Plane officially support browsers where native `<select>` styling differs significantly (e.g., Safari vs Chrome)?
