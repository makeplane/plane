import { createLinearAuthService } from "@plane/etl/linear";
import { env } from "@/env";

export const linearAuth = createLinearAuthService(
  env.LINEAR_CLIENT_ID,
  env.LINEAR_CLIENT_SECRET,
  encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/linear/auth/callback")
);
