# Paddle API Reference

Base URL: `https://api.paddle.com` (prod) | `https://sandbox-api.paddle.com` (sandbox)

## Products

```bash
# Create product
POST /products
{
  "name": "Pro Plan",
  "tax_category": "standard",
  "description": "Professional subscription"
}

# List products
GET /products?status=active
```

## Prices

```bash
# Create price
POST /prices
{
  "product_id": "pro_xxx",
  "description": "Monthly subscription",
  "unit_price": { "amount": "1999", "currency_code": "USD" },
  "billing_cycle": { "interval": "month", "frequency": 1 }
}

# One-time price
POST /prices
{
  "product_id": "pro_xxx",
  "unit_price": { "amount": "4999", "currency_code": "USD" }
}
```

## Transactions

```bash
# Create transaction (checkout)
POST /transactions
{
  "items": [{ "price_id": "pri_xxx", "quantity": 1 }],
  "customer_id": "ctm_xxx"  # optional
}

# Get transaction
GET /transactions/{txn_id}
```

## Customers

```bash
# Create customer
POST /customers
{
  "email": "user@example.com",
  "name": "John Doe"
}

# Get customer portal session
POST /customers/{ctm_id}/portal-sessions
```

## Subscriptions

```bash
# Get subscription
GET /subscriptions/{sub_id}

# Update subscription
PATCH /subscriptions/{sub_id}
{
  "items": [{ "price_id": "pri_new", "quantity": 1 }],
  "proration_billing_mode": "prorated_immediately"
}

# Cancel subscription
POST /subscriptions/{sub_id}/cancel
{
  "effective_from": "next_billing_period"
}

# Pause subscription
POST /subscriptions/{sub_id}/pause
{
  "effective_from": "next_billing_period"
}
```

## Response Format

```json
{
  "data": { ... },
  "meta": {
    "request_id": "xxx",
    "pagination": { "per_page": 50, "next": "..." }
  }
}
```

## Error Handling

```json
{
  "error": {
    "type": "request_error",
    "code": "entity_not_found",
    "detail": "Product not found"
  }
}
```
