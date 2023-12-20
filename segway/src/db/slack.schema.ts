import {
  integer,
  jsonb,
  uuid,
  text,
  boolean,
  pgTable,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey(),
  title: text("title"),
  provider: text("provider"),
  network: integer("network"),
  description: jsonb("description"),
  author: text("author"),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  redirectUrl: text("redirect_url"),
  metadata: jsonb("metadata"),
});

export const workspaceIntegrations = pgTable("workspace_integrations", {
  id: uuid("id").primaryKey(),
  metadata: jsonb("metadata"),
  config: jsonb("config"),
  actorId: uuid("actor_id"),
  apiTokenId: uuid("api_token_id"),
  integrationId: uuid("integration_id"),
  workspaceId: uuid("workspace_id"),
});

export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey(),
  token: text("token"),
  label: text("label"),
  userType: integer("user_type"),
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  userId: uuid("user_id"),
  workspaceId: uuid("workspace_id"),
  description: text("description"),
  isActive: boolean("is_active"),
});

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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  descriptionText: jsonb("description_text"),
  identifier: text("identifier"),
  createdById: uuid("created_by_id"),
  defaultAssigneeId: uuid("default_assignee_id"),
  projectLeadId: uuid("project_lead_id"),
  updatedById: uuid("updated_by_id"),
  workspaceId: uuid("workspace_id"),
  coverImage: text("cover_image"),
  defaultStateId: uuid("default_state_id"),
});

export const states = pgTable("states", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  color: text("color"),
  slug: text("slug"),
  projectId: uuid("project_id"),
  workspaceId: uuid("workspace_id"),
  sequence: integer("sequence"),
  group: text("group"),
  default: boolean("default"),
});

export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey(),
  comment: text("comment"),
  role: integer("role"),
  memberId: uuid("member_id"),
  projectId: uuid("project_id"),
  workspaceId: uuid("workspace_id"),
  viewProps: jsonb("view_props"),
  defaultProps: jsonb("default_props"),
  sortOrder: integer("sort_order"),
  isActive: boolean("is_active"),
});

export const projectLabels = pgTable("labels", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  projectId: uuid("project_id"),
  workspaceId: uuid("workspace_id"),
  parentId: uuid("parent_id"),
  color: text("color"),
  sortOrder: integer("sort_order"),
});

export const projectlabelsRelations = relations(projectLabels, ({ one }) => ({
  project: one(projects, {
    fields: [projectLabels.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [projectLabels.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(projectLabels, {
    fields: [projectLabels.parentId],
    references: [projectLabels.id],
  }),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  member: one(users, {
    fields: [projectMembers.memberId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [projectMembers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const statesRelations = relations(states, ({ one }) => ({
  project: one(projects, {
    fields: [states.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [states.workspaceId],
    references: [workspaces.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  defaultAssignee: one(users, {
    fields: [projects.defaultAssigneeId],
    references: [users.id],
  }),
  projectLead: one(users, {
    fields: [projects.projectLeadId],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [projects.updatedById],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
}));

export const workspaceIntegrationsRelations = relations(
  workspaceIntegrations,
  ({ one }) => ({
    actor: one(users, {
      fields: [workspaceIntegrations.actorId],
      references: [users.id],
    }),
    apiToken: one(apiTokens, {
      fields: [workspaceIntegrations.apiTokenId],
      references: [apiTokens.id],
    }),
    integration: one(integrations, {
      fields: [workspaceIntegrations.integrationId],
      references: [integrations.id],
    }),
    workspace: one(workspaces, {
      fields: [workspaceIntegrations.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, {
    fields: [apiTokens.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [apiTokens.workspaceId],
    references: [workspaces.id],
  }),
}));

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
