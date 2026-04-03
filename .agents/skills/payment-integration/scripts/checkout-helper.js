#!/usr/bin/env node

/**
 * Checkout Helper Script
 *
 * Generate checkout sessions for both SePay and Polar platforms.
 *
 * Usage:
 *   node checkout-helper.js <platform> <config-json>
 *
 * Platforms: sepay, polar
 *
 * Environment Variables:
 *   SEPAY_MERCHANT_ID, SEPAY_SECRET_KEY, SEPAY_ENV
 *   POLAR_ACCESS_TOKEN, POLAR_SERVER
 */

const crypto = require('crypto');

class CheckoutHelper {
  /**
   * Generate SePay checkout form fields
   */
  static generateSePayCheckout(config) {
    const {
      merchantId,
      secretKey,
      orderInvoiceNumber,
      orderAmount,
      currency = 'VND',
      successUrl,
      errorUrl,
      cancelUrl,
      orderDescription,
      operation = 'PURCHASE'
    } = config;

    // Validate required fields
    const required = ['merchantId', 'secretKey', 'orderInvoiceNumber', 'orderAmount', 'successUrl', 'errorUrl', 'cancelUrl'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Build fields
    const fields = {
      merchant_id: merchantId,
      operation: operation,
      order_invoice_number: orderInvoiceNumber,
      order_amount: orderAmount,
      currency: currency,
      success_url: successUrl,
      error_url: errorUrl,
      cancel_url: cancelUrl,
      order_description: orderDescription || `Order ${orderInvoiceNumber}`,
      timestamp: new Date().toISOString()
    };

    // Generate HMAC SHA256 signature
    const signatureData = Object.keys(fields)
      .sort()
      .map(key => `${key}=${fields[key]}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureData)
      .digest('hex');

    fields.signature = signature;

    return {
      fields,
      formUrl: config.env === 'production'
        ? 'https://pay.sepay.vn/v1/init'
        : 'https://sandbox.pay.sepay.vn/v1/init',
      htmlForm: this.generateHTMLForm(fields, config.env === 'production'
        ? 'https://pay.sepay.vn/v1/init'
        : 'https://sandbox.pay.sepay.vn/v1/init')
    };
  }

  /**
   * Generate Polar checkout configuration
   */
  static generatePolarCheckout(config) {
    const {
      productPriceId,
      successUrl,
      externalCustomerId,
      customerEmail,
      customerName,
      discountId,
      metadata,
      embedOrigin
    } = config;

    // Validate required fields
    if (!productPriceId) {
      throw new Error('Missing required field: productPriceId');
    }
    if (!successUrl) {
      throw new Error('Missing required field: successUrl');
    }

    // Must be absolute URL
    if (!successUrl.startsWith('http://') && !successUrl.startsWith('https://')) {
      throw new Error('successUrl must be an absolute URL');
    }

    const checkoutConfig = {
      product_price_id: productPriceId,
      success_url: successUrl
    };

    // Add optional fields
    if (externalCustomerId) checkoutConfig.external_customer_id = externalCustomerId;
    if (customerEmail) checkoutConfig.customer_email = customerEmail;
    if (customerName) checkoutConfig.customer_name = customerName;
    if (discountId) checkoutConfig.discount_id = discountId;
    if (metadata) checkoutConfig.metadata = metadata;
    if (embedOrigin) checkoutConfig.embed_origin = embedOrigin;

    return {
      config: checkoutConfig,
      apiEndpoint: config.server === 'sandbox'
        ? 'https://sandbox-api.polar.sh/v1/checkouts'
        : 'https://api.polar.sh/v1/checkouts',
      curlCommand: this.generatePolarCurl(checkoutConfig, config.accessToken, config.server)
    };
  }

  /**
   * Generate HTML form for SePay
   */
  static generateHTMLForm(fields, actionUrl) {
    const inputs = Object.keys(fields)
      .map(key => `    <input type="hidden" name="${key}" value="${fields[key]}" />`)
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SePay Payment</title>
</head>
<body>
  <form id="payment-form" action="${actionUrl}" method="POST">
${inputs}
    <button type="submit">Pay Now</button>
  </form>

  <script>
    // Auto-submit form
    // document.getElementById('payment-form').submit();
  </script>
</body>
</html>
`.trim();
  }

  /**
   * Generate cURL command for Polar
   */
  static generatePolarCurl(config, accessToken, server = 'production') {
    const endpoint = server === 'sandbox'
      ? 'https://sandbox-api.polar.sh/v1/checkouts'
      : 'https://api.polar.sh/v1/checkouts';

    return `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(config, null, 2)}'`;
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node checkout-helper.js <platform> <config-json>');
    console.log('\nPlatforms:');
    console.log('  sepay  - SePay checkout form generation');
    console.log('  polar  - Polar checkout session configuration');
    console.log('\nExamples:');
    console.log('\nSePay:');
    console.log('  node checkout-helper.js sepay \'{"orderInvoiceNumber":"ORD001","orderAmount":100000,"successUrl":"https://example.com/success","errorUrl":"https://example.com/error","cancelUrl":"https://example.com/cancel"}\'');
    console.log('\nPolar:');
    console.log('  node checkout-helper.js polar \'{"productPriceId":"price_xxx","successUrl":"https://example.com/success","externalCustomerId":"user_123"}\'');
    process.exit(1);
  }

  try {
    const platform = args[0].toLowerCase();
    const config = JSON.parse(args[1]);

    if (platform === 'sepay') {
      // Get from environment or config
      config.merchantId = config.merchantId || process.env.SEPAY_MERCHANT_ID;
      config.secretKey = config.secretKey || process.env.SEPAY_SECRET_KEY;
      config.env = config.env || process.env.SEPAY_ENV || 'sandbox';

      const result = CheckoutHelper.generateSePayCheckout(config);

      console.log('✓ SePay Checkout Generated\n');
      console.log('Form URL:', result.formUrl);
      console.log('\nForm Fields:');
      console.log(JSON.stringify(result.fields, null, 2));
      console.log('\nHTML Form:');
      console.log(result.htmlForm);
    } else if (platform === 'polar') {
      // Get from environment or config
      config.accessToken = config.accessToken || process.env.POLAR_ACCESS_TOKEN;
      config.server = config.server || process.env.POLAR_SERVER || 'production';

      if (!config.accessToken) {
        console.error('✗ Error: POLAR_ACCESS_TOKEN is required');
        console.error('Set it via environment variable or in config JSON');
        process.exit(1);
      }

      const result = CheckoutHelper.generatePolarCheckout(config);

      console.log('✓ Polar Checkout Configuration Generated\n');
      console.log('API Endpoint:', result.apiEndpoint);
      console.log('\nCheckout Configuration:');
      console.log(JSON.stringify(result.config, null, 2));
      console.log('\ncURL Command:');
      console.log(result.curlCommand);
    } else {
      console.error(`✗ Error: Unknown platform '${platform}'`);
      console.error('Supported platforms: sepay, polar');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

module.exports = CheckoutHelper;
