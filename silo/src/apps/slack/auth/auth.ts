import { env } from "@/env";
import { createSlackAuth } from "@plane/etl/slack";

export const slackAuth = createSlackAuth(
  env.SLACK_CLIENT_ID,
  env.SLACK_CLIENT_SECRET,
  env.SILO_API_BASE_URL + "/silo/api/slack/user/auth/callback",
  env.SILO_API_BASE_URL + "/silo/api/slack/team/auth/callback"
);
