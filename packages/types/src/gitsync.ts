/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TGitRemoteKind = "local_mount" | "git_url";

export type TGitSyncModuleKey = "testhub" | "features" | "environments" | "wiki" | "prd";

export type TProjectGitRemote = {
  id: string;
  project: string;
  workspace: string;
  name: string;
  kind: TGitRemoteKind;
  workdir: string;
  host_path: string;
  repo_url: string;
  branch: string;
  credential_ref: string;
  last_sync_sha: string;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_error: string;
  created_at: string;
  updated_at: string;
};

export type TGitSyncModuleMeta = {
  key: TGitSyncModuleKey;
  source: "git_sync";
  mutate_git: boolean;
  capabilities: string[];
  convention_key: string;
};

export type TGitSyncRemoteList = {
  remotes: TProjectGitRemote[];
  modules: TGitSyncModuleMeta[];
  defaults: {
    local_mount_workdir: string;
    clone_root: string;
  };
};

export type TGitSyncRemoteWrite = {
  name: string;
  kind: TGitRemoteKind;
  workdir?: string;
  host_path?: string;
  repo_url?: string;
  branch?: string;
  credential_ref?: string;
};

export type TModuleBinding = {
  id: string;
  project: string;
  workspace: string;
  module_key: TGitSyncModuleKey;
  remote: TProjectGitRemote;
  created_at: string;
  updated_at: string;
};

export type TModuleBindingRow = {
  module_key: TGitSyncModuleKey;
  binding: TModuleBinding | null;
};

export type TGitSyncBindingList = {
  bindings: TModuleBindingRow[];
  modules: TGitSyncModuleMeta[];
};

export type TGitSyncBindingWrite = {
  module_key: TGitSyncModuleKey;
  remote_id: string | null;
};

export type TGitSyncSyncResponse = {
  remote: TProjectGitRemote;
  testhub_job?: { id: string; status: string; error?: string } | { error: string } | null;
  indexes?: Record<string, { ok?: boolean; error?: string; id?: string; status?: string } | null>;
  error?: string;
};

export type TModuleCatalogResponse = {
  module_key: TGitSyncModuleKey;
  remote: TProjectGitRemote | null;
  payload: TModuleCatalogPayload | null;
  error?: string;
};

export type TModuleCatalogPayload = {
  catalog_version: number;
  generated_at?: string;
  module_key?: string;
  git?: { branch?: string | null; sha?: string | null };
  counts?: Record<string, number>;
  features?: Array<{
    path: string;
    name: string;
    tags: string[];
    scenarios: Array<{ name: string; tags: string[]; type: string }>;
  }>;
  components?: {
    api_objects?: Array<{ method: string; path: string; file: string; id?: string; name?: string }>;
    page_objects?: Array<{ path: string; name: string }>;
    action_words?: Array<{
      word_id: string;
      name: string;
      category: string;
      params_schema?: Record<string, unknown>;
      example_params?: Record<string, unknown>;
      doc?: string;
      file?: string;
    }>;
  };
  environments?: Array<{
    id: string;
    name: string;
    source?: string;
    targets: Array<{ id: string; kind: string; base_url: string; source?: string }>;
    datasources: Array<{ alias: string; engine: string; database: string; host: string; secret_keys: string[] }>;
    secret_keys: string[];
    variables: Array<{ key: string; value: string }>;
    source_files: Array<{ path: string; name: string }>;
  }>;
  knowledge?: {
    ddl?: Array<{ datasource: string; path: string; table_count: number; tables: string[] }>;
    sql_files?: Array<{ path: string; name: string }>;
  };
  documents?: Array<{ path: string; name: string }>;
};
