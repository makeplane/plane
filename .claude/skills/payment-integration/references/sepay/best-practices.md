# SePay Best Practices

Production-proven patterns for Vietnamese bank transfer payments via SePay/VietQR, covering transaction parsing, webhook handling, order matching, currency conversion, and error handling.

## Environment Configuration

### Required Environment Variables
```bash
# Core API
SEPAY_API_TOKEN=xxx              # Bearer token for SePay API
SEPAY_WEBHOOK_API_KEY=xxx        # API key for webhook authentication
SEPAY_API_URL=https://my.sepay.vn/userapi  # Base URL (optional)

# Bank Account Details
SEPAY_ACCOUNT_NUMBER=0123456789  # Bank account for transfers
SEPAY_ACCOUNT_NAME=COMPANY_NAME  # Account holder name
SEPAY_BANK_NAME=Vietcombank      # Bank name (VietQR recognized)
```

### Product Pricing in VND
```typescript
// lib/sepay.ts
const VND_PRICES = {
  engineer_kit: 2450000,   // ~$100 USD
  marketing_kit: 2450000,  // ~$100 USD
  combo: 3650000,          // ~$149 USD
} as const;

const USD_TO_VND_RATE = 24500; // 1 USD ≈ 24,500 VND
```

## Transaction Content Format

### Standard Format
```
CLAUDEKIT {order-uuid}
```
Example: `CLAUDEKIT 4e4635f4-0478-4080-a5c5-48da91f97f1e`

### Team Checkout Format
```
TEAM{8-hex-chars}
```
Example: `TEAM4E4635F4`

### Why These Formats
- UUID ensures global uniqueness
- `CLAUDEKIT` prefix for easy visual identification
- Short team prefix fits bank memo limits
- Case-insensitive matching handles bank transformations

## QR Code Generation

### VietQR URL Pattern
```typescript
// lib/sepay.ts
export function generateVietQRUrl(
  accountNumber: string,
  bankName: string,
  amount: number,
  content: string
): string {
  const params = new URLSearchParams({
    acc: accountNumber,
    bank: bankName,
    amount: String(Math.floor(amount)), // Integer only
    des: content,
  });

  return `https://qr.sepay.vn/img?${params.toString()}`;
}
```

### Usage Example
```typescript
const qrUrl = generateVietQRUrl(
  process.env.SEPAY_ACCOUNT_NUMBER!,
  process.env.SEPAY_BANK_NAME!,
  2450000,
  `CLAUDEKIT ${orderId}`
);
// Returns: https://qr.sepay.vn/img?acc=0123456789&bank=Vietcombank&amount=2450000&des=CLAUDEKIT+uuid
```

## Checkout API Implementation

### Standard SePay Checkout
```typescript
// app/api/checkout/sepay/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  productType: z.enum(['engineer_kit', 'marketing_kit', 'combo']),
  githubUsername: z.string().min(1),
  couponCode: z.string().optional(),
  vatInvoiceRequested: z.boolean().optional(),
  taxId: z.string().regex(/^\d{10}$|^\d{13}$/).optional(), // 10 or 13 digits
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // 1. Normalize email
    const normalizedEmail = data.email.toLowerCase().trim();

    // 2. Get base price
    const originalAmount = VND_PRICES[data.productType];
    let finalAmount = originalAmount;
    let discountMetadata: Record<string, any> = { originalAmount };

    // 3. CRITICAL: Apply discounts in correct order
    // Step A: Apply coupon FIRST
    if (data.couponCode) {
      const couponResult = await validateCouponForVND(data.couponCode, originalAmount);
      if (couponResult.valid) {
        finalAmount = originalAmount - couponResult.discountAmountVND;
        discountMetadata.couponCode = data.couponCode;
        discountMetadata.couponDiscountAmount = couponResult.discountAmountVND;
        discountMetadata.couponId = couponResult.couponId;
      }
    }

    // Step B: Apply referral SECOND (on post-coupon amount)
    const referralCode = getReferralCodeFromCookie(request);
    if (referralCode) {
      const referralResult = await calculateReferralDiscountVND(
        referralCode,
        finalAmount, // Post-coupon amount
        normalizedEmail
      );
      if (referralResult.valid && referralResult.discountAmount > 0) {
        // Validate calculation
        if (referralResult.discountAmount <= 0) {
          return NextResponse.json(
            { error: 'Invalid discount calculation' },
            { status: 400 }
          );
        }
        finalAmount -= referralResult.discountAmount;
        discountMetadata.referralCode = referralCode;
        discountMetadata.referralDiscountAmount = referralResult.discountAmount;
        discountMetadata.referrerId = referralResult.referrerId;
      }
    }

    // 4. Validate final amount
    if (finalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid final amount' },
        { status: 400 }
      );
    }

    // 5. Encrypt sensitive data if VAT invoice requested
    let encryptedTaxId: string | null = null;
    if (data.vatInvoiceRequested && data.taxId) {
      encryptedTaxId = await encrypt(data.taxId);
    }

    // 6. Create order record
    const orderId = crypto.randomUUID();
    const transactionContent = `CLAUDEKIT ${orderId}`;

    const order = await db.insert(orders).values({
      id: orderId,
      email: normalizedEmail,
      productType: data.productType,
      amount: finalAmount,
      currency: 'VND',
      status: 'pending',
      paymentProvider: 'sepay',
      paymentId: transactionContent, // Used for matching
      referredBy: discountMetadata.referrerId,
      discountAmount: originalAmount - finalAmount,
      metadata: JSON.stringify({
        ...discountMetadata,
        githubUsername: data.githubUsername,
        vatInvoiceRequested: data.vatInvoiceRequested,
        encryptedTaxId,
      }),
    }).returning();

    // 7. Generate payment instructions
    const qrCode = generateVietQRUrl(
      process.env.SEPAY_ACCOUNT_NUMBER!,
      process.env.SEPAY_BANK_NAME!,
      finalAmount,
      transactionContent
    );

    return NextResponse.json({
      orderId: order[0].id,
      paymentMethod: 'bank_transfer',
      payment: {
        bankName: process.env.SEPAY_BANK_NAME,
        accountNumber: process.env.SEPAY_ACCOUNT_NUMBER,
        accountName: process.env.SEPAY_ACCOUNT_NAME,
        amount: finalAmount,
        currency: 'VND',
        content: transactionContent,
        qrCode,
        instructions: [
          'Open your banking app',
          'Scan the QR code or transfer manually',
          'Use the exact transfer content shown',
          'Payment will be confirmed automatically',
        ],
      },
      statusCheckUrl: `/api/orders/${order[0].id}/status`,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('SePay checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
```

## Webhook Handling

### Webhook Authentication (Timing-Safe)
```typescript
// app/api/webhooks/sepay/route.ts
import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

function verifyWebhookAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY!;

  // Support both "Bearer" and "Apikey" formats
  let providedKey: string;
  if (authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7);
  } else if (authHeader.startsWith('Apikey ')) {
    providedKey = authHeader.slice(7);
  } else {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const expected = Buffer.from(expectedKey);
    const provided = Buffer.from(providedKey);
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // 1. Verify authentication
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();

  // 2. Extract event ID for idempotency
  const eventId = String(payload.id || payload.transaction_id || Date.now());

  // 3. Check for duplicate
  const existingEvent = await db.select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .limit(1);

  if (existingEvent.length > 0) {
    console.log(`Duplicate SePay webhook ignored: ${eventId}`);
    return NextResponse.json({ success: true });
  }

  // 4. Record event BEFORE processing (idempotency)
  await db.insert(webhookEvents).values({
    id: crypto.randomUUID(),
    provider: 'sepay',
    eventType: 'transaction',
    eventId,
    payload: JSON.stringify(payload),
    processed: false,
  });

  try {
    await processTransaction(payload);

    await db.update(webhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(webhookEvents.eventId, eventId));

  } catch (error) {
    // Log error but return 200 to prevent retry loop
    await db.update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(webhookEvents.eventId, eventId));
  }

  // Always return 200 to prevent SePay retries
  return NextResponse.json({ success: true });
}
```

### Webhook Payload Structure
```typescript
interface SepayWebhookPayload {
  id: number;                    // Transaction ID (unique key)
  gateway: string;               // Bank name (e.g., "Vietcombank")
  transactionDate: string;       // "2025-01-07 10:30:00"
  accountNumber: string;         // Account number
  code?: string;                 // Optional payment code
  content: string;               // Transaction memo - CRITICAL for matching
  transferType: 'in' | 'out';    // Only process 'in'
  transferAmount: number;        // Amount in VND
  accumulated: number;           // Balance after transaction
  subAccount?: string;
  referenceCode?: string;
  description?: string;
}
```

## Order Matching Strategy

### Multi-Strategy Fallback Chain
```typescript
// lib/sepay.ts
export async function findOrderByTransaction(
  payload: SepayWebhookPayload
): Promise<{ order: Order | null; matchMethod: string }> {
  const { content, transferAmount, transactionDate } = payload;

  // Strategy 1: Parse Order ID from content (preferred)
  const parsedOrderId = parseOrderIdFromContent(content);
  if (parsedOrderId) {
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, parsedOrderId))
      .limit(1);

    if (order[0]) {
      return { order: order[0], matchMethod: 'content-parse' };
    }
  }

  // Strategy 2: Team payment ID match
  const teamMatch = content.match(/TEAM([A-F0-9]{8})/i);
  if (teamMatch) {
    const teamPaymentId = `TEAM${teamMatch[1].toUpperCase()}`;
    const order = await db.select()
      .from(orders)
      .where(eq(orders.paymentId, teamPaymentId))
      .limit(1);

    if (order[0]) {
      return { order: order[0], matchMethod: 'team-payment-id' };
    }
  }

  // Strategy 3: Amount + timestamp window (±30 minutes)
  const transactionTime = new Date(transactionDate);
  const windowStart = new Date(transactionTime.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(transactionTime.getTime() + 30 * 60 * 1000);

  const windowMatches = await db.select()
    .from(orders)
    .where(and(
      eq(orders.status, 'pending'),
      eq(orders.paymentProvider, 'sepay'),
      eq(orders.amount, transferAmount),
      gte(orders.createdAt, windowStart),
      lte(orders.createdAt, windowEnd)
    ))
    .limit(10);

  if (windowMatches.length === 1) {
    return { order: windowMatches[0], matchMethod: 'timestamp-window' };
  }

  if (windowMatches.length > 1) {
    // Multiple matches - select closest by creation time
    const closest = windowMatches.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.createdAt.getTime() - transactionTime.getTime());
      const currDiff = Math.abs(curr.createdAt.getTime() - transactionTime.getTime());
      return currDiff < prevDiff ? curr : prev;
    });
    return { order: closest, matchMethod: 'timestamp-window-closest' };
  }

  // Strategy 4: Amount only (last resort - single match only)
  const amountMatches = await db.select()
    .from(orders)
    .where(and(
      eq(orders.status, 'pending'),
      eq(orders.paymentProvider, 'sepay'),
      eq(orders.amount, transferAmount)
    ))
    .limit(2);

  if (amountMatches.length === 1) {
    console.warn(`⚠️ Amount-only match for ${transferAmount} VND - verify manually`);
    return { order: amountMatches[0], matchMethod: 'amount-only' };
  }

  // No match found
  console.error(`❌ Could not match order:
    Content: "${content}"
    Amount: ${transferAmount} VND
    Transaction Date: ${transactionDate}`);

  return { order: null, matchMethod: 'none' };
}
```

### UUID Parsing with Bank Transformations
```typescript
// lib/sepay.ts
export function parseOrderIdFromContent(content: string): string | null {
  if (!content) return null;

  // Pattern 1: Standard "CLAUDEKIT {uuid}"
  const claudekitMatch = content.match(/CLAUDEKIT\s+([\w-]+)/i);
  if (claudekitMatch) {
    return normalizeUUID(claudekitMatch[1]);
  }

  // Pattern 2: UUID anywhere in content (banks may strip/transform content)
  // Match 8-4-4-4-12 hex with optional dashes
  const uuidMatch = content.match(
    /([0-9A-F]{8}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{12})/i
  );
  if (uuidMatch) {
    return normalizeUUID(uuidMatch[1]);
  }

  return null;
}

function normalizeUUID(input: string): string | null {
  // Remove dashes and validate
  const cleaned = input.replace(/-/g, '');

  if (cleaned.length !== 32) return null;
  if (!/^[0-9a-f]+$/i.test(cleaned)) return null;

  // Re-format to standard UUID format
  return [
    cleaned.slice(0, 8),
    cleaned.slice(8, 12),
    cleaned.slice(12, 16),
    cleaned.slice(16, 20),
    cleaned.slice(20),
  ].join('-').toLowerCase();
}
```

### Handled Content Formats
```
CLAUDEKIT 4e4635f4-0478-4080-a5c5-48da91f97f1e     ✅ Standard
CLAUDEKIT 4e4635f404784080a5c548da91f97f1e         ✅ Bank stripped dashes
CLAUDEKIT4e4635f404784080a5c548da91f97f1e          ✅ No space
4e4635f404784080a5c548da91f97f1e-CLAUDEKIT         ✅ Reversed
claudekit 4e4635f4-0478-4080-a5c5-48da91f97f1e    ✅ Lowercase
BankAPINotify 4e4635f404784080a5c548da91f97f1e... ✅ Extra prefix
4e4635f404784080a5c548da91f97f1e                   ✅ UUID only
```

## Transaction Processing

### Complete Processing Flow
```typescript
async function processTransaction(payload: SepayWebhookPayload) {
  // 1. Only process incoming transfers
  if (payload.transferType !== 'in') {
    console.log('Skipping outbound transfer');
    return;
  }

  // 2. Find matching order
  const { order, matchMethod } = await findOrderByTransaction(payload);
  if (!order) {
    console.error('No matching order found');
    return;
  }

  // 3. Verify amount (allow overpayment)
  if (payload.transferAmount < order.amount) {
    console.error(`Underpayment: expected ${order.amount}, got ${payload.transferAmount}`);
    return;
  }
  if (payload.transferAmount > order.amount) {
    console.log(`Overpayment accepted: expected ${order.amount}, got ${payload.transferAmount}`);
  }

  // 4. Update order with transaction details
  const existingMetadata = order.metadata ? JSON.parse(order.metadata) : {};
  await db.update(orders)
    .set({
      status: 'completed',
      paymentId: String(payload.id),
      metadata: JSON.stringify({
        ...existingMetadata, // Preserve discount info
        gateway: payload.gateway,
        transactionDate: payload.transactionDate,
        accountNumber: payload.accountNumber,
        transferAmount: payload.transferAmount,
        content: payload.content,
        matchMethod,
        transactionId: payload.id,
      }),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  // 5. Create license (non-blocking)
  try {
    await createLicense(order);
  } catch (error) {
    console.error('Failed to create license:', error);
  }

  // 6. Send confirmation email (non-blocking)
  try {
    await sendOrderConfirmation(order, payload);
  } catch (error) {
    console.error('Failed to send confirmation:', error);
  }

  // 7. Create referral commission (non-blocking)
  if (order.referredBy) {
    try {
      // Commission based on actual paid amount
      await createCommission({
        orderId: order.id,
        referrerId: order.referredBy,
        baseAmount: payload.transferAmount, // Actual paid amount
        currency: 'VND',
      });
    } catch (error) {
      console.error('Failed to create commission:', error);
    }
  }

  // 8. Update referrer tier (non-blocking)
  if (order.referredBy) {
    try {
      const usdConversion = await convertVndToUsd(payload.transferAmount);
      await updateReferrerTier(order.referredBy, usdConversion.usdCents, order.id);
    } catch (error) {
      console.error('Failed to update tier:', error);
    }
  }

  // 9. Grant GitHub access (non-blocking)
  try {
    const metadata = JSON.parse(order.metadata || '{}');
    await inviteToGitHub(metadata.githubUsername, order.productType);
  } catch (error) {
    console.error('Failed to invite to GitHub:', error);
  }

  // 10. Sync Polar discount redemption (non-blocking)
  const metadata = JSON.parse(order.metadata || '{}');
  if (metadata.couponId && metadata.couponCode) {
    try {
      await syncPolarDiscountWithRetry(order.id, metadata.couponId, metadata.couponCode);
    } catch (error) {
      console.error('Failed to sync Polar discount:', error);
      await sendDiscordAlert('Polar discount sync failed', { orderId: order.id });
    }
  }

  // 11. Send sales notification (non-blocking)
  try {
    await sendSalesNotification({
      ...order,
      gateway: payload.gateway,
      transactionId: payload.id,
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}
```

## Currency Conversion

### VND to USD with Multi-Layer Fallback
```typescript
// lib/currency.ts
const EXCHANGE_RATE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FALLBACK_VND_TO_USD = 24500; // Conservative fallback

let exchangeRateCache: {
  rate: number;
  timestamp: number;
  source: 'api' | 'cached' | 'expired' | 'fallback';
} | null = null;

export async function convertVndToUsd(vndAmount: number): Promise<{
  usdCents: number;
  rate: number;
  source: string;
}> {
  const now = Date.now();

  // Layer 1: Fresh cache
  if (exchangeRateCache && now - exchangeRateCache.timestamp < EXCHANGE_RATE_CACHE_TTL) {
    const usdCents = Math.round((vndAmount / exchangeRateCache.rate) * 100);
    return { usdCents, rate: exchangeRateCache.rate, source: 'cached' };
  }

  // Layer 2: Try live API
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await response.json();
    const rate = data.rates.VND;

    exchangeRateCache = { rate, timestamp: now, source: 'api' };
    const usdCents = Math.round((vndAmount / rate) * 100);
    return { usdCents, rate, source: 'api' };

  } catch (error) {
    console.warn('Exchange rate API failed:', error);

    // Layer 3: Expired cache (better than nothing)
    if (exchangeRateCache) {
      const usdCents = Math.round((vndAmount / exchangeRateCache.rate) * 100);
      return { usdCents, rate: exchangeRateCache.rate, source: 'expired_cache' };
    }

    // Layer 4: Hardcoded fallback
    const usdCents = Math.round((vndAmount / FALLBACK_VND_TO_USD) * 100);
    return { usdCents, rate: FALLBACK_VND_TO_USD, source: 'fallback' };
  }
}
```

### USD Discount to VND
```typescript
// When Polar discount is in USD, convert to VND for SePay checkout
export function convertUsdDiscountToVnd(
  discount: { type: 'fixed' | 'percentage'; amount?: number; basisPoints?: number },
  amountVND: number
): number {
  if (discount.type === 'percentage') {
    // Basis points: 1000 = 10%, 10000 = 100%
    const percentage = (discount.basisPoints || 0) / 10000;
    return Math.round(amountVND * percentage);
  } else {
    // Fixed amount in USD cents → VND
    const usdDollars = (discount.amount || 0) / 100;
    return Math.round(usdDollars * 24500); // Use conservative rate
  }
}
```

## Invoice Email Template

### HTML Invoice Generation
```typescript
// lib/emails/sepay-invoice.ts
export function generateSepayInvoice(order: Order, transaction: TransactionInfo): string {
  const metadata = JSON.parse(order.metadata || '{}');
  const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${order.id.slice(-8).toUpperCase()}`;

  // Format VND with Vietnamese locale
  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char] || char);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .invoice { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #ff6b6b, #feca57); padding: 20px; }
        .status { background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; }
        .amount { font-size: 24px; font-weight: bold; }
        .savings { color: #10b981; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <h1>Invoice</h1>
          <span class="status">PAID</span>
        </div>

        <table>
          <tr><td>Invoice #:</td><td>${invoiceNumber}</td></tr>
          <tr><td>Customer:</td><td>${escapeHtml(metadata.name || order.email)}</td></tr>
          <tr><td>Email:</td><td>${escapeHtml(order.email)}</td></tr>
          <tr><td>Payment Date:</td><td>${format(new Date(transaction.transactionDate), 'dd/MM/yyyy HH:mm')}</td></tr>
          <tr><td>Transaction Ref:</td><td>${transaction.transactionId || 'N/A'}</td></tr>
        </table>

        <h3>Order Details</h3>
        <table>
          <tr><td>Product:</td><td>${getProductName(order.productType)}</td></tr>
          <tr><td>Original Price:</td><td>${formatVND(metadata.originalAmount || order.amount)}</td></tr>
          ${metadata.couponDiscountAmount ? `
            <tr><td>Coupon (${metadata.couponCode}):</td><td>-${formatVND(metadata.couponDiscountAmount)}</td></tr>
          ` : ''}
          ${metadata.referralDiscountAmount ? `
            <tr><td>Referral Discount (20%):</td><td>-${formatVND(metadata.referralDiscountAmount)}</td></tr>
          ` : ''}
          ${order.discountAmount > 0 ? `
            <tr class="savings"><td>Total Savings:</td><td>-${formatVND(order.discountAmount)}</td></tr>
          ` : ''}
          <tr class="amount"><td>Total Paid:</td><td>${formatVND(order.amount)}</td></tr>
        </table>

        <p>Thank you for your purchase!</p>
        <p>Support: support@claudekit.com</p>
      </div>
    </body>
    </html>
  `;
}
```

## Error Handling Patterns

### Always Return 200 to SePay
```typescript
// Webhook must always return 200 to prevent retry loop
export async function POST(request: Request) {
  try {
    // ... processing
  } catch (error) {
    // Log error but don't fail
    console.error('Webhook processing error:', error);
    await logWebhookError(error);
  }

  // ALWAYS return 200
  return NextResponse.json({ success: true });
}
```

### Non-Blocking Post-Payment Operations
```typescript
// Wrap each operation in try-catch
const operations = [
  { name: 'License', fn: () => createLicense(order) },
  { name: 'Email', fn: () => sendOrderConfirmation(order) },
  { name: 'Commission', fn: () => createCommission(order) },
  { name: 'GitHub', fn: () => inviteToGitHub(username, productType) },
  { name: 'Discord', fn: () => sendSalesNotification(order) },
];

for (const op of operations) {
  try {
    await op.fn();
    console.log(`✅ ${op.name} completed`);
  } catch (error) {
    console.error(`❌ ${op.name} failed:`, error);
    // Continue - don't block other operations
  }
}
```

### Amount Validation
```typescript
// Reject underpayment, accept overpayment
if (transferAmount < order.amount) {
  console.error(`Underpayment: expected ${order.amount}, received ${transferAmount}`);
  await flagOrderForReview(order.id, 'underpayment');
  return; // Don't process
}

if (transferAmount > order.amount) {
  console.log(`Overpayment: expected ${order.amount}, received ${transferAmount}`);
  // Continue processing - customer paid more than required
}
```

## Testing Patterns

### Unit Tests for UUID Parsing
```typescript
// __tests__/lib/sepay.test.ts
describe('parseOrderIdFromContent', () => {
  it('parses standard format', () => {
    expect(parseOrderIdFromContent('CLAUDEKIT 4e4635f4-0478-4080-a5c5-48da91f97f1e'))
      .toBe('4e4635f4-0478-4080-a5c5-48da91f97f1e');
  });

  it('handles bank dash-stripping', () => {
    expect(parseOrderIdFromContent('CLAUDEKIT 4e4635f404784080a5c548da91f97f1e'))
      .toBe('4e4635f4-0478-4080-a5c5-48da91f97f1e');
  });

  it('handles real-world Vietnamese bank memo', () => {
    expect(parseOrderIdFromContent('BankAPINotify 4e4635f404784080a5c548da91f97f1e-CHUYEN TIEN'))
      .toBe('4e4635f4-0478-4080-a5c5-48da91f97f1e');
  });

  it('returns null for invalid content', () => {
    expect(parseOrderIdFromContent('CLAUDEKIT')).toBeNull();
    expect(parseOrderIdFromContent('4e4635f4-0478')).toBeNull();
    expect(parseOrderIdFromContent('104588021672-CLAUDEKIT')).toBeNull();
  });
});
```

### Webhook Integration Test Script
```bash
#!/bin/bash
# scripts/test-sepay-webhook.sh

BASE_URL="http://localhost:3000/api/webhooks/sepay"
API_KEY="your-test-key"

# Test 1: Valid Bearer token
echo "Test 1: Bearer token auth"
curl -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":12345,"content":"CLAUDEKIT test-uuid","transferAmount":2450000,"transferType":"in"}'

# Test 2: Valid Apikey format
echo "Test 2: Apikey auth"
curl -X POST "$BASE_URL" \
  -H "Authorization: Apikey $API_KEY" \
  -d '{"id":12346,"content":"CLAUDEKIT test-uuid","transferAmount":2450000,"transferType":"in"}'

# Test 3: Missing auth (should return 401)
echo "Test 3: No auth (expect 401)"
curl -X POST "$BASE_URL" \
  -d '{"id":12347,"content":"test","transferAmount":100000,"transferType":"in"}'

# Test 4: Invalid key (should return 401)
echo "Test 4: Invalid key (expect 401)"
curl -X POST "$BASE_URL" \
  -H "Authorization: Bearer wrong-key" \
  -d '{"id":12348,"content":"test","transferAmount":100000,"transferType":"in"}'
```

## Database Schema

### Orders Table Extensions for SePay
```typescript
// Fields used specifically for SePay
{
  paymentId: text('payment_id'),      // Transaction content or TEAM{8} code
  paymentProvider: literal('sepay'),  // Distinguishes from Polar
  currency: literal('VND'),           // Always VND for SePay
  amount: integer('amount'),          // In VND (no decimals)
}

// Metadata JSON includes:
{
  gateway: string,           // Bank name from webhook
  transactionDate: string,   // Webhook timestamp
  transactionId: number,     // SePay transaction ID
  transferAmount: number,    // Actual received amount
  matchMethod: string,       // How order was matched
  content: string,           // Original transaction memo
  encryptedTaxId?: string,   // For VAT invoices
}
```

### Recommended Indexes
```sql
CREATE INDEX idx_orders_sepay_pending ON orders (status, payment_provider, amount)
  WHERE status = 'pending' AND payment_provider = 'sepay';

CREATE INDEX idx_orders_sepay_timestamp ON orders (created_at)
  WHERE payment_provider = 'sepay';

CREATE INDEX idx_orders_payment_id ON orders (payment_id)
  WHERE payment_provider = 'sepay';
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Bank account verified and active
- [ ] Webhook endpoint publicly accessible (HTTPS)
- [ ] Webhook API key set and verified
- [ ] Timing-safe auth comparison implemented
- [ ] Idempotency handling tested with duplicate webhooks
- [ ] UUID parsing tested with real Vietnamese bank memos
- [ ] Amount validation (underpayment rejection) tested
- [ ] Overpayment handling verified
- [ ] Currency conversion fallback chain tested
- [ ] Invoice email template tested
- [ ] Error monitoring enabled
- [ ] Structured logging in place
- [ ] Database indexes created
- [ ] Polar discount sync tested (for shared coupons)
- [ ] Team payment ID format tested
- [ ] Non-blocking operations wrapped in try-catch
- [ ] Always-200 webhook response verified

## Common Pitfalls

1. **Not handling bank dash-stripping** - Banks may remove dashes from UUIDs
2. **Rejecting overpayments** - Should accept; customer paid more
3. **Blocking webhook on non-critical failures** - Wrap in try-catch, continue
4. **Not using timing-safe comparison** - Vulnerable to timing attacks
5. **Returning non-200 on error** - Causes SePay retry loops
6. **Using raw exchange rates without fallback** - API can fail
7. **Applying discounts in wrong order** - Always coupon first, then referral
8. **Not logging matchMethod** - Hard to debug failed matches
9. **Not preserving checkout metadata** - Lose discount audit trail
10. **Synchronous Polar discount sync** - Can fail; use retry with backoff
11. **Case-sensitive content matching** - Banks may uppercase/lowercase
12. **Missing amount-only match safety** - Reject ambiguous matches
