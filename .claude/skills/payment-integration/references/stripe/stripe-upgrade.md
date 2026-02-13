---
name: upgrade-stripe
description: Guide for upgrading Stripe API versions and SDKs
---

# Upgrading Stripe Versions

This skill covers upgrading Stripe API versions, server-side SDKs, Stripe.js, and mobile SDKs.

**Full Documentation**: https://stripe.com/llms.txt

## Understanding Stripe API Versioning

Stripe uses date-based API versions (e.g., `2025-12-15.clover`, `2025-08-27.basil`, `2024-12-18.acacia`). Your account's API version determines request/response behavior.

### Types of Changes

**Backward-Compatible Changes** (do not require code updates):
- New API resources
- New optional request parameters
- New properties in existing responses
- Changes to opaque string lengths (e.g., object IDs)
- New webhook event types

**Breaking Changes** (require code updates):
- Field renames or removals
- Behavioral modifications
- Removed endpoints or parameters

Review the [API Changelog](https://docs.stripe.com/changelog.md) for all changes between versions.

## Server-Side SDK Versioning

See [SDK Version Management](https://docs.stripe.com/sdks/set-version.md) for details.

### Dynamically-Typed Languages (Ruby, Python, PHP, Node.js)

These SDKs offer flexible version control:

**Global Configuration:**
```python
import stripe
stripe.api_version = '2025-12-15.clover'
```

```ruby
Stripe.api_version = '2025-12-15.clover'
```

```javascript
const stripe = require('stripe')('sk_test_xxx', {
  apiVersion: '2025-12-15.clover'
});
```

**Per-Request Override:**
```python
stripe.Customer.create(
  email="customer@example.com",
  stripe_version='2025-12-15.clover'
)
```

### Strongly-Typed Languages (Java, Go, .NET)

These use a fixed API version matching the SDK release date. Do not set a different API version for strongly-typed languages because response objects might not match the strong types in the SDK. Instead, update the SDK to target a new API version.

### Best Practice

Always specify the API version you're integrating against in your code instead of relying on your account's default API version:

```javascript
// Good: Explicit version
const stripe = require('stripe')('sk_test_xxx', {
  apiVersion: '2025-12-15.clover'
});

// Avoid: Relying on account default
const stripe = require('stripe')('sk_test_xxx');
```

## Stripe.js Versioning

See [Stripe.js Versioning](https://docs.stripe.com/sdks/stripejs-versioning.md) for details.

Stripe.js uses an evergreen model with major releases (Acacia, Basil, Clover) on a biannual basis.

### Loading Versioned Stripe.js

**Via Script Tag:**
```html
<script src="https://js.stripe.com/clover/stripe.js"></script>
```

**Via npm:**
```bash
npm install @stripe/stripe-js
```

Major npm versions correspond to specific Stripe.js versions.

### API Version Pairing

Each Stripe.js version automatically pairs with its corresponding API version. For instance:
- Clover Stripe.js uses `2025-12-15.clover` API
- Acacia Stripe.js uses `2024-12-18.acacia` API

You cannot override this association.

### Migrating from v3

1. Identify your current API version in code
2. Review the changelog for relevant changes
3. Consider gradually updating your API version before switching Stripe.js versions
4. Stripe continues supporting v3 indefinitely

## Mobile SDK Versioning

See [Mobile SDK Versioning](https://docs.stripe.com/sdks/mobile-sdk-versioning.md) for details.

### iOS and Android SDKs

Both platforms follow **semantic versioning** (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking API changes
- **MINOR**: New functionality (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

New features and fixes release only on the latest major version. Upgrade regularly to access improvements.

### React Native SDK

Uses a different model (0.x.y schema):
- **Minor version changes** (x): Breaking changes AND new features
- **Patch updates** (y): Critical bug fixes only

### Backend Compatibility

All mobile SDKs work with any Stripe API version you use on your backend unless documentation specifies otherwise.

## Upgrade Checklist

1. Review the [API Changelog](https://docs.stripe.com/changelog.md) for changes between your current and target versions
2. Check [Upgrades Guide](https://docs.stripe.com/upgrades.md) for migration guidance
3. Update server-side SDK package version (e.g., `npm update stripe`, `pip install --upgrade stripe`)
4. Update the `apiVersion` parameter in your Stripe client initialization
5. Test your integration against the new API version using the `Stripe-Version` header
6. Update webhook handlers to handle new event structures
7. Update Stripe.js script tag or npm package version if needed
8. Update mobile SDK versions in your package manager if needed
9. Store Stripe object IDs in databases that accommodate up to 255 characters (case-sensitive collation)

## Testing API Version Changes

Use the `Stripe-Version` header to test your code against a new version without changing your default:

```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_xxx: \
  -H "Stripe-Version: 2025-12-15.clover"
```

Or in code:

```javascript
const stripe = require('stripe')('sk_test_xxx', {
  apiVersion: '2025-12-15.clover'  // Test with new version
});
```

## Important Notes

- Your webhook listener should handle unfamiliar event types gracefully
- Test webhooks with the new version structure before upgrading
- Breaking changes are tagged by affected product areas (Payments, Billing, Connect, etc.)
- Multiple API versions coexist simultaneously, enabling staged adoption
