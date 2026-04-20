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

import type { TPageFilterProps } from "@plane/types";

export type TExpandedRowMap = Map<string, Set<string>>;

export type TCollectionBranchQueryOptions = {
  parentId?: string | null;
  searchQuery?: string;
  filters?: TPageFilterProps;
};

export type TNormalizedCollectionBranchQueryOptions = {
  collectionId: string;
  parentId: string | null;
  searchQuery: string;
  filters?: TPageFilterProps;
};

export type TCollectionBranchQueryState = TNormalizedCollectionBranchQueryOptions & {
  pageIds: string[];
  nextCursor: string | null;
  hasNextPage: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  isStale: boolean;
};

type TResolveCollectionId = (collectionId: string) => string | undefined;
type TGetActualCollectionId = (collectionId: string) => string;

const normalizeBranchFilters = (filters?: TPageFilterProps) => {
  const normalizedFilters = filters ?? {};
  const orderedEntries = Object.entries(normalizedFilters)
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    })
    .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value] as const)
    .sort(([left], [right]) => left.localeCompare(right));

  return orderedEntries.length > 0 ? Object.fromEntries(orderedEntries) : {};
};

export const hasCollectionBranchFilters = (filters?: TPageFilterProps) => !!filters && Object.keys(filters).length > 0;

export const normalizeCollectionBranchQueryOptions = (
  collectionId: string,
  options: TCollectionBranchQueryOptions = {},
  resolveCollectionId: TResolveCollectionId
): TNormalizedCollectionBranchQueryOptions => {
  const normalizedFilters = normalizeBranchFilters(options.filters);

  return {
    collectionId: resolveCollectionId(collectionId) ?? collectionId,
    parentId: options.parentId ?? null,
    searchQuery: options.searchQuery?.trim() ?? "",
    filters: hasCollectionBranchFilters(normalizedFilters) ? normalizedFilters : undefined,
  };
};

export const getCollectionBranchQueryKey = (normalizedOptions: TNormalizedCollectionBranchQueryOptions) =>
  `${normalizedOptions.collectionId}::${normalizedOptions.parentId ?? "__root__"}::${normalizedOptions.searchQuery}::${JSON.stringify(normalizedOptions.filters ?? {})}`;

export const createCollectionBranchQueryState = (
  normalizedOptions: TNormalizedCollectionBranchQueryOptions
): TCollectionBranchQueryState => ({
  collectionId: normalizedOptions.collectionId,
  parentId: normalizedOptions.parentId,
  searchQuery: normalizedOptions.searchQuery,
  filters: normalizedOptions.filters,
  pageIds: [],
  nextCursor: null,
  hasNextPage: false,
  isLoading: false,
  isLoaded: false,
  isStale: false,
});

export const toggleExpandedRowIds = (
  expandedRowMap: TExpandedRowMap,
  collectionId: string,
  pageId: string,
  getActualCollectionId: TGetActualCollectionId
) => {
  const actualCollectionId = getActualCollectionId(collectionId);
  const nextExpandedRowIds = new Set(expandedRowMap.get(actualCollectionId) ?? []);

  if (nextExpandedRowIds.has(pageId)) {
    nextExpandedRowIds.delete(pageId);
  } else {
    nextExpandedRowIds.add(pageId);
  }

  expandedRowMap.set(actualCollectionId, nextExpandedRowIds);
};

export const setExpandedRowIds = (
  expandedRowMap: TExpandedRowMap,
  collectionId: string,
  pageId: string,
  getActualCollectionId: TGetActualCollectionId
) => {
  const actualCollectionId = getActualCollectionId(collectionId);
  const currentExpandedRowIds = expandedRowMap.get(actualCollectionId) ?? new Set<string>();
  if (currentExpandedRowIds.has(pageId)) return;

  expandedRowMap.set(actualCollectionId, new Set([...currentExpandedRowIds, pageId]));
};

export const replaceExpandedRowIds = (
  expandedRowMap: TExpandedRowMap,
  collectionId: string,
  pageIds: string[],
  getActualCollectionId: TGetActualCollectionId
) => {
  expandedRowMap.set(getActualCollectionId(collectionId), new Set(pageIds));
};

export const getExpandedRowIds = (
  expandedRowMap: TExpandedRowMap,
  collectionId: string,
  resolveCollectionId: TResolveCollectionId
): Set<string> => {
  const actualCollectionId = resolveCollectionId(collectionId);
  if (!actualCollectionId) return new Set();

  return expandedRowMap.get(actualCollectionId) ?? new Set();
};

export const isExpandedRow = (
  expandedRowMap: TExpandedRowMap,
  collectionId: string,
  pageId: string,
  resolveCollectionId: TResolveCollectionId
): boolean => {
  const actualCollectionId = resolveCollectionId(collectionId);
  if (!actualCollectionId) return false;

  return expandedRowMap.get(actualCollectionId)?.has(pageId) ?? false;
};
