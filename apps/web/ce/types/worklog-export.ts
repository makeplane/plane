/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IExporterHistory {
  id: string;
  created_at: string;
  updated_at: string;
  project: string[];
  provider: "csv" | "xlsx";
  status: "queued" | "processing" | "completed" | "failed";
  url: string | null;
  initiated_by: string;
  initiated_by_detail: {
    id: string;
    display_name: string;
    avatar: string;
  };
  token: string;
  created_by: string;
  updated_by: string;
}
