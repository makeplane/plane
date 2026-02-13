# Polar Products & Pricing

Product management, pricing models, and usage-based billing.

## Billing Cycles

**Options:**
- One-time: Charged once, forever access
- Monthly: Charged every month
- Yearly: Charged every year

**Important:** Cannot change after product creation

## Pricing Types

**Fixed Price:** Set amount
**Pay What You Want:** Customer decides (optional minimum)
**Free:** No charge

**Important:** Cannot change after product creation

## Advanced Pricing Models

### Seat-Based Pricing
- Team access with assignable seats
- Works for recurring or one-time
- Tiered pricing structures
- Customer manages seat assignments

**Configuration:**
```typescript
const product = await polar.products.create({
  name: "Team Plan",
  prices: [{
    type: "recurring",
    recurring_interval: "month",
    price_amount: 5000, // per seat
    pricing_type: "fixed"
  }],
  is_seat_based: true,
  max_seats: 100
});
```

### Usage-Based Billing

**Architecture:** Events → Meters → Metered Prices

**1. Events:** Usage data from your application
```typescript
await polar.events.create({
  external_customer_id: "user_123",
  event_name: "api_call",
  properties: {
    tokens: 1000,
    model: "gpt-4"
  }
});
```

**2. Meters:** Filter & aggregate events
```typescript
const meter = await polar.meters.create({
  name: "API Tokens",
  slug: "api_tokens",
  event_name: "api_call",
  aggregation: {
    type: "sum",
    property: "tokens"
  }
});
```

**3. Metered Prices:** Billing based on usage
```typescript
const price = await polar.products.createPrice(productId, {
  type: "metered",
  meter_id: meter.id,
  price_per_unit: 10, // 10 cents per 1000 tokens
  billing_interval: "month"
});
```

**Credits System:**
- Pre-purchased usage credits
- Credit customer's meter balance
- Use as subscription benefit
- Balance tracking API

**Ingestion Strategies:**
- LLM Strategy: AI/ML tracking
- S3 Strategy: Bulk import
- Stream Strategy: Real-time
- Delta Time Strategy: Time-based

## Product Features

### Metadata
```typescript
const product = await polar.products.create({
  name: "Pro Plan",
  metadata: {
    feature_x: "enabled",
    tier: "pro",
    custom_field: "value"
  }
});
```

### Custom Fields
```typescript
const product = await polar.products.create({
  name: "Enterprise Plan",
  custom_fields: [
    {
      slug: "company_name",
      label: "Company Name",
      type: "text",
      required: true
    },
    {
      slug: "employees",
      label: "Number of Employees",
      type: "number"
    }
  ]
});
```

Data collected at checkout, accessible via Orders/Subscriptions API in `custom_field_data`.

### Trials
- Set on recurring products
- Customer not charged during trial
- Benefits granted immediately
- Configure at product or checkout level

```typescript
const product = await polar.products.create({
  name: "Pro Plan",
  prices: [{
    type: "recurring",
    recurring_interval: "month",
    price_amount: 2000,
    trial_period_days: 14
  }]
});
```

## Product Operations

### Create Product
```typescript
const product = await polar.products.create({
  organization_id: "org_xxx",
  name: "Pro Plan",
  description: "Professional features",
  prices: [{
    type: "recurring",
    recurring_interval: "month",
    price_amount: 2000,
    pricing_type: "fixed"
  }]
});
```

### List Products
```typescript
const products = await polar.products.list({
  organization_id: "org_xxx",
  is_archived: false
});
```

### Update Product
```typescript
const product = await polar.products.update(productId, {
  name: "Pro Plan Updated",
  description: "New description"
});
```

### Archive Product
```typescript
await polar.products.archive(productId);
// Products can be unarchived later
// Cannot be deleted (maintains order history)
```

### Update Benefits
```typescript
await polar.products.updateBenefits(productId, {
  benefits: [benefitId1, benefitId2]
});
```

## Important Constraints

1. **Cannot change after creation:**
   - Billing cycle (one-time, monthly, yearly)
   - Pricing type (fixed, pay-what-you-want, free)

2. **Price changes don't affect existing subscribers:**
   - Current subscribers keep their original price
   - New subscribers get new price
   - Use separate products for significant changes

3. **Products cannot be deleted:**
   - Archive instead
   - Maintains order history integrity
   - Archived products not shown to new customers

4. **Metadata vs Custom Fields:**
   - Metadata: For internal use, not shown to customers
   - Custom Fields: Collected from customers at checkout

## Best Practices

1. **Product Strategy:**
   - Plan billing cycle carefully before creation
   - Use separate products for different tiers
   - Archive unused products rather than delete

2. **Pricing Changes:**
   - Create new product for major changes
   - Grandfather existing customers
   - Communicate changes clearly

3. **Usage-Based:**
   - Define clear meter aggregations
   - Set appropriate billing intervals
   - Monitor usage patterns
   - Provide usage dashboards to customers

4. **Custom Fields:**
   - Collect only necessary information
   - Validate on frontend before checkout
   - Use for personalization and support

5. **Trials:**
   - Set appropriate trial duration
   - Communicate trial end clearly
   - Notify before trial expires
   - Easy cancellation during trial
