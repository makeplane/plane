/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Unit tests for RedisManager credential rotation and reconnect behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EventEmitter } from "events";

// ── Mocks ──────────────────────────────────────────────────────────────────

// Track all created Redis instances so tests can inspect/trigger events
type FakeRedis = EventEmitter & {
  ping: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

let redisInstances: FakeRedis[] = [];

vi.mock("ioredis", () => {
  return {
    default: class FakeRedisClient {
      private listeners = new Map<string, ((...args: unknown[]) => void)[]>();
      ping = vi.fn().mockResolvedValue("PONG");
      quit = vi.fn().mockResolvedValue("OK");
      disconnect = vi.fn();

      on = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        const list = this.listeners.get(event) ?? [];
        list.push(cb);
        this.listeners.set(event, list);
        return this;
      });

      emit(event: string, ...args: unknown[]) {
        for (const cb of this.listeners.get(event) ?? []) cb(...args);
      }

      constructor() {
        redisInstances.push(this as unknown as FakeRedis);
      }
    },
  };
});

const mockGetSecret = vi.fn();
vi.mock("@/lib/aws-secrets", () => ({
  getSecret: (...args: unknown[]) => mockGetSecret(...args) as Promise<Record<string, unknown>>,
}));

vi.mock("@plane/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mutable env object we swap per test
const mockEnv: Record<string, unknown> = {};
vi.mock("@/env", () => ({
  get env() {
    return mockEnv;
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function setEnv(overrides: Record<string, unknown>) {
  // Reset
  for (const k of Object.keys(mockEnv)) delete mockEnv[k];
  Object.assign(mockEnv, overrides);
}

async function freshRedisManager() {
  vi.resetModules();
  // Re-apply mocks after resetModules by re-importing (vitest hoists vi.mock)
  const mod = await import("@/redis");
  return mod.RedisManager.getInstance();
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("RedisManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    redisInstances = [];
    mockGetSecret.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("WRONGPASS/NOAUTH auto-reconnect", () => {
    it("triggers reconnect on WRONGPASS when using ElastiCache", async () => {
      setEnv({
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        AWS_REGION: "us-east-1",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        REDIS_AUTH_TOKEN_KEY: "token",
        REDIS_HOST_KEY: "host",
        REDIS_PORT_KEY: "port",
        AWS_SECRET_CACHE_TTL: 300,
      });

      mockGetSecret.mockResolvedValue({ token: "pass1", host: "redis.test", port: "6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      expect(redisInstances).toHaveLength(1);
      const firstClient = redisInstances[0];

      // Simulate a WRONGPASS error from Redis
      mockGetSecret.mockResolvedValue({ token: "pass2", host: "redis.test", port: "6379" });
      firstClient.emit("error", new Error("WRONGPASS invalid username-password"));

      // Let the async reconnect settle
      await vi.runAllTimersAsync();

      // Should have created a second Redis client (reconnected)
      expect(redisInstances).toHaveLength(2);
      expect(firstClient.quit).toHaveBeenCalled();
    });

    it("does NOT trigger reconnect on WRONGPASS without ELASTICACHE_SECRET_ARN", async () => {
      setEnv({ REDIS_URL: "redis://localhost:6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      const client = redisInstances[0];
      client.emit("error", new Error("WRONGPASS invalid username-password"));
      await vi.runAllTimersAsync();

      // No reconnect — still just 1 instance
      expect(redisInstances).toHaveLength(1);
      expect(client.quit).not.toHaveBeenCalled();
    });

    it("triggers reconnect on NOAUTH error", async () => {
      setEnv({
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        AWS_REGION: "us-east-1",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        REDIS_AUTH_TOKEN_KEY: "token",
        REDIS_HOST_KEY: "host",
        REDIS_PORT_KEY: "port",
        AWS_SECRET_CACHE_TTL: 300,
      });

      mockGetSecret.mockResolvedValue({ token: "pass1", host: "redis.test", port: "6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      const firstClient = redisInstances[0];
      firstClient.emit("error", new Error("NOAUTH Authentication required"));
      await vi.runAllTimersAsync();

      expect(redisInstances).toHaveLength(2);
    });
  });

  describe("concurrency guard", () => {
    it("prevents multiple concurrent reconnects from rapid errors", async () => {
      setEnv({
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        AWS_REGION: "us-east-1",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        REDIS_AUTH_TOKEN_KEY: "token",
        REDIS_HOST_KEY: "host",
        REDIS_PORT_KEY: "port",
        AWS_SECRET_CACHE_TTL: 300,
      });

      mockGetSecret.mockResolvedValue({ token: "pass1", host: "redis.test", port: "6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      const firstClient = redisInstances[0];

      // Fire 3 WRONGPASS errors rapidly
      firstClient.emit("error", new Error("WRONGPASS"));
      firstClient.emit("error", new Error("WRONGPASS"));
      firstClient.emit("error", new Error("WRONGPASS"));
      await vi.runAllTimersAsync();

      // Should only reconnect once (2 total instances: original + 1 reconnect)
      expect(redisInstances).toHaveLength(2);
    });
  });

  describe("scheduled secret refresh", () => {
    it("reconnects when secret changes on scheduled check", async () => {
      setEnv({
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        AWS_REGION: "us-east-1",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        REDIS_AUTH_TOKEN_KEY: "token",
        REDIS_HOST_KEY: "host",
        REDIS_PORT_KEY: "port",
        AWS_SECRET_CACHE_TTL: 60,
      });

      mockGetSecret.mockResolvedValue({ token: "pass1", host: "redis.test", port: "6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      expect(redisInstances).toHaveLength(1);

      // Secret rotates
      mockGetSecret.mockResolvedValue({ token: "pass2-rotated", host: "redis.test", port: "6379" });

      // Advance past the TTL interval (60s)
      await vi.advanceTimersByTimeAsync(61_000);

      // Should have disconnected old + created new
      expect(redisInstances).toHaveLength(2);
      expect(redisInstances[0].quit).toHaveBeenCalled();
    });

    it("does NOT reconnect when secret is unchanged", async () => {
      setEnv({
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        AWS_REGION: "us-east-1",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        REDIS_AUTH_TOKEN_KEY: "token",
        REDIS_HOST_KEY: "host",
        REDIS_PORT_KEY: "port",
        AWS_SECRET_CACHE_TTL: 60,
      });

      mockGetSecret.mockResolvedValue({ token: "pass1", host: "redis.test", port: "6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      // Same secret returned
      await vi.advanceTimersByTimeAsync(61_000);

      // No reconnect
      expect(redisInstances).toHaveLength(1);
      expect(redisInstances[0].quit).not.toHaveBeenCalled();
    });
  });

  describe("URL resolution priority", () => {
    it("prefers REDIS_URL over Secrets Manager", async () => {
      setEnv({
        REDIS_URL: "redis://explicit:6379",
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        AWS_REGION: "us-east-1",
      });

      const manager = await freshRedisManager();
      await manager.initialize();

      // Should NOT have called getSecret since REDIS_URL takes precedence
      expect(mockGetSecret).not.toHaveBeenCalled();
      expect(redisInstances).toHaveLength(1);
    });

    it("disables Redis when no URL source is configured", async () => {
      setEnv({});

      const manager = await freshRedisManager();
      await manager.initialize();

      expect(manager.isClientConnected()).toBe(false);
      expect(manager.getClient()).toBeNull();
    });
  });

  describe("disconnect cleanup", () => {
    it("clears the refresh interval on disconnect", async () => {
      setEnv({
        AWS_ROLE_ARN: "arn:aws:iam::role/test",
        AWS_REGION: "us-east-1",
        ELASTICACHE_SECRET_ARN: "arn:aws:secretsmanager:us-east-1:123:secret:redis",
        REDIS_AUTH_TOKEN_KEY: "token",
        REDIS_HOST_KEY: "host",
        REDIS_PORT_KEY: "port",
        AWS_SECRET_CACHE_TTL: 60,
      });

      mockGetSecret.mockResolvedValue({ token: "pass1", host: "redis.test", port: "6379" });

      const manager = await freshRedisManager();
      await manager.initialize();

      await manager.disconnect();

      // Rotate secret after disconnect
      mockGetSecret.mockResolvedValue({ token: "pass2", host: "redis.test", port: "6379" });
      await vi.advanceTimersByTimeAsync(120_000);

      // Should NOT have reconnected (interval was cleared)
      // 1 from init, no new ones after disconnect
      expect(redisInstances).toHaveLength(1);
    });
  });
});
