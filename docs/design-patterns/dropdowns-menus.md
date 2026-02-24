# Dropdowns & Menus

This document outlines the standard pattern for Dropdown Selects and Context / Flyout Menus in Plane.

## The Standard Pattern

The legacy `CustomMenu` from `@plane/ui` is deprecated in favor of modern `@plane/propel` equivalents. You must distinctively separate simple choice arrays (`Select`) from complex action menubars (`Menu`).

### Required Imports
```tsx
import { Menu } from "@plane/propel/menu";
import { Select } from "@plane/propel/select";
```

### 1. Simple Dropdown (Form Select)
When displaying a list of options that a user must pick one (or multiple) from, do NOT build a custom popover with list items. Use the `Select` component.

```tsx
import { Select } from "@plane/propel/select";

export const StateSelector = ({ value, onChange }) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      label="Issue State" // Provides floating label natively
      placeholder="Choose state"
      className="w-full"
    >
      <Select.Item value="todo">To Do</Select.Item>
      <Select.Item value="in_progress">In Progress</Select.Item>
      <Select.Item value="done">Done</Select.Item>
    </Select>
  );
}
```

### 2. Action Menus (Context Menus / Option Flyouts)
When clicking an element (like an Avatar or an ellipsis `...`) should reveal a list of diverse actions (e.g., Edit, Archive, Copy Link, Delete), use the `Menu` from `@plane/propel/menu`.

```tsx
import { MoreVertical, Edit, Trash, Archive } from "lucide-react";
import { Menu } from "@plane/propel/menu";

export const IssueActionsMenu = ({ onEdit, onArchive, onDelete }) => {
  return (
    <Menu>
      
      {/* 1. The Trigger Button */}
      <Menu.Button className="p-1 rounded-md hover:bg-layer-2 text-secondary hover:text-primary transition-colors">
        <MoreVertical size={16} />
      </Menu.Button>
      
      {/* 2. Menu Items Container */}
      <Menu.Items 
        className="w-48 z-20" // Control dropdown width and stack context.
        position="right"     // Dropdown expanding left/right/top/bottom relative to trigger.
      >
        
        {/* Regular Items */}
        <Menu.Item onClick={onEdit} className="text-sm">
          <Edit size={14} className="mr-2 text-secondary" />
          Edit Issue
        </Menu.Item>
        
        <Menu.Item onClick={onArchive} className="text-sm">
          <Archive size={14} className="mr-2 text-secondary" />
          Archive Issue
        </Menu.Item>
        
        {/* Dividers & Destructive Actions */}
        <div className="h-px bg-subtle my-1 mx-2" />
        
        <Menu.Item onClick={onDelete} className="text-sm text-red-500 hover:bg-red-500/10">
          <Trash size={14} className="mr-2" />
          Delete Issue
        </Menu.Item>
        
      </Menu.Items>
      
    </Menu>
  );
}
```

### Key Technical Rules:
1. **Never use custom Popovers for simple choices**: If it acts like a native `<select>`, use `@plane/propel/select`. 
2. **`Menu.Item` Layout**: By default, `Menu.Item` uses tailwind classes similar to `flex items-center px-4 py-2 hover:bg-layer-2`. Add `mr-2` to icons immediately followed by text. Do not hardcode specific background colors like `bg-gray-100`.
3. **Destructive Actions**: Add `text-red-500` to destructive list actions like "Delete", and visually separate them with a thin border divider `<div className="h-px bg-subtle my-1 mx-2" />`.
4. **Z-Index**: `Menu.Items` requires you to manage its depth visually using `.z-20` (or `z-50`) if it overlaps other adjacent positioned elements like sticky headers or modal bodies.
