# Stripe.js Reference

Client-side JavaScript library for secure payment collection.

## Installation

Include on **every page** (enables fraud detection):

```html
<script src="https://js.stripe.com/v3/"></script>
```

Or via npm:
```bash
npm install @stripe/stripe-js
```

```javascript
import { loadStripe } from '@stripe/stripe-js';
const stripe = await loadStripe('pk_test_...');
```

## Initialization

```javascript
const stripe = Stripe('pk_test_...', {
  apiVersion: '2024-12-18.acacia',  // Optional
  locale: 'auto',                    // Optional
  stripeAccount: 'acct_xxx',        // For Connect
});
```

## Elements (Payment Forms)

Create container for UI components:

```javascript
const elements = stripe.elements({
  clientSecret: 'pi_xxx_secret_xxx',
  appearance: { theme: 'stripe' },
});
```

### Payment Element (Recommended)

Auto-renders available payment methods:

```javascript
const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');
```

### Confirm Payment

```javascript
const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://example.com/complete',
  },
});

if (error) {
  // Show error to customer
}
```

## Embedded Checkout

Mount Stripe-hosted checkout in your page:

```javascript
const checkout = await stripe.initEmbeddedCheckout({
  clientSecret: 'cs_xxx',
});
checkout.mount('#checkout');
```

## Element Types

| Element | Use Case |
|---------|----------|
| `payment` | Full payment form (recommended) |
| `card` | Card-only input |
| `address` | Shipping/billing address |
| `linkAuthentication` | Link login/signup |
| `expressCheckout` | Apple Pay, Google Pay buttons |

## Appearance API

```javascript
const appearance = {
  theme: 'stripe', // 'night', 'flat', 'none'
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#ffffff',
    borderRadius: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #ccc' },
  },
};
```

## Security

- **Always load from** `https://js.stripe.com`
- **Only use publishable keys** client-side
- **Never log** card details or tokens
- **Use HTTPS** in production

## Resources

- Full docs: https://docs.stripe.com/js
- Elements: https://docs.stripe.com/payments/elements
- Appearance: https://docs.stripe.com/elements/appearance-api
