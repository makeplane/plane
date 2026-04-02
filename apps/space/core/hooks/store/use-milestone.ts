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

import { SitesMilestoneService } from "@plane/services";
import type { TPublicMilestone } from "@plane/types";
import { usePublicEntityLookup } from "./use-public-entity-lookup";

const milestoneService = new SitesMilestoneService();

export interface IMilestoneLookup {
  milestones: TPublicMilestone[] | undefined;
  milestoneMap: Record<string, TPublicMilestone>;
  getMilestoneById: (milestoneId: string | undefined) => TPublicMilestone | undefined;
  isLoading: boolean;
  error: unknown;
}

export const useMilestone = (): IMilestoneLookup => {
  const { items, itemMap, getById, isLoading, error } = usePublicEntityLookup("PUBLIC_MILESTONES", (anchor) =>
    milestoneService.list(anchor)
  );

  return {
    milestones: items,
    milestoneMap: itemMap,
    getMilestoneById: getById,
    isLoading,
    error,
  };
};
