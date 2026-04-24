# SePay API Reference

Base URL: `https://my.sepay.vn/userapi/`
Rate Limit: 2 calls/second

## Transaction API

### List Transactions
```
GET /userapi/transactions/list
```

**Parameters:**
- `account_number` (string) - Bank account ID
- `transaction_date_min/max` (yyyy-mm-dd) - Date range
- `since_id` (integer) - Start from ID
- `limit` (integer) - Max 5000 per request
- `reference_number` (string) - Transaction reference
- `amount_in` (number) - Incoming amount
- `amount_out` (number) - Outgoing amount

**Response:**
```json
{
  "status": 200,
  "transactions": [{
    "id": 92704,
    "gateway": "Vietcombank",
    "transaction_date": "2023-03-25 14:02:37",
    "account_number": "0123499999",
    "content": "payment content",
    "transfer_type": "in",
    "transfer_amount": 2277000,
    "accumulated": 19077000,
    "reference_number": "MBVCB.3278907687",
    "bank_account_id": 123
  }]
}
```

### Transaction Details
```
GET /userapi/transactions/details/{transaction_id}
```

### Count Transactions
```
GET /userapi/transactions/count
```

## Bank Account API

### List Bank Accounts
```
GET /userapi/bankaccounts/list
```

**Parameters:**
- `short_name` - Bank identifier
- `last_transaction_date_min/max` - Date range
- `since_id` - Starting account ID
- `limit` - Results per page (default 100)
- `accumulated_min/max` - Balance range

**Response:**
```json
{
  "id": 123,
  "account_holder_name": "NGUYEN VAN A",
  "account_number": "0123456789",
  "accumulated": 50000000,
  "last_transaction": "2025-01-13 10:30:00",
  "bank_short_name": "VCB",
  "active": 1
}
```

### Account Details
```
GET /userapi/bankaccounts/details/{bank_account_id}
```

### Count Accounts
```
GET /userapi/bankaccounts/count
```

## Order-Based Virtual Account API

**Concept:** Each order gets unique VA with exact amount matching for automated confirmation.

**Flow:**
1. Create order → API generates unique VA
2. Display VA + QR to customer
3. Customer transfers to VA
4. Bank notifies SePay on success
5. SePay triggers webhook
6. Update order status

**Advantages:**
- Precision: VA accepts only exact amounts
- Independence: Each order has own VA (no content parsing)
- Security: VAs auto-cancel after success/expiration
- Integration: RESTful API

**Supported Banks:** BIDV and others (check docs for full list)

## Error Handling

**HTTP Status Codes:**
- 200 OK - Successful
- 201 Created - Resource created
- 400 Bad Request - Invalid parameters
- 401 Unauthorized - Invalid/missing auth
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Server error
- 503 Service Unavailable - Temporarily unavailable

**Rate Limit Response:**
```json
{
  "status": 429,
  "error": "rate_limit_exceeded",
  "message": "Too many requests"
}
```

Check `x-sepay-userapi-retry-after` header for retry timing.

## Best Practices

1. **Pagination:** Use `limit` and `since_id` for large datasets
2. **Date Ranges:** Query specific periods to reduce response size
3. **Rate Limiting:** Implement exponential backoff
4. **Error Handling:** Log all errors with context
5. **Caching:** Cache bank account lists
6. **Monitoring:** Track API response times and error rates
7. **Reconciliation:** Regular transaction matching
