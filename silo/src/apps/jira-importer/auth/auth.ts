import { env } from "@/env";
import { createJiraAuth } from "@plane/etl/jira";

export const jiraAuth = createJiraAuth(
  env.JIRA_CLIENT_ID,
  env.JIRA_CLIENT_SECRET,
  "/silo/api/jira/auth/callback",
  "https://auth.atlassian.com/authorize",
  "https://auth.atlassian.com/oauth/token"
);
