/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { CalendarDays, LayersIcon, Paperclip } from "lucide-react";
// types
import { ISSUE_GROUP_BY_OPTIONS } from "@plane/constants";
import type { ISvgIcons } from "@plane/propel/icons";
import {
  LinkIcon,
  CycleIcon,
  StatePropertyIcon,
  ModuleIcon,
  MembersPropertyIcon,
  DueDatePropertyIcon,
  EstimatePropertyIcon,
  LabelPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
} from "@plane/propel/icons";
import type {
  IGroupByColumn,
  IIssueDisplayProperties,
  TGetColumns,
  TIssueGroupByOptions,
  TSpreadsheetColumn,
} from "@plane/types";
// components
import {
  SpreadsheetAssigneeColumn,
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetModuleColumn,
  SpreadsheetCycleColumn,
  SpreadsheetLinkColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "@/components/issues/issue-layouts/spreadsheet/columns";
import {
  SpreadsheetDepartmentNameColumn,
  SpreadsheetProjectNameColumn,
  SpreadsheetProjectLeadColumn,
  SpreadsheetBankWideProjectColumn,
  SpreadsheetProgressTrackingColumn,
  SpreadsheetCompletedDateColumn,
  SpreadsheetReferenceLinkColumn,
  SpreadsheetTotalLogTimeColumn,
} from "@/plane-web/components/issues/spreadsheet/columns";
import { SpreadsheetDueDateColumnWithReason } from "@/plane-web/components/issues/issue-layouts/spreadsheet-due-date-column-with-reason";
// store
import { store } from "@/lib/store-context";

export type TGetScopeMemberIdsResult = {
  memberIds: string[];
  includeNone: boolean;
};

export const getScopeMemberIds = ({ isWorkspaceLevel, projectId }: TGetColumns): TGetScopeMemberIdsResult => {
  // store values
  const { workspaceMemberIds } = store.memberRoot.workspace;
  const { projectMemberIds } = store.memberRoot.project;
  // derived values
  const memberIds = workspaceMemberIds;

  if (isWorkspaceLevel) {
    return { memberIds: memberIds ?? [], includeNone: true };
  }

  if (projectId || (projectMemberIds && projectMemberIds.length > 0)) {
    const { getProjectMemberIds } = store.memberRoot.project;
    const _projectMemberIds = projectId ? getProjectMemberIds(projectId, false) : projectMemberIds;
    return {
      memberIds: _projectMemberIds ?? [],
      includeNone: true,
    };
  }

  return { memberIds: [], includeNone: true };
};

export const getTeamProjectColumns = (): IGroupByColumn[] | undefined => undefined;

export const SpreadSheetPropertyIconMap: Record<string, FC<ISvgIcons>> = {
  MembersPropertyIcon: MembersPropertyIcon,
  CalenderDays: CalendarDays,
  DueDatePropertyIcon: DueDatePropertyIcon,
  EstimatePropertyIcon: EstimatePropertyIcon,
  LabelPropertyIcon: LabelPropertyIcon,
  ModuleIcon: ModuleIcon,
  ContrastIcon: CycleIcon,
  PriorityPropertyIcon: PriorityPropertyIcon,
  StartDatePropertyIcon: StartDatePropertyIcon,
  StatePropertyIcon: StatePropertyIcon,
  Link2: LinkIcon,
  Paperclip: Paperclip,
  LayersIcon: LayersIcon,
};

export const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: TSpreadsheetColumn } = {
  assignee: SpreadsheetAssigneeColumn,
  created_on: SpreadsheetCreatedOnColumn,
  due_date: SpreadsheetDueDateColumnWithReason,
  estimate: SpreadsheetEstimateColumn,
  labels: SpreadsheetLabelColumn,
  modules: SpreadsheetModuleColumn,
  cycle: SpreadsheetCycleColumn,
  link: SpreadsheetLinkColumn,
  priority: SpreadsheetPriorityColumn,
  start_date: SpreadsheetStartDateColumn,
  state: SpreadsheetStateColumn,
  sub_issue_count: SpreadsheetSubIssueColumn,
  updated_on: SpreadsheetUpdatedOnColumn,
  attachment_count: SpreadsheetAttachmentColumn,
  // CE extended columns
  department_name: SpreadsheetDepartmentNameColumn,
  project_name: SpreadsheetProjectNameColumn,
  project_lead: SpreadsheetProjectLeadColumn,
  bank_wide_project: SpreadsheetBankWideProjectColumn,
  progress_tracking: SpreadsheetProgressTrackingColumn,
  completed_date: SpreadsheetCompletedDateColumn,
  reference_link: SpreadsheetReferenceLinkColumn,
  total_log_time: SpreadsheetTotalLogTimeColumn,
};

export const useGroupByOptions = (
  options: TIssueGroupByOptions[]
): {
  key: TIssueGroupByOptions;
  titleTranslationKey: string;
}[] => {
  const groupByOptions = ISSUE_GROUP_BY_OPTIONS.filter((option) => options.includes(option.key));
  return groupByOptions;
};
