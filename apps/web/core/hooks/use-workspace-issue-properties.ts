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
// plane web imports
import { WORKSPACE_ESTIMATES, WORKSPACE_CYCLES, WORKSPACE_LABELS, WORKSPACE_MODULES } from "@/constants/fetch-keys";
import { useWorkspaceIssuePropertiesExtended } from "@/plane-web/hooks/use-workspace-issue-properties-extended";
// plane imports
import { useProjectEstimates } from "./store/estimates";
import { useCycle } from "./store/use-cycle";
import { useLabel } from "./store/use-label";
import { useModule } from "./store/use-module";

export const useWorkspaceIssueProperties = (
  workspaceSlug: string | string[] | undefined,
  options: {
    fetchLabels?: boolean;
    fetchEstimates?: boolean;
    fetchModules?: boolean;
    fetchCycles?: boolean;
  } = {
    fetchLabels: true,
    fetchEstimates: true,
    fetchModules: true,
    fetchCycles: true,
  }
) => {
  const { fetchWorkspaceLabels } = useLabel();

  const { getWorkspaceEstimates } = useProjectEstimates();

  const { fetchWorkspaceModules } = useModule();

  const { fetchWorkspaceCycles } = useCycle();
  // fetch workspace Modules
  useSWR(
    workspaceSlug && options.fetchModules ? WORKSPACE_MODULES(workspaceSlug.toString()) : null,
    workspaceSlug && options.fetchModules ? () => fetchWorkspaceModules(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace Cycles
  useSWR(
    workspaceSlug && options.fetchCycles ? WORKSPACE_CYCLES(workspaceSlug.toString()) : null,
    workspaceSlug && options.fetchCycles ? () => fetchWorkspaceCycles(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace labels
  useSWR(
    workspaceSlug && options.fetchLabels ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug && options.fetchLabels ? () => fetchWorkspaceLabels(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace estimates
  useSWR(
    workspaceSlug && options.fetchEstimates ? WORKSPACE_ESTIMATES(workspaceSlug.toString()) : null,
    workspaceSlug && options.fetchEstimates ? () => getWorkspaceEstimates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch extended issue properties
  useWorkspaceIssuePropertiesExtended(workspaceSlug);
};
