# Creem.io Licensing

Software licensing with device activation management.

## License Flow

```
purchase → license_key issued → activate device → validate → deactivate
```

## Activate License

Register a device against a license key:

```javascript
// POST /v1/licenses/activate
const activation = await creem.licenses.activate({
  license_key: 'XXXX-XXXX-XXXX-XXXX',
  instance_id: 'device_fingerprint_123',  // Unique device identifier
  instance_name: 'MacBook Pro'            // Optional friendly name
});

// Returns: {
//   id: 'act_xxx',
//   license_key: '...',
//   instance_id: '...',
//   activated_at: '...',
//   valid_until: '...'
// }
```

## Validate License

Check if license is active for specific device:

```javascript
// POST /v1/licenses/validate
const validation = await creem.licenses.validate({
  license_key: 'XXXX-XXXX-XXXX-XXXX',
  instance_id: 'device_fingerprint_123'
});

// Returns: {
//   valid: true,
//   license_key: '...',
//   product_id: 'prod_xxx',
//   customer_id: 'cus_xxx',
//   expires_at: '2025-01-15T00:00:00Z',
//   activations_used: 2,
//   activations_limit: 5
// }
```

## Deactivate License

Remove device activation to free slot:

```javascript
// POST /v1/licenses/deactivate
await creem.licenses.deactivate({
  license_key: 'XXXX-XXXX-XXXX-XXXX',
  instance_id: 'device_fingerprint_123'
});
```

## Client-Side Implementation

```javascript
// Desktop app example (Electron, Tauri, etc.)
class LicenseManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.instanceId = this.getDeviceFingerprint();
  }

  getDeviceFingerprint() {
    // Generate unique device ID (machine ID, hardware hash, etc.)
    return require('node-machine-id').machineIdSync();
  }

  async activate(licenseKey) {
    const response = await fetch('https://api.creem.io/v1/licenses/activate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_id: this.instanceId,
        instance_name: os.hostname()
      })
    });
    return response.json();
  }

  async validate(licenseKey) {
    const response = await fetch('https://api.creem.io/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_id: this.instanceId
      })
    });
    const data = await response.json();
    return data.valid;
  }
}
```

## Activation Limits

Configure per product - limits simultaneous device activations:

```javascript
const product = await creem.products.create({
  name: 'Desktop App License',
  price: 4900,
  currency: 'usd',
  license_config: {
    activations_limit: 3  // Max 3 devices per license
  }
});
```

## License Events (Webhooks)

- `license.activated` - Device activated
- `license.deactivated` - Device deactivated
- `license.expired` - License expired (subscription ended)

See `references/creem/webhooks.md` for webhook handling.
