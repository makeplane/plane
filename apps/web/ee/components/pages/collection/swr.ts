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

export const COLLECTION_SWR_OPTIONS = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

export const collectionListKey = (workspaceSlug: string) => ["workspace-collections", workspaceSlug] as const;

export const collectionPagesKey = (
  workspaceSlug: string,
  collectionId: string,
  searchQuery = "",
  filters?: TPageFilterProps
) => ["collection-pages", workspaceSlug, collectionId, searchQuery, JSON.stringify(filters ?? {})] as const;
