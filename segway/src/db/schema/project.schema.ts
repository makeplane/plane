import {
  integer,
  jsonb,
  uuid,
  text,
  boolean,
  pgTable,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, workspaces } from "./base.schema";

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
