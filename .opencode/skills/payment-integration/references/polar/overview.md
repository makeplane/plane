# Polar Overview

Comprehensive payment & billing platform for software monetization with Merchant of Record services.

## Core Capabilities

**Platform Features:**
- Digital product sales (one-time, recurring, usage-based)
- Merchant of Record - handles global tax compliance
- Subscription lifecycle management
- Automated benefit distribution
- Customer self-service portal
- Real-time webhook system
- Analytics dashboard
- Multi-language SDKs

**Merchant of Record Benefits:**
- Global tax compliance (VAT, GST, sales tax)
- Tax calculations for all jurisdictions
- B2B reverse charge, B2C tax collection
- Invoicing from Polar to customers
- Payout invoicing to merchants
- Transparent fees (20% discount vs other MoRs)

## Authentication

### Organization Access Tokens (OAT)

**For:** Server-side API access

**Create:**
1. Org Settings → Developers
2. Create new access token
3. Copy and store securely

**Usage:**
```bash
Authorization: Bearer polar_xxxxxxxxxxxxxxxx
```

**Security:** Never expose client-side (auto-revoked if leaked)

### OAuth 2.0

**For:** Third-party app integration

**Authorization URL:** `https://polar.sh/oauth2/authorize`
**Token URL:** `https://api.polar.sh/v1/oauth2/token`

**Flow:**
```
1. Redirect to authorize URL with scopes
2. User approves permissions
3. Receive authorization code
4. Exchange code for access_token + refresh_token
5. Use access_token for API calls
```

**Scopes:**
- `products:read/write` - Product management
- `checkouts:read/write` - Checkout operations
- `orders:read` - View orders
- `subscriptions:read/write` - Subscription management
- `benefits:read/write` - Benefit configuration
- `customers:read/write` - Customer management
- `discounts:read/write` - Discount codes
- `refunds:read/write` - Refund processing

### Customer Sessions

**For:** Customer-facing portal operations

**Create:** Server-side API call returns customer access token
**Usage:** Pre-authenticated customer portal links
**Scope:** Restricted to customer-specific operations

## Base URLs

**Production:**
- Dashboard: `https://polar.sh`
- API: `https://api.polar.sh/v1/`

**Sandbox:**
- Dashboard: `https://sandbox.polar.sh`
- API: `https://sandbox-api.polar.sh/v1/`

**SDK Configuration:**
```typescript
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "production" // or "sandbox"
});
```

## Rate Limits

**Limits:**
- 300 requests/minute per org/customer/OAuth2 client
- 3 requests/second for unauthenticated license validation

**Response:** HTTP 429 with `Retry-After` header

**Handling:**
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  await sleep(retryAfter * 1000);
  return retry();
}
```

## Key Concepts

### External Customer ID
- Map your user IDs to Polar customers
- Set at checkout: `external_customer_id`
- Query API by external_id
- Immutable once set
- Use for all customer operations

### Metadata
- Custom key-value storage
- Available on products, customers, subscriptions, orders
- For reporting and filtering
- Not indexed, use for supplementary data

### Billing Reasons
Track order types via `billing_reason`:
- `purchase` - One-time product
- `subscription_create` - New subscription
- `subscription_cycle` - Renewal invoice
- `subscription_update` - Plan change

## Environments

**Sandbox:**
- Separate account required
- Separate organization
- Separate access tokens (production tokens don't work)
- Test with Stripe test cards

**Test Cards (Stripe):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Auth Required: `4000 0025 0000 3155`
- Expiry: Any future date
- CVC: Any 3 digits

## SDKs

**Official SDKs:**
- TypeScript/JavaScript: `@polar-sh/sdk`
- Python: `polar-sdk`
- PHP: `polar-sh/sdk`
- Go: Official SDK

**Framework Adapters:**
- Next.js: `@polar-sh/nextjs` (quickstart: `npx polar-init`)
- Laravel: `polar-sh/laravel`
- Remix, Astro, Express, TanStack Start
- Elysia, Fastify, Hono, SvelteKit

**BetterAuth Integration:**
- Package: `@polar-sh/better-auth`
- Auto-create customers on signup
- External ID mapping
- User-customer sync

## Support & Resources

- Docs: https://polar.sh/docs
- API Reference: https://polar.sh/docs/api-reference
- LLMs.txt: https://polar.sh/docs/llms.txt
- GitHub: https://github.com/polarsource/polar
- Discussions: https://github.com/orgs/polarsource/discussions

## Next Steps

- **For products:** Load `products.md`
- **For checkout:** Load `checkouts.md`
- **For subscriptions:** Load `subscriptions.md`
- **For webhooks:** Load `webhooks.md`
- **For benefits:** Load `benefits.md`
- **For SDK usage:** Load `sdk.md`
