export function getWaitTimeInMs(resetTimestamp: string): number {
  const resetTime = parseInt(resetTimestamp, 10) * 1000; // Convert to milliseconds
  const now = Date.now();
  const waitTime = resetTime - now;
  return Math.max(waitTime, 0); // Ensure we don't return negative wait times
}
