# SePay SDK Integration

Official SDKs for Node.js, PHP, and Laravel.

## Node.js SDK (sepay-pg-node)

**Installation:**
```bash
npm install github:sepay/sepay-pg-node
```

**Requirements:** Node.js 16+

**Configuration:**
```javascript
import { SePayPgClient } from 'sepay-pg-node';

const client = new SePayPgClient({
  env: 'sandbox',  // or 'production'
  merchant_id: 'SP-TEST-XXXXXXX',
  secret_key: 'spsk_test_xxxxxxxxxxxxx',
});
```

**Create Payment:**
```javascript
const fields = client.checkout.initOneTimePaymentFields({
  operation: 'PURCHASE',
  order_invoice_number: 'DH0001',
  order_amount: 10000,
  currency: 'VND',
  success_url: 'https://example.com/success',
  error_url: 'https://example.com/error',
  cancel_url: 'https://example.com/cancel',
  order_description: 'Payment for order DH0001',
});
```

**Render Payment Form:**
```jsx
<form action={client.checkout.initCheckoutUrl()} method="POST">
  {Object.keys(fields).map(field =>
    <input type="hidden" name={field} value={fields[field]} key={field} />
  )}
  <button type="submit">Pay Now</button>
</form>
```

**API Methods:**
```javascript
// List all orders
await client.order.all({
  per_page: 50,
  q: 'search_term',
  order_status: 'completed',
  from_created_at: '2025-01-01',
  to_created_at: '2025-01-31'
});

// Get order details
await client.order.retrieve('DH0001');

// Void transaction (cards only)
await client.order.voidTransaction('DH0001');

// Cancel order (QR payments)
await client.order.cancel('DH0001');
```

**Endpoints:**
- Sandbox: `https://sandbox.pay.sepay.vn/v1/init`
- Production: `https://pay.sepay.vn/v1/init`

## PHP SDK (sepay/sepay-pg)

**Installation:**
```bash
composer require sepay/sepay-pg
```

**Requirements:** PHP 7.4+, ext-json, ext-curl, Guzzle

**Quick Start:**
```php
use SePay\SePayClient;
use SePay\Builders\CheckoutBuilder;

$sepay = new SePayClient(
    'SP-TEST-XXXXXXX',
    'spsk_live_xxxxxxxxxxxxx',
    SePayClient::ENVIRONMENT_SANDBOX
);

$checkoutData = CheckoutBuilder::make()
    ->currency('VND')
    ->orderAmount(100000)
    ->operation('PURCHASE')
    ->orderDescription('Test payment')
    ->orderInvoiceNumber('INV_001')
    ->successUrl('https://yoursite.com/success')
    ->errorUrl('https://yoursite.com/error')
    ->cancelUrl('https://yoursite.com/cancel')
    ->build();

echo $sepay->checkout()->generateFormHtml($checkoutData);
```

**Error Handling:**
```php
try {
    $order = $sepay->orders()->retrieve('INV_001');
} catch (AuthenticationException $e) {
    // Invalid credentials
} catch (ValidationException $e) {
    // Invalid request data
    $errors = $e->getErrors();
} catch (NotFoundException $e) {
    // Resource not found
} catch (RateLimitException $e) {
    // Rate limit exceeded
    $retryAfter = $e->getRetryAfter();
} catch (ServerException $e) {
    // Server error (5xx)
}
```

**Configuration:**
```php
$sepay->setConfig([
    'timeout' => 30,
    'retry_attempts' => 3,
    'retry_delay' => 1000,
    'debug' => true,
    'user_agent' => 'MyApp/1.0',
    'logger' => $psrLogger
]);
```

## Laravel Package (laravel-sepay)

**Installation:**
```bash
composer require sepayvn/laravel-sepay

# For Laravel 7-8 with PHP 7.4+
composer require "sepayvn/laravel-sepay:dev-lite"
```

**Setup:**
```bash
php artisan vendor:publish --tag="sepay-migrations"
php artisan migrate
php artisan vendor:publish --tag="sepay-config"
php artisan vendor:publish --tag="sepay-views"  # optional
```

**Configuration (.env):**
```
SEPAY_WEBHOOK_TOKEN=your_secret_key
SEPAY_MATCH_PATTERN=SE
```

**Create Event Listener:**
```bash
php artisan make:listener SePayWebhookListener
```

**Listener Implementation:**
```php
<?php

namespace App\Listeners;

use SePayWebhookEvent;

class SePayWebhookListener
{
    public function handle(SePayWebhookEvent $event)
    {
        $transaction = $event->transaction;

        if ($transaction->transfer_type === 'in') {
            // Handle incoming payment
            Order::where('code', $transaction->content)
                ->update(['status' => 'paid']);

            // Send confirmation email
            Mail::to($order->customer->email)
                ->send(new PaymentConfirmation($order));
        }
    }
}
```

**Register Listener:**
```php
// app/Providers/EventServiceProvider.php
protected $listen = [
    SePayWebhookEvent::class => [
        SePayWebhookListener::class,
    ],
];
```

## Best Practices

1. **Environment Variables:** Store credentials securely
2. **Error Handling:** Catch and log all exceptions
3. **Retry Logic:** Implement for transient failures
4. **Logging:** Log all API calls and responses
5. **Testing:** Use sandbox extensively before production
6. **Validation:** Validate data before API calls
7. **Monitoring:** Track success/failure rates
