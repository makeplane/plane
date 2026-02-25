# API Testing

## Supertest (Jest/Vitest)

```javascript
import request from 'supertest';
import app from './app';

describe('POST /users', () => {
  it('creates user with valid data', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    await request(app).post('/users').send({ email: 'dup@example.com' });
    const res = await request(app).post('/users').send({ email: 'dup@example.com' });
    expect(res.status).toBe(409);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });
});
```

## API Checklist

### Authentication
- [ ] Valid credentials return 200 + token
- [ ] Invalid credentials return 401
- [ ] Missing/expired token returns 401

### Authorization
- [ ] User accesses own resources
- [ ] Cannot access others' resources (403)

### Input Validation
- [ ] Missing required fields → 400
- [ ] Invalid types → 400
- [ ] SQL/XSS payloads rejected

### Response
- [ ] Correct status codes
- [ ] Schema matches docs
- [ ] Error messages helpful

### Rate Limiting
- [ ] Rate limit headers present
- [ ] 429 when limit exceeded

## Postman Tests

```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has user ID", () => {
  pm.expect(pm.response.json().id).to.be.a('number');
});
```

## GraphQL Testing

```typescript
const query = `query { users { id email } }`;
const res = await request(app).post('/graphql').send({ query });
expect(res.body.data.users).toHaveLength(2);
```

## Contract Testing

```bash
npx dredd api.yaml http://localhost:3000
```
