# Tooltips & Popovers

This document explains the standard pattern for rendering Tooltips (hover-activated hints) and Popovers (click-activated floating panels) in Plane.

## Tooltips

You MUST use `@plane/propel/tooltip` to provide contextual hints on hover. Do not use standard HTML `title` attributes, as they cannot be styled with Plane's design tokens and lack delay controls.

### Required Imports
```tsx
import { Tooltip } from "@plane/propel/tooltip";
```

### The Standard Pattern
```tsx
export const ActionButton = () => {
  return (
    <Tooltip 
      tooltipHeading="Archive Issue" // Optional bold title
      tooltipContent="Moving this issue to the archive will hide it from active views." // Main description
      position="top" // Standard string placements "top", "bottom", "left", "right"
    >
      <button className="p-2 rounded hover:bg-layer-2">
        <ArchiveIcon />
      </button>
    </Tooltip>
  );
};
```

### Key Technical Rules:
1. **Direct Wrapping**: The `<Tooltip>` component must directly wrap a single React element (usually a button, icon, or div). Do NOT wrap multiple siblings.
2. **Configuration Props**: You can pass `tooltipHeading` (for a primary title) and `tooltipContent` (secondary text). If you only need a simple string, pass it to `tooltipContent`.
3. **Placements**: Use standard string placements via the `position` prop (e.g., `"top"`, `"bottom-start"`). It manages `side` and `align` under the hood automatically.


## Popovers

When you need a floating panel that contains interactive elements (forms, buttons, complex layouts) triggered by a click, use the `@plane/propel/popover` component.

### Required Imports
```tsx
import { Popover } from "@plane/propel/popover";
```

### The Standard Pattern
```tsx
export const FilterDropdown = () => {
  return (
    <Popover>
      {/* 1. The Trigger Element */}
      <Popover.Trigger>
        <button className="px-3 py-1 border border-subtle rounded-md">
          Filters
        </button>
      </Popover.Trigger>

      {/* 2. The Floating Content Box */}
      <Popover.Popup 
        position="bottom-start" 
        className="w-64 p-4 z-20" // Control width, padding, and z-index natively
      >
        <h4 className="text-sm font-medium mb-2">Active Filters</h4>
        {/* Interactive content goes here */}
        <select><option>Status</option></select>
      </Popover.Popup>
    </Popover>
  );
};
```

### Key Technical Rules:
1. **Tooltip vs Popover**: If it is activated by *hover* and contains *read-only* text, use a `Tooltip`. If it is activated by *click* and contains *interactive* elements, use a `Popover`.
2. **Z-Index**: `Popover.Popup` does not forcefully inject a maximum z-index. You must declare `.z-20` (or higher) to ensure it sits above adjacent layout elements.
