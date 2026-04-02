# Creem.io API Reference

## Checkout Sessions

### Create Checkout Session

```javascript
// POST /v1/checkout/sessions
const session = await creem.checkout.sessions.create({
  product_id: 'prod_xxx',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
  customer_email: 'user@example.com', // Optional
  metadata: { order_id: '123' }       // Optional
});
// Returns: { url: 'https://checkout.creem.io/xxx', id: 'cs_xxx' }
```

## Products

### Create Product

```javascript
// POST /v1/products
const product = await creem.products.create({
  name: 'Pro Plan',
  description: 'Full access to all features',
  price: 2900,           // Amount in cents
  currency: 'usd',
  recurring: {           // Optional - for subscriptions
    interval: 'month',
    interval_count: 1
  }
});
```

### Retrieve Product

```javascript
// GET /v1/products/:id
const product = await creem.products.retrieve('prod_xxx');
```

## Transactions

### Retrieve Transaction

```javascript
// GET /v1/transactions/:id
const transaction = await creem.transactions.retrieve('txn_xxx');
```

### List Transactions

```javascript
// GET /v1/transactions
const transactions = await creem.transactions.list({
  customer_id: 'cus_xxx',      // Optional filter
  product_id: 'prod_xxx',      // Optional filter
  status: 'completed',         // Optional filter
  limit: 25,
  starting_after: 'txn_xxx'    // Pagination cursor
});
```

## Customers

### Retrieve Customer

```javascript
// GET /v1/customers/:id
const customer = await creem.customers.retrieve('cus_xxx');

// GET /v1/customers/email/:email
const customer = await creem.customers.retrieveByEmail('user@example.com');
```

### List Customers

```javascript
// GET /v1/customers
const customers = await creem.customers.list({
  limit: 25,
  starting_after: 'cus_xxx'
});
```

### Generate Portal Link

```javascript
// POST /v1/customers/:id/portal
const portal = await creem.customers.createPortalSession('cus_xxx');
// Returns: { url: 'https://portal.creem.io/xxx' }
```

## Discount Codes

### Create Discount

```javascript
// POST /v1/discounts
const discount = await creem.discounts.create({
  code: 'LAUNCH20',
  type: 'percentage',    // or 'fixed'
  value: 20,             // 20% or 20 cents
  expires_at: '2024-12-31T23:59:59Z',
  max_redemptions: 100   // Optional
});
```

### Retrieve Discount

```javascript
// GET /v1/discounts/:code
const discount = await creem.discounts.retrieve('LAUNCH20');
```

### Delete Discount

```javascript
// DELETE /v1/discounts/:code
await creem.discounts.delete('LAUNCH20');
```

## Error Handling

```javascript
try {
  const session = await creem.checkout.sessions.create({...});
} catch (error) {
  if (error.type === 'invalid_request_error') {
    console.error('Invalid parameters:', error.message);
  } else if (error.type === 'authentication_error') {
    console.error('Invalid API key');
  } else if (error.type === 'rate_limit_error') {
    console.error('Rate limited, retry after:', error.retry_after);
  }
}
```
