import { pgTable, text, uuid, index } from "drizzle-orm/pg-core";

export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source"),
    workspace_id: uuid("workspace_id"),
    user_id: uuid("user_id"),
    source_access_token: text("source_access_token"),
    source_refresh_token: text("source_refresh_token"),
    target_access_token: text("target_access_token"),
  },
  (table) => {
    return {
      // Add indexes on projectId and workspaceSlug, as those would be used mostly for querying jobs
      workspaceIdIndex: index("workspace_id_idx").on(table.workspace_id),
    };
  },
);

