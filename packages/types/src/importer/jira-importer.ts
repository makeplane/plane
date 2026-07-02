/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IJiraMetadata {
  cloud_hostname: string;
  email: string;
  api_token: string;
  project_key: string;
  rtm_api_base_url?: string;
  rtm_api_token?: string;
}

export interface IJiraImporterUser {
  jira_account_id?: string;
  username: string;
  email: string;
  import: "invite" | "map" | false;
  plane_user_id?: string;
}

export interface IJiraImporterConfig {
  jql?: string;
  issue_type_name?: string;
  custom_field_mappings?: Record<string, string>;
  state_mappings?: Record<string, string>;
}

export interface IJiraImporterData {
  users: IJiraImporterUser[];
  invite_users?: boolean;
}

export interface IJiraImporterForm {
  metadata: IJiraMetadata;
  config: IJiraImporterConfig;
  data: IJiraImporterData;
  project_id: string;
}

export interface IJiraPreviewResponse {
  total_testcases: number;
  total_comments: number;
  total_labels: number;
  total_states: number;
  total_users: number;
  users: IJiraImporterUser[];
  states: string[];
  jql?: string;
}

/** @deprecated Legacy preview shape retained for compatibility */
export interface IJiraResponse {
  issues: number;
  modules: number;
  labels: number;
  states: number;
  users: IJiraResponseUser[];
}

export interface IJiraResponseUser {
  self: string;
  accountId: string;
  accountType: string;
  emailAddress: string;
  avatarUrls: IJiraResponseAvatarUrls;
  displayName: string;
  active: boolean;
  locale: string;
}

export interface IJiraResponseAvatarUrls {
  "48x48": string;
  "24x24": string;
  "16x16": string;
  "32x32": string;
}

/** @deprecated Legacy config retained for compatibility */
export interface IJiraConfig {
  epics_to_modules: boolean;
}
