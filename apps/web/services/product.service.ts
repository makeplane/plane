/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TProductListItem, TProductType } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

const data = <T>(request: Promise<{ data: T }>): Promise<T> =>
  request
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });

export class ProductService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  listTypes(workspaceSlug: string): Promise<TProductType[]> {
    return data(this.get(`/api/workspaces/${workspaceSlug}/product-types/`));
  }

  createType(workspaceSlug: string, payload: Partial<TProductType>): Promise<TProductType> {
    return data(this.post(`/api/workspaces/${workspaceSlug}/product-types/`, payload));
  }

  updateType(workspaceSlug: string, id: string, payload: Partial<TProductType>): Promise<TProductType> {
    return data(this.patch(`/api/workspaces/${workspaceSlug}/product-types/${id}/`, payload));
  }

  removeType(workspaceSlug: string, id: string): Promise<void> {
    return data(this.delete(`/api/workspaces/${workspaceSlug}/product-types/${id}/`));
  }

  list(workspaceSlug: string, params: { team_id?: string; portfolio_id?: string }): Promise<TProductListItem[]> {
    return data(this.get(`/api/workspaces/${workspaceSlug}/products/`, { params }));
  }
}
