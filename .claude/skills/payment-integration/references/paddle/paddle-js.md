# Paddle.js v2

Client-side library for checkout and pricing.

## Installation

```html
<!-- CDN -->
<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
```

```bash
# npm
npm install @paddle/paddle-js
```

## Initialization

```typescript
import { initializePaddle } from '@paddle/paddle-js';

const paddle = await initializePaddle({
  environment: 'sandbox', // 'production'
  token: 'live_xxx',      // client-side token
  eventCallback: (event) => {
    if (event.name === 'checkout.completed') {
      console.log('Payment successful', event.data);
    }
  }
});
```

## Checkout Methods

### Overlay Checkout (Modal)

```typescript
paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  customer: { email: 'user@example.com' },
  customData: { user_id: '123' },
  successUrl: 'https://example.com/success',
});
```

### Inline Checkout (Embedded)

```html
<div class="paddle-checkout-container"></div>
```

```typescript
paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  settings: {
    displayMode: 'inline',
    frameTarget: 'paddle-checkout-container',
    frameStyle: 'width: 100%; min-width: 312px; background-color: transparent;'
  }
});
```

### HTML Data Attributes

```html
<a
  href="#"
  data-paddle-product="pri_xxx"
  data-paddle-quantity="1"
  data-paddle-email="user@example.com"
>Buy Now</a>
```

## Price Preview

```typescript
const preview = await paddle.PricePreview({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  address: { countryCode: 'US' }
});

console.log(preview.data.details.totals.total); // "19.99"
```

## Events

| Event | Description |
|-------|-------------|
| `checkout.loaded` | Checkout frame loaded |
| `checkout.customer.created` | New customer created |
| `checkout.payment.initiated` | Payment processing started |
| `checkout.completed` | Payment successful |
| `checkout.closed` | Checkout closed |
| `checkout.error` | Payment failed |

## Update Checkout

```typescript
// Update items after open
paddle.Checkout.updateItems([
  { priceId: 'pri_xxx', quantity: 2 }
]);

// Close checkout
paddle.Checkout.close();
```
