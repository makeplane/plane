# Polar Checkouts

Checkout flows, embedded checkout, and session management.

## Checkout Approaches

### 1. Checkout Links
- Pre-configured shareable links
- Created via dashboard or API
- For marketing campaigns
- Can pre-apply discounts

**Create via API:**
```typescript
const link = await polar.checkoutLinks.create({
  product_price_id: "price_xxx",
  success_url: "https://example.com/success"
});
// Returns: link.url
```

### 2. Checkout Sessions (API)
- Programmatically created
- Server-side API call
- Dynamic workflows
- Custom logic

**Create Session:**
```typescript
const session = await polar.checkouts.create({
  product_price_id: "price_xxx",
  success_url: "https://example.com/success?checkout_id={CHECKOUT_ID}",
  customer_email: "user@example.com",
  external_customer_id: "user_123",
  metadata: {
    user_id: "123",
    source: "web"
  }
});

// Redirect to: session.url
```

**Response:**
```json
{
  "id": "checkout_xxx",
  "url": "https://polar.sh/checkout/...",
  "client_secret": "cs_xxx",
  "status": "open",
  "expires_at": "2025-01-15T10:00:00Z"
}
```

### 3. Embedded Checkout
- Inline checkout within your site
- Seamless purchase experience
- Theme customization

**Implementation:**
```html
<script src="https://polar.sh/embed.js"></script>

<div id="polar-checkout"></div>

<script>
  const checkout = await fetch('/api/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ productPriceId: 'price_xxx' })
  }).then(r => r.json());

  Polar('checkout', {
    checkoutId: checkout.id,
    clientSecret: checkout.client_secret,
    onSuccess: () => {
      window.location.href = '/success';
    },
    theme: 'dark' // or 'light'
  });
</script>
```

**Server-side (create session):**
```typescript
app.post('/api/create-checkout', async (req, res) => {
  const session = await polar.checkouts.create({
    product_price_id: req.body.productPriceId,
    embed_origin: "https://example.com",
    external_customer_id: req.user.id
  });

  res.json({
    id: session.id,
    client_secret: session.client_secret
  });
});
```

## Configuration Parameters

### Required
- `product_price_id` - Product to checkout (or `products` array for multiple)
- `success_url` - Post-payment redirect (absolute URL)

### Optional
- `external_customer_id` - Your user ID mapping
- `embed_origin` - For embedded checkouts
- `customer_email` - Pre-fill email
- `customer_name` - Pre-fill name
- `discount_id` - Pre-apply discount code
- `allow_discount_codes` - Allow customer to enter codes (default: true)
- `metadata` - Custom data (key-value)
- `custom_field_data` - Pre-fill custom fields
- `customer_billing_address` - Pre-fill billing address

### Success URL Placeholder
```typescript
{
  success_url: "https://example.com/success?checkout_id={CHECKOUT_ID}"
}
// Polar replaces {CHECKOUT_ID} with actual checkout ID
```

## Multi-Product Checkout

```typescript
const session = await polar.checkouts.create({
  products: [
    { product_price_id: "price_1", quantity: 1 },
    { product_price_id: "price_2", quantity: 2 }
  ],
  success_url: "https://example.com/success"
});
```

## Discount Application

### Pre-apply Discount
```typescript
const session = await polar.checkouts.create({
  product_price_id: "price_xxx",
  discount_id: "discount_xxx",
  success_url: "https://example.com/success"
});
```

### Allow Customer Codes
```typescript
{
  allow_discount_codes: true // default
  // Set to false to disable code entry
}
```

## Checkout States

- `open` - Ready for payment
- `confirmed` - Payment successful
- `expired` - Session expired (typically 24 hours)

## Events

**Webhook Events:**
- `checkout.created` - Session created
- `checkout.updated` - Session updated
- `order.created` - Order created after successful payment
- `order.paid` - Payment confirmed

**Handle Success:**
```typescript
// Listen to order.paid webhook
app.post('/webhook/polar', async (req, res) => {
  const event = validateEvent(req.body, req.headers, secret);

  if (event.type === 'order.paid') {
    const order = event.data;
    await fulfillOrder(order);
  }

  res.json({ received: true });
});
```

## Best Practices

1. **Success URL:**
   - Must be absolute URL: `https://example.com/success`
   - Use `{CHECKOUT_ID}` placeholder to retrieve checkout details
   - Verify payment via webhook, not just success redirect

2. **External Customer ID:**
   - Set on first checkout
   - Never change once set
   - Use for all customer operations
   - Enables customer lookup without storing Polar IDs

3. **Pre-filling Data:**
   - Pre-fill customer info when available
   - Reduces friction in checkout
   - Improves conversion rates

4. **Embedded Checkout:**
   - Provide seamless experience
   - Match your site's theme
   - Handle errors gracefully
   - Show loading states

5. **Metadata:**
   - Store tracking info (source, campaign, etc.)
   - Link to your internal systems
   - Use for analytics and reporting

6. **Error Handling:**
   - Handle expired sessions
   - Provide clear error messages
   - Offer to create new session
   - Log failures for debugging

7. **Mobile Optimization:**
   - Test on mobile devices
   - Ensure responsive design
   - Consider mobile payment methods
   - Test embedded checkout on mobile

## Framework Examples

### Next.js
```typescript
// app/actions/checkout.ts
'use server'

export async function createCheckout(productPriceId: string) {
  const session = await polar.checkouts.create({
    product_price_id: productPriceId,
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?checkout_id={CHECKOUT_ID}`,
    external_customer_id: await getCurrentUserId()
  });

  return session.url;
}

// app/product/page.tsx
export default function ProductPage() {
  async function handleCheckout() {
    const url = await createCheckout(productPriceId);
    window.location.href = url;
  }

  return <button onClick={handleCheckout}>Buy Now</button>;
}
```

### Laravel
```php
Route::post('/checkout', function (Request $request) {
    $polar = new Polar(config('polar.access_token'));

    $session = $polar->checkouts->create([
        'product_price_id' => $request->input('product_price_id'),
        'success_url' => route('checkout.success'),
        'external_customer_id' => auth()->id(),
    ]);

    return redirect($session['url']);
});
```
