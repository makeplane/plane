/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import type { TPowerKSearchResultGroupDetails } from "@/components/power-k/ui/modal/search-results-map";
// local imports
import type { TPowerKSearchResultsKeysExtended } from "../types";

type TSearchResultsGroupsMapExtended = Record<TPowerKSearchResultsKeysExtended, TPowerKSearchResultGroupDetails>;

export const SEARCH_RESULTS_GROUPS_MAP_EXTENDED: TSearchResultsGroupsMapExtended = {};
