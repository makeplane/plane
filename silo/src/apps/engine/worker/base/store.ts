import { EventEmitter } from "events";
import { createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts } from "redis";
import { env } from "@/env";

export class Store extends EventEmitter {
  private client!: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
  private subscriber!: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
  private jobs: string[] = [];

  constructor() {
    super();
  }

  public async connect() {
    this.client = createClient({
      url: env.REDIS_URL,
    });
    await this.client.connect();

    this.subscriber = this.client.duplicate();
    await this.subscriber.connect();

    await this.client.configSet("notify-keyspace-events", "Ex");

    this.setupExpirationListener();
  }

  private setupExpirationListener() {
    const channel = "__keyevent@0__:expired";
    this.subscriber.subscribe(channel, (message) => {
      if (message.startsWith("silo")) this.emit("ready", message);

      const index = this.jobs.indexOf(message);
      if (index > -1) {
        this.jobs.splice(index, 1);
      }
    });
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async set(key: string, value: string, ttl?: number, NX = true): Promise<boolean> {
    this.jobs.push(key);

    if (ttl !== undefined) {
      const acquired = await this.client.set(key, value, NX ? { NX: true, EX: ttl } : { EX: ttl });
      return acquired === "OK";
    } else {
      const acquired = await this.client.set(key, value, NX ? { NX: true } : {});
      return acquired === "OK";
    }
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
    this.jobs = [];
  }

  public getJobs(): string[] {
    return [...this.jobs];
  }

  public async disconnect() {
    await this.client.quit();
    await this.subscriber.quit();
  }

  public async getTTL(key: string): Promise<number> {
    return await this.client.ttl(key);
  }
}
