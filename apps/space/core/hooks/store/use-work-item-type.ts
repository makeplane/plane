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

import { SitesWorkItemTypesService } from "@plane/services";
import type { TPublicWorkItemType } from "@plane/types";
import { usePublicEntityLookup } from "./use-public-entity-lookup";

const workItemTypeService = new SitesWorkItemTypesService();

export interface IWorkItemTypeLookup {
  workItemTypes: TPublicWorkItemType[] | undefined;
  workItemTypeMap: Record<string, TPublicWorkItemType>;
  getWorkItemTypeById: (workItemTypeId: string | undefined) => TPublicWorkItemType | undefined;
  isLoading: boolean;
  error: unknown;
}

export const useWorkItemType = (): IWorkItemTypeLookup => {
  const { items, itemMap, getById, isLoading, error } = usePublicEntityLookup("PUBLIC_WORK_ITEM_TYPES", (anchor) =>
    workItemTypeService.list(anchor)
  );

  return {
    workItemTypes: items,
    workItemTypeMap: itemMap,
    getWorkItemTypeById: getById,
    isLoading,
    error,
  };
};
