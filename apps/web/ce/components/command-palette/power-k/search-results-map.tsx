"use client";

// local imports
import type { TPowerKSearchResultsKeysExtended } from "./types";

type TPowerKSearchResultGroupDetails = {
  icon?: React.ComponentType<{ className?: string }>;
  itemName: (item: any) => React.ReactNode;
  path: (item: any, projectId: string | undefined) => string;
  title: string;
};

export type TSearchResultsGroupsMapExtended = Record<TPowerKSearchResultsKeysExtended, TPowerKSearchResultGroupDetails>;

export const SEARCH_RESULTS_GROUPS_MAP_EXTENDED: TSearchResultsGroupsMapExtended = {};
