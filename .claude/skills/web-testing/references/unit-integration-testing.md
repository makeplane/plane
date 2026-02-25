# Unit & Integration Testing

## Framework Comparison

| Framework | Speed | Best For |
|-----------|-------|----------|
| Vitest | Fastest | Modern projects, Vite |
| Jest | Fast | React/CRA legacy |
| Bun test | Ultra-fast | Bun projects |

## Vitest Setup

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom', // or 'happy-dom'
    globals: true,
    coverage: { reporter: ['text', 'json', 'html'] },
  },
});
```

## Vitest Browser Mode (Real Browser)

```typescript
// vitest.config.ts - higher fidelity than jsdom
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
    },
  },
});
```

**When to use:** Complex DOM interactions, CSS testing, browser APIs

## Test Structure (AAA)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it('creates user with valid data', () => {
    // Arrange
    const userData = { email: 'test@example.com' };

    // Act
    const user = service.create(userData);

    // Assert
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('throws on invalid email', () => {
    expect(() => service.create({ email: 'invalid' }))
      .toThrow('Invalid email');
  });
});
```

## Integration Test

```typescript
describe('User API', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database(':memory:');
    await db.migrate();
  });

  afterEach(async () => {
    await db.clearAllTables();
  });

  it('persists and retrieves user', async () => {
    await db.users.insert({ email: 'test@example.com' });
    const user = await db.users.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
  });
});
```

## Test Naming

```typescript
// Good - describes behavior
it('should return 200 when valid token provided');
it('should throw ValidationError when email invalid');

// Bad - vague
it('test1');
it('works');
```

## Mocking

```typescript
import { vi } from 'vitest';

// Mock module
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ name: 'John' })
}));

// Spy
const spy = vi.spyOn(console, 'log');
expect(spy).toHaveBeenCalledWith('message');
```

## Coverage Targets

| Area | Target |
|------|--------|
| Critical paths | 100% |
| Core features | 80-90% |
| Overall | 75-85% |

## Commands

```bash
npx vitest run              # Run all
npx vitest                  # Watch mode
npx vitest run --coverage   # Coverage
npx vitest run -u           # Update snapshots
npx vitest --browser        # Browser mode
```
