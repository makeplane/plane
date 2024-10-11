import { pgTable, text, varchar, uuid, timestamp, json, integer, index } from "drizzle-orm/pg-core"

export const jobConfigs = pgTable("job_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  meta: json("meta").default({})
})

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    config: uuid("config_id").references(() => jobConfigs.id),
    migration_type: varchar("migration_type", {
      enum: ["JIRA", "ASANA", "LINEAR", "TRELLO", "GITHUB", "GITLAB", "SLACK"]
    }),
    project_id: uuid("project_id"),
    workspace_id: uuid("workspace_id"),
    workspace_slug: text("workspace_slug"),
    initiator_id: uuid("initiator_id"),
    initiator_email: text("initiator_email"),
    // source info
    completed_batch_count: integer("completed_batch_count").default(0),
    transformed_batch_count: integer("transformed_batch_count").default(0),
    total_batch_count: integer("total_batch_count").default(0),
    // target info
    target_hostname: text("target_hostname"),
    // status
    start_time: timestamp("start_time"),
    end_time: timestamp("end_time"),
    status: varchar("status", {
      enum: ["INITIATED", "PULLING", "TRANSFORMING", "PUSHING", "FINISHED", "ERROR"]
    }).default("INITIATED"),
    // trackers
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
    error: text("error").default("")
  },
  (table) => {
    return {
      // Add indexes on projectId and workspaceSlug, as those would be used mostly for querying jobs
      projectIdx: index("project_idx").on(table.project_id)
    }
  }
)
