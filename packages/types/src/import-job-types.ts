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

export type TImportJob<TJobConfig = object> = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  source: string;
  config: TJobConfig;
  report: TImportReport;
  credential_id: string;
  project_id: string;
  workspace_id: string;
  workspace_slug: string;
  initiator_id: string;
  report_id: string;
  status: string;
  with_issue_types: boolean;
  cancelled_at?: string | null;
  success_metadata: object;
  error_metadata: object;
  relation_map: object; // "issues" -> taskExternalId -> relations
};

export type TImportReport = {
  // Identifier
  id: string;

  // Overall Insight
  batch_size: number;
  total_batch_count: number;
  imported_batch_count: number;
  transformed_batch_count: number;
  completed_batch_count: number;
  errored_batch_count: number;

  // Entity Information
  total_issue_count: number;
  imported_issue_count: number;
  errored_issue_count: number;
  total_page_count: number;
  imported_page_count: number;
  errored_page_count: number;

  // Time Stamps
  start_time?: string | null;
  end_time?: string | null;

  // Asset ID of the summary HTML file
  summary_asset?: string | null;
};
