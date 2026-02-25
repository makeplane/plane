# Forms & Inputs

This document defines the standard pattern for building forms and input fields in Plane.

## The Standard Pattern

All forms and standard inputs in Plane must use the `@plane/propel` library. Avoid using basic HTML `<input>` tags unless building a highly custom component that Propel does not support.

When building complex forms, use `react-hook-form` along with the `Controller` component.

### Required Imports
```tsx
import { useForm, Controller } from "react-hook-form";
import { Input, Button } from "@plane/propel";
// For select, you might use:
import { Select } from "@plane/propel/select"; // Path may vary based on exact export
```

### Component Structure
```tsx
type FormData = {
  title: string;
  description: string;
};

export function CreateItemForm({ onSubmit }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      
      {/* 1. Controller for Input */}
      <div>
        <Controller
          name="title"
          control={control}
          rules={{ required: "Title is required" }}
          render={({ field }) => (
            <Input
              {...field}
              id="title"
              type="text"
              placeholder="Enter title"
              hasError={Boolean(errors.title)}
              className="w-full"
            />
          )}
        />
        {/* Validating Error message */}
        {errors.title && (
          <span className="text-sm text-red-500 mt-1">{errors.title.message}</span>
        )}
      </div>

      {/* 2. Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </div>
      
    </form>
  );
}
```

### Key Technical Rules:
1. **Propel Input**: Always use `Input` from `@plane/propel`. It automatically provides the correct Plane background (`bg-layer-2`), border (`border-subtle-1`), and focus states (`focus:ring-accent-strong`).
2. **Error States**: Pass `hasError={Boolean(errors.fieldName)}` to the `Input` to trigger the `border-danger-strong` red outline. This replaces manually writing conditional Tailwind error classes.
3. **Form Layout**: Use standard `space-y-4` or `gap-4` for vertical form blocks.
4. **Button Loading State**: Connect `react-hook-form`'s `isSubmitting` property directly to the Propel `Button`'s `loading={isSubmitting}` prop. You don't need to build a custom spinner inside the button.
