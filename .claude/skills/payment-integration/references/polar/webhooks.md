# Polar Webhooks

Event handling, signature verification, and monitoring.

## Setup

1. Org Settings → Webhooks
2. Enter endpoint URL (publicly accessible)
3. Receive webhook secret (base64 encoded)
4. Select event types
5. Save configuration

**Requirements:**
- HTTPS endpoint
- Respond within 20 seconds
- Return 2xx status code

## Signature Verification

### Headers
```
webhook-id: msg_xxx
webhook-signature: v1,signature_xxx
webhook-timestamp: 1642000000
```

### TypeScript Verification
```typescript
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';

app.post('/webhook/polar', (req, res) => {
  try {
    const event = validateEvent(
      req.body,
      req.headers,
      process.env.POLAR_WEBHOOK_SECRET
    );

    // Event is valid, process it
    await handleEvent(event);

    res.json({ received: true });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    throw error;
  }
});
```

### Python Verification
```python
from polar_sdk.webhooks import validate_event, WebhookVerificationError

@app.route('/webhook/polar', methods=['POST'])
def polar_webhook():
    try:
        event = validate_event(
            request.get_data(),
            dict(request.headers),
            os.environ['POLAR_WEBHOOK_SECRET']
        )

        handle_event(event)
        return {'received': True}

    except WebhookVerificationError:
        return {'error': 'Invalid signature'}, 400
```

### Manual Verification
```typescript
import crypto from 'crypto';

function verifySignature(payload, headers, secret) {
  const timestamp = headers['webhook-timestamp'];
  const signatures = headers['webhook-signature'].split(',');

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(signedPayload)
    .digest('base64');

  return signatures.some(sig => {
    const [version, signature] = sig.split('=');
    return version === 'v1' && signature === expectedSignature;
  });
}
```

## Event Types

### Checkout
- `checkout.created` - Checkout session created
- `checkout.updated` - Session updated

### Order
- `order.created` - Order created (check `billing_reason`)
  - `purchase` - One-time product
  - `subscription_create` - New subscription
  - `subscription_cycle` - Renewal
  - `subscription_update` - Plan change
- `order.paid` - Payment confirmed
- `order.updated` - Order updated
- `order.refunded` - Refund processed

### Subscription
- `subscription.created` - Subscription created
- `subscription.active` - Subscription activated
- `subscription.updated` - Subscription modified
- `subscription.canceled` - Cancellation scheduled
- `subscription.revoked` - Subscription terminated

**Note:** Multiple events may fire for single action

### Customer
- `customer.created` - Customer created
- `customer.updated` - Customer modified
- `customer.deleted` - Customer deleted
- `customer.state_changed` - Benefits/subscriptions changed

### Benefit Grant
- `benefit_grant.created` - Benefit granted
- `benefit_grant.updated` - Grant modified
- `benefit_grant.revoked` - Benefit revoked

### Refund
- `refund.created` - Refund initiated
- `refund.updated` - Refund status changed

### Product
- `product.created` - Product created
- `product.updated` - Product modified

## Event Structure

```typescript
{
  "type": "order.paid",
  "data": {
    "id": "order_xxx",
    "amount": 2000,
    "currency": "USD",
    "billing_reason": "purchase",
    "customer": { ... },
    "product": { ... },
    "subscription": null,
    "metadata": { ... }
  }
}
```

## Handler Implementation

### Basic Handler
```typescript
async function handleEvent(event) {
  switch (event.type) {
    case 'order.paid':
      await handleOrderPaid(event.data);
      break;

    case 'subscription.active':
      await grantAccess(event.data.customer_id);
      break;

    case 'subscription.revoked':
      await revokeAccess(event.data.customer_id);
      break;

    case 'benefit_grant.created':
      await notifyBenefitGranted(event.data);
      break;

    default:
      console.log(`Unhandled event: ${event.type}`);
  }
}
```

### Order Handler
```typescript
async function handleOrderPaid(order) {
  // Handle different billing reasons
  switch (order.billing_reason) {
    case 'purchase':
      await fulfillOneTimeOrder(order);
      break;

    case 'subscription_create':
      await handleNewSubscription(order);
      break;

    case 'subscription_cycle':
      await handleRenewal(order);
      break;

    case 'subscription_update':
      await handleUpgrade(order);
      break;
  }
}
```

### Customer State Handler
```typescript
async function handleCustomerStateChanged(customer) {
  // Customer state includes:
  // - active_subscriptions
  // - active_benefits

  const hasActiveSubscription = customer.active_subscriptions.length > 0;

  if (hasActiveSubscription) {
    await enableFeatures(customer.external_id);
  } else {
    await disableFeatures(customer.external_id);
  }
}
```

## Best Practices

### 1. Respond Immediately
```typescript
app.post('/webhook/polar', async (req, res) => {
  // Respond quickly
  res.json({ received: true });

  // Queue for background processing
  await webhookQueue.add('polar-webhook', req.body);
});
```

### 2. Idempotency
```typescript
async function handleEvent(event) {
  // Check if already processed
  const exists = await db.processedEvents.findOne({
    webhook_id: event.id
  });

  if (exists) {
    console.log('Event already processed');
    return;
  }

  // Process event
  await processEvent(event);

  // Mark as processed
  await db.processedEvents.insert({
    webhook_id: event.id,
    processed_at: new Date()
  });
}
```

### 3. Retry Logic
```typescript
async function processWithRetry(event, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await handleEvent(event);
      return;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      await sleep(1000 * attempt);
    }
  }
}
```

### 4. Error Handling
```typescript
app.post('/webhook/polar', async (req, res) => {
  try {
    const event = validateEvent(req.body, req.headers, secret);
    res.json({ received: true });

    await processWithRetry(event);
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Log to error tracking service
    await logError(error, req.body);

    if (error instanceof WebhookVerificationError) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Return 2xx even on processing errors
    // Polar will retry if non-2xx
    res.json({ received: true });
  }
});
```

### 5. Logging
```typescript
logger.info('Webhook received', {
  event_type: event.type,
  event_id: event.id,
  customer_id: event.data.customer?.id,
  amount: event.data.amount
});
```

## Monitoring

### Dashboard Features
- View webhook attempts
- Check response status
- Review retry history
- Manual retry option
- Filter by event type
- Search by customer

### Application Monitoring
```typescript
const metrics = {
  webhooks_received: counter('polar_webhooks_received_total'),
  webhooks_processed: counter('polar_webhooks_processed_total'),
  webhooks_failed: counter('polar_webhooks_failed_total'),
  processing_time: histogram('polar_webhook_processing_seconds')
};

app.post('/webhook/polar', async (req, res) => {
  metrics.webhooks_received.inc({ type: req.body.type });

  const timer = metrics.processing_time.startTimer();

  try {
    await handleEvent(req.body);
    metrics.webhooks_processed.inc({ type: req.body.type });
  } catch (error) {
    metrics.webhooks_failed.inc({ type: req.body.type });
  } finally {
    timer();
  }

  res.json({ received: true });
});
```

## Framework Adapters

### Next.js
```typescript
import { validateEvent } from '@polar-sh/nextjs/webhooks';

export async function POST(req: Request) {
  const event = await validateEvent(req);

  await handleEvent(event);

  return Response.json({ received: true });
}
```

### Laravel
```php
use Polar\Webhooks\WebhookHandler;

Route::post('/webhook/polar', function (Request $request) {
    $event = WebhookHandler::validate(
        $request->getContent(),
        $request->headers->all(),
        config('polar.webhook_secret')
    );

    dispatch(new ProcessPolarWebhook($event));

    return response()->json(['received' => true]);
});
```

## Testing

### Manual Testing
```bash
# Use Polar dashboard to send test webhooks
# Or use webhook testing tools

curl -X POST https://your-domain.com/webhook/polar \
  -H "Content-Type: application/json" \
  -H "webhook-id: msg_test" \
  -H "webhook-timestamp: $(date +%s)" \
  -H "webhook-signature: v1,test_signature" \
  -d '{"type":"order.paid","data":{...}}'
```

### Local Testing with ngrok
```bash
# Expose local server
ngrok http 3000

# Use ngrok URL in Polar webhook settings
https://abc123.ngrok.io/webhook/polar
```
