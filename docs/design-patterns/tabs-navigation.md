# Tabs Navigation

This document defines the exact standard for implementing sub-navigation tab bars inside Plane pages (like Intake, Views, or Time Tracking).

**CRITICAL RULE:** Do NOT use standard `NavLink` components or custom CSS classes (like `custom-primary-100`) for tab bars. You MUST follow Plane's `Header` component pattern.

## The Standard Tab Pattern

All sub-tab bars in Plane are built using the `@plane/ui` `Header` component with the `SECONDARY` variant.

### Required Imports
```tsx
import { useLocation, useNavigate } from "react-router";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";
```

### Tab Configuration Example
```tsx
import { User, BarChart2 } from "lucide-react";

// Pre-define tabs to keep the TSX clean
const TAB_ITEMS = [
  { key: "timesheet", labelKey: "my_timesheet", path: "", icon: User },
  { key: "analytics", labelKey: "project_analytics", path: "analytics", icon: BarChart2 },
] as const;
```

### The UI Component Structure
```tsx
export const MyTabNavigation = ({ activeTab, basePath }) => {
  const navigate = useNavigate();
  
  return (
    // 1. The Wrapper: Must be SECONDARY variant, usually with a top border
    <Header variant={EHeaderVariant.SECONDARY} className="border-t border-subtle">
      
      {/* 2. Flex Container: Prevent items from stretching using justify-between */}
      <div className="flex h-full items-center px-3">
        
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            // 3. Tab Item Container
            <div
              key={tab.key}
              className={cn(
                "text-13 relative flex items-center gap-2 h-full px-4 cursor-pointer transition-all font-semibold",
                isActive ? "text-accent-primary" : "text-secondary hover:text-primary"
              )}
              onClick={() => {
                if (!isActive) navigate(`${basePath}${tab.path ? `/${tab.path}` : ""}`);
              }}
            >
              {/* Optional: Icon Styling */}
              <Icon size={14} className={isActive ? "text-accent-primary" : "text-tertiary"} />
              
              <span>{tab.labelKey}</span>
              
              {/* 4. Active Indicator: Absolute position, 2px border bottom */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 border-b-2 border-accent-primary" />
              )}
            </div>
          );
        })}
      </div>
    </Header>
  );
};
```

### Key Technical Rules:
1. **Header Variant**: Always use `<Header variant={EHeaderVariant.SECONDARY}>` for sub-tab bars. It provides the exact `min-h-[52px]` and background needed.
2. **Tab Alignment**: The `Header` uses `justify-between` by default. You MUST wrap your tab mapping in a `<div className="flex h-full items-center">` to group them together on the left, otherwise they stretch across the page.
3. **Tab Styling**: 
   - Text size: `text-13`
   - Weight: `font-semibold` (or `medium`)
   - Spacing: `h-full px-4`
   - Active Color: `text-accent-primary`
   - Inactive Color: `text-secondary hover:text-primary`
4. **Active Indicator**: Do not use `after:` pseudos or full bottom borders. Use a conditionally rendered inner `div` with `absolute bottom-0 left-0 right-0 border-b-2 border-accent-primary`.

When debugging old views, if you see `custom-text-100` or `custom-border-200` in tabs, they are utilizing legacy tokens. Migrate them to this pattern instead.
