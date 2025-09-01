import { FC } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  LayersIcon,
  Link2,
  Paperclip,
  Signal,
  Tag,
  Users,
} from "lucide-react";
import { IIssueDisplayProperties } from "@plane/types";
import { ContrastIcon, DiceIcon, DoubleCircleIcon } from "@plane/ui";
import { ISvgIcons } from "@plane/ui/src/icons/type";
import { IIssue } from "@/types/issue";
import {
  SpreadsheetAssigneeColumn,
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetCycleColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetLinkColumn,
  SpreadsheetModuleColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "..";

export * from "./assignee-column";
export * from "./attachment-column";
export * from "./created-on-column";
export * from "./due-date-column";
export * from "./label-column";
export * from "./link-column";
export * from "./priority-column";
export * from "./start-date-column";
export * from "./state-column";
export * from "./sub-issue-column";
export * from "./updated-on-column";
export * from "./module-column";
export * from "./cycle-column";

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key: string]: {
    title: string;
    icon: FC<ISvgIcons>;
    Column: React.FC<{
      issue: IIssue;
    }>;
  };
} = {
  assignee: {
    title: "Assignees",
    icon: Users,
    Column: SpreadsheetAssigneeColumn,
  },
  created_on: {
    title: "Created on",
    icon: CalendarDays,
    Column: SpreadsheetCreatedOnColumn,
  },
  due_date: {
    title: "Due date",
    icon: CalendarCheck2,
    Column: SpreadsheetDueDateColumn,
  },
  //   estimate: {
  //     title: "Estimate",
  //     icon: Triangle,
  //     Column: SpreadsheetEstimateColumn,
  //   },
  labels: {
    title: "Labels",
    icon: Tag,
    Column: SpreadsheetLabelColumn,
  },
  modules: {
    title: "Modules",
    icon: DiceIcon,
    Column: SpreadsheetModuleColumn,
  },
  cycle: {
    title: "Cycle",
    icon: ContrastIcon,
    Column: SpreadsheetCycleColumn,
  },
  priority: {
    title: "Priority",
    icon: Signal,
    Column: SpreadsheetPriorityColumn,
  },
  start_date: {
    title: "Start date",
    icon: CalendarClock,
    Column: SpreadsheetStartDateColumn,
  },
  state: {
    title: "State",
    icon: DoubleCircleIcon,
    Column: SpreadsheetStateColumn,
  },
  updated_on: {
    title: "Updated on",
    icon: CalendarDays,
    Column: SpreadsheetUpdatedOnColumn,
  },
  link: {
    title: "Link",
    icon: Link2,
    Column: SpreadsheetLinkColumn,
  },
  attachment_count: {
    title: "Attachment",
    icon: Paperclip,
    Column: SpreadsheetAttachmentColumn,
  },
  sub_issue_count: {
    title: "Sub-work item",
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
