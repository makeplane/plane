/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssue } from "./issue";

export type TIssueRelation = Record<TIssueRelationTypes, TIssue[]>;

export type TIssueRelationMap = {
  [issue_id: string]: Record<TIssueRelationTypes, string[]>;
};

export type TIssueRelationIdMap = Record<TIssueRelationTypes, string[]>;

export type TIssueRelationTypes = "blocking" | "blocked_by" | "duplicate" | "relates_to";
