import { TIssueOrderByOptions } from "types";
import { LayersIcon, DoubleCircleIcon, UserGroupIcon } from "@plane/ui";
import { CalendarDays, Link2, Signal, Tag, Triangle, Paperclip } from "lucide-react";
import { FC } from "react";
import { ISvgIcons } from "@plane/ui/src/icons/type";

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key: string]: {
    title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TIssueOrderByOptions;
    descendingOrderTitle: string;
    icon: FC<ISvgIcons>;
  };
} = {
  assignee: {
    title: "Assignees",
    ascendingOrderKey: "assignees__first_name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-assignees__first_name",
    descendingOrderTitle: "Z",
    icon: UserGroupIcon,
  },
  created_on: {
    title: "Created on",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
  },
  due_date: {
    title: "Due date",
    ascendingOrderKey: "-target_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "target_date",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
  },
  estimate: {
    title: "Estimate",
    ascendingOrderKey: "estimate_point",
    ascendingOrderTitle: "Low",
    descendingOrderKey: "-estimate_point",
    descendingOrderTitle: "High",
    icon: Triangle,
  },
  labels: {
    title: "Labels",
    ascendingOrderKey: "labels__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-labels__name",
    descendingOrderTitle: "Z",
    icon: Tag,
  },
  priority: {
    title: "Priority",
    ascendingOrderKey: "priority",
    ascendingOrderTitle: "None",
    descendingOrderKey: "-priority",
    descendingOrderTitle: "Urgent",
    icon: Signal,
  },
  start_date: {
    title: "Start date",
    ascendingOrderKey: "-start_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "start_date",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
  },
  state: {
    title: "State",
    ascendingOrderKey: "state__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-state__name",
    descendingOrderTitle: "Z",
    icon: DoubleCircleIcon,
  },
  updated_on: {
    title: "Updated on",
    ascendingOrderKey: "-updated_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "updated_at",
    descendingOrderTitle: "Old",
    icon: CalendarDays,
  },
  link: {
    title: "Link",
    ascendingOrderKey: "-link_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "link_count",
    descendingOrderTitle: "Least",
    icon: Link2,
  },
  attachment_count: {
    title: "Attachment",
    ascendingOrderKey: "-attachment_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "attachment_count",
    descendingOrderTitle: "Least",
    icon: Paperclip,
  },
  sub_issue_count: {
    title: "Sub-issue",
    ascendingOrderKey: "-sub_issues_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "sub_issues_count",
    descendingOrderTitle: "Least",
    icon: LayersIcon,
  },
};
