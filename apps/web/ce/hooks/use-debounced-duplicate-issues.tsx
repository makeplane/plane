/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDeDupeIssue } from "@plane/types";

export const useDebouncedDuplicateIssues = (
  _workspaceSlug: string | undefined,
  _workspaceId: string | undefined,
  _projectId: string | undefined,
  _formData: { name: string | undefined; description_html?: string | undefined; issueId?: string | undefined }
) => {
  const duplicateIssues: TDeDupeIssue[] = [];

  return { duplicateIssues };
};
