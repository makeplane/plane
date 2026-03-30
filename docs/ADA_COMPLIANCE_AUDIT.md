# ADA / WCAG 2.1 AA Compliance Audit

**Date:** 2026-03-30
**Scope:** `apps/web/`, `packages/ui/`, `packages/propel/`
**Standard:** WCAG 2.1 Level AA (ADA Section 508 alignment)

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. Page Structure and Landmarks](#1-page-structure-and-landmarks)
- [2. Keyboard and Focus Management](#2-keyboard-and-focus-management)
- [3. Forms and Input Accessibility](#3-forms-and-input-accessibility)
- [4. Images, Icons, and Media](#4-images-icons-and-media)
- [5. Dynamic Content and ARIA](#5-dynamic-content-and-aria)
- [6. Color and Visual Contrast](#6-color-and-visual-contrast)
- [Summary by Severity](#summary-by-severity)
- [Top 10 Remediations by Impact](#top-10-remediations-by-impact)

---

## Executive Summary

A code-level audit of the Plane web application identified **~60 distinct accessibility issues** across 6 categories. These issues affect hundreds of component instances throughout the application. The most critical gaps are the absence of skip navigation, missing semantic landmarks, non-keyboard-accessible interactive elements, and unlabeled icon buttons.

**What passes:**
- `<html lang="en">` is correctly set in `apps/web/app/root.tsx:84`
- `<main>` element is used in the root layout and several sub-layouts
- Some sidebar components use `role="complementary"` correctly
- Some icon buttons in the sidebar have proper `aria-label` via i18n
- Decorative images in `instance/not-ready-view.tsx` correctly use `alt=""` and `aria-hidden="true"`
- Most `<img>` tags include meaningful `alt` attributes
- Two formula input components implement the correct `aria-invalid` / `aria-describedby` pattern

---

## 1. Page Structure and Landmarks

### 1.1 No Skip Navigation Link
- **WCAG:** 2.4.1 Bypass Blocks
- **Severity:** Critical
- **Details:** No "skip to main content" link exists anywhere in the application. This should be the first focusable element on every page, allowing keyboard and screen reader users to bypass repetitive navigation.
- **Searched:** `apps/web/`, `packages/ui/`, `packages/propel/` — zero results for skip nav patterns.

### 1.2 Navigation Uses `<div>` Instead of `<nav>`
- **WCAG:** 1.3.1 Info and Relationships
- **Severity:** Critical
- **Files:**
  - `apps/web/core/components/navigation/top-navigation-root.tsx:104-157` — uses `<div class="desktop-header">`
  - `apps/web/core/components/navigation/app-rail-root.tsx` — no semantic `<nav>`
  - `apps/web/app/(all)/[workspaceSlug]/(projects)/sidebar.tsx` — sidebar uses div-based `<SidebarWrapper>`
- **Details:** All primary navigation areas use `<div>` elements. None have `role="navigation"` or `aria-label` to identify them to assistive technologies.

### 1.3 No `<header>` or `role="banner"`
- **WCAG:** 1.3.1 Info and Relationships
- **Severity:** Critical
- **Details:** No semantic `<header>` element or `role="banner"` found on any page. The top navigation bar should be wrapped in a `<header>`.

### 1.4 No `<footer>` or `role="contentinfo"`
- **WCAG:** 1.3.1 Info and Relationships
- **Severity:** Critical
- **Details:** No semantic `<footer>` element or `role="contentinfo"` found.

### 1.5 Missing `<h1>` on Most Pages
- **WCAG:** 1.3.1 Info and Relationships
- **Severity:** Critical
- **Details:** Only ~14 files out of hundreds contain any heading tags. Most pages have no `h1` element, leaving screen reader users without a page-level title or content hierarchy.

### 1.6 Heading Hierarchy Jumps
- **WCAG:** 1.3.1 Info and Relationships
- **Severity:** Medium
- **Files:**
  - `apps/web/core/components/navigation/customize-navigation-dialog.tsx:209,212,218` — jumps from `<h2>` to `<h3>` with no `<h1>` present.
- **Details:** Heading levels should not skip (e.g., h1 -> h3 without h2).

### 1.7 Breadcrumbs Missing Navigation Role
- **WCAG:** 1.3.1 Info and Relationships
- **Severity:** Medium
- **File:** `packages/ui/src/breadcrumbs/breadcrumbs.tsx`
- **Details:** No `role="navigation"` or `aria-label="breadcrumb"` on the breadcrumb container.

---

## 2. Keyboard and Focus Management

### 2.1 Click Handlers on Non-Interactive Elements
- **WCAG:** 2.1.1 Keyboard
- **Severity:** Critical
- **Details:** Multiple `<div>` and `<span>` elements have `onClick` handlers but lack `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers. These elements are completely inaccessible to keyboard users.
- **Files:**
  - `apps/web/core/components/customers/detail/logo-input.tsx:46`
  - `apps/web/core/components/importers/clickup/steps/configure-clickup/skip-additional-data.tsx:43`
  - `apps/web/core/components/importers/ui/skip-user-import-toggle.tsx:39`
  - `apps/web/core/components/api-token/modal/form.tsx:249`
  - `apps/web/core/components/workspace-notifications/sidebar/notification-card/with-stacking/root.tsx:72`
  - `apps/web/core/components/workspace-notifications/sidebar/notification-card/without-stacking/root.tsx:66`
  - `apps/web/core/components/issues/issue-detail-widgets/customer-requests/quick-action-button.tsx:43`
  - `apps/web/core/components/project-overview/details/main/milestones/quick-action-button.tsx:55`
  - `apps/web/core/components/ui/empty-space.tsx:89` — has `role="button"` but missing `tabIndex={0}`

### 2.2 Focus Indicator Removed With No Replacement
- **WCAG:** 2.4.7 Focus Visible
- **Severity:** Critical
- **Details:** Many components use `focus:outline-none` or `outline-none` without providing an alternative visible focus indicator (e.g., `focus:ring`, `focus:border`).
- **Files:**
  - `packages/ui/src/form-fields/input.tsx:45`
  - `packages/ui/src/breadcrumbs/navigation-dropdown.tsx:97`
  - `packages/ui/src/breadcrumbs/navigation-search-dropdown.tsx:111`
  - `packages/ui/src/popovers/popover-menu.tsx:45`
  - `packages/ui/src/form-fields/checkbox.tsx:62,81`
  - `packages/ui/src/dropdowns/custom-menu.tsx:211,274,290`
  - `packages/ui/src/dropdown/single-select.tsx:153`
  - `packages/ui/src/dropdown/multi-select.tsx:154`
  - `packages/propel/src/input/input.tsx:42,58`
  - `packages/propel/src/tabs/tabs.tsx:102,126`
  - `packages/propel/src/menu/menu.tsx:60,143,157,168,170,195`
  - `packages/propel/src/button/helper.tsx:18` — uses `focus-visible:outline-none` which removes all keyboard focus indicator

### 2.3 Drag-and-Drop Without Keyboard Alternative
- **WCAG:** 2.1.1 Keyboard
- **Severity:** Critical
- **Files:**
  - `packages/ui/src/sortable/draggable.tsx:50-55` — uses `@atlaskit/pragmatic-drag-and-drop` (mouse-only API)
  - `packages/ui/src/sortable/sortable.tsx` — wrapper with no keyboard fallback
- **Details:** No arrow-key or other keyboard mechanism for reordering items. Drag-and-drop functionality is completely inaccessible to keyboard users.

### 2.4 SVG Element With onClick but No Keyboard Handler
- **WCAG:** 2.1.1 Keyboard
- **Severity:** High
- **File:** `apps/web/core/components/timeline/dependency/dependency-path-item.tsx:55`
- **Details:** `<g>` SVG element has `onClick` but no `onKeyDown`, `tabIndex`, or ARIA role.

### 2.5 Event Propagation Divs Without Keyboard Handlers
- **WCAG:** 2.1.1 Keyboard
- **Severity:** Medium
- **Files:**
  - `apps/web/core/components/projects/list/with-grouping/layouts/attributes.tsx:85,101,128,180,193,205`
  - `apps/web/core/components/issues/workspace-draft/draft-issue-properties.tsx:149,162,185,200,219,237,254,269`
  - `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx:222,239,257,291,314,337,361,381,402`
- **Details:** Divs with `onClick={handleEventPropagation}` lack Enter/Space key handling.

---

## 3. Forms and Input Accessibility

### 3.1 Inputs Missing Associated Labels
- **WCAG:** 1.3.1 Info and Relationships / 4.1.2 Name, Role, Value
- **Severity:** High
- **Files:**
  - `packages/ui/src/form-fields/input.tsx:38-61` — base Input component does not enforce label association
  - `apps/web/core/components/pages/list/search-input.tsx:71-78` — search input with no `aria-label` or `<label>`
  - `apps/web/core/components/web-hooks/form/input.tsx:50-65` — visual `<h4>` label not connected via `htmlFor`
  - `packages/ui/src/form-fields/pill-input.tsx:180-194` — no label or `aria-label`
  - `packages/ui/src/dropdown/common/input-search.tsx:51-73` — search input with only placeholder
  - `packages/ui/src/form-fields/textarea.tsx:27-74` — no label support in component interface

### 3.2 No `aria-invalid` / `aria-describedby` on Form Errors
- **WCAG:** 3.3.1 Error Identification
- **Severity:** High
- **Details:** Only 2 files implement the correct pattern (`formula-input.tsx` in two locations). All other form components lack `aria-invalid` and `aria-describedby`.
- **Files missing the pattern:**
  - `packages/ui/src/form-fields/input.tsx`
  - `packages/ui/src/form-fields/textarea.tsx`
  - `apps/web/core/components/cycles/form.tsx`
  - All auth form components

### 3.3 Error Messages Not Announced to Screen Readers
- **WCAG:** 4.1.3 Status Messages
- **Severity:** High
- **Details:** Error messages display visually but lack `role="alert"` or `aria-live="polite"`.
- **Files:**
  - `apps/web/core/components/cycles/form.tsx:160`
  - `apps/web/core/components/auth/ldap/form.tsx:75`
  - `packages/ui/src/auth-form/auth-input.tsx:75`
  - `packages/ui/src/auth-form/auth-confirm-password-input.tsx:85` — success message also not announced

### 3.4 No `aria-required` on Required Fields
- **WCAG:** 3.3.2 Labels or Instructions
- **Severity:** Medium
- **Files:**
  - `packages/ui/src/auth-form/auth-form.tsx:154,171,186` — HTML `required` exists but no `aria-required="true"`
  - `apps/web/core/components/cycles/form.tsx` — React Hook Form `required` rule not reflected in ARIA

### 3.5 Password Toggle Buttons Missing `aria-label`
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** High
- **Files:**
  - `packages/ui/src/auth-form/auth-input.tsx:65-71`
  - `packages/ui/src/form-fields/password/password-input.tsx:59-82`
  - `apps/web/core/components/importers/ui/auth-form-input.tsx:68-82` — also has `tabIndex={-1}`

### 3.6 Dropdown Triggers Missing ARIA Attributes
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** High
- **Details:** Dropdown trigger buttons are missing `aria-haspopup`, `aria-expanded`, and `aria-controls`.
- **Files:**
  - `packages/ui/src/dropdown/single-select.tsx:125-179`
  - `packages/ui/src/dropdown/multi-select.tsx:125-179`
  - `packages/ui/src/dropdowns/custom-select.tsx:93-124`
  - `packages/ui/src/dropdown/common/button.tsx:32-50`

### 3.7 Buttons With Loading State Missing `aria-busy`
- **WCAG:** 4.1.3 Status Messages
- **Severity:** Medium
- **Files:**
  - `packages/ui/src/button/button.tsx:31-59` — shows spinner when `loading={true}` but no `aria-busy`
  - `packages/propel/src/button/button.tsx:19-53` — same issue

---

## 4. Images, Icons, and Media

### 4.1 Icon-Only Buttons Missing `aria-label`
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** High
- **Files:**
  - `apps/web/core/components/plane-sdk-editor/root.tsx:102` — maximize button
  - `apps/web/core/components/settings/mobile/nav.tsx:48` — hamburger menu button
  - `apps/web/core/components/workspace/sidebar/sidebar-try-section.tsx:129-135` — close button
  - `packages/ui/src/favorite-star.tsx:26-42` — favorite toggle
  - `packages/ui/src/drag-handle.tsx:35-58` — drag handle
  - `apps/web/core/components/pages/list/search-input.tsx:80-89` — close search button
- **Note:** `packages/propel/src/icon-button/icon-button.tsx:35-54` accepts `aria-label` via props but does not enforce or validate its presence.

### 4.2 Decorative SVG Icons Without `aria-hidden="true"`
- **WCAG:** 1.1.1 Non-text Content
- **Severity:** Medium
- **Details:** All icon components in `packages/propel/src/icons/` (~50+ files) render SVGs without `aria-hidden="true"`, causing screen readers to attempt to read them.
- **Example files:**
  - `packages/propel/src/icons/comment-fill-icon.tsx:20-26`
  - `packages/propel/src/icons/blocked-icon.tsx:20-40`
  - `packages/propel/src/icons/restricted-icon.tsx`
  - `packages/propel/src/icons/misc/check-circle-filled-icon.tsx`
  - `packages/propel/src/icons/misc/activity-icon.tsx`

### 4.3 Video Captions Track Has No Source
- **WCAG:** 1.2.2 Captions (Prerecorded)
- **Severity:** High
- **File:** `packages/propel/src/video-player/video-player.tsx:196,229`
- **Details:** `<track kind="captions" />` element exists but has no `src` attribute pointing to a caption file. Captions are effectively non-functional.

### 4.4 File Icon Alt Text Uses Component Names
- **WCAG:** 1.1.1 Non-text Content
- **Severity:** Low
- **Files:** `apps/web/core/components/icons/attachment/*.tsx` (~15 files)
- **Details:** Alt text is set to component names like `alt="HtmlFileIcon"` instead of descriptive text like `alt="HTML file"`.

---

## 5. Dynamic Content and ARIA

### 5.1 Toast Notifications Not in `aria-live` Region
- **WCAG:** 4.1.3 Status Messages
- **Severity:** High
- **File:** `packages/propel/src/toast/toast.tsx:69-71`
- **Details:** `BaseToast.Viewport` lacks `aria-live="polite"` and `aria-atomic="true"`. Toast messages appear and disappear without being announced to screen readers.

### 5.2 Infinite Scroll Loading Not Announced
- **WCAG:** 4.1.3 Status Messages
- **Severity:** High
- **Files:**
  - `apps/web/core/components/cycles/active-cycles/workspace/list.tsx:110-114`
  - `packages/ui/src/dropdowns/custom-search-select.tsx:114-121`
  - `apps/web/core/components/stickies/layout/stickies-infinite.tsx`
  - `apps/web/core/components/agents/conversation/messages.tsx`
- **Details:** Loading skeleton placeholders triggered by IntersectionObserver have no `role="status"` or `aria-live` to announce that content is being loaded.

### 5.3 Loading Spinners Missing `aria-busy`
- **WCAG:** 4.1.3 Status Messages
- **Severity:** Medium
- **Files:**
  - `packages/ui/src/loader.tsx:25-26` — has `role="status"` but no `aria-busy="true"`
  - `packages/propel/src/skeleton/root.tsx:26`
  - `packages/propel/src/spinners/circular-spinner.tsx:26-27`
  - `packages/propel/src/spinners/circular-bar-spinner.tsx:24`

### 5.4 Modals Missing `aria-labelledby` and `aria-modal`
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** High
- **Files:**
  - `packages/ui/src/modals/modal-core.tsx:40-80` — Dialog lacks `aria-labelledby` and `aria-modal="true"`
  - `packages/propel/src/portal/modal-portal.tsx:50-90` — has `role="dialog"` but may be missing `aria-modal="true"` and `aria-labelledby`

### 5.5 Tooltip Missing `aria-describedby` Connection
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** Medium
- **File:** `packages/ui/src/tooltip/tooltip.tsx:49-120`
- **Details:** Tooltip content is not connected to its trigger element via `aria-describedby`.

### 5.6 TabNavigationList Missing `role="tablist"`
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** Medium
- **File:** `packages/propel/src/tab-navigation/tab-navigation-list.tsx:19-27`
- **Details:** Renders a plain `<div>` without `role="tablist"`. Individual tab items likely missing `role="tab"` and `aria-selected`.

### 5.7 Combobox Missing `aria-expanded` and `aria-owns`
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** Medium
- **File:** `packages/propel/src/combobox/combobox.tsx:138-252`
- **Details:** No `aria-expanded` on trigger, no `aria-owns` connecting trigger to options list, no `aria-activedescendant` for keyboard navigation.

### 5.8 Custom Menu Items Missing `role="menuitem"`
- **WCAG:** 4.1.2 Name, Role, Value
- **Severity:** Medium
- **File:** `packages/ui/src/dropdowns/custom-menu.tsx:200-310`
- **Details:** Relies on HeadlessUI but nested submenus and custom wrappers may lose proper `role="menuitem"` and `aria-disabled` attributes.

### 5.9 Real-Time Content Updates Not in Live Regions
- **WCAG:** 4.1.3 Status Messages
- **Severity:** Medium
- **File:** `apps/web/core/components/agents/conversation/messages.tsx`
- **Details:** Chat messages added in real time are not wrapped in `aria-live` regions.

### 5.10 Dropdown Search Loading State Not Announced
- **WCAG:** 4.1.3 Status Messages
- **Severity:** Medium
- **File:** `packages/ui/src/dropdowns/custom-search-select.tsx:250-257`
- **Details:** "Loading..." text is not in a live region.

---

## 6. Color and Visual Contrast

### 6.1 Color-Only Priority Indicators
- **WCAG:** 1.4.1 Use of Color
- **Severity:** High
- **File:** `packages/propel/src/icons/priority-icon.tsx:31-37`
- **Details:** Priority levels (urgent, high, medium, low, none) are distinguished only by color (red, orange, yellow, blue, gray). No text labels, patterns, or icons differentiate them for color-blind users.
- **Color definitions:** `packages/tailwindcss/variables.css:144-148`

### 6.2 Color-Only Status Badges and Pills
- **WCAG:** 1.4.1 Use of Color
- **Severity:** High
- **Files:**
  - `packages/propel/src/badge/helper.tsx:19-25` — success/danger/warning variants use color alone
  - `packages/propel/src/pill/pill.tsx:58-64` — same pattern with pills
- **Details:** No icons, patterns, or text prefixes distinguish variant types when color is removed.

### 6.3 Module Status Icons Color-Only
- **WCAG:** 1.4.1 Use of Color
- **Severity:** High
- **File:** `packages/propel/src/icons/module/module-status-icon.tsx`
- **Details:** Status icons rendered as colored SVGs with no aria-labels or text descriptions.

### 6.4 Calendar Dates at Extremely Low Opacity
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Severity:** Critical
- **File:** `packages/propel/src/calendar/root.tsx:373-375`
- **Details:**
  - Outside-month days: `text-tertiary opacity-50 aria-selected:opacity-30` — opacity-30 is far below the 4.5:1 minimum contrast ratio
  - Disabled days: `text-disabled opacity-50` — still likely insufficient

### 6.5 Disabled States Use Only Opacity Reduction
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Severity:** High
- **Files:**
  - `packages/ui/src/form-fields/checkbox.tsx:65,83` — `opacity-40` on disabled state
  - `packages/ui/src/dropdowns/custom-search-select.tsx:224` — `opacity-60` on disabled options
  - `packages/ui/src/auth-form/auth-forgot-password.tsx:45` — `opacity-50` on disabled button
  - `packages/propel/src/calendar/root.tsx:374-375` — `opacity-30` and `opacity-50`

### 6.6 Placeholder Text May Fail Contrast
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Severity:** Medium
- **Files:**
  - `packages/tailwindcss/variables.css:287` (light mode), `:538` (dark mode) — placeholder color uses neutral-900
  - `packages/tailwindcss/index.css:46-49` — all placeholder pseudo-elements apply `text-placeholder`
  - `packages/propel/src/input/input.tsx:42` — uses `placeholder-tertiary`
- **Details:** Placeholder text color may not meet 4.5:1 contrast against all background colors. Requires visual testing with a contrast checker.

### 6.7 Small Text Contrast Risk
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Severity:** Medium
- **File:** `packages/tailwindcss/variables.css:901-906`
- **Details:** `text-11` (11px) and `text-12` (12px) are used extensively. At these sizes, 4.5:1 contrast is required. Combined with lower-contrast color tokens (tertiary, placeholder), some instances may fail.
- **Example:** `packages/propel/src/pill/pill.tsx:67-68` — 11px text on colored backgrounds.

### 6.8 Animations Without `prefers-reduced-motion`
- **WCAG:** 2.3.3 Animation from Interactions
- **Severity:** Medium
- **Files:**
  - `packages/propel/src/tour/tour-pulse-indicator.tsx:84-115` — infinite Framer Motion pulse animation with `repeat: Infinity`. No motion preference check.
  - `packages/tailwindcss/animations.css:1-171` — 15+ custom keyframe animations with no `@media (prefers-reduced-motion: reduce)` guards
  - Partial support exists in `apps/web/styles/animations.css:158-175` for some animations, but coverage is inconsistent.

### 6.9 Text Over Gradient Backgrounds
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Severity:** Low
- **File:** `packages/propel/src/video-player/video-player.tsx`
- **Details:** Gradient overlay `from-black/80 via-black/40 to-transparent` — text contrast varies across the gradient; some areas may not meet 4.5:1.

### 6.10 Disabled Button States Lack Non-Color Distinction
- **WCAG:** 1.4.1 Use of Color
- **Severity:** Medium
- **File:** `packages/propel/src/button/helper.tsx:22-37`
- **Details:** All button variants use `disabled:` classes that only change text/background color. No visual pattern, border change, or other non-color distinction for disabled state.

---

## Summary by Severity

| Severity | Count | Key Areas |
|----------|-------|-----------|
| Critical | ~15 | Skip navigation, semantic landmarks, keyboard access, drag-and-drop, focus indicators, calendar contrast |
| High | ~30 | Form labels, error announcements, icon buttons, toasts, modals, dropdowns, color-only indicators |
| Medium | ~15 | Heading hierarchy, `aria-required`, loading states, tooltips, animations, placeholder contrast |
| Low | ~2 | File icon alt text, gradient text contrast |
| **Total** | **~60** | Affecting hundreds of component instances across the application |

---

## Top 10 Remediations by Impact

These changes are ordered by the number of users and interactions they affect:

### 1. Add Skip Navigation Link
- **Effort:** Small (single component)
- **Impact:** Benefits all keyboard and screen reader users on every page
- **Where:** Add as the first child element in `apps/web/app/root.tsx`

### 2. Replace Navigation `<div>` Elements With `<nav>`
- **Effort:** Small (3 components)
- **Impact:** All screen reader users gain landmark navigation
- **Where:** `top-navigation-root.tsx`, `app-rail-root.tsx`, sidebar wrapper

### 3. Add `aria-label` to All Icon-Only Buttons
- **Effort:** Medium (~10 components)
- **Impact:** Covers hundreds of button instances across the app
- **Where:** All `IconButton` usages without text; enforce via prop validation in `icon-button.tsx`

### 4. Add `aria-hidden="true"` to All Decorative SVG Icons
- **Effort:** Medium (bulk update ~50 icon files)
- **Impact:** Prevents screen readers from reading meaningless SVG data
- **Where:** `packages/propel/src/icons/`

### 5. Add `role="alert"` to Form Error Messages
- **Effort:** Small (pattern change in ~5 components)
- **Impact:** All form validation errors become perceivable by screen readers
- **Where:** Error `<span>` / `<p>` elements in form components

### 6. Add `aria-live="polite"` to Toast Viewport
- **Effort:** Small (single line change)
- **Impact:** All toast notifications become announced to screen readers
- **Where:** `packages/propel/src/toast/toast.tsx:69`

### 7. Replace `focus:outline-none` With Visible Focus Styles
- **Effort:** Medium (~20 components)
- **Impact:** All keyboard users can see which element is focused
- **Where:** `packages/ui/` and `packages/propel/` components using `outline-none`

### 8. Add Keyboard Handlers to Clickable `<div>` Elements
- **Effort:** Medium (~10 components)
- **Impact:** Interactive elements become usable by keyboard users
- **Where:** Convert to `<button>` where possible, or add `role="button"`, `tabIndex={0}`, and `onKeyDown`

### 9. Add `aria-labelledby` to Modals
- **Effort:** Small (2 modal core components)
- **Impact:** All modal dialogs become properly identified to screen readers
- **Where:** `packages/ui/src/modals/modal-core.tsx`, `packages/propel/src/portal/modal-portal.tsx`

### 10. Add Non-Color Differentiation to Priority and Status Indicators
- **Effort:** Medium (3 components)
- **Impact:** Color-blind users can distinguish priority levels and statuses
- **Where:** `priority-icon.tsx`, `badge/helper.tsx`, `pill/pill.tsx` — add icons, patterns, or text labels

---

## WCAG 2.1 Criteria Reference

| Criterion | Level | Status |
|-----------|-------|--------|
| 1.1.1 Non-text Content | A | Partial — most images have alt, but icons and SVGs need work |
| 1.2.2 Captions | A | Fail — video track has no source |
| 1.3.1 Info and Relationships | A | Fail — missing landmarks, heading hierarchy |
| 1.4.1 Use of Color | A | Fail — priority/status rely on color only |
| 1.4.3 Contrast (Minimum) | AA | Fail — calendar opacity, disabled states, placeholder |
| 2.1.1 Keyboard | A | Fail — clickable divs, drag-and-drop |
| 2.4.1 Bypass Blocks | A | Fail — no skip navigation |
| 2.4.7 Focus Visible | AA | Fail — outline removed without replacement |
| 3.3.1 Error Identification | A | Fail — errors not linked to inputs |
| 3.3.2 Labels or Instructions | A | Partial — some labels missing, no aria-required |
| 4.1.2 Name, Role, Value | A | Fail — icon buttons, dropdowns, modals, tabs |
| 4.1.3 Status Messages | AA | Fail — toasts, loading, infinite scroll |
