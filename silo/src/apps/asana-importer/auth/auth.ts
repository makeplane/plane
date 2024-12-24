import { env } from "@/env";
import { createAsanaAuthService } from "@plane/etl/asana";

export const asanaAuth = createAsanaAuthService(
  env.ASANA_CLIENT_ID,
  env.ASANA_CLIENT_SECRET,
  "/silo/api/asana/auth/callback"
);
