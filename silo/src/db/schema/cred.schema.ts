import { text, uuid, index } from "drizzle-orm/pg-core";
import { schema } from "./schema";
import { boolean } from "drizzle-orm/pg-core";

export const credentials = schema.table(
  "credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source"),
    workspace_id: uuid("workspace_id"),
    user_id: uuid("user_id"),
    user_email: text("user_email"),
    source_access_token: text("source_access_token"),
    source_refresh_token: text("source_refresh_token"),
    source_hostname: text("source_hostname"),
    target_access_token: text("target_access_token"),
    isPAT: boolean("is_pat").default(false),
    is_active: boolean("is_active").default(true),
  },
  (table) => {
    return {
      // Add indexes on projectId and workspaceSlug, as those would be used mostly for querying jobs
      workspaceIdIndex: index("workspace_id_idx").on(table.workspace_id),
    };
  }
);
