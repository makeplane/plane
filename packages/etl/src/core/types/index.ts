export * from "./feature-flag";
export * from "./workspace-connections";
export * from "./entity-connections";
export * from "./error";

import {
  ExIssueProperty,
  ExCycle,
  ExIssue,
  ExIssueLabel,
  PlaneUser,
  ExIssuePropertyValue,
  ExIssueComment,
  ExModule,
  ExIssueType,
  ExIssuePropertyOption,
  ExPage,
} from "@plane/sdk";
import { E_INTEGRATION_KEYS } from "@plane/types";

export type TServiceCredentials = {
  id: string;
  source: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  is_active: boolean;
  source_access_token: string;
  source_refresh_token: string;
  source_hostname: string;
  target_access_token: string;
};

// authentication configuration
export type TServiceAuthConfiguration = {
  isAuthenticated: boolean;
  isOAuthEnabled: boolean;
  sourceTokenInvalid: boolean;
};

// importer types
export enum E_IMPORTER_KEYS {
  JIRA = "JIRA",
  CSV = "CSV",
  JIRA_SERVER = "JIRA_SERVER",
  ASANA = "ASANA",
  LINEAR = "LINEAR",
  TRELLO = "TRELLO",
  FLATFILE = "FLATFILE",
  CLICKUP = "CLICKUP",
  IMPORTER = "IMPORTER",
  NOTION = "NOTION",
  CONFLUENCE = "CONFLUENCE",
}
export type TImporterKeys = keyof typeof E_IMPORTER_KEYS;

export type TIntegrationKeys = keyof typeof E_INTEGRATION_KEYS;

export enum E_ENTITY_CONNECTION_KEYS {
  SLACK_USER = "SLACK-USER",
  GITHUB_USER = "GITHUB-USER",
  GITLAB_USER = "GITLAB-USER",
  PRD_AGENT_USER = "PRD_AGENT-USER",
  SENTRY_USER = "SENTRY-USER",
  GITHUB_ENTERPRISE_USER = "GITHUB_ENTERPRISE-USER",
  GITLAB_ENTERPRISE_USER = "GITLAB_ENTERPRISE-USER",
}

export enum E_INTEGRATION_ENTITY_CONNECTION_MAP {
  GITHUB = E_ENTITY_CONNECTION_KEYS.GITHUB_USER,
  GITLAB = E_ENTITY_CONNECTION_KEYS.GITLAB_USER,
  SLACK = E_ENTITY_CONNECTION_KEYS.SLACK_USER,
  PRD_AGENT = E_ENTITY_CONNECTION_KEYS.PRD_AGENT_USER,
  SENTRY = E_ENTITY_CONNECTION_KEYS.SENTRY_USER,
  GITHUB_ENTERPRISE = E_ENTITY_CONNECTION_KEYS.GITHUB_ENTERPRISE_USER,
  GITLAB_ENTERPRISE = E_ENTITY_CONNECTION_KEYS.GITLAB_ENTERPRISE_USER,
}

export type TEntityConnectionKeys = keyof typeof E_ENTITY_CONNECTION_KEYS;

// job types
export enum E_JOB_STATUS {
  QUEUED = "QUEUED",
  CREATED = "CREATED",
  INITIATED = "INITIATED",
  CANCELLED = "CANCELLED",
  PULLING = "PULLING",
  PULLED = "PULLED",
  TRANSFORMING = "TRANSFORMING",
  TRANSFORMED = "TRANSFORMED",
  PUSHING = "PUSHING",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
  PROGRESSING = "PROGRESSING",
}
export type TJobStatus = keyof typeof E_JOB_STATUS;

export const propertiesToOmit = [
  "id",
  "config",
  "created_at",
  "updated_at",
  "start_time",
  "end_time",
  "project_id",
  "workspace_slug",
] as const;

export type TJobConfigResponse = {
  insertedId: string;
};

export type TPropertyValuesPayload = Record<string, ExIssuePropertyValue>; // property_id -> property_values

export type TIssuePropertyValuesPayload = Record<string, TPropertyValuesPayload>; // issue_id -> property_values_payload

export type PlaneEntities = {
  labels: Partial<ExIssueLabel>[];
  issues: Partial<ExIssue>[];
  users: Partial<PlaneUser>[];
  issue_comments: Partial<ExIssueComment>[];
  cycles: Partial<ExCycle>[];
  modules: Partial<ExModule>[];
  issue_types?: Partial<ExIssueType>[];
  issue_properties?: Partial<ExIssueProperty>[];
  issue_property_options?: Partial<ExIssuePropertyOption>[];
  issue_property_values?: TIssuePropertyValuesPayload;
};

export type TAppKeys = E_INTEGRATION_KEYS | E_IMPORTER_KEYS.IMPORTER;
export type PlanePageEntity = {
  pages: Partial<ExPage>[];
};
