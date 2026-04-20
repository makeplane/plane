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

import type {
  Comment as JComment,
  ComponentWithIssueCount,
  Priority as JiraPriority,
  Project as JiraProject,
  StatusDetails as JiraStatus,
  FieldDetails,
  Issue,
  IssueTypeWithStatus as JiraStates,
  IssueTypeDetails as JiraIssueTypeDetails,
  CustomFieldContextOption,
  ChangeDetails as JiraChangeDetails,
} from "jira.js/out/version2/models/index.js";
import type { ExProject, ExState, ExModule, ExCycle, ExIssueType, PlaneUser, ExIssueAttachment } from "@plane/sdk";

export type JiraProps = {
  hostname: string;
  patToken: string;
  email: string;
  authenticationType: EJiraAuthenticationType;
};

export enum EJiraAuthenticationType {
  BASIC = "basic",
  PERSONAL_ACCESS_TOKEN = "personalAccessToken",
}

export type ImportedJiraUser = {
  user_id: string;
  user_name: string;
  full_name: string;
  email: string;
  user_status: string;
  added_to_org: string;
  org_role: string;
  avatarUrl: string;
};

export type JiraApiUser = {
  self: string;
  key: string;
  name: string;
  emailAddress?: string;
  accountType?: string;
  avatarUrls: {
    "16x16": string;
    "24x24": string;
    "32x32": string;
    "48x48": string;
  };
  displayName: string;
  active: boolean;
  deleted: boolean;
  timeZone: string;
  locale: string;
};

export type JiraPriorityScheme = {
  self: string;
  id: number;
  name: string;
  description: string;
  optionIds: string[];
  defaultScheme: boolean;
};

export type JiraComment = JComment & {
  issue_id: string;
};

export type JiraSprintObject = {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  createdDate?: string;
};

export interface PaginatedResponse {
  total?: number;
  [key: string]: any; // Allow dynamic properties
}

export type JiraSprint = {
  sprint: JiraSprintObject;
  issues: IJiraIssue[];
};

export type JiraComponent = {
  component: ComponentWithIssueCount;
  issues: IJiraIssue[];
};

export type JiraEntity = {
  labels: string[];
  issues: IJiraIssue[];
  users: ImportedJiraUser[];
  issue_comments: JiraComment[];
  sprints: JiraSprint[];
  components: JiraComponent[];
  issueTypes: JiraIssueTypeDetails[];
  issueFields: JiraIssueField[];
};

export interface IResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

// Define the type for IssueType
export interface IIssueTypeConfig {
  name: string;
  value: string;
}

// Define the type for Label
export interface ILabelConfig {
  name: string;
  value: boolean;
}

// Define the type for State
export interface IStateConfig {
  source_state: JiraStatus;
  target_state: ExState;
}

// Define the type for Priority
export interface IPriorityConfig {
  source_priority: JiraPriority;
  target_priority: string;
}

export type JiraConfig = {
  issues: number;
  // Users are string, as not we are saving the csv string into the config
  users: string;
  resource?: IResource;
  project: JiraProject;
  planeProject: ExProject;
  issueType: string;
  label: ILabelConfig[];
  state: IStateConfig[];
  priority: IPriorityConfig[];
  skipUserImport: boolean;
  useCustomJql?: boolean;
  jql?: string;
  importEpicsAsWorkItems?: boolean;
  importWorkItemTypesGlobally?: boolean;
};

export type JiraAuthState = {
  apiToken: string;
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
};

export type JiraPATAuthState = {
  workspaceId: string;
  userId: string;
  apiToken: string;
  personalAccessToken: string;
  userEmail: string;
  hostname: string;
};

export type JiraAuthPayload = {
  state: string;
  code: string;
};

export type JiraAuthProps = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  authorizeURL: string;
  tokenURL: string;
};

export type JiraIssueField = FieldDetails & {
  options?: JiraIssueFieldOptions[];
};

export type JiraIssueFieldOptions = CustomFieldContextOption & {
  fieldId: string;
};

// Define the Jira migrator class
export type TJiraIssueWithChildren = IJiraIssue & {
  children?: TJiraIssueWithChildren[];
};

export type IJiraIssue = Issue;

export type { JiraProject, JiraStates, JiraStatus, JiraPriority };

export type { JiraCustomFieldKeys } from "./custom-fields";

export type JiraIssueActivity = {
  id: string;
  author: JiraApiUser;
  created: string;
  items: JiraChangeDetails[];
};

export type TTransformationMaps = {
  moduleMap: Map<string, string>;
  cycleMap: Map<string, string>;
  stateMap: Map<string, string>;
  priorityMap: Map<string, string>;
  issueTypeMap: Map<string, string>;
  attachmentMap: Map<string, string>;
};
