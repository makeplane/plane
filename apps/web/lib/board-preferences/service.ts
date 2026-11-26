/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// the per-user settings record, GET/PATCH /api/users/me/board-preferences/

import { API_BASE_URL } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueLayouts,
  TWorkItemFilterExpression,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export type TGlobalBoardTemplate = {
  layout?: TIssueLayouts | null;
  display_filters?: IIssueDisplayFilterOptions | null;
  display_properties?: IIssueDisplayProperties | null;
  /** portable conditions only, see portable-filters.ts */
  filters?: TWorkItemFilterExpression | null;
};

export type TGlobalBoardSettings = {
  enabled: boolean;
  template: TGlobalBoardTemplate | null;
  /** project-specific conditions while the template is on, per project id */
  project_filters: Record<string, TWorkItemFilterExpression>;
};

export type TBoardPreferences = {
  global_board: TGlobalBoardSettings;
  auto_collapse_empty_groups: boolean;
};

export type TBoardPreferencesResponse = { settings: TBoardPreferences; version: number };

export type TBoardPreferencesPatch = {
  global_board?: {
    enabled?: boolean;
    template?: TGlobalBoardTemplate | null;
    /** a null value removes that project's entry; null for the whole map clears every entry */
    project_filters?: Record<string, TWorkItemFilterExpression | null> | null;
  };
  auto_collapse_empty_groups?: boolean;
};

export const DEFAULT_BOARD_PREFERENCES: TBoardPreferences = {
  global_board: { enabled: false, template: null, project_filters: {} },
  auto_collapse_empty_groups: false,
};

export class BoardPreferencesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetch(): Promise<TBoardPreferencesResponse> {
    return this.get("/api/users/me/board-preferences/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(data: TBoardPreferencesPatch): Promise<TBoardPreferencesResponse> {
    return this.patch("/api/users/me/board-preferences/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
