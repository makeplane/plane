/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "../common";
import type { EPageAccess } from "../enums";

export type TIssuePageDetail = {
  id: string;
  name: string | undefined;
  logo_props: TLogoProps | undefined;
  access: EPageAccess | undefined;
  is_locked: boolean;
  archived_at: string | null;
  workspace: string;
  project_ids: string[];
};

export type TIssuePage = {
  id: string;
  issue: string;
  page: string;
  page_detail: TIssuePageDetail;
  project: string;
  workspace: string;
  created_at: string;
  created_by: string | undefined;
};

export type TIssuePageMap = {
  [issue_id: string]: TIssuePage[];
};

// project level work item <-> page link, used by layouts and the pages list
export type TIssuePageLink = {
  id: string;
  issue_id: string;
  page_id: string;
  issue_name: string;
  issue_sequence_id: number;
  issue_project_id: string;
  project_identifier: string;
  page_name: string | null;
};
