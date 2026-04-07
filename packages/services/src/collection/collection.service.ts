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
import type { TCollection, TCollectionCreatePayload, TCollectionUpdatePayload } from "@plane/types";
import { APIService } from "../api.service";

export class CollectionService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL ?? (API_BASE_URL as string));
  }

  async list(workspaceSlug: string): Promise<TCollection[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/collections/`)
      .then((response) => response?.data as TCollection[])
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, collectionId: string): Promise<TCollection> {
    return this.get(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/`)
      .then((response) => response?.data as TCollection)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: TCollectionCreatePayload): Promise<TCollection> {
    return this.post(`/api/workspaces/${workspaceSlug}/collections/`, data)
      .then((response) => response?.data as TCollection)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, collectionId: string, data: TCollectionUpdatePayload): Promise<TCollection> {
    return this.patch(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/`, data)
      .then((response) => response?.data as TCollection)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, collectionId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/`).catch(
      (error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      }
    );
  }

  async movePages(workspaceSlug: string, collectionId: string, newCollectionId: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/move-pages/`, {
      new_collection_id: newCollectionId,
    }).catch((error: { response?: { data: unknown } }) => {
      throw error?.response?.data;
    });
  }
}
