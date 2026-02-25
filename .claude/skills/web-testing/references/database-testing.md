# Database Testing

## Testcontainers (Real Database Instances)

### Setup

```bash
npm install -D @testcontainers/postgresql
# or
npm install -D @testcontainers/mongodb
```

### PostgreSQL Example

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';

describe('User Repository', () => {
  let container: PostgreSqlContainer;
  let pool: Pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('testdb')
      .start();

    pool = new Pool({ connectionString: container.getConnectionUri() });
    await runMigrations(pool);
  }, 60000); // 60s timeout for container start

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  afterEach(async () => {
    await pool.query('TRUNCATE users RESTART IDENTITY CASCADE');
  });

  it('creates user', async () => {
    const repo = new UserRepository(pool);
    const user = await repo.create({ email: 'test@example.com' });
    expect(user.id).toBeDefined();
  });
});
```

### MongoDB Example

```typescript
import { MongoDBContainer } from '@testcontainers/mongodb';
import mongoose from 'mongoose';

describe('User Repository', () => {
  let container: MongoDBContainer;

  beforeAll(async () => {
    container = await new MongoDBContainer().start();
    await mongoose.connect(container.getConnectionString(), {
      directConnection: true,
    });
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });
});
```

## Transaction Rollback Pattern

```typescript
describe('User Service', () => {
  let transaction: Transaction;

  beforeEach(async () => {
    transaction = await db.transaction();
  });

  afterEach(async () => {
    await transaction.rollback(); // Always rollback
  });

  it('creates user within transaction', async () => {
    const service = new UserService(transaction);
    await service.create({ email: 'test@example.com' });
    // Transaction rolls back - no cleanup needed
  });
});
```

## Playwright Database Fixture

```typescript
// fixtures/db.ts
import { test as base } from '@playwright/test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export const test = base.extend<{ db: Pool }>({
  db: [async ({}, use, testInfo) => {
    const container = await new PostgreSqlContainer().start();
    const pool = new Pool({ connectionString: container.getConnectionUri() });

    // Seed per-worker data
    await seedData(pool, testInfo.workerIndex);

    await use(pool);

    await pool.end();
    await container.stop();
  }, { scope: 'worker' }]
});
```

## In-Memory Alternatives

```typescript
// SQLite in-memory (faster, less realistic)
const db = new Database(':memory:');

// PGlite (Postgres in browser/Node)
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
```

## Best Practices

- **Real DB in CI:** Use Testcontainers for high fidelity
- **In-memory locally:** Faster iteration during development
- **Isolation:** Worker-scoped containers for parallel tests
- **Migrations:** Always run migrations before tests
- **Cleanup:** Truncate after each test, stop containers after all
- **Timeouts:** Increase timeout for container startup (60s)
