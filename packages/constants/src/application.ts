/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export enum EApplicationAuthorizationGrantType {
  AUTHORIZATION_CODE = "authorization-code",
  CLIENT_CREDENTIALS = "client-credentials",
}

export const AUTHORIZATION_GRANT_TYPES_MAP = {
  [EApplicationAuthorizationGrantType.AUTHORIZATION_CODE]: "User-Level Connection",
  [EApplicationAuthorizationGrantType.CLIENT_CREDENTIALS]: "Workspace-Level Connection",
};

export const GLOBAL_PERMISSION_SCOPE = {
  key: "global",
  title: "All Workspace Resources",
  description: "Read and write access to all resources in the workspace (will be deprecated in the future)",
  read_permission: "read",
  write_permission: "write",
};

export const RESOURCE_PERMISSIONS_GROUPS = [
  {
    group_key: "projects",
    title: "Projects",
    description: "Access to projects, and all project related entities",
    scopes: [
      {
        key: "projects",
        title: "Projects",
        description: "Projects",
        read_permission: "projects:read",
        write_permission: "projects:write",
      },
      {
        key: "projects.features",
        title: "Project Features",
        description: "Project features and all related entities",
        read_permission: "projects.features:read",
        write_permission: "projects.features:write",
      },
      {
        key: "projects.members",
        title: "Project Members",
        description: "Project members and all related entities",
        read_permission: "projects.members:read",
        write_permission: "projects.members:write",
      },
      {
        key: "projects.states",
        title: "Project States",
        description: "Project states and all related entities",
        read_permission: "projects.states:read",
        write_permission: "projects.states:write",
      },
      {
        key: "projects.labels",
        title: "Project Labels",
        description: "Project labels and all related entities",
        read_permission: "projects.labels:read",
        write_permission: "projects.labels:write",
      },
      {
        key: "projects.intakes",
        title: "Intakes",
        description: "Project intakes and all related entities",
        read_permission: "projects.intakes:read",
        write_permission: "projects.intakes:write",
      },
      {
        key: "projects.epics",
        title: "Epics",
        description: "Project epics and all related entities",
        read_permission: "projects.epics:read",
        write_permission: "projects.epics:write",
      },
      {
        key: "projects.cycles",
        title: "Cycles",
        description: "Project cycles and all related entities",
        read_permission: "projects.cycles:read",
        write_permission: "projects.cycles:write",
      },
      {
        key: "projects.pages",
        title: "Project Pages",
        description: "Project pages and all related entities",
        read_permission: "projects.pages:read",
        write_permission: "projects.pages:write",
      },
      {
        key: "projects.modules",
        title: "Modules",
        description: "Project modules and all related entities",
        read_permission: "projects.modules:read",
        write_permission: "projects.modules:write",
      },
      {
        key: "projects.milestones",
        title: "Milestones",
        description: "Project milestones and all related entities",
        read_permission: "projects.milestones:read",
        write_permission: "projects.milestones:write",
      },
      {
        key: "projects.estimates",
        title: "Estimates",
        description: "Project estimates and all related entities",
        read_permission: "projects.estimates:read",
        write_permission: "projects.estimates:write",
      },
      {
        key: "projects.work_items",
        title: "Work Items",
        description: "Project Work Items",
        read_permission: "projects.work_items:read",
        write_permission: "projects.work_items:write",
      },
      {
        key: "projects.work_items.comments",
        title: "Work Item Comments",
        description: "Project work item comments and all related entities",
        read_permission: "projects.work_items.comments:read",
        write_permission: "projects.work_items.comments:write",
      },
      {
        key: "projects.work_items.attachments",
        title: "Work Item Attachments",
        description: "Project work item attachments and all related entities",
        read_permission: "projects.work_items.attachments:read",
        write_permission: "projects.work_items.attachments:write",
      },
      {
        key: "projects.work_items.links",
        title: "Work Item Links",
        description: "Project work item links and all related entities",
        read_permission: "projects.work_items.links:read",
        write_permission: "projects.work_items.links:write",
      },
      {
        key: "projects.work_items.relations",
        title: "Work Item Relations",
        description: "Project work item relations and all related entities",
        read_permission: "projects.work_items.relations:read",
        write_permission: "projects.work_items.relations:write",
      },
      {
        key: "projects.work_items.activities",
        title: "Work Item Activities",
        description: "Project work item activities and all related entities",
        read_permission: "projects.work_items.activities:read",
        write_permission: "projects.work_items.activities:write",
      },
      {
        key: "projects.work_items.worklogs",
        title: "Work Item Worklogs",
        description: "Project work item worklogs and all related entities",
        read_permission: "projects.work_items.worklogs:read",
        write_permission: "projects.work_items.worklogs:write",
      },
      {
        key: "projects.work_item_types",
        title: "Work Item Types",
        description: "Project work item types and all related entities",
        read_permission: "projects.work_item_types:read",
        write_permission: "projects.work_item_types:write",
      },
      {
        key: "projects.work_item_properties",
        title: "Work Item Properties",
        description: "Project work item properties and all related entities",
        read_permission: "projects.work_item_properties:read",
        write_permission: "projects.work_item_properties:write",
      },
      {
        key: "projects.work_item_property_options",
        title: "Work Item Property Options",
        description: "Project work item property options and all related entities",
        read_permission: "projects.work_item_property_options:read",
        write_permission: "projects.work_item_property_options:write",
      },
      {
        key: "projects.work_item_property_values",
        title: "Work Item Property Values",
        description: "Project work item property values and all related entities",
        read_permission: "projects.work_item_property_values:read",
        write_permission: "projects.work_item_property_values:write",
      },
    ],
  },
  {
    group_key: "wiki",
    title: "Wiki",
    description: "Wiki and all related entities",
    scopes: [
      {
        key: "wiki.pages",
        title: "Wiki Pages",
        description: "Wiki pages and all related entities",
        read_permission: "wiki.pages:read",
        write_permission: "wiki.pages:write",
      },
    ],
  },
  {
    group_key: "customers",
    title: "Customers",
    description: "Customers and all related entities",
    scopes: [
      {
        key: "customers",
        title: "Customers",
        description: "Customers",
        read_permission: "customers:read",
        write_permission: "customers:write",
      },
      {
        key: "customers.requests",
        title: "Customer Requests",
        description: "Customer requests and all related entities",
        read_permission: "customers.requests:read",
        write_permission: "customers.requests:write",
      },
      {
        key: "customers.properties",
        title: "Customer Properties",
        description: "Customer properties and all related entities",
        read_permission: "customers.properties:read",
        write_permission: "customers.properties:write",
      },
      {
        key: "customers.property_values",
        title: "Customer Property Values",
        description: "Customer property values and all related entities",
        read_permission: "customers.property_values:read",
        write_permission: "customers.property_values:write",
      },
      {
        key: "customers.work_items",
        title: "Customer Work Items",
        description: "Customer work items and all related entities",
        read_permission: "customers.work_items:read",
        write_permission: "customers.work_items:write",
      },
    ],
  },
  {
    group_key: "initiatives",
    title: "Initiatives",
    description: "Initiatives and all related entities",
    scopes: [
      {
        key: "initiatives",
        title: "Initiatives",
        description: "Initiatives",
        read_permission: "initiatives:read",
        write_permission: "initiatives:write",
      },
      {
        key: "initiatives.projects",
        title: "Initiative Projects",
        description: "Initiative projects and all related entities",
        read_permission: "initiatives.projects:read",
        write_permission: "initiatives.projects:write",
      },
      {
        key: "initiatives.epics",
        title: "Initiative Epics",
        description: "Initiative epics and all related entities",
        read_permission: "initiatives.epics:read",
        write_permission: "initiatives.epics:write",
      },
      {
        key: "initiatives.labels",
        title: "Initiative Labels",
        description: "Initiative labels and all related entities",
        read_permission: "initiatives.labels:read",
        write_permission: "initiatives.labels:write",
      },
    ],
  },
  {
    group_key: "workspaces",
    title: "Workspaces",
    description: "Workspace-level metadata and settings",
    scopes: [
      {
        key: "workspaces.members",
        title: "Workspace Members",
        description: "Workspace members and all related entities",
        read_permission: "workspaces.members:read",
      },
      {
        key: "workspaces.features",
        title: "Workspace Features",
        description: "Workspace features and all related entities",
        read_permission: "workspaces.features:read",
        write_permission: "workspaces.features:write",
      },
    ],
  },
  {
    group_key: "stickies",
    title: "Stickies",
    description: "Stickies and all related entities",
    scopes: [
      {
        key: "stickies",
        title: "Stickies",
        description: "Stickies",
        read_permission: "stickies:read",
        write_permission: "stickies:write",
      },
    ],
  },
  {
    group_key: "teamspaces",
    title: "Teamspaces",
    description: "Teamspaces and all related entities",
    scopes: [
      {
        key: "teamspaces",
        title: "Teamspaces",
        description: "Teamspaces",
        read_permission: "teamspaces:read",
        write_permission: "teamspaces:write",
      },
      {
        key: "teamspaces.projects",
        title: "Teamspace Projects",
        description: "Teamspace projects and all related entities",
        read_permission: "teamspaces.projects:read",
        write_permission: "teamspaces.projects:write",
      },
      {
        key: "teamspaces.members",
        title: "Teamspace Members",
        description: "Teamspace members and all related entities",
        read_permission: "teamspaces.members:read",
        write_permission: "teamspaces.members:write",
      },
    ],
  },
  {
    group_key: "profile",
    title: "Profile",
    description: "User profile information",
    scopes: [
      {
        key: "profile",
        title: "Profile",
        description: "User profile information",
        read_permission: "profile:read",
      },
    ],
  },
  {
    group_key: "assets",
    title: "Assets",
    description: "Assets and all related entities",
    scopes: [
      {
        key: "assets",
        title: "Assets",
        description: "Assets",
        read_permission: "assets:read",
        write_permission: "assets:write",
      },
    ],
  },
  {
    group_key: "agents",
    title: "Agents",
    description: "Agents and all related entities",
    scopes: [
      {
        key: "agents.runs",
        title: "Agent Runs",
        description: "Agent runs and all related entities",
        read_permission: "agents.runs:read",
        write_permission: "agents.runs:write",
      },
      {
        key: "agents.run_activities",
        title: "Agent Run Activities",
        description: "Agent run activities and all related entities",
        read_permission: "agents.run_activities:read",
        write_permission: "agents.run_activities:write",
      },
    ],
  },
];
