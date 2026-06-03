/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IUserLite } from "../users";

export type TJiraCredentials = {
  domain: string;
  email: string;
  token: string;
};

export type TJiraBoard = {
  id: number;
  name: string;
  type: string;
  project_key: string | null;
  project_name: string | null;
};

export type TJiraStatus = {
  id: string;
  name: string;
  suggested_group: string;
};

export type TJiraPriority = {
  id: string;
  name: string;
  suggested_priority: string;
};

export type TJiraUser = {
  account_id: string;
  display_name: string;
  email: string | null;
};

export type TJiraSprint = {
  id: number;
  name: string;
  state: string;
};

export type TJiraMetadata = {
  project_key: string;
  statuses: TJiraStatus[];
  priorities: TJiraPriority[];
  users: TJiraUser[];
  sprints: TJiraSprint[];
  issue_count: number;
};

export type TImportJobReport = {
  projects?: number;
  members?: number;
  invited?: number;
  states?: number;
  labels?: number;
  modules?: number;
  cycles?: number;
  work_items?: number;
  comments?: number;
  attachments?: number;
  links?: number;
  errors?: string[];
  phase?: string;
};

export type TImportJobStatus = "queued" | "processing" | "completed" | "failed";

export type TImportJob = {
  id: string;
  source: string;
  status: TImportJobStatus;
  report: TImportJobReport;
  reason: string;
  external_id: string | null;
  initiated_by: string;
  initiated_by_detail: IUserLite;
  created_at: string;
  updated_at: string;
};

export type TJiraImportTarget = {
  type: "new" | "existing";
  project_id?: string;
  name?: string;
  identifier?: string;
};

export type TJiraImportPayload = TJiraCredentials & {
  board_id: number;
  target: TJiraImportTarget;
  user_import: "invite" | "skip";
  state_map: Record<string, string>;
  priority_map: Record<string, string>;
  auto_create_states: boolean;
  flags: {
    components?: boolean;
    comments?: boolean;
    attachments?: boolean;
    links?: boolean;
  };
};

export type TJiraConnectionResponse = {
  is_connected: boolean;
  user?: string;
  error?: string;
};
