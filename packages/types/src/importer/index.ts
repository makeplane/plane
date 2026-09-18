/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
import type { IUserLite } from "../users";

export interface IExportData {
  id: string;
  created_at: string;
  updated_at: string;
  project: string[];
  provider: string;
  status: string;
  url: string;
  token: string;
  created_by: string;
  updated_by: string;
  initiated_by_detail: IUserLite;
}
export interface IExportServiceResponse {
  count: number;
  extra_stats: null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  results: IExportData[];
  total_pages: number;
}
