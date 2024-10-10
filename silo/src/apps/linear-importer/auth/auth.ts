import { env } from "@/env";
import { LinearAuth } from "@silo/linear";

export const linearAuth = new LinearAuth({
  clientId: env.LINEAR_CLIENT_ID,
  clientSecret: env.LINEAR_CLIENT_SECRET,
  callbackURL: "/silo/api/linear/auth/callback",
});
