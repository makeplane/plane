# Backend Code Quality

SOLID principles, design patterns, clean code practices, and refactoring strategies (2025).

## SOLID Principles

### Single Responsibility Principle (SRP)

**Concept:** Class/module should have one reason to change

**Bad:**
```typescript
class User {
  saveToDatabase() { /* ... */ }
  sendWelcomeEmail() { /* ... */ }
  generateReport() { /* ... */ }
  validateInput() { /* ... */ }
}
```

**Good:**
```typescript
class User {
  constructor(public id: string, public email: string, public name: string) {}
}

class UserRepository {
  async save(user: User) { /* ... */ }
  async findById(id: string) { /* ... */ }
}

class EmailService {
  async sendWelcomeEmail(user: User) { /* ... */ }
}

class UserValidator {
  validate(userData: any) { /* ... */ }
}

class ReportGenerator {
  generateUserReport(user: User) { /* ... */ }
}
```

### Open/Closed Principle (OCP)

**Concept:** Open for extension, closed for modification

**Bad:**
```typescript
class PaymentProcessor {
  process(amount: number, method: string) {
    if (method === 'stripe') {
      // Stripe logic
    } else if (method === 'paypal') {
      // PayPal logic
    }
    // Adding new payment method requires modifying this class
  }
}
```

**Good (Strategy Pattern):**
```typescript
interface PaymentStrategy {
  process(amount: number): Promise<PaymentResult>;
}

class StripePayment implements PaymentStrategy {
  async process(amount: number) {
    // Stripe-specific logic
    return { success: true, transactionId: '...' };
  }
}

class PayPalPayment implements PaymentStrategy {
  async process(amount: number) {
    // PayPal-specific logic
    return { success: true, transactionId: '...' };
  }
}

class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}

  async process(amount: number) {
    return this.strategy.process(amount);
  }
}

// Usage
const processor = new PaymentProcessor(new StripePayment());
await processor.process(100);
```

### Liskov Substitution Principle (LSP)

**Concept:** Subtypes must be substitutable for base types

**Bad:**
```typescript
class Bird {
  fly() { /* ... */ }
}

class Penguin extends Bird {
  fly() {
    throw new Error('Penguins cannot fly!');
  }
}

// Violates LSP - Penguin breaks Bird contract
```

**Good:**
```typescript
interface Bird {
  move(): void;
}

class FlyingBird implements Bird {
  move() {
    this.fly();
  }
  private fly() { /* ... */ }
}

class Penguin implements Bird {
  move() {
    this.swim();
  }
  private swim() { /* ... */ }
}
```

### Interface Segregation Principle (ISP)

**Concept:** Clients shouldn't depend on interfaces they don't use

**Bad:**
```typescript
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* ... */ }
  eat() { throw new Error('Robots don't eat'); }
  sleep() { throw new Error('Robots don't sleep'); }
}
```

**Good:**
```typescript
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work() { /* ... */ }
  eat() { /* ... */ }
  sleep() { /* ... */ }
}

class Robot implements Workable {
  work() { /* ... */ }
}
```

### Dependency Inversion Principle (DIP)

**Concept:** Depend on abstractions, not concretions

**Bad:**
```typescript
class MySQLDatabase {
  query(sql: string) { /* ... */ }
}

class UserService {
  private db = new MySQLDatabase(); // Tight coupling

  async getUser(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}
```

**Good (Dependency Injection):**
```typescript
interface Database {
  query(sql: string, params: any[]): Promise<any>;
}

class MySQLDatabase implements Database {
  async query(sql: string, params: any[]) { /* ... */ }
}

class PostgreSQLDatabase implements Database {
  async query(sql: string, params: any[]) { /* ... */ }
}

class UserService {
  constructor(private db: Database) {} // Injected dependency

  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// Usage
const db = new PostgreSQLDatabase();
const userService = new UserService(db);
```

## Design Patterns

### Repository Pattern

**Concept:** Abstraction layer between business logic and data access

```typescript
// Domain entity
class User {
  constructor(
    public id: string,
    public email: string,
    public name: string,
  ) {}
}

// Repository interface
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementation
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? new User(row.id, row.email, row.name) : null;
  }

  async save(user: User): Promise<void> {
    await this.db.query(
      'INSERT INTO users (id, email, name) VALUES ($1, $2, $3)',
      [user.id, user.email, user.name]
    );
  }

  // Other methods...
}

// Service layer uses repository
class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: string) {
    return this.userRepo.findById(id);
  }
}
```

### Factory Pattern

**Concept:** Create objects without specifying exact class

```typescript
interface Notification {
  send(message: string): Promise<void>;
}

class EmailNotification implements Notification {
  async send(message: string) {
    console.log(`Email sent: ${message}`);
  }
}

class SMSNotification implements Notification {
  async send(message: string) {
    console.log(`SMS sent: ${message}`);
  }
}

class PushNotification implements Notification {
  async send(message: string) {
    console.log(`Push notification sent: ${message}`);
  }
}

class NotificationFactory {
  static create(type: 'email' | 'sms' | 'push'): Notification {
    switch (type) {
      case 'email':
        return new EmailNotification();
      case 'sms':
        return new SMSNotification();
      case 'push':
        return new PushNotification();
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}

// Usage
const notification = NotificationFactory.create('email');
await notification.send('Hello!');
```

### Decorator Pattern

**Concept:** Add behavior to objects dynamically

```typescript
interface Coffee {
  cost(): number;
  description(): string;
}

class SimpleCoffee implements Coffee {
  cost() {
    return 10;
  }

  description() {
    return 'Simple coffee';
  }
}

class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}

  cost() {
    return this.coffee.cost() + 2;
  }

  description() {
    return `${this.coffee.description()}, milk`;
  }
}

class SugarDecorator implements Coffee {
  constructor(private coffee: Coffee) {}

  cost() {
    return this.coffee.cost() + 1;
  }

  description() {
    return `${this.coffee.description()}, sugar`;
  }
}

// Usage
let coffee: Coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);

console.log(coffee.description()); // "Simple coffee, milk, sugar"
console.log(coffee.cost()); // 13
```

### Observer Pattern (Pub/Sub)

**Concept:** Notify multiple objects about state changes

```typescript
interface Observer {
  update(event: any): void;
}

class EventEmitter {
  private observers: Map<string, Observer[]> = new Map();

  subscribe(event: string, observer: Observer) {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event)!.push(observer);
  }

  emit(event: string, data: any) {
    const observers = this.observers.get(event) || [];
    observers.forEach(observer => observer.update(data));
  }
}

// Observers
class EmailNotifier implements Observer {
  update(event: any) {
    console.log(`Sending email about: ${event.type}`);
  }
}

class LoggerObserver implements Observer {
  update(event: any) {
    console.log(`Logging event: ${JSON.stringify(event)}`);
  }
}

// Usage
const eventEmitter = new EventEmitter();
eventEmitter.subscribe('user.created', new EmailNotifier());
eventEmitter.subscribe('user.created', new LoggerObserver());

eventEmitter.emit('user.created', { type: 'user.created', userId: '123' });
```

## Clean Code Practices

### Meaningful Names

**Bad:**
```typescript
function d(a: number, b: number) {
  return a * b * 0.0254;
}
```

**Good:**
```typescript
function calculateAreaInMeters(widthInInches: number, heightInInches: number) {
  const INCHES_TO_METERS = 0.0254;
  return widthInInches * heightInInches * INCHES_TO_METERS;
}
```

### Small Functions

**Bad:**
```typescript
async function processOrder(orderId: string) {
  // 200 lines of code doing everything
  // - validate order
  // - check inventory
  // - process payment
  // - update database
  // - send notifications
  // - generate invoice
}
```

**Good:**
```typescript
async function processOrder(orderId: string) {
  const order = await validateOrder(orderId);
  await checkInventory(order);
  const payment = await processPayment(order);
  await updateOrderStatus(orderId, 'paid');
  await sendConfirmationEmail(order);
  await generateInvoice(order, payment);
}
```

### Avoid Magic Numbers

**Bad:**
```typescript
if (user.age < 18) {
  throw new Error('Too young');
}

setTimeout(fetchData, 86400000);
```

**Good:**
```typescript
const MINIMUM_AGE = 18;
if (user.age < MINIMUM_AGE) {
  throw new Error('Too young');
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
setTimeout(fetchData, ONE_DAY_IN_MS);
```

### Error Handling

**Bad:**
```typescript
try {
  const user = await db.findUser(id);
  return user;
} catch (e) {
  console.log(e);
  return null;
}
```

**Good:**
```typescript
try {
  const user = await db.findUser(id);
  if (!user) {
    throw new UserNotFoundError(id);
  }
  return user;
} catch (error) {
  logger.error('Failed to fetch user', {
    userId: id,
    error: error.message,
    stack: error.stack,
  });
  throw new DatabaseError('User fetch failed', { cause: error });
}
```

### Don't Repeat Yourself (DRY)

**Bad:**
```typescript
app.post('/api/users', async (req, res) => {
  if (!req.body.email || !req.body.email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  // ...
});

app.put('/api/users/:id', async (req, res) => {
  if (!req.body.email || !req.body.email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  // ...
});
```

**Good:**
```typescript
function validateEmail(email: string) {
  if (!email || !email.includes('@')) {
    throw new ValidationError('Invalid email');
  }
}

app.post('/api/users', async (req, res) => {
  validateEmail(req.body.email);
  // ...
});

app.put('/api/users/:id', async (req, res) => {
  validateEmail(req.body.email);
  // ...
});
```

## Code Refactoring Techniques

### Extract Method

**Before:**
```typescript
function renderOrder(order: Order) {
  console.log('Order Details:');
  console.log(`ID: ${order.id}`);
  console.log(`Total: $${order.total}`);

  console.log('Items:');
  order.items.forEach(item => {
    console.log(`- ${item.name}: $${item.price}`);
  });
}
```

**After:**
```typescript
function renderOrder(order: Order) {
  printOrderHeader(order);
  printOrderItems(order.items);
}

function printOrderHeader(order: Order) {
  console.log('Order Details:');
  console.log(`ID: ${order.id}`);
  console.log(`Total: $${order.total}`);
}

function printOrderItems(items: OrderItem[]) {
  console.log('Items:');
  items.forEach(item => {
    console.log(`- ${item.name}: $${item.price}`);
  });
}
```

### Replace Conditional with Polymorphism

**Before:**
```typescript
function getShippingCost(order: Order) {
  if (order.shippingMethod === 'standard') {
    return 5;
  } else if (order.shippingMethod === 'express') {
    return 15;
  } else if (order.shippingMethod === 'overnight') {
    return 30;
  }
}
```

**After:**
```typescript
interface ShippingMethod {
  getCost(): number;
}

class StandardShipping implements ShippingMethod {
  getCost() {
    return 5;
  }
}

class ExpressShipping implements ShippingMethod {
  getCost() {
    return 15;
  }
}

class OvernightShipping implements ShippingMethod {
  getCost() {
    return 30;
  }
}
```

## Code Quality Checklist

- [ ] SOLID principles applied
- [ ] Functions are small (< 20 lines ideal)
- [ ] Meaningful variable/function names
- [ ] No magic numbers (use constants)
- [ ] Proper error handling (no silent failures)
- [ ] DRY (no code duplication)
- [ ] Comments explain "why", not "what"
- [ ] Design patterns used appropriately
- [ ] Dependency injection for testability
- [ ] Code is readable (readable > clever)

## Resources

- **Clean Code (Book):** Robert C. Martin
- **Refactoring (Book):** Martin Fowler
- **Design Patterns:** https://refactoring.guru/design-patterns
- **SOLID Principles:** https://en.wikipedia.org/wiki/SOLID
