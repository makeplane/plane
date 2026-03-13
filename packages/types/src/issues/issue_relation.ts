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

import type { TIssue } from "./issue";
import type { TIssueRelationTypesExtended } from "./issue_relation_extended";

export type TIssueRelation = Record<string, TIssue[]>;

export type TIssueRelationMap = {
  [issue_id: string]: Record<string, string[]>;
};

export type TIssueRelationIdMap = Record<string, string[]>;

export type TIssueRelationTypes = "blocking" | "blocked_by" | "duplicate" | "relates_to" | TIssueRelationTypesExtended;
