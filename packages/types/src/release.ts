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

export type ReleaseStatus = "unreleased" | "released" | "cancelled";

export type Release = {
  id: string;
  name: string;
  description?: string;
  release_date: string | null;
  workspace_id: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  label_ids: string[];
  work_item_ids: string[];
  completed_work_item_count: number;
  status?: ReleaseStatus;
  tag?: string | null;
  lead?: string | null;
};

export type ReleaseWrite = {
  name?: string;
  description?: string;
  release_date?: string | null;
  label_ids?: string[];
  work_item_ids?: string[];
  status?: ReleaseStatus;
  tag?: string | null;
  lead?: string | null;
};

export type CreateUpdateReleaseModal = {
  isOpen: boolean;
  releaseId: string | undefined;
};

export type ReleaseTag = {
  id: string;
  workspace: string;
  version: string;
  description?: string;
  commit_hash?: string;
  git_tag?: string;
  created_at: string;
  updated_at: string;
};

export type ReleaseTagWrite = {
  version: string;
};

export type ReleaseLabel = {
  id: string;
  workspace: string;
  name: string;
  color: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type ReleaseLabelWrite = {
  name: string;
  color?: string;
  sort_order?: number;
};
