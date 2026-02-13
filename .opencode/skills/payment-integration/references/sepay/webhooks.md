# SePay Webhooks

Real-time payment notifications from SePay to your server.

## Setup

1. Access WebHooks menu in dashboard
2. Click "+ Add webhooks"
3. Configure:
   - **Name:** Descriptive identifier
   - **Event Selection:** `All`, `In_only`, `Out_only`
   - **Conditions:** Bank accounts, VA filtering, payment code requirements
   - **Webhook URL:** Your callback endpoint (must be publicly accessible)
   - **Is Verify Payment:** Flag for validation
   - **Authentication:** `No_Authen`, `OAuth2.0`, or `Api_Key`
4. Click "Add" to finalize

## Payload Structure

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2023-03-25 14:02:37",
  "accountNumber": "0123499999",
  "code": null,
  "content": "payment content",
  "transferType": "in",
  "transferAmount": 2277000,
  "accumulated": 19077000,
  "subAccount": null,
  "referenceCode": "MBVCB.3278907687"
}
```

**Fields:**
- `id` - Unique transaction ID (use for deduplication)
- `gateway` - Bank name
- `transactionDate` - Transaction timestamp
- `accountNumber` - Bank account number
- `code` - Payment code (if available)
- `content` - Transfer description/content
- `transferType` - "in" (incoming) or "out" (outgoing)
- `transferAmount` - Transaction amount
- `accumulated` - Account balance after transaction
- `subAccount` - Sub-account identifier
- `referenceCode` - Bank transaction reference

## Authentication

**API Key:**
```
Authorization: Apikey YOUR_KEY
Content-Type: application/json
```

**OAuth 2.0:**
Provide token endpoint, client ID, and client secret in dashboard.

**No Authentication:**
Available but not recommended for production. Consider IP whitelisting.

## Response Requirements

**Success Response:**
```json
HTTP/1.1 200 OK
{
  "success": true
}
```

**Accepted:** Any 2xx status code (200-201)
**Timeout:** Respond within 5 seconds

## Auto-Retry Mechanism

**Policy:**
- Retries up to 7 times over ~5 hours
- Fibonacci sequence intervals (1, 1, 2, 3, 5, 8, 13... minutes)

**Duplicate Prevention:**
```javascript
// Primary: Use transaction ID
const exists = await db.transactions.findOne({ sepay_id: data.id });
if (exists) return { success: true };

// Alternative: Composite key
const key = `${data.referenceCode}-${data.transferType}-${data.transferAmount}`;
```

## Implementation Examples

### Node.js/Express
```javascript
app.post('/webhook/sepay', async (req, res) => {
  const transaction = req.body;

  // Check duplicates
  if (await isDuplicate(transaction.id)) {
    return res.json({ success: true });
  }

  // Process transaction
  if (transaction.transferType === 'in') {
    await processPayment({
      amount: transaction.transferAmount,
      content: transaction.content,
      referenceCode: transaction.referenceCode
    });
  }

  // Save to database
  await db.transactions.insert(transaction);

  res.json({ success: true });
});
```

### PHP
```php
<?php
$data = json_decode(file_get_contents('php://input'), true);

// Check duplicates
$exists = $db->query("SELECT id FROM transactions WHERE sepay_id = ?", [$data['id']]);
if ($exists) {
    echo json_encode(['success' => true]);
    exit;
}

// Process payment
if ($data['transferType'] == 'in') {
    processPayment($data['transferAmount'], $data['content']);
}

// Save to database
$db->insert('transactions', [
    'sepay_id' => $data['id'],
    'amount' => $data['transferAmount'],
    'content' => $data['content'],
    'reference_code' => $data['referenceCode']
]);

header('Content-Type: application/json');
echo json_encode(['success' => true]);
```

## Security Best Practices

1. **IP Whitelisting:** Restrict endpoint to SePay IPs
2. **API Key Verification:** Validate authorization header
3. **HTTPS Only:** Use SSL/TLS
4. **Duplicate Detection:** Prevent double processing
5. **Logging:** Maintain webhook logs
6. **Timeout Handling:** Respond quickly (<5s)
7. **Idempotency:** Same webhook multiple times = same result

## Monitoring

**Dashboard Features:**
- View webhook attempts
- Check response status
- Review retry history
- Manual retry option

**Application Monitoring:**
- Log all webhook receipts
- Track processing time
- Alert on failures
- Monitor duplicate rate

## OAuth2 Webhook Management API

**Available Scopes:** `webhook:read`, `webhook:write`, `webhook:delete`

**List Webhooks:**
```
GET /api/v1/webhooks
```

**Get Details:**
```
GET /api/v1/webhooks/{id}
```

**Create:**
```
POST /api/v1/webhooks
{
  "bank_account_id": 123,
  "name": "My Webhook",
  "event_type": "All",
  "authen_type": "Api_Key",
  "webhook_url": "https://example.com/webhook",
  "is_verify_payment": true
}
```

**Update:**
```
PATCH /api/v1/webhooks/{id}
```

**Delete:**
```
DELETE /api/v1/webhooks/{id}
```
