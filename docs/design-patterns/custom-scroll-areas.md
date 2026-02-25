# Custom Scroll Areas

This document outlines the usage of custom scrollbars within Plane to maintain OS-agnostic styling.

## Required Imports
```tsx
import { ScrollArea } from "@plane/propel/scrollarea";
```

## The Standard Pattern

By default, standard browser scrollbars can be thick and disrupt the UI layout, especially on Windows or Linux. When building a panel, sidebar, or container that is expected to scroll internally, do **not** use `overflow-y-auto` natively unless it's a minor element. Use `@plane/propel/scrollarea` for the sleek, disappearing macOS-style scrollbar effect.

```tsx
export const SidebarPanel = () => {
  return (
    // 1. The Parent container must have a fixed/constrained height
    <div className="h-[500px] w-64 border-r border-subtle">
      
      {/* 2. The ScrollArea fills the parent */}
      <ScrollArea 
        orientation="vertical" // Options: "vertical", "horizontal"
        scrollType="hover"   // Options: "hover" (shows on mouseover), "always", "scroll"
        size="md"            // Options: "sm", "md", "lg"
        className="h-full w-full"
      >
        
        {/* 3. The Content (Can be taller than the parent) */}
        <div className="flex flex-col gap-2 p-4">
          <SidebarItem />
          <SidebarItem />
          <SidebarItem />
          {/* ... many items ... */}
        </div>

      </ScrollArea>
    </div>
  );
};
```

### Key Technical Rules:
1. **Parent Height constraint**: `<ScrollArea>` requires its parent to have a clearly defined boundaries (`h-full`, `calc(100vh-...)`, or fixed pixel heights) so the scroll container knows when to overflow. If the parent grows endlessly, scrolling will never trigger.
2. **`scrollType` Options**: 
   - `hover` (Recommended for menus/sidebars): The scrollbar track only appears when the user's mouse hovers over the container.
   - `always`: The scrollbar is permanently visible.
   - `scroll`: The scrollbar only appears actively during the scrolling action.
3. **Internal `viewportClassName`**: If you need to apply padding directly to the scrolling window instead of standard `rootClassName` wrapper, use the `viewportClassName` prop.
