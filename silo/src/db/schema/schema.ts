import { env } from "@/env";
import { pgSchema } from "drizzle-orm/pg-core";

export const schema = pgSchema(env.PG_SCHEMA || "silo");
