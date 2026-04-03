# Creem.io Checkouts

## Checkout Options

1. **Programmatic Sessions** - Full API control
2. **Checkout Links** - No-code, shareable URLs
3. **Storefronts** - Hosted product pages

## Create Checkout Session

```javascript
const session = await creem.checkout.sessions.create({
  product_id: 'prod_xxx',
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',

  // Optional parameters
  customer_email: 'user@example.com',
  customer_id: 'cus_xxx',           // Existing customer
  quantity: 1,                       // For seat-based products
  discount_code: 'LAUNCH20',         // Pre-apply discount
  metadata: {
    order_id: '123',
    referral_code: 'abc'
  },

  // Custom fields
  custom_fields: [
    { key: 'company', label: 'Company Name', required: true }
  ]
});

// Redirect user to checkout
redirect(session.url);
```

## Checkout Customization

Configure in dashboard or via API:

- **Branding**: Logo, colors, themes
- **Email Receipts**: Custom templates
- **Localization**: Auto-detect or force language (42 supported)
- **Custom Fields**: Collect additional data

## Retrieve Session

```javascript
// GET /v1/checkout/sessions/:id
const session = await creem.checkout.sessions.retrieve('cs_xxx');
// Returns: { id, status, customer_id, product_id, amount, metadata, ... }
```

## Success URL Parameters

Creem replaces `{CHECKOUT_SESSION_ID}` in success URL:

```javascript
// Frontend: parse session ID from URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

// Backend: verify and fulfill
const session = await creem.checkout.sessions.retrieve(sessionId);
if (session.status === 'complete') {
  await fulfillOrder(session);
}
```

## No-Code Checkout Links

Create in dashboard - shareable URLs for any product. Good for:
- Social media links
- Email campaigns
- Quick sales without integration

## Storefronts

Hosted product pages - display multiple products without custom website:

1. Configure storefront in dashboard
2. Add products to display
3. Share storefront URL
4. Customers browse and checkout

## Cart Abandonment Recovery

Enable in dashboard - automatic emails sent when checkout abandoned:
- Configurable delay before sending
- Customizable email content
- Include discount code incentive

## Embedding (Coming)

For embedded checkout in your site, see SDK adapters:
- Next.js Adapter
- React components

See `references/creem/sdk.md` for implementation details.
