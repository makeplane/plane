"use client";
import { FC } from "react";
// icons
import { CalendarDays, Link2, Signal, Paperclip } from "lucide-react";
// ui
import { LayersIcon, DoubleCircleIcon } from "@plane/ui";
import { ISvgIcons } from "@plane/ui/src/icons/type";

import {
  SpreadsheetLeadColumn,
  SpreadsheetUpdatedOnColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStateColumn,
  SpreadsheetIssueColumn,
  SpreadsheetMembersColumn,
} from "@/plane-web/components/projects/layouts/spreadsheet/columns";
import { TProject } from "@/plane-web/types/projects";

export interface IProjectDisplayProperties {
  priority?: boolean;
  state?: boolean;
  duration: string;
  lead: string;
  members_count: number;
  issue_count: number;
}

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key: string]: {
    title: string;
    ascendingOrderTitle: string;
    descendingOrderTitle: string;
    icon: FC<ISvgIcons>;
    isSortingAllowed?: boolean;
    Column: React.FC<{
      project: TProject;
      onClose?: () => void;
      onChange: (project: TProject, data: Partial<TProject>) => void;
      disabled: boolean;
    }>;
  };
} = {
  priority: {
    title: "Priority",
    ascendingOrderTitle: "None",
    descendingOrderTitle: "Urgent",
    icon: Signal,
    Column: SpreadsheetPriorityColumn,
    isSortingAllowed: true,
  },

  state: {
    title: "State",
    ascendingOrderTitle: "A",
    descendingOrderTitle: "Z",
    icon: DoubleCircleIcon,
    Column: SpreadsheetStateColumn,
    isSortingAllowed: true,
  },
  duration: {
    title: "Start date -> End date",
    ascendingOrderTitle: "New",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
    Column: SpreadsheetUpdatedOnColumn,
    isSortingAllowed: true,
  },
  lead: {
    title: "Lead",
    ascendingOrderTitle: "Most",
    descendingOrderTitle: "Least",
    icon: Link2,
    Column: SpreadsheetLeadColumn,
    isSortingAllowed: false,
  },
  members_count: {
    title: "No. of Members",
    ascendingOrderTitle: "Least",
    descendingOrderTitle: "Most",
    icon: Paperclip,
    Column: SpreadsheetMembersColumn,
    isSortingAllowed: true,
  },
  issue_count: {
    title: "No. of Work items",
    ascendingOrderTitle: "Most",
    descendingOrderTitle: "Least",
    icon: LayersIcon,
    Column: SpreadsheetIssueColumn,
    isSortingAllowed: true,
  },
};

export const SPREADSHEET_PROPERTY_LIST: (keyof IProjectDisplayProperties)[] = [
  "state",
  "priority",
  "duration",
  "lead",
  "members_count",
  "issue_count",
];

export const SPREADSHEET_SELECT_GROUP = "spreadsheet-issues";
