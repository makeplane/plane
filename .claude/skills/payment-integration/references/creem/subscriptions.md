# Creem.io Subscriptions

## Subscription Lifecycle

```
create → active → [pause] → [resume] → [upgrade] → cancel
```

## Create Subscription

Via checkout session with recurring product:

```javascript
const session = await creem.checkout.sessions.create({
  product_id: 'prod_recurring_xxx',
  success_url: 'https://example.com/success',
  customer_email: 'user@example.com'
});
```

## Retrieve Subscription

```javascript
// GET /v1/subscriptions/:id
const subscription = await creem.subscriptions.retrieve('sub_xxx');
// Returns: { id, status, product_id, current_period_end, ... }
```

## Modify Subscription

### Update Seats/Units

```javascript
// PATCH /v1/subscriptions/:id
const updated = await creem.subscriptions.update('sub_xxx', {
  quantity: 10,           // Seat count
  prorate: true,          // Prorate charges
  billing_immediately: false
});
```

### Upgrade/Downgrade

```javascript
const updated = await creem.subscriptions.update('sub_xxx', {
  product_id: 'prod_higher_tier',
  prorate: true
});
```

## Pause Subscription

```javascript
// POST /v1/subscriptions/:id/pause
const paused = await creem.subscriptions.pause('sub_xxx', {
  resume_at: '2024-02-01T00:00:00Z'  // Optional auto-resume date
});
```

## Resume Subscription

```javascript
// POST /v1/subscriptions/:id/resume
const resumed = await creem.subscriptions.resume('sub_xxx');
```

## Cancel Subscription

```javascript
// POST /v1/subscriptions/:id/cancel
const cancelled = await creem.subscriptions.cancel('sub_xxx', {
  at_period_end: true    // false = immediate cancellation
});
```

## Free Trials

Configure on product level:

```javascript
const product = await creem.products.create({
  name: 'Pro Plan',
  price: 2900,
  currency: 'usd',
  recurring: { interval: 'month' },
  trial_period_days: 14
});
```

## Seat-Based Billing

```javascript
const product = await creem.products.create({
  name: 'Team Plan',
  price: 1000,           // Per seat price
  currency: 'usd',
  recurring: { interval: 'month' },
  billing_scheme: 'per_unit'
});

// Checkout with quantity
const session = await creem.checkout.sessions.create({
  product_id: 'prod_xxx',
  quantity: 5,           // 5 seats
  success_url: '...'
});
```

## Product Bundles

Group related tiers for upsells:

```javascript
const bundle = await creem.bundles.create({
  name: 'Growth Plans',
  products: ['prod_starter', 'prod_pro', 'prod_enterprise']
});
```

## Subscription Events (Webhooks)

- `subscription.created` - New subscription started
- `subscription.updated` - Quantity, product, or status changed
- `subscription.paused` - Subscription paused
- `subscription.resumed` - Subscription resumed
- `subscription.cancelled` - Cancellation scheduled or completed
- `subscription.renewed` - Successful renewal charge

See `references/creem/webhooks.md` for webhook handling.
