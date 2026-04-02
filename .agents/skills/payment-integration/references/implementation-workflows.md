# Implementation Workflows

## SePay Implementation
1. Load `references/sepay/overview.md` for auth setup
2. Load `references/sepay/api.md` or `references/sepay/sdk.md` for integration
3. Load `references/sepay/webhooks.md` for payment notifications
4. Use `scripts/sepay-webhook-verify.js` for webhook verification
5. Load `references/sepay/best-practices.md` for production readiness

## Polar Implementation
1. Load `references/polar/overview.md` for auth and concepts
2. Load `references/polar/products.md` for product setup
3. Load `references/polar/checkouts.md` for payment flows
4. Load `references/polar/webhooks.md` for event handling
5. Use `scripts/polar-webhook-verify.js` for webhook verification
6. Load `references/polar/benefits.md` if automating delivery
7. Load `references/polar/best-practices.md` for production readiness

## Stripe Implementation
1. Load `references/stripe/stripe-best-practices.md` for integration design
2. Load `references/stripe/stripe-sdks.md` for server-side SDK setup
3. Load `references/stripe/stripe-js.md` for client-side Elements/Checkout
4. Use `stripe listen` via CLI for local webhook testing (`references/stripe/stripe-cli.md`)
5. Choose integration: Checkout (hosted/embedded) or Payment Element
6. Use CheckoutSessions API for most payment flows
7. Use Billing APIs for subscriptions (combine with Checkout)
8. Load `references/stripe/stripe-upgrade.md` when upgrading API versions

## Creem.io Implementation
1. Load `references/creem/overview.md` for auth and MoR concepts
2. Load `references/creem/api.md` for products and checkout sessions
3. Load `references/creem/checkouts.md` for payment flow options
4. Load `references/creem/webhooks.md` for event handling
5. Load `references/creem/subscriptions.md` if implementing recurring billing
6. Load `references/creem/licensing.md` if implementing device activation
7. Load `references/creem/sdk.md` for framework-specific adapters

## General Workflow
1. Identify platform (Vietnamese → SePay, global SaaS → Polar/Stripe/Creem.io)
2. Load relevant references progressively
3. Implement: auth → products → checkout → webhooks → events
4. Test in sandbox, then production
5. Load only needed references to maintain context efficiency
