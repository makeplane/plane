import * as dotenvx from "@dotenvx/dotenvx";
import { z } from "zod";

// Load environment variables from .env file
dotenvx.config();

// Define environment schema with validation
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000").transform(Number),
  LIVE_BASE_PATH: z.string().default("/live"),

  // CORS configuration
  CORS_ALLOWED_ORIGINS: z.string().default("*"),
  // Compression options
  COMPRESSION_LEVEL: z.string().default("6").transform(Number),
  COMPRESSION_THRESHOLD: z.string().default("5000").transform(Number),

  // Sentry configuration
  LIVE_SENTRY_DSN: z.string().optional(),
  LIVE_SENTRY_RELEASE_VERSION: z.string().optional(),

  // Hocuspocus server configuration
  HOCUSPOCUS_URL: z.string().optional(),
  HOCUSPOCUS_USERNAME: z.string().optional(),
  HOCUSPOCUS_PASSWORD: z.string().optional(),

  // Graceful termination timeout
  SHUTDOWN_TIMEOUT: z.string().default("10000").transform(Number),

  // Live server secret key
  LIVE_SERVER_SECRET_KEY: z.string(),
});

// Validate the environment variables
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(result.error.format(), null, 4));
    process.exit(1);
  }

  return result.data;
}

// Export the validated environment
export const env = validateEnv();
