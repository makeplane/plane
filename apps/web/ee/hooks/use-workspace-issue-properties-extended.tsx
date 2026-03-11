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

import useSWR from "swr";
// store
import { WORKSPACE_WORKFLOW_STATES } from "@/constants/fetch-keys";
import { useWorkflows } from "@/hooks/store/use-workflows";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

export const useWorkspaceIssuePropertiesExtended = (workspaceSlug: string | string[] | undefined) => {
  const { fetchAllWorkflows } = useWorkflows();
  // derived values
  const isWorkflowFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), "WORKFLOWS");

  // fetch workspace workflow states
  useSWR(
    workspaceSlug && isWorkflowFeatureFlagEnabled ? WORKSPACE_WORKFLOW_STATES(workspaceSlug.toString()) : null,
    workspaceSlug && isWorkflowFeatureFlagEnabled ? () => fetchAllWorkflows(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
};
