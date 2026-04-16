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

import type { TIssuePriorities } from "./issues";

export type TDuplicateIssuePayload = {
  title: string;
  workspace_id: string;
  issue_id?: string | null;
  project_id?: string;
  description_stripped?: string;
};

export type TDeDupeIssue = {
  id: string;
  type_id: string | null;
  project_id: string;
  sequence_id: number;
  name: string;
  priority: TIssuePriorities;
  state_id: string;
  created_by: string;
};

export type TDuplicateIssueResponse = {
  dupes: TDeDupeIssue[];
};

export type TDuplicateFeedbackPayload = {
  issue_id: string;
  not_duplicates_with: string[];
};
