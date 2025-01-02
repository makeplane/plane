import { env } from "@/env";
import { createLinearAuthService } from "@plane/etl/linear";

export const linearAuth = createLinearAuthService(
  env.LINEAR_CLIENT_ID,
  env.LINEAR_CLIENT_SECRET,
  `${env.SILO_BASE_PATH}/api/linear/auth/callback`
);
