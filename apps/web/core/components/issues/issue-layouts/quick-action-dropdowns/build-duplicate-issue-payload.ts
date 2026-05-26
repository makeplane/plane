/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { omit } from "lodash-es";
import type { TIssue } from "@plane/types";

// Server-managed fields must be stripped before re-submitting as a new issue.
// Carrying `completed_at` from a Done source causes backend validation to fail
// when the new copy lands in a non-completed state.
const SERVER_MANAGED_FIELDS = [
  "id",
  "completed_at",
  "archived_at",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "sequence_id",
] as const;

export const buildDuplicateIssuePayload = (issue: TIssue): Partial<TIssue> & { sourceIssueId: string } =>
  omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      sourceIssueId: issue.id,
    },
    SERVER_MANAGED_FIELDS
  ) as Partial<TIssue> & { sourceIssueId: string };
