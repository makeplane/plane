# Palette's Journal - UX & Accessibility Learnings

## 2025-05-18 - DragHandle Accessibility Pattern
**Learning:** Shared UI primitive controls (like `DragHandle`) across sidebar items, widgets, and lists often lack default `aria-label`s and `focus-visible` styling, rendering them inaccessible to screen readers and keyboard users.
**Action:** When building or updating icon-only utility components in `@plane/ui`, always provide an accessible default `aria-label` (e.g. "Drag to reorder"), allow custom `aria-label` overrides, and include `focus-visible:ring-*` styles.
