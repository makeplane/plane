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
  TCollectionAddablePage,
  TPageCollection,
  TPageCollectionBranchParams,
  TPageCollectionBranchResponse,
  TPageCollectionCreatePayload,
  TPageCollectionUpdatePayload,
} from "@plane/types";
import { APIService } from "../api.service";

const RELATIVE_CREATED_AT_OFFSETS: Record<string, number> = {
  "1_weeks": 7,
  "2_weeks": 14,
  "1_months": 30,
  "2_months": 60,
};

const formatDateParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isValidDateParam = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const dateParts = value.split("-");
  if (dateParts.length !== 3) return false;

  const [yearPart, monthPart, dayPart] = dateParts;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  if ([year, month, day].some((part) => Number.isNaN(part))) return false;

  const parsedDate = new Date(year, month - 1, day);

  return parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day;
};

const parseCreatedAtFilter = (rawValue: string): { dateValue: string; operator: "after" | "before" } | undefined => {
  if (typeof rawValue !== "string" || !rawValue.includes(";")) return undefined;

  const [dateValuePart = "", operatorPart = "", source = ""] = rawValue.split(";");
  let dateValue = dateValuePart;

  if ((operatorPart === "after" || operatorPart === "before") && source === "fromnow") {
    const offset = RELATIVE_CREATED_AT_OFFSETS[dateValuePart];
    if (!offset) return undefined;

    const relativeDate = new Date();
    relativeDate.setHours(0, 0, 0, 0);
    relativeDate.setDate(relativeDate.getDate() + (operatorPart === "before" ? -offset : offset));
    dateValue = formatDateParam(relativeDate);
  }

  if ((operatorPart !== "after" && operatorPart !== "before") || !isValidDateParam(dateValue)) {
    return undefined;
  }

  return { dateValue, operator: operatorPart };
};

export const serializePageCollectionFiltersToQueryParams = (
  filters: TPageCollectionBranchParams["filters"]
): Record<string, unknown> => {
  const queryParams: Record<string, unknown> = {};

  if (!filters) return queryParams;

  if (filters.created_by && filters.created_by.length > 0) {
    queryParams.created_by = filters.created_by.join(",");
  }

  if (filters.favorites) {
    queryParams.favorites = true;
  }

  if (filters.created_at && filters.created_at.length > 0) {
    const lowerBounds: string[] = [];
    const upperBounds: string[] = [];

    filters.created_at.forEach((rawValue) => {
      const parsedFilter = parseCreatedAtFilter(rawValue);
      if (!parsedFilter) return;

      if (parsedFilter.operator === "after") {
        lowerBounds.push(parsedFilter.dateValue);
      } else {
        upperBounds.push(parsedFilter.dateValue);
      }
    });

    if (lowerBounds.length > 0) {
      queryParams.created_at__gte = lowerBounds.sort().at(-1);
    }

    if (upperBounds.length > 0) {
      queryParams.created_at__lte = upperBounds.sort()[0];
    }
  }

  return queryParams;
};

export class PageCollectionService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(
    workspaceSlug: string,
    collectionId: string,
    params: TPageCollectionBranchParams = {}
  ): Promise<TPageCollectionBranchResponse> {
    const queryParams: Record<string, unknown> = {
      ...serializePageCollectionFiltersToQueryParams(params.filters),
    };

    if (params.parent_id !== undefined) {
      queryParams.parent_id = params.parent_id;
    }
    if (params.search) {
      queryParams.search = params.search;
    }
    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }
    if (params.per_page) {
      queryParams.per_page = params.per_page;
    }

    return this.get(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/pages/`, {
      params: queryParams,
    })
      .then((response) => response?.data as TPageCollectionBranchResponse)
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

  async searchAddablePages(
    workspaceSlug: string,
    collectionId: string,
    params: { search?: string } = {}
  ): Promise<TCollectionAddablePage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/collections/${collectionId}/pages-search/`, {
      params: {
        search: params.search,
      },
    })
      .then((response) => response?.data as TCollectionAddablePage[])
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
