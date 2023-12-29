import { uuid, text, boolean, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaceIntegrations } from "./integrations.schema";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active"),
  role: text("role"),
  isBot: boolean("is_bot"),
  displayName: text("display_name"),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  slug: text("slug"),
  createdById: uuid("created_by_id"),
  ownerId: uuid("owner_id"),
});

export const workspacesRelations = relations(workspaces, ({ one }) => ({
  createdBy: one(users, {
    fields: [workspaces.createdById],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  workspaceIntegrations: one(workspaceIntegrations, {
    fields: [workspaces.id],
    references: [workspaceIntegrations.workspaceId],
  }),
}));
