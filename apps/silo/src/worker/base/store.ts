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

  public async getMap(key: string): Promise<Map<string, string> | null> {
    const mapObj = await this.client.hGetAll(key);
    if (Object.keys(mapObj).length === 0) {
      return null; // key is missing
    }
    return new Map(Object.entries(mapObj));
  }

  // Get a single field from a hash map
  public async getMapField(key: string, field: string): Promise<string | null> {
    const value = await this.client.hGet(key, field);
    return value ?? null;
  }

  // Get multiple fields from a hash map
  public async getMapFields(key: string, fields: string[]): Promise<Map<string, string>> {
    const values = await this.client.hmGet(key, fields);

    // Create a Map from the fields and values
    const result = new Map<string, string>();
    fields.forEach((field, index) => {
      if (values[index] !== null) {
        result.set(field, values[index]);
      }
    });

    return result;
  }

  /**
   * Atomically increments a counter by the specified amount
   * @param key The counter key
   * @param increment Amount to increment (default: 1)
   * @returns The new counter value
   */
  public async incrementCounter(key: string, increment: number = 1): Promise<number> {
    return await this.client.incrBy(key, increment);
  }

  /**
   * Atomically decrements a counter by the specified amount
   * @param key The counter key
   * @param decrement Amount to decrement (default: 1)
   * @returns The new counter value
   */
  public async decrementCounter(key: string, decrement: number = 1): Promise<number> {
    return await this.client.decrBy(key, decrement);
  }

  /**
   * Gets counter value if it exists
   * @param key The counter key
   * @returns The counter value or null if it doesn't exist
   */
  public async getCounter(key: string): Promise<number | null> {
    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : null;
  }

  /**
   * Initializes a counter with a specified value
   * @param key The counter key
   * @param value Initial value
   * @param ttl Optional TTL in seconds
   * @returns True if counter was set, false if it already exists
   */
  public async initCounter(key: string, value: number, ttl?: number): Promise<boolean> {
    const result = await this.client.set(key, value.toString(), ttl ? { NX: true, EX: ttl } : { NX: true });
    return result === "OK";
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

  public async setMap(key: string, map: Map<string, string>, ttl?: number, NX = false): Promise<boolean> {
    try {
      const exists = (await this.client.exists(key)) > 0;
      if (NX && exists) return false;

      const hashData = Object.fromEntries(map);

      if (Object.keys(hashData).length === 0) return true;

      const multi = this.client.multi();
      multi.hSet(key, hashData);

      if (ttl) multi.expire(key, ttl);

      await multi.exec();
      return true;
    } catch (error) {
      logger.error(`Error in setMap for key ${key}:`, error);
      return false;
    }
  }

  public async setList(key: string, value: string | string[], ttl?: number, NX = true): Promise<boolean> {
    try {
      const exists = (await this.client.exists(key)) > 0;
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
