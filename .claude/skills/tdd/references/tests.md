# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

**Tautological tests**: Expected value restates the implementation, so the test passes by construction.

```typescript
// BAD: Expected value is recomputed the way the code computes it
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, i) => sum + i.price, 0);
  expect(calculateTotal(items)).toBe(expected);
});

// GOOD: Expected value is an independent, known literal
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
});
```

## Factory Pattern (Jest / Testing Library)

Create `getMockX(overrides?: Partial<X>)` functions with sensible defaults and the ability to override specific fields — keeps tests DRY and prevents accidental inconsistency between test cases (e.g. one test's fixture missing a field another test relies on).

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const getMockUser = (overrides?: Partial<User>): User => ({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  ...overrides,
});

// Usage
test('displays admin badge for admin users', () => {
  const user = getMockUser({ role: 'admin' });
  renderWithTheme(<UserCard user={user} />);
  expect(screen.getByText('Admin')).toBeTruthy();
});
```

The same pattern applies to component props factories (`getMockMyComponentProps`) and to a custom render helper that wraps components with required providers (`renderWithTheme`) so every test doesn't re-declare the provider tree.

**Anti-pattern — not using factories:**

```typescript
// BAD: duplicated, inconsistent test data (test 2 is missing `role`)
it('test 1', () => { const user = { id: '1', name: 'John', email: 'john@test.com', role: 'user' }; });
it('test 2', () => { const user = { id: '2', name: 'Jane', email: 'jane@test.com' }; });

// GOOD: reusable factory, always complete
const user = getMockUser({ name: 'Custom Name' });
```

## Query Patterns (Testing Library)

```typescript
expect(screen.getByText('Hello')).toBeTruthy();       // must exist
expect(screen.queryByText('Goodbye')).toBeNull();      // must not exist
await waitFor(() => {                                  // appears asynchronously
  expect(screen.findByText('Loaded')).toBeTruthy();
});
```

Prefer `getByRole`/`getByLabel`/`getByText` (accessible, resilient to markup changes) over test IDs or CSS selectors — this mirrors the same locator-priority guidance in `library/skills/e2e-testing/`.
