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

// plane imports
import type { WorkItemFilterInstance } from "@plane/shared-state";
import type {
  EIssuesStoreType,
  IIssueFilters,
  TWorkItemFilterExpression,
  TWorkItemFilterProperty,
  TWorkItemFiltersSaveViewOptions,
  TWorkItemFiltersUpdateViewOptions,
} from "@plane/types";
// store
import type { UpdateAdvancedFiltersParams } from "@/store/work-items/helpers/issue-filter-helper.store";

export type TSharedWorkItemFiltersProps = {
  entityType: EIssuesStoreType; // entity type (project, cycle, workspace, teamspace, etc)
  filtersToShowByLayout: TWorkItemFilterProperty[];
  updateFilters: (params: UpdateAdvancedFiltersParams) => Promise<void>;
  isTemporary?: boolean;
  showOnMount?: boolean;
} & ({ isTemporary: true; entityId?: string } | { isTemporary?: false; entityId: string }); // entity id (project_id, cycle_id, workspace_id, etc)

export type TSharedWorkItemFiltersHOCChildrenProps = {
  filter: WorkItemFilterInstance | undefined;
};

export type TSharedWorkItemFiltersHOCProps = TSharedWorkItemFiltersProps & {
  children: React.ReactNode | ((props: TSharedWorkItemFiltersHOCChildrenProps) => React.ReactNode);
  initialWorkItemFilters: IIssueFilters | undefined;
};

export type TEnableSaveViewProps = {
  enableSaveView?: boolean;
  saveViewOptions?: Omit<TWorkItemFiltersSaveViewOptions<TWorkItemFilterExpression>, "onViewSave">;
};

export type TEnableUpdateViewProps = {
  enableUpdateView?: boolean;
  updateViewOptions?: Omit<TWorkItemFiltersUpdateViewOptions<TWorkItemFilterExpression>, "onViewUpdate">;
};
