# Paddle Webhooks

Event-driven notifications for payment lifecycle.

## Setup

1. Dashboard → Developer Tools → Notifications
2. Create new destination with endpoint URL
3. Select events to receive
4. Copy signing secret

## Signature Verification

Header: `Paddle-Signature`
Format: `ts=1234567890;h1=sha256_signature`

### Node.js SDK

```typescript
import Paddle from '@paddle/paddle-node-sdk';

const paddle = new Paddle(process.env.PADDLE_API_KEY);

app.post('/webhooks/paddle', async (req, res) => {
  const signature = req.headers['paddle-signature'];
  const rawBody = req.body; // raw request body string

  try {
    const event = paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET,
      signature
    );

    await handleEvent(event);
    res.status(200).send('OK');
  } catch (err) {
    res.status(400).send('Invalid signature');
  }
});
```

### Manual Verification

```typescript
import crypto from 'crypto';

function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const [tsPart, h1Part] = signature.split(';');
  const ts = tsPart.replace('ts=', '');
  const h1 = h1Part.replace('h1=', '');

  const signedPayload = `${ts}:${rawBody}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(h1),
    Buffer.from(expectedSig)
  );
}
```

## Key Events

| Event | Description |
|-------|-------------|
| `transaction.completed` | Payment successful |
| `transaction.payment_failed` | Payment failed |
| `subscription.created` | New subscription |
| `subscription.updated` | Subscription changed |
| `subscription.canceled` | Subscription canceled |
| `subscription.past_due` | Payment overdue |
| `subscription.paused` | Subscription paused |
| `subscription.resumed` | Subscription resumed |
| `customer.created` | New customer |
| `customer.updated` | Customer updated |

## Event Payload

```json
{
  "event_id": "evt_xxx",
  "event_type": "subscription.created",
  "occurred_at": "2024-01-15T10:00:00Z",
  "notification_id": "ntf_xxx",
  "data": {
    "id": "sub_xxx",
    "status": "active",
    "customer_id": "ctm_xxx",
    "items": [{ "price": { "id": "pri_xxx" }, "quantity": 1 }],
    "billing_cycle": { "interval": "month", "frequency": 1 },
    "current_billing_period": {
      "starts_at": "2024-01-15",
      "ends_at": "2024-02-15"
    }
  }
}
```

## Best Practices

- Store `event_id` for idempotency
- Return 200 immediately, process async
- Implement retry handling (Paddle retries failed deliveries)
- Use webhook secret per environment
