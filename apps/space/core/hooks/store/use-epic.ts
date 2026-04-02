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

import { SitesEpicService } from "@plane/services";
import type { TPublicEpic } from "@plane/types";
import { usePublicEntityLookup } from "./use-public-entity-lookup";

const epicService = new SitesEpicService();

export interface IEpicLookup {
  epics: TPublicEpic[] | undefined;
  epicMap: Record<string, TPublicEpic>;
  getEpicById: (epicId: string | undefined) => TPublicEpic | undefined;
  isLoading: boolean;
  error: unknown;
}

export const useEpic = (): IEpicLookup => {
  const { items, itemMap, getById, isLoading, error } = usePublicEntityLookup("PUBLIC_EPICS", (anchor) =>
    epicService.list(anchor)
  );

  return {
    epics: items,
    epicMap: itemMap,
    getEpicById: getById,
    isLoading,
    error,
  };
};
