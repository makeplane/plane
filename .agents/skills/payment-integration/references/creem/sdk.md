# Creem.io SDKs

## Official SDKs

### Core SDK (`creem`)

Full API access with maximum flexibility:

```bash
npm install creem
# or
pip install creem
```

```javascript
// Node.js
import Creem from 'creem';

const creem = new Creem({
  apiKey: process.env.CREEM_API_KEY
});

// Create checkout
const session = await creem.checkout.sessions.create({
  product_id: 'prod_xxx',
  success_url: 'https://example.com/success'
});
```

```python
# Python
from creem import Creem

creem = Creem(api_key=os.environ['CREEM_API_KEY'])

session = creem.checkout.sessions.create(
    product_id='prod_xxx',
    success_url='https://example.com/success'
)
```

### Wrapper SDK (`creem_io`)

Helper functions for common operations:

```bash
npm install creem_io
```

```javascript
import { CreemClient, verifyWebhook } from 'creem_io';

const client = new CreemClient({
  apiKey: process.env.CREEM_API_KEY,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET
});

// Simplified webhook verification
app.post('/webhook', async (req, res) => {
  const event = client.verifyWebhook(req.body, req.headers['x-creem-signature']);
  // Handle event...
});

// Access management helpers
const hasAccess = await client.checkAccess(customerId, productId);
```

## Framework Adapters

### Next.js Adapter

End-to-end billing integration:

```bash
npm install @creem/nextjs
```

```typescript
// app/api/checkout/route.ts
import { createCheckout } from '@creem/nextjs';

export const POST = createCheckout({
  productId: 'prod_xxx',
  successUrl: '/success',
  cancelUrl: '/pricing'
});

// app/api/webhooks/creem/route.ts
import { handleWebhook } from '@creem/nextjs';

export const POST = handleWebhook({
  onCheckoutCompleted: async (session) => {
    await grantAccess(session.customer_id);
  },
  onSubscriptionCancelled: async (subscription) => {
    await revokeAccess(subscription.customer_id);
  }
});
```

### Better Auth Integration

Combined auth + payments:

```bash
npm install @creem/better-auth
```

```typescript
import { betterAuth } from 'better-auth';
import { creemPlugin } from '@creem/better-auth';

export const auth = betterAuth({
  plugins: [
    creemPlugin({
      apiKey: process.env.CREEM_API_KEY,
      webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
      products: {
        pro: 'prod_xxx',
        enterprise: 'prod_yyy'
      }
    })
  ]
});

// Check subscription in auth session
const session = await auth.getSession();
if (session.user.subscription?.status === 'active') {
  // User has active subscription
}
```

### Next.js Template

Pre-built starter with Prisma, shadcn/ui, Tailwind:

```bash
npx create-creem-app my-saas
# or
git clone https://github.com/creem-io/nextjs-template
```

Includes:
- Auth (Better Auth)
- Database (Prisma)
- UI (shadcn/ui, Tailwind)
- Pricing page
- Customer portal
- Webhook handling

## Environment Variables

```bash
# .env
CREEM_API_KEY=sk_live_xxx           # or sk_test_xxx for test mode
CREEM_WEBHOOK_SECRET=whsec_xxx
```

## AI Tool Integration

Creem supports Claude Code, Cursor, Windsurf via official skill - this document is part of that integration.
