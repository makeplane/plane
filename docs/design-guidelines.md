# Design Guidelines

## Component Libraries

### Propel (New UI - @plane/propel)

**Status:** Primary component library for new features
**Files:** 385 components
**Base:** Tailwind v4 + semantic color tokens

**Component Categories:**

| Category         | Examples                                             |
| ---------------- | ---------------------------------------------------- |
| **Buttons**      | Button, IconButton, ButtonGroup                      |
| **Forms**        | Input, Select, Textarea, Checkbox, Radio, DatePicker |
| **Dialogs**      | Dialog, AlertDialog, Sheet, Popover, Tooltip         |
| **Navigation**   | Tabs, Breadcrumb, Pagination, Sidebar                |
| **Data Display** | Table, List, Card, Badge, Tag, Progress              |
| **Charts**       | LineChart, BarChart, PieChart, AreaChart             |
| **Feedback**     | Toast, Alert, Skeleton, Spinner                      |
| **Layout**       | Container, Grid, Flex, Stack                         |
| **Rich Text**    | RichTextEditor, CodeBlock, Markdown                  |

**Usage:**

```typescript
import { Button, Input, Dialog, Select } from "@plane/propel";

export function CreateIssueDialog() {
  return (
    <Dialog>
      <Input placeholder="Issue title" />
      <Select options={states} label="State" />
      <Button variant="primary">Create</Button>
    </Dialog>
  );
}
```

**Guidelines:**

- Prefer Propel over ui/ for new components
- Use semantic props (variant, size, state)
- Accessible by default (ARIA labels, keyboard nav)
- Responsive design (mobile-first)

### UI (Legacy - @plane/ui)

**Status:** Maintenance mode (gradual migration to Propel)
**Files:** 125 components
**Migration:** Avoid using in new features; refactor existing usage to Propel

**Examples:**

- Button, Input, Select (legacy versions)
- Modal, Dropdown
- Loaders, Badges

**When to Use:**

- Only if Propel equivalent not available
- During incremental refactoring
- Maintenance of existing features

### Editor (@plane/editor)

**Status:** Rich text editing
**Base:** Tiptap v2 + Y.js CRDT

**Features:**

- Markdown preview + rich editing mode
- Real-time collaboration (Y.js)
- Embedded images, code blocks, mentions
- Custom extensions for Plane domain types

**Usage:**

```typescript
import { RichTextEditor } from "@plane/editor";

export function IssueDescription({ initialValue, onChange }) {
  return <RichTextEditor value={initialValue} onChange={onChange} editable={true} withBorder={true} />;
}
```

**Guidelines:**

- Use for issue descriptions, page content, comments
- Support markdown syntax
- Always enable Y.js for collaboration

## Tailwind CSS (v4) & Design Tokens

### Semantic Color System

**Core Palette (CSS Variables):**

| Token              | Usage                   | Example                         |
| ------------------ | ----------------------- | ------------------------------- |
| **text-primary**   | Main text               | Headers, labels, body copy      |
| **text-secondary** | Muted text              | Hints, secondary info           |
| **text-tertiary**  | Very muted              | Timestamps, disabled state      |
| **text-inverted**  | On dark backgrounds     | CTAs on primary buttons         |
| **bg-canvas**      | Page background         | Main workspace area             |
| **bg-surface-1**   | Card/section background | Issue cards, panels             |
| **bg-surface-2**   | Elevated surface        | Modals, popovers                |
| **border-subtle**  | Dividers                | Section separators              |
| **border-strong**  | Emphasized borders      | Input focus, important dividers |
| **bg-primary**     | Brand color             | CTA buttons, highlights         |
| **bg-success**     | Success state           | Checkmarks, done state          |
| **bg-warning**     | Warning state           | Caution, pending                |
| **bg-error**       | Error state             | Validation failures             |
| **bg-info**        | Info state              | Help text, notifications        |

**CSS Variable Definition (tailwind.config.js):**

```javascript
export default {
  theme: {
    colors: {
      text: {
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        tertiary: "var(--color-text-tertiary)",
        inverted: "var(--color-text-inverted)",
      },
      bg: {
        canvas: "var(--color-bg-canvas)",
        "surface-1": "var(--color-bg-surface-1)",
        "surface-2": "var(--color-bg-surface-2)",
      },
      border: {
        subtle: "var(--color-border-subtle)",
        strong: "var(--color-border-strong)",
      },
      // ... more colors
    },
  },
};
```

### Spacing System

**Scale (Tailwind):**

- `p-1` to `p-12` (4px to 48px, step of 4px)
- `gap-1` to `gap-12`
- `m-1` to `m-12`

**Common Usage:**

- **Compact (p-2):** Form inputs, badges
- **Standard (p-3):** Cards, list items
- **Spacious (p-4):** Modals, sections
- **Loose (p-6+):** Top-level page padding

### Typography

**Font Stack:**

- Family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue"`
- Fallback: sans-serif

**Size & Weight Scale:**

| Token         | Size | Weight  | Usage                  |
| ------------- | ---- | ------- | ---------------------- |
| **text-xs**   | 12px | 400     | Timestamps, badges     |
| **text-sm**   | 14px | 400/600 | Labels, secondary text |
| **text-base** | 16px | 400     | Body text              |
| **text-lg**   | 18px | 600     | Subheadings            |
| **text-xl**   | 20px | 600     | Section headers        |
| **text-2xl**  | 24px | 700     | Page titles            |

### Dark Mode

**Implementation:**

- CSS variables adapt to `prefers-color-scheme: dark`
- Or toggle via `.dark` class on root element
- No hardcoded colors (always use semantic tokens)

**Example:**

```css
:root {
  --color-text-primary: #1a1a1a;
  --color-bg-canvas: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #e5e5e5;
    --color-bg-canvas: #0a0a0a;
  }
}
```

## Component Design Patterns

### Button Component

**Variants:**

```typescript
// Primary action
<Button variant="primary">Create Issue</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="danger">Delete</Button>

// Ghost (no background)
<Button variant="ghost">Learn More</Button>

// Loading state
<Button isLoading={true}>Saving...</Button>

// Disabled state
<Button disabled>Archived Project</Button>
```

**Sizes:**

- `sm` (32px height, 12px font)
- `md` (40px height, 14px font) — default
- `lg` (48px height, 16px font)

### Input Component

**Variants:**

```typescript
// Text input
<Input type="text" placeholder="Search issues..." />

// With label + error
<Input
  label="Issue Title"
  error="Title is required"
  value={value}
  onChange={onChange}
/>

// Readonly
<Input readOnly value="Read-only value" />

// With icon
<Input
  icon={<SearchIcon />}
  placeholder="Search..."
/>
```

### Select Component

**Variants:**

```typescript
// Single select
<Select
  options={[
    { label: "Backlog", value: "backlog" },
    { label: "Todo", value: "todo" },
  ]}
  value={selectedState}
  onChange={setSelectedState}
/>

// Multi-select
<Select
  isMulti
  options={states}
  value={selectedStates}
  onChange={setSelectedStates}
/>

// Searchable
<Select
  isSearchable
  options={projects}
  filterOption={(option, input) => { ... }}
/>
```

### Dialog Component

**Pattern:**

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Issue</DialogTitle>
      <DialogDescription>Add a new issue to this project</DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <Input placeholder="Title" />
      <Select options={states} />
    </div>
    <DialogFooter>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleCreate}>
        Create
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Card Component

**Pattern:**

```typescript
<Card className="p-4">
  <Card.Header>
    <Card.Title>Issue #123</Card.Title>
    <Card.Description>Created 2 hours ago</Card.Description>
  </Card.Header>
  <Card.Content className="text-sm text-secondary">{issueDescription}</Card.Content>
  <Card.Footer className="flex justify-end gap-2">
    <Button size="sm">Edit</Button>
  </Card.Footer>
</Card>
```

## Layout Patterns

### Issue List Layout

**Structure:**

```
┌─────────────────────────────────────────────┐
│ Filters & Sorting Bar                       │
├─────────────────────────────────────────────┤
│ Issue ID │ Title        │ Status  │ Assignee│
├─────────────────────────────────────────────┤
│ #1       │ Add login    │ Todo    │ John    │
│ #2       │ Fix bug      │ Done    │ Jane    │
└─────────────────────────────────────────────┘
```

**Components:**

- Top toolbar: Filters, sort dropdown, view selector
- Table header with sortable columns
- Row with drag handle (for reordering)
- Hover actions (edit, delete, etc.)

### Kanban Board Layout

**Structure:**

```
┌──────────┬──────────┬──────────┐
│ Backlog  │ Todo     │ Done     │
├──────────┼──────────┼──────────┤
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │
│ │Card1 │ │ │Card2 │ │ │Card3 │ │
│ └──────┘ │ └──────┘ │ └──────┘ │
│ ┌──────┐ │ ┌──────┐ │          │
│ │Card4 │ │ │Card5 │ │          │
│ └──────┘ │ └──────┘ │          │
└──────────┴──────────┴──────────┘
```

**Components:**

- KanbanGroup per state (column)
- IssueCard with drag handle (Atlaskit pragmatic DnD)
- Add issue button at bottom
- State transition via drag-and-drop

**DnD Validation:**

- useWorkflowFDragNDrop hook checks workflow rules
- Block invalid transitions visually (disabled drop zone)
- Show error modal on blocked transition

### Form Layout

**Standard Pattern:**

```typescript
<form className="space-y-4">
  <div>
    <label className="text-sm font-medium">Title *</label>
    <Input required placeholder="Issue title" />
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm font-medium">State</label>
      <Select options={states} />
    </div>
    <div>
      <label className="text-sm font-medium">Priority</label>
      <Select options={priorities} />
    </div>
  </div>

  <div>
    <label className="text-sm font-medium">Description</label>
    <RichTextEditor />
  </div>

  <div className="flex justify-end gap-2">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Create</Button>
  </div>
</form>
```

**Guidelines:**

- Required field indicator (\*) on label
- Error messages below input (red text)
- Helper text below input (gray text)
- Consistent spacing (space-y-4)
- Submit button on bottom right
- Cancel button next to submit

## Accessibility Guidelines

### Keyboard Navigation

- **Tab order:** Logical flow (left-to-right, top-to-bottom)
- **Focus visible:** Clear focus indicators (outline or bg change)
- **Enter key:** Activates buttons/links
- **Escape key:** Closes dialogs/popovers
- **Arrow keys:** Navigate lists, selects, tabs

### Screen Reader Support

- **ARIA labels:** All interactive elements labeled
- **Role attributes:** Buttons, dialogs, alerts have roles
- **Live regions:** Dynamic content announces changes
- **Alt text:** Images have meaningful descriptions
- **Semantic HTML:** Use `<button>`, `<a>`, not `<div onclick>`

### Color Contrast

- **WCAG AA:** 4.5:1 for text, 3:1 for graphics
- **Test:** Use tools like WebAIM Contrast Checker
- **No color alone:** Use text labels alongside colors
- **Dark mode:** Test both light and dark versions

### Form Accessibility

```typescript
// Good: Associated label with input
<label htmlFor="issue-title" className="text-sm font-medium">
  Issue Title
</label>
<Input id="issue-title" placeholder="..." />

// Good: Error announcement
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-message" : undefined}
/>
<div id="error-message" className="text-error text-sm">
  {errorMessage}
</div>

// Good: Required field
<Input required aria-required="true" />
```

## Responsive Design

### Breakpoints (Tailwind v4)

| Prefix  | Min Width | Usage                  |
| ------- | --------- | ---------------------- |
| **xs**  | —         | Default (mobile-first) |
| **sm**  | 640px     | Small devices          |
| **md**  | 768px     | Tablets                |
| **lg**  | 1024px    | Desktops               |
| **xl**  | 1280px    | Large screens          |
| **2xl** | 1536px    | Extra large screens    |

### Mobile-First Approach

**Pattern:**

```typescript
// Mobile (xs):
<div className="
  grid grid-cols-1 gap-2
  // Tablet (md):
  md:grid-cols-2 md:gap-4
  // Desktop (lg):
  lg:grid-cols-3 lg:gap-6
">
  {items.map(...)}
</div>
```

### Common Patterns

**Sidebar + Content:**

```typescript
<div
  className="
  flex flex-col
  lg:flex-row lg:gap-6
"
>
  <aside
    className="
    w-full mb-4
    lg:w-64 lg:mb-0
  "
  >
    {sidebar}
  </aside>
  <main className="flex-1">{content}</main>
</div>
```

## Icons & Illustrations

### Icon Library

**Source:** Heroicons (via @plane/propel)

- Size: 16px (xs), 20px (sm), 24px (md), 32px (lg)
- Stroke: 2px (consistent weight)
- Color: Inherits text color or use semantic tokens

**Usage:**

```typescript
import { ChevronDownIcon, PlusIcon } from "@plane/propel/icons";

<Button icon={<PlusIcon className="w-4 h-4" />}>Add Issue</Button>;
```

### Illustrations

**Guidelines:**

- Use for empty states, errors, onboarding
- Consistent art style (minimalist, flat)
- Accessible: include alt text
- SVG format (scalable)

## Animation & Transitions

### Timing

- **Fast:** 150ms (hover states, small UI changes)
- **Standard:** 300ms (dialogs, panels, transitions)
- **Slow:** 500ms+ (page transitions, complex animations)

### Easing Functions

- **ease-in-out:** Default (natural feel)
- **ease-in:** Entrance animations
- **ease-out:** Exit animations
- **linear:** Loading indicators, spinners

### Examples

```typescript
// Fade in/out
<div className="transition-opacity duration-300 opacity-100">
  {visible && <Content />}
</div>

// Slide & fade
<Dialog
  className="animate-in slide-in-from-right-1/2 fade-in duration-300"
>
  {content}
</Dialog>

// Loading spinner
<div className="animate-spin">
  <Spinner />
</div>
```

## Internationalization (i18n)

### Language Support

- **English (en)** — Default
- **Korean (ko)** — Shinhan primary
- **Vietnamese (vi)** — Regional support

### Translation Keys

**Convention:** Dot notation (nested)

```json
{
  "workspace": {
    "title": "Workspace",
    "settings": {
      "title": "Workspace Settings",
      "description": "Manage workspace preferences"
    }
  },
  "issue": {
    "create": "Create Issue",
    "delete": "Delete Issue"
  }
}
```

**Usage:**

```typescript
import { useI18n } from "@plane/i18n";

export function IssueForm() {
  const { t } = useI18n();

  return (
    <form>
      <label>{t("issue.title")}</label>
      <Input placeholder={t("issue.placeholder.title")} />
      <Button>{t("issue.create")}</Button>
    </form>
  );
}
```

### Pluralization & Formatting

```json
{
  "issues.count": "{count, plural, =0 {No issues} one {1 issue} other {# issues}}"
}
```

```typescript
t("issues.count", { count: 5 }); // "5 issues"
```

## Dark Mode Support

### Implementation

All components automatically support dark mode via CSS variables.

**Testing:**

```bash
# Test dark mode
# 1. System preference: System Settings → Display → Dark Mode
# 2. Dev tools: DevTools → Rendering → Emulate CSS media feature prefers-color-scheme
```

**Manual Toggle (optional):**

```typescript
<button
  onClick={() => {
    document.documentElement.classList.toggle("dark");
  }}
>
  Toggle Dark Mode
</button>
```

---

**Last Updated:** 2026-04-02
**Version:** 1.0
