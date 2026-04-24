# Polar SDK Usage

Multi-language SDKs and framework adapters.

## TypeScript/JavaScript

**Installation:**
```bash
npm install @polar-sh/sdk
```

**Configuration:**
```typescript
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "production" // or "sandbox"
});
```

**Usage:**
```typescript
// Products
const products = await polar.products.list({ organization_id: "org_xxx" });
const product = await polar.products.create({ name: "Pro Plan", ... });

// Checkouts
const checkout = await polar.checkouts.create({
  product_price_id: "price_xxx",
  success_url: "https://example.com/success"
});

// Subscriptions
const subs = await polar.subscriptions.list({ customer_id: "cust_xxx" });
await polar.subscriptions.update(subId, { metadata: { plan: "pro" } });

// Orders
const orders = await polar.orders.list({ organization_id: "org_xxx" });
const order = await polar.orders.get(orderId);

// Customers
const customer = await polar.customers.get({ external_id: "user_123" });

// Events (usage-based)
await polar.events.create({
  external_customer_id: "user_123",
  event_name: "api_call",
  properties: { tokens: 1000 }
});
```

**Pagination:**
```typescript
// Automatic pagination
for await (const product of polar.products.listAutoPaging()) {
  console.log(product.name);
}

// Manual pagination
let page = 1;
while (true) {
  const response = await polar.products.list({ page, limit: 100 });
  if (response.items.length === 0) break;
  // Process items
  page++;
}
```

## Python

**Installation:**
```bash
pip install polar-sdk
```

**Configuration:**
```python
from polar_sdk import Polar

polar = Polar(
    access_token=os.environ["POLAR_ACCESS_TOKEN"],
    server="production"  # or "sandbox"
)
```

**Sync Usage:**
```python
# Products
products = polar.products.list(organization_id="org_xxx")
product = polar.products.create(name="Pro Plan", ...)

# Checkouts
checkout = polar.checkouts.create(
    product_price_id="price_xxx",
    success_url="https://example.com/success"
)

# Subscriptions
subs = polar.subscriptions.list(customer_id="cust_xxx")
polar.subscriptions.update(sub_id, metadata={"plan": "pro"})

# Orders
orders = polar.orders.list(organization_id="org_xxx")
order = polar.orders.get(order_id)

# Events
polar.events.create(
    external_customer_id="user_123",
    event_name="api_call",
    properties={"tokens": 1000}
)
```

**Async Usage:**
```python
import asyncio
from polar_sdk import AsyncPolar

async def main():
    polar = AsyncPolar(access_token=os.environ["POLAR_ACCESS_TOKEN"])

    products = await polar.products.list(organization_id="org_xxx")
    checkout = await polar.checkouts.create(...)

asyncio.run(main())
```

## PHP

**Installation:**
```bash
composer require polar-sh/sdk
```

**Configuration:**
```php
use Polar\Polar;

$polar = new Polar(
    accessToken: $_ENV['POLAR_ACCESS_TOKEN'],
    server: 'production' // or 'sandbox'
);
```

**Usage:**
```php
// Products
$products = $polar->products->list(['organization_id' => 'org_xxx']);
$product = $polar->products->create(['name' => 'Pro Plan', ...]);

// Checkouts
$checkout = $polar->checkouts->create([
    'product_price_id' => 'price_xxx',
    'success_url' => 'https://example.com/success'
]);

// Subscriptions
$subs = $polar->subscriptions->list(['customer_id' => 'cust_xxx']);
$polar->subscriptions->update($subId, ['metadata' => ['plan' => 'pro']]);

// Orders
$orders = $polar->orders->list(['organization_id' => 'org_xxx']);
$order = $polar->orders->get($orderId);

// Events
$polar->events->create([
    'external_customer_id' => 'user_123',
    'event_name' => 'api_call',
    'properties' => ['tokens' => 1000]
]);
```

## Go

**Installation:**
```bash
go get github.com/polarsource/polar-go
```

**Usage:**
```go
import (
    "github.com/polarsource/polar-go"
)

client := polar.NewClient(
    polar.WithAccessToken(os.Getenv("POLAR_ACCESS_TOKEN")),
    polar.WithEnvironment("production"),
)

// Products
products, err := client.Products.List(ctx, &polar.ProductListParams{
    OrganizationID: "org_xxx",
})

// Checkouts
checkout, err := client.Checkouts.Create(ctx, &polar.CheckoutCreateParams{
    ProductPriceID: "price_xxx",
    SuccessURL:     "https://example.com/success",
})
```

## Framework Adapters

### Next.js (@polar-sh/nextjs)

**Quick Start:**
```bash
npx polar-init
```

**Configuration:**
```typescript
// lib/polar.ts
import { PolarClient } from '@polar-sh/nextjs';

export const polar = new PolarClient({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!
});
```

**Checkout Handler:**
```typescript
// app/actions/checkout.ts
'use server'

import { polar } from '@/lib/polar';

export async function createCheckout(priceId: string) {
  const session = await polar.checkouts.create({
    product_price_id: priceId,
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?checkout_id={CHECKOUT_ID}`
  });

  return session.url;
}
```

**Webhook Handler:**
```typescript
// app/api/webhook/polar/route.ts
import { polar } from '@/lib/polar';

export async function POST(req: Request) {
  const event = await polar.webhooks.validate(req);

  switch (event.type) {
    case 'order.paid':
      await handleOrderPaid(event.data);
      break;
    // ... other events
  }

  return Response.json({ received: true });
}
```

### Laravel (polar-sh/laravel)

**Installation:**
```bash
composer require polar-sh/laravel
php artisan vendor:publish --tag=polar-config
php artisan vendor:publish --tag=polar-migrations
php artisan migrate
```

**Configuration:**
```php
// config/polar.php
return [
    'access_token' => env('POLAR_ACCESS_TOKEN'),
    'webhook_secret' => env('POLAR_WEBHOOK_SECRET'),
];
```

**Checkout:**
```php
use Polar\Facades\Polar;

Route::post('/checkout', function (Request $request) {
    $checkout = Polar::checkouts()->create([
        'product_price_id' => $request->input('price_id'),
        'success_url' => route('checkout.success'),
        'external_customer_id' => auth()->id(),
    ]);

    return redirect($checkout['url']);
});
```

**Webhook:**
```php
use Polar\Events\WebhookReceived;

// app/Listeners/PolarWebhookHandler.php
class PolarWebhookHandler
{
    public function handle(WebhookReceived $event)
    {
        match ($event->payload['type']) {
            'order.paid' => $this->handleOrderPaid($event->payload['data']),
            'subscription.revoked' => $this->handleRevoked($event->payload['data']),
            default => null,
        };
    }
}
```

### Express

```javascript
const express = require('express');
const { Polar } = require('@polar-sh/sdk');
const { validateEvent } = require('@polar-sh/sdk/webhooks');

const app = express();
const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN });

app.use(express.json());

app.post('/checkout', async (req, res) => {
  const session = await polar.checkouts.create({
    product_price_id: req.body.priceId,
    success_url: 'https://example.com/success',
    external_customer_id: req.user.id
  });

  res.json({ url: session.url });
});

app.post('/webhook/polar', (req, res) => {
  const event = validateEvent(
    req.body,
    req.headers,
    process.env.POLAR_WEBHOOK_SECRET
  );

  handleEvent(event);
  res.json({ received: true });
});
```

### Remix

```typescript
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN });

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const priceId = formData.get('priceId');

  const session = await polar.checkouts.create({
    product_price_id: priceId,
    success_url: `${request.url}/success`
  });

  return redirect(session.url);
}
```

## BetterAuth Integration

**Installation:**
```bash
npm install @polar-sh/better-auth
```

**Configuration:**
```typescript
import { betterAuth } from 'better-auth';
import { polarPlugin } from '@polar-sh/better-auth';

export const auth = betterAuth({
  database: db,
  plugins: [
    polarPlugin({
      organizationId: process.env.POLAR_ORG_ID!,
      accessToken: process.env.POLAR_ACCESS_TOKEN!
    })
  ]
});
```

**Features:**
- Auto-create Polar customers on signup
- Automatic external_id mapping
- User-customer sync
- Access customer data in auth session

## Error Handling

**TypeScript:**
```typescript
try {
  const product = await polar.products.get(productId);
} catch (error) {
  if (error.statusCode === 404) {
    console.error('Product not found');
  } else if (error.statusCode === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('API error:', error.message);
  }
}
```

**Python:**
```python
from polar_sdk.exceptions import PolarException

try:
    product = polar.products.get(product_id)
except PolarException as e:
    if e.status_code == 404:
        print("Product not found")
    elif e.status_code == 429:
        print("Rate limit exceeded")
    else:
        print(f"API error: {e.message}")
```

## Best Practices

1. **Environment Variables:** Store credentials securely
2. **Error Handling:** Catch and handle API errors appropriately
3. **Rate Limiting:** Implement backoff for 429 responses
4. **Pagination:** Use auto-paging for large datasets
5. **Webhooks:** Always verify signatures
6. **Testing:** Use sandbox for development
7. **Logging:** Log API calls for debugging
8. **Retry Logic:** Implement for transient failures
