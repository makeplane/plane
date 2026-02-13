---
name: shopify
description: Build Shopify apps, extensions, themes with Shopify CLI. Use for GraphQL/REST APIs, Polaris UI, Liquid templates, checkout customization, webhooks, billing integration.
---

# Shopify Development

Comprehensive guide for building on Shopify platform: apps, extensions, themes, and API integrations.

## Platform Overview

**Core Components:**
- **Shopify CLI** - Development workflow tool
- **GraphQL Admin API** - Primary API for data operations (recommended)
- **REST Admin API** - Legacy API (maintenance mode)
- **Polaris UI** - Design system for consistent interfaces
- **Liquid** - Template language for themes

**Extension Points:**
- Checkout UI - Customize checkout experience
- Admin UI - Extend admin dashboard
- POS UI - Point of Sale customization
- Customer Account - Post-purchase pages
- Theme App Extensions - Embedded theme functionality

## Quick Start

### Prerequisites

```bash
# Install Shopify CLI
npm install -g @shopify/cli@latest

# Verify installation
shopify version
```

### Create New App

```bash
# Initialize app
shopify app init

# Start development server
shopify app dev

# Generate extension
shopify app generate extension --type checkout_ui_extension

# Deploy
shopify app deploy
```

### Theme Development

```bash
# Initialize theme
shopify theme init

# Start local preview
shopify theme dev

# Pull from store
shopify theme pull --live

# Push to store
shopify theme push --development
```

## Development Workflow

### 1. App Development

**Setup:**
```bash
shopify app init
cd my-app
```

**Configure Access Scopes** (`shopify.app.toml`):
```toml
[access_scopes]
scopes = "read_products,write_products,read_orders"
```

**Start Development:**
```bash
shopify app dev  # Starts local server with tunnel
```

**Add Extensions:**
```bash
shopify app generate extension --type checkout_ui_extension
```

**Deploy:**
```bash
shopify app deploy  # Builds and uploads to Shopify
```

### 2. Extension Development

**Available Types:**
- Checkout UI - `checkout_ui_extension`
- Admin Action - `admin_action`
- Admin Block - `admin_block`
- POS UI - `pos_ui_extension`
- Function - `function` (discounts, payment, delivery, validation)

**Workflow:**
```bash
shopify app generate extension
# Select type, configure
shopify app dev  # Test locally
shopify app deploy  # Publish
```

### 3. Theme Development

**Setup:**
```bash
shopify theme init
# Choose Dawn (reference theme) or start fresh
```

**Local Development:**
```bash
shopify theme dev
# Preview at localhost:9292
# Auto-syncs to development theme
```

**Deployment:**
```bash
shopify theme push --development  # Push to dev theme
shopify theme publish --theme=123  # Set as live
```

## When to Build What

### Build an App When:
- Integrating external services
- Adding functionality across multiple stores
- Building merchant-facing admin tools
- Managing store data programmatically
- Implementing complex business logic
- Charging for functionality

### Build an Extension When:
- Customizing checkout flow
- Adding fields/features to admin pages
- Creating POS actions for retail
- Implementing discount/payment/shipping rules
- Extending customer account pages

### Build a Theme When:
- Creating custom storefront design
- Building unique shopping experiences
- Customizing product/collection pages
- Implementing brand-specific layouts
- Modifying homepage/content pages

### Combination Approach:
**App + Theme Extension:**
- App handles backend logic and data
- Theme extension provides storefront UI
- Example: Product reviews, wishlists, size guides

## Essential Patterns

### GraphQL Product Query

```graphql
query GetProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        variants(first: 5) {
          edges {
            node {
              id
              price
              inventoryQuantity
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Checkout Extension (React)

```javascript
import { reactExtension, BlockStack, TextField, Checkbox } from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => <Extension />);

function Extension() {
  const [message, setMessage] = useState('');

  return (
    <BlockStack>
      <TextField label="Gift Message" value={message} onChange={setMessage} />
    </BlockStack>
  );
}
```

### Liquid Product Display

```liquid
{% for product in collection.products %}
  <div class="product-card">
    <img src="{{ product.featured_image | img_url: 'medium' }}" alt="{{ product.title }}">
    <h3>{{ product.title }}</h3>
    <p>{{ product.price | money }}</p>
    <a href="{{ product.url }}">View Details</a>
  </div>
{% endfor %}
```

## Best Practices

**API Usage:**
- Prefer GraphQL over REST for new development
- Request only needed fields to reduce costs
- Implement pagination for large datasets
- Use bulk operations for batch processing
- Respect rate limits (cost-based for GraphQL)

**Security:**
- Store API credentials in environment variables
- Verify webhook signatures
- Use OAuth for public apps
- Request minimal access scopes
- Implement session tokens for embedded apps

**Performance:**
- Cache API responses when appropriate
- Optimize images in themes
- Minimize Liquid logic complexity
- Use async loading for extensions
- Monitor query costs in GraphQL

**Testing:**
- Use development stores for testing
- Test across different store plans
- Verify mobile responsiveness
- Check accessibility (keyboard, screen readers)
- Validate GDPR compliance

## Reference Documentation

Detailed guides for advanced topics:

- **[App Development](references/app-development.md)** - OAuth, APIs, webhooks, billing
- **[Extensions](references/extensions.md)** - Checkout, Admin, POS, Functions
- **[Themes](references/themes.md)** - Liquid, sections, deployment

## Scripts

**[shopify_init.py](scripts/shopify_init.py)** - Initialize Shopify projects interactively
```bash
python scripts/shopify_init.py
```

## Troubleshooting

**Rate Limit Errors:**
- Monitor `X-Shopify-Shop-Api-Call-Limit` header
- Implement exponential backoff
- Use bulk operations for large datasets

**Authentication Failures:**
- Verify access token validity
- Check required scopes granted
- Ensure OAuth flow completed

**Extension Not Appearing:**
- Verify extension target correct
- Check extension published
- Ensure app installed on store

**Webhook Not Receiving:**
- Verify webhook URL accessible
- Check signature validation
- Review logs in Partner Dashboard

## Resources

**Official Documentation:**
- Shopify Docs: https://shopify.dev/docs
- GraphQL API: https://shopify.dev/docs/api/admin-graphql
- Shopify CLI: https://shopify.dev/docs/api/shopify-cli
- Polaris: https://polaris.shopify.com

**Tools:**
- GraphiQL Explorer (Admin → Settings → Apps → Develop apps)
- Partner Dashboard (app management)
- Development stores (free testing)

**API Versioning:**
- Quarterly releases (YYYY-MM format)
- Current: 2025-01
- 12-month support per version
- Test before version updates

---

**Note:** This skill covers Shopify platform as of January 2025. Refer to official documentation for latest updates.
