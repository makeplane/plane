# Paddle SDKs

Official SDKs for server-side integration.

## Node.js

```bash
npm install @paddle/paddle-node-sdk
```

```typescript
import Paddle from '@paddle/paddle-node-sdk';

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: 'sandbox' // 'production'
});

// Products
const products = await paddle.products.list();
const product = await paddle.products.create({
  name: 'Pro Plan',
  taxCategory: 'standard'
});

// Prices
const prices = await paddle.prices.list({ productId: 'pro_xxx' });
const price = await paddle.prices.create({
  productId: 'pro_xxx',
  description: 'Monthly',
  unitPrice: { amount: '999', currencyCode: 'USD' },
  billingCycle: { interval: 'month', frequency: 1 }
});

// Transactions
const transaction = await paddle.transactions.create({
  items: [{ priceId: 'pri_xxx', quantity: 1 }]
});

// Subscriptions
const subscription = await paddle.subscriptions.get('sub_xxx');
await paddle.subscriptions.update('sub_xxx', {
  items: [{ priceId: 'pri_new', quantity: 1 }]
});
await paddle.subscriptions.cancel('sub_xxx', { effectiveFrom: 'nextBillingPeriod' });

// Customers
const customers = await paddle.customers.list({ email: 'user@example.com' });
```

## Python

```bash
pip install paddle-python-sdk
```

```python
from paddle_billing import Client, Environment

paddle = Client(
    api_key="your_api_key",
    options=Options(environment=Environment.SANDBOX)
)

# Products
products = paddle.products.list()
product = paddle.products.create(
    name="Pro Plan",
    tax_category="standard"
)

# Subscriptions
subscription = paddle.subscriptions.get("sub_xxx")
paddle.subscriptions.cancel(
    "sub_xxx",
    effective_from="next_billing_period"
)
```

## PHP

```bash
composer require paddle/paddle-php-sdk
```

```php
use Paddle\SDK\Client;

$paddle = new Client('your_api_key');

// Products
$products = $paddle->products->list();

// Subscriptions
$subscription = $paddle->subscriptions->get('sub_xxx');
$paddle->subscriptions->cancel('sub_xxx', [
    'effective_from' => 'next_billing_period'
]);
```

## Go

```bash
go get github.com/PaddleHQ/paddle-go-sdk
```

```go
import paddle "github.com/PaddleHQ/paddle-go-sdk"

client, _ := paddle.New(
    os.Getenv("PADDLE_API_KEY"),
    paddle.WithBaseURL(paddle.SandboxBaseURL),
)

// Products
products, _ := client.ListProducts(ctx, nil)

// Subscriptions
sub, _ := client.GetSubscription(ctx, "sub_xxx")
```

## Error Handling

```typescript
try {
  await paddle.subscriptions.get('sub_invalid');
} catch (error) {
  if (error.code === 'entity_not_found') {
    console.log('Subscription not found');
  }
}
```
