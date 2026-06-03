/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import type { TIssueServiceType } from "@plane/types";
import { useProjectCustomFields } from "./use-project-custom-fields";

export const useWorkItemProperties = (
  projectId: string | null | undefined,
  workspaceSlug: string | null | undefined,
  _workItemId: string | null | undefined,
  _issueServiceType: TIssueServiceType
) => {
  const { properties, mutate } = useProjectCustomFields(workspaceSlug ?? undefined, projectId ?? undefined);

  useEffect(() => {
    if (projectId && workspaceSlug) {
      void mutate();
    }
  }, [projectId, workspaceSlug, mutate]);

  return { properties };
};
