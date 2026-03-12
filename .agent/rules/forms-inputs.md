<!-- Scope: apps/web/**/components/**, apps/admin/**/components/** -->

# Forms & Input Patterns

## Propel Input (standalone usage)

```typescript
import { Input } from "@plane/propel/input";

// Props: mode ("primary"|"transparent"|"true-transparent"), inputSize ("xs"|"sm"|"md"), hasError
// Input has NO width — always add className="w-full"
<div className="space-y-1">
  <label htmlFor="my-input" className="block text-13 font-medium text-primary">
    Label
  </label>
  <Input id="my-input" value={value} onChange={(e) => setValue(e.target.value)} className="w-full" />
</div>;
```

## react-hook-form + Controller

```typescript
import { useForm, Controller } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";

const {
  control,
  handleSubmit,
  formState: { errors },
  reset,
  watch,
} = useForm<FormData>({
  defaultValues: { name: "" },
});

// Submit — void to suppress floating-promise warning
<form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
  <Controller
    name="name"
    control={control}
    rules={{ required: "Name is required" }}
    render={({ field }) => <Input {...field} error={errors.name?.message} />}
  />
  <Button type="submit" variant="primary" loading={isSubmitting}>
    Save
  </Button>
</form>;
```

## Input Backgrounds — CRITICAL

ALL inputs, selects, textareas, date pickers use `bg-layer-2`:

```tsx
// ✅ CORRECT
<input className="bg-layer-2 ..." />
<select className="bg-layer-2 ..." />
// ❌ WRONG — bg-surface-1 for inputs
<input className="bg-surface-1 ..." />
```

## Common Mistakes

- ❌ Missing `void` before `handleSubmit(handler)(e)` → causes floating-promise warning
- ❌ `bg-surface-1` for inputs → use `bg-layer-2` everywhere
- ❌ Raw `<input>` / `<button>` → use `Input` from `@plane/propel/input`, `Button` from `@plane/propel/button`
