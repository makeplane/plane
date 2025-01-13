// RateLimiter class to manage API request timing
class RateLimiter {
  private requests: number[];
  private readonly limit: number;
  private readonly interval: number;

  constructor(limit: number, intervalMs: number) {
    this.requests = [];
    this.limit = limit;
    this.interval = intervalMs;
  }

  async acquireToken(): Promise<void> {
    const now = Date.now();

    // Remove expired timestamps
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.interval);

    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0];
      const waitTime = this.interval - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.requests = this.requests.filter((timestamp) => now - timestamp < this.interval);
    }

    this.requests.push(Date.now());
  }
}

export default RateLimiter;
