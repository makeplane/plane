import { env } from "@/env";
import { createAsanaAuthService } from "@plane/etl/asana";

export const asanaAuth = createAsanaAuthService(
  env.ASANA_CLIENT_ID,
  env.ASANA_CLIENT_SECRET,
  encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/asana/auth/callback")
);
