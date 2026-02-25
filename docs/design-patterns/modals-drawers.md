# Modals & Dialogs

This document defines the standard pattern for building Modals and Dialogs in Plane.

## The Standard Pattern

All modals in Plane are built using the `ModalCore` component from `@plane/ui`. Do not build custom dialogs overylays or use raw HTML dialogs.

### Required Imports
```tsx
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
```

### Component Structure
```tsx
type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: any;
};

export function MyCustomModal(props: Props) {
  const { isOpen, handleClose, data } = props;

  return (
    // 1. Core Wrapper
    <ModalCore 
      isOpen={isOpen} 
      handleClose={handleClose} 
      position={EModalPosition.CENTER} // Or EModalPosition.TOP
      width={EModalWidth.LG} // Or MD, XL, XXL, etc.
    >
      {/* 2. Content Padding Container */}
      <div className="px-5 py-4">
        
        {/* 3. Modal Header */}
        <h3 className="text-18 font-medium 2xl:text-20">
          Modal Title
        </h3>
        
        {/* 4. Modal Body / Description */}
        <p className="mt-3 text-13 text-secondary">
          Are you sure you want to perform this action?
        </p>

        {/* 5. Modal Footer / Actions */}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>
            Confirm Action
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
```

### Key Technical Rules:
1. **ModalCore Wrapper**: Always use `<ModalCore>`. It handles the backdrop, ESC key closing, and focus trapping automatically.
2. **Widths**: Use the `EModalWidth` enum (`SM`, `MD`, `LG`, `XL`, `XXL`, `XXXL`, `XXXXL`, `VXL`).
3. **Position**: Use `EModalPosition.CENTER` for confirmation dialogs and standard forms. Use `EModalPosition.TOP` for very tall forms that might require scrolling.
4. **Padding**: The standard internal padding for a modal content area in Plane is `px-5 py-4` (or `gap-4`). Do not stretch content edge-to-edge unless it's a specific full-bleed image.
5. **Titles**: Standard modal titles use `text-18 font-medium 2xl:text-20`.
6. **Action Buttons**: Always place action buttons at the bottom right (`justify-end gap-2`). Cancel should be `variant="secondary"` (or `ghost`), and the primary action should be `variant="primary"` (or `destructive` for deletions).
