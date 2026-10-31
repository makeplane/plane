/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// plane imports
import { ControlService } from "@plane/services";
import type { TControlParams } from "@plane/types";

export const controlService = new ControlService();

const REFRESH_MS = 20_000;

/** Everyone's state now and their work in a period, for managers. */
export const useControlTeam = (workspaceSlug: string, params: TControlParams, enabled: boolean) => {
  const key = enabled ? `TEAM_OPS_CONTROL_TEAM_${workspaceSlug}_${JSON.stringify(params)}` : null;
  const { data, error, isLoading } = useSWR(key, () => controlService.getTeam(workspaceSlug, params), {
    refreshInterval: REFRESH_MS,
  });
  return { team: data, error, isLoading };
};

export const useInterruptions = (
  workspaceSlug: string,
  params: TControlParams & { kind?: "BREAK" | "FREEZE" },
  enabled: boolean
) => {
  const key = enabled ? `TEAM_OPS_CONTROL_INTERRUPTIONS_${workspaceSlug}_${JSON.stringify(params)}` : null;
  const { data } = useSWR(key, () => controlService.listInterruptions(workspaceSlug, params));
  return { interruptions: data };
};

export const useHubOverview = (workspaceSlug: string, enabled: boolean) => {
  const { data, mutate } = useSWR(enabled ? `TEAM_OPS_CONTROL_HUB_${workspaceSlug}` : null, () =>
    controlService.getHub(workspaceSlug)
  );
  return { overview: data, refresh: mutate };
};

export const useFlowOverview = (workspaceSlug: string, enabled: boolean) => {
  const { data } = useSWR(
    enabled ? `TEAM_OPS_CONTROL_FLOWS_${workspaceSlug}` : null,
    () => controlService.getFlows(workspaceSlug),
    {
      refreshInterval: 30_000,
    }
  );
  return { overview: data };
};
