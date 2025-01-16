import { Store } from ".";

export class Lock {
  private readonly lockKey: string;
  private readonly lockTTL: number;

  constructor(
    private store: Store,
    workspaceId: string,
    jobId: string,
    ttl?: number
  ) {
    this.lockKey = `silo:${workspaceId}:${jobId}:lock`;
    this.lockTTL = ttl ?? 6 * 60 * 60 * 1000; // 6 hours
  }

  async acquireLock(batchId: string): Promise<boolean> {
    // Try to acquire lock using SETNX
    return await this.store.set(this.lockKey, batchId, this.lockTTL);
  }

  async releaseLock(): Promise<void> {
    await this.store.del(this.lockKey);
  }

  async getCurrentBatch(): Promise<string | null> {
    return await this.store.get(this.lockKey);
  }
}
