/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IEvaMetadata {
  url: string;
  token: string;
  eva_project_id?: string;
}

export interface IEvaImporterUser {
  eva_id?: string;
  username: string;
  email: string;
  import: "invite" | "map" | false;
  plane_user_id?: string;
}

export interface IEvaImporterConfig {
  lists_as_cycles?: boolean;
  fix_versions_as_modules?: boolean;
  state_mappings?: Record<string, string>;
}

export interface IEvaImporterData {
  users: IEvaImporterUser[];
  invite_users?: boolean;
}

export interface IEvaImporterForm {
  metadata: IEvaMetadata;
  config: IEvaImporterConfig;
  data: IEvaImporterData;
  project_id: string;
}

export interface IEvaProjectOption {
  id: string;
  code: string;
  name: string;
}

export interface IEvaPreviewResponse {
  projects: IEvaProjectOption[];
  users: IEvaImporterUser[];
  total_tasks?: number;
  total_comments?: number;
  total_attachments?: number;
  total_documents?: number;
  total_testcases?: number;
  total_labels?: number;
  total_users?: number;
  total_states?: number;
  total_modules?: number;
  total_cycles?: number;
  states?: string[];
}

export interface IEvaImportProgress {
  phase: string;
  completed: number;
  total: number;
  percent: number;
}

export interface IImporterImportedData {
  progress?: IEvaImportProgress;
  stats?: Record<string, number>;
  error?: string;
  warnings?: string[];
}
