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

// Lightweight response from the list endpoint (GET /collections/{id}/pages/)
export type TPageCollectionListItem = {
  id: string;
  page_id: string;
  collection_id: string;
  sort_order?: number | null;
  parent_id?: string | null;
};

export type TPageCollectionMembership = TPageCollection & {
  parent_id?: string | null;
};

export type TPageCollectionCreatePayload = {
  page_ids: string[];
  sort_orders?: Record<string, number>;
};

export type TPageCollectionUpdatePayload = {
  collection?: string;
  sort_order?: number;
};
