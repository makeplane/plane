# Toasts & Notifications

This document outlines the standard pattern for triggering success, error, or warning toast notifications in Plane.

## The Standard Pattern

You MUST use `@plane/propel/toast` to trigger all floating notifications. Do not use legacy `@plane/ui` toasts or raw HTML/CSS custom popups.

### Required Imports
```tsx
import { setToast, TOAST_TYPE, setPromiseToast } from "@plane/propel/toast";
```

### 1. Simple Toasts (Success / Error)
Used after a basic API call resolves or fails.

```tsx
import { useTranslation } from "@plane/i18n";

export const handleSave = async () => {
  try {
    await api.saveData();
    // 1. Success Toast
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Settings saved", // Or t("success_message")
      message: "Your project settings have been updated successfully.",
    });
  } catch (err) {
    // 2. Error Toast
    setToast({
      type: TOAST_TYPE.ERROR,
      title: "Failed to save",
      message: "An unexpected error occurred while saving.",
    });
  }
}
```

### 2. Promise Toasts
When you want to show a loading state that automatically transitions to success or error upon promise resolution.

```tsx
export const handleExport = () => {
  const exportPromise = api.triggerExport();

  setPromiseToast(exportPromise, {
    loading: "Exporting data...", // Shows a spinner toast
    success: {
      title: "Export complete",
      message: () => "Your file is ready to download.",
    },
    error: {
      title: "Export failed",
      message: () => "We couldn't generate your export.",
    },
  });
};
```

### Key Technical Rules:
1. **Types**: Always use the `TOAST_TYPE` enum (`SUCCESS`, `ERROR`, `WARNING`, `INFO`, `LOADING`). Do not hardcode strings.
2. **Translation**: For user-facing notifications, always try to use `t()` keys instead of hardcoded English.
3. **Usage Context**: Do not render the `<Toast />` component itself. The Toast provider is already rendered at the root `App` level. You only need to call the `setToast` or `setPromiseToast` functions.
