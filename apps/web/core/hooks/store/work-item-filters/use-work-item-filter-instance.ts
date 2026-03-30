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

// plane imports
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import type { WorkItemFiltersEntity } from "@plane/constants";

// local imports
import { useWorkItemFilters } from "./use-work-item-filters";

export const useWorkItemFilterInstance = (
  entityType: WorkItemFiltersEntity,
  entityId: string | undefined
): IWorkItemFilterInstance["richFiltersInstance"] | undefined => {
  const { getFilter } = useWorkItemFilters();
  return entityId ? getFilter(entityType, entityId)?.richFiltersInstance : undefined;
};
