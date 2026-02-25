# Toggles, Switches & Accordions

This document details the standard implementation for boolean boolean toggles (Switches) and expanding/collapsing content sections (Accordions) in Plane.

## Switches (Toggles)

Do **NOT** use standard HTML checkboxes for instantaneous on/off state changes (like enabling a feature). Use the `@plane/propel/switch` component.

### Required Imports
```tsx
import { Switch } from "@plane/propel/switch";
```

### The Standard Pattern
```tsx
export const FeatureToggle = ({ isEnabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <h4 className="text-sm font-medium">Enable Notifications</h4>
        <p className="text-xs text-secondary">Receive alerts for issue changes.</p>
      </div>
      
      <Switch 
        value={isEnabled} 
        onChange={onToggle} // Returns the new boolean value
        size="md" // Options: "sm" (default), "md", "lg"
      />
    </div>
  );
};
```

### Key Technical Rules:
1. **onChange Signature**: Propel's `Switch` `onChange` prop returns a `boolean` directly, NOT a React event. `onChange={(val) => setEnabled(val)}` is the correct pattern.
2. **Size Prop**: Use the built-in `size` prop instead of forcing height/width via Tailwind classes, as the Switch Thumb needs to translate correctly based on the track size.

—

## Accordions (Collapsible Lists)

When building FAQ sections, nested settings, or any vertically expanding lists, you MUST use `@plane/propel/accordion`. Do not build custom state arrays (`[isOpen, setIsOpen] = useState()`) combined with conditionally rendered divs.

### Required Imports
```tsx
import { Accordion } from "@plane/propel/accordion";
```

### The Standard Pattern
```tsx
export const SettingsSections = () => {
  return (
    // 1. Root container
    <Accordion.Root 
      allowMultiple={false} // If true, multiple panels can be open simultaneously
      defaultValue={["section-1"]} // Array of 'value' strings to open by default
    >
      
      {/* 2. Individual Item (Requires a unique value) */}
      <Accordion.Item value="section-1">
        
        {/* 3. The Clickable Header */}
        <Accordion.Trigger>
          <span className="font-medium">General Settings</span>
        </Accordion.Trigger>
        
        {/* 4. The Expanding Content */}
        <Accordion.Content>
          <div className="text-sm text-secondary">
            Settings content goes here. The accordion handles the height animation automatically.
          </div>
        </Accordion.Content>

      </Accordion.Item>

    </Accordion.Root>
  );
}
```

### Key Technical Rules:
1. **Compound Components**: The Accordion relies on four specific nested components (`Root` > `Item` > `Trigger`/`Content`). Do not break this hierarchy or the layout/animations will fail.
2. **`allowMultiple`**: By default (`false`), opening one accordion closes the others. Set this to `true` if users need to view multiple sections at once.
3. **Animations**: `Accordion.Content` already includes the exact `data-[starting-style]:h-0 transition-[height]` needed to animate the expansion smoothly. Do not manually apply transition utilities.
