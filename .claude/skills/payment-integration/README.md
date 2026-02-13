# Payment Integration Skill

Comprehensive payment integration skill for SePay (Vietnamese payment gateway), Polar (global SaaS monetization platform), and Stripe (global payment infrastructure).

## Features

### SePay Integration
- Vietnamese payment gateway with VietQR, NAPAS, bank transfers, and cards
- 44+ supported banks
- Webhook verification with API Key/OAuth2 authentication
- QR code generation API
- Order-based virtual accounts
- SDK support for Node.js, PHP, and Laravel

### Polar Integration
- Global SaaS monetization platform
- Merchant of Record (handles global tax compliance)
- Subscription management with trials, upgrades, downgrades
- Usage-based billing with events and meters
- Automated benefit delivery (GitHub repos, Discord roles, license keys, files)
- Customer self-service portal
- Multi-language SDKs (TypeScript, Python, PHP, Go)
- Framework adapters (Next.js, Laravel, Remix, etc.)

### Stripe Integration
- Global payment infrastructure
- CheckoutSessions, PaymentIntents, SetupIntents APIs
- Billing and subscriptions at scale
- Connect for marketplaces and platforms
- Payment Element for custom checkout experiences
- Multi-language SDKs (Node.js, Python, Ruby, PHP, Java, Go, .NET)
- Best practices for integration design and API version upgrades

## Structure

```
payment-integration/
├── SKILL.md                      # Main skill definition
├── README.md                     # This file
├── references/                   # Progressive disclosure documentation
│   ├── sepay/                   # SePay integration guides
│   │   ├── overview.md          # Auth, capabilities, environments
│   │   ├── api.md               # API endpoints and operations
│   │   ├── webhooks.md          # Webhook setup and handling
│   │   ├── sdk.md               # SDK usage (Node.js, PHP, Laravel)
│   │   ├── qr-codes.md          # VietQR generation
│   │   └── best-practices.md    # Security, patterns, monitoring
│   ├── polar/                   # Polar integration guides
│   │   ├── overview.md          # Auth, MoR concept, environments
│   │   ├── products.md          # Products, pricing, usage-based billing
│   │   ├── checkouts.md         # Checkout flows and embedded checkout
│   │   ├── subscriptions.md     # Lifecycle, upgrades, trials
│   │   ├── webhooks.md          # Event handling and verification
│   │   ├── benefits.md          # Automated benefit delivery
│   │   ├── sdk.md               # Multi-language SDK usage
│   │   └── best-practices.md    # Security, patterns, monitoring
│   └── stripe/                  # Stripe integration guides
│       ├── stripe-best-practices.md  # Integration design, API selection
│       └── stripe-upgrade.md         # API versions, SDK upgrades
└── scripts/                      # Integration helper scripts
    ├── sepay-webhook-verify.js   # SePay webhook verification
    ├── polar-webhook-verify.js   # Polar webhook verification
    ├── checkout-helper.js        # Checkout session generation
    ├── test-scripts.js           # Test suite for all scripts
    ├── package.json              # Node.js package configuration
    └── .env.example              # Environment variable template
```

## Usage

### Activate the Skill

Claude Code will automatically activate this skill when you mention payment integration, subscriptions, webhooks, or platform-specific terms (SePay, Polar).

### Manual Activation

In conversations, simply reference the platforms:
- "Implement SePay payment integration"
- "Set up Polar subscriptions with usage-based billing"
- "Create webhook handler for payment notifications"

### Using Scripts

**SePay Webhook Verification:**
```bash
cd $HOME/.claude/skills/payment-integration/scripts
node sepay-webhook-verify.js '{"id":12345,"gateway":"Vietcombank",...}'
```

**Polar Webhook Verification:**
```bash
node polar-webhook-verify.js '{"type":"order.paid","data":{...}}' base64secret
```

**Checkout Helper:**
```bash
# SePay
node checkout-helper.js sepay '{"orderInvoiceNumber":"ORD001","orderAmount":100000,...}'

# Polar
node checkout-helper.js polar '{"productPriceId":"price_xxx","successUrl":"https://..."}'
```

**Run Tests:**
```bash
npm test
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# SePay
SEPAY_MERCHANT_ID=SP-TEST-XXXXXXX
SEPAY_SECRET_KEY=spsk_test_xxxxxxxxxxxxx
SEPAY_ENV=sandbox
SEPAY_WEBHOOK_API_KEY=your_key

# Polar
POLAR_ACCESS_TOKEN=polar_xxxxxxxxxxxxxxxx
POLAR_SERVER=sandbox
POLAR_WEBHOOK_SECRET=base64_secret
```

## Progressive Disclosure

The skill uses progressive disclosure to minimize context usage:
1. **SKILL.md** - Overview and quick reference (~99 lines)
2. **references/** - Detailed guides loaded as needed (<100 lines each)
3. **scripts/** - Executable helpers with embedded examples

Load only the references you need for your current task.

## Platform Selection Guide

**Choose SePay for:**
- Vietnamese market targeting
- Bank transfer automation
- Local payment methods
- QR code payments (VietQR/NAPAS)
- Direct bank monitoring

**Choose Polar for:**
- Global market
- SaaS/subscription business
- Usage-based billing
- Automated benefit delivery
- Tax compliance (Merchant of Record)
- Customer self-service

**Choose Stripe for:**
- Global payment infrastructure
- Enterprise-grade payment processing
- Connect platforms (marketplaces)
- Billing/subscriptions at scale
- Custom checkout experiences (Payment Element)
- Maximum payment method coverage

## Examples

### SePay Payment Flow
1. Load `references/sepay/overview.md` for authentication
2. Load `references/sepay/sdk.md` for integration
3. Use `checkout-helper.js` to generate payment form
4. Load `references/sepay/webhooks.md` for notifications
5. Use `sepay-webhook-verify.js` to verify authenticity

### Polar Subscription Flow
1. Load `references/polar/overview.md` for setup
2. Load `references/polar/products.md` for pricing
3. Load `references/polar/checkouts.md` for payment
4. Load `references/polar/subscriptions.md` for lifecycle
5. Load `references/polar/webhooks.md` for events
6. Load `references/polar/benefits.md` for automation

### Stripe Integration Flow
1. Load `references/stripe/stripe-best-practices.md` for integration design
2. Choose: Checkout (hosted/embedded) or Payment Element
3. Use CheckoutSessions API for most use cases
4. Load `references/stripe/stripe-upgrade.md` when upgrading API versions

## Testing

All scripts include comprehensive test coverage:
- SePay webhook verification (with/without authentication)
- Polar webhook signature validation
- Checkout configuration generation
- Error handling and edge cases

Run `npm test` in the scripts directory to verify functionality.

## Support

### SePay
- Docs: https://developer.sepay.vn/en
- Email: info@sepay.vn
- Hotline: 02873059589

### Polar
- Docs: https://polar.sh/docs
- API Reference: https://polar.sh/docs/api-reference
- GitHub: https://github.com/polarsource/polar

### Stripe
- Docs: https://docs.stripe.com
- API Reference: https://docs.stripe.com/api
- Changelog: https://docs.stripe.com/changelog
- Go Live Checklist: https://docs.stripe.com/get-started/checklist/go-live

## License

MIT

## Version

1.1.0
