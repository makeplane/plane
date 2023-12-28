import { uuid, text, jsonb, timestamp, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, workspaces } from "./base.schema";
import { projects } from "./project.schema";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  data: jsonb("data"),
  entityIdentifier: uuid("entity_identifier"),
  entityName: text("entity_name"),
  title: text("title"),
  message: jsonb("message"),
  messageHtml: text("message_html"),
  messageStripped: text("message_stripped"),
  sender: text("sender"),
  readAt: timestamp("read_at"),
  snoozedTill: timestamp("snoozed_till"),
  archivedAt: timestamp("archived_at"),
  createdById: uuid("created_by_id"),
  projectId: uuid("project_id"),
  receiverId: uuid("receiver_id").notNull(),
  triggeredById: uuid("triggered_by_id"),
  updatedById: uuid("updated_by_id"),
  workspaceId: uuid("workspace_id").notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  receiver: one(users, {
    fields: [notifications.receiverId],
    references: [users.id],
  }),
  triggeredBy: one(users, {
    fields: [notifications.triggeredById],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  updatedBy: one(users, {
    fields: [notifications.updatedById],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [notifications.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [notifications.createdById],
    references: [users.id],
  }),
}));
