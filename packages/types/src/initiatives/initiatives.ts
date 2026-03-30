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

import type { TBaseLayoutType } from "../base-layouts";
import type { TFileSignedURLResponse } from "../file";
import type { EIssueLayoutTypes } from "../issues/base";
import type { TFilterExpression, TFilterValue } from "../rich-filters/expression";
import type { LOGICAL_OPERATOR } from "../rich-filters/operators";
import type { TWorkItemFilterProperty, TWorkItemFilterExpression } from "../view-props";

export enum EInitiativeNavigationItem {
  OVERVIEW = "overview",
  SCOPE = "scope",
}

export type TCreateUpdateInitiativeModal = {
  isOpen: boolean;
  initiativeId: string | undefined;
};

export type TInitiativeAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  asset_url: string;
  Initiative_id: string;
  // required
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export type TInitiativeLabel = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type TInitiativeAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment: TInitiativeAttachment;
};

export type TInitiativeAttachmentMap = {
  [initiative_id: string]: TInitiativeAttachment;
};

export type TInitiativeAttachmentIdMap = {
  [initiative_id: string]: string[];
};

export const INITIATIVE_SCOPE_TABS = {
  EPICS: "epics",
  PROJECTS: "projects",
} as const;
export type TInitiativeScopeTab = (typeof INITIATIVE_SCOPE_TABS)[keyof typeof INITIATIVE_SCOPE_TABS];

// Grouping options for board layout
export type TInitiativeScopeEpicGroupBy = "state_groups" | "priority" | "assignees" | "none" | undefined;
export type TInitiativeScopeProjectGroupBy = "states" | "state_groups" | "priority" | "lead" | "none" | undefined;

export interface IInitiativeScopeDisplayFiltersOptions {
  activeLayout: EIssueLayoutTypes;
  activeTab: TInitiativeScopeTab;
  epicGroupBy?: TInitiativeScopeEpicGroupBy;
  projectGroupBy?: TInitiativeScopeProjectGroupBy;
}

export type TInitiativeStates = "DRAFT" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CLOSED";

export type TInitiativeDisplayFilters = {
  layout?: TBaseLayoutType;
  group_by?: TInitiativeGroupByOptions;
  order_by?: TInitiativeOrderByOptions;
};

export type TInitiativeGroupByOptions = "lead" | "created_by" | "state" | "label_ids" | undefined;
export type TInitiativeOrderByOptions = "-updated_at" | "-created_at";

// ---------------------------------------------------------------------------
// Initiative scope – epic filter types
// ---------------------------------------------------------------------------

export type TInitiativeScopeEpicFilterKeys = TWorkItemFilterProperty;
export type TInitiativeScopeEpicFilterExpression = TWorkItemFilterExpression;

// ---------------------------------------------------------------------------
// Initiative scope – project filter types
// ---------------------------------------------------------------------------

export type TInitiativeScopeProjectFilterKeys = "lead" | "start_date" | "target_date" | "state_id" | "priority";

export type TExternalProjectFilterAndGroup = {
  [LOGICAL_OPERATOR.AND]: TExternalProjectFilterExpression[];
};

export type TExternalProjectFilterOrGroup = {
  [LOGICAL_OPERATOR.OR]: TExternalProjectFilterExpression[];
};

export type TExternalProjectFilterNotGroup = {
  [LOGICAL_OPERATOR.NOT]: TExternalProjectFilterExpression;
};

export type TExternalProjectFilterGroup =
  | TExternalProjectFilterAndGroup
  | TExternalProjectFilterOrGroup
  | TExternalProjectFilterNotGroup;

export type TExternalProjectFilterExpressionData =
  | {
      [key in TInitiativeScopeProjectFilterKeys]?: TFilterValue;
    }
  | TExternalProjectFilterGroup;

export type TExternalProjectFilterExpression = TExternalProjectFilterExpressionData;

export type TInternalProjectFilterExpression = TFilterExpression<TInitiativeScopeProjectFilterKeys>;
