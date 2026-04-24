# Contract Testing

## When to Use

- Microservices communicating via HTTP/REST
- Frontend consuming backend APIs
- Multiple teams working on separate services
- Preventing integration failures at runtime

## Pact (Consumer-Driven Contracts)

### Consumer Side

```typescript
import { Pact } from '@pact-foundation/pact';

const provider = new Pact({
  consumer: 'Frontend',
  provider: 'UserService',
});

describe('User API', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  it('gets user by id', async () => {
    await provider.addInteraction({
      state: 'user 123 exists',
      uponReceiving: 'request for user 123',
      withRequest: {
        method: 'GET',
        path: '/users/123',
      },
      willRespondWith: {
        status: 200,
        body: {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    });

    const user = await userClient.getUser('123');
    expect(user.name).toBe('John Doe');
  });
});
```

### Provider Side

```typescript
import { Verifier } from '@pact-foundation/pact';

describe('Pact Verification', () => {
  it('validates consumer expectations', async () => {
    await new Verifier({
      providerBaseUrl: 'http://localhost:3000',
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      provider: 'UserService',
      providerVersion: process.env.GIT_SHA,
      stateHandlers: {
        'user 123 exists': async () => {
          await db.users.insert({ id: '123', name: 'John Doe' });
        },
      },
    }).verifyProvider();
  });
});
```

## MSW (Mock Service Worker)

### Setup

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
    });
  }),
];

export const server = setupServer(...handlers);

// In test setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Per-Test Override

```typescript
it('handles server error', async () => {
  server.use(
    http.get('/api/users/:id', () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    })
  );

  await expect(userClient.getUser('123')).rejects.toThrow();
});
```

## Pact + MSW Combined

```typescript
// Use MSW to simulate provider during Pact consumer tests
const pactMswHandler = http.get('/api/users/:id', () => {
  return HttpResponse.json(expectedPactResponse);
});
```

## CI Integration

```yaml
# Consumer publishes contract
- run: npx pact-broker publish ./pacts
    --consumer-app-version=${{ github.sha }}
    --broker-base-url=${{ secrets.PACT_BROKER_URL }}

# Provider verifies
- run: npm run test:pact:verify
    --provider-app-version=${{ github.sha }}

# Can-I-Deploy check
- run: npx pact-broker can-i-deploy
    --pacticipant=Frontend
    --version=${{ github.sha }}
    --to-environment=production
```

## Best Practices

- **Consumer-first:** Consumers define expectations
- **Version contracts:** Tie to git SHA
- **Pact Broker:** Central contract management
- **can-i-deploy:** Gate deployments on contract verification
- **State handlers:** Prepare provider data for each scenario
