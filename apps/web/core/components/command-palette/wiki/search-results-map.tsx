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

import { FileText, LayoutGrid } from "lucide-react";
// plane imports
import type { IWorkspaceDefaultSearchResult, IWorkspaceSearchResult } from "@plane/types";
// components
import type { TPowerKSearchResultGroupDetails } from "@/components/power-k/ui/modal/search-results-map";
// local imports
import type { TWikiAppPowerKSearchResultsKeys } from "./types";

export const WIKI_APP_POWER_K_SEARCH_RESULTS_GROUPS_MAP: Record<
  TWikiAppPowerKSearchResultsKeys,
  TPowerKSearchResultGroupDetails
> = {
  page: {
    icon: FileText,
    itemName: (page: IWorkspaceDefaultSearchResult) => page?.name,
    path: (page: IWorkspaceDefaultSearchResult) => `/${page?.workspace__slug}/wiki/${page?.id}`,
    title: "Pages",
  },
  workspace: {
    icon: LayoutGrid,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/wiki`,
    title: "Workspaces",
  },
};
