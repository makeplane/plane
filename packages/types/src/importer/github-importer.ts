/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IGithubServiceImportFormData {
  metadata: {
    owner: string;
    name: string;
    repository_id: number;
    url: string;
  };
  data: {
    users: {
      username: string;
      import: boolean | "invite" | "map";
      email: string;
    }[];
  };
  config: {
    sync: boolean;
  };
  project_id: string;
}

export interface IGithubRepoCollaborator {
  avatar_url: string;
  html_url: string;
  id: number;
  login: string;
  url: string;
}

export interface IGithubRepoInfo {
  issue_count: number;
  labels: number;
  collaborators: IGithubRepoCollaborator[];
}
