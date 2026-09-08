# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint

## Framework-Level Mocking (Jest)

Module-level mocking is a boundary-mocking mechanism, not license to mock internal collaborators — apply the same "mock at boundaries only" rule above when choosing what to mock this way.

```typescript
// Mock entire module
jest.mock('utils/analytics');

// Mock with a factory function (control the shape returned)
jest.mock('utils/analytics', () => ({
  Analytics: { logEvent: jest.fn() },
}));

// Access the mock from within a test
const mockLogEvent = jest.requireMock('utils/analytics').Analytics.logEvent;
```

Mocking generated hooks (e.g. GraphQL codegen) follows the same shape — mock the generated module, cast the import as `jest.Mock`, then set return values per test:

```typescript
jest.mock('./GetItems.generated', () => ({ useGetItemsQuery: jest.fn() }));
const mockUseGetItemsQuery = jest.requireMock('./GetItems.generated').useGetItemsQuery as jest.Mock;

mockUseGetItemsQuery.mockReturnValue({ data: { items: [] }, loading: false, error: undefined });
```

Clear mocks between tests (`jest.clearAllMocks()` in `beforeEach`) so mock call history from one test never leaks into the next.
