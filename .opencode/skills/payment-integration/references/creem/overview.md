# Creem.io Overview

Payment infrastructure platform supporting subscriptions, one-time payments, and licensing. Functions as Merchant of Record (MoR) - handles compliance, taxes, and payment processing.

## Key Features

- **Merchant of Record**: Tax compliance, payment processing, global coverage
- **Subscriptions**: Recurring billing, trials, seat-based, prorations
- **One-Time Payments**: Single charges for products/services
- **Licensing**: Activation keys, device management, validation
- **Checkouts**: Hosted, embedded, no-code options
- **Customer Portal**: Self-service billing management
- **Revenue Splits**: Automatic payment distribution to multiple recipients

## When to Choose Creem

- Global SaaS products requiring MoR
- Software licensing with activation management
- Subscription products with seat-based billing
- Digital product sales with file delivery
- Affiliate/commission programs
- Multi-recipient revenue splitting

## Authentication

```bash
# API Key authentication
curl -H "Authorization: Bearer sk_live_xxx" https://api.creem.io/v1/...
```

Environment variables:
```bash
CREEM_API_KEY=sk_live_xxx        # Production
CREEM_API_KEY=sk_test_xxx        # Test mode
CREEM_WEBHOOK_SECRET=whsec_xxx   # Webhook verification
```

## API Base URLs

- **Production**: `https://api.creem.io/v1`
- **Test Mode**: Use `sk_test_` prefixed API keys

## Rate Limits

Standard API rate limits apply. Check response headers for limit status.

## Global Support

- **Customers**: Hundreds of countries supported
- **Merchants**: Global payouts
- **Languages**: 42 languages for checkout localization

## Related References

- **API Endpoints**: `references/creem/api.md`
- **Webhooks**: `references/creem/webhooks.md`
- **Checkouts**: `references/creem/checkouts.md`
- **Subscriptions**: `references/creem/subscriptions.md`
- **Licensing**: `references/creem/licensing.md`
- **SDKs**: `references/creem/sdk.md`

## External Resources

- **Documentation**: https://docs.creem.io
- **LLM Docs**: https://docs.creem.io/llms.txt
