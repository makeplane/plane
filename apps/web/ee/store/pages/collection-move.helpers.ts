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

import type { EPageAccess, TPage, TPageCollection } from "@plane/types";
import type { TPageInternalUpdateSnapshot } from "./workspace-page.store";

export type TCollectionDropCollectionMutation =
  | {
      kind: "none";
      pageId: string;
    }
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

export type TCollectionDropPlan = {
  pageId: string;
  sourceCollectionId: string | undefined;
  sourceParentId: string | null;
  targetCollectionId: string;
  targetParentId: string | null;
  pageUpdatePayload: Partial<TPage>;
  previousExplicitPageCollections: TPageCollection[];
  optimisticPageCollection?: TPageCollection;
  collectionMutation: TCollectionDropCollectionMutation;
};

export type TCollectionDropSnapshot = {
  pageId: string;
  pageSnapshot?: TPageInternalUpdateSnapshot;
  previousExplicitPageCollections: TPageCollection[];
  optimisticPageCollectionId?: string;
  sourceCollectionId?: string;
  sourceParentId: string | null;
  targetCollectionId: string;
  targetParentId: string | null;
};

export type TCollectionDropPlanParams = {
  pageId: string;
  sourceCollectionId?: string | null;
  targetCollectionId: string;
  targetParentId: string | null;
  targetSortOrder?: number;
  reorderTargetPageId?: string;
  reorderPosition?: "before" | "after";
  access?: EPageAccess;
  clearSharedAccess?: boolean;
};

export type TCollectionDropExecutionOptions = {
  persistPageUpdate?: () => Promise<void>;
  rollbackPersistedCollectionUpdate?: () => Promise<void>;
  errorMessage?: string;
};

type TCollectionMoveIdentity = {
  pageId: string;
  sourceCollectionId?: string;
  sourceParentId: string | null;
  targetCollectionId: string;
  targetParentId: string | null;
};

type TCreateCollectionMoveMutationParams = {
  currentPageCollection: TPageCollection | undefined;
  pageId: string;
  sourceCollectionId: string;
  targetCollectionId: string;
  targetSortOrder: number;
};

type TGetPreviousExplicitPageCollectionsParams = {
  pageId: string;
  sourceCollectionId: string;
  targetCollectionId: string;
  currentPageCollection: TPageCollection | undefined;
  getPageCollectionByPageId: (pageId: string) => TPageCollection | undefined;
  getSubtreePageIds: (pageId: string) => string[];
};

type TCollectionMovePageShape = Pick<TPage, "parent_id" | "access" | "is_shared" | "sort_order">;

export const toCollectionMoveError = (reason: unknown, fallbackMessage: string) =>
  reason instanceof Error ? reason : new Error(typeof reason === "string" ? reason : fallbackMessage);

export const getCreatedPageCollectionOrThrow = (
  pageCollections: TPageCollection[],
  pageId: string,
  errorMessage: string
): TPageCollection => {
  const pageCollection = pageCollections.find((item) => item.page === pageId);
  if (!pageCollection) {
    throw new Error(errorMessage);
  }

  return pageCollection;
};

export const buildCollectionMovePageUpdatePayload = (
  page: TCollectionMovePageShape,
  params: Pick<TCollectionDropPlanParams, "targetParentId" | "access" | "clearSharedAccess"> & {
    targetSortOrder?: number;
    updateSortOrder?: boolean;
  }
): Partial<TPage> => {
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

  if (params.updateSortOrder && params.targetSortOrder !== undefined && page.sort_order !== params.targetSortOrder) {
    pageUpdatePayload.sort_order = params.targetSortOrder;
  }

  return pageUpdatePayload;
};

export const getPreviousExplicitPageCollections = ({
  pageId,
  sourceCollectionId,
  targetCollectionId,
  currentPageCollection,
  getPageCollectionByPageId,
  getSubtreePageIds,
}: TGetPreviousExplicitPageCollectionsParams): TPageCollection[] => {
  if (sourceCollectionId !== targetCollectionId) {
    return getSubtreePageIds(pageId)
      .map((subtreePageId) => getPageCollectionByPageId(subtreePageId))
      .filter((pageCollection): pageCollection is TPageCollection => !!pageCollection)
      .map((pageCollection) => ({ ...pageCollection }));
  }

  return currentPageCollection ? [{ ...currentPageCollection }] : [];
};

export const createCollectionMoveMutation = ({
  currentPageCollection,
  pageId,
  sourceCollectionId,
  targetCollectionId,
  targetSortOrder,
}: TCreateCollectionMoveMutationParams): TCollectionDropCollectionMutation => {
  if (currentPageCollection) {
    return {
      kind: "update",
      collectionId: currentPageCollection.collection,
      pageCollectionId: currentPageCollection.id,
      pageId,
      sortOrder: targetSortOrder,
      nextCollectionId: currentPageCollection.collection !== targetCollectionId ? targetCollectionId : undefined,
    };
  }

  if (sourceCollectionId === targetCollectionId) {
    return {
      kind: "none",
      pageId,
    };
  }

  return {
    kind: "create",
    collectionId: targetCollectionId,
    pageId,
    sortOrder: targetSortOrder,
  };
};

export const getOptimisticCollectionMoveId = (
  collectionMutation: Exclude<TCollectionDropCollectionMutation, { kind: "none" }>,
  targetCollectionId: string,
  pageId: string
) =>
  collectionMutation.kind === "update"
    ? collectionMutation.pageCollectionId
    : `optimistic-page-collection-${targetCollectionId}-${pageId}`;

export const getCollectionMoveSyncParams = ({
  pageId,
  sourceCollectionId,
  sourceParentId,
  targetCollectionId,
  targetParentId,
}: TCollectionMoveIdentity) => ({
  pageId,
  sourceCollectionId,
  sourceParentId,
  targetCollectionId,
  targetParentId,
});

export const getCollectionMoveUpdatePayload = (
  collectionMutation: Extract<TCollectionDropCollectionMutation, { kind: "update" }>
) => ({
  sort_order: collectionMutation.sortOrder,
  ...(collectionMutation.nextCollectionId && {
    collection: collectionMutation.nextCollectionId,
  }),
});

export const getCollectionMoveCreatePayload = (
  collectionMutation: Extract<TCollectionDropCollectionMutation, { kind: "create" }>
) => ({
  page_ids: [collectionMutation.pageId],
  sort_orders: { [collectionMutation.pageId]: collectionMutation.sortOrder },
});

export const getCollectionMoveRollbackPayload = (
  collectionMutation: Extract<TCollectionDropCollectionMutation, { kind: "update" }>
) => ({
  collection: collectionMutation.collectionId,
});
