import { varchar, jsonb, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { credentials } from "./cred.schema";
import { schema } from "./schema";

/*
 * `workspace_connections` table maintain top level connections with plane
 * workspace and external entity's primary connection, such as github organization,
 * We can have multiple connections for a workspace.
 */
export const workspaceConnections = schema.table(
  "workspace_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // WorkspaceId of plane
    workspaceId: uuid("workspace_id").notNull(),
    workspaceSlug: varchar("workspace_slug", { length: 255 }).notNull(),
    targetHostname: varchar("target_hostname", { length: 255 }).notNull(),
    sourceHostname: varchar("source_hostname", { length: 255 }),

    // The actual connection type such as GITHUB, GITLAB, INTERCOM, SLACK
    connectionType: varchar("connection_type", { length: 50 }).notNull(),

    // Connection Id is the actual connection id for the connection type, such
    // as the github organization id, or the slack organization id
    connectionId: varchar("connection_id", { length: 255 }).notNull(),
    connectionData: jsonb("connection_data").default({}),
    credentialsId: uuid("credentials_id")
      .notNull()
      .references(() => credentials.id),

    // Config Stored
    config: jsonb("config").default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      workspaceIdIdx: index("workspace_connections_workspace_id_idx").on(table.workspaceId),
    };
  }
);

// Entity Type can be a secondary entity for a platform, such as for github
// an organization connection is primary and handled at workspaceConnection,
// while this connection can have multiple project and repository
// connection, those will be linked with this table
export const entityConnections = schema.table(
  "entity_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Entity Type can be a github repository, and entity id can be the repository id
    entityId: varchar("entity_id", { length: 255 }).notNull(),
    entitySlug: varchar("entity_slug", { length: 255 }).notNull(),
    entityData: jsonb("entity_data").default({}),

    // Project and WorkspaceId of Plane
    projectId: uuid("project_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    workspaceSlug: varchar("workspace_slug", { length: 255 }).notNull(),

    // Linked Workspace Connection Id
    workspaceConnectionId: uuid("workspace_connection_id")
      .notNull()
      .references(() => workspaceConnections.id),

    config: jsonb("config").default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      workspaceIdIdx: index("entity_connections_workspace_id_idx").on(table.workspaceId),
    };
  }
);
