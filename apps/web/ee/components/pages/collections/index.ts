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

import type { TPageNavigationTabs } from "@plane/types";

export const PREDEFINED_WIKI_COLLECTIONS = {
  general: {
    displayName: "General",
    pageStoreType: "public",
  },
  private: {
    displayName: "Private",
    pageStoreType: "private",
  },
  shared: {
    displayName: "Shared",
    pageStoreType: "shared",
  },
  archived: {
    displayName: "Archived",
    pageStoreType: "archived",
  },
} as const satisfies Record<string, { displayName: string; pageStoreType: TPageNavigationTabs }>;

export const PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS = {
  general: "wiki_collections.predefined.general",
  private: "wiki_collections.predefined.private",
  shared: "wiki_collections.predefined.shared",
  archived: "wiki_collections.predefined.archived",
} as const satisfies Record<keyof typeof PREDEFINED_WIKI_COLLECTIONS, string>;

export type TPredefinedWikiCollectionSlug = keyof typeof PREDEFINED_WIKI_COLLECTIONS;

export const isPredefinedWikiCollection = (
  collectionId: string | undefined
): collectionId is TPredefinedWikiCollectionSlug => !!collectionId && collectionId in PREDEFINED_WIKI_COLLECTIONS;

export const getPredefinedWikiCollection = (collectionId: string | undefined) =>
  isPredefinedWikiCollection(collectionId) ? PREDEFINED_WIKI_COLLECTIONS[collectionId] : undefined;

export const resolveWikiCollectionId = (pathname: string, collectionId?: string) => {
  if (collectionId) return collectionId;

  const pathSegments = pathname.split("/");
  const collectionsSegmentIndex = pathSegments.indexOf("collections");
  if (collectionsSegmentIndex === -1) return undefined;

  return pathSegments[collectionsSegmentIndex + 1];
};
