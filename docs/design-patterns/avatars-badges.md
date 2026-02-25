# Avatars & Badges

This document details the standard styling and implementation of Avatars (user images) and Badges (tags, status labels) in Plane.

## Avatars

You MUST use `@plane/propel/avatar` to display user profiles, workspace icons, or any rounded image with a text fallback. Do not use standard `<img>` tags directly.

### Required Imports
```tsx
import { Avatar } from "@plane/propel/avatar";
```

### The Standard Pattern
```tsx
export const UserProfileItem = ({ user }) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        src={user.avatar_url}
        name={user.display_name} // Used to extract the first letter if src fails
        size="md" // Options: "sm", "md", "base", "lg", or precise number like 24
        shape="circle" // Options: "circle" (default), "square"
      />
      <span className="text-sm font-medium">{user.display_name}</span>
    </div>
  );
};
```

### Key Technical Rules:
1. **Fallback Logic**: Always pass the `name` prop even if you have a `src`. The component automatically extracts the first letter to display if the image fails to load.
2. **Size Prop**: Rely on the predefined string sizes (`"sm"`, `"md"`, `"base"`, `"lg"`) rather than hardcoding tailwind classes on a wrapper, as the `Avatar` component manages both the image size and the fallback typography simultaneously.

—

## Badges

When displaying tags, priorities, states, or simple labels, use `@plane/propel/badge`. Overriding these with raw tailwind spans breaks the semantic coloring.

### Required Imports
```tsx
import { Badge } from "@plane/propel/badge";
```

### The Standard Pattern
```tsx
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const IssueStatus = () => {
  return (
    <div className="flex gap-2">
      
      {/* 1. Neutral Badge (Default) */}
      <Badge variant="neutral" size="base">
        Backlog
      </Badge>
      
      {/* 2. Success Badge with Icon */}
      <Badge 
        variant="success" 
        size="sm"
        prependIcon={<CheckCircle2 />}
      >
        Done
      </Badge>

      {/* 3. Warning Badge with Icon */}
      <Badge 
        variant="warning" 
        prependIcon={<AlertTriangle />}
      >
        High Priority
      </Badge>

    </div>
  );
};
```

### Key Technical Rules:
1. **Variants**: Use `neutral` (gray/tertiary), `brand` (accent/primary blue), `warning` (orange), `success` (green), or `danger` (red).
2. **Icons**: Do not manually wrap icons and text inside the badge. Use the `prependIcon` or `appendIcon` props. The module automatically applies styling and shrinking correctly.
3. **Typography**: Badges automatically apply specific text weights (`text-caption-sm-medium` etc), do not override font sizes manually unless absolutely necessary.
