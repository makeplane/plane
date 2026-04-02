# Stripe CLI Reference

Command-line tool for testing and development workflows.

## Installation

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (scoop)
scoop install stripe

# Linux (apt)
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Docker
docker run --rm -it stripe/stripe-cli
```

## Authentication

```bash
stripe login
# Opens browser for Dashboard authorization
# Stores credentials in ~/.config/stripe/config.toml
```

Environment variable (CI/CD):
```bash
export STRIPE_API_KEY=sk_test_...
```

## Webhook Testing

### Listen for Events

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhook

# Output:
# Ready! Your webhook signing secret is whsec_xxx
```

### Trigger Test Events

```bash
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger checkout.session.completed
```

### Event Types

Common events to test:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## API Logs

```bash
# Real-time logs
stripe logs tail

# Filter by status
stripe logs tail --filter-status-code 400

# Filter by path
stripe logs tail --filter-request-path "/v1/charges"
```

## Resource Commands

```bash
# List customers
stripe customers list --limit 5

# Create customer
stripe customers create --email="test@example.com"

# Retrieve resource
stripe products retrieve prod_xxx

# Delete resource
stripe products delete prod_xxx
```

## Fixtures (Batch Operations)

Create `fixtures.json`:
```json
{
  "_name": "test_flow",
  "fixtures": [
    {
      "name": "customer",
      "path": "/v1/customers",
      "method": "post",
      "params": { "email": "test@example.com" }
    },
    {
      "name": "subscription",
      "path": "/v1/subscriptions",
      "method": "post",
      "params": {
        "customer": "${customer:id}",
        "items[0][price]": "price_xxx"
      }
    }
  ]
}
```

Run: `stripe fixtures fixtures.json`

## Common Workflows

### Test Checkout Integration
```bash
# Terminal 1: Listen for webhooks
stripe listen --forward-to localhost:3000/webhook

# Terminal 2: Trigger checkout event
stripe trigger checkout.session.completed
```

### Test Subscription Lifecycle
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Resources

- Full docs: https://docs.stripe.com/cli
- Webhook testing: https://docs.stripe.com/webhooks/test
- Fixtures: https://docs.stripe.com/cli/fixtures
