/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export interface IJiraImporterForm {
  metadata: IJiraMetadata;
  config: IJiraConfig;
  data: IJiraData;
  project_id: string;
}

export interface IJiraConfig {
  epics_to_modules: boolean;
}

export interface IJiraData {
  users: User[];
  invite_users: boolean;
  total_issues: number;
  total_labels: number;
  total_states: number;
  total_modules: number;
}

export interface User {
  username: string;
  import: "invite" | "map" | false;
  email: string;
}

export interface IJiraMetadata {
  cloud_hostname: string;
  api_token: string;
  project_key: string;
  email: string;
}

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

export interface IJiraValidateJQLResponse {
  issueCount: number;
  executedJQL: string;
}
