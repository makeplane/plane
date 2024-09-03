export function parseRedisUrl(redisUrl: string) {
  try {
    const url = new URL(redisUrl);
    const redisHost = url.hostname || "localhost"; // Default Redis host is localhost
    const redisPort = Number(url.port) || 6379; // Default Redis port is 6379

    return { redisHost, redisPort };
  } catch (error) {
    console.error("Invalid Redis URL:", error);
    return null;
  }
}
