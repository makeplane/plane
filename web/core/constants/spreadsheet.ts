"use client";
import { FC } from "react";
// icons
import {
  CalendarDays,
  Link2,
  Signal,
  Tag,
  Triangle,
  Paperclip,
  CalendarCheck2,
  CalendarClock,
  Users,
} from "lucide-react";
// types
import { IIssueDisplayProperties, TIssue, TIssueOrderByOptions } from "@plane/types";
// ui
import { LayersIcon, DoubleCircleIcon, DiceIcon, ContrastIcon } from "@plane/ui";
import { ISvgIcons } from "@plane/ui/src/icons/type";
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

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key: string]: {
    title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TIssueOrderByOptions;
    descendingOrderTitle: string;
    icon: FC<ISvgIcons>;
    Column: React.FC<{
      issue: TIssue;
      onClose: () => void;
      onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
      disabled: boolean;
    }>;
  };
} = {
  assignee: {
    title: "Assignees",
    ascendingOrderKey: "assignees__first_name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-assignees__first_name",
    descendingOrderTitle: "Z",
    icon: Users,
    Column: SpreadsheetAssigneeColumn,
  },
  created_on: {
    title: "Created on",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
    Column: SpreadsheetCreatedOnColumn,
  },
  due_date: {
    title: "Due date",
    ascendingOrderKey: "-target_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "target_date",
    descendingOrderTitle: "Old",
    icon: CalendarCheck2,
    Column: SpreadsheetDueDateColumn,
  },
  estimate: {
    title: "Estimate",
    ascendingOrderKey: "estimate_point",
    ascendingOrderTitle: "Low",
    descendingOrderKey: "-estimate_point",
    descendingOrderTitle: "High",
    icon: Triangle,
    Column: SpreadsheetEstimateColumn,
  },
  labels: {
    title: "Labels",
    ascendingOrderKey: "labels__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-labels__name",
    descendingOrderTitle: "Z",
    icon: Tag,
    Column: SpreadsheetLabelColumn,
  },
  modules: {
    title: "Modules",
    ascendingOrderKey: "issue_module__module__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-issue_module__module__name",
    descendingOrderTitle: "Z",
    icon: DiceIcon,
    Column: SpreadsheetModuleColumn,
  },
  cycle: {
    title: "Cycle",
    ascendingOrderKey: "issue_cycle__cycle__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-issue_cycle__cycle__name",
    descendingOrderTitle: "Z",
    icon: ContrastIcon,
    Column: SpreadsheetCycleColumn,
  },
  priority: {
    title: "Priority",
    ascendingOrderKey: "priority",
    ascendingOrderTitle: "None",
    descendingOrderKey: "-priority",
    descendingOrderTitle: "Urgent",
    icon: Signal,
    Column: SpreadsheetPriorityColumn,
  },
  start_date: {
    title: "Start date",
    ascendingOrderKey: "-start_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "start_date",
    descendingOrderTitle: "Old",
    icon: CalendarClock,
    Column: SpreadsheetStartDateColumn,
  },
  state: {
    title: "State",
    ascendingOrderKey: "state__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-state__name",
    descendingOrderTitle: "Z",
    icon: DoubleCircleIcon,
    Column: SpreadsheetStateColumn,
  },
  updated_on: {
    title: "Updated on",
    ascendingOrderKey: "-updated_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "updated_at",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
    Column: SpreadsheetUpdatedOnColumn,
  },
  link: {
    title: "Link",
    ascendingOrderKey: "-link_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "link_count",
    descendingOrderTitle: "Least",
    icon: Link2,
    Column: SpreadsheetLinkColumn,
  },
  attachment_count: {
    title: "Attachment",
    ascendingOrderKey: "-attachment_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "attachment_count",
    descendingOrderTitle: "Least",
    icon: Paperclip,
    Column: SpreadsheetAttachmentColumn,
  },
  sub_issue_count: {
    title: "Sub-issue",
    ascendingOrderKey: "-sub_issues_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "sub_issues_count",
    descendingOrderTitle: "Least",
    icon: LayersIcon,
    Column: SpreadsheetSubIssueColumn,
  },
};

export const SPREADSHEET_PROPERTY_LIST: (keyof IIssueDisplayProperties)[] = [
  "state",
  "priority",
  "assignee",
  "labels",
  "modules",
  "cycle",
  "start_date",
  "due_date",
  "estimate",
  "created_on",
  "updated_on",
  "link",
  "attachment_count",
  "sub_issue_count",
];

export const SPREADSHEET_SELECT_GROUP = "spreadsheet-issues";
