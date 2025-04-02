import crypto from 'crypto';

class HMACSigner {
  /**
   * Generate the HMAC signature and headers.
   * 
   * @param {string} secretKey - The shared secret key for HMAC signing.
   * @param {string} service - The service identifier.
   * @param {string} method - HTTP method (e.g., "GET", "POST").
   * @param {string} path - The request path (e.g., "/api/resource").
   * @returns {Object} - An object containing `X-HMAC-Signature` and `X-HMAC-Timestamp` headers.
   */
  static generateHeaders(secretKey: string, service: string, method: string, path: string) {
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds.

    // Construct the payload for HMAC signing.
    const payload = `${method.toUpperCase()}:${path}:${timestamp}`;

    // Generate the HMAC signature using SHA-256.
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    // Return the headers.
    return {
      'X-HMAC-Signature': signature,
      'X-HMAC-Timestamp': timestamp.toString(),
      'X-Service': service
    };
  }
}

export default HMACSigner;
