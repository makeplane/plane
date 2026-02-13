# Multi-Provider Order Management Patterns

Production patterns for managing orders across multiple payment providers (Polar + SePay), currency handling, commission systems, and revenue tracking.

## Order Schema Design

### Unified Orders Table
```typescript
// db/schema/orders.ts
import { pgTable, uuid, text, integer, numeric, timestamp, boolean } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  email: text('email').notNull(),

  // Product info
  productType: text('product_type').notNull(), // 'engineer_kit', 'marketing_kit', 'combo', 'team_*'
  quantity: integer('quantity').default(1),

  // Pricing (stored in provider's currency)
  amount: integer('amount').notNull(),           // Final amount after discounts
  originalAmount: integer('original_amount'),    // Before any discounts
  currency: text('currency').default('USD'),     // 'USD' or 'VND'

  // Status
  status: text('status').default('pending'),     // pending, completed, failed, refunded

  // Provider info
  paymentProvider: text('payment_provider').notNull(), // 'polar' or 'sepay'
  paymentId: text('payment_id'),                 // External payment/transaction ID

  // Referral tracking
  referredBy: uuid('referred_by').references(() => users.id),
  discountAmount: integer('discount_amount').default(0),
  discountRate: numeric('discount_rate', { precision: 5, scale: 2 }),

  // Audit trail (JSON)
  metadata: text('metadata'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Provider-Specific Metadata
```typescript
// Polar order metadata
interface PolarOrderMetadata {
  originalAmount: number;
  couponCode?: string;
  couponDiscountAmount?: number;
  referralCode?: string;
  referralDiscountAmount?: number;
  referrerId?: string;
  githubUsername: string;
  polarDiscountId?: string;
  polarDiscountSynced?: boolean;
  polarDiscountSyncAction?: 'decremented' | 'deleted' | 'already_deleted';
  polarDiscountSyncedAt?: string;
  isTeamPurchase?: boolean;
  teamId?: string;
}

// SePay order metadata
interface SepayOrderMetadata {
  originalAmount: number;
  couponCode?: string;
  couponDiscountAmount?: number;
  couponId?: string;              // For Polar discount sync
  referralCode?: string;
  referralDiscountAmount?: number;
  referrerId?: string;
  githubUsername: string;
  vatInvoiceRequested?: boolean;
  encryptedTaxId?: string;
  // Added by webhook
  gateway?: string;
  transactionDate?: string;
  transactionId?: number;
  transferAmount?: number;
  matchMethod?: string;
  content?: string;
}
```

## Currency Conversion

### Multi-Layer Fallback Architecture
```typescript
// lib/currency.ts
const EXCHANGE_RATE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FALLBACK_RATES = {
  VND_TO_USD: 24500,  // Conservative estimate
  USD_TO_VND: 24500,
};

interface ExchangeRateCache {
  rates: { VND: number; USD: number };
  timestamp: number;
  source: 'api' | 'cached' | 'expired' | 'fallback';
}

let rateCache: ExchangeRateCache | null = null;

export async function getExchangeRates(): Promise<ExchangeRateCache> {
  const now = Date.now();

  // Layer 1: Fresh cache (< 1 hour)
  if (rateCache && now - rateCache.timestamp < EXCHANGE_RATE_CACHE_TTL) {
    return { ...rateCache, source: 'cached' };
  }

  // Layer 2: Live API
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await response.json();

    rateCache = {
      rates: { VND: data.rates.VND, USD: 1 },
      timestamp: now,
      source: 'api',
    };
    return rateCache;

  } catch (error) {
    console.warn('Exchange rate API failed:', error);

    // Layer 3: Expired cache (better than nothing)
    if (rateCache) {
      return { ...rateCache, source: 'expired' };
    }

    // Layer 4: Hardcoded fallback
    return {
      rates: { VND: FALLBACK_RATES.VND_TO_USD, USD: 1 },
      timestamp: now,
      source: 'fallback',
    };
  }
}

export async function convertVndToUsd(vndAmount: number): Promise<{
  usdCents: number;
  rate: number;
  source: string;
}> {
  const { rates, source } = await getExchangeRates();
  const usdCents = Math.round((vndAmount / rates.VND) * 100);
  return { usdCents, rate: rates.VND, source };
}

export async function convertUsdToVnd(usdCents: number): Promise<{
  vndAmount: number;
  rate: number;
  source: string;
}> {
  const { rates, source } = await getExchangeRates();
  const vndAmount = Math.round((usdCents / 100) * rates.VND);
  return { vndAmount, rate: rates.VND, source };
}
```

### Normalizing Revenue to USD
```typescript
// For reporting/dashboard - normalize all revenue to USD cents
export async function normalizeOrderToUsd(order: Order): Promise<{
  amountUsdCents: number;
  originalAmountUsdCents: number;
  conversionSource: string;
}> {
  if (order.currency === 'USD') {
    return {
      amountUsdCents: order.amount,
      originalAmountUsdCents: order.originalAmount || order.amount,
      conversionSource: 'native',
    };
  }

  // VND order
  const conversion = await convertVndToUsd(order.amount);
  const originalConversion = order.originalAmount
    ? await convertVndToUsd(order.originalAmount)
    : conversion;

  return {
    amountUsdCents: conversion.usdCents,
    originalAmountUsdCents: originalConversion.usdCents,
    conversionSource: conversion.source,
  };
}
```

## Commission System

### Commission Schema
```typescript
// db/schema/commissions.ts
export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  referrerId: uuid('referrer_id').references(() => users.id).notNull(),
  referredUserId: uuid('referred_user_id').references(() => users.id).notNull(),
  referralCodeId: uuid('referral_code_id').references(() => referralCodes.id),

  // Amount in original currency
  orderAmount: integer('order_amount').notNull(),      // Base amount for commission
  orderCurrency: text('order_currency').notNull(),     // 'USD' or 'VND'

  // Commission calculation
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).default('0.20'), // 20%
  commissionAmount: integer('commission_amount').notNull(),
  commissionCurrency: text('commission_currency').notNull(),

  // Normalized USD (for tier tracking)
  orderAmountUsdCents: integer('order_amount_usd_cents'),
  commissionAmountUsdCents: integer('commission_amount_usd_cents'),
  exchangeRateSource: text('exchange_rate_source'),

  // Status
  status: text('status').default('pending'),  // pending, approved, paid, cancelled

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
  cancelledAt: timestamp('cancelled_at'),
});
```

### Creating Commission (Multi-Currency)
```typescript
// lib/commissions.ts
export async function createCommission(params: {
  orderId: string;
  referrerId: string;
  referredUserId: string;
  referralCodeId: string;
  orderAmount: number;
  orderCurrency: 'USD' | 'VND';
  commissionRate?: number;
}): Promise<Commission> {
  const rate = params.commissionRate || 0.20; // Default 20%

  // Calculate commission in original currency
  const commissionAmount = Math.round(params.orderAmount * rate);

  // Convert to USD for tier tracking
  let orderAmountUsdCents: number;
  let commissionAmountUsdCents: number;
  let exchangeRateSource: string;

  if (params.orderCurrency === 'USD') {
    orderAmountUsdCents = params.orderAmount;
    commissionAmountUsdCents = commissionAmount;
    exchangeRateSource = 'native';
  } else {
    const conversion = await convertVndToUsd(params.orderAmount);
    orderAmountUsdCents = conversion.usdCents;
    commissionAmountUsdCents = Math.round(conversion.usdCents * rate);
    exchangeRateSource = conversion.source;
  }

  const [commission] = await db.insert(commissions).values({
    orderId: params.orderId,
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    referralCodeId: params.referralCodeId,
    orderAmount: params.orderAmount,
    orderCurrency: params.orderCurrency,
    commissionRate: String(rate),
    commissionAmount,
    commissionCurrency: params.orderCurrency,
    orderAmountUsdCents,
    commissionAmountUsdCents,
    exchangeRateSource,
    status: 'pending',
  }).returning();

  // Update referrer's tier based on USD revenue
  await updateReferrerTier(params.referrerId, orderAmountUsdCents);

  return commission;
}
```

### Referrer Tier System
```typescript
// lib/referrals.ts
const TIER_THRESHOLDS = [
  { tier: 'bronze', minRevenue: 0, commissionRate: 0.20 },
  { tier: 'silver', minRevenue: 50000, commissionRate: 0.25 },     // $500
  { tier: 'gold', minRevenue: 150000, commissionRate: 0.30 },      // $1,500
  { tier: 'platinum', minRevenue: 500000, commissionRate: 0.35 },  // $5,000
];

export async function updateReferrerTier(
  referrerId: string,
  newRevenueUsdCents: number
): Promise<void> {
  const referrer = await db.select()
    .from(users)
    .where(eq(users.id, referrerId))
    .limit(1);

  if (!referrer[0]) return;

  const currentRevenue = referrer[0].referralRevenueUsdCents || 0;
  const totalRevenue = currentRevenue + newRevenueUsdCents;

  // Determine new tier
  let newTier = 'bronze';
  let newRate = 0.20;

  for (const threshold of TIER_THRESHOLDS) {
    if (totalRevenue >= threshold.minRevenue) {
      newTier = threshold.tier;
      newRate = threshold.commissionRate;
    }
  }

  // Update if tier changed
  if (referrer[0].referralTier !== newTier) {
    await db.update(users)
      .set({
        referralTier: newTier,
        referralCommissionRate: String(newRate),
        referralRevenueUsdCents: totalRevenue,
        updatedAt: new Date(),
      })
      .where(eq(users.id, referrerId));

    // Send tier upgrade notification
    if (TIER_THRESHOLDS.findIndex(t => t.tier === newTier) >
        TIER_THRESHOLDS.findIndex(t => t.tier === referrer[0].referralTier)) {
      await sendTierUpgradeEmail(referrerId, newTier, newRate);
    }
  } else {
    // Just update revenue
    await db.update(users)
      .set({
        referralRevenueUsdCents: totalRevenue,
        updatedAt: new Date(),
      })
      .where(eq(users.id, referrerId));
  }
}
```

## Revenue Tracking

### Combined Provider Revenue
```typescript
// lib/revenue.ts
export async function getTotalRevenue(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalUsdCents: number;
  byProvider: { polar: number; sepay: number };
  orderCount: number;
  averageOrderValueCents: number;
}> {
  let query = db.select()
    .from(orders)
    .where(eq(orders.status, 'completed'));

  if (options?.startDate) {
    query = query.where(gte(orders.createdAt, options.startDate));
  }
  if (options?.endDate) {
    query = query.where(lte(orders.createdAt, options.endDate));
  }

  const completedOrders = await query;

  let totalUsdCents = 0;
  let polarUsdCents = 0;
  let sepayUsdCents = 0;

  for (const order of completedOrders) {
    const normalized = await normalizeOrderToUsd(order);

    totalUsdCents += normalized.amountUsdCents;

    if (order.paymentProvider === 'polar') {
      polarUsdCents += normalized.amountUsdCents;
    } else {
      sepayUsdCents += normalized.amountUsdCents;
    }
  }

  return {
    totalUsdCents,
    byProvider: { polar: polarUsdCents, sepay: sepayUsdCents },
    orderCount: completedOrders.length,
    averageOrderValueCents: completedOrders.length > 0
      ? Math.round(totalUsdCents / completedOrders.length)
      : 0,
  };
}
```

### Maintainer Revenue Calculation
```typescript
// lib/maintainer-revenue.ts
// Calculate actual payout after fees and costs

interface MaintainerRevenue {
  grossRevenue: number;      // Total received
  platformFees: number;      // Polar/Stripe fees
  operatingCosts: number;    // Proportional costs
  taxDeduction: number;      // 17% tax
  netPayout: number;         // Final amount
  currency: 'USD';
}

export async function calculateMaintainerRevenue(
  productIds: string[],
  dateRange: { start: Date; end: Date }
): Promise<MaintainerRevenue> {
  // Get orders for these products
  const orders = await db.select()
    .from(orders)
    .where(and(
      eq(orders.status, 'completed'),
      inArray(orders.productType, productIds),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ));

  let grossRevenue = 0;
  let platformFees = 0;

  for (const order of orders) {
    const normalized = await normalizeOrderToUsd(order);
    grossRevenue += normalized.amountUsdCents;

    if (order.paymentProvider === 'polar') {
      const fees = calculatePolarFees(normalized.amountUsdCents);
      platformFees += fees.totalFee;
    }
    // SePay has no platform fees (direct bank transfer)
  }

  // Proportional operating costs (hosting, services, etc.)
  const monthlyOperatingCosts = 50000; // $500/month in cents
  const totalMonthlyRevenue = await getTotalRevenue({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  const costRatio = grossRevenue / (totalMonthlyRevenue.totalUsdCents || 1);
  const operatingCosts = Math.round(monthlyOperatingCosts * costRatio);

  // Tax deduction (17%)
  const afterCosts = grossRevenue - platformFees - operatingCosts;
  const taxDeduction = Math.round(afterCosts * 0.17);

  const netPayout = afterCosts - taxDeduction;

  return {
    grossRevenue,
    platformFees,
    operatingCosts,
    taxDeduction,
    netPayout,
    currency: 'USD',
  };
}
```

## Refund Handling

### Unified Refund Flow
```typescript
// lib/refunds.ts
export async function processRefund(
  orderId: string,
  options: { keepAccess?: boolean; reason?: string }
): Promise<{ success: boolean; error?: string }> {
  const order = await db.select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order[0]) {
    return { success: false, error: 'Order not found' };
  }

  if (order[0].status !== 'completed') {
    return { success: false, error: 'Order not refundable' };
  }

  try {
    // 1. Process refund with payment provider
    if (order[0].paymentProvider === 'polar') {
      await polar.orders.refund({ id: order[0].paymentId! });
    } else {
      // SePay: Manual bank transfer refund required
      // Just mark order, admin handles bank transfer
      console.log(`Manual refund needed for SePay order ${orderId}`);
    }

    // 2. Update order status
    await db.update(orders)
      .set({
        status: 'refunded',
        metadata: JSON.stringify({
          ...JSON.parse(order[0].metadata || '{}'),
          refundedAt: new Date().toISOString(),
          refundReason: options.reason,
          keepAccess: options.keepAccess,
        }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 3. Cancel commission (if any)
    if (order[0].referredBy) {
      await db.update(commissions)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
        })
        .where(eq(commissions.orderId, orderId));

      // Recalculate referrer tier
      await recalculateReferrerTier(order[0].referredBy);
    }

    // 4. Revoke access (unless keepAccess)
    if (!options.keepAccess) {
      const metadata = JSON.parse(order[0].metadata || '{}');
      if (metadata.githubUsername) {
        await revokeGitHubAccess(metadata.githubUsername, order[0].productType);
      }

      await db.update(licenses)
        .set({ isActive: false, revokedAt: new Date() })
        .where(eq(licenses.orderId, orderId));
    }

    return { success: true };

  } catch (error) {
    console.error('Refund failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Refund failed' };
  }
}
```

## Webhook Event Tracking

### Unified Webhook Events Table
```typescript
// db/schema/webhook-events.ts
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),          // 'polar' or 'sepay'
  eventType: text('event_type').notNull(),       // Event type/name
  eventId: text('event_id').notNull().unique(),  // Idempotency key
  payload: text('payload').notNull(),            // Raw JSON payload
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  error: text('error'),                          // Error message if failed
  createdAt: timestamp('created_at').defaultNow(),
});

// Partial index for unprocessed events
// CREATE INDEX idx_webhook_events_unprocessed ON webhook_events (created_at)
//   WHERE processed = false;
```

### Idempotent Webhook Processing
```typescript
// lib/webhooks.ts
export async function processWebhookIdempotently<T>(
  provider: 'polar' | 'sepay',
  eventId: string,
  eventType: string,
  payload: string,
  handler: () => Promise<T>
): Promise<{ processed: boolean; result?: T; error?: string }> {
  // Check for duplicate
  const existing = await db.select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .limit(1);

  if (existing.length > 0) {
    return { processed: false }; // Already processed
  }

  // Record event BEFORE processing
  await db.insert(webhookEvents).values({
    id: crypto.randomUUID(),
    provider,
    eventType,
    eventId,
    payload,
    processed: false,
  });

  try {
    const result = await handler();

    await db.update(webhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(webhookEvents.eventId, eventId));

    return { processed: true, result };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await db.update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
        error: errorMessage,
      })
      .where(eq(webhookEvents.eventId, eventId));

    return { processed: true, error: errorMessage };
  }
}
```

## Discount Cross-Provider Sync

### Syncing SePay Usage to Polar
```typescript
// lib/polar-discount-sync.ts
// When a Polar discount is used via SePay, decrement Polar's redemption count

export async function syncDiscountRedemptionToPolar(
  orderId: string,
  discountId: string,
  discountCode: string
): Promise<{ success: boolean; action: string }> {
  const order = await db.select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order[0]) {
    return { success: false, action: 'order_not_found' };
  }

  const metadata = order[0].metadata ? JSON.parse(order[0].metadata) : {};

  // Idempotency check
  if (metadata.polarDiscountSynced) {
    return { success: true, action: 'already_synced' };
  }

  const polar = getPolar();

  try {
    const discount = await polar.discounts.get({ id: discountId });

    // Skip if unlimited redemptions
    if (discount.maxRedemptions === null) {
      await markSynced(orderId, 'skipped_unlimited');
      return { success: true, action: 'skipped_unlimited' };
    }

    const currentMax = discount.maxRedemptions;

    if (currentMax <= 1) {
      // Delete discount if this was last use
      await polar.discounts.delete({ id: discountId });
      await markSynced(orderId, 'deleted');
      return { success: true, action: 'deleted' };
    } else {
      // Decrement max redemptions
      await polar.discounts.update({
        id: discountId,
        discountUpdate: { maxRedemptions: currentMax - 1 },
      });
      await markSynced(orderId, 'decremented');
      return { success: true, action: 'decremented' };
    }

  } catch (error: any) {
    if (error.statusCode === 404) {
      await markSynced(orderId, 'already_deleted');
      return { success: true, action: 'already_deleted' };
    }
    throw error;
  }
}

async function markSynced(orderId: string, action: string) {
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const metadata = order[0].metadata ? JSON.parse(order[0].metadata) : {};

  await db.update(orders)
    .set({
      metadata: JSON.stringify({
        ...metadata,
        polarDiscountSynced: true,
        polarDiscountSyncAction: action,
        polarDiscountSyncedAt: new Date().toISOString(),
      }),
    })
    .where(eq(orders.id, orderId));
}

// Retry wrapper with exponential backoff
export async function syncWithRetry(
  orderId: string,
  discountId: string,
  discountCode: string,
  attempt: number = 1
): Promise<{ success: boolean; action: string }> {
  const MAX_ATTEMPTS = 3;

  try {
    return await syncDiscountRedemptionToPolar(orderId, discountId, discountCode);
  } catch (error) {
    if (attempt < MAX_ATTEMPTS) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
      await sleep(delay);
      return syncWithRetry(orderId, discountId, discountCode, attempt + 1);
    }
    throw error;
  }
}
```

## Admin Order Management API

### Order Listing with Provider Info
```typescript
// app/api/admin/orders/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const provider = searchParams.get('provider'); // 'polar' | 'sepay' | null
  const status = searchParams.get('status');

  let query = db.select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  if (provider) {
    query = query.where(eq(orders.paymentProvider, provider));
  }
  if (status) {
    query = query.where(eq(orders.status, status));
  }

  const results = await query
    .limit(limit)
    .offset((page - 1) * limit);

  // Normalize amounts to USD for display
  const ordersWithNormalized = await Promise.all(
    results.map(async (order) => {
      const normalized = await normalizeOrderToUsd(order);
      return {
        ...order,
        amountUsdCents: normalized.amountUsdCents,
        displayAmount: order.currency === 'VND'
          ? formatVND(order.amount)
          : formatUSD(order.amount),
      };
    })
  );

  return NextResponse.json({
    orders: ordersWithNormalized,
    pagination: {
      page,
      limit,
      hasMore: results.length === limit,
    },
  });
}
```

## Best Practices Summary

### 1. Currency Handling
- Store amounts in original currency (USD or VND)
- Always store currency code with amount
- Use multi-layer fallback for exchange rates
- Convert to USD for reporting/comparison

### 2. Order Management
- Use unified orders table for both providers
- Store provider-specific data in metadata JSON
- Normalize to USD for tier calculations

### 3. Commission System
- Store original currency and USD equivalent
- Calculate tier based on USD values
- Handle currency conversion in commission creation

### 4. Webhook Processing
- Use idempotency keys for deduplication
- Record event before processing
- Always return 200 to prevent retry loops
- Log errors in event record for debugging

### 5. Cross-Provider Sync
- Sync discount redemptions from SePay to Polar
- Use retry with exponential backoff
- Mark orders as synced to prevent duplicates

### 6. Refund Handling
- Check order status before processing
- Cancel related commissions
- Recalculate referrer tier after cancellation
- Optionally keep access (goodwill refunds)
