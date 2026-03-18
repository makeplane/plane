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

// issues
export * from "./issue";
export * from "./issue_reaction";
export * from "./issue_link";
export * from "./issue_attachment";
export * from "./issue_relation";
export * from "./issue_sub_issues";
export * from "./activity/base";
export * from "./search";

export type TLoader = "init-loader" | "mutation" | "pagination" | "loaded" | undefined;

export type TGroupedIssues = {
  [group_id: string]: string[];
};

export type TSubGroupedIssues = {
  [sub_grouped_id: string]: TGroupedIssues;
};

export type TIssues = TGroupedIssues | TSubGroupedIssues;

export type TPaginationData = {
  nextCursor: string;
  prevCursor: string;
  nextPageResults: boolean;
};

export type TIssuePaginationData = {
  [group_id: string]: TPaginationData;
};

export type TGroupedIssueCount = {
  [group_id: string]: number;
};

export type TUnGroupedIssues = string[];
