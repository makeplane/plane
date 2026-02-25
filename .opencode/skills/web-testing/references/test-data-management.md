# Test Data Management

## Faker.js (Dynamic Data Generation)

```typescript
import { faker } from '@faker-js/faker';

// Reproducible data (seeding)
faker.seed(123);

const user = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
  createdAt: faker.date.past(),
};
```

## Factory Pattern (Fishery)

```typescript
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

// Define factory
const userFactory = Factory.define<User>(() => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: 'user',
}));

// Usage
const user = userFactory.build();
const admin = userFactory.build({ role: 'admin' });
const users = userFactory.buildList(5);
```

## Factory with Associations

```typescript
const postFactory = Factory.define<Post>(({ associations }) => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  author: associations.author || userFactory.build(),
}));

const post = postFactory.build({
  author: userFactory.build({ role: 'admin' }),
});
```

## Fixtures (Static Baseline Data)

```typescript
// fixtures/users.ts
export const testUsers = {
  admin: {
    id: 'admin-001',
    email: 'admin@test.com',
    role: 'admin',
  },
  member: {
    id: 'member-001',
    email: 'member@test.com',
    role: 'member',
  },
};

// In tests
import { testUsers } from './fixtures/users';
```

## Combined Pattern (Fixtures + Factories)

```typescript
// Baseline fixtures for known states
const baseUser = testUsers.admin;

// Factory for dynamic variations
const dynamicUser = userFactory.build({
  ...baseUser,
  email: faker.internet.email(), // Override specific fields
});
```

## Database Seeding

```typescript
// seed.ts
async function seedTestData(db: Database, workerIndex: number) {
  // Worker-isolated data
  const prefix = `w${workerIndex}`;

  await db.users.insertMany([
    { id: `${prefix}-user-1`, email: `user1-${prefix}@test.com` },
    { id: `${prefix}-user-2`, email: `user2-${prefix}@test.com` },
  ]);
}

async function clearTestData(db: Database, workerIndex: number) {
  const prefix = `w${workerIndex}`;
  await db.users.deleteMany({ id: { $regex: `^${prefix}` } });
}
```

## Best Practices

- **Reproducibility:** Seed Faker for consistent test data
- **Isolation:** Prefix data with worker index for parallelism
- **Cleanup:** Always clean up in afterEach/afterAll
- **Minimal data:** Only create what's needed for test
- **Type safety:** Type your factories

## Anti-Patterns

```typescript
// BAD: Hardcoded values
const user = { email: 'test@test.com' }; // Collisions!

// GOOD: Dynamic generation
const user = { email: faker.internet.email() };

// BAD: Shared mutable state
let globalUser;
beforeAll(() => { globalUser = createUser(); });

// GOOD: Fresh data per test
beforeEach(() => { user = userFactory.build(); });
```
