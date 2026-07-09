# DO Storage Testing

Testing Durable Objects with storage using `vitest-pool-workers`.

## Setup

**vitest.config.ts:**
```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: { wrangler: { configPath: "./wrangler.toml" } }
    }
  }
});
```

**package.json:** Add `@cloudflare/vitest-pool-workers` and `vitest` to devDependencies

## Basic Testing

```typescript
import { env, runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Counter DO", () => {
  it("increments counter", async () => {
    const id = env.COUNTER.idFromName("test");
    const result = await runInDurableObject(env.COUNTER, id, async (instance, state) => {
      const val1 = await instance.increment();
      const val2 = await instance.increment();
      return { val1, val2 };
    });
    expect(result.val1).toBe(1);
    expect(result.val2).toBe(2);
  });
});
```

## Testing SQL Storage

```typescript
it("creates and queries users", async () => {
  const id = env.USER_MANAGER.idFromName("test");
  await runInDurableObject(env.USER_MANAGER, id, async (instance, state) => {
    await instance.createUser("alice@example.com", "Alice");
    const user = await instance.getUser("alice@example.com");
    expect(user).toEqual({ email: "alice@example.com", name: "Alice" });
  });
});

it("handles schema migrations", async () => {
  const id = env.USER_MANAGER.idFromName("migration-test");
  await runInDurableObject(env.USER_MANAGER, id, async (instance, state) => {
    const version = state.storage.sql.exec(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    ).one()?.value;
    expect(version).toBe("1");
  });
});
```

## Testing Alarms

```typescript
import { runDurableObjectAlarm } from "cloudflare:test";

it("processes batch on alarm", async () => {
  const id = env.BATCH_PROCESSOR.idFromName("test");
  
  // Add items
  await runInDurableObject(env.BATCH_PROCESSOR, id, async (instance) => {
    await instance.addItem("item1");
    await instance.addItem("item2");
  });
  
  // Trigger alarm
  await runDurableObjectAlarm(env.BATCH_PROCESSOR, id);
  
  // Verify processed
  await runInDurableObject(env.BATCH_PROCESSOR, id, async (instance, state) => {
    const count = state.storage.sql.exec(
      "SELECT COUNT(*) as count FROM processed_items"
    ).one().count;
    expect(count).toBe(2);
  });
});
```

## Testing Concurrency

```typescript
it("handles concurrent increments safely", async () => {
  const id = env.COUNTER.idFromName("concurrent-test");
  
  // Parallel increments
  const results = await Promise.all([
    runInDurableObject(env.COUNTER, id, (i) => i.increment()),
    runInDurableObject(env.COUNTER, id, (i) => i.increment()),
    runInDurableObject(env.COUNTER, id, (i) => i.increment())
  ]);
  
  // All should get unique values
  expect(new Set(results).size).toBe(3);
  expect(Math.max(...results)).toBe(3);
});
```

## Test Isolation

```typescript
// Per-test unique IDs
let testId: string;
beforeEach(() => { testId = crypto.randomUUID(); });

it("isolated test", async () => {
  const id = env.MY_DO.idFromName(testId);
  // Uses unique DO instance
});

// Cleanup pattern
it("with cleanup", async () => {
  const id = env.MY_DO.idFromName("cleanup-test");
  try {
    await runInDurableObject(env.MY_DO, id, async (instance) => {});
  } finally {
    await runInDurableObject(env.MY_DO, id, async (instance, state) => {
      await state.storage.deleteAll();
    });
  }
});
```

## Testing PITR

```typescript
it("restores from bookmark", async () => {
  const id = env.MY_DO.idFromName("pitr-test");
  
  // Create checkpoint
  const bookmark = await runInDurableObject(env.MY_DO, id, async (instance, state) => {
    await state.storage.put("value", 1);
    return await state.storage.getCurrentBookmark();
  });
  
  // Modify and restore
  await runInDurableObject(env.MY_DO, id, async (instance, state) => {
    await state.storage.put("value", 2);
    await state.storage.onNextSessionRestoreBookmark(bookmark);
    state.abort();
  });
  
  // Verify restored
  await runInDurableObject(env.MY_DO, id, async (instance, state) => {
    const value = await state.storage.get("value");
    expect(value).toBe(1);
  });
});
```

## Testing Transactions

```typescript
it("rolls back on error", async () => {
  const id = env.BANK.idFromName("transaction-test");
  
  await runInDurableObject(env.BANK, id, async (instance, state) => {
    await state.storage.put("balance", 100);
    
    await expect(
      state.storage.transaction(async () => {
        await state.storage.put("balance", 50);
        throw new Error("Cancel");
      })
    ).rejects.toThrow("Cancel");
    
    const balance = await state.storage.get("balance");
    expect(balance).toBe(100); // Rolled back
  });
});
```
