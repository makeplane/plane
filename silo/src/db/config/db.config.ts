import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import { env } from "@/env";

export const connection = postgres(env.DB_URL || "");

export const db = drizzle(connection, { schema });
