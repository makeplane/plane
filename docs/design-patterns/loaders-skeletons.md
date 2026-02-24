# Loaders & Skeletons

This document outlines the standard way to represent loading states in Plane. 

## The Standard Pattern

Depending on the context (full page, list item, or button), you must use one of the standard Loading components instead of generic text like "Loading...".

### Required Imports
```tsx
import { Loader } from "@plane/ui"; // Legacy skeleton layout tool, still heavily used for lists
import { CircularSpinner } from "@plane/propel/spinners"; // Modern local loading indicator
import { Button } from "@plane/propel"; // Has native loading state
```

### 1. The Global / Page Level Loader
When a large section (like the main content of an `Inbox` or `View` page) is loading, use the structural `@plane/ui` `Loader` blocks to build a skeleton.

```tsx
export const MyPageSkeleton = () => {
  return (
    // Replicate the structural gap of the loaded content
    <Loader className="mx-auto w-full space-y-4 py-4 px-2">
      {/* Replicate list rows */}
      <Loader.Item height="64px" width="100%" />
      <Loader.Item height="64px" width="100%" />
      <Loader.Item height="64px" width="100%" />
    </Loader>
  );
}
```

### 2. The Local Component Spinner
When a small section, widget, or specific data fetching block is loading, do not render a large skeleton. Use `@plane/propel/spinners` `CircularSpinner`.

```tsx
export const WidgetLoading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      {/* 
        This spinner naturally inherits text color OR can be forced with tailwind colors. 
        It spins continuously.
      */}
      <CircularSpinner className="size-6 text-accent-primary" />
      <span className="ml-2 text-sm text-secondary">Loading widget data...</span>
    </div>
  );
}
```

### 3. The Action Loader (Buttons)
When a user clicks "Save" or "Submit", NEVER implement a custom spinner inside the button. The `Button` component in `@plane/propel` accepts a `loading` prop out-of-the-box.

```tsx
  <Button 
    variant="primary" 
    loading={isSubmitting} // Set to true to replace text/icon with a spinner
    disabled={!isValid} 
  >
    {isSubmitting ? "Saving..." : "Save Data"}
  </Button>
```

### Key Technical Rules:
1. **Never use text-only loaders**: Raw `<div>Loading...</div>` should never be shipped to production. 
2. **Skeleton (`Loader`) Dimensioning**: Always try to match the `height` prop of `Loader.Item` close to the actual row/card component you are loading to prevent UI layout shift. Use `width="100%"` (not just `w-100`) to fill the container.
3. **CircularSpinner sizing**: Always use Tailwind size utilities like `size-4` (16px), `size-6` (24px) to control its dimensions, along with `text-[color]` to adapt to the surrounding context.
