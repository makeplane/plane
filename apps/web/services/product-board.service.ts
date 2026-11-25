/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TBoardChanges, TBoardPage, TBoardProduct, TBoardProductDetail, TBoardState } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TBoardScope = { include_closed: boolean; include_old: boolean };

export class ProductBoardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private url(workspaceSlug: string, path = "") {
    return `/api/workspaces/${workspaceSlug}/product-board/${path}`;
  }

  /** Every page of the board. */
  async list(workspaceSlug: string, scope: TBoardScope): Promise<TBoardProduct[]> {
    const products: TBoardProduct[] = [];
    let offset: number | null = 0;
    while (offset !== null) {
      // each page needs the offset the one before gave
      // oxlint-disable-next-line no-await-in-loop
      const response: { data: TBoardPage } = await this.get(this.url(workspaceSlug), { params: { ...scope, offset } });
      products.push(...response.data.results);
      offset = response.data.next_offset;
    }
    return products;
  }

  async states(workspaceSlug: string): Promise<Record<string, TBoardState[]>> {
    return (await this.get(this.url(workspaceSlug, "states/"))).data;
  }

  async retrieve(workspaceSlug: string, id: string): Promise<TBoardProductDetail> {
    return (await this.get(this.url(workspaceSlug, `${id}/`))).data;
  }

  /** `expected` holds the values the change was made from; another value by now is a conflict. */
  async update(
    workspaceSlug: string,
    id: string,
    changes: TBoardChanges,
    expected: TBoardChanges
  ): Promise<TBoardProduct> {
    return (await this.patch(this.url(workspaceSlug, `${id}/`), { ...changes, expected })).data;
  }
}
