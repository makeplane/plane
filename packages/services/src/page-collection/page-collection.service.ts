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

import { API_BASE_URL } from "@plane/constants";
import type {
  TPageCollection,
  TPageCollectionCreatePayload,
  TPageCollectionListItem,
  TPageCollectionMembership,
  TPageCollectionUpdatePayload,
} from "@plane/types";
import { APIService } from "../api.service";

export class PageCollectionService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL ?? (API_BASE_URL as string));
  }

  async list(workspaceSlug: string, collectionId: string): Promise<TPageCollectionMembership[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/pages/`)
      .then((response) => {
        const items = response?.data as TPageCollectionListItem[];
        return items.map(
          (item): TPageCollectionMembership => ({
            id: item.id,
            page: item.page_id,
            collection: item.collection_id,
            sort_order: item.sort_order,
            parent_id: item.parent_id ?? null,
          })
        );
      })
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    collectionId: string,
    payload: TPageCollectionCreatePayload
  ): Promise<TPageCollection[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/pages/`, payload)
      .then((response) => response?.data as TPageCollection[])
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, collectionId: string, pageCollectionId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/pages/${pageCollectionId}/`).catch(
      (error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      }
    );
  }

  async update(
    workspaceSlug: string,
    collectionId: string,
    pageCollectionId: string,
    payload: TPageCollectionUpdatePayload
  ): Promise<TPageCollection> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/collections/${collectionId}/pages/${pageCollectionId}/`,
      payload
    )
      .then((response) => response?.data as TPageCollection)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
