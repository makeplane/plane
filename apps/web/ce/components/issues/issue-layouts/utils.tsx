import { FC } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ContrastIcon,
  LayersIcon,
  Link2,
  Paperclip,
  Signal,
  Tag,
  Triangle,
  Users,
} from "lucide-react";
// types
import { IGroupByColumn, IIssueDisplayProperties, TGetColumns, TSpreadsheetColumn } from "@plane/types";
import { DiceIcon, DoubleCircleIcon, ISvgIcons } from "@plane/ui";
// components
import {
  SpreadsheetAssigneeColumn,
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
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
} from "@/components/issues/issue-layouts/spreadsheet";
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
  Users: Users,
  CalenderDays: CalendarDays,
  CalenderCheck2: CalendarCheck2,
  Triangle: Triangle,
  Tag: Tag,
  DiceIcon: DiceIcon,
  ContrastIcon: ContrastIcon,
  Signal: Signal,
  CalendarClock: CalendarClock,
  DoubleCircleIcon: DoubleCircleIcon,
  Link2: Link2,
  Paperclip: Paperclip,
  LayersIcon: LayersIcon,
};

export const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: TSpreadsheetColumn } = {
  assignee: SpreadsheetAssigneeColumn,
  created_on: SpreadsheetCreatedOnColumn,
  due_date: SpreadsheetDueDateColumn,
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
};
