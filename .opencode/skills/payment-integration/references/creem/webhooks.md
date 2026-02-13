# Creem.io Webhooks

## Webhook Setup

Configure webhook endpoint in Creem dashboard. Receive events at your endpoint URL.

## Event Types

### Checkout Events
- `checkout.completed` - Payment successful, access granted
- `checkout.abandoned` - Cart abandoned (triggers recovery emails if enabled)

### Subscription Events
- `subscription.created` - New subscription started
- `subscription.updated` - Changes to quantity, product, status
- `subscription.paused` - Subscription paused
- `subscription.resumed` - Subscription resumed
- `subscription.cancelled` - Cancellation scheduled/completed
- `subscription.renewed` - Successful renewal charge

### Payment Events
- `payment.succeeded` - Charge successful
- `payment.failed` - Charge failed
- `refund.created` - Refund processed
- `chargeback.created` - Dispute opened

### License Events
- `license.activated` - Device activated against license
- `license.deactivated` - Device deactivated

## Webhook Payload Structure

```json
{
  "id": "evt_xxx",
  "type": "checkout.completed",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "object": {
      "id": "cs_xxx",
      "customer_id": "cus_xxx",
      "product_id": "prod_xxx",
      "amount": 2900,
      "currency": "usd",
      "metadata": { "order_id": "123" }
    }
  }
}
```

## Signature Verification

```javascript
import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express handler
app.post('/webhooks/creem', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-creem-signature'];
  const payload = req.body.toString();

  if (!verifyWebhook(payload, signature, process.env.CREEM_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'checkout.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(event.data.object);
      break;
  }

  res.status(200).send('OK');
});
```

## Idempotency

Store processed event IDs to prevent duplicate processing:

```javascript
async function handleWebhook(event) {
  // Check if already processed
  const existing = await db.webhookEvents.findOne({ eventId: event.id });
  if (existing) return { status: 'already_processed' };

  // Process event
  await processEvent(event);

  // Mark as processed
  await db.webhookEvents.create({
    eventId: event.id,
    type: event.type,
    processedAt: new Date()
  });
}
```

## Retry Behavior

Creem retries failed webhooks (non-2xx responses). Implement idempotency to handle retries safely.

## Testing Webhooks

Use test mode API keys (`sk_test_`) - events sent to same webhook endpoint with test data.
