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
  TCollectionCreatePayload,
  TPage,
  TPageCollection,
  TPageCollectionMembership,
  TPageFilterProps,
} from "@plane/types";
import { CollectionService, PageCollectionService } from "@plane/services";
import { getPageName, shouldFilterPage } from "@plane/utils";
import type { RootStore } from "@/plane-web/store/root.store";
import { getLoadedSubtreePageIds } from "@/plane-web/store/pages/page-tree";
import type { TPageInternalUpdateSnapshot } from "./workspace-page.store";
import type { TWorkspaceCollection } from "./workspace-collection";
import { WorkspaceCollection } from "./workspace-collection";

type TLoader = "init-loader" | "mutation-loader" | undefined;
type TError = { title: string; description: string };

type TCollectionDropCollectionMutation =
  | {
      kind: "create";
      collectionId: string;
      pageId: string;
      sortOrder: number;
    }
  | {
      kind: "update";
      collectionId: string;
      pageCollectionId: string;
      pageId: string;
      sortOrder: number;
      nextCollectionId?: string;
    };

type TCollectionDropPlan = {
  pageId: string;
  sourceCollectionId: string | undefined;
  targetCollectionId: string;
  targetParentId: string | null;
  pageUpdatePayload: Partial<TPage>;
  previousExplicitPageCollections: TPageCollection[];
  optimisticPageCollection: TPageCollection;
  collectionMutation: TCollectionDropCollectionMutation;
};

type TCollectionDropSnapshot = {
  pageSnapshot?: TPageInternalUpdateSnapshot;
  previousExplicitPageCollections: TPageCollection[];
  optimisticPageCollectionId: string;
};

const PAGE_COLLECTION_SORT_ORDER_INCREMENT = 10000;
const COLLECTION_FETCH_BATCH_SIZE = 5;
const PAGE_DETAILS_FETCH_BATCH_SIZE = 10;
const toError = (reason: unknown, fallbackMessage: string) =>
  reason instanceof Error ? reason : new Error(typeof reason === "string" ? reason : fallbackMessage);

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
  ensureCollectionPageDetailsLoaded: (collectionId: string, mode?: "roots" | "all") => Promise<void>;
  isCollectionPagesLoaded: (collectionId: string) => boolean;
  fetchCollections: (workspaceSlug: string) => Promise<TCollection[]>;
  fetchCollectionDetails: (workspaceSlug: string, collectionId: string) => Promise<TCollection>;
  createCollection: (workspaceSlug: string, data: TCollectionCreatePayload) => Promise<TCollection>;
  deleteCollection: (workspaceSlug: string, collectionId: string) => Promise<void>;
  moveCollectionPages: (workspaceSlug: string, collectionId: string, newCollectionId: string) => Promise<void>;
  updateCollectionsInStore: (collections: TCollection[]) => void;
  removeCollectionInstance: (collectionId: string) => void;
  fetchCollectionPages: (
    workspaceSlug: string,
    collectionId: string,
    options?: {
      force?: boolean;
    }
  ) => Promise<TPageCollection[]>;
  resolveCollectionIdForPage: (
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
    reorderTargetPageId?: string;
    reorderPosition?: "before" | "after";
    access?: EPageAccess;
    clearSharedAccess?: boolean;
  }) => Promise<void>;
  getAddablePageIdsForCollection: (collectionId: string) => string[];
  getCollectionViewPageIds: (collectionId: string) => Set<string>;
  getCollectionRootPageIds: (
    collectionId: string,
    options?: {
      searchQuery?: string;
      filters?: TPageFilterProps;
    }
  ) => string[];
  getCollectionChildPageIds: (pageId: string, collectionId: string) => string[];
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
  private fetchCollectionPagesRequests: Map<string, Promise<TPageCollection[]>> = new Map();
  private fetchCollectionsRequest: Promise<TCollection[]> | undefined = undefined;
  private hydrateCollectionMembershipsRequest: Promise<void> | undefined = undefined;
  private collectionMembershipEpoch = 0;

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
      collectionViewPageIdsIndex: computed,
      workspaceCollections: computed,
      fetchCollections: action,
      ensureCollectionMembershipsHydrated: action,
      ensureCollectionPageDetailsLoaded: action,
      fetchCollectionDetails: action,
      createCollection: action,
      deleteCollection: action,
      moveCollectionPages: action,
      updateCollectionsInStore: action,
      removeCollectionInstance: action,
      fetchCollectionPages: action,
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

  private getNearestExplicitPageCollection = (pageId: string): TPageCollection | undefined => {
    let currentPage = this.store.workspacePages.getPageById(pageId);

    while (currentPage?.id) {
      const explicitPageCollection = this.getPageCollectionByPageId(currentPage.id);
      if (explicitPageCollection) return explicitPageCollection;

      if (!currentPage.parent_id) return undefined;
      currentPage = this.store.workspacePages.getPageById(currentPage.parent_id);
    }

    return undefined;
  };

  private getPageParentId = (pageId: string): string | null | undefined => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (page?.id) {
      return page.parent_id ?? null;
    }

    if (this.pageParentIdByPageId.has(pageId)) {
      return this.pageParentIdByPageId.get(pageId) ?? null;
    }

    return undefined;
  };

  getEffectiveCollectionId = computedFn((pageId: string): string | undefined => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!this.isPageEligibleForCollection(page)) return undefined;

    const explicitPageCollection = this.getNearestExplicitPageCollection(pageId);
    if (explicitPageCollection?.collection) return explicitPageCollection.collection;

    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug || !this.defaultCollectionId) return undefined;
    if (!this.hasHydratedCollectionMemberships(workspaceSlug)) {
      return undefined;
    }

    return this.defaultCollectionId;
  });

  private getExplicitCollectionIdForPage = (pageId: string): string | undefined =>
    this.getNearestExplicitPageCollection(pageId)?.collection;

  get collectionViewPageIdsIndex() {
    const { currentWorkspace } = this.store.workspaceRoot;
    const index = new Map<string, Set<string>>();

    if (!currentWorkspace) {
      return index;
    }

    Object.values(this.store.workspacePages.data).forEach((page) => {
      if (!page?.id || page.workspace !== currentWorkspace.id) {
        return;
      }

      if (!this.isPageEligibleForCollection(page)) {
        return;
      }

      const effectiveCollectionId = this.getEffectiveCollectionId(page.id);
      if (!effectiveCollectionId) {
        return;
      }

      const collectionPageIds = index.get(effectiveCollectionId) ?? new Set<string>();
      collectionPageIds.add(page.id);
      index.set(effectiveCollectionId, collectionPageIds);
    });

    return index;
  }

  private getDerivedCollectionViewPageIds = (collectionId: string): Set<string> => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return new Set();

    const explicitPageIds = [...(this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set())]
      .map((pageCollectionId) => this.pageCollectionsData[pageCollectionId]?.page)
      .filter((pageId): pageId is string => !!pageId);
    const derivedPageIds = this.collectionViewPageIdsIndex.get(actualCollectionId) ?? new Set<string>();

    return new Set([...explicitPageIds, ...derivedPageIds]);
  };

  private clearPageCollectionsForCollection = (collectionId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
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

  private ensureCollectionPagesLoaded = async (pageIds: Iterable<string>) => {
    const missingPageIds = [...pageIds].filter((pageId) => !this.store.workspacePages.getPageById(pageId));
    if (missingPageIds.length === 0) {
      return;
    }

    for (let index = 0; index < missingPageIds.length; index += PAGE_DETAILS_FETCH_BATCH_SIZE) {
      const pageIdsBatch = missingPageIds.slice(index, index + PAGE_DETAILS_FETCH_BATCH_SIZE);
      await Promise.all(
        pageIdsBatch.map((pageId) =>
          this.store.workspacePages.getOrFetchPageInstance({
            pageId,
            trackVisit: false,
            shouldFetchParentPages: false,
            shouldFetchSubPages: false,
          })
        )
      );
    }
  };

  private ensureCollectionRootsLoaded = async (collectionId: string) => {
    await this.ensureCollectionPagesLoaded(this.getCollectionRootPageIds(collectionId));
  };

  private buildSyntheticPageCollection = (
    pageId: string,
    collectionId: string,
    overrides: Partial<TPageCollection> = {}
  ): TPageCollection | undefined => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id) return undefined;

    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;

    return {
      id: `synthetic-page-collection-${actualCollectionId}-${pageId}`,
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
      for (let index = 0; index < resolvedCollectionIds.length; index += COLLECTION_FETCH_BATCH_SIZE) {
        const collectionIdsBatch = resolvedCollectionIds.slice(index, index + COLLECTION_FETCH_BATCH_SIZE);
        await Promise.allSettled(
          collectionIdsBatch.map((collectionId) =>
            this.fetchCollectionPages(workspaceSlug, collectionId, { force: true })
          )
        );
      }
    })();
  };

  private getCollectionOrderValue = (pageId: string) => {
    const explicitPageCollection = this.getPageCollectionByPageId(pageId);
    return explicitPageCollection?.sort_order ?? this.store.workspacePages.getPageById(pageId)?.sort_order ?? 65535;
  };

  private hasActivePageFilters = (filters?: TPageFilterProps) =>
    !!filters &&
    Object.values(filters).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return Boolean(value);
    });

  private doesScopedTreeMatchFilters = (
    pageId: string,
    collectionId: string,
    searchQuery: string,
    filters?: TPageFilterProps
  ): boolean => {
    const page = this.store.workspacePages.getPageById(pageId);
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const hasActiveFilters = this.hasActivePageFilters(filters);

    if (!page?.id) {
      return normalizedSearchQuery.length === 0 && !hasActiveFilters;
    }

    if (page.deleted_at || page.archived_at || page.access !== EPageAccess.PUBLIC) return false;

    const matchesSelf =
      getPageName(page.name).toLowerCase().includes(normalizedSearchQuery) &&
      shouldFilterPage(page.asJSON as TPage, filters);

    if (matchesSelf) return true;

    return this.getCollectionChildPageIds(pageId, collectionId).some((childPageId) =>
      this.doesScopedTreeMatchFilters(childPageId, collectionId, searchQuery, filters)
    );
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

  private getCollectionMembershipEpoch = () => this.collectionMembershipEpoch;

  private bumpCollectionMembershipEpoch = (affectedCollectionIds?: string[]) => {
    this.collectionMembershipEpoch += 1;

    if (affectedCollectionIds && affectedCollectionIds.length > 0) {
      for (const collectionId of affectedCollectionIds) {
        const resolvedId = this.resolveCollectionId(collectionId) ?? collectionId;
        this.fetchCollectionPagesRequests.delete(resolvedId);
      }
    } else {
      this.fetchCollectionPagesRequests.clear();
    }

    if (this.fetchCollectionPagesRequests.size === 0) {
      this.hydrateCollectionMembershipsRequest = undefined;
      this.isHydratingMemberships = false;
    }
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
      const collections = this.workspaceCollections ?? (await this.fetchCollections(workspaceSlug));
      const requestEpoch = this.getCollectionMembershipEpoch();
      const defaultCollectionId = collections.find((collection) => collection.is_default)?.id;
      if (!defaultCollectionId) {
        return;
      }

      await Promise.all([
        ...collections.map((collection) => this.fetchCollectionPages(workspaceSlug, collection.id)),
        this.store.workspacePages.fetchAllPages(),
      ]);

      runInAction(() => {
        if (this.getCollectionMembershipEpoch() !== requestEpoch) {
          return;
        }

        this.hydratedMembershipsWorkspaceSlug = workspaceSlug;
      });

      // If the epoch changed mid-hydration (e.g. a page move happened during load),
      // the runInAction above was a no-op. Re-queue so the store doesn't stay stuck.
      if (!this.hasHydratedCollectionMemberships(workspaceSlug)) {
        void this.hydrateCollectionMemberships(workspaceSlug);
      }
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
    return this.pageCollectionIdsByCollection.has(actualCollectionId);
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

  ensureCollectionPageDetailsLoaded = async (collectionId: string, mode: "roots" | "all" = "roots") => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return;

    if (mode === "all") {
      await this.ensureCollectionPagesLoaded(this.getCollectionViewPageIds(actualCollectionId));
      return;
    }

    await this.ensureCollectionRootsLoaded(actualCollectionId);
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
        this.loader = existingCollections.length > 0 ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

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
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the collections, Please try again later.",
        };
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
      const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
      const cachedCollection = this.getCollectionById(actualCollectionId)?.asJSON;
      if (cachedCollection) {
        return cachedCollection;
      }

      runInAction(() => {
        this.loader = "init-loader";
        this.error = undefined;
      });

      const collection = await this.collectionService.retrieve(workspaceSlug, actualCollectionId);
      this.updateCollectionsInStore([collection]);

      runInAction(() => {
        if (collection.is_default) this.defaultCollectionId = collection.id;
        this.loader = undefined;
      });

      return collection;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the collection, Please try again later.",
        };
      });
      throw error;
    }
  };

  createCollection = async (workspaceSlug: string, data: TCollectionCreatePayload) => {
    runInAction(() => {
      this.loader = "mutation-loader";
      this.error = undefined;
    });

    try {
      const collection = await this.collectionService.create(workspaceSlug, data);
      this.updateCollectionsInStore([collection]);

      runInAction(() => {
        this.loader = undefined;
      });

      return collection;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
      });
      throw error;
    }
  };

  deleteCollection = async (workspaceSlug: string, collectionId: string) => {
    runInAction(() => {
      this.loader = "mutation-loader";
      this.error = undefined;
    });

    try {
      // Capture page IDs before removing the collection instance
      const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
      const pageCollectionIds = [...(this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set())];
      const pageIds = pageCollectionIds
        .map((pcId) => this.pageCollectionsData[pcId]?.page)
        .filter((id): id is string => !!id);

      await this.collectionService.destroy(workspaceSlug, collectionId);
      this.removeCollectionInstance(collectionId);

      runInAction(() => {
        pageIds.forEach((pageId) => this.store.workspacePages.removePageInstance(pageId));
        this.loader = undefined;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
      });
      throw error;
    }
  };

  moveCollectionPages = async (workspaceSlug: string, collectionId: string, newCollectionId: string) => {
    runInAction(() => {
      this.loader = "mutation-loader";
      this.error = undefined;
    });

    try {
      await this.collectionService.movePages(workspaceSlug, collectionId, newCollectionId);
      this.removeCollectionInstance(collectionId);
      // Re-fetch target collection pages so moved pages appear in the correct collection
      await this.fetchCollectionPages(workspaceSlug, newCollectionId, { force: true });

      runInAction(() => {
        this.loader = undefined;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
      });
      throw error;
    }
  };

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
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;

    runInAction(() => {
      delete this.data[actualCollectionId];
      this.clearPageCollectionsForCollection(actualCollectionId);
      this.collectionExpandedRowIdsMap.delete(actualCollectionId);
      this.collectionSidebarExpandedRowIdsMap.delete(actualCollectionId);
      this.expandedCollectionIds.delete(actualCollectionId);

      if (this.defaultCollectionId === actualCollectionId) {
        this.defaultCollectionId = undefined;
      }
    });
  };

  fetchCollectionPages = async (
    workspaceSlug: string,
    collectionId: string,
    options?: {
      force?: boolean;
    }
  ) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    if (!options?.force && this.isCollectionPagesLoaded(actualCollectionId)) {
      const pageCollectionIds = this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set<string>();
      return [...pageCollectionIds]
        .map((pageCollectionId) => this.pageCollectionsData[pageCollectionId])
        .filter((pageCollection): pageCollection is TPageCollection => !!pageCollection);
    }

    const inFlightRequest = this.fetchCollectionPagesRequests.get(actualCollectionId);
    if (inFlightRequest) return inFlightRequest;

    const requestEpoch = this.getCollectionMembershipEpoch();

    const request = (async () => {
      const pageCollections = await this.pageCollectionService.list(workspaceSlug, actualCollectionId);

      runInAction(() => {
        if (this.getCollectionMembershipEpoch() !== requestEpoch) {
          return;
        }

        this.clearPageCollectionsForCollection(actualCollectionId);
        pageCollections.forEach((pageCollection: TPageCollectionMembership) => {
          const { parent_id, ...pageCollectionRecord } = pageCollection;
          this.upsertPageCollection(pageCollectionRecord, parent_id);
        });
      });

      await this.ensureCollectionRootsLoaded(actualCollectionId);

      const pageCollectionIds = this.pageCollectionIdsByCollection.get(actualCollectionId) ?? new Set<string>();
      return [...pageCollectionIds]
        .map((pageCollectionId) => this.pageCollectionsData[pageCollectionId])
        .filter((pageCollection): pageCollection is TPageCollection => !!pageCollection);
    })();

    this.fetchCollectionPagesRequests.set(actualCollectionId, request);

    try {
      return await request;
    } finally {
      if (this.fetchCollectionPagesRequests.get(actualCollectionId) === request) {
        this.fetchCollectionPagesRequests.delete(actualCollectionId);
      }
    }
  };

  resolveCollectionIdForPage = async (workspaceSlug: string, pageId: string, ancestorPageIds: string[] = []) => {
    const explicitCollectionId = this.getExplicitCollectionIdForPage(pageId);
    if (explicitCollectionId) {
      return explicitCollectionId;
    }

    const collections = this.workspaceCollections ?? (await this.fetchCollections(workspaceSlug));
    const branchPageIds = [pageId, ...ancestorPageIds];
    const customCollectionIds = collections
      .filter((collection) => !collection.is_default)
      .map((collection) => collection.id);

    for (const collectionId of customCollectionIds) {
      if (!this.isCollectionPagesLoaded(collectionId)) {
        await this.fetchCollectionPages(workspaceSlug, collectionId);
      }

      if (branchPageIds.some((branchPageId) => this.getExplicitCollectionIdForPage(branchPageId) === collectionId)) {
        return collectionId;
      }
    }

    if (!this.defaultCollectionId) {
      return undefined;
    }

    if (!this.isCollectionPagesLoaded(this.defaultCollectionId)) {
      await this.fetchCollectionPages(workspaceSlug, this.defaultCollectionId);
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
    this.bumpCollectionMembershipEpoch([actualTargetCollectionId, ...sourceCollectionIds]);

    const previousExplicitPageCollections = new Map<string, TPageCollection>();
    const optimisticPageCollections: TPageCollection[] = [];
    let nextSortOrder = this.computeAppendSortOrder(actualTargetCollectionId, null);

    movablePageIds.forEach((pageId) => {
      getLoadedSubtreePageIds(pageId, this.store.workspacePages.getPageById).forEach((subtreePageId) => {
        const pageCollection = this.getPageCollectionByPageId(subtreePageId);
        if (pageCollection?.id) {
          previousExplicitPageCollections.set(pageCollection.id, { ...pageCollection });
        }
      });

      const optimisticPageCollection = this.buildSyntheticPageCollection(pageId, actualTargetCollectionId, {
        id: `optimistic-page-collection-${actualTargetCollectionId}-${pageId}`,
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
      previousExplicitPageCollections.forEach((pageCollection) => {
        this.removePageCollection(pageCollection.id);
      });

      optimisticPageCollections.forEach((pageCollection) => {
        this.upsertPageCollection(pageCollection);
      });

      this.setCollectionExpanded(actualTargetCollectionId);
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
          this.upsertPageCollection(pageCollection);
        });
      });
    } catch (error) {
      runInAction(() => {
        optimisticPageCollections.forEach((pageCollection) => {
          this.removePageCollection(pageCollection.id);
        });
        previousExplicitPageCollections.forEach((pageCollection) => {
          this.upsertPageCollection(pageCollection);
        });
      });
      this.syncCollectionsInBackground(workspaceSlug, [actualTargetCollectionId, this.defaultCollectionId]);
      throw error;
    }
  };

  removePageFromCollection = async (workspaceSlug: string, pageId: string, sourceCollectionId: string) => {
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

  canCurrentUserAddPageToCollection = computedFn((pageId: string) => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id) return false;
    if (
      !page.canCurrentUserEditPage ||
      !page.isContentEditable ||
      !!page.archived_at ||
      page.access !== EPageAccess.PUBLIC
    )
      return false;
    // Shared pages can only be added by their owner
    if (page.is_shared && !page.isCurrentUserOwner) return false;

    return this.isCurrentUserWorkspaceAdmin() || page.isCurrentUserOwner;
  });

  canCurrentUserReorderPageInCollection = computedFn((pageId: string, _collectionId: string) => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id) return false;
    if (!page.canCurrentUserEditPage || !page.isContentEditable || !!page.archived_at) return false;

    return this.isCurrentUserWorkspaceAdmin() || page.isCurrentUserOwner;
  });

  canCurrentUserRemovePageFromCollection = computedFn((_collectionId: string, pageId: string) => {
    const page = this.store.workspacePages.getPageById(pageId);
    if (!page?.id) return false;
    if (!page.canCurrentUserEditPage || !page.isContentEditable || !!page.archived_at) return false;

    return this.isCurrentUserWorkspaceAdmin() || page.isCurrentUserOwner;
  });

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

  private buildCollectionDropPlan = (params: {
    pageId: string;
    sourceCollectionId?: string | null;
    targetCollectionId: string;
    targetParentId: string | null;
    reorderTargetPageId?: string;
    reorderPosition?: "before" | "after";
    access?: EPageAccess;
    clearSharedAccess?: boolean;
  }): TCollectionDropPlan | undefined => {
    const page = this.store.workspacePages.getPageById(params.pageId);
    if (!page?.id) return undefined;

    const targetCollectionId = this.resolveCollectionId(params.targetCollectionId);
    if (!targetCollectionId) return undefined;

    const sourceCollectionId = this.resolveMutationSourceCollectionId(params.pageId, params.sourceCollectionId);
    if (!sourceCollectionId) {
      throw new Error("Unable to resolve collection membership.");
    }

    const pageUpdatePayload: Partial<TPage> = {};
    if ((page.parent_id ?? null) !== params.targetParentId) {
      pageUpdatePayload.parent_id = params.targetParentId;
    }

    if (params.access !== undefined && page.access !== params.access) {
      pageUpdatePayload.access = params.access;
    }

    if (params.clearSharedAccess && page.is_shared) {
      pageUpdatePayload.is_shared = false;
    }

    const targetSortOrder =
      params.reorderTargetPageId && params.reorderPosition
        ? (this.computeDestinationSortOrder(
            targetCollectionId,
            params.reorderTargetPageId,
            params.reorderPosition,
            params.pageId
          ) ?? this.computeAppendSortOrder(targetCollectionId, params.targetParentId, params.pageId))
        : this.computeAppendSortOrder(targetCollectionId, params.targetParentId, params.pageId);

    const currentPageCollection = this.getPageCollectionByPageId(params.pageId);
    const previousExplicitPageCollections =
      sourceCollectionId !== targetCollectionId
        ? getLoadedSubtreePageIds(params.pageId, this.store.workspacePages.getPageById)
            .map((subtreePageId) => this.getPageCollectionByPageId(subtreePageId))
            .filter((pageCollection): pageCollection is TPageCollection => !!pageCollection)
            .map((pageCollection) => ({ ...pageCollection }))
        : currentPageCollection
          ? [{ ...currentPageCollection }]
          : [];

    const collectionMutation: TCollectionDropCollectionMutation = currentPageCollection
      ? {
          kind: "update",
          collectionId: currentPageCollection.collection,
          pageCollectionId: currentPageCollection.id,
          pageId: params.pageId,
          sortOrder: targetSortOrder,
          nextCollectionId: currentPageCollection.collection !== targetCollectionId ? targetCollectionId : undefined,
        }
      : {
          kind: "create",
          collectionId: targetCollectionId,
          pageId: params.pageId,
          sortOrder: targetSortOrder,
        };

    const optimisticPageCollection = this.buildSyntheticPageCollection(params.pageId, targetCollectionId, {
      id:
        collectionMutation.kind === "update"
          ? collectionMutation.pageCollectionId
          : `optimistic-page-collection-${targetCollectionId}-${params.pageId}`,
      sort_order: targetSortOrder,
      updated_at: new Date(),
    });
    if (!optimisticPageCollection) {
      throw new Error("Unable to resolve collection membership.");
    }

    return {
      pageId: params.pageId,
      sourceCollectionId,
      targetCollectionId,
      targetParentId: params.targetParentId,
      pageUpdatePayload,
      previousExplicitPageCollections,
      optimisticPageCollection,
      collectionMutation,
    };
  };

  private applyCollectionDropPlanLocally = (plan: TCollectionDropPlan): TCollectionDropSnapshot => {
    const sourceRowExpanded =
      plan.sourceCollectionId && this.isCollectionRowExpanded(plan.sourceCollectionId, plan.pageId);
    const sourceSidebarRowExpanded =
      plan.sourceCollectionId && this.isCollectionSidebarRowExpanded(plan.sourceCollectionId, plan.pageId);

    const pageSnapshot =
      Object.keys(plan.pageUpdatePayload).length > 0
        ? this.store.workspacePages.applyPageInternalUpdateLocally(plan.pageId, plan.pageUpdatePayload)
        : undefined;

    this.bumpCollectionMembershipEpoch(
      [plan.sourceCollectionId, plan.targetCollectionId].filter((id): id is string => !!id)
    );

    plan.previousExplicitPageCollections.forEach((pageCollection) => {
      this.removePageCollection(pageCollection.id);
    });
    this.upsertPageCollection(plan.optimisticPageCollection);
    this.setCollectionExpanded(plan.targetCollectionId);

    if (sourceRowExpanded) {
      this.setCollectionRowExpanded(plan.targetCollectionId, plan.pageId);
    }
    if (sourceSidebarRowExpanded) {
      this.setCollectionSidebarRowExpanded(plan.targetCollectionId, plan.pageId);
    }

    return {
      pageSnapshot,
      previousExplicitPageCollections: plan.previousExplicitPageCollections,
      optimisticPageCollectionId: plan.optimisticPageCollection.id,
    };
  };

  private rollbackCollectionDropPlanLocally = (snapshot: TCollectionDropSnapshot) => {
    if (snapshot.pageSnapshot) {
      this.store.workspacePages.rollbackPageInternalUpdateLocally(snapshot.pageSnapshot);
    }

    this.removePageCollection(snapshot.optimisticPageCollectionId);
    snapshot.previousExplicitPageCollections.forEach((pageCollection) => {
      this.upsertPageCollection(pageCollection);
    });
  };

  private persistCollectionDropPlan = async (
    workspaceSlug: string,
    plan: TCollectionDropPlan
  ): Promise<TPageCollection> => {
    if (plan.collectionMutation.kind === "update") {
      return await this.pageCollectionService.update(
        workspaceSlug,
        plan.collectionMutation.collectionId,
        plan.collectionMutation.pageCollectionId,
        {
          sort_order: plan.collectionMutation.sortOrder,
          ...(plan.collectionMutation.nextCollectionId && {
            collection: plan.collectionMutation.nextCollectionId,
          }),
        }
      );
    }

    const createdPageCollections = await this.pageCollectionService.create(
      workspaceSlug,
      plan.collectionMutation.collectionId,
      {
        page_ids: [plan.collectionMutation.pageId],
        sort_orders: { [plan.collectionMutation.pageId]: plan.collectionMutation.sortOrder },
      }
    );
    const createdPageCollection = createdPageCollections.find(
      (pageCollection) => pageCollection.page === plan.collectionMutation.pageId
    );
    if (!createdPageCollection) {
      throw new Error("Moved page was not returned by the collection update.");
    }

    return createdPageCollection;
  };

  private commitCollectionDropPlanLocally = (plan: TCollectionDropPlan, pageCollection: TPageCollection) => {
    this.removePageCollection(plan.optimisticPageCollection.id);
    this.upsertPageCollection(pageCollection);
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

    const effectiveCollectionId = this.getEffectiveCollectionId(pageId);
    if (effectiveCollectionId !== actualCollectionId) return;

    const sortOrder = this.computeDestinationSortOrder(actualCollectionId, targetPageId, position, pageId);
    if (sortOrder === undefined) return;

    const currentPageCollection = this.getPageCollectionByPageId(pageId);
    const previousExplicitPageCollection = currentPageCollection ? { ...currentPageCollection } : undefined;
    const optimisticPageCollection = this.buildSyntheticPageCollection(pageId, actualCollectionId, {
      id: currentPageCollection?.id ?? `optimistic-page-collection-${pageId}`,
      sort_order: sortOrder,
      updated_at: new Date(),
    });

    if (!optimisticPageCollection) return;

    this.bumpCollectionMembershipEpoch([actualCollectionId]);

    runInAction(() => {
      if (currentPageCollection?.id) {
        this.removePageCollection(currentPageCollection.id);
      }
      this.upsertPageCollection(optimisticPageCollection);
    });

    try {
      if (currentPageCollection?.id) {
        const updatedPageCollection = await this.pageCollectionService.update(
          workspaceSlug,
          actualCollectionId,
          currentPageCollection.id,
          { sort_order: sortOrder }
        );

        runInAction(() => {
          this.removePageCollection(optimisticPageCollection.id);
          this.upsertPageCollection(updatedPageCollection);
        });
      } else {
        const targetPageCollections = await this.pageCollectionService.create(workspaceSlug, actualCollectionId, {
          page_ids: [pageId],
          sort_orders: { [pageId]: sortOrder },
        });
        const createdPageCollection = targetPageCollections.find((pageCollection) => pageCollection.page === pageId);
        if (!createdPageCollection) {
          throw new Error("Reordered page was not returned by the collection update.");
        }

        runInAction(() => {
          this.removePageCollection(optimisticPageCollection.id);
          this.upsertPageCollection(createdPageCollection);
        });
      }
    } catch (error) {
      runInAction(() => {
        this.removePageCollection(optimisticPageCollection.id);
        if (previousExplicitPageCollection) {
          this.upsertPageCollection(previousExplicitPageCollection);
        }
      });
      this.syncCollectionsInBackground(workspaceSlug, [actualCollectionId]);
      throw error;
    }
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

    const targetSortOrder =
      options.targetSortOrder ??
      this.computeAppendSortOrder(actualTargetCollectionId, options.targetParentId ?? null, pageId);

    const optimisticPageCollection = this.buildSyntheticPageCollection(pageId, actualTargetCollectionId, {
      id: `optimistic-page-collection-${pageId}`,
      sort_order: targetSortOrder,
      updated_at: new Date(),
    });

    if (!optimisticPageCollection) {
      throw new Error("Unable to resolve collection membership.");
    }

    const wasExpandedInSource = this.isCollectionRowExpanded(resolvedSourceCollectionId, pageId);
    const wasSidebarExpandedInSource = this.isCollectionSidebarRowExpanded(resolvedSourceCollectionId, pageId);
    const previousExplicitPageCollections = getLoadedSubtreePageIds(pageId, this.store.workspacePages.getPageById)
      .map((subtreePageId) => this.getPageCollectionByPageId(subtreePageId))
      .filter((pageCollection): pageCollection is TPageCollection => !!pageCollection)
      .map((pageCollection) => ({ ...pageCollection }));

    this.bumpCollectionMembershipEpoch([resolvedSourceCollectionId, actualTargetCollectionId]);

    runInAction(() => {
      previousExplicitPageCollections.forEach((pageCollection) => {
        this.removePageCollection(pageCollection.id);
      });
      this.upsertPageCollection(optimisticPageCollection);
      this.setCollectionExpanded(actualTargetCollectionId);

      if (wasExpandedInSource) {
        this.setCollectionRowExpanded(actualTargetCollectionId, pageId);
      }
      if (wasSidebarExpandedInSource) {
        this.setCollectionSidebarRowExpanded(actualTargetCollectionId, pageId);
      }
    });

    try {
      const targetPageCollections = await this.pageCollectionService.create(workspaceSlug, actualTargetCollectionId, {
        page_ids: [pageId],
        sort_orders: { [pageId]: targetSortOrder },
      });
      if (!targetPageCollections.some((pageCollection) => pageCollection.page === pageId)) {
        throw new Error("Moved page was not returned by the collection update.");
      }

      runInAction(() => {
        this.removePageCollection(optimisticPageCollection.id);
        targetPageCollections.forEach((pageCollection) => {
          this.upsertPageCollection(pageCollection);
        });
      });
    } catch (error) {
      runInAction(() => {
        this.removePageCollection(optimisticPageCollection.id);
        previousExplicitPageCollections.forEach((pageCollection) => {
          this.upsertPageCollection(pageCollection);
        });
      });
      this.syncCollectionsInBackground(workspaceSlug, [resolvedSourceCollectionId, actualTargetCollectionId]);
      throw error;
    }
  };

  movePageWithCollectionContext: ICollectionStore["movePageWithCollectionContext"] = async ({
    pageId,
    sourceCollectionId,
    targetCollectionId,
    targetParentId,
    reorderTargetPageId,
    reorderPosition,
    access,
    clearSharedAccess = false,
  }) => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return;

    const plan = this.buildCollectionDropPlan({
      pageId,
      sourceCollectionId,
      targetCollectionId,
      targetParentId,
      reorderTargetPageId,
      reorderPosition,
      access,
      clearSharedAccess,
    });
    if (!plan) return;

    const snapshot = this.applyCollectionDropPlanLocally(plan);
    const shouldPersistPageUpdate = Object.keys(plan.pageUpdatePayload).length > 0;
    let didPersistCollectionUpdate = false;

    try {
      // Persist the collection change first so that recompute_page_collection (triggered
      // by the parent_id PATCH below) finds the page already in the correct collection
      // and skips the override, avoiding a race condition.
      const persistedPageCollection = await this.persistCollectionDropPlan(workspaceSlug, plan);
      didPersistCollectionUpdate = true;

      if (shouldPersistPageUpdate) {
        await this.store.workspacePages.persistPageInternalUpdate(pageId, plan.pageUpdatePayload);
      }

      runInAction(() => {
        this.commitCollectionDropPlanLocally(plan, persistedPageCollection);
      });
    } catch (error) {
      // If the collection was already updated but the page update failed, best-effort
      // rollback the collection change so the UI and DB stay in sync.
      if (
        didPersistCollectionUpdate &&
        plan.collectionMutation.kind === "update" &&
        plan.collectionMutation.nextCollectionId
      ) {
        try {
          await this.pageCollectionService.update(
            workspaceSlug,
            plan.collectionMutation.nextCollectionId,
            plan.collectionMutation.pageCollectionId,
            { collection: plan.collectionMutation.collectionId }
          );
        } catch {
          // Best-effort rollback only. Background sync will rehydrate if needed.
        }
      }

      runInAction(() => {
        this.rollbackCollectionDropPlanLocally(snapshot);
      });
      this.syncCollectionsInBackground(workspaceSlug, [plan.sourceCollectionId, plan.targetCollectionId]);

      throw toError(error, "Collection move failed.");
    }
  };

  getAddablePageIdsForCollection = computedFn((collectionId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    return Object.values(this.store.workspacePages.data)
      .filter((page): page is typeof page & { id: string } => !!page?.id)
      .filter((page) => this.isPageEligibleForCollection(page))
      .filter((page) => this.getEffectiveCollectionId(page.id) !== actualCollectionId)
      .filter((page) => this.canCurrentUserAddPageToCollection(page.id))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((page) => page.id);
  });

  getCollectionViewPageIds = computedFn((collectionId: string): Set<string> => {
    return this.getDerivedCollectionViewPageIds(collectionId);
  });

  private getCollectionRootPageIdsComputed = computedFn(
    (collectionId: string, searchQuery: string, filters: TPageFilterProps | undefined): string[] => {
      const actualCollectionId = this.resolveCollectionId(collectionId);
      if (!actualCollectionId) return [];

      const collectionPageIds = this.getCollectionViewPageIds(actualCollectionId);

      return [...collectionPageIds]
        .filter((pageId) => {
          const parentId = this.getPageParentId(pageId);
          return !parentId || !collectionPageIds.has(parentId);
        })
        .sort(
          (leftPageId, rightPageId) =>
            this.getCollectionOrderValue(leftPageId) - this.getCollectionOrderValue(rightPageId)
        )
        .filter((pageId) => this.doesScopedTreeMatchFilters(pageId, actualCollectionId, searchQuery, filters));
    }
  );

  getCollectionRootPageIds: ICollectionStore["getCollectionRootPageIds"] = (collectionId, options = {}) =>
    this.getCollectionRootPageIdsComputed(collectionId, options.searchQuery ?? "", options.filters);

  getCollectionChildPageIds = computedFn((pageId: string, collectionId: string): string[] => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return [];

    const collectionPageIds = this.getCollectionViewPageIds(actualCollectionId);

    return [...collectionPageIds]
      .filter((candidatePageId) => this.getPageParentId(candidatePageId) === pageId)
      .filter((candidatePageId) => {
        const page = this.store.workspacePages.getPageById(candidatePageId);
        if (!page?.id) return true;
        return !page.deleted_at && !page.archived_at && page.access === EPageAccess.PUBLIC;
      })
      .sort(
        (leftPageId, rightPageId) =>
          this.getCollectionOrderValue(leftPageId) - this.getCollectionOrderValue(rightPageId)
      );
  });

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
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    if (this.expandedCollectionIds.has(actualCollectionId)) {
      this.expandedCollectionIds.delete(actualCollectionId);
    } else {
      this.expandedCollectionIds.add(actualCollectionId);
    }
  };

  setCollectionExpanded = (collectionId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    if (!actualCollectionId || this.expandedCollectionIds.has(actualCollectionId)) return;

    this.expandedCollectionIds.add(actualCollectionId);
  };

  isCollectionExpanded = computedFn((collectionId: string): boolean => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return false;

    return this.expandedCollectionIds.has(actualCollectionId);
  });

  toggleCollectionExpandedRow = (collectionId: string, pageId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    const currentExpandedRowIds = this.collectionExpandedRowIdsMap.get(actualCollectionId) ?? new Set<string>();
    const nextExpandedRowIds = new Set(currentExpandedRowIds);

    if (nextExpandedRowIds.has(pageId)) {
      nextExpandedRowIds.delete(pageId);
    } else {
      nextExpandedRowIds.add(pageId);
    }

    this.collectionExpandedRowIdsMap.set(actualCollectionId, nextExpandedRowIds);
  };

  setCollectionRowExpanded = (collectionId: string, pageId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    const currentExpandedRowIds = this.collectionExpandedRowIdsMap.get(actualCollectionId) ?? new Set<string>();
    if (currentExpandedRowIds.has(pageId)) return;

    this.collectionExpandedRowIdsMap.set(actualCollectionId, new Set([...currentExpandedRowIds, pageId]));
  };

  replaceCollectionExpandedRowIds = (collectionId: string, pageIds: string[]) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    this.collectionExpandedRowIdsMap.set(actualCollectionId, new Set(pageIds));
  };

  getCollectionExpandedRowIds = computedFn((collectionId: string): Set<string> => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return new Set();

    return this.collectionExpandedRowIdsMap.get(actualCollectionId) ?? new Set();
  });

  isCollectionRowExpanded = computedFn((collectionId: string, pageId: string): boolean => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return false;

    return this.collectionExpandedRowIdsMap.get(actualCollectionId)?.has(pageId) ?? false;
  });

  toggleCollectionSidebarExpandedRow = (collectionId: string, pageId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    const currentExpandedRowIds = this.collectionSidebarExpandedRowIdsMap.get(actualCollectionId) ?? new Set<string>();
    const nextExpandedRowIds = new Set(currentExpandedRowIds);

    if (nextExpandedRowIds.has(pageId)) {
      nextExpandedRowIds.delete(pageId);
    } else {
      nextExpandedRowIds.add(pageId);
    }

    this.collectionSidebarExpandedRowIdsMap.set(actualCollectionId, nextExpandedRowIds);
  };

  setCollectionSidebarRowExpanded = (collectionId: string, pageId: string) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    const currentExpandedRowIds = this.collectionSidebarExpandedRowIdsMap.get(actualCollectionId) ?? new Set<string>();
    if (currentExpandedRowIds.has(pageId)) return;

    this.collectionSidebarExpandedRowIdsMap.set(actualCollectionId, new Set([...currentExpandedRowIds, pageId]));
  };

  replaceCollectionSidebarExpandedRowIds = (collectionId: string, pageIds: string[]) => {
    const actualCollectionId = this.resolveCollectionId(collectionId) ?? collectionId;
    this.collectionSidebarExpandedRowIdsMap.set(actualCollectionId, new Set(pageIds));
  };

  getCollectionSidebarExpandedRowIds = computedFn((collectionId: string): Set<string> => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return new Set();

    return this.collectionSidebarExpandedRowIdsMap.get(actualCollectionId) ?? new Set();
  });

  isCollectionSidebarRowExpanded = computedFn((collectionId: string, pageId: string): boolean => {
    const actualCollectionId = this.resolveCollectionId(collectionId);
    if (!actualCollectionId) return false;

    return this.collectionSidebarExpandedRowIdsMap.get(actualCollectionId)?.has(pageId) ?? false;
  });
}
