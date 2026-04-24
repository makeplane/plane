# Paddle Subscriptions

Full subscription lifecycle management.

## Create Subscription

Via checkout (customer initiates):
```typescript
paddle.Checkout.open({
  items: [{ priceId: 'pri_monthly', quantity: 1 }],
  customer: { email: 'user@example.com' }
});
```

## Subscription States

| Status | Description |
|--------|-------------|
| `trialing` | In trial period |
| `active` | Actively billed |
| `past_due` | Payment failed, retrying |
| `paused` | Temporarily suspended |
| `canceled` | Terminated |

## Upgrade/Downgrade

```typescript
// API: Update subscription items
PATCH /subscriptions/{sub_id}
{
  "items": [{ "price_id": "pri_annual", "quantity": 1 }],
  "proration_billing_mode": "prorated_immediately"
}
```

Proration modes:
- `prorated_immediately` - Charge/credit now
- `prorated_next_billing_period` - Apply next cycle
- `full_immediately` - Full new price now
- `full_next_billing_period` - Full price next cycle
- `do_not_bill` - No charge for change

## Multi-Item Subscriptions

```typescript
// Add item to existing subscription
PATCH /subscriptions/{sub_id}
{
  "items": [
    { "price_id": "pri_base", "quantity": 1 },
    { "price_id": "pri_addon", "quantity": 5 }
  ]
}
```

## Trials

Set trial on price:
```typescript
POST /prices
{
  "product_id": "pro_xxx",
  "unit_price": { "amount": "999", "currency_code": "USD" },
  "billing_cycle": { "interval": "month", "frequency": 1 },
  "trial_period": { "interval": "day", "frequency": 14 }
}
```

## Pause/Resume

```typescript
// Pause at end of period
POST /subscriptions/{sub_id}/pause
{
  "effective_from": "next_billing_period"
}

// Resume immediately
POST /subscriptions/{sub_id}/resume
{
  "effective_from": "immediately"
}
```

## Cancel

```typescript
// Cancel at end of period
POST /subscriptions/{sub_id}/cancel
{
  "effective_from": "next_billing_period"
}

// Cancel immediately
POST /subscriptions/{sub_id}/cancel
{
  "effective_from": "immediately"
}
```

## Customer Portal

Self-service subscription management:
```typescript
// Get portal URL
POST /customers/{ctm_id}/portal-sessions

// Response
{
  "data": {
    "id": "cps_xxx",
    "customer_id": "ctm_xxx",
    "urls": {
      "general": { "overview": "https://..." }
    }
  }
}
```
