# Polar Benefits

Automated benefit delivery system for digital products.

## Philosophy

Configure once, automatic delivery. Polar handles granting and revoking based on subscription state.

## Benefit Types

### 1. License Keys

**Auto-generate unique keys with customizable branding.**

**Create:**
```typescript
const benefit = await polar.benefits.create({
  type: "license_keys",
  organization_id: "org_xxx",
  description: "Software License",
  properties: {
    prefix: "MYAPP",
    expires: false,
    activations: 1,
    limit_usage: false
  }
});
```

**Validation API (unauthenticated):**
```typescript
const validation = await polar.licenses.validate({
  key: "MYAPP-XXXX-XXXX-XXXX",
  organization_id: "org_xxx"
});

if (validation.valid) {
  // Grant access
}
```

**Activation/Deactivation:**
```typescript
await polar.licenses.activate(licenseKey, {
  label: "User's MacBook Pro"
});

await polar.licenses.deactivate(activationId);
```

**Auto-revoke:** On subscription cancellation or refund

### 2. GitHub Repository Access

**Auto-invite to private repos with permission management.**

**Create:**
```typescript
const benefit = await polar.benefits.create({
  type: "github_repository",
  organization_id: "org_xxx",
  description: "Access to private repo",
  properties: {
    repository_owner: "myorg",
    repository_name: "private-repo",
    permission: "pull" // or "push", "admin"
  }
});
```

**Multiple Repos:**
```typescript
{
  properties: {
    repositories: [
      { owner: "myorg", name: "repo1", permission: "pull" },
      { owner: "myorg", name: "repo2", permission: "push" }
    ]
  }
}
```

**Behavior:**
- Auto-invite on subscription activation
- Permission managed by Polar
- Auto-revoke on cancellation

### 3. Discord Access

**Server invites and role assignment.**

**Create:**
```typescript
const benefit = await polar.benefits.create({
  type: "discord",
  organization_id: "org_xxx",
  description: "Premium Discord role",
  properties: {
    guild_id: "123456789",
    role_id: "987654321"
  }
});
```

**Multiple Roles:**
```typescript
{
  properties: {
    guild_id: "123456789",
    roles: [
      { role_id: "role1", name: "Premium" },
      { role_id: "role2", name: "Supporter" }
    ]
  }
}
```

**Requirements:**
- Polar Discord app must be added to server
- Configure in Polar dashboard

**Behavior:**
- Auto-invite to server
- Assign roles automatically
- Remove roles on cancellation

### 4. Downloadable Files

**Secure file delivery up to 10GB each.**

**Create:**
```typescript
const benefit = await polar.benefits.create({
  type: "downloadable",
  organization_id: "org_xxx",
  description: "Premium templates",
  properties: {
    files: [
      { name: "template1.zip", size: 5000000 },
      { name: "template2.psd", size: 10000000 }
    ]
  }
});
```

**Upload Files:**
- Via Polar dashboard
- Secure storage
- Access control

**Customer Access:**
- Download links in customer portal
- Secure, time-limited URLs
- Multiple files supported

### 5. Meter Credits

**Pre-purchased usage for usage-based billing.**

**Create:**
```typescript
const benefit = await polar.benefits.create({
  type: "custom",
  organization_id: "org_xxx",
  description: "10,000 API credits",
  properties: {
    meter_id: "meter_xxx",
    credits: 10000
  }
});
```

**Automatic Application:**
- Credits added on subscription start
- Balance tracked via API
- Depletes with usage

**Balance Check:**
```typescript
const balance = await polar.meters.getBalance({
  customer_id: "cust_xxx",
  meter_id: "meter_xxx"
});
```

### 6. Custom Benefits

**Flexible placeholder for manual fulfillment.**

**Create:**
```typescript
const benefit = await polar.benefits.create({
  type: "custom",
  organization_id: "org_xxx",
  description: "Priority support via email",
  properties: {
    note: "Email support@example.com with your order ID for priority support"
  }
});
```

**Use Cases:**
- Cal.com booking links
- Email support access
- Community forum access
- Manual onboarding

## Benefit Grants

**Link between customer and benefit.**

### States
- `created` - Grant created
- `active` - Benefit delivered
- `revoked` - Access removed

### Webhooks
- `benefit_grant.created` - Grant created
- `benefit_grant.updated` - Status changed
- `benefit_grant.revoked` - Access revoked

### Auto-revoke Triggers
- Subscription canceled
- Subscription revoked
- Refund processed
- Product changed (if benefit not on new product)

### Querying Grants
```typescript
const grants = await polar.benefitGrants.list({
  customer_id: "cust_xxx",
  benefit_id: "benefit_xxx",
  is_granted: true
});
```

## Attaching Benefits to Products

### Via API
```typescript
await polar.products.updateBenefits(productId, {
  benefits: [benefitId1, benefitId2, benefitId3]
});
```

### Via Dashboard
1. Navigate to product
2. Benefits tab
3. Select benefits to attach
4. Save

### Order
- Benefits granted in order attached
- Customers see in that order
- Reorder via dashboard or API

## Customer Experience

### Viewing Benefits
- Customer portal shows all active benefits
- Clear instructions for each type
- Download links for files
- License keys displayed

### Accessing Benefits
```typescript
// Generate customer portal link
const session = await polar.customerSessions.create({
  external_customer_id: userId
});

// Customer sees:
// - Active subscriptions
// - Granted benefits
// - Download links
// - License keys
// - Instructions
```

## Implementation Patterns

### License Key Validation
```typescript
// In your application
async function validateLicense(key) {
  try {
    const result = await polar.licenses.validate({
      key: key,
      organization_id: process.env.POLAR_ORG_ID
    });

    if (!result.valid) {
      return { valid: false, reason: 'Invalid license' };
    }

    if (result.limit_usage && result.usage >= result.limit_usage) {
      return { valid: false, reason: 'Usage limit exceeded' };
    }

    return { valid: true, customer: result.customer };
  } catch (error) {
    console.error('License validation failed:', error);
    return { valid: false, reason: 'Validation error' };
  }
}
```

### GitHub Access Check
```typescript
// Listen to benefit grant webhook
app.post('/webhook/polar', async (req, res) => {
  const event = validateEvent(req.body, req.headers, secret);

  if (event.type === 'benefit_grant.created') {
    const grant = event.data;

    if (grant.benefit.type === 'github_repository') {
      // Update user's GitHub access in your system
      await updateGitHubAccess(grant.customer.external_id, true);
    }
  }

  res.json({ received: true });
});
```

### Discord Role Sync
```typescript
// Monitor benefit grants
if (event.type === 'benefit_grant.created') {
  const grant = event.data;

  if (grant.benefit.type === 'discord') {
    // Notify user to connect Discord
    await sendDiscordInvite(grant.customer.email);
  }
}

if (event.type === 'benefit_grant.revoked') {
  const grant = event.data;

  if (grant.benefit.type === 'discord') {
    // Roles removed automatically by Polar
    await notifyRoleRemoval(grant.customer.external_id);
  }
}
```

## Best Practices

1. **Benefit Selection:**
   - Choose appropriate benefit types
   - Consider automation capabilities
   - Plan for revocation scenarios

2. **License Keys:**
   - Set appropriate activation limits
   - Monitor usage patterns
   - Provide clear validation errors
   - Allow customers to manage activations

3. **GitHub Access:**
   - Set minimum required permissions
   - Use separate repos for different tiers
   - Monitor repository access
   - Communicate access removal

4. **Discord Roles:**
   - Clear role hierarchy
   - Meaningful role names
   - Separate roles per product tier
   - Welcome messages for new members

5. **Files:**
   - Organize files clearly
   - Provide README/instructions
   - Keep files updated
   - Version control important files

6. **Credits:**
   - Clear credit value communication
   - Usage tracking and display
   - Alerts near depletion
   - Easy credit top-up

7. **Custom Benefits:**
   - Clear, actionable instructions
   - Provide contact information
   - Set expectations for timing
   - Track manual fulfillment

8. **Customer Communication:**
   - Welcome email with benefit access info
   - Instructions for each benefit type
   - Support contact for issues
   - Revocation warnings before cancellation
