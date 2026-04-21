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

import type { TDocumentPayload } from "./page";
import type { IPartialProject } from "./project";
import type { IStateLite, TStateGroups } from "./state";

export type ReleaseStatus = "unreleased" | "released" | "cancelled";

export type Release = {
  id: string;
  name: string;
  description?: Partial<TDocumentPayload> | null;
  release_date: string | null;
  workspace: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  label_ids: string[];
  work_item_ids: string[];
  completed_work_item_count: number;
  cancelled_work_item_count: number;
  status?: ReleaseStatus;
  tag?: string | null;
  lead?: string | null;
};

type ReleaseWriteFields = Pick<
  Release,
  "name" | "release_date" | "label_ids" | "work_item_ids" | "status" | "tag" | "lead" | "description"
>;

export type ReleaseWrite = Partial<ReleaseWriteFields> &
  Partial<Pick<TDocumentPayload, "description_html" | "description_json">>;

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

export type ReleaseSearchIssueResponse = {
  id: string;
  name: string;
  type_id: string | null;
  sequence_id: number;
  start_date: string | null;
  project?: Pick<IPartialProject, "id" | "name" | "identifier"> | null;
  state?: Pick<IStateLite, "name" | "group" | "color"> | null;
  workspace_slug?: string | null;
  project_id?: string;
  project__identifier?: string;
  project__name?: string;
  state__color?: string;
  state__group?: TStateGroups;
  state__name?: string;
  workspace__slug?: string;
};

export type ReleaseChangelog = {
  created_at: string;
  created_by: string;
  changelog: Pick<TDocumentPayload, "description_html" | "description_json">;
  id: string;
  release: string;
  updated_at: string;
  updated_by: string | null;
  workspace: string;
};
