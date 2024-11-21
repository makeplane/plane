import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // App Env Variables
  BATCH_SIZE: z.string(),
  PORT: z.string().min(1),
  DB_URL: z.string().min(1),
  AMQP_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SENTRY_DSN: z.string().min(1),
  APP_BASE_URL: z.string().min(1),
  SILO_API_BASE_URL: z.string().min(1),
  MQ_PREFETCH_COUNT: z.string().default("5"),
  // Jira Env Variables
  JIRA_CLIENT_ID: z.string().min(1),
  JIRA_CLIENT_SECRET: z.string().min(1),
  // Linear Env Variables
  LINEAR_CLIENT_ID: z.string().min(1),
  LINEAR_CLIENT_SECRET: z.string().min(1),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(result.error.format(), null, 4));
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
