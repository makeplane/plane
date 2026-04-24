# TanStack Form Reference

## Setup
```bash
npm i @tanstack/react-form
npm i @tanstack/zod-form-adapter zod  # optional: Zod validation
```

## useForm
```tsx
const form = useForm({
  defaultValues: { name: '', email: '', age: 0 },
  validatorAdapter: zodValidator,  // optional global adapter
  onSubmit: async ({ value }) => {
    // value is fully typed: { name: string, email: string, age: number }
    await api.createUser(value)
  },
})
```

## form.Field
```tsx
<form.Field
  name="email"
  validators={{
    onChange: z.string().email('Invalid email'),
    onBlur: ({ value }) => !value ? 'Required' : undefined,
    onBlurAsync: async ({ value }) => {
      const taken = await checkEmailTaken(value)
      return taken ? 'Email already taken' : undefined
    },
    onBlurAsyncDebounceMs: 500,
  }}
>
  {(field) => (
    <div>
      <input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.map((err) => <p key={err}>{err}</p>)}
    </div>
  )}
</form.Field>
```

## Validation Events
| Event | When | Use Case |
|-------|------|----------|
| `onChange` | Every keystroke | Format validation |
| `onBlur` | Field loses focus | Required checks |
| `onBlurAsync` | Field loses focus | Server-side checks |
| `onSubmit` | Form submission | Final validation |
| `onSubmitAsync` | Form submission | Async final validation |

All support Zod schemas or inline functions returning `string | undefined`.

## form.Subscribe — Reactive UI
```tsx
<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <button type="submit" disabled={!canSubmit}>
      {isSubmitting ? 'Saving...' : 'Submit'}
    </button>
  )}
</form.Subscribe>
```

## Nested & Array Fields
```tsx
// Nested object
<form.Field name="address.city">{...}</form.Field>

// Array field
<form.Field name="tags" mode="array">
  {(field) => (
    <>
      {field.state.value.map((_, i) => (
        <form.Field key={i} name={`tags[${i}]`}>
          {(subField) => <input value={subField.state.value} ... />}
        </form.Field>
      ))}
      <button onClick={() => field.pushValue('')}>Add Tag</button>
    </>
  )}
</form.Field>
```

## Server-Side Validation (TanStack Start)
```tsx
// server
import { createServerValidate } from '@tanstack/react-form/start'
const serverValidate = createServerValidate({
  validatorAdapter: zodValidator,
  onServerValidate: z.object({ email: z.string().email() }),
})

// client — merge server errors into form state
import { mergeForm, useTransform } from '@tanstack/react-form'
useTransform((state) => mergeForm(state, serverState), [serverState])
```

## Form State Properties
| Property | Type | Description |
|----------|------|-------------|
| `values` | `T` | Current form values |
| `errors` | `string[]` | Form-level errors |
| `canSubmit` | `boolean` | No errors + not submitting |
| `isSubmitting` | `boolean` | Submission in progress |
| `isDirty` | `boolean` | Values differ from defaults |
| `isTouched` | `boolean` | Any field touched |
| `isValid` | `boolean` | No validation errors |

## Field State Meta
| Property | Type | Description |
|----------|------|-------------|
| `errors` | `string[]` | Field validation errors |
| `isTouched` | `boolean` | Field was blurred |
| `isDirty` | `boolean` | Value changed from default |

## Schema Adapters
- `@tanstack/zod-form-adapter` — Zod
- `@tanstack/valibot-form-adapter` — Valibot
- `@tanstack/yup-form-adapter` — Yup (community)
