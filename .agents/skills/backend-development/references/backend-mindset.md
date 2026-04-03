# Backend Development Mindset

Problem-solving approaches, architectural thinking, and collaboration patterns for backend engineers (2025).

## Problem-Solving Mindset

### Systems Thinking Approach

**Holistic Engineering** - Understanding how components interact within larger ecosystem

```
User Request
  → Load Balancer
  → API Gateway (auth, rate limiting)
  → Application (business logic)
  → Cache Layer (Redis)
  → Database (persistent storage)
  → Message Queue (async processing)
  → External Services
```

**Questions to Ask:**
- What happens if this component fails?
- How does this scale under load?
- What are the dependencies?
- Where are the bottlenecks?
- What's the blast radius of changes?

### Breaking Down Complex Problems

**Decomposition Strategy:**

1. **Understand requirements** - What problem are we solving?
2. **Identify constraints** - Performance, budget, timeline, tech stack
3. **Break into modules** - Separate concerns (auth, data, business logic)
4. **Define interfaces** - API contracts between modules
5. **Prioritize** - Critical path first
6. **Iterate** - Build, test, refine

**Example: Building Payment System**

```
Complex: "Build payment processing"

Decomposed:
1. Payment gateway integration (Stripe/PayPal)
2. Order creation and validation
3. Payment intent creation
4. Webhook handling (success/failure)
5. Idempotency (prevent double charges)
6. Retry logic for transient failures
7. Audit logging
8. Refund processing
9. Reconciliation system
```

## Trade-Off Analysis

### CAP Theorem (Choose 2 of 3)

**Consistency** - All nodes see same data at same time
**Availability** - Every request receives response
**Partition Tolerance** - System works despite network failures

**Real-World Choices:**
- **CP (Consistency + Partition Tolerance):** Banking systems, financial transactions
- **AP (Availability + Partition Tolerance):** Social media feeds, product catalogs
- **CA (Consistency + Availability):** Single-node databases (not distributed)

### PACELC Extension

**If Partition:** Choose Availability or Consistency
**Else (no partition):** Choose Latency or Consistency

**Examples:**
- **PA/EL:** Cassandra (available during partition, low latency normally)
- **PC/EC:** HBase (consistent during partition, consistent over latency)
- **PA/EC:** DynamoDB (configurable consistency vs latency)

### Performance vs Maintainability

| Optimize For | When to Choose |
|--------------|---------------|
| **Performance** | Hot paths, high-traffic endpoints, real-time systems |
| **Maintainability** | Internal tools, admin dashboards, CRUD operations |
| **Both** | Core business logic, payment processing, authentication |

**Example:**
```typescript
// Maintainable: Readable, easy to debug
const users = await db.users.findAll({
  where: { active: true },
  include: ['posts', 'comments'],
});

// Performant: Optimized query, reduced joins
const users = await db.query(`
  SELECT u.*,
    (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
    (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count
  FROM users u
  WHERE u.active = true
`);
```

### Technical Debt Management

**20-40% productivity increase** from addressing technical debt properly

**Debt Quadrants:**
1. **Reckless + Deliberate:** "We don't have time for design"
2. **Reckless + Inadvertent:** "What's layering?"
3. **Prudent + Deliberate:** "Ship now, refactor later" (acceptable)
4. **Prudent + Inadvertent:** "Now we know better" (acceptable)

**Prioritization:**
- High interest, high impact → Fix immediately
- High interest, low impact → Schedule in sprint
- Low interest, high impact → Tech debt backlog
- Low interest, low impact → Leave as-is

## Architectural Thinking

### Domain-Driven Design (DDD)

**Bounded Contexts** - Separate models for different domains

```
E-commerce System:

[Sales Context]          [Inventory Context]       [Shipping Context]
- Order (id, items,      - Product (id, stock,     - Shipment (id,
  total, customer)        location, reserved)       address, status)
- Customer (id, email)   - Warehouse (id, name)    - Carrier (name, API)
- Payment (status)       - StockLevel (quantity)   - Tracking (number)

Each context has its own:
- Data model
- Business rules
- Database schema
- API contracts
```

**Ubiquitous Language** - Shared vocabulary between devs and domain experts

### Layered Architecture (Separation of Concerns)

```
┌─────────────────────────────┐
│   Presentation Layer        │  Controllers, Routes, DTOs
│   (API endpoints)           │
├─────────────────────────────┤
│   Business Logic Layer      │  Services, Use Cases, Domain Logic
│   (Core logic)              │
├─────────────────────────────┤
│   Data Access Layer         │  Repositories, ORMs, Database
│   (Persistence)             │
└─────────────────────────────┘
```

**Benefits:**
- Clear responsibilities
- Easier testing (mock layers)
- Flexibility to change implementations
- Reduced coupling

### Designing for Failure (Resilience)

**Assume everything fails eventually**

**Patterns:**
1. **Circuit Breaker** - Stop calling failing service
2. **Retry with Backoff** - Exponential delay between retries
3. **Timeout** - Don't wait forever
4. **Fallback** - Graceful degradation
5. **Bulkhead** - Isolate failures (resource pools)

```typescript
import { CircuitBreaker } from 'opossum';

const breaker = new CircuitBreaker(externalAPICall, {
  timeout: 3000, // 3s timeout
  errorThresholdPercentage: 50, // Open after 50% failures
  resetTimeout: 30000, // Try again after 30s
});

breaker.fallback(() => ({ data: 'cached-response' }));

const result = await breaker.fire(requestParams);
```

## Developer Mindset

### Writing Maintainable Code

**SOLID Principles:**

**S - Single Responsibility** - Class/function does one thing
```typescript
// Bad: User class handles auth + email + logging
class User {
  authenticate() {}
  sendEmail() {}
  logActivity() {}
}

// Good: Separate responsibilities
class User {
  authenticate() {}
}
class EmailService {
  sendEmail() {}
}
class Logger {
  logActivity() {}
}
```

**O - Open/Closed** - Open for extension, closed for modification
```typescript
// Good: Strategy pattern
interface PaymentStrategy {
  process(amount: number): Promise<PaymentResult>;
}

class StripePayment implements PaymentStrategy {
  async process(amount: number) { /* ... */ }
}

class PayPalPayment implements PaymentStrategy {
  async process(amount: number) { /* ... */ }
}
```

### Thinking About Edge Cases

**Common Edge Cases:**
- Empty arrays/collections
- Null/undefined values
- Boundary values (min/max integers)
- Concurrent requests (race conditions)
- Network failures
- Duplicate requests (idempotency)
- Invalid input (SQL injection, XSS)

```typescript
// Good: Handle edge cases explicitly
async function getUsers(limit?: number) {
  // Validate input
  if (limit !== undefined && (limit < 1 || limit > 1000)) {
    throw new Error('Limit must be between 1 and 1000');
  }

  // Handle undefined
  const safeLimit = limit ?? 50;

  // Prevent SQL injection with parameterized query
  const users = await db.query('SELECT * FROM users LIMIT $1', [safeLimit]);

  // Handle empty results
  return users.length > 0 ? users : [];
}
```

### Testing Mindset (TDD/BDD)

**70% happy-path tests drafted by AI, humans focus on edge cases**

**Test-Driven Development (TDD):**
```
1. Write failing test
2. Write minimal code to pass
3. Refactor
4. Repeat
```

**Behavior-Driven Development (BDD):**
```gherkin
Feature: User Registration
  Scenario: User registers with valid email
    Given I am on the registration page
    When I enter "test@example.com" as email
    And I enter "SecurePass123!" as password
    Then I should see "Registration successful"
    And I should receive a welcome email
```

### Observability and Debugging Approach

**100% median ROI, $500k average return** from observability investments

**Three Questions:**
1. **Is it slow?** → Check metrics (response time, DB queries)
2. **Is it broken?** → Check logs (errors, stack traces)
3. **Where is it broken?** → Check traces (distributed systems)

```typescript
// Good: Structured logging with context
logger.error('Payment processing failed', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  error: error.message,
  stack: error.stack,
  timestamp: Date.now(),
  ipAddress: req.ip,
});
```

## Collaboration & Communication

### API Contract Design (Treating APIs as Products)

**Principles:**
1. **Versioning** - `/api/v1/users`, `/api/v2/users`
2. **Consistency** - Same patterns across endpoints
3. **Documentation** - OpenAPI/Swagger
4. **Backward compatibility** - Don't break existing clients
5. **Clear error messages** - Help clients fix issues

```typescript
// Good: Consistent API design
GET    /api/v1/users         # List users
GET    /api/v1/users/:id     # Get user
POST   /api/v1/users         # Create user
PUT    /api/v1/users/:id     # Update user
DELETE /api/v1/users/:id     # Delete user

// Consistent error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email",
    "timestamp": "2025-01-09T12:00:00Z"
  }
}
```

### Database Schema Design Discussions

**Key Considerations:**
- **Normalization vs Denormalization** - Trade-offs for performance
- **Indexing strategy** - Query patterns dictate indexes
- **Migration path** - How to evolve schema without downtime
- **Data types** - VARCHAR(255) vs TEXT, INT vs BIGINT
- **Constraints** - Foreign keys, unique constraints, check constraints

### Code Review Mindset (Prevention-First)

**What to Look For:**
- Security vulnerabilities (SQL injection, XSS)
- Performance issues (N+1 queries, missing indexes)
- Error handling (uncaught exceptions)
- Edge cases (null checks, boundary values)
- Readability (naming, comments for complex logic)
- Tests (coverage for new code)

**Constructive Feedback:**
```
# Good review comment
"This could be vulnerable to SQL injection. Consider using parameterized queries:
`db.query('SELECT * FROM users WHERE id = $1', [userId])`"

# Bad review comment
"This is wrong. Fix it."
```

## Mindset Checklist

- [ ] Think in systems (understand dependencies)
- [ ] Analyze trade-offs (CAP, performance vs maintainability)
- [ ] Design for failure (circuit breakers, retries)
- [ ] Apply SOLID principles
- [ ] Consider edge cases (null, empty, boundaries)
- [ ] Write tests first (TDD/BDD)
- [ ] Log with context (structured logging)
- [ ] Design APIs as products (versioning, docs)
- [ ] Plan database schema evolution
- [ ] Give constructive code reviews

## Resources

- **Domain-Driven Design:** https://martinfowler.com/bliki/DomainDrivenDesign.html
- **CAP Theorem:** https://en.wikipedia.org/wiki/CAP_theorem
- **SOLID Principles:** https://en.wikipedia.org/wiki/SOLID
- **Resilience Patterns:** https://docs.microsoft.com/en-us/azure/architecture/patterns/
