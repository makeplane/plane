import { EventEmitter } from "events";
import { createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts } from "redis";
import { env } from "@/env";
import { logger } from "@/logger";

export class Store extends EventEmitter {
  private static instance: Store | null = null;
  private client!: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
  private subscriber!: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
  private jobs: string[] = [];
  private reconnecting: boolean = false;
  private readonly RECONNECT_INTERVAL = 5000;
  private readonly MAX_INITIAL_CONNECT_ATTEMPTS = Number(env.MAX_STORE_CONNECTION_ATTEMPTS);

  private constructor() {
    super();
  }

  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  private async setupConnectionListeners() {
    this.client.on("error", (error) => {
      logger.error("Redis client error:", error);
      this.handleReconnection();
    });

    this.client.on("end", () => {
      logger.error("Redis client connection ended");
      this.handleReconnection();
    });
  }

  private async handleReconnection() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    let attemptCount = 0;
    const attempts = this.MAX_INITIAL_CONNECT_ATTEMPTS;

    while (attemptCount < attempts) {
      try {
        attemptCount++;
        await this.initializeConnection();
        this.reconnecting = false;
        console.log("Successfully reconnected to Redis");
        return true;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_INTERVAL));
        console.log(`Attempting to reconnect to Redis [${attemptCount}]...`);
      }
    }
  }

  private async initializeConnection() {
    this.client = createClient({
      url: env.REDIS_URL,
    });

    this.subscriber = this.client.duplicate();

    await this.client.connect();
    await this.subscriber.connect();

    await this.client.configSet("notify-keyspace-events", "Ex");
    await this.setupConnectionListeners();
    this.setupExpirationListener();
  }

  public async connect() {

    const attempts = this.MAX_INITIAL_CONNECT_ATTEMPTS;
    let attemptCount = 0;
    while (attemptCount < attempts) {
      try {
        attemptCount++;
        await this.initializeConnection();
        logger.info(`Redis Store connected successfully 📚🫙🫙`);
        return;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_INTERVAL));
        console.log(`Attempting to connect to Redis [${attemptCount}]...`);
      }
    }
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

  public async disconnect() {
    try {
      await this.client.quit();
      await this.subscriber.quit();
      logger.info("Successfully disconnected from Redis");
    } catch (error) {
      console.error("Error during Redis disconnect:", error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async getList(key: string): Promise<string[] | null> {
    return await this.client.lRange(key, 0, -1);
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

  public async setList(key: string, value: string, ttl?: number, NX = true): Promise<boolean> {
    try {
      const exists = await this.client.exists(key) > 0;
      if (NX && exists) return false;

      // Atomic operation: delete if exists, then push new items
      const multi = this.client.multi();

      // Push the value to the list
      multi.rPush(key, value);

      // Set the expiration time
      if (ttl) multi.expire(key, ttl);

      // Execute the transaction
      await multi.exec();
      return true;
    } catch (error) {
      logger.error(`Error in setList for key ${key}:`, error);
      return false;
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
}
