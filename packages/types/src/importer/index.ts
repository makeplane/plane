/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export * from "./github-importer";
export * from "./jira-importer";

import type { IProjectLite } from "../project";
// types
import type { IUserLite } from "../users";

export type TImporterServiceStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export type TImporterServiceProvider = "github" | "jira" | string;

export type TImporterMetadata = Partial<{
  name: string;
  owner: string;
  repository_id: number;
  url: string;
  cloud_hostname: string;
  project_key: string;
  email: string;
}>;

export type TImporterData = Partial<{
  users: unknown[];
  invite_users: boolean;
  total_issues: number;
  total_labels: number;
  total_states: number;
  total_modules: number;
}>;

export type TImporterImportedData = Partial<{
  issues: number;
  labels: number;
  states: number;
  modules: number;
  users: number;
}>;

export interface IImporterService {
  created_at: string;
  config: Record<string, unknown>;
  created_by: string | null;
  data: TImporterData;
  id: string;
  initiated_by: string;
  initiated_by_detail: IUserLite;
  imported_data?: TImporterImportedData;
  metadata: TImporterMetadata;
  project: string;
  project_detail: IProjectLite;
  service: TImporterServiceProvider;
  status: TImporterServiceStatus;
  updated_at: string;
  updated_by: string;
  token?: string;
  workspace: string;
}

export interface IExportData {
  id: string;
  created_at: string;
  updated_at: string;
  project: string[];
  provider: string;
  status: string;
  url: string;
  token: string;
  created_by: string;
  updated_by: string;
  initiated_by_detail: IUserLite;
}
export interface IExportServiceResponse {
  count: number;
  extra_stats: null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  results: IExportData[];
  total_pages: number;
}
