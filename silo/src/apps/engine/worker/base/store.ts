import { env } from "@/env";
import { createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts } from "redis";

export class Store {
  private client!: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

  private jobs: string[] = [];

  constructor() {}

  // Error has to be handled by the caller
  public async connect() {
    this.client = createClient({
      url: env.REDIS_URL,
    });
    await this.client.connect();
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async set(key: string, value: string): Promise<string | null> {
    this.jobs.push(key);
    return await this.client.set(key, value, {
      NX: true,
      PX: 1000 * 60 * 10,
    });
  }

  public async del(key: string): Promise<number> {
    const index = this.jobs.indexOf(key);
    if (index > -1) {
      this.jobs.splice(index, 1);
    }
    return await this.client.del(key);
  }

  public async clean() {
    for (const key of this.jobs) {
      await this.client.del(key);
    }
  }
}
