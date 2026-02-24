# Tables & Grids

This document outlines the standard tokens and rendering patterns required when building tabular data (lists, grids, or timesheets) in Plane.

## Standard CSS Tokens

When building table rows, borders, and text cells, **DO NOT rely on legacy `custom-...` (such as `border-custom-border-200`) colors**. You MUST use the following **Semantic Tokens**:

### 1. Borders
- **Standard Border**: `border-subtle`
- *Example*: `<div className="border border-subtle">`

### 2. Backgrounds
- **Row Hover State**: `hover:bg-layer-1-hover`
- **Main Background**: `bg-surface-1`

### 3. Text Colors
Always use standard text tokens based on hierarchical importance:
- **Primary Text**: `text-primary` (e.g., Issue Name, Important values)
- **Secondary Text**: `text-secondary` (e.g., Dates, Subtitles, Estimates)
- **Tertiary Text**: `text-tertiary` (e.g., Empty states, Table Headers, Loading text)
- **Error/Negative**: `text-red-500`

## Rendering the Table

### Basic `<table />` implementation

When using standard HTML tables, or `@tanstack/react-table`, structure the styling like the example below to maintain pixel-perfect consistency across modules:

```tsx
import { cn } from "@plane/utils";

<div className="overflow-x-auto rounded-lg border border-subtle">
  <table className="w-full text-sm">
    
    {/* 1. Header Row */}
    <thead>
      <tr className="border-b border-subtle bg-layer-1-hover">
        <th className="px-4 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide">
          Issue
        </th>
        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary uppercase tracking-wide w-32">
          Logged Time
        </th>
      </tr>
    </thead>
    
    {/* 2. Body Rows */}
    <tbody>
      {issues.map((issue) => (
        <tr
          key={issue.id}
          className="border-b border-subtle last:border-0 hover:bg-layer-1-hover transition-colors"
        >
          {/* Primary Text */}
          <td className="px-4 py-3 text-primary font-medium">
            {issue.name}
          </td>
          
          {/* Secondary Text */}
          <td className="px-4 py-3 text-right text-secondary">
            {issue.time}
          </td>
        </tr>
      ))}
    </tbody>
    
    {/* 3. Footer Row (Optional) */}
    <tfoot>
      <tr className="bg-layer-1-hover border-t border-subtle">
        <td className="px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">
          Total
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-primary">
          {totalTime}
        </td>
      </tr>
    </tfoot>
    
  </table>
</div>
```

### Key Technical Rules:
1. **Container Wrapper**: Wrap your table in `<div className="overflow-x-auto rounded-lg border border-subtle">`. This provides standard rounded corners and a containing border.
2. **Header Styling**: `<th className="px-4 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide">`. It is critical to use `text-tertiary uppercase tracking-wide` for headers.
3. **Row Transitions**: Use `hover:bg-layer-1-hover transition-colors` on `<tr>` for smooth interaction feedback. Use `last:border-0` so the last row doesn't double-border with the container wrapper.
4. **Padding Rule**: Standard table cell padding in Plane is `px-4 py-3`, avoiding overly tight density.
