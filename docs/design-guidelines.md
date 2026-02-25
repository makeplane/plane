# Design Guidelines & UI System

**Last Updated**: 2026-02-13
**Scope**: UI components, theming, design patterns, accessibility

## UI Component Libraries

### Propel (@plane/propel) - Modern Components

**Status**: Active development, modern components
**Location**: `/packages/propel/` (386 files)

**When to Use**:
- New features & components
- Modern, polished UI needed
- Interactive elements (buttons, inputs, modals)
- Charts & data visualization

**Key Components**:
```typescript
import {
  Button,
  Input,
  Select,
  Checkbox,
  Radio,
  Toggle,
  Modal,
  Popover,
  Tooltip,
} from "@plane/propel";

// Usage example
<Button
  variant="primary"
  size="lg"
  onClick={handleClick}
  loading={isLoading}
>
  Create Issue
</Button>
```

**Component Variants**:
- **Button**: primary, secondary, outline, ghost
- **Input**: text, password, email, number, textarea
- **Select**: single, multi-select, searchable
- **Size**: sm, md, lg
- **State**: default, hover, active, disabled, loading

### UI (@plane/ui) - Legacy Components

**Status**: Maintenance mode, gradual deprecation
**Location**: `/packages/ui/` (126 files)

**When to Use**:
- Existing code that uses @plane/ui
- Low-priority bug fixes only
- Do NOT use in new features

**Migration Path**:
```typescript
// Old (UI library - deprecated)
import { Button } from "@plane/ui";

// New (Propel library - recommended)
import { Button } from "@plane/propel";
```

## Theming System

### Theme Provider

**Setup** (apps/web):
```typescript
import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";

export const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light">
    <AppContent />
  </ThemeProvider>
);

// In components
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
};
```

### Themes Available

**Built-in Themes**:
1. **Light** - Default light mode
2. **Dark** - Dark mode
3. **Contrast** - High contrast (accessibility)

**Color Scheme**:
- Primary (action color)
- Secondary (supporting color)
- Destructive (danger/delete actions)
- Success (positive actions)
- Warning (caution/alerts)
- Info (informational)

### Custom Theme Colors

**Store Management** (MobX):
```typescript
// core/store/theme.store.ts
class ThemeStore {
  theme: "light" | "dark" | "contrast" = "light";
  customColors: IThemeColors = DEFAULT_COLORS;

  setTheme(theme: string) {
    this.theme = theme;
    localStorage.setItem("theme", theme);
  }

  setCustomColor(colorName: string, value: string) {
    this.customColors[colorName] = value;
    applyCustomColors(this.customColors);
  }
}
```

### CSS Variables (Tailwind v4)

**Location**: `packages/tailwind-config/`

**Available Variables**:
```css
:root {
  /* Primary colors */
  --color-primary-0: #ffffff;
  --color-primary-50: #f0f4ff;
  --color-primary-100: #e0e9ff;
  --color-primary-500: #3b82f6;  /* main */
  --color-primary-900: #001a4d;

  /* Semantic colors */
  --color-success-500: #10b981;
  --color-error-500: #ef4444;
  --color-warning-500: #f59e0b;

  /* Spacing (8px base unit) */
  --spacing-0: 0px;
  --spacing-1: 8px;
  --spacing-2: 16px;
  --spacing-4: 32px;
}
```

**Usage in Components**:
```tsx
export const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
    {children}
  </div>
);
```

## Tailwind CSS Patterns

### Class Organization

**Order of Tailwind classes** (for consistency):
```typescript
// 1. Layout (flex, grid, display)
// 2. Sizing (w, h)
// 3. Spacing (m, p)
// 4. Borders & radius
// 5. Colors (bg, text, border)
// 6. Effects (shadow, opacity)
// 7. Transforms & animations
// 8. Responsive variants

<div className="flex gap-4 p-4 border rounded-lg bg-white shadow-md hover:shadow-lg">
  Content
</div>
```

### Responsive Design

```typescript
export const ResponsiveGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {/* 1 col on mobile, 2 on tablet, 3 on desktop, 4 on xl */}
  </div>
);
```

### Dark Mode

```typescript
export const Card = () => (
  <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
    Content adapts to theme
  </div>
);
```

## Component Patterns

### Button Component

**Simple Usage**:
```typescript
import { Button } from "@plane/propel";

// Basic button
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With states
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>

// With icons
<Button icon={<PlusIcon />}>Add Item</Button>
```

### Modal/Dialog Component

```typescript
import { Modal } from "@plane/propel";
import { useState } from "react";

export const CreateIssueModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Issue</Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create New Issue"
      >
        <div className="space-y-4">
          <Input placeholder="Issue title" />
          <Input placeholder="Description" as="textarea" />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
```

### Form Component

```typescript
import { useForm } from "react-hook-form";
import { Input, Button, Select } from "@plane/propel";

interface IssueFormData {
  title: string;
  status: string;
  assignee: string;
}

export const IssueForm = ({ onSubmit }: { onSubmit: (data: IssueFormData) => void }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<IssueFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        placeholder="Issue title"
        {...register("title", { required: "Title is required" })}
        error={errors.title?.message}
      />

      <Select
        label="Status"
        {...register("status")}
        options={[
          { value: "todo", label: "To Do" },
          { value: "in-progress", label: "In Progress" },
          { value: "done", label: "Done" },
        ]}
      />

      <Button type="submit" variant="primary">
        Create Issue
      </Button>
    </form>
  );
};
```

## Internationalization (i18n)

### Setting Up i18n

**Location**: `packages/i18n/`

**Supported Languages**: 19+ (English, Spanish, French, German, Chinese, Japanese, Korean, Portuguese, Russian, Turkish, Italian, Dutch, Swedish, Polish, Czech, etc.)

### Using Translations

**Component Example**:
```typescript
import { useTranslations } from "@plane/i18n";

export const IssueHeader = () => {
  const { t } = useTranslations();

  return (
    <h1>{t("issues.title")}</h1>
    <p>{t("issues.description")}</p>
  );
};
```

**Translation File Structure**:
```json
{
  "issues": {
    "title": "Issues",
    "description": "Track and manage your project issues",
    "create": "Create Issue",
    "delete": "Delete Issue",
    "status": {
      "todo": "To Do",
      "in_progress": "In Progress",
      "done": "Done"
    }
  }
}
```

### Language Switching

```typescript
import { useTranslations } from "@plane/i18n";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslations();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="de">Deutsch</option>
      {/* More languages... */}
    </select>
  );
};
```

## Accessibility (a11y)

### WCAG 2.1 AA Compliance

**Required Standards**:
- Color contrast ratio: 4.5:1 (normal text)
- Keyboard navigation: All interactive elements
- Screen reader support: Proper ARIA labels
- Focus indicators: Visible focus states

### Semantic HTML

**Good**:
```html
<!-- Semantic, accessible -->
<button onClick={handleClick}>Delete</button>
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>
```

**Avoid**:
```html
<!-- Non-semantic, not accessible -->
<div onClick={handleClick}>Delete</div>
<div>
  <span><span>Home</span></span>
</div>
```

### ARIA Labels

```typescript
// Good: Descriptive ARIA labels
<button
  aria-label="Delete issue"
  title="Delete this issue"
>
  <TrashIcon />
</button>

// Good: Status announcement
<div role="status" aria-live="polite">
  Issue saved successfully
</div>

// Good: Modal accessibility
<Modal
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Create Issue</h2>
  <p id="modal-description">Fill in the form below...</p>
</Modal>
```

### Keyboard Navigation

**All interactive elements must**:
- Be keyboard accessible (Tab, Enter, Space, Arrow keys)
- Show visible focus indicator
- Support logical tab order

```typescript
export const CustomButton = ({ children, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
    >
      {children}
    </button>
  );
};
```

## Icons & Assets

### Icon Library

**Primary**: Lucide React
```typescript
import {
  Plus,
  Trash,
  Edit,
  Settings,
  ChevronDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export const IssueActions = () => (
  <div className="flex gap-2">
    <button><Edit size={20} /></button>
    <button><Trash size={20} /></button>
  </div>
);
```

**Secondary**: Material Symbols Rounded
```typescript
// For specific design system needs
import "@fontsource/material-symbols-rounded";

export const CustomIcon = () => (
  <span className="material-symbols-rounded">settings</span>
);
```

### Asset Optimization

**Images**:
- Use WebP format for modern browsers
- Provide fallback JPG/PNG
- Lazy load below-the-fold images
- Optimize dimensions (don't load 4K images for thumbnails)

**Example**:
```typescript
export const IssueImage = ({ src, alt }: { src: string; alt: string }) => (
  <picture>
    <source srcSet={`${src}.webp`} type="image/webp" />
    <img src={`${src}.jpg`} alt={alt} loading="lazy" />
  </picture>
);
```

## Design System Tokens

### Typography

**Font Stack**:
```css
/* Primary font */
--font-family-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

/* Monospace (code) */
--font-family-mono: "IBM Plex Mono", "Courier New", monospace;
```

**Font Sizes** (Tailwind):
- `text-xs`: 12px
- `text-sm`: 14px
- `text-base`: 16px (default)
- `text-lg`: 18px
- `text-xl`: 20px
- `text-2xl`: 24px
- `text-3xl`: 30px

**Font Weights**:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing Scale

```css
8px base unit:
0px    = 0
8px    = spacing-1
16px   = spacing-2
24px   = spacing-3
32px   = spacing-4
40px   = spacing-5
48px   = spacing-6
```

### Border Radius

```css
0px      = rounded-none
2px      = rounded-sm
4px      = rounded
6px      = rounded-md
8px      = rounded-lg
12px     = rounded-xl
16px     = rounded-2xl
9999px   = rounded-full
```

### Shadows

```css
0 1px 2px    = shadow-sm
0 1px 3px    = shadow
0 4px 6px    = shadow-md
0 10px 15px  = shadow-lg
0 20px 25px  = shadow-xl
```

## Component Library Usage Best Practices

### Do's

- ✅ Use Propel for new components
- ✅ Follow component API documentation
- ✅ Use semantic variants (primary, secondary, destructive)
- ✅ Test for accessibility
- ✅ Document prop requirements
- ✅ Consider responsive design upfront

### Don'ts

- ❌ Don't create custom buttons when Propel has one
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't forget ARIA labels on complex components
- ❌ Don't hardcode colors (use CSS variables)
- ❌ Don't override component styles without good reason
- ❌ Don't use UI library for new features

## Design Review Checklist

Before merging UI changes:

- [ ] Component uses @plane/propel (not @plane/ui)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Dark mode tested
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Translations included (if applicable)
- [ ] Performance optimized (no unnecessary re-renders)
- [ ] Mobile gestures work if applicable

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/design-guidelines.md`
**Lines**: ~460
**Status**: Final
**Related**: Storybook (component showcase) - available in development
