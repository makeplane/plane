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

import type { TPaginationInfo } from "../common";
import type { TPage, TPageFilterProps, TSubPageDetails } from "../page";

export type TPageCollection = {
  id: string;
  collection: string;
  page: string;
  sort_order?: number | null;
  workspace?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
};

type TPageCollectionMetadata = Pick<
  TPageCollection,
  "workspace" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export type TPageCollectionBranchParams = {
  parent_id?: string | null;
  search?: string;
  filters?: TPageFilterProps;
  cursor?: string;
  per_page?: number;
};

type TCollectionBranchPageSummaryMetadata = Pick<
  TPage,
  | "workspace"
  | "sub_pages_count"
  | "is_shared"
  | "shared_access"
  | "owned_by"
  | "deleted_at"
  | "is_description_empty"
  | "updated_at"
  | "updated_by"
  | "moved_to_page"
  | "moved_to_project"
  | "sort_order"
  | "created_at"
  | "created_by"
  | "is_favorite"
>;

export type TCollectionBranchPageSummary = TSubPageDetails &
  TCollectionBranchPageSummaryMetadata &
  Required<Pick<TPage, "collection_id">>;

export type TCollectionBranchRow = TPageCollectionMetadata & {
  page_collection_id?: string | null;
  collection_id: string;
  page: TCollectionBranchPageSummary;
  sort_order?: number | null;
  parent_id?: string | null;
};

export type TPageCollectionBranchResponse = TPaginationInfo & {
  results: TCollectionBranchRow[];
};

export type TCollectionAddablePage = Pick<TPage, "id" | "name" | "logo_props">;

export type TPageCollectionCreatePayload = {
  page_ids: string[];
  sort_orders?: Record<string, number>;
};

export type TPageCollectionUpdatePayload = {
  collection?: string;
  sort_order?: number;
};
