# Backend Testing Strategies

Comprehensive testing approaches, frameworks, and quality assurance practices (2025).

## Test Pyramid (70-20-10 Rule)

```
        /\
       /E2E\     10% - End-to-End Tests
      /------\
     /Integr.\ 20% - Integration Tests
    /----------\
   /   Unit     \ 70% - Unit Tests
  /--------------\
```

**Rationale:**
- Unit tests: Fast, cheap, isolate bugs quickly
- Integration tests: Verify component interactions
- E2E tests: Expensive, slow, but validate real user flows

## Unit Testing

### Frameworks by Language

**TypeScript/JavaScript:**
- **Vitest** - 50% faster than Jest in CI/CD, ESM native
- **Jest** - Mature, large ecosystem, snapshot testing

**Python:**
- **Pytest** - Industry standard, fixtures, parametrization
- **Unittest** - Built-in, standard library

**Go:**
- **testing** - Built-in, table-driven tests
- **testify** - Assertions and mocking

### Best Practices

```typescript
// Good: Test single responsibility
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test' };
      const user = await userService.createUser(userData);

      expect(user).toMatchObject(userData);
      expect(user.id).toBeDefined();
    });

    it('should throw error with duplicate email', async () => {
      const userData = { email: 'existing@example.com', name: 'Test' };

      await expect(userService.createUser(userData))
        .rejects.toThrow('Email already exists');
    });

    it('should hash password before storing', async () => {
      const userData = { email: 'test@example.com', password: 'plain123' };
      const user = await userService.createUser(userData);

      expect(user.password).not.toBe('plain123');
      expect(user.password).toMatch(/^\$argon2id\$/);
    });
  });
});
```

### Mocking

```typescript
// Mock external dependencies
jest.mock('./emailService');

it('should send welcome email after user creation', async () => {
  const emailService = require('./emailService');
  emailService.sendWelcomeEmail = jest.fn();

  await userService.createUser({ email: 'test@example.com' });

  expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com');
});
```

## Integration Testing

### API Integration Tests

```typescript
import request from 'supertest';
import { app } from '../app';

describe('POST /api/users', () => {
  beforeAll(async () => {
    await db.connect(); // Real database connection (test DB)
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    await db.users.deleteMany({}); // Clean state
  });

  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);

    expect(response.body).toMatchObject({
      email: 'test@example.com',
      name: 'Test User',
    });

    // Verify database persistence
    const user = await db.users.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
  });

  it('should return 400 for invalid email', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: 'invalid-email', name: 'Test' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid email format');
      });
  });
});
```

### Database Testing with TestContainers

```typescript
import { GenericContainer } from 'testcontainers';

let container;
let db;

beforeAll(async () => {
  // Spin up real PostgreSQL in Docker
  container = await new GenericContainer('postgres:15')
    .withEnvironment({ POSTGRES_PASSWORD: 'test' })
    .withExposedPorts(5432)
    .start();

  const port = container.getMappedPort(5432);
  db = await createConnection({
    host: 'localhost',
    port,
    database: 'test',
    password: 'test',
  });
}, 60000);

afterAll(async () => {
  await container.stop();
});
```

## Contract Testing (Microservices)

### Pact (Consumer-Driven Contracts)

```typescript
// Consumer test
import { Pact } from '@pact-foundation/pact';

const provider = new Pact({
  consumer: 'UserService',
  provider: 'AuthService',
});

describe('Auth Service Contract', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  it('should validate user token', async () => {
    await provider.addInteraction({
      state: 'user token exists',
      uponReceiving: 'a request to validate token',
      withRequest: {
        method: 'POST',
        path: '/auth/validate',
        headers: { 'Content-Type': 'application/json' },
        body: { token: 'valid-token-123' },
      },
      willRespondWith: {
        status: 200,
        body: { valid: true, userId: '123' },
      },
    });

    const response = await authClient.validateToken('valid-token-123');
    expect(response.valid).toBe(true);
  });
});
```

## Load Testing

### Tools Comparison

**k6** (Modern, Developer-Friendly)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests under 500ms
  },
};

export default function () {
  const res = http.get('https://api.example.com/users');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

**Gatling** (JVM-based, Advanced Scenarios)
**JMeter** (GUI-based, Traditional)

### Performance Thresholds

- **Response time:** p95 < 500ms, p99 < 1s
- **Throughput:** 1000+ req/sec (target based on SLA)
- **Error rate:** < 1%
- **Concurrent users:** Test at 2x expected peak

## E2E Testing

### Playwright (Modern, Multi-Browser)

```typescript
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Navigate to registration page
  await page.goto('https://app.example.com/register');

  // Fill registration form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome');

  // Verify API call was made
  const response = await page.waitForResponse('/api/users');
  expect(response.status()).toBe(201);
});
```

## Database Migration Testing

**Critical:** 83% migrations fail without proper testing

```typescript
describe('Database Migrations', () => {
  it('should migrate from v1 to v2 without data loss', async () => {
    // Insert test data in v1 schema
    await db.query(`
      INSERT INTO users (id, email, name)
      VALUES (1, 'test@example.com', 'Test User')
    `);

    // Run migration
    await runMigration('v2-add-created-at.sql');

    // Verify v2 schema
    const result = await db.query('SELECT * FROM users WHERE id = 1');
    expect(result.rows[0]).toMatchObject({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      created_at: expect.any(Date),
    });
  });

  it('should rollback migration successfully', async () => {
    await runMigration('v2-add-created-at.sql');
    await rollbackMigration('v2-add-created-at.sql');

    // Verify v1 schema restored
    const columns = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
    `);
    expect(columns.rows.map(r => r.column_name)).not.toContain('created_at');
  });
});
```

## Security Testing

### SAST (Static Application Security Testing)

```bash
# SonarQube for code quality + security
sonar-scanner \
  -Dsonar.projectKey=my-backend \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000

# Semgrep for security patterns
semgrep --config auto src/
```

### DAST (Dynamic Application Security Testing)

```bash
# OWASP ZAP for runtime security scanning
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.example.com \
  -r zap-report.html
```

### Dependency Scanning (SCA)

```bash
# npm audit for Node.js
npm audit fix

# Snyk for multi-language
snyk test
snyk monitor  # Continuous monitoring
```

## Code Coverage

### Target Metrics (SonarQube Standards)

- **Overall coverage:** 80%+
- **Critical paths:** 100% (authentication, payment, data integrity)
- **New code:** 90%+

### Implementation

```bash
# Vitest with coverage
vitest run --coverage

# Jest with coverage
jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
```

## CI/CD Testing Pipeline

```yaml
# GitHub Actions example
name: Test Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Unit Tests
        run: npm run test:unit

      - name: Integration Tests
        run: npm run test:integration

      - name: E2E Tests
        run: npm run test:e2e

      - name: Load Tests
        run: k6 run load-test.js

      - name: Security Scan
        run: npm audit && snyk test

      - name: Coverage Report
        run: npm run test:coverage

      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
```

## Testing Best Practices

1. **Arrange-Act-Assert (AAA) Pattern**
2. **One assertion per test** (when practical)
3. **Descriptive test names** - `should throw error when email is invalid`
4. **Test edge cases** - Empty inputs, boundary values, null/undefined
5. **Clean test data** - Reset database state between tests
6. **Fast tests** - Unit tests < 10ms, Integration < 100ms
7. **Deterministic** - No flaky tests, avoid sleep(), use waitFor()
8. **Independent** - Tests don't depend on execution order

## Testing Checklist

- [ ] Unit tests cover 70% of codebase
- [ ] Integration tests for all API endpoints
- [ ] Contract tests for microservices
- [ ] Load tests configured (k6/Gatling)
- [ ] E2E tests for critical user flows
- [ ] Database migration tests
- [ ] Security scanning in CI/CD (SAST, DAST, SCA)
- [ ] Code coverage reports automated
- [ ] Tests run on every PR
- [ ] Flaky tests eliminated

## Resources

- **Vitest:** https://vitest.dev/
- **Playwright:** https://playwright.dev/
- **k6:** https://k6.io/docs/
- **Pact:** https://docs.pact.io/
- **TestContainers:** https://testcontainers.com/
