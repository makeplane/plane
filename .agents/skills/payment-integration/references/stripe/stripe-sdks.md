# Stripe SDKs Reference

Server-side SDKs for secure Stripe API integration.

## Supported Languages

| Language | Package | Install |
|----------|---------|---------|
| Node.js | `stripe` | `npm install stripe` |
| Python | `stripe` | `pip install stripe` |
| Ruby | `stripe` | `gem install stripe` |
| Go | `stripe-go` | `go get github.com/stripe/stripe-go/v76` |
| PHP | `stripe/stripe-php` | `composer require stripe/stripe-php` |
| Java | `com.stripe:stripe-java` | Maven/Gradle |
| .NET | `Stripe.net` | `dotnet add package Stripe.net` |

## Quick Start (Node.js)

```javascript
const stripe = require('stripe')('sk_test_...');

// Create checkout session
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
});
```

## Quick Start (Python)

```python
import stripe
stripe.api_key = 'sk_test_...'

session = stripe.checkout.Session.create(
    mode='payment',
    line_items=[{'price': 'price_xxx', 'quantity': 1}],
    success_url='https://example.com/success',
    cancel_url='https://example.com/cancel',
)
```

## API Versioning

- SDKs follow semantic versioning
- Breaking API changes bump major version
- Set version: `stripe.apiVersion = '2024-12-18.acacia'`
- Dashboard: Developers → API version

## Best Practices

1. **Keep SDKs updated** - Security patches, new features
2. **Use test keys** for development (`sk_test_...`)
3. **Set API version explicitly** for stability
4. **Handle errors** with try/catch
5. **Use idempotency keys** for POST requests

## Error Handling

```javascript
try {
  await stripe.charges.create({...});
} catch (err) {
  if (err.type === 'StripeCardError') {
    // Card declined
  } else if (err.type === 'StripeInvalidRequestError') {
    // Invalid parameters
  }
}
```

## Mobile SDKs

- **iOS**: `stripe-ios` (Swift/ObjC)
- **Android**: `stripe-android` (Kotlin/Java)
- **React Native**: `@stripe/stripe-react-native`

## Resources

- Full docs: https://docs.stripe.com/sdks
- API Reference: https://docs.stripe.com/api
- Community SDKs: https://docs.stripe.com/sdks#community-sdks
