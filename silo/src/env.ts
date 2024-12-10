import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // App Env Variables
  BATCH_SIZE: z.string().default("50"),
  PORT: z.string().default("3000"),
  DEDUP_INTERVAL: z.string().optional().default("3"),
  DB_URL: z.string().default("postgres://postgres:password@localhost:5432/silo"),
  AMQP_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SENTRY_DSN: z.string().optional(),
  PG_SCHEMA: z.string().optional(),
  APP_BASE_URL: z.string().default(""),
  API_BASE_URL: z.string().default(""),
  SILO_API_BASE_URL: z.string().default(""),
  WEBHOOK_SECRET: z.string().default("plane-silo"),
  MQ_PREFETCH_COUNT: z.string().default("5"),
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
