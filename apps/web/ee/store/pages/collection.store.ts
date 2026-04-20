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

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EPageAccess } from "@plane/types";
import type {
  TCollection,
  TCollectionAddablePage,
  TCollectionBranchPageSummary,
  TCollectionBranchRow,
  TCollectionCreatePayload,
  TPage,
  TPageCollection,
  TPageFilterProps,
} from "@plane/types";
import { CollectionService, PageCollectionService } from "@plane/services";
import type { RootStore } from "@/plane-web/store/root.store";
import { getLoadedSubtreePageIds } from "@/plane-web/store/pages/page-tree";
import {
  createCollectionBranchQueryState,
  getCollectionBranchQueryKey,
  getExpandedRowIds,
  hasCollectionBranchFilters,
  isExpandedRow,
  normalizeCollectionBranchQueryOptions,
  replaceExpandedRowIds,
  setExpandedRowIds,
  toggleExpandedRowIds,
} from "./collection.helpers";
import {
  buildCollectionMovePageUpdatePayload,
  createCollectionMoveMutation,
  getCollectionMoveCreatePayload,
  getCollectionMoveRollbackPayload,
  getCollectionMoveSyncParams,
  getCollectionMoveUpdatePayload,
  getCreatedPageCollectionOrThrow,
  getOptimisticCollectionMoveId,
  getPreviousExplicitPageCollections,
  toCollectionMoveError,
} from "./collection-move.helpers";
import type { TCollectionBranchQueryOptions, TCollectionBranchQueryState } from "./collection.helpers";
import type {
  TCollectionDropExecutionOptions,
  TCollectionDropPlan,
  TCollectionDropPlanParams,
  TCollectionDropSnapshot,
} from "./collection-move.helpers";
import { WorkspacePage } from "./workspace-page";
import type { TWorkspaceCollection } from "./workspace-collection";
import { WorkspaceCollection } from "./workspace-collection";

type TLoader = "init-loader" | "mutation-loader" | undefined;
type TError = { title: string; description: string };

const PAGE_COLLECTION_SORT_ORDER_INCREMENT = 10000;
const OPTIMISTIC_PAGE_COLLECTION_ID_PREFIX = "optimistic-page-collection-";

export interface ICollectionStore {
  loader: TLoader;
  data: Record<string, TWorkspaceCollection>;
  error: TError | undefined;
  pageCollectionsData: Record<string, TPageCollection>;
  pageCollectionIdsByCollection: Map<string, Set<string>>;
  pageCollectionIdByPageId: Map<string, string>;
  pageParentIdByPageId: Map<string, string | null>;
  defaultCollectionId: string | undefined;
  hydratedMembershipsWorkspaceSlug: string | undefined;
  isHydratingMemberships: boolean;
  collectionExpandedRowIdsMap: Map<string, Set<string>>;
  collectionSidebarExpandedRowIdsMap: Map<string, Set<string>>;
  expandedCollectionIds: Set<string>;
  workspaceCollections: TCollection[] | undefined;
  getCollectionById: (collectionId: string) => TWorkspaceCollection | undefined;
  getPageCollectionByPageId: (pageId: string) => TPageCollection | undefined;
  hasHydratedCollectionMemberships: (workspaceSlug: string) => boolean;
  ensureCollectionMembershipsHydrated: (workspaceSlug: string) => Promise<void>;
  isCollectionPagesLoaded: (collectionId: string) => boolean;
  fetchCollections: (workspaceSlug: string) => Promise<TCollection[]>;
  fetchCollectionDetails: (workspaceSlug: string, collectionId: string) => Promise<TCollection>;
  createCollection: (workspaceSlug: string, data: TCollectionCreatePayload) => Promise<TCollection>;
  deleteCollection: (workspaceSlug: string, collectionId: string) => Promise<void>;
  moveCollectionPages: (workspaceSlug: string, collectionId: string, newCollectionId: string) => Promise<void>;
  updateCollectionsInStore: (collections: TCollection[]) => void;
  removeCollectionInstance: (collectionId: string) => void;
  searchAddablePages: (
    workspaceSlug: string,
    collectionId: string,
    params?: { search?: string }
  ) => Promise<TCollectionAddablePage[]>;
  fetchCollectionPages: (
    workspaceSlug: string,
    collectionId: string,
    options?: {
      force?: boolean;
      searchQuery?: string;
      filters?: TPageFilterProps;
      cursor?: string;
    }
  ) => Promise<TPageCollection[]>;
  fetchCollectionBranch: (
    workspaceSlug: string,
    collectionId: string,
    options?: {
      parentId?: string | null;
      force?: boolean;
      searchQuery?: string;
      filters?: TPageFilterProps;
      cursor?: string;
      perPage?: number;
    }
  ) => Promise<string[]>;
  fetchCollectionBranchChildren: (
    workspaceSlug: string,
    collectionId: string,
    parentId: string,
    options?: {
      force?: boolean;
      searchQuery?: string;
      filters?: TPageFilterProps;
      perPage?: number;
    }
  ) => Promise<string[]>;
  getCollectionBranchState: (
    collectionId: string,
    options?: {
      parentId?: string | null;
      searchQuery?: string;
      filters?: TPageFilterProps;
    }
  ) => TCollectionBranchQueryState | undefined;
  resolveCollectionIdForPage: (
    workspaceSlug: string,
    pageId: string,
    ancestorPageIds?: string[]
  ) => Promise<string | undefined>;
  refreshCollectionBranchForPage: (
    workspaceSlug: string,
    pageId: string,
    ancestorPageIds?: string[]
  ) => Promise<string | undefined>;
  addPagesToCollection: (workspaceSlug: string, pageIds: string[], targetCollectionId: string) => Promise<void>;
  addPageToCollection: (workspaceSlug: string, pageId: string, targetCollectionId: string) => Promise<void>;
  removePageFromCollection: (workspaceSlug: string, pageId: string, sourceCollectionId: string) => Promise<void>;
  removeExplicitPageCollectionsFromStore: (pageIds: Iterable<string>) => void;
  canCurrentUserAddPageToCollection: (pageId: string) => boolean;
  canCurrentUserReorderPageInCollection: (pageId: string, collectionId: string) => boolean;
  canCurrentUserRemovePageFromCollection: (collectionId: string, pageId: string) => boolean;
  getExplicitCollectionIdForPage: (pageId: string) => string | undefined;
  getEffectiveCollectionId: (pageId: string) => string | undefined;
  computeDestinationSortOrder: (
    collectionId: string,
    targetPageId: string,
    position: "before" | "after",
    pageId?: string
  ) => number | undefined;
  movePageWithinCollection: (
    workspaceSlug: string,
    pageId: string,
    collectionId: string,
    targetPageId: string,
    position: "before" | "after"
  ) => Promise<void>;
  movePageAcrossCollections: (
    workspaceSlug: string,
    pageId: string,
    sourceCollectionId: string | null | undefined,
    targetCollectionId: string,
    options?: {
      targetSortOrder?: number;
      targetParentId?: string | null;
    }
  ) => Promise<void>;
  movePageWithCollectionContext: (params: {
    pageId: string;
    sourceCollectionId?: string | null;
    targetCollectionId: string;
    targetParentId: string | null;
    targetSortOrder?: number;
    reorderTargetPageId?: string;
    reorderPosition?: "before" | "after";
    access?: EPageAccess;
    clearSharedAccess?: boolean;
  }) => Promise<void>;
  getCollectionViewPageIds: (collectionId: string) => Set<string>;
  getCollectionRootPageIds: (
    collectionId: string,
    options?: {
      searchQuery?: string;
      filters?: TPageFilterProps;
    }
  ) => string[];
  getCollectionChildPageIds: (
    pageId: string,
    collectionId: string,
    options?: {
      searchQuery?: string;
      filters?: TPageFilterProps;
    }
  ) => string[];
  getCollectionAutoExpandedAncestorIds: (collectionId: string, currentPageId?: string) => string[];
  toggleCollectionExpanded: (collectionId: string) => void;
  setCollectionExpanded: (collectionId: string) => void;
  isCollectionExpanded: (collectionId: string) => boolean;
  toggleCollectionExpandedRow: (collectionId: string, pageId: string) => void;
  setCollectionRowExpanded: (collectionId: string, pageId: string) => void;
  replaceCollectionExpandedRowIds: (collectionId: string, pageIds: string[]) => void;
  getCollectionExpandedRowIds: (collectionId: string) => Set<string>;
  isCollectionRowExpanded: (collectionId: string, pageId: string) => boolean;
  toggleCollectionSidebarExpandedRow: (collectionId: string, pageId: string) => void;
  setCollectionSidebarRowExpanded: (collectionId: string, pageId: string) => void;
  replaceCollectionSidebarExpandedRowIds: (collectionId: string, pageIds: string[]) => void;
  getCollectionSidebarExpandedRowIds: (collectionId: string) => Set<string>;
  isCollectionSidebarRowExpanded: (collectionId: string, pageId: string) => boolean;
}

export class CollectionStore implements ICollectionStore {
  loader: TLoader = "init-loader";
  data: Record<string, TWorkspaceCollection> = {};
  error: TError | undefined = undefined;
  pageCollectionsData: Record<string, TPageCollection> = {};
  pageCollectionIdsByCollection: Map<string, Set<string>> = new Map();
  pageCollectionIdByPageId: Map<string, string> = new Map();
  pageParentIdByPageId: Map<string, string | null> = new Map();
  defaultCollectionId: string | undefined = undefined;
  hydratedMembershipsWorkspaceSlug: string | undefined = undefined;
  isHydratingMemberships = false;
  collectionExpandedRowIdsMap: Map<string, Set<string>> = new Map();
  collectionSidebarExpandedRowIdsMap: Map<string, Set<string>> = new Map();
  expandedCollectionIds: Set<string> = new Set();
  collectionService: CollectionService;
  pageCollectionService: PageCollectionService;
  branchQueries: Map<string, TCollectionBranchQueryState> = new Map();
  private fetchCollectionPagesRequests: Map<string, Promise<string[]>> = new Map();
  private branchRequestVersions: Map<string, number> = new Map();
  private fetchCollectionsRequest: Promise<TCollection[]> | undefined = undefined;
  private hydrateCollectionMembershipsRequest: Promise<void> | undefined = undefined;

  constructor(private store: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      data: observable,
      error: observable,
      pageCollectionsData: observable,
      pageCollectionIdsByCollection: observable,
      pageCollectionIdByPageId: observable,
      pageParentIdByPageId: observable,
      defaultCollectionId: observable.ref,
      hydratedMembershipsWorkspaceSlug: observable.ref,
      isHydratingMemberships: observable.ref,
      collectionExpandedRowIdsMap: observable,
      collectionSidebarExpandedRowIdsMap: observable,
      expandedCollectionIds: observable,
      branchQueries: observable,
      workspaceCollections: computed,
      fetchCollections: action,
      ensureCollectionMembershipsHydrated: action,
      fetchCollectionDetails: action,
      createCollection: action,
      deleteCollection: action,
      moveCollectionPages: action,
      updateCollectionsInStore: action,
      removeCollectionInstance: action,
      searchAddablePages: action,
      fetchCollectionPages: action,
      fetchCollectionBranch: action,
      fetchCollectionBranchChildren: action,
      resolveCollectionIdForPage: action,
      addPagesToCollection: action,
      addPageToCollection: action,
      removePageFromCollection: action,
      removeExplicitPageCollectionsFromStore: action,
      movePageWithinCollection: action,
      movePageAcrossCollections: action,
      movePageWithCollectionContext: action,
      toggleCollectionExpanded: action,
      setCollectionExpanded: action,
      toggleCollectionExpandedRow: action,
      setCollectionRowExpanded: action,
      replaceCollectionExpandedRowIds: action,
      toggleCollectionSidebarExpandedRow: action,
      setCollectionSidebarRowExpanded: action,
      replaceCollectionSidebarExpandedRowIds: action,
    });

    this.collectionService = new CollectionService();
    this.pageCollectionService = new PageCollectionService();
  }

  private resolveCollectionId = (collectionId: string) =>
    collectionId === "general" ? this.defaultCollectionId : collectionId;

  private getActualCollectionId = (collectionId: string) => this.resolveCollectionId(collectionId) ?? collectionId;

  private setLoaderState = (loader: TLoader, error: TError | undefined = undefined) => {
    runInAction(() => {
      this.loader = loader;
      this.error = error;
    });
  };

  private clearLoader = () => {
    runInAction(() => {
      this.loader = undefined;
    });
  };

  private withMutationLoader = async <T>(operation: () => Promise<T>): Promise<T> => {
    this.setLoaderState("mutation-loader");

    try {
      return await operation();
    } finally {
      this.clearLoader();
    }
  };

  private getBranchQueryStateInternal = (collectionId: string, options: TCollectionBranchQueryOptions = {}) => {
    const normalizedOptions = normalizeCollectionBranchQueryOptions(collectionId, options, this.resolveCollectionId);
    return this.branchQueries.get(getCollectionBranchQueryKey(normalizedOptions));
  };

  private ensureBranchQueryState = (collectionId: string, options: TCollectionBranchQueryOptions = {}) => {
    const normalizedOptions = normalizeCollectionBranchQueryOptions(collectionId, options, this.resolveCollectionId);
    const key = getCollectionBranchQueryKey(normalizedOptions);
    const existingState = this.branchQueries.get(key);
    if (existingState) return existingState;

    const nextState = createCollectionBranchQueryState(normalizedOptions);

    this.branchQueries.set(key, nextState);
    return nextState;
  };

  private replaceBranchQueryState = (
    collectionId: string,
    options: TCollectionBranchQueryOptions,
    updater: (state: TCollectionBranchQueryState) => TCollectionBranchQueryState
  ) => {
    const normalizedOptions = normalizeCollectionBranchQueryOptions(collectionId, options, this.resolveCollectionId);
    const nextState = updater({ ...this.ensureBranchQueryState(normalizedOptions.collectionId, normalizedOptions) });
    this.branchQueries.set(getCollectionBranchQueryKey(normalizedOptions), nextState);
    return nextState;
  };

  private clearCollectionBranchQueries = (collectionId: string) => {
    const actualCollectionId = this.getActualCollectionId(collectionId);
    [...this.branchQueries.keys()].forEach((key) => {
      if (key.startsWith(`${actualCollectionId}::`)) {
        this.branchQueries.delete(key);
        this.fetchCollectionPagesRequests.delete(key);
        this.branchRequestVersions.delete(key);
      }
    });
  };

  private isCurrentUserWorkspaceAdmin = () => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return false;

    return this.store.user.permission.allowPermissions(
      [EUserPermissions.ADMIN],
      EUserPermissionsLevel.WORKSPACE,
      workspaceSlug
    );
  };

  private isPageEligibleForCollection = (
    page: ReturnType<CollectionStore["store"]["workspacePages"]["getPageById"]> | undefined
  ): page is NonNullable<ReturnType<CollectionStore["store"]["workspacePages"]["getPageById"]>> =>
    !!page?.id && page.access === EPageAccess.PUBLIC && !page.archived_at && !page.deleted_at && !page.is_shared;

  private getPageParentId = (pageId: string): string | null | undefined => {
    if (this.pageParentIdByPageId.has(pageId)) {
      return this.pageParentIdByPageId.get(pageId) ?? null;
    }

    const page = this.store.workspacePages.getPageById(pageId);
    if (page?.id) {
      return page.parent_id ?? null;
    }

    return undefined;
  };

  getEffectiveCollectionId = computedFn((pageId: string): string | undefined => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!this.isPageEligibleForCollection(page)) return undefined;

    const explicitCollectionId = this.getPageCollectionByPageId(pageId)?.collection ?? page.collection_id;
    if (explicitCollectionId) return explicitCollectionId;

    return this.defaultCollectionId;
  });

  getExplicitCollectionIdForPage = computedFn(
    (pageId: string): string | undefined =>
      this.getPageCollectionByPageId(pageId)?.collection ??
      this.store.workspacePages.getPageById(pageId)?.collection_id ??
      undefined
  );

  private getLoadedBranchCollectionId = (pageId: string, ancestorPageIds: string[] = []) => {
    const branchPageIds = [pageId, ...ancestorPageIds];

    for (const branchPageId of branchPageIds) {
      const explicitCollectionId = this.getExplicitCollectionIdForPage(branchPageId);
      if (explicitCollectionId) {
        return explicitCollectionId;
      }
    }

    return undefined;
  };

  private isUnfilteredBranchQueryState = (state: TCollectionBranchQueryState) =>
    state.searchQuery.length === 0 && !hasCollectionBranchFilters(state.filters);

  private getUnfilteredBranchPageIds = (collectionId: string, parentId: string | null): string[] => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    const pageIds = new Set<string>(this.getLoadedCollectionViewPageIds(actualCollectionId));
    [...(this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set())]
      .map((pageCollectionId) => this.pageCollectionsData[pageCollectionId]?.page)
      .filter((pageId): pageId is string => !!pageId)
      .forEach((pageId) => pageIds.add(pageId));

    return [...pageIds]
      .map((pageId) => this.store.workspacePages.getPageById(pageId))
      .filter(
        (page): page is NonNullable<typeof page> =>
          !!page?.id &&
          this.isPageEligibleForCollection(page) &&
          (this.getPageParentId(page.id) ?? null) === parentId &&
          this.getEffectiveCollectionId(page.id) === actualCollectionId
      )
      .sort(
        (leftPage, rightPage) =>
          this.getCollectionOrderValue(leftPage.id as string) - this.getCollectionOrderValue(rightPage.id as string)
      )
      .map((page) => page.id as string);
  };

  private syncLoadedUnfilteredBranchState = (collectionId: string, parentId: string | null) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return;

    const nextPageIds = this.getUnfilteredBranchPageIds(actualCollectionId, parentId);
    [...this.branchQueries.entries()].forEach(([key, state]) => {
      if (
        state.collectionId !== actualCollectionId ||
        state.parentId !== parentId ||
        !state.isLoaded ||
        !this.isUnfilteredBranchQueryState(state)
      ) {
        return;
      }

      this.branchQueries.set(key, {
        ...state,
        pageIds: nextPageIds,
      });
    });
  };

  private syncLoadedUnfilteredBranchesForMove = (params: {
    pageId: string;
    sourceCollectionId?: string;
    sourceParentId: string | null;
    targetCollectionId: string;
    targetParentId: string | null;
  }) => {
    void params.pageId;

    if (params.sourceCollectionId) {
      this.syncLoadedUnfilteredBranchState(params.sourceCollectionId, params.sourceParentId);
    }

    if (params.sourceCollectionId === params.targetCollectionId && params.sourceParentId === params.targetParentId) {
      return;
    }

    this.syncLoadedUnfilteredBranchState(params.targetCollectionId, params.targetParentId);
  };

  private resetHydrationRequestIfIdle = () => {
    if (this.fetchCollectionPagesRequests.size === 0) {
      this.hydrateCollectionMembershipsRequest = undefined;
      this.isHydratingMemberships = false;
    }
  };

  private invalidateBranchQueries = (branchKeys: Iterable<string>) => {
    const uniqueBranchKeys = [...new Set(branchKeys)];
    if (uniqueBranchKeys.length === 0) return;

    uniqueBranchKeys.forEach((branchKey) => {
      const existingState = this.branchQueries.get(branchKey);
      if (existingState) {
        this.branchQueries.set(branchKey, {
          ...existingState,
          isStale: true,
        });
      }

      this.fetchCollectionPagesRequests.delete(branchKey);
      this.branchRequestVersions.set(branchKey, (this.branchRequestVersions.get(branchKey) ?? 0) + 1);
    });

    this.resetHydrationRequestIfIdle();
  };

  private invalidateLoadedBranchQueries = (matcher: (state: TCollectionBranchQueryState) => boolean) => {
    this.invalidateBranchQueries(
      [...this.branchQueries.entries()].filter(([, state]) => state.isLoaded && matcher(state)).map(([key]) => key)
    );
  };

  private invalidateLoadedBranchQueriesForParent = (
    collectionId: string,
    parentId: string | null,
    options: { includeUnfiltered?: boolean } = {}
  ) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return;

    const shouldIncludeUnfiltered = options.includeUnfiltered ?? true;

    this.invalidateLoadedBranchQueries(
      (state) =>
        state.collectionId === actualCollectionId &&
        state.parentId === parentId &&
        (shouldIncludeUnfiltered || !this.isUnfilteredBranchQueryState(state))
    );
  };

  private invalidateLoadedBranchQueriesForMove = (
    params: {
      sourceCollectionId?: string;
      sourceParentId: string | null;
      targetCollectionId: string;
      targetParentId: string | null;
    },
    options: { includeUnfiltered?: boolean } = {}
  ) => {
    if (params.sourceCollectionId) {
      this.invalidateLoadedBranchQueriesForParent(params.sourceCollectionId, params.sourceParentId, options);
    }

    if (params.sourceCollectionId === params.targetCollectionId && params.sourceParentId === params.targetParentId) {
      return;
    }

    this.invalidateLoadedBranchQueriesForParent(params.targetCollectionId, params.targetParentId, options);
  };

  private markLoadedUnfilteredBranchStateFresh = (collectionId: string, parentId: string | null) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return;

    [...this.branchQueries.entries()].forEach(([key, state]) => {
      if (
        state.collectionId !== actualCollectionId ||
        state.parentId !== parentId ||
        !state.isLoaded ||
        !this.isUnfilteredBranchQueryState(state)
      ) {
        return;
      }

      this.branchQueries.set(key, {
        ...state,
        isLoading: false,
        isStale: false,
      });
    });
  };

  private markLoadedUnfilteredBranchesFreshForMove = (params: {
    sourceCollectionId?: string;
    sourceParentId: string | null;
    targetCollectionId: string;
    targetParentId: string | null;
  }) => {
    if (params.sourceCollectionId) {
      this.markLoadedUnfilteredBranchStateFresh(params.sourceCollectionId, params.sourceParentId);
    }

    if (params.sourceCollectionId === params.targetCollectionId && params.sourceParentId === params.targetParentId) {
      return;
    }

    this.markLoadedUnfilteredBranchStateFresh(params.targetCollectionId, params.targetParentId);
  };

  private syncLoadedSubtreeBranchQueriesForMove = (params: {
    pageId: string;
    sourceCollectionId?: string;
    targetCollectionId: string;
  }) => {
    const actualSourceCollectionId = params.sourceCollectionId
      ? this.resolveCollectionId(params.sourceCollectionId)
      : undefined;
    const actualTargetCollectionId = this.resolveCollectionId(params.targetCollectionId);

    if (
      !actualSourceCollectionId ||
      !actualTargetCollectionId ||
      actualSourceCollectionId === actualTargetCollectionId
    ) {
      return;
    }

    const subtreePageIds = new Set(getLoadedSubtreePageIds(params.pageId, this.store.workspacePages.getPageById));
    const branchKeysToInvalidate: string[] = [];

    [...this.branchQueries.values()]
      .filter(
        (state) =>
          state.collectionId === actualSourceCollectionId &&
          !!state.parentId &&
          subtreePageIds.has(state.parentId) &&
          state.isLoaded
      )
      .forEach((state) => {
        const normalizedOptions = normalizeCollectionBranchQueryOptions(
          actualTargetCollectionId,
          {
            parentId: state.parentId,
            searchQuery: state.searchQuery,
            filters: state.filters,
          },
          this.resolveCollectionId
        );
        const branchKey = getCollectionBranchQueryKey(normalizedOptions);

        branchKeysToInvalidate.push(branchKey);
        this.branchQueries.set(branchKey, {
          ...state,
          collectionId: normalizedOptions.collectionId,
          parentId: normalizedOptions.parentId,
          searchQuery: normalizedOptions.searchQuery,
          filters: normalizedOptions.filters,
          isLoading: false,
          isLoaded: true,
          isStale: true,
        });
      });

    this.invalidateBranchQueries(branchKeysToInvalidate);
  };

  private markCollectionChildBranchForRefresh = (collectionId: string, pageId: string) => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id || (page.sub_pages_count ?? 0) === 0) return;

    const normalizedOptions = normalizeCollectionBranchQueryOptions(
      collectionId,
      { parentId: pageId },
      this.resolveCollectionId
    );
    const branchKey = getCollectionBranchQueryKey(normalizedOptions);
    const existingState = this.branchQueries.get(branchKey) ?? createCollectionBranchQueryState(normalizedOptions);

    this.branchQueries.set(branchKey, {
      ...existingState,
      collectionId: normalizedOptions.collectionId,
      parentId: normalizedOptions.parentId,
      searchQuery: normalizedOptions.searchQuery,
      filters: normalizedOptions.filters,
      isLoading: false,
      isLoaded: true,
      isStale: true,
    });
    this.invalidateBranchQueries([branchKey]);
  };

  private getLoadedCollectionViewPageIds = (collectionId: string): Set<string> => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return new Set();

    return [...this.branchQueries.values()]
      .filter(
        (state) =>
          state.collectionId === actualCollectionId &&
          state.isLoaded &&
          state.searchQuery.length === 0 &&
          !hasCollectionBranchFilters(state.filters)
      )
      .reduce((pageIds, state) => {
        state.pageIds.forEach((pageId) => pageIds.add(pageId));
        return pageIds;
      }, new Set<string>());
  };

  private clearPageCollectionsForCollection = (collectionId: string) => {
    const actualCollectionId = this.getActualCollectionId(collectionId);
    const pageCollectionIds = [...(this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set())];

    pageCollectionIds.forEach((pageCollectionId) => {
      const pageCollection = this.pageCollectionsData[pageCollectionId];
      if (pageCollection && this.pageCollectionIdByPageId.get(pageCollection.page) === pageCollectionId) {
        this.pageCollectionIdByPageId.delete(pageCollection.page);
        this.pageParentIdByPageId.delete(pageCollection.page);
      }
      delete this.pageCollectionsData[pageCollectionId];
    });

    this.pageCollectionIdsByCollection.set(actualCollectionId, new Set());
  };

  private upsertPageCollection = (pageCollection: TPageCollection, parentId?: string | null) => {
    const existingPageCollectionId = this.pageCollectionIdByPageId.get(pageCollection.page);
    if (existingPageCollectionId && existingPageCollectionId !== pageCollection.id) {
      this.removePageCollection(existingPageCollectionId);
    }

    this.pageCollectionsData[pageCollection.id] = pageCollection;

    const prevSet = this.pageCollectionIdsByCollection.get(pageCollection.collection) ?? new Set<string>();
    const nextSet = new Set(prevSet);
    nextSet.add(pageCollection.id);
    this.pageCollectionIdsByCollection.set(pageCollection.collection, nextSet);
    this.pageCollectionIdByPageId.set(pageCollection.page, pageCollection.id);
    if (parentId !== undefined) {
      this.pageParentIdByPageId.set(pageCollection.page, parentId ?? null);
    }
  };

  private upsertCollectionBranchPage = (page: TCollectionBranchPageSummary) => {
    if (!page?.id) return;

    const pageInstance = this.store.workspacePages.getPageById(page.id);
    if (pageInstance) {
      pageInstance.mutateProperties(page as TPage);
      return;
    }

    set(this.store.workspacePages.data, [page.id], new WorkspacePage(this.store, page as TPage));
  };

  private upsertCollectionBranchRow = (row: TCollectionBranchRow) => {
    if (!row.page?.id) return;

    const parentId = row.parent_id ?? row.page.parent_id ?? null;

    this.upsertCollectionBranchPage(row.page);

    const currentPageCollection = this.getPageCollectionByPageId(row.page.id);
    if (!row.page_collection_id) {
      if (currentPageCollection && !this.isOptimisticPageCollectionId(currentPageCollection.id)) {
        this.removePageCollection(currentPageCollection.id);
      }
      this.pageParentIdByPageId.set(row.page.id, parentId);
      return;
    }

    this.upsertPageCollection(
      {
        id: row.page_collection_id,
        page: row.page.id,
        collection: row.collection_id,
        sort_order: row.sort_order ?? row.page.sort_order ?? undefined,
        workspace: row.page.workspace,
        created_at: row.page.created_at,
        updated_at: row.page.updated_at,
        created_by: row.page.created_by,
        updated_by: row.page.updated_by,
      },
      parentId
    );
  };

  private getBranchPageIds = (rows: TCollectionBranchRow[]) =>
    rows.map((row) => row.page.id).filter((pageId): pageId is string => !!pageId);

  private removePageCollection = (pageCollectionId: string) => {
    const pageCollection = this.pageCollectionsData[pageCollectionId];
    if (!pageCollection) return;

    const prevSet = this.pageCollectionIdsByCollection.get(pageCollection.collection);
    if (prevSet) {
      const nextSet = new Set(prevSet);
      nextSet.delete(pageCollectionId);
      this.pageCollectionIdsByCollection.set(pageCollection.collection, nextSet);
    }
    if (this.pageCollectionIdByPageId.get(pageCollection.page) === pageCollectionId) {
      this.pageCollectionIdByPageId.delete(pageCollection.page);
      this.pageParentIdByPageId.delete(pageCollection.page);
    }

    delete this.pageCollectionsData[pageCollectionId];
  };

  private isOptimisticPageCollectionId = (pageCollectionId: string) =>
    pageCollectionId.startsWith(OPTIMISTIC_PAGE_COLLECTION_ID_PREFIX);

  private buildOptimisticPageCollection = (
    pageId: string,
    collectionId: string,
    overrides: Partial<TPageCollection> = {}
  ): TPageCollection | undefined => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id) return undefined;

    const actualCollectionId = this.getActualCollectionId(collectionId);

    return {
      id: `${OPTIMISTIC_PAGE_COLLECTION_ID_PREFIX}${actualCollectionId}-${pageId}`,
      collection: actualCollectionId,
      page: pageId,
      workspace: page.workspace ?? this.store.workspaceRoot.currentWorkspace?.id ?? "",
      sort_order: page.sort_order ?? undefined,
      created_at: new Date(0),
      updated_at: new Date(0),
      created_by: page.created_by ?? "",
      updated_by: page.updated_by ?? "",
      ...overrides,
    };
  };

  private resolveMutationSourceCollectionId = (
    pageId: string,
    sourceCollectionId?: string | null
  ): string | undefined => {
    const resolvedSourceCollectionId = sourceCollectionId ? this.resolveCollectionId(sourceCollectionId) : undefined;
    if (resolvedSourceCollectionId) return resolvedSourceCollectionId;

    const currentEffectiveCollectionId = this.getEffectiveCollectionId(pageId);
    if (currentEffectiveCollectionId) return currentEffectiveCollectionId;

    const page = this.store.workspacePages.getPageById(pageId);
    if (this.isPageEligibleForCollection(page) && this.defaultCollectionId) {
      return this.defaultCollectionId;
    }

    return undefined;
  };

  private syncCollectionsInBackground = (workspaceSlug: string, collectionIds: Array<string | null | undefined>) => {
    const resolvedCollectionIds = [
      ...new Set(
        collectionIds
          .map((collectionId) => (collectionId ? this.resolveCollectionId(collectionId) : undefined))
          .filter(Boolean)
      ),
    ] as string[];

    if (resolvedCollectionIds.length === 0) return;

    void (async () => {
      const staleLoadedBranchQueries = [...this.branchQueries.values()].filter(
        (state) =>
          resolvedCollectionIds.includes(state.collectionId) &&
          state.isLoaded &&
          state.isStale &&
          !(state.parentId === null && this.isUnfilteredBranchQueryState(state))
      );

      for (const state of staleLoadedBranchQueries) {
        if (state.parentId) {
          await this.fetchCollectionBranchChildren(workspaceSlug, state.collectionId, state.parentId, {
            force: true,
            searchQuery: state.searchQuery,
            filters: state.filters,
            perPage: 100,
          });
        } else {
          await this.fetchCollectionPages(workspaceSlug, state.collectionId, {
            force: true,
            searchQuery: state.searchQuery,
            filters: state.filters,
          });
        }
      }
    })();
  };

  private refreshUnfilteredRootBranch = async (
    workspaceSlug: string,
    collectionId: string,
    previouslyLoadedPageCount: number
  ) => {
    await this.fetchCollectionPages(workspaceSlug, collectionId, { force: true });

    let rootBranchState = this.getCollectionBranchState(collectionId, { parentId: null });
    while (
      rootBranchState?.hasNextPage &&
      rootBranchState.nextCursor &&
      rootBranchState.pageIds.length < previouslyLoadedPageCount
    ) {
      await this.fetchCollectionPages(workspaceSlug, collectionId, {
        cursor: rootBranchState.nextCursor,
      });
      rootBranchState = this.getCollectionBranchState(collectionId, { parentId: null });
    }
  };

  private refreshLoadedCollectionBranchesAfterMove = (
    workspaceSlug: string,
    params: {
      sourceCollectionId?: string;
      sourceParentId: string | null;
      targetCollectionId: string;
      targetParentId: string | null;
    }
  ) => {
    const candidateBranches = [
      params.sourceCollectionId
        ? { collectionId: params.sourceCollectionId, parentId: params.sourceParentId }
        : undefined,
      { collectionId: params.targetCollectionId, parentId: params.targetParentId },
    ].filter((branch): branch is { collectionId: string; parentId: string | null } => !!branch);

    const loadedBranches = [
      ...new Map(
        candidateBranches
          .filter(({ collectionId, parentId }) => this.getCollectionBranchState(collectionId, { parentId })?.isLoaded)
          .map((branch) => [
            `${this.resolveCollectionId(branch.collectionId) ?? branch.collectionId}:${branch.parentId ?? "__root__"}`,
            branch,
          ])
      ).values(),
    ];

    if (loadedBranches.length === 0) return;

    void (async () => {
      for (const branch of loadedBranches) {
        if (branch.parentId) {
          await this.fetchCollectionBranchChildren(workspaceSlug, branch.collectionId, branch.parentId, {
            force: true,
            perPage: 100,
          });
          continue;
        }

        const rootBranchState = this.getCollectionBranchState(branch.collectionId, { parentId: null });
        await this.refreshUnfilteredRootBranch(
          workspaceSlug,
          branch.collectionId,
          rootBranchState?.pageIds.length ?? 0
        );
      }
    })();
  };

  private getCollectionOrderValue = (pageId: string) => {
    const explicitPageCollection = this.getPageCollectionByPageId(pageId);
    return explicitPageCollection?.sort_order ?? this.store.workspacePages.getPageById(pageId)?.sort_order ?? 65535;
  };

  private getSiblingPageIdsInCollection = (collectionId: string, parentId: string | null | undefined) =>
    [...this.getCollectionViewPageIds(collectionId)]
      .map((pageId) => this.store.workspacePages.getPageById(pageId))
      .filter(
        (page): page is NonNullable<typeof page> =>
          !!page?.id &&
          this.isPageEligibleForCollection(page) &&
          (page.parent_id ?? null) === (parentId ?? null) &&
          this.getEffectiveCollectionId(page.id) === this.resolveCollectionId(collectionId)
      )
      .sort(
        (leftPage, rightPage) =>
          this.getCollectionOrderValue(leftPage.id as string) - this.getCollectionOrderValue(rightPage.id as string)
      )
      .map((page) => page.id as string);

  private computeAppendSortOrder = (
    collectionId: string,
    parentId: string | null | undefined,
    pageId?: string
  ): number => {
    const siblingPageIds = this.getSiblingPageIdsInCollection(collectionId, parentId).filter(
      (siblingPageId) => siblingPageId !== pageId
    );
    const lastSiblingPageId = siblingPageIds.at(-1);

    return lastSiblingPageId
      ? this.getCollectionOrderValue(lastSiblingPageId) + PAGE_COLLECTION_SORT_ORDER_INCREMENT
      : PAGE_COLLECTION_SORT_ORDER_INCREMENT;
  };

  private shouldPreserveCurrentSortOrderForUnloadedTargetBranch = (
    collectionId: string,
    targetParentId: string | null,
    pageId: string
  ) => {
    if (!targetParentId) return false;

    const targetBranchState = this.getCollectionBranchState(collectionId, { parentId: targetParentId });
    if (targetBranchState?.isLoaded) {
      return false;
    }

    const targetParentPage = this.store.workspacePages.getPageById(targetParentId);
    if ((targetParentPage?.sub_pages_count ?? 0) <= 0) {
      return false;
    }

    return (
      this.getSiblingPageIdsInCollection(collectionId, targetParentId).filter(
        (siblingPageId) => siblingPageId !== pageId
      ).length === 0
    );
  };

  private bumpCollectionMembershipEpoch = (affectedCollectionIds?: string[]) => {
    if (affectedCollectionIds && affectedCollectionIds.length > 0) {
      const branchKeys = affectedCollectionIds.flatMap((collectionId) => {
        const resolvedId = this.resolveCollectionId(collectionId) ?? collectionId;
        const prefix = `${resolvedId}::`;

        return [
          ...[...this.branchQueries.keys()].filter((key) => key.startsWith(prefix)),
          ...[...this.fetchCollectionPagesRequests.keys()].filter((key) => key.startsWith(prefix)),
        ];
      });

      this.invalidateBranchQueries(branchKeys);
      return;
    }

    this.invalidateBranchQueries([...this.branchQueries.keys(), ...this.fetchCollectionPagesRequests.keys()]);
  };

  private hydrateCollectionMemberships = async (workspaceSlug: string) => {
    if (this.hasHydratedCollectionMemberships(workspaceSlug)) {
      return;
    }

    if (this.hydrateCollectionMembershipsRequest) {
      await this.hydrateCollectionMembershipsRequest;
      return;
    }

    runInAction(() => {
      this.isHydratingMemberships = true;
    });

    const request = (async () => {
      await this.fetchCollections(workspaceSlug);
      runInAction(() => {
        this.hydratedMembershipsWorkspaceSlug = workspaceSlug;
      });
    })();
    this.hydrateCollectionMembershipsRequest = request;

    try {
      await request;
    } finally {
      if (this.hydrateCollectionMembershipsRequest === request) {
        runInAction(() => {
          this.isHydratingMemberships = false;
          this.hydrateCollectionMembershipsRequest = undefined;
        });
      }
    }
  };

  get workspaceCollections() {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;

    const collections = Object.values(this.data).filter((collection) => collection.workspace === currentWorkspace.id);
    if (collections.length === 0) return undefined;

    return collections
      .sort((a, b) => (a.sort_order ?? 65535) - (b.sort_order ?? 65535))
      .map((collection) => collection.asJSON);
  }

  hasHydratedCollectionMemberships = computedFn(
    (workspaceSlug: string) => this.hydratedMembershipsWorkspaceSlug === workspaceSlug
  );

  isCollectionPagesLoaded = computedFn((collectionId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    const branchState = this.getBranchQueryStateInternal(actualCollectionId, { parentId: null });
    return !!branchState?.isLoaded;
  });

  getCollectionById = computedFn((collectionId: string) => this.data[collectionId]);

  getPageCollectionByPageId = computedFn((pageId: string) => {
    const pageCollectionId = this.pageCollectionIdByPageId.get(pageId);
    if (!pageCollectionId) return undefined;

    return this.pageCollectionsData[pageCollectionId];
  });

  ensureCollectionMembershipsHydrated = async (workspaceSlug: string) => {
    await this.hydrateCollectionMemberships(workspaceSlug);
  };

  fetchCollections = async (workspaceSlug: string) => {
    const currentCollections = this.workspaceCollections;
    if (currentCollections) {
      return currentCollections;
    }

    if (this.fetchCollectionsRequest) {
      return await this.fetchCollectionsRequest;
    }

    try {
      const existingCollections = currentCollections ?? [];

      runInAction(() => {
        if (this.hydratedMembershipsWorkspaceSlug !== workspaceSlug) {
          this.hydratedMembershipsWorkspaceSlug = undefined;
        }
      });
      this.setLoaderState(existingCollections.length > 0 ? "mutation-loader" : "init-loader");

      const request = this.collectionService.list(workspaceSlug);
      this.fetchCollectionsRequest = request;

      const collections = await request;
      this.updateCollectionsInStore(collections);

      runInAction(() => {
        this.defaultCollectionId = collections.find((collection) => collection.is_default)?.id;
        this.loader = undefined;
      });

      return collections;
    } catch (error) {
      this.setLoaderState(undefined, {
        title: "Failed",
        description: "Failed to fetch the collections, Please try again later.",
      });
      throw error;
    } finally {
      if (this.fetchCollectionsRequest) {
        this.fetchCollectionsRequest = undefined;
      }
    }
  };

  fetchCollectionDetails = async (workspaceSlug: string, collectionId: string) => {
    try {
      const actualCollectionId = this.getActualCollectionId(collectionId);
      const cachedCollection = this.getCollectionById(actualCollectionId)?.asJSON;
      if (cachedCollection) {
        return cachedCollection;
      }

      this.setLoaderState("init-loader");

      const collection = await this.collectionService.retrieve(workspaceSlug, actualCollectionId);
      this.updateCollectionsInStore([collection]);

      runInAction(() => {
        if (collection.is_default) this.defaultCollectionId = collection.id;
        this.loader = undefined;
      });

      return collection;
    } catch (error) {
      this.setLoaderState(undefined, {
        title: "Failed",
        description: "Failed to fetch the collection, Please try again later.",
      });
      throw error;
    }
  };

  createCollection = async (workspaceSlug: string, data: TCollectionCreatePayload) =>
    this.withMutationLoader(async () => {
      const collection = await this.collectionService.create(workspaceSlug, data);
      this.updateCollectionsInStore([collection]);

      return collection;
    });

  deleteCollection = async (workspaceSlug: string, collectionId: string) =>
    this.withMutationLoader(async () => {
      const actualCollectionId = this.getActualCollectionId(collectionId);
      const pageCollectionIds = [...(this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set())];
      const pageIds = pageCollectionIds
        .map((pcId) => this.pageCollectionsData[pcId]?.page)
        .filter((id): id is string => !!id);

      await this.collectionService.destroy(workspaceSlug, collectionId);
      this.removeCollectionInstance(collectionId);

      runInAction(() => {
        pageIds.forEach((pageId) => this.store.workspacePages.removePageInstance(pageId));
      });
    });

  moveCollectionPages = async (workspaceSlug: string, collectionId: string, newCollectionId: string) =>
    this.withMutationLoader(async () => {
      const actualCollectionId = this.getActualCollectionId(collectionId);
      const actualNewCollectionId = this.getActualCollectionId(newCollectionId);

      await this.collectionService.movePages(workspaceSlug, collectionId, newCollectionId);

      runInAction(() => {
        Object.values(this.store.workspacePages.data).forEach((page) => {
          if (page?.collection_id === actualCollectionId) {
            page.mutateProperties({ collection_id: actualNewCollectionId });
          }
        });
      });

      this.removeCollectionInstance(collectionId);
      // Re-fetch target collection pages so moved pages appear in the correct collection
      await this.fetchCollectionPages(workspaceSlug, newCollectionId, { force: true });
    });

  updateCollectionsInStore = (collections: TCollection[]) => {
    runInAction(() => {
      for (const collection of collections) {
        if (!collection.id) continue;

        const collectionInstance = this.getCollectionById(collection.id);
        if (collectionInstance) {
          collectionInstance.mutateProperties(collection);
        } else {
          set(this.data, [collection.id], new WorkspaceCollection(this.store, collection));
        }

        if (collection.is_default) {
          this.defaultCollectionId = collection.id;
        }
      }
    });
  };

  removeCollectionInstance = (collectionId: string) => {
    const actualCollectionId = this.getActualCollectionId(collectionId);

    runInAction(() => {
      delete this.data[actualCollectionId];
      this.clearPageCollectionsForCollection(actualCollectionId);
      this.clearCollectionBranchQueries(actualCollectionId);
      this.collectionExpandedRowIdsMap.delete(actualCollectionId);
      this.collectionSidebarExpandedRowIdsMap.delete(actualCollectionId);
      this.expandedCollectionIds.delete(actualCollectionId);

      if (this.defaultCollectionId === actualCollectionId) {
        this.defaultCollectionId = undefined;
      }
    });
  };

  getCollectionBranchState: ICollectionStore["getCollectionBranchState"] = (collectionId, options = {}) =>
    this.getBranchQueryStateInternal(collectionId, options);

  searchAddablePages: ICollectionStore["searchAddablePages"] = (workspaceSlug, collectionId, params = {}) =>
    this.pageCollectionService.searchAddablePages(workspaceSlug, this.getActualCollectionId(collectionId), params);

  fetchCollectionBranch: ICollectionStore["fetchCollectionBranch"] = async (
    workspaceSlug,
    collectionId,
    options = {}
  ) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    const branchOptions: TCollectionBranchQueryOptions = {
      parentId: options.parentId ?? null,
      searchQuery: options.searchQuery,
      filters: options.filters,
    };
    const normalizedBranchOptions = normalizeCollectionBranchQueryOptions(
      actualCollectionId,
      branchOptions,
      this.resolveCollectionId
    );
    const branchKey = getCollectionBranchQueryKey(normalizedBranchOptions);
    const currentState = this.getBranchQueryStateInternal(actualCollectionId, branchOptions);

    if (!options.force && currentState?.isLoaded && !currentState.isStale && !options.cursor) {
      return currentState.pageIds;
    }

    const inFlightRequest = this.fetchCollectionPagesRequests.get(branchKey);
    if (inFlightRequest) return inFlightRequest;

    const requestVersion = (this.branchRequestVersions.get(branchKey) ?? 0) + 1;
    this.branchRequestVersions.set(branchKey, requestVersion);
    const isLatestBranchRequest = () => this.branchRequestVersions.get(branchKey) === requestVersion;

    runInAction(() => {
      this.replaceBranchQueryState(actualCollectionId, branchOptions, (state) => ({
        ...state,
        isLoading: true,
      }));
    });

    const request = (async () => {
      const response = await this.pageCollectionService.list(workspaceSlug, actualCollectionId, {
        parent_id: options.parentId ?? null,
        search: options.searchQuery,
        filters: options.filters,
        cursor: options.cursor,
        per_page: options.perPage,
      });
      const nextPageIds = this.getBranchPageIds(response.results);

      runInAction(() => {
        if (!isLatestBranchRequest()) {
          return;
        }

        response.results.forEach((row) => this.upsertCollectionBranchRow(row));

        const isUnfilteredBranch = normalizedBranchOptions.searchQuery.length === 0 && !normalizedBranchOptions.filters;
        const parentPage = options.parentId ? this.store.workspacePages.getPageById(options.parentId) : undefined;
        const localBranchPageIds = isUnfilteredBranch
          ? this.getUnfilteredBranchPageIds(actualCollectionId, options.parentId ?? null)
          : [];
        const shouldPreserveLocalBranchPageIds =
          !options.cursor &&
          isUnfilteredBranch &&
          !response.next_page_results &&
          !!currentState?.isLoaded &&
          localBranchPageIds.length > nextPageIds.length;
        const shouldKeepBranchStale =
          !options.cursor &&
          isUnfilteredBranch &&
          ((!!options.parentId && nextPageIds.length === 0 && (parentPage?.sub_pages_count ?? 0) > 0) ||
            shouldPreserveLocalBranchPageIds);

        this.replaceBranchQueryState(actualCollectionId, branchOptions, (state) => ({
          ...state,
          pageIds: options.cursor
            ? [...new Set([...state.pageIds, ...nextPageIds])]
            : shouldPreserveLocalBranchPageIds
              ? localBranchPageIds
              : nextPageIds,
          nextCursor: response.next_page_results ? response.next_cursor : null,
          hasNextPage: !!response.next_page_results,
          isLoading: false,
          isLoaded: true,
          isStale: shouldKeepBranchStale,
        }));
      });

      return (
        this.getBranchQueryStateInternal(actualCollectionId, branchOptions)?.pageIds ?? currentState?.pageIds ?? []
      );
    })().catch((error: unknown) => {
      runInAction(() => {
        if (!isLatestBranchRequest()) {
          return;
        }

        this.replaceBranchQueryState(actualCollectionId, branchOptions, (state) => ({
          ...state,
          isLoading: false,
        }));
      });

      throw error;
    });

    this.fetchCollectionPagesRequests.set(branchKey, request);

    try {
      return await request;
    } finally {
      if (this.fetchCollectionPagesRequests.get(branchKey) === request) {
        this.fetchCollectionPagesRequests.delete(branchKey);
      }
    }
  };

  fetchCollectionBranchChildren: ICollectionStore["fetchCollectionBranchChildren"] = async (
    workspaceSlug,
    collectionId,
    parentId,
    options = {}
  ) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    const branchOptions: TCollectionBranchQueryOptions = {
      parentId,
      searchQuery: options.searchQuery,
      filters: options.filters,
    };
    let pageIds = await this.fetchCollectionBranch(workspaceSlug, actualCollectionId, {
      parentId,
      force: options.force,
      searchQuery: options.searchQuery,
      filters: options.filters,
      perPage: options.perPage ?? 100,
    });
    let branchState = this.getBranchQueryStateInternal(actualCollectionId, branchOptions);

    while (branchState?.hasNextPage && branchState.nextCursor) {
      pageIds = await this.fetchCollectionBranch(workspaceSlug, actualCollectionId, {
        parentId,
        searchQuery: options.searchQuery,
        filters: options.filters,
        cursor: branchState.nextCursor,
        perPage: options.perPage ?? 100,
      });
      branchState = this.getBranchQueryStateInternal(actualCollectionId, branchOptions);
    }

    return pageIds;
  };

  fetchCollectionPages = async (
    workspaceSlug: string,
    collectionId: string,
    options?: {
      force?: boolean;
      searchQuery?: string;
      filters?: TPageFilterProps;
      cursor?: string;
    }
  ) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    const pageIds = await this.fetchCollectionBranch(workspaceSlug, actualCollectionId, {
      parentId: null,
      force: options?.force,
      searchQuery: options?.searchQuery,
      filters: options?.filters,
      cursor: options?.cursor,
      perPage: 50,
    });

    return pageIds
      .map((pageId) => this.getPageCollectionByPageId(pageId))
      .filter((pageCollection): pageCollection is TPageCollection => !!pageCollection);
  };

  refreshCollectionBranchForPage: ICollectionStore["refreshCollectionBranchForPage"] = async (
    workspaceSlug,
    pageId,
    ancestorPageIds = []
  ) => {
    const collectionId = this.getLoadedBranchCollectionId(pageId, ancestorPageIds);
    const parentId = this.getPageParentId(pageId) ?? null;

    if (!collectionId) {
      this.invalidateLoadedBranchQueries((state) => state.parentId === parentId);
      return undefined;
    }

    if (parentId) {
      await this.fetchCollectionBranchChildren(workspaceSlug, collectionId, parentId, {
        force: true,
      });
      return collectionId;
    }

    await this.fetchCollectionPages(workspaceSlug, collectionId, {
      force: true,
    });
    return collectionId;
  };

  resolveCollectionIdForPage = async (workspaceSlug: string, pageId: string, ancestorPageIds: string[] = []) => {
    const branchPageIds = [pageId, ...ancestorPageIds];
    const loadedBranchCollectionId = this.getLoadedBranchCollectionId(pageId, ancestorPageIds);
    if (loadedBranchCollectionId) {
      return loadedBranchCollectionId;
    }

    const collections = this.workspaceCollections ?? (await this.fetchCollections(workspaceSlug));
    const customCollectionIds = collections
      .filter((collection) => !collection.is_default)
      .map((collection) => collection.id);

    // On page reloads the current page payload can arrive without collection metadata.
    // Probe custom collection roots one collection at a time until the current branch
    // gains an explicit membership instead of eagerly treating it as General.
    for (const collectionId of customCollectionIds) {
      if (!this.isCollectionPagesLoaded(collectionId)) {
        await this.fetchCollectionPages(workspaceSlug, collectionId);
      }

      if (branchPageIds.some((branchPageId) => this.getExplicitCollectionIdForPage(branchPageId) === collectionId)) {
        return collectionId;
      }

      // The initial load only fetches the first page of root items. If the
      // target page was not found yet and more root pages exist, keep
      // paginating until we either locate it or exhaust all pages.
      let branchState = this.getBranchQueryStateInternal(collectionId, { parentId: null });
      while (branchState?.hasNextPage && branchState.nextCursor) {
        await this.fetchCollectionBranch(workspaceSlug, collectionId, {
          parentId: null,
          cursor: branchState.nextCursor,
          perPage: 50,
        });

        if (branchPageIds.some((branchPageId) => this.getExplicitCollectionIdForPage(branchPageId) === collectionId)) {
          return collectionId;
        }

        branchState = this.getBranchQueryStateInternal(collectionId, { parentId: null });
      }
    }

    if (!this.defaultCollectionId) {
      return undefined;
    }

    if (!this.isCollectionPagesLoaded(this.defaultCollectionId)) {
      await this.fetchCollectionPages(workspaceSlug, this.defaultCollectionId);
    }

    // Same pagination for the default collection — exhaust all root pages
    // before falling back to the effective collection lookup.
    let defaultBranchState = this.getBranchQueryStateInternal(this.defaultCollectionId, { parentId: null });
    while (defaultBranchState?.hasNextPage && defaultBranchState.nextCursor) {
      await this.fetchCollectionBranch(workspaceSlug, this.defaultCollectionId, {
        parentId: null,
        cursor: defaultBranchState.nextCursor,
        perPage: 50,
      });
      defaultBranchState = this.getBranchQueryStateInternal(this.defaultCollectionId, { parentId: null });
    }

    return this.getEffectiveCollectionId(pageId);
  };

  addPageToCollection = async (workspaceSlug: string, pageId: string, targetCollectionId: string) => {
    await this.addPagesToCollection(workspaceSlug, [pageId], targetCollectionId);
  };

  addPagesToCollection = async (workspaceSlug: string, pageIds: string[], targetCollectionId: string) => {
    const actualTargetCollectionId = this.resolveCollectionId(targetCollectionId);
    const uniquePageIds = [...new Set(pageIds.filter(Boolean))];
    if (!actualTargetCollectionId || uniquePageIds.length === 0) return;

    const missingPageIds = uniquePageIds.filter((pageId) => !this.store.workspacePages.getPageById(pageId));
    if (missingPageIds.length > 0) {
      await Promise.all(
        missingPageIds.map((pageId) =>
          this.store.workspacePages.getOrFetchPageInstance({
            pageId,
            trackVisit: false,
            shouldFetchParentPages: false,
            shouldFetchSubPages: false,
          })
        )
      );
    }

    const movablePageIds = uniquePageIds.filter((pageId) => {
      const sourceCollectionId = this.resolveMutationSourceCollectionId(pageId);
      return !!sourceCollectionId && sourceCollectionId !== actualTargetCollectionId;
    });
    if (movablePageIds.length === 0) return;

    const sourceCollectionIds = [
      ...new Set(
        movablePageIds
          .map((pageId) => this.resolveMutationSourceCollectionId(pageId))
          .filter((id): id is string => !!id)
      ),
    ];
    const movablePageIdSet = new Set(movablePageIds);
    const previousExplicitPageCollections = new Map<string, TPageCollection>();
    const previousParentIdByPageCollectionId = new Map<string, string | null | undefined>();
    const optimisticPageCollections: TPageCollection[] = [];
    const targetParentIdByPageId = new Map<string, string | null>();
    const branchMoves = movablePageIds.map((pageId) => {
      const sourceParentId = this.getPageParentId(pageId) ?? null;
      const parentId = sourceParentId ?? null;
      const targetParentId =
        parentId &&
        (movablePageIdSet.has(parentId) || this.getEffectiveCollectionId(parentId) === actualTargetCollectionId)
          ? parentId
          : null;

      targetParentIdByPageId.set(pageId, targetParentId);

      return {
        pageId,
        sourceCollectionId: this.resolveMutationSourceCollectionId(pageId),
        sourceParentId,
        targetCollectionId: actualTargetCollectionId,
        targetParentId,
      };
    });
    let nextSortOrder = this.computeAppendSortOrder(actualTargetCollectionId, null);

    movablePageIds.forEach((pageId) => {
      getLoadedSubtreePageIds(pageId, this.store.workspacePages.getPageById).forEach((subtreePageId) => {
        const pageCollection = this.getPageCollectionByPageId(subtreePageId);
        if (pageCollection?.id) {
          previousExplicitPageCollections.set(pageCollection.id, { ...pageCollection });
          previousParentIdByPageCollectionId.set(pageCollection.id, this.getPageParentId(subtreePageId));
        }
      });

      const optimisticPageCollection = this.buildOptimisticPageCollection(pageId, actualTargetCollectionId, {
        id: `${OPTIMISTIC_PAGE_COLLECTION_ID_PREFIX}${actualTargetCollectionId}-${pageId}`,
        sort_order: nextSortOrder,
        updated_at: new Date(),
      });

      if (optimisticPageCollection) {
        optimisticPageCollections.push(optimisticPageCollection);
        nextSortOrder += PAGE_COLLECTION_SORT_ORDER_INCREMENT;
      }
    });

    if (optimisticPageCollections.length === 0) {
      return;
    }

    runInAction(() => {
      branchMoves.forEach((branchMove) => {
        this.invalidateLoadedBranchQueriesForMove(branchMove);
      });

      previousExplicitPageCollections.forEach((pageCollection) => {
        this.removePageCollection(pageCollection.id);
      });

      optimisticPageCollections.forEach((pageCollection) => {
        this.upsertPageCollection(pageCollection, targetParentIdByPageId.get(pageCollection.page));
      });

      this.setCollectionExpanded(actualTargetCollectionId);
      branchMoves.forEach((branchMove) => {
        this.syncLoadedUnfilteredBranchesForMove(branchMove);
      });
    });

    try {
      const targetPageCollections = await this.pageCollectionService.create(workspaceSlug, actualTargetCollectionId, {
        page_ids: movablePageIds,
        sort_orders: Object.fromEntries(
          optimisticPageCollections.map((pageCollection) => [pageCollection.page, pageCollection.sort_order ?? 0])
        ),
      });

      runInAction(() => {
        optimisticPageCollections.forEach((pageCollection) => {
          this.removePageCollection(pageCollection.id);
        });
        targetPageCollections.forEach((pageCollection) => {
          this.upsertPageCollection(pageCollection, targetParentIdByPageId.get(pageCollection.page));
        });
        branchMoves.forEach((branchMove) => {
          this.syncLoadedUnfilteredBranchesForMove(branchMove);
        });
      });
      this.syncCollectionsInBackground(workspaceSlug, [actualTargetCollectionId, ...sourceCollectionIds]);
    } catch (error) {
      runInAction(() => {
        optimisticPageCollections.forEach((pageCollection) => {
          this.removePageCollection(pageCollection.id);
        });
        previousExplicitPageCollections.forEach((pageCollection) => {
          this.upsertPageCollection(pageCollection, previousParentIdByPageCollectionId.get(pageCollection.id));
        });
        branchMoves.forEach((branchMove) => {
          this.syncLoadedUnfilteredBranchesForMove(branchMove);
        });
      });
      this.syncCollectionsInBackground(workspaceSlug, [actualTargetCollectionId, ...sourceCollectionIds]);
      throw error;
    }
  };

  removePageFromCollection = async (_workspaceSlug: string, pageId: string, sourceCollectionId: string) => {
    if (!this.defaultCollectionId) {
      throw new Error("Default collection not found.");
    }

    const resolvedSourceCollectionId = this.resolveMutationSourceCollectionId(pageId, sourceCollectionId);
    if (!resolvedSourceCollectionId || resolvedSourceCollectionId === this.defaultCollectionId) {
      return;
    }

    await this.movePageWithCollectionContext({
      pageId,
      sourceCollectionId: resolvedSourceCollectionId,
      targetCollectionId: this.defaultCollectionId,
      targetParentId: null,
    });
  };

  removeExplicitPageCollectionsFromStore = (pageIds: Iterable<string>) => {
    const pageIdSet = new Set(pageIds);
    if (pageIdSet.size === 0) return;

    const affectedCollectionIds = [
      ...new Set(
        [...pageIdSet].map((pageId) => this.getExplicitCollectionIdForPage(pageId)).filter((id): id is string => !!id)
      ),
    ];
    this.bumpCollectionMembershipEpoch(affectedCollectionIds);

    pageIdSet.forEach((pageId) => {
      const pageCollectionId = this.pageCollectionIdByPageId.get(pageId);
      if (pageCollectionId) {
        this.removePageCollection(pageCollectionId);
      }
    });
  };

  private canCurrentUserManageCollectionPage = (
    pageId: string,
    options: { requirePublic?: boolean; disallowSharedForNonOwner?: boolean } = {}
  ) => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id) return false;
    if (!page.canCurrentUserEditPage || !page.isContentEditable || !!page.archived_at) return false;

    const isWorkspaceAdmin = this.isCurrentUserWorkspaceAdmin();
    const isOwner = page.isCurrentUserOwner;

    if (options.requirePublic && page.access !== EPageAccess.PUBLIC) return false;
    if (options.disallowSharedForNonOwner && !isWorkspaceAdmin && page.is_shared && !isOwner) return false;

    return isWorkspaceAdmin || isOwner;
  };

  canCurrentUserAddPageToCollection = computedFn((pageId: string) =>
    this.canCurrentUserManageCollectionPage(pageId, {
      requirePublic: true,
      disallowSharedForNonOwner: true,
    })
  );

  canCurrentUserReorderPageInCollection = computedFn((pageId: string, _collectionId: string) =>
    this.canCurrentUserManageCollectionPage(pageId)
  );

  canCurrentUserRemovePageFromCollection = computedFn((_collectionId: string, pageId: string) =>
    this.canCurrentUserManageCollectionPage(pageId)
  );

  private computeDestinationSortOrderComputed = computedFn(
    (collectionId: string, targetPageId: string, position: "before" | "after", pageId: string | undefined) => {
      const targetPage = this.store.workspacePages.getPageById(targetPageId);
      if (!targetPage?.id) return undefined;

      const siblingPageIds = this.getSiblingPageIdsInCollection(collectionId, targetPage.parent_id).filter(
        (siblingPageId) => siblingPageId !== pageId
      );
      const targetIndex = siblingPageIds.indexOf(targetPageId);
      if (targetIndex === -1) return undefined;

      if (position === "before") {
        const previousPageId = siblingPageIds[targetIndex - 1];
        if (!previousPageId) {
          return this.getCollectionOrderValue(targetPageId) - PAGE_COLLECTION_SORT_ORDER_INCREMENT;
        }

        return (this.getCollectionOrderValue(previousPageId) + this.getCollectionOrderValue(targetPageId)) / 2;
      }

      const nextPageId = siblingPageIds[targetIndex + 1];
      if (!nextPageId) {
        return this.getCollectionOrderValue(targetPageId) + PAGE_COLLECTION_SORT_ORDER_INCREMENT;
      }

      return (this.getCollectionOrderValue(targetPageId) + this.getCollectionOrderValue(nextPageId)) / 2;
    }
  );

  computeDestinationSortOrder: ICollectionStore["computeDestinationSortOrder"] = (
    collectionId,
    targetPageId,
    position,
    pageId
  ) => this.computeDestinationSortOrderComputed(collectionId, targetPageId, position, pageId);

  private buildCollectionDropPlan = (params: TCollectionDropPlanParams): TCollectionDropPlan | undefined => {
    const page = this.store.workspacePages.getPageById(params.pageId);
    if (!page?.id) return undefined;

    const targetCollectionId = this.resolveCollectionId(params.targetCollectionId);
    if (!targetCollectionId) return undefined;

    const sourceCollectionId = this.resolveMutationSourceCollectionId(params.pageId, params.sourceCollectionId);
    if (!sourceCollectionId) {
      throw new Error("Unable to resolve collection membership.");
    }

    const shouldPreserveCurrentSortOrder =
      params.targetSortOrder === undefined &&
      !params.reorderTargetPageId &&
      this.shouldPreserveCurrentSortOrderForUnloadedTargetBranch(
        targetCollectionId,
        params.targetParentId,
        params.pageId
      );

    const targetSortOrder =
      params.targetSortOrder ??
      (shouldPreserveCurrentSortOrder
        ? this.getCollectionOrderValue(params.pageId)
        : params.reorderTargetPageId && params.reorderPosition
          ? (this.computeDestinationSortOrder(
              targetCollectionId,
              params.reorderTargetPageId,
              params.reorderPosition,
              params.pageId
            ) ?? this.computeAppendSortOrder(targetCollectionId, params.targetParentId, params.pageId))
          : this.computeAppendSortOrder(targetCollectionId, params.targetParentId, params.pageId));

    const currentPageCollection = this.getPageCollectionByPageId(params.pageId);
    const previousExplicitPageCollections = getPreviousExplicitPageCollections({
      pageId: params.pageId,
      sourceCollectionId,
      targetCollectionId,
      currentPageCollection,
      getPageCollectionByPageId: this.getPageCollectionByPageId,
      getSubtreePageIds: (pageId) => getLoadedSubtreePageIds(pageId, this.store.workspacePages.getPageById),
    });

    const collectionMutation = createCollectionMoveMutation({
      currentPageCollection,
      pageId: params.pageId,
      sourceCollectionId,
      targetCollectionId,
      targetSortOrder,
    });

    const pageUpdatePayload = buildCollectionMovePageUpdatePayload(page, {
      targetParentId: params.targetParentId,
      access: params.access,
      clearSharedAccess: params.clearSharedAccess,
      targetSortOrder,
      updateSortOrder: collectionMutation.kind === "none",
    });

    const optimisticPageCollection =
      collectionMutation.kind === "none"
        ? undefined
        : this.buildOptimisticPageCollection(params.pageId, targetCollectionId, {
            id: getOptimisticCollectionMoveId(collectionMutation, targetCollectionId, params.pageId),
            sort_order: targetSortOrder,
            updated_at: new Date(),
          });
    if (collectionMutation.kind !== "none" && !optimisticPageCollection) {
      throw new Error("Unable to resolve collection membership.");
    }

    if (collectionMutation.kind === "none" && Object.keys(pageUpdatePayload).length === 0) {
      return undefined;
    }

    return {
      pageId: params.pageId,
      sourceCollectionId,
      sourceParentId: page.parent_id ?? null,
      targetCollectionId,
      targetParentId: params.targetParentId,
      pageUpdatePayload,
      previousExplicitPageCollections,
      optimisticPageCollection,
      collectionMutation,
    };
  };

  private applyCollectionDropPlanLocally = (
    plan: TCollectionDropPlan,
    options: { preserveLoadedUnfilteredBranches?: boolean } = {}
  ): TCollectionDropSnapshot => {
    const sourceRowExpanded =
      plan.sourceCollectionId && this.isCollectionRowExpanded(plan.sourceCollectionId, plan.pageId);
    const sourceSidebarRowExpanded =
      plan.sourceCollectionId && this.isCollectionSidebarRowExpanded(plan.sourceCollectionId, plan.pageId);
    const hasLoadedSourceChildBranch = !!(
      plan.sourceCollectionId &&
      this.getCollectionBranchState(plan.sourceCollectionId, { parentId: plan.pageId })?.isLoaded
    );

    const pageSnapshot =
      Object.keys(plan.pageUpdatePayload).length > 0
        ? this.store.workspacePages.applyPageInternalUpdateLocally(plan.pageId, plan.pageUpdatePayload)
        : undefined;

    this.invalidateLoadedBranchQueriesForMove(
      getCollectionMoveSyncParams({
        pageId: plan.pageId,
        sourceCollectionId: plan.sourceCollectionId,
        sourceParentId: plan.sourceParentId,
        targetCollectionId: plan.targetCollectionId,
        targetParentId: plan.targetParentId,
      }),
      {
        includeUnfiltered: !options.preserveLoadedUnfilteredBranches,
      }
    );

    plan.previousExplicitPageCollections.forEach((pageCollection) => {
      this.removePageCollection(pageCollection.id);
    });
    if (plan.optimisticPageCollection) {
      this.upsertPageCollection(plan.optimisticPageCollection);
    }
    this.setCollectionExpanded(plan.targetCollectionId);
    this.syncLoadedUnfilteredBranchesForMove(
      getCollectionMoveSyncParams({
        pageId: plan.pageId,
        sourceCollectionId: plan.sourceCollectionId,
        sourceParentId: plan.sourceParentId,
        targetCollectionId: plan.targetCollectionId,
        targetParentId: plan.targetParentId,
      })
    );

    if (sourceRowExpanded && hasLoadedSourceChildBranch) {
      this.setCollectionRowExpanded(plan.targetCollectionId, plan.pageId);
    }
    if (sourceSidebarRowExpanded && hasLoadedSourceChildBranch) {
      this.setCollectionSidebarRowExpanded(plan.targetCollectionId, plan.pageId);
    }

    return {
      pageId: plan.pageId,
      pageSnapshot,
      previousExplicitPageCollections: plan.previousExplicitPageCollections,
      optimisticPageCollectionId: plan.optimisticPageCollection?.id,
      sourceCollectionId: plan.sourceCollectionId,
      sourceParentId: plan.sourceParentId,
      targetCollectionId: plan.targetCollectionId,
      targetParentId: plan.targetParentId,
    };
  };

  private rollbackCollectionDropPlanLocally = (snapshot: TCollectionDropSnapshot) => {
    if (snapshot.pageSnapshot) {
      this.store.workspacePages.rollbackPageInternalUpdateLocally(snapshot.pageSnapshot);
    }

    if (snapshot.optimisticPageCollectionId) {
      this.removePageCollection(snapshot.optimisticPageCollectionId);
    }
    snapshot.previousExplicitPageCollections.forEach((pageCollection) => {
      this.upsertPageCollection(pageCollection);
    });
    this.syncLoadedUnfilteredBranchesForMove(
      getCollectionMoveSyncParams({
        pageId: snapshot.pageId,
        sourceCollectionId: snapshot.sourceCollectionId,
        sourceParentId: snapshot.sourceParentId,
        targetCollectionId: snapshot.targetCollectionId,
        targetParentId: snapshot.targetParentId,
      })
    );
  };

  private persistCollectionDropPlan = async (
    workspaceSlug: string,
    plan: TCollectionDropPlan
  ): Promise<TPageCollection | undefined> => {
    if (plan.collectionMutation.kind === "none") {
      return undefined;
    }

    if (plan.collectionMutation.kind === "update") {
      return await this.pageCollectionService.update(
        workspaceSlug,
        plan.collectionMutation.collectionId,
        plan.collectionMutation.pageCollectionId,
        getCollectionMoveUpdatePayload(plan.collectionMutation)
      );
    }

    const createdPageCollections = await this.pageCollectionService.create(
      workspaceSlug,
      plan.collectionMutation.collectionId,
      getCollectionMoveCreatePayload(plan.collectionMutation)
    );
    return getCreatedPageCollectionOrThrow(
      createdPageCollections,
      plan.collectionMutation.pageId,
      "Moved page was not returned by the collection update."
    );
  };

  private commitCollectionDropPlanLocally = (plan: TCollectionDropPlan, pageCollection?: TPageCollection) => {
    if (plan.optimisticPageCollection) {
      this.removePageCollection(plan.optimisticPageCollection.id);
    }
    if (pageCollection) {
      this.upsertPageCollection(pageCollection);
    }
    this.syncLoadedUnfilteredBranchesForMove(
      getCollectionMoveSyncParams({
        pageId: plan.pageId,
        sourceCollectionId: plan.sourceCollectionId,
        sourceParentId: plan.sourceParentId,
        targetCollectionId: plan.targetCollectionId,
        targetParentId: plan.targetParentId,
      })
    );
    if (plan.sourceCollectionId !== plan.targetCollectionId) {
      this.syncLoadedSubtreeBranchQueriesForMove({
        pageId: plan.pageId,
        sourceCollectionId: plan.sourceCollectionId,
        targetCollectionId: plan.targetCollectionId,
      });
      this.markCollectionChildBranchForRefresh(plan.targetCollectionId, plan.pageId);
    }
  };

  private executeCollectionDropPlan = async (
    workspaceSlug: string,
    plan: TCollectionDropPlan,
    options: TCollectionDropExecutionOptions = {}
  ): Promise<TPageCollection | undefined> => {
    const shouldPreserveLoadedUnfilteredBranches =
      !!plan.sourceCollectionId &&
      plan.sourceCollectionId === plan.targetCollectionId &&
      this.getCollectionViewPageIds(plan.sourceCollectionId).has(plan.pageId);

    let snapshot!: TCollectionDropSnapshot;
    runInAction(() => {
      snapshot = this.applyCollectionDropPlanLocally(plan, {
        preserveLoadedUnfilteredBranches: shouldPreserveLoadedUnfilteredBranches,
      });
    });
    let didPersistCollectionUpdate = false;

    try {
      const persistedPageCollection = await this.persistCollectionDropPlan(workspaceSlug, plan);
      didPersistCollectionUpdate = plan.collectionMutation.kind !== "none";

      if (options.persistPageUpdate) {
        await options.persistPageUpdate();
      }

      runInAction(() => {
        this.commitCollectionDropPlanLocally(plan, persistedPageCollection);
        if (shouldPreserveLoadedUnfilteredBranches) {
          this.markLoadedUnfilteredBranchesFreshForMove({
            sourceCollectionId: plan.sourceCollectionId,
            sourceParentId: plan.sourceParentId,
            targetCollectionId: plan.targetCollectionId,
            targetParentId: plan.targetParentId,
          });
        }
      });

      if (!shouldPreserveLoadedUnfilteredBranches) {
        this.refreshLoadedCollectionBranchesAfterMove(workspaceSlug, {
          sourceCollectionId: plan.sourceCollectionId,
          sourceParentId: plan.sourceParentId,
          targetCollectionId: plan.targetCollectionId,
          targetParentId: plan.targetParentId,
        });
        this.syncCollectionsInBackground(workspaceSlug, [plan.sourceCollectionId, plan.targetCollectionId]);
      }

      return persistedPageCollection;
    } catch (error) {
      if (didPersistCollectionUpdate && options.rollbackPersistedCollectionUpdate) {
        try {
          await options.rollbackPersistedCollectionUpdate();
        } catch {
          // Best-effort rollback only. Background sync will rehydrate if needed.
        }
      }

      runInAction(() => {
        this.rollbackCollectionDropPlanLocally(snapshot);
      });
      this.syncCollectionsInBackground(workspaceSlug, [plan.sourceCollectionId, plan.targetCollectionId]);

      if (options.errorMessage) {
        throw toCollectionMoveError(error, options.errorMessage);
      }

      throw error;
    }
  };

  private executeCollectionMove = async (
    workspaceSlug: string,
    params: TCollectionDropPlanParams,
    options: Pick<TCollectionDropExecutionOptions, "errorMessage"> = {}
  ) => {
    const plan = this.buildCollectionDropPlan(params);
    if (!plan) return;

    const shouldPersistPageUpdate = Object.keys(plan.pageUpdatePayload).length > 0;
    let rollbackPersistedCollectionUpdate: (() => Promise<void>) | undefined;

    if (plan.collectionMutation.kind === "update" && plan.collectionMutation.nextCollectionId) {
      const { nextCollectionId, pageCollectionId } = plan.collectionMutation;
      const rollbackPayload = getCollectionMoveRollbackPayload(plan.collectionMutation);
      rollbackPersistedCollectionUpdate = async () => {
        await this.pageCollectionService.update(workspaceSlug, nextCollectionId, pageCollectionId, rollbackPayload);
      };
    }

    await this.executeCollectionDropPlan(workspaceSlug, plan, {
      persistPageUpdate: shouldPersistPageUpdate
        ? async () => {
            await this.store.workspacePages.persistPageInternalUpdate(params.pageId, plan.pageUpdatePayload);
          }
        : undefined,
      rollbackPersistedCollectionUpdate,
      errorMessage: options.errorMessage,
    });
  };

  movePageWithinCollection = async (
    workspaceSlug: string,
    pageId: string,
    collectionId: string,
    targetPageId: string,
    position: "before" | "after"
  ) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return;

    if (this.getEffectiveCollectionId(pageId) !== actualCollectionId) return;

    const sortOrder = this.computeDestinationSortOrder(actualCollectionId, targetPageId, position, pageId);
    if (sortOrder === undefined) return;

    await this.executeCollectionMove(workspaceSlug, {
      pageId,
      sourceCollectionId: actualCollectionId,
      targetCollectionId: actualCollectionId,
      targetParentId: this.getPageParentId(pageId) ?? null,
      targetSortOrder: sortOrder,
    });
  };

  movePageAcrossCollections = async (
    workspaceSlug: string,
    pageId: string,
    sourceCollectionId: string | null | undefined,
    targetCollectionId: string,
    options: {
      targetSortOrder?: number;
      targetParentId?: string | null;
    } = {}
  ) => {
    const actualTargetCollectionId = this.resolveCollectionId(targetCollectionId);
    const currentEffectiveCollectionId = this.getEffectiveCollectionId(pageId);
    const resolvedSourceCollectionId = this.resolveMutationSourceCollectionId(pageId, sourceCollectionId);

    if (!actualTargetCollectionId || !resolvedSourceCollectionId) {
      throw new Error("Unable to resolve collection membership.");
    }

    if (currentEffectiveCollectionId === actualTargetCollectionId) {
      return;
    }

    const sourceParentId = this.getPageParentId(pageId) ?? null;
    const targetParentId = options.targetParentId ?? sourceParentId;

    await this.executeCollectionMove(workspaceSlug, {
      pageId,
      sourceCollectionId: resolvedSourceCollectionId,
      targetCollectionId: actualTargetCollectionId,
      targetParentId,
      targetSortOrder: options.targetSortOrder,
    });
  };

  movePageWithCollectionContext: ICollectionStore["movePageWithCollectionContext"] = async ({
    pageId,
    sourceCollectionId,
    targetCollectionId,
    targetParentId,
    targetSortOrder,
    reorderTargetPageId,
    reorderPosition,
    access,
    clearSharedAccess = false,
  }) => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return;

    await this.executeCollectionMove(
      workspaceSlug,
      {
        pageId,
        sourceCollectionId,
        targetCollectionId,
        targetParentId,
        targetSortOrder,
        reorderTargetPageId,
        reorderPosition,
        access,
        clearSharedAccess,
      },
      { errorMessage: "Collection move failed." }
    );
  };

  getCollectionViewPageIds = computedFn((collectionId: string): Set<string> => {
    return this.getLoadedCollectionViewPageIds(collectionId);
  });

  getCollectionRootPageIds: ICollectionStore["getCollectionRootPageIds"] = (collectionId, options = {}) =>
    this.getBranchQueryStateInternal(collectionId, {
      parentId: null,
      searchQuery: options.searchQuery,
      filters: options.filters,
    })?.pageIds ?? [];

  getCollectionChildPageIds: ICollectionStore["getCollectionChildPageIds"] = (pageId, collectionId, options = {}) =>
    this.getBranchQueryStateInternal(collectionId, {
      parentId: pageId,
      searchQuery: options.searchQuery,
      filters: options.filters,
    })?.pageIds ?? [];

  private getCollectionAutoExpandedAncestorIdsComputed = computedFn(
    (collectionId: string, currentPageId: string | undefined): string[] => {
      if (!currentPageId) return [];

      const actualCollectionId = this.resolveCollectionId(collectionId);
      if (!actualCollectionId) return [];

      const currentPage = this.store.workspacePages.getPageById(currentPageId);
      const resolvedCurrentPageId = currentPage?.id ?? currentPageId;
      if (!currentPage?.id && !this.pageParentIdByPageId.has(currentPageId)) return [];

      const { workspaceSlug } = this.store.router;
      const isHydrated = workspaceSlug ? this.hasHydratedCollectionMemberships(workspaceSlug) : false;

      // Only enforce the effective-collection guard once hydration is complete.
      // Before that, getEffectiveCollectionId returns undefined for unresolved pages,
      // which would incorrectly block auto-expand. After hydration, MobX reactivity
      // re-runs this and the correct check applies.
      if (isHydrated && this.getEffectiveCollectionId(resolvedCurrentPageId) !== actualCollectionId) return [];

      const ancestorPageIds: string[] = [];
      const visitedPageIds = new Set<string>([resolvedCurrentPageId]);
      let parentPageId = this.getPageParentId(currentPageId) ?? undefined;

      while (parentPageId && !visitedPageIds.has(parentPageId)) {
        visitedPageIds.add(parentPageId);

        if (isHydrated && this.getEffectiveCollectionId(parentPageId) !== actualCollectionId) {
          break;
        }

        ancestorPageIds.push(parentPageId);
        parentPageId = this.getPageParentId(parentPageId) ?? undefined;
      }

      return ancestorPageIds.reverse();
    }
  );

  getCollectionAutoExpandedAncestorIds: ICollectionStore["getCollectionAutoExpandedAncestorIds"] = (
    collectionId,
    currentPageId
  ) => this.getCollectionAutoExpandedAncestorIdsComputed(collectionId, currentPageId);

  toggleCollectionExpanded = (collectionId: string) => {
    const actualCollectionId = this.getActualCollectionId(collectionId);
    if (this.expandedCollectionIds.has(actualCollectionId)) {
      this.expandedCollectionIds.delete(actualCollectionId);
    } else {
      this.expandedCollectionIds.add(actualCollectionId);
    }
  };

  setCollectionExpanded = (collectionId: string) => {
    const actualCollectionId = this.getActualCollectionId(collectionId);
    if (!actualCollectionId || this.expandedCollectionIds.has(actualCollectionId)) return;

    this.expandedCollectionIds.add(actualCollectionId);
  };

  isCollectionExpanded = computedFn((collectionId: string): boolean => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return false;

    return this.expandedCollectionIds.has(actualCollectionId);
  });

  toggleCollectionExpandedRow = (collectionId: string, pageId: string) =>
    toggleExpandedRowIds(this.collectionExpandedRowIdsMap, collectionId, pageId, this.getActualCollectionId);

  setCollectionRowExpanded = (collectionId: string, pageId: string) =>
    setExpandedRowIds(this.collectionExpandedRowIdsMap, collectionId, pageId, this.getActualCollectionId);

  replaceCollectionExpandedRowIds = (collectionId: string, pageIds: string[]) =>
    replaceExpandedRowIds(this.collectionExpandedRowIdsMap, collectionId, pageIds, this.getActualCollectionId);

  getCollectionExpandedRowIds = computedFn(
    (collectionId: string): Set<string> =>
      getExpandedRowIds(this.collectionExpandedRowIdsMap, collectionId, this.resolveCollectionId)
  );

  isCollectionRowExpanded = computedFn((collectionId: string, pageId: string): boolean =>
    isExpandedRow(this.collectionExpandedRowIdsMap, collectionId, pageId, this.resolveCollectionId)
  );

  toggleCollectionSidebarExpandedRow = (collectionId: string, pageId: string) =>
    toggleExpandedRowIds(this.collectionSidebarExpandedRowIdsMap, collectionId, pageId, this.getActualCollectionId);

  setCollectionSidebarRowExpanded = (collectionId: string, pageId: string) =>
    setExpandedRowIds(this.collectionSidebarExpandedRowIdsMap, collectionId, pageId, this.getActualCollectionId);

  replaceCollectionSidebarExpandedRowIds = (collectionId: string, pageIds: string[]) =>
    replaceExpandedRowIds(this.collectionSidebarExpandedRowIdsMap, collectionId, pageIds, this.getActualCollectionId);

  getCollectionSidebarExpandedRowIds = computedFn(
    (collectionId: string): Set<string> =>
      getExpandedRowIds(this.collectionSidebarExpandedRowIdsMap, collectionId, this.resolveCollectionId)
  );

  isCollectionSidebarRowExpanded = computedFn((collectionId: string, pageId: string): boolean =>
    isExpandedRow(this.collectionSidebarExpandedRowIdsMap, collectionId, pageId, this.resolveCollectionId)
  );
}
