/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TTesthubRepo = {
  id: string;
  project: string;
  workspace: string;
  name?: string;
  kind?: "local_mount" | "git_url";
  repo_url: string;
  branch: string;
  workdir: string;
  host_path?: string;
  last_sync_sha: string;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_error: string;
};

export type TTesthubCounts = {
  ddl_tables: number;
  sql_files: number;
  api_objects: number;
  page_objects: number;
  action_words: number;
  apps: number;
  features: number;
  scenarios: number;
  pytest_nodes: number;
  data_files: number;
};

export type TTesthubCatalogPayload = {
  catalog_version: number;
  generated_at?: string;
  git?: { branch?: string | null; sha?: string | null };
  counts?: TTesthubCounts;
  knowledge?: {
    ddl?: Array<{ datasource: string; path: string; table_count: number; tables: string[] }>;
    sql_files?: Array<{ path: string; name: string }>;
  };
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
    }>;
  };
  tools?: Array<{
    app_id: string;
    name: string;
    argv: string[];
    destructive: boolean;
    whitelisted: boolean;
    readme_path?: string;
    params_schema?: Record<string, unknown>;
  }>;
  tests?: {
    features?: Array<{
      path: string;
      name: string;
      tags: string[];
      scenarios: Array<{ name: string; tags: string[]; type: string }>;
    }>;
    pytest_nodes?: Array<{ nodeid: string; file: string; name: string }>;
  };
  data?: Array<{ path: string; name: string }>;
};

export type TTesthubSnapshot = {
  id: string;
  project: string;
  sha: string;
  payload: TTesthubCatalogPayload;
  created_at: string;
};

export type TTesthubCatalogResponse = {
  repo: TTesthubRepo | null;
  snapshot: TTesthubSnapshot | null;
};

export type TTesthubJob = {
  id: string;
  project: string;
  kind: string;
  status: "queued" | "running" | "succeeded" | "failed";
  params: Record<string, unknown>;
  argv: string[];
  confirmed: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  started_at: string | null;
  finished_at: string | null;
  requested_by: string | null;
  created_at: string;
};

export type TTesthubJobCreate = {
  kind: string;
  params?: Record<string, unknown>;
  confirmed?: boolean;
};

export type TTesthubAssetOverlay = {
  id: string;
  project: string;
  workspace: string;
  asset_ref: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
