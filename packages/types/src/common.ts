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

export type TPaginationInfo = {
  count: number;
  extra_stats: string | null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  total_pages: number;
  per_page?: number;
  total_results: number;
};

export type TLogoProps = {
  in_use: "emoji" | "icon";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
    background_color?: string;
  };
};

export type TNameDescriptionLoader = "submitting" | "submitted" | "saved";

export type TStateAnalytics = {
  overdue_issues: number;
  backlog_issues: number;
  unstarted_issues: number;
  started_issues: number;
  completed_issues: number;
  cancelled_issues: number;
};

export type TFetchStatus = "partial" | "complete" | undefined;

export type ICustomSearchSelectOption = {
  value: any;
  query: string;
  content: React.ReactNode;
  disabled?: boolean;
  tooltip?: string | React.ReactNode;
};

export type TDescription = {
  description_html: string;
  description_stripped: string;
  description_binary: string;
};

export type TApiErrorResponse<TCode extends string = string> = {
  error: string;
  code: TCode;
};
