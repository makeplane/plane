# SePay Overview

Vietnamese payment automation platform serving as intermediary between applications and banks.

## Core Capabilities

**Payment Methods:**
- VietQR - QR code bank transfers (NAPAS standard)
- NAPAS QR - National payment gateway QR
- Bank Cards - Visa/Mastercard/JCB
- Bank Transfers - Direct bank-to-bank
- Virtual Accounts - Order-specific VAs with exact matching

**Supported Banks:** 44+ banks via NAPAS, 37+ with VietQR (Vietcombank, VPBank, BIDV, etc.)

**Use Cases:**
- Payment gateway for online payments
- Bank API direct connection
- Transaction verification automation
- Real-time balance monitoring

## Authentication

### API Token (Simple)

**Create:**
1. Company Configuration → API Access → "+ Add API"
2. Provide name, set status "Active"
3. Copy token from list

**Usage:**
```
Authorization: Bearer {API_TOKEN}
Content-Type: application/json
```

**Note:** All tokens have full access (no permission levels currently)

### OAuth2 (Advanced)

**Scopes:**
- `bank-account:read` - View accounts, balances
- `transaction:read` - Transaction history
- `webhook:read/write/delete` - Webhook management
- `profile` - User information
- `company` - Company details

**Authorization Code Flow:**

1. **Authorization Request:**
```
GET https://my.sepay.vn/oauth/authorize?
  response_type=code&
  client_id={CLIENT_ID}&
  redirect_uri={REDIRECT_URI}&
  scope={SCOPES}&
  state={CSRF_TOKEN}
```

2. **Token Exchange (server-side only):**
```
POST https://my.sepay.vn/oauth/token
{
  "grant_type": "authorization_code",
  "client_id": "{CLIENT_ID}",
  "client_secret": "{CLIENT_SECRET}",
  "code": "{AUTHORIZATION_CODE}"
}
```

3. **Token Refresh:**
```
POST https://my.sepay.vn/oauth/token
{
  "grant_type": "refresh_token",
  "refresh_token": "{REFRESH_TOKEN}",
  "client_id": "{CLIENT_ID}",
  "client_secret": "{CLIENT_SECRET}"
}
```

**Security:** Access tokens expire ~1 hour, never expose client_secret, use state for CSRF protection

## Payment Gateway Flow (13 Steps)

1. Customer selects products, initiates payment
2. Merchant creates order record
3. Generate checkout form with HMAC-SHA256 signature
4. Send request to `/v1/checkout/init`
5. SePay validates signature
6. Redirect customer to SePay gateway
7. Customer selects payment method
8. SePay communicates with banks/card networks
9. Financial institution returns result
10. Callback notification sent to merchant
11. IPN (Instant Payment Notification) transmitted
12. Customer redirected to merchant result page
13. Final outcome displayed

## Environments

**Sandbox:**
- Dashboard: https://my.sepay.vn (free tier)
- Endpoint: https://sandbox.pay.sepay.vn/v1/init
- Credentials: `SP-TEST-XXXXXXX`, `spsk_test_xxxxxxxxxxxxx`

**Production:**
- Endpoint: https://pay.sepay.vn/v1/init
- Requirements: Personal/business bank account, completed testing
- Approval: 3-7 days for NAPAS QR/cards (requires documentation)

## Rate Limits

**Limit:** 2 calls/second
**Response:** HTTP 429 with `x-sepay-userapi-retry-after` header (seconds to wait)

**Handling:**
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('x-sepay-userapi-retry-after');
  await sleep(retryAfter * 1000);
  return retry();
}
```

## Support

- Email: info@sepay.vn
- Hotline: 02873059589 (24/7)
- Docs: https://developer.sepay.vn/en
- GitHub: https://github.com/sepayvn

## Next Steps

- **For API integration:** Load `api.md`
- **For SDK integration:** Load `sdk.md`
- **For webhook setup:** Load `webhooks.md`
- **For QR generation:** Load `qr-codes.md`
