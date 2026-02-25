# Polar Subscriptions

Subscription lifecycle, upgrades, downgrades, and trial management.

## Lifecycle States

- `created` - New subscription, payment pending
- `active` - Payment successful, benefits granted
- `canceled` - Scheduled cancellation at period end
- `revoked` - Billing stopped, benefits revoked immediately
- `past_due` - Payment failed, in dunning period

## API Operations

### List Subscriptions
```typescript
const subscriptions = await polar.subscriptions.list({
  organization_id: "org_xxx",
  product_id: "prod_xxx",
  customer_id: "cust_xxx",
  status: "active"
});
```

### Get Subscription
```typescript
const subscription = await polar.subscriptions.get(subscriptionId);
```

### Update Subscription
```typescript
const updated = await polar.subscriptions.update(subscriptionId, {
  product_price_id: "newPriceId",
  discount_id: "discount_xxx",
  metadata: { plan: "pro" }
});
```

## Upgrades & Downgrades

### Proration Options

**Next Invoice (default):**
- Credit/charge applied to upcoming invoice
- Subscription updates immediately
- Customer billed at next cycle

**Invoice Immediately:**
- Credit/charge processed right away
- Subscription updates immediately
- New invoice generated

```typescript
await polar.subscriptions.update(subscriptionId, {
  product_price_id: "higher_tier_price",
  proration: "invoice_immediately" // or "next_invoice"
});
```

### Customer-Initiated Changes

**Enable in Product Settings:**
- Toggle "Allow price change"
- Customer can upgrade/downgrade via portal
- Admin-only changes if disabled

**Implementation:**
```typescript
// Check if changes allowed
const product = await polar.products.get(productId);
if (product.allow_price_change) {
  // Customer can change via portal
}
```

## Trials

### Configuration

**Product-level:**
```typescript
const product = await polar.products.create({
  name: "Pro Plan",
  prices: [{
    trial_period_days: 14
  }]
});
```

**Checkout-level:**
```typescript
const session = await polar.checkouts.create({
  product_price_id: "price_xxx",
  trial_period_days: 7 // Overrides product setting
});
```

### Trial Behavior
- Customer not charged during trial
- Benefits granted immediately
- Can cancel anytime during trial
- Charged at trial end if not canceled

### Trial Events
```typescript
// Listen to webhooks
subscription.created // Trial starts
subscription.active // Trial ends, first charge
subscription.canceled // Trial canceled
```

## Cancellations

### Cancel at Period End
```typescript
await polar.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true
});
// Subscription remains active
// Benefits continue until period end
// Webhooks: subscription.updated, subscription.canceled
```

### Immediate Revocation
```typescript
// Happens automatically at period end
// Or manually via API (future feature)
// Status changes to "revoked"
// Billing stops, benefits revoked
// Webhooks: subscription.updated, subscription.revoked
```

### Reactivate Canceled
```typescript
await polar.subscriptions.update(subscriptionId, {
  cancel_at_period_end: false
});
// Removes cancellation
// Subscription continues normally
```

## Renewals

### Listening to Renewals
```typescript
app.post('/webhook/polar', async (req, res) => {
  const event = validateEvent(req.body, req.headers, secret);

  if (event.type === 'order.created') {
    const order = event.data;

    if (order.billing_reason === 'subscription_cycle') {
      // This is a renewal
      await handleRenewal(order.subscription_id);
    }
  }

  res.json({ received: true });
});
```

### Failed Renewals
- `subscription.past_due` webhook fired
- Dunning process initiated
- Customer notified via email
- Multiple retry attempts
- Eventually revoked if payment fails

## Discounts

### Apply Discount
```typescript
await polar.subscriptions.update(subscriptionId, {
  discount_id: "discount_xxx"
});
```

### Remove Discount
```typescript
await polar.subscriptions.update(subscriptionId, {
  discount_id: null
});
```

### Discount Types
- Percentage off: 20% off
- Fixed amount: $5 off
- Duration: once, forever, repeating

## Customer Portal

### Generate Portal Access
```typescript
const session = await polar.customerSessions.create({
  customer_id: "cust_xxx"
});

// Redirect to: session.url
```

### Portal Features
- View subscriptions
- Upgrade/downgrade plans
- Cancel subscriptions
- Update billing info
- View invoices
- Access benefits

### Pre-authenticated Links
```typescript
// From your app, create session and redirect
app.get('/portal', async (req, res) => {
  const session = await polar.customerSessions.create({
    external_customer_id: req.user.id
  });

  res.redirect(session.url);
});
```

## Metadata

### Update Subscription Metadata
```typescript
await polar.subscriptions.update(subscriptionId, {
  metadata: {
    internal_id: "sub_123",
    tier: "pro",
    source: "web"
  }
});
```

### Query by Metadata
```typescript
const subscriptions = await polar.subscriptions.list({
  organization_id: "org_xxx",
  metadata: { tier: "pro" }
});
```

## Best Practices

1. **Lifecycle Management:**
   - Listen to all subscription webhooks
   - Handle each state appropriately
   - Sync state to your database
   - Grant/revoke access based on state

2. **Upgrades/Downgrades:**
   - Use proration for fair billing
   - Communicate changes clearly
   - Preview invoice before change
   - Allow customer self-service

3. **Trials:**
   - Set appropriate trial duration
   - Notify before trial ends
   - Easy cancellation during trial
   - Clear trial end date in UI

4. **Cancellations:**
   - Make cancellation easy
   - Offer alternatives (pause, downgrade)
   - Collect feedback
   - Keep benefits until period end
   - Send confirmation email

5. **Failed Payments:**
   - Handle `past_due` webhook
   - Notify customer promptly
   - Provide retry mechanism
   - Grace period before revocation
   - Clear reactivation path

6. **Customer Communication:**
   - Renewal reminders
   - Payment confirmations
   - Failed payment notifications
   - Upgrade/downgrade confirmations
   - Cancellation confirmations

7. **Analytics:**
   - Track churn reasons
   - Monitor upgrade/downgrade patterns
   - Analyze trial conversion
   - Measure payment failure rates
   - Lifetime value calculations

## Common Patterns

### Subscription Status Check
```typescript
async function hasActiveSubscription(userId) {
  const subscriptions = await polar.subscriptions.list({
    external_customer_id: userId,
    status: "active"
  });

  return subscriptions.items.length > 0;
}
```

### Grace Period Handler
```typescript
app.post('/webhook/polar', async (req, res) => {
  const event = validateEvent(req.body, req.headers, secret);

  if (event.type === 'subscription.past_due') {
    const subscription = event.data;

    // Grant 3-day grace period
    await grantGracePeriod(subscription.customer_id, 3);

    // Notify customer
    await sendPaymentFailedEmail(subscription.customer_id);
  }

  res.json({ received: true });
});
```

### Upgrade Path
```typescript
async function upgradeSubscription(subscriptionId, newPriceId) {
  // Preview invoice
  const preview = await polar.subscriptions.previewUpdate(subscriptionId, {
    product_price_id: newPriceId,
    proration: "invoice_immediately"
  });

  // Show customer preview
  if (await confirmUpgrade(preview)) {
    await polar.subscriptions.update(subscriptionId, {
      product_price_id: newPriceId,
      proration: "invoice_immediately"
    });
  }
}
```
