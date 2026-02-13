# Paddle Best Practices

Production patterns for reliable integration.

## Webhook Handling

```typescript
// 1. Verify signature first
// 2. Check idempotency
// 3. Process async
// 4. Return 200 immediately

const processedEvents = new Set(); // Use Redis in production

app.post('/webhooks/paddle', async (req, res) => {
  const signature = req.headers['paddle-signature'];

  // Verify
  const event = paddle.webhooks.unmarshal(
    req.rawBody,
    process.env.PADDLE_WEBHOOK_SECRET,
    signature
  );

  // Idempotency
  if (processedEvents.has(event.eventId)) {
    return res.status(200).send('Already processed');
  }

  // Acknowledge immediately
  res.status(200).send('OK');

  // Process async
  await queue.add('paddle-webhook', event);
});
```

## Subscription Status Sync

```typescript
// Always verify subscription status server-side
async function checkAccess(userId: string): Promise<boolean> {
  const user = await db.users.findOne({ id: userId });
  if (!user.paddleSubscriptionId) return false;

  const sub = await paddle.subscriptions.get(user.paddleSubscriptionId);
  return ['active', 'trialing'].includes(sub.status);
}
```

## Custom Data for User Linking

```typescript
// Pass user_id in checkout
paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  customData: { user_id: currentUser.id }
});

// Retrieve in webhook
app.post('/webhooks/paddle', async (req, res) => {
  const event = paddle.webhooks.unmarshal(...);

  if (event.eventType === 'subscription.created') {
    const userId = event.data.customData?.user_id;
    await db.users.update(userId, {
      paddleSubscriptionId: event.data.id,
      paddleCustomerId: event.data.customerId
    });
  }
});
```

## Error Recovery

```typescript
// Handle past_due subscriptions
async function handlePastDue(subscriptionId: string) {
  // Get customer portal for payment update
  const sub = await paddle.subscriptions.get(subscriptionId);
  const portal = await paddle.customers.createPortalSession(sub.customerId);

  // Email customer with portal link
  await sendEmail(sub.customer.email, {
    subject: 'Update your payment method',
    link: portal.urls.general.overview
  });
}
```

## Testing with Sandbox

```typescript
// Use sandbox environment
const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: 'sandbox'
});

// Sandbox card: 4242 4242 4242 4242
// Any future expiry, any CVC
```

## Price Localization

```typescript
// Preview localized prices before checkout
const preview = await paddle.PricePreview({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  address: { countryCode: customerCountry }
});

// Display localized price
const formattedPrice = preview.data.details.totals.total;
```

## Paddle Retain (Churn Prevention)

Features enabled in dashboard:
- **Payment recovery**: Automated dunning emails
- **Cancellation surveys**: Collect feedback + offer discounts
- **Term optimization**: Auto-upgrade annual suggestions

## Security Checklist

- [ ] Webhook signatures verified
- [ ] API keys in env vars, not code
- [ ] Separate keys for sandbox/production
- [ ] Idempotency implemented
- [ ] Server-side status verification
- [ ] Secure customer portal sessions
