/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TGitRemoteKind = "local_mount" | "git_url";

export type TGitSyncModuleKey = "testhub" | "features" | "wiki" | "prd";

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
  error?: string;
};
