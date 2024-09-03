type RedisConfig = string | { host: string; port: number } | null;

export function getRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL?.trim();
  const redisHost = process.env.REDIS_HOST?.trim();
  const redisPort = process.env.REDIS_PORT?.trim();

  if (redisUrl) {
    return redisUrl;
  }

  if (redisHost && redisPort && !Number.isNaN(Number(redisPort))) {
    return `redis://${redisHost}:${redisPort}`;
  }

  return "";
}
