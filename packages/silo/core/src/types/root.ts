// service account types
export type TSyncServiceCredentials = {
  id: string;
  source: string;
  workspace_id: string;
  user_id: string;
  source_access_token: string;
  source_refresh_token: string;
  target_access_token: string;
};

export type TSyncServiceConfigured = {
  isAuthenticated: boolean;
};

// importers
export enum E_IMPORTER_KEYS {
  JIRA = "JIRA",
  ASANA = "ASANA",
  LINEAR = "LINEAR",
  TRELLO = "TRELLO",
  GITLAB = "GITLAB",
  SLACK = "SLACK",
}
export type TImporterKeys = keyof typeof E_IMPORTER_KEYS;

// integrations
export enum E_INTEGRATION_KEYS {
  GITHUB = "GITHUB",
}
export type TIntegrationKeys = keyof typeof E_INTEGRATION_KEYS;

// importers and integrations
export type TSyncServices = TImporterKeys | TIntegrationKeys;

export enum E_JOB_STATUS {
  INITIATED = "INITIATED",
  PULLING = "PULLING",
  PULLED = "PULLED",
  TRANSFORMING = "TRANSFORMING",
  TRANSFORMED = "TRANSFORMED",
  PUSHING = "PUSHING",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
}
export type TSyncJobStatus = keyof typeof E_JOB_STATUS;

export type TSyncJob = {
  id: string;
  config: string;
  migration_type: TSyncServices;
  project_id: string;
  workspace_id: string;
  workspace_slug: string;
  credentials_id: string;
  initiator_id: string;
  initiator_email: string;
  source_user_email: string;
  source_hostname: string;
  source_task_count: number;
  target_hostname: string;
  start_time?: Date;
  end_time?: Date;
  status: TSyncJobStatus;
  created_at: Date;
  updated_at: Date;
  error: string;
  total_batch_count: number;
  completed_batch_count: number;
  transformed_batch_count: number;
};

export type TSyncJobWithConfig<TSyncJobConfig = unknown> = TSyncJob & {
  config: {
    id: string;
    meta: TSyncJobConfig;
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

export type TSyncJobConfigResponse = {
  insertedId: string;
};
