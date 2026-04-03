#!/usr/bin/env node

/**
 * Polar Webhook Verification Script
 *
 * Verifies Polar webhook signatures following Standard Webhooks specification.
 *
 * Usage:
 *   node polar-webhook-verify.js <webhook-payload-json> <webhook-secret>
 *
 * Environment Variables:
 *   POLAR_WEBHOOK_SECRET - Webhook secret (base64 encoded)
 */

const crypto = require('crypto');

class PolarWebhookVerifier {
  constructor(secret) {
    if (!secret) {
      throw new Error('Webhook secret is required');
    }
    // Decode base64 secret
    this.secret = Buffer.from(secret, 'base64');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, headers) {
    const webhookId = headers['webhook-id'];
    const webhookTimestamp = headers['webhook-timestamp'];
    const webhookSignature = headers['webhook-signature'];

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      throw new Error('Missing required webhook headers');
    }

    // Check timestamp (reject if > 5 minutes old)
    const timestamp = parseInt(webhookTimestamp);
    const now = Math.floor(Date.now() / 1000);

    if (Math.abs(now - timestamp) > 300) {
      throw new Error('Webhook timestamp too old or in future');
    }

    // Parse signatures
    const signatures = webhookSignature.split(',').map(sig => {
      const parts = sig.split('=');
      const version = parts[0];
      const signature = parts.slice(1).join('='); // Rejoin in case signature contains '='
      return { version, signature };
    });

    // Create signed payload
    const signedPayload = `${webhookTimestamp}.${payload}`;

    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(signedPayload)
      .digest('base64');

    // Check if any signature matches
    const isValid = signatures.some(sig => {
      return sig.version === 'v1' && sig.signature === expectedSignature;
    });

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    return true;
  }

  /**
   * Process webhook event
   */
  process(payload, headers) {
    try {
      // Verify signature
      this.verifySignature(payload, headers);

      // Parse payload
      const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

      // Validate event structure
      if (!event.type || !event.data) {
        throw new Error('Invalid event structure');
      }

      return {
        success: true,
        event: {
          type: event.type,
          data: event.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get event category
   */
  static getEventCategory(eventType) {
    const categories = {
      'checkout.': 'checkout',
      'order.': 'order',
      'subscription.': 'subscription',
      'customer.': 'customer',
      'benefit_grant.': 'benefit',
      'refund.': 'refund',
      'product.': 'product'
    };

    for (const [prefix, category] of Object.entries(categories)) {
      if (eventType.startsWith(prefix)) {
        return category;
      }
    }

    return 'unknown';
  }

  /**
   * Check if event is a payment
   */
  static isPaymentEvent(eventType) {
    return ['order.paid', 'order.created'].includes(eventType);
  }

  /**
   * Check if event is a subscription change
   */
  static isSubscriptionEvent(eventType) {
    return eventType.startsWith('subscription.');
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node polar-webhook-verify.js <webhook-payload-json> [webhook-secret]');
    console.log('\nWebhook secret can also be provided via POLAR_WEBHOOK_SECRET environment variable');
    console.log('\nExample:');
    console.log('  node polar-webhook-verify.js \'{"type":"order.paid","data":{...}}\' base64secret');
    process.exit(1);
  }

  try {
    const payload = args[0];
    const secret = args[1] || process.env.POLAR_WEBHOOK_SECRET;

    if (!secret) {
      console.error('✗ Error: Webhook secret is required');
      console.error('Provide it as second argument or set POLAR_WEBHOOK_SECRET environment variable');
      process.exit(1);
    }

    // Mock headers for CLI testing
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret, 'base64'))
      .update(signedPayload)
      .digest('base64');

    const headers = {
      'webhook-id': 'msg_test_' + Date.now(),
      'webhook-timestamp': timestamp.toString(),
      'webhook-signature': `v1=${signature}`
    };

    const verifier = new PolarWebhookVerifier(secret);
    const result = verifier.process(payload, headers);

    if (result.success) {
      console.log('✓ Webhook verified successfully\n');
      console.log('Event Details:');
      console.log(`  Type: ${result.event.type}`);
      console.log(`  Category: ${PolarWebhookVerifier.getEventCategory(result.event.type)}`);
      console.log(`  Is Payment: ${PolarWebhookVerifier.isPaymentEvent(result.event.type) ? 'Yes' : 'No'}`);
      console.log(`  Is Subscription: ${PolarWebhookVerifier.isSubscriptionEvent(result.event.type) ? 'Yes' : 'No'}`);
      console.log('\nEvent Data:');
      console.log(JSON.stringify(result.event.data, null, 2));
    } else {
      console.error('✗ Verification failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

module.exports = PolarWebhookVerifier;
