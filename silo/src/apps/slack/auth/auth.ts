import { env } from "@/env";
import { createSlackAuth } from "@plane/etl/slack";

export const slackAuth = createSlackAuth(
  env.SLACK_CLIENT_ID,
  env.SLACK_CLIENT_SECRET,
  encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/slack/user/auth/callback"),
  encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/slack/team/auth/callback")
);
