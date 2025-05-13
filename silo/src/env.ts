import * as dotenv from "dotenv";
import { z } from "zod";
import { logger } from "@/logger";
dotenv.config();

const envSchema = z.object({
  // App Env Variables
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BATCH_SIZE: z.string().default("50"),
  PORT: z.string().default("3000"),
  DEDUP_INTERVAL: z.string().optional().default("3"),
  DB_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  AMQP_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  CORS_ALLOWED_ORIGINS: z.string().default("https://app.plane.so"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PG_SCHEMA: z.string().optional(),
  MAX_STORE_CONNECTION_ATTEMPTS: z.string().default("20"),
  MAX_DB_CONNECTION_ATTEMPTS: z.string().default("5"),
  APP_BASE_URL: z
    .string()
    .default("")
    .transform((str) => str.replace(/\/$/, "")),
  API_BASE_URL: z
    .string()
    .default("")
    // Remove the slash at the end of the URL
    .transform((str) => str.replace(/\/$/, "")),
  SILO_API_BASE_URL: z
    .string()
    .default("")
    .transform((str) => str.replace(/\/$/, "")),
  SILO_BASE_PATH: z.string().default(""),
  WEBHOOK_SECRET: z.string().default("plane-silo"),
  MQ_PREFETCH_COUNT: z.string().default("5"),
  SILO_HMAC_SECRET_KEY: z.string().default(""),
  // Feature Flags Env Variables
  FEATURE_FLAG_SERVER_BASE_URL: z.string().optional(),
  FEATURE_FLAG_SERVER_AUTH_TOKEN: z.string().optional(),
  // Jira Env Variables
  JIRA_OAUTH_ENABLED: z.string().default("0"),
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  JIRA_SERVER_OAUTH_ENABLED: z.string().default("0"),
  // Linear Env Variables
  LINEAR_OAUTH_ENABLED: z.string().default("0"),
  LINEAR_CLIENT_ID: z.string().optional(),
  LINEAR_CLIENT_SECRET: z.string().optional(),
  // GitHub Env Variables
  GITHUB_APP_NAME: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  // GitLab Env Variables
  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional().optional(),
  // Asana Env Variables
  ASANA_OAUTH_ENABLED: z.string().default("0"),
  ASANA_CLIENT_ID: z.string().optional(),
  ASANA_CLIENT_SECRET: z.string().optional(),
  // Slack Env Variables
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  // Flatfile Env Variables
  FLATFILE_API_KEY: z.string().optional(),
  // AES Env Variables
  AES_SECRET_KEY: z.string().optional(),
  AES_SALT: z.string().default("aes-salt"),

  // Internal Plane App Env Variables
  PRD_AGENT_CLIENT_ID: z.string().optional(),
  PRD_AGENT_CLIENT_SECRET: z.string().optional(),
});

// Validate the environment variables
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error("❌ Invalid environment variables:", result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
