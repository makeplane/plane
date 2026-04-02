#!/usr/bin/env node

/**
 * SePay Webhook Verification Script
 *
 * Verifies SePay webhook authenticity and processes transaction data.
 * Supports API Key and OAuth2 authentication.
 *
 * Usage:
 *   node sepay-webhook-verify.js <webhook-payload-json>
 *
 * Environment Variables:
 *   SEPAY_WEBHOOK_AUTH_TYPE - Authentication type (api_key or oauth2 or none)
 *   SEPAY_WEBHOOK_API_KEY - API key for verification (if using api_key)
 */

const crypto = require('crypto');

class SePayWebhookVerifier {
  constructor(authType = 'none', apiKey = null) {
    this.authType = authType;
    this.apiKey = apiKey;
  }

  /**
   * Verify webhook authenticity
   */
  verifyAuthentication(headers) {
    if (this.authType === 'none') {
      console.log('⚠️  Warning: No authentication configured');
      return true;
    }

    if (this.authType === 'api_key') {
      const authHeader = headers['authorization'] || headers['Authorization'];

      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }

      const expectedAuth = `Apikey ${this.apiKey}`;
      if (authHeader !== expectedAuth) {
        throw new Error('Invalid API key');
      }

      return true;
    }

    if (this.authType === 'oauth2') {
      const authHeader = headers['authorization'] || headers['Authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid OAuth2 Bearer token');
      }

      // In production, verify token with OAuth2 provider
      console.log('✓ OAuth2 token present (full verification needed in production)');
      return true;
    }

    throw new Error(`Unknown auth type: ${this.authType}`);
  }

  /**
   * Check for duplicate transactions
   */
  isDuplicate(transactionId, processedIds = new Set()) {
    return processedIds.has(transactionId);
  }

  /**
   * Validate webhook payload structure
   */
  validatePayload(payload) {
    const required = [
      'id',
      'gateway',
      'transactionDate',
      'accountNumber',
      'transferType',
      'transferAmount',
      'referenceCode'
    ];

    for (const field of required) {
      if (!(field in payload)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate transfer type
    if (!['in', 'out'].includes(payload.transferType)) {
      throw new Error(`Invalid transferType: ${payload.transferType}`);
    }

    // Validate amount
    if (typeof payload.transferAmount !== 'number' || payload.transferAmount <= 0) {
      throw new Error('Invalid transferAmount');
    }

    return true;
  }

  /**
   * Process webhook payload
   */
  process(payload, headers = {}) {
    try {
      // 1. Verify authentication
      this.verifyAuthentication(headers);

      // 2. Validate payload structure
      this.validatePayload(payload);

      // 3. Extract transaction data
      const transaction = {
        id: payload.id,
        gateway: payload.gateway,
        transactionDate: new Date(payload.transactionDate),
        accountNumber: payload.accountNumber,
        code: payload.code || null,
        content: payload.content || '',
        transferType: payload.transferType,
        transferAmount: payload.transferAmount,
        accumulated: payload.accumulated || 0,
        subAccount: payload.subAccount || null,
        referenceCode: payload.referenceCode
      };

      return {
        success: true,
        transaction,
        isIncoming: transaction.transferType === 'in',
        isOutgoing: transaction.transferType === 'out'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node sepay-webhook-verify.js <webhook-payload-json>');
    console.log('\nEnvironment Variables:');
    console.log('  SEPAY_WEBHOOK_AUTH_TYPE - Authentication type (api_key, oauth2, none)');
    console.log('  SEPAY_WEBHOOK_API_KEY - API key for verification');
    process.exit(1);
  }

  try {
    const payload = JSON.parse(args[0]);
    const authType = process.env.SEPAY_WEBHOOK_AUTH_TYPE || 'none';
    const apiKey = process.env.SEPAY_WEBHOOK_API_KEY || null;

    const verifier = new SePayWebhookVerifier(authType, apiKey);

    // Mock headers for CLI testing
    const headers = {};
    if (authType === 'api_key' && apiKey) {
      headers['Authorization'] = `Apikey ${apiKey}`;
    }

    const result = verifier.process(payload, headers);

    if (result.success) {
      console.log('✓ Webhook verified successfully\n');
      console.log('Transaction Details:');
      console.log(`  ID: ${result.transaction.id}`);
      console.log(`  Gateway: ${result.transaction.gateway}`);
      console.log(`  Type: ${result.transaction.transferType}`);
      console.log(`  Amount: ${result.transaction.transferAmount.toLocaleString('vi-VN')} VND`);
      console.log(`  Reference: ${result.transaction.referenceCode}`);
      console.log(`  Content: ${result.transaction.content || 'N/A'}`);
      console.log(`\n  Incoming: ${result.isIncoming ? 'Yes' : 'No'}`);
      console.log(`  Outgoing: ${result.isOutgoing ? 'Yes' : 'No'}`);
    } else {
      console.error('✗ Verification failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

module.exports = SePayWebhookVerifier;
