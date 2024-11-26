export * from "./feature-flag";
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
} from "@plane/sdk";

export type TServiceCredentials = {
  id: string;
  source: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  source_access_token: string;
  source_refresh_token: string;
  source_hostname: string;
  target_access_token: string;
};

// authentication configuration
export type TServiceAuthConfiguration = {
  isAuthenticated: boolean;
  isOAuthEnabled: boolean;
};

// importer types
export enum E_IMPORTER_KEYS {
  JIRA = "JIRA",
  ASANA = "ASANA",
  LINEAR = "LINEAR",
  TRELLO = "TRELLO",
}
export type TImporterKeys = keyof typeof E_IMPORTER_KEYS;

// integration types
export enum E_INTEGRATION_KEYS {
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  SLACK = "SLACK",
}
export type TIntegrationKeys = keyof typeof E_INTEGRATION_KEYS;

// job types
export enum E_JOB_STATUS {
  CREATED = "CREATED",
  INITIATED = "INITIATED",
  PULLING = "PULLING",
  PULLED = "PULLED",
  TRANSFORMING = "TRANSFORMING",
  TRANSFORMED = "TRANSFORMED",
  PUSHING = "PUSHING",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
}
export type TJobStatus = keyof typeof E_JOB_STATUS;

export type TJob = {
  id: string;
  config: string;
  migration_type: TImporterKeys | TIntegrationKeys;
  project_id: string;
  workspace_id: string;
  workspace_slug: string;
  credentials_id: string;
  initiator_id: string;
  initiator_email: string;
  source_user_email: string;
  source_hostname: string;
  source_task_count: number;
  start_time?: Date;
  end_time?: Date;
  status: TJobStatus;
  created_at: Date;
  updated_at: Date;
  error: string;
  total_batch_count: number;
  completed_batch_count: number;
  transformed_batch_count: number;
};

export type TJobWithConfig<TJobConfig = unknown> = TJob & {
  config: {
    id: string;
    meta: TJobConfig;
  };
};

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
