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

import type { TLogoProps } from "./common";
import type {
  AdvancedFilterType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  PQLFilterValue,
  TWorkItemFilterExpression,
} from "./view-props";

export enum EViewAccess {
  PRIVATE,
  PUBLIC,
}

export interface IProjectView {
  id: string;
  access: EViewAccess;
  created_at: Date;
  updated_at: Date;
  is_favorite: boolean;
  created_by: string;
  updated_by: string;
  name: string;
  description: string;
  rich_filters: TWorkItemFilterExpression;
  pql_filters: PQLFilterValue;
  last_used_filter: AdvancedFilterType;
  display_filters: IIssueDisplayFilterOptions;
  display_properties: IIssueDisplayProperties;
  query: IIssueFilterOptions;
  query_data: IIssueFilterOptions;
  project: string;
  workspace: string;
  logo_props: TLogoProps | undefined;
  is_locked: boolean;
  anchor?: string;
  owned_by: string;
  total_work_items?: number;
}

export interface IPublishedProjectView extends Omit<IProjectView, "rich_filters"> {
  filters: IIssueFilterOptions;
}

export type TPublishViewSettings = {
  is_comments_enabled: boolean;
  is_reactions_enabled: boolean;
  is_votes_enabled: boolean;
};

export type TPublishViewDetails = TPublishViewSettings & {
  id: string;
  anchor: string;
};

export type TViewFiltersSortKey = "name" | "created_at" | "updated_at";

export type TViewFiltersSortBy = "asc" | "desc";

export type TViewFilterProps = {
  created_at?: string[] | null;
  owned_by?: string[] | null;
  favorites?: boolean;
  view_type?: EViewAccess[];
};

export type TViewFilters = {
  searchQuery: string;
  sortKey: TViewFiltersSortKey;
  sortBy: TViewFiltersSortBy;
  filters?: TViewFilterProps;
};
