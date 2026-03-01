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

import { useMemo } from "react";
import type { EUpdateStatus } from "@plane/types";
import { InitiativesUpdateService } from "@/services/initiative-updates.service";

const initiativeUpdateService = new InitiativesUpdateService();

export const useInitiativeUpdates = (workspaceSlug: string, initiativeId: string) => {
  if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");

  const handleUpdateOperations = useMemo(() => {
    const ops = {
      fetchUpdates: async (params?: { search: EUpdateStatus }) => {
        const response = await initiativeUpdateService.getUpdates(workspaceSlug, initiativeId, params);
        return response;
      },
      fetchProjectUpdates: async (params?: { search: EUpdateStatus }) => {
        const response = await initiativeUpdateService.getUpdates(workspaceSlug, initiativeId, params);
        return response.project_updates;
      },
      fetchEpicUpdates: async (params?: { search: EUpdateStatus }) => {
        const response = await initiativeUpdateService.getUpdates(workspaceSlug, initiativeId, params);
        return response.epic_updates;
      },
    };
    return ops;
  }, [workspaceSlug, initiativeId]);

  return {
    handleUpdateOperations,
  };
};
