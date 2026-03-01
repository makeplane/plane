# Design System Philosophy Guide

## Overview

This guide explains the semantic design system philosophy for building consistent, maintainable UIs. The system is built on three core concepts: **Canvas**, **Surface**, and **Layer**.

## Core Concepts

### 1. Canvas (`bg-canvas`)

**What it is**: The application-level background that serves as the foundation for all content. The canvas is the **entire application background**, not individual pages. There is only **one canvas** in the entire application, used at the root level.

**When to use**:

- **Only at the application root** - the single root container that wraps the entire application
- The main application background (not page backgrounds)

**When NOT to use**:

- ❌ Page-level backgrounds
- ❌ Nested containers
- ❌ Cards or components
- ❌ Modals or dropdowns
- ❌ Sidebars or panels
- ❌ Anywhere else in the application

**Critical Rule**: Canvas should only appear **once** in your entire application - at the root level. All pages, routes, and components sit on top of this single canvas.

**Example**:

```tsx
// ✅ Correct: Canvas at application root (only place it should be)
// App.tsx or root layout
<div className="bg-canvas min-h-screen">
  {/* All application content goes here */}
  <Routes>
    <Route path="/" element={<Page />} />
  </Routes>
</div>;

// ✅ Correct: Pages use surfaces, not canvas
function Page() {
  return <div className="bg-surface-1">{/* Page content */}</div>;
}

// ❌ Wrong: Canvas used for a page
function Page() {
  return <div className="bg-canvas">{/* Don't use canvas here */}</div>;
}

// ❌ Wrong: Canvas used for a card
<div className="bg-canvas p-4 rounded-md">{/* Card content */}</div>;
```

### 2. Surface (`bg-surface-1`, `bg-surface-2`, `bg-surface-3`)

**What it is**: Top-level containers that sit directly on the canvas. Surfaces never overlap each other - they are siblings in the layout hierarchy.

**When to use**:

- Main content areas
- Sections of a page
- Primary containers
- Panels that sit side-by-side

**Surface hierarchy**:

- `bg-surface-1`: Primary surface (most common)
- `bg-surface-2`: Secondary surface (for variation)
- `bg-surface-3`: Tertiary surface (rare, for special cases)

**Rules**:

- Surfaces are **siblings**, not nested (in the same plane)
- Each surface should use its corresponding layer for nested elements
- Surfaces provide the base for stacking layers

**Exception - Different Planes**:

- Modals, overlays, and popovers exist on a **different plane** (different z-index/stacking context)
- In these cases, it's acceptable to use a surface even when there's a surface below
- This is because they are visually and functionally separate from the underlying content

**Example**:

```tsx
// ✅ Correct: Surfaces as siblings
<div className="bg-canvas">
  <div className="bg-surface-1">
    {/* Main content area */}
  </div>
  <div className="bg-surface-2">
    {/* Secondary content area - sibling, not nested */}
  </div>
</div>

// ✅ Correct: Page with header and main (same surface)
<div className="bg-surface-1">
  <header className="border-b border-subtle">
    {/* Header is part of the surface, not a separate surface */}
  </header>
  <main>
    {/* Main is part of the surface, not a separate surface */}
  </main>
</div>

// ❌ Wrong: Surface nested in surface (same plane)
<div className="bg-surface-1">
  <div className="bg-surface-2">
    {/* This breaks the philosophy */}
  </div>
</div>

// ✅ Correct: Modal on different plane
<div className="bg-canvas">
  {/* Main page content */}
  <div className="bg-surface-1">
    Page content
  </div>

  {/* Modal overlay - different plane */}
  <div className="fixed inset-0 z-50">
    <div className="bg-backdrop fixed inset-0" />
    <div className="bg-surface-1 rounded-lg shadow-lg p-6">
      {/* Modal can use surface-1 even though page uses surface-1 */}
      Modal content
    </div>
  </div>
</div>
```

### 3. Layer (`bg-layer-1`, `bg-layer-2`, `bg-layer-3`)

**What it is**: Stacking layers that create depth within a surface. Layers stack on top of each other in a specific order.

**When to use**:

- Cards within a surface
- Group headers
- Nested containers
- Dropdowns and modals
- Sidebars
- Any element that needs to appear "on top" of a surface

**Layer hierarchy**:

- `bg-layer-1`: First layer (closest to surface)
- `bg-layer-2`: Second layer (on top of layer-1)
- `bg-layer-3`: Third layer (on top of layer-2)

**Critical Rule - Layer-to-Surface Association**:

- `bg-surface-1` → use `bg-layer-1` for nested elements
- `bg-surface-2` → use `bg-layer-2` for nested elements
- `bg-surface-3` → use `bg-layer-3` for nested elements

**Rare Exception - Visual Separation**:

In very rare cases, you may go one level above for visual separation when needed for specific UI elements:

- Inputs in modals (modal has `bg-surface-1`, input can use `bg-layer-2` for separation)
- Buttons, switches, and form controls that need more visual distinction
- **Important**: This is very rare and should only be used for interactive form elements, not for content boxes or cards

**Example**:

```tsx
// ✅ Correct: Surface-1 with layer-1
<div className="bg-surface-1 p-4">
  <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-3">
    Card content
  </div>
</div>

// ✅ Correct: Surface-2 with layer-2
<div className="bg-surface-2 p-4">
  <div className="bg-layer-2 hover:bg-layer-2-hover rounded-md p-3">
    Card content
  </div>
</div>

// ❌ Wrong: Surface-1 with layer-2 (for content boxes)
<div className="bg-surface-1 p-4">
  <div className="bg-layer-2">
    {/* Wrong layer for this surface - use layer-1 for content boxes */}
  </div>
</div>

// ✅ Correct: Rare exception - Input in modal for visual separation
<div className="bg-surface-1 rounded-lg p-6">
  <form>
    <input className="bg-layer-2 border border-subtle rounded-md px-3 py-2" />
    {/* Input uses layer-2 for visual separation from modal surface */}
  </form>
</div>
```

## Stacking Layers

### How to Stack Layers

Layers stack in order: surface → layer-1 → layer-2 → layer-3

**Pattern**:

```
Canvas
  └── Surface
      └── Layer 1 (first level of depth)
          └── Layer 2 (second level of depth)
              └── Layer 3 (third level of depth)
```

**Example - Proper Stacking**:

```tsx
// ✅ Correct: Proper layer stacking
<div className="bg-surface-1 p-4">
  {/* Layer 1: Card */}
  <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
    <h3>Card Title</h3>

    {/* Layer 2: Nested section */}
    <div className="bg-layer-2 hover:bg-layer-2-hover rounded p-2 mt-2">
      Nested content
      {/* Layer 3: Deeply nested */}
      <div className="bg-layer-3 hover:bg-layer-3-hover rounded p-1 mt-1">Deep content</div>
    </div>
  </div>
</div>
```

**When to use each layer**:

- **Layer 1**: Most common - cards, headers, primary nested elements
- **Layer 2**: Secondary depth - nested cards, sub-sections
- **Layer 3**: Deep nesting - rarely needed, for complex hierarchies

## State Variants

### Hover States

**Critical Rule**: Hover must always match the base background layer.

**Pattern**: `bg-layer-X hover:bg-layer-X-hover`

**Examples**:

```tsx
// ✅ Correct: Matching hover
<div className="bg-layer-1 hover:bg-layer-1-hover">
  Hoverable element
</div>

<div className="bg-layer-2 hover:bg-layer-2-hover">
  Hoverable element
</div>

// ❌ Wrong: Mismatched hover
<div className="bg-layer-1 hover:bg-layer-2-hover">
  {/* Never do this */}
</div>
```

### Active States

Use `-active` variants when an element is in an active/pressed state.

```tsx
// ✅ Correct: Active state
<button
  className={cn("bg-layer-1 hover:bg-layer-1-hover", {
    "bg-layer-1-active": isActive,
  })}
>
  Button
</button>
```

### Selected States

Use `-selected` variants only when there's actual selection logic.

```tsx
// ✅ Correct: Selected state with logic
<div className={cn(
  "bg-layer-1 hover:bg-layer-1-hover",
  {
    "bg-layer-1-selected": isSelected
  }
)}>
  Selectable item
</div>

// ✅ Correct: With data attribute
<div className="bg-layer-1 hover:bg-layer-1-hover data-[selected]:bg-layer-1-selected">
  Selectable item
</div>
```

## Common Patterns

### Pattern 1: Application Root Layout

```tsx
// ✅ Correct: Application root (only place for canvas)
// App.tsx or root layout
<div className="bg-canvas min-h-screen">
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
</div>;

// ✅ Correct: Individual page structure
function HomePage() {
  return (
    <div className="bg-surface-1">
      {/* Header - part of the page surface, uses layer for depth */}
      <header className="border-b border-subtle">
        <div className="bg-layer-1 hover:bg-layer-1-hover px-4 py-2">Header content</div>
      </header>

      {/* Main content - part of the page surface */}
      <main className="p-6">
        <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">Content card</div>
      </main>
    </div>
  );
}
```

### Pattern 2: Card with Nested Elements

```tsx
// ✅ Correct: Card with proper layering
<div className="bg-surface-1 p-4">
  <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
    <h3 className="text-primary font-semibold">Card Title</h3>

    {/* Nested section */}
    <div className="bg-layer-2 hover:bg-layer-2-hover rounded p-3 mt-3">
      <p className="text-secondary">Nested content</p>
    </div>
  </div>
</div>
```

### Pattern 3: Dropdown/Modal

```tsx
// ✅ Correct: Modal structure (different plane exception)
function PageWithModal() {
  return (
    <div className="bg-surface-1">
      {/* Main page content */}
      <div>Page content</div>

      {/* Modal - different plane, can use surface even with surface below */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="bg-backdrop fixed inset-0" />
          <div className="bg-surface-1 rounded-lg shadow-lg p-6">
            <div className="bg-layer-1 hover:bg-layer-1-hover rounded p-2">Modal content</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Sidebar Layout

```tsx
// ✅ Correct: Sidebar with main content (page level, not app root)
// Both sidebar and main are siblings on the same surface
// Sidebar menu items use transparent backgrounds with hover states
function DashboardPage() {
  return (
    <div className="bg-surface-1 flex">
      {/* Sidebar - part of the page surface */}
      <aside className="border-r border-subtle w-64">
        <div className="hover:bg-layer-1-hover p-4">Sidebar item</div>
      </aside>

      {/* Main content - part of the page surface */}
      <main className="flex-1 p-6">
        <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">Main content</div>
      </main>
    </div>
  );
}
```

### Pattern 5: List with Items

```tsx
// ✅ Correct: List structure
<div className="bg-surface-1 p-4">
  <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md mb-2 p-3">List item 1</div>
  <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md mb-2 p-3">List item 2</div>
  <div className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-3">List item 3</div>
</div>
```

### Pattern 6: Form with Inputs

```tsx
// ✅ Correct: Form structure
<div className="bg-surface-1 p-6">
  <form className="bg-layer-1 rounded-md p-4 space-y-4">
    <div>
      <label className="text-primary font-medium">Name</label>
      {/* Input can use bg-surface-1 or bg-layer-2 for visual separation (rare exception) */}
      <input className="bg-surface-1 border border-subtle rounded-md px-3 py-2 text-primary" type="text" />
    </div>

    <button className="bg-layer-2 hover:bg-layer-2-hover rounded-md px-4 py-2 text-primary">Submit</button>
  </form>
</div>

// ✅ Correct: Input in modal (rare exception for visual separation)
<div className="bg-surface-1 rounded-lg p-6">
  <form>
    <label className="text-primary font-medium">Name</label>
    {/* Input uses layer-2 for visual separation from modal surface - rare exception */}
    <input className="bg-layer-2 border border-subtle rounded-md px-3 py-2 text-primary" type="text" />
  </form>
</div>
```

## Decision Tree

### When to use Canvas?

```
Is this the root container of the entire application?
(Only one place in the whole app)
├─ YES → Use bg-canvas (application root only)
└─ NO → Continue to Surface decision
```

### When to use Surface?

```
Is this a top-level container that sits on canvas?
AND
Is it a sibling to other containers (not nested)?
OR
Is this a modal/overlay on a different plane (z-index)?
├─ YES → Use bg-surface-1 (or surface-2/3 for variation)
└─ NO → Continue to Layer decision
```

### When to use Layer?

```
Is this nested within a surface?
├─ YES → Use bg-layer-1 (or layer-2/3 for deeper nesting)
│         Match layer number to surface number
└─ NO → Re-evaluate: Should this be a surface?
```

## Text Colors

Use semantic text colors that match the hierarchy:

- `text-primary`: Main text, headings, important content
- `text-secondary`: Secondary text, descriptions
- `text-tertiary`: Tertiary text, labels, metadata
- `text-placeholder`: Placeholder text, hints

**Example**:

```tsx
<div className="bg-layer-1 p-4">
  <h2 className="text-primary font-semibold">Title</h2>
  <p className="text-secondary">Description text</p>
  <span className="text-tertiary text-13">Metadata</span>
  <input className="placeholder-(--text-color-placeholder)" placeholder="Enter text..." />
</div>
```

## Border Colors

Use semantic border colors:

- `border-subtle`: Subtle borders, dividers
- `border-subtle-1`: Slightly more visible borders
- `border-strong`: Strong borders, emphasis
- `border-strong-1`: Very strong borders

**Example**:

```tsx
<div className="bg-layer-1 border border-subtle rounded-md p-4">
  <div className="border-b border-subtle-1 pb-2 mb-2">Section with divider</div>
</div>
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Canvas for Pages or Cards

```tsx
// ❌ Wrong: Canvas used for a page
function Page() {
  return <div className="bg-canvas">Page content</div>;
}

// ❌ Wrong: Canvas used for a card
<div className="bg-canvas rounded-md p-4">Card content</div>;

// ✅ Correct: Pages use surfaces
function Page() {
  return (
    <div className="bg-surface-1">
      <div className="bg-layer-1 rounded-md p-4">Card content</div>
    </div>
  );
}
```

### ❌ Mistake 2: Nested Surfaces (Same Plane)

```tsx
// ❌ Wrong: Nested surfaces in same plane
<div className="bg-surface-1">
  <div className="bg-surface-2">
    Nested surface
  </div>
</div>

// ✅ Correct: Use layer instead
<div className="bg-surface-1">
  <div className="bg-layer-1">
    Nested layer
  </div>
</div>

// ✅ Correct: Exception - Modal on different plane
<div className="bg-canvas">
  <div className="bg-surface-1">Page content</div>
  <div className="fixed inset-0 z-50">
    <div className="bg-surface-1">Modal (different plane)</div>
  </div>
</div>
```

### ❌ Mistake 3: Wrong Layer for Surface

```tsx
// ❌ Wrong: surface-1 with layer-2 (for content boxes)
<div className="bg-surface-1">
  <div className="bg-layer-2">
    Content box
  </div>
</div>

// ✅ Correct: surface-1 with layer-1 (for content boxes)
<div className="bg-surface-1">
  <div className="bg-layer-1">
    Content box
  </div>
</div>

// ✅ Correct: Rare exception - Input/button for visual separation
<div className="bg-surface-1">
  <input className="bg-layer-2" />
  {/* Input uses layer-2 for visual separation - very rare exception */}
</div>
```

**Note**: Going one level above (e.g., `bg-layer-2` with `bg-surface-1`) is only valid in very rare cases for interactive form elements (inputs, buttons, switches) that need extra visual separation. For content boxes, cards, and normal nested elements, always match the layer number to the surface number.

### ❌ Mistake 4: Mismatched Hover

```tsx
// ❌ Wrong
<div className="bg-layer-1 hover:bg-layer-2-hover">
  Content
</div>

// ✅ Correct
<div className="bg-layer-1 hover:bg-layer-1-hover">
  Content
</div>
```

### ❌ Mistake 5: Missing Hover Prefix

```tsx
// ❌ Wrong
<div className="bg-layer-1-hover">
  Content
</div>

// ✅ Correct
<div className="bg-layer-1 hover:bg-layer-1-hover">
  Content
</div>
```

## Best Practices

1. **Canvas is Application Root Only**: Canvas should only appear once in your entire application - at the root level (App.tsx or root layout). All pages use surfaces, not canvas.

2. **Use Surfaces for Pages and Top-Level Containers**: Surfaces are siblings, not nested (except modals/overlays on different planes)

3. **Match Layers to Surfaces**: surface-1 → layer-1, surface-2 → layer-2, etc. (Very rare exception: form elements can go one level above for visual separation)

4. **Stack Layers Properly**: Use layer-1 first, then layer-2, then layer-3 as needed

5. **Always Match Hover States**: If base is `bg-layer-X`, hover must be `hover:bg-layer-X-hover`

6. **Use Semantic Text Colors**: Match text color to importance (primary, secondary, tertiary, placeholder)

7. **Keep It Simple**: Don't over-nest. Most components only need layer-1

8. **Test Visual Hierarchy**: Ensure the stacking creates clear visual depth

## Quick Reference

### Hierarchy Structure

```
Canvas (one per page)
  └── Surface 1 (top-level container)
      └── Layer 1 (first level of depth)
          └── Layer 2 (second level)
              └── Layer 3 (third level)
```

### Common Combinations

- Application Root: `bg-canvas` (only one place in entire app)
- Single Surface Page: `bg-surface-1` → `bg-layer-1`
- Multiple Surfaces Page: Grid of `bg-surface-1` (or `bg-surface-2`) as siblings
- Card: `bg-surface-1` → `bg-layer-1 hover:bg-layer-1-hover`
- Nested Card: `bg-surface-1` → `bg-layer-1` → `bg-layer-2`
- Sidebar Layout: `bg-surface-1` (sidebar) + `bg-surface-1` (main) - both siblings
- Sidebar Menu Items: Transparent background with `hover:bg-layer-1-hover` (no base `bg-layer-1`)

### State Variants

- Hover: `bg-layer-X hover:bg-layer-X-hover`
- Active: `bg-layer-X-active` (when pressed/active)
- Selected: `bg-layer-X-selected` (when selected)

## Alignment Checklist

When reviewing components, ensure:

- [ ] Canvas is only used at the application root (one place in entire app)
- [ ] Pages use surfaces, not canvas
- [ ] Surfaces are siblings, not nested (except modals/overlays on different planes)
- [ ] Layers match their surface (surface-1 → layer-1) - except rare cases for form elements
- [ ] Sidebar menu items use transparent backgrounds with hover states
- [ ] Hover states match base layers
- [ ] Layers stack properly (1 → 2 → 3)
- [ ] Text colors are semantic (primary, secondary, tertiary, placeholder)
- [ ] Borders use semantic colors (subtle, strong)
- [ ] No unnecessary nesting
- [ ] Visual hierarchy is clear
- [ ] State variants are used correctly
- [ ] Modals/overlays use surfaces (exception to nesting rule)
