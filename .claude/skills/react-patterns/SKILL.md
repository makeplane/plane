---
name: react-patterns
description: Modern React patterns and principles. Hooks, composition, performance, TypeScript best practices.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
disallowed-tools:
  - WebFetch
  - WebSearch
---

# React Patterns

> Principles for building production-ready React applications.

---

## 1. Component Design Principles

### Component Types

| Type | Use | State |
|------|-----|-------|
| **Server** | Data fetching, static | None |
| **Client** | Interactivity | useState, effects |
| **Presentational** | UI display | Props only |
| **Container** | Logic/state | Heavy state |

### Design Rules

- One responsibility per component
- Props down, events up
- Composition over inheritance
- Prefer small, focused components

---

## 2. Hook Patterns

### When to Extract Hooks

| Pattern | Extract When |
|---------|-------------|
| **useLocalStorage** | Same storage logic needed |
| **useDebounce** | Multiple debounced values |
| **useFetch** | Repeated fetch patterns |
| **useForm** | Complex form state |

### Hook Rules

- Hooks at top level only
- Same order every render
- Custom hooks start with "use"
- Clean up effects on unmount

---

## 3. State Management Selection

| Complexity | Solution |
|------------|----------|
| Simple | useState, useReducer |
| Shared local | Context |
| Server state | React Query, SWR |
| Complex global | Zustand, Redux Toolkit |

### State Placement

| Scope | Where |
|-------|-------|
| Single component | useState |
| Parent-child | Lift state up |
| Subtree | Context |
| App-wide | Global store |

### Selection Criteria (decision-driven, not default-driven)

```
Small app, simple state    → Zustand or Jotai
Large app, complex state   → Redux Toolkit
Heavy server interaction   → React Query + light client state
Atomic/granular updates    → Jotai
```

| State type | Description | Solutions |
|------------|-------------|-----------|
| Local | Component-specific, UI state | useState, useReducer |
| Global | Shared across components | Redux Toolkit, Zustand, Jotai |
| Server | Remote data, caching | React Query, SWR, RTK Query |
| URL | Route params, search | React Router, nuqs |
| Form | Input values, validation | React Hook Form, Formik |

### Zustand (recommended default for small/medium apps)

Always wrap with `subscribeWithSelector` for outside-React subscriptions, and separate state/actions in the type:

```typescript
import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

interface MyState { items: Item[]; isLoading: boolean }
interface MyActions { addItem: (item: Item) => void; loadItems: () => Promise<void> }
type MyStore = MyState & MyActions

export const useMyStore = create<MyStore>()(
  subscribeWithSelector(devtools(persist((set, get) => ({
    items: [], isLoading: false,
    addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    loadItems: async () => { set({ isLoading: true }); /* ... */ },
  }), { name: 'app-storage' })))
)

// Individual selectors only — re-renders on the whole store otherwise
const items = useMyStore((state) => state.items)          // good
const { items, isLoading } = useMyStore()                  // avoid — re-renders on any change

// Subscribe outside React (e.g. in a non-component module)
useMyStore.subscribe((state) => state.selectedId, (id) => console.log('Selected:', id))
```

**Slices pattern for scale** — one `StateCreator` per domain, composed into a single store so slices can read each other via `get()`:

```typescript
export const createUserSlice: StateCreator<UserSlice & CartSlice, [], [], UserSlice> = (set, get) => ({
  user: null, isAuthenticated: false,
  login: async (creds) => { const user = await authApi.login(creds); set({ user, isAuthenticated: true }) },
  logout: () => { set({ user: null, isAuthenticated: false }); /* get().clearCart() */ },
})
export const useStore = create<UserSlice & CartSlice>()((...a) => ({ ...createUserSlice(...a), ...createCartSlice(...a) }))
```

### Redux Toolkit (for large/complex global state)

`configureStore` + `createSlice` + `createAsyncThunk`, with typed `useAppDispatch`/`useAppSelector` hooks. Immer lets reducers "mutate" state directly (`state.push(...)`) instead of hand-rolled immutable spreads — this is the main ergonomic win over legacy Redux.

### Jotai (for atomic/granular updates)

Bottom-up atoms instead of a top-down store — `atom()` for primitives, derived atoms (`atom((get) => ...)`) for computed values, `atomWithStorage` for persistence, async atoms (Suspense-enabled) for data that depends on another atom, and write-only "action" atoms (`atom(null, (get, set) => ...)`) for multi-atom side effects like logout.

### React Query (server state — don't duplicate it in client state)

Query-key factories (`userKeys.all/list/detail`) keep cache keys consistent across the codebase. Mutations use the optimistic-update triad — `onMutate` (cancel in-flight queries, snapshot, apply optimistic value) → `onError` (rollback to snapshot) → `onSettled` (invalidate to resync with server truth).

### Combining client + server state

Keep them in separate stores by nature, not by convenience — Zustand (or Jotai) owns UI-only state (sidebar open, active modal), React Query owns anything that originated from the server. Don't mirror server data into a Zustand store "for convenience" — it goes stale and now there are two sources of truth.

---

## 4. React 19 Patterns

### New Hooks

| Hook | Purpose |
|------|---------|
| **useActionState** | Form submission state |
| **useOptimistic** | Optimistic UI updates |
| **use** | Read resources in render |

### Compiler Benefits

- Automatic memoization
- Less manual useMemo/useCallback
- Focus on pure components

---

## 5. Composition Patterns

### Compound Components

- Parent provides context
- Children consume context
- Flexible slot-based composition
- Example: Tabs, Accordion, Dropdown

### Render Props vs Hooks

| Use Case | Prefer |
|----------|--------|
| Reusable logic | Custom hook |
| Render flexibility | Render props |
| Cross-cutting | Higher-order component |

---

## 6. Performance Principles

### When to Optimize

| Signal | Action |
|--------|--------|
| Slow renders | Profile first |
| Large lists | Virtualize |
| Expensive calc | useMemo |
| Stable callbacks | useCallback |

### Optimization Order

1. Check if actually slow
2. Profile with DevTools
3. Identify bottleneck
4. Apply targeted fix

---

## 7. Error Handling

### Error Boundary Usage

| Scope | Placement |
|-------|-----------|
| App-wide | Root level |
| Feature | Route/feature level |
| Component | Around risky component |

### Error Recovery

- Show fallback UI
- Log error
- Offer retry option
- Preserve user data

---

## 8. TypeScript Patterns

### Props Typing

| Pattern | Use |
|---------|-----|
| Interface | Component props |
| Type | Unions, complex |
| Generic | Reusable components |

### Common Types

| Need | Type |
|------|------|
| Children | ReactNode |
| Event handler | MouseEventHandler |
| Ref | RefObject<Element> |

---

## 9. Testing Principles

| Level | Focus |
|-------|-------|
| Unit | Pure functions, hooks |
| Integration | Component behavior |
| E2E | User flows |

### Test Priorities

- User-visible behavior
- Edge cases
- Error states
- Accessibility

---

## 10. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Prop drilling deep | Use context |
| Giant components | Split smaller |
| useEffect for everything | Server components |
| Premature optimization | Profile first |
| Index as key | Stable unique ID |

---

> **Remember:** React is about composition. Build small, combine thoughtfully.
