# App Development Reference

Guide for building Shopify apps with OAuth, GraphQL/REST APIs, webhooks, and billing.

## OAuth Authentication

### OAuth 2.0 Flow

**1. Redirect to Authorization URL:**
```
https://{shop}.myshopify.com/admin/oauth/authorize?
  client_id={api_key}&
  scope={scopes}&
  redirect_uri={redirect_uri}&
  state={nonce}
```

**2. Handle Callback:**
```javascript
app.get('/auth/callback', async (req, res) => {
  const { code, shop, state } = req.query;

  // Verify state to prevent CSRF
  if (state !== storedState) {
    return res.status(403).send('Invalid state');
  }

  // Exchange code for access token
  const accessToken = await exchangeCodeForToken(shop, code);

  // Store token securely
  await storeAccessToken(shop, accessToken);

  res.redirect(`https://${shop}/admin/apps/${appHandle}`);
});
```

**3. Exchange Code for Token:**
```javascript
async function exchangeCodeForToken(shop, code) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    })
  });

  const { access_token } = await response.json();
  return access_token;
}
```

### Access Scopes

**Common Scopes:**
- `read_products`, `write_products` - Product catalog
- `read_orders`, `write_orders` - Order management
- `read_customers`, `write_customers` - Customer data
- `read_inventory`, `write_inventory` - Stock levels
- `read_fulfillments`, `write_fulfillments` - Order fulfillment
- `read_shipping`, `write_shipping` - Shipping rates
- `read_analytics` - Store analytics
- `read_checkouts`, `write_checkouts` - Checkout data

Full list: https://shopify.dev/api/usage/access-scopes

### Session Tokens (Embedded Apps)

For embedded apps using App Bridge:

```javascript
import { getSessionToken } from '@shopify/app-bridge/utilities';

async function authenticatedFetch(url, options = {}) {
  const app = createApp({ ... });
  const token = await getSessionToken(app);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
}
```

## GraphQL Admin API

### Making Requests

```javascript
async function graphqlRequest(shop, accessToken, query, variables = {}) {
  const response = await fetch(
    `https://${shop}/admin/api/2025-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    }
  );

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}
```

### Product Operations

**Create Product:**
```graphql
mutation CreateProduct($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      title
      handle
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables:
```json
{
  "input": {
    "title": "New Product",
    "productType": "Apparel",
    "vendor": "Brand",
    "status": "ACTIVE",
    "variants": [
      { "price": "29.99", "sku": "SKU-001", "inventoryQuantity": 100 }
    ]
  }
}
```

**Update Product:**
```graphql
mutation UpdateProduct($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id title }
    userErrors { field message }
  }
}
```

**Query Products:**
```graphql
query GetProducts($first: Int!, $query: String) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        title
        status
        variants(first: 5) {
          edges {
            node { id price inventoryQuantity }
          }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

### Order Operations

**Query Orders:**
```graphql
query GetOrders($first: Int!) {
  orders(first: $first) {
    edges {
      node {
        id
        name
        createdAt
        displayFinancialStatus
        totalPriceSet {
          shopMoney { amount currencyCode }
        }
        customer { email firstName lastName }
      }
    }
  }
}
```

**Fulfill Order:**
```graphql
mutation FulfillOrder($input: FulfillmentInput!) {
  fulfillmentCreate(input: $input) {
    fulfillment { id status trackingInfo { number url } }
    userErrors { field message }
  }
}
```

## Webhooks

### Configuration

In `shopify.app.toml`:
```toml
[webhooks]
api_version = "2025-01"

[[webhooks.subscriptions]]
topics = ["orders/create"]
uri = "/webhooks/orders/create"

[[webhooks.subscriptions]]
topics = ["products/update"]
uri = "/webhooks/products/update"

[[webhooks.subscriptions]]
topics = ["app/uninstalled"]
uri = "/webhooks/app/uninstalled"

# GDPR mandatory webhooks
[webhooks.privacy_compliance]
customer_data_request_url = "/webhooks/gdpr/data-request"
customer_deletion_url = "/webhooks/gdpr/customer-deletion"
shop_deletion_url = "/webhooks/gdpr/shop-deletion"
```

### Webhook Handler

```javascript
import crypto from 'crypto';

function verifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = req.rawBody; // Raw body buffer

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return hmac === hash;
}

app.post('/webhooks/orders/create', async (req, res) => {
  if (!verifyWebhook(req)) {
    return res.status(401).send('Unauthorized');
  }

  const order = req.body;
  console.log('New order:', order.id, order.name);

  // Process order...

  res.status(200).send('OK');
});
```

### Common Webhook Topics

**Orders:**
- `orders/create`, `orders/updated`, `orders/delete`
- `orders/paid`, `orders/cancelled`, `orders/fulfilled`

**Products:**
- `products/create`, `products/update`, `products/delete`

**Customers:**
- `customers/create`, `customers/update`, `customers/delete`

**Inventory:**
- `inventory_levels/update`

**App:**
- `app/uninstalled` (critical for cleanup)

## Billing Integration

### App Charges

**One-time Charge:**
```graphql
mutation CreateCharge($input: AppPurchaseOneTimeInput!) {
  appPurchaseOneTimeCreate(input: $input) {
    appPurchaseOneTime {
      id
      name
      price { amount }
      status
      confirmationUrl
    }
    userErrors { field message }
  }
}
```

Variables:
```json
{
  "input": {
    "name": "Premium Feature",
    "price": { "amount": 49.99, "currencyCode": "USD" },
    "returnUrl": "https://your-app.com/billing/callback"
  }
}
```

**Recurring Charge (Subscription):**
```graphql
mutation CreateSubscription($input: AppSubscriptionCreateInput!) {
  appSubscriptionCreate(input: $input) {
    appSubscription {
      id
      name
      status
      confirmationUrl
    }
    userErrors { field message }
  }
}
```

Variables:
```json
{
  "input": {
    "name": "Monthly Subscription",
    "returnUrl": "https://your-app.com/billing/callback",
    "lineItems": [
      {
        "plan": {
          "appRecurringPricingDetails": {
            "price": { "amount": 29.99, "currencyCode": "USD" },
            "interval": "EVERY_30_DAYS"
          }
        }
      }
    ]
  }
}
```

**Usage-based Billing:**
```graphql
mutation CreateUsageCharge($input: AppUsageRecordCreateInput!) {
  appUsageRecordCreate(input: $input) {
    appUsageRecord {
      id
      price { amount }
      description
    }
    userErrors { field message }
  }
}
```

## Metafields

### Create Metafield

```graphql
mutation CreateMetafield($input: MetafieldInput!) {
  metafieldsSet(metafields: [$input]) {
    metafields {
      id
      namespace
      key
      value
    }
    userErrors { field message }
  }
}
```

Variables:
```json
{
  "input": {
    "ownerId": "gid://shopify/Product/123",
    "namespace": "custom",
    "key": "instructions",
    "value": "Handle with care",
    "type": "single_line_text_field"
  }
}
```

**Metafield Types:**
- `single_line_text_field`, `multi_line_text_field`
- `number_integer`, `number_decimal`
- `date`, `date_time`
- `url`, `json`
- `file_reference`, `product_reference`

## Rate Limiting

### GraphQL Cost-Based Limits

**Limits:**
- Available points: 2000
- Restore rate: 100 points/second
- Max query cost: 2000

**Check Cost:**
```javascript
const response = await graphqlRequest(shop, token, query);
const cost = response.extensions?.cost;

console.log(`Cost: ${cost.actualQueryCost}/${cost.throttleStatus.maximumAvailable}`);
```

**Handle Throttling:**
```javascript
async function graphqlWithRetry(shop, token, query, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await graphqlRequest(shop, token, query);
    } catch (error) {
      if (error.message.includes('Throttled') && i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

## Best Practices

**Security:**
- Store credentials in environment variables
- Verify webhook HMAC signatures
- Validate OAuth state parameter
- Use HTTPS for all endpoints
- Implement rate limiting on your endpoints

**Performance:**
- Cache access tokens securely
- Use bulk operations for large datasets
- Implement pagination for queries
- Monitor GraphQL query costs

**Reliability:**
- Implement exponential backoff for retries
- Handle webhook delivery failures
- Log errors for debugging
- Monitor app health metrics

**Compliance:**
- Implement GDPR webhooks (mandatory)
- Handle customer data deletion requests
- Provide data export functionality
- Follow data retention policies
