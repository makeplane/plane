import { TIssueOrderByOptions } from "types";

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key: string]: {
    title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    descendingOrderKey: TIssueOrderByOptions;
  };
} = {
  assignee: {
    title: "Assignees",
    ascendingOrderKey: "assignees__first_name",
    descendingOrderKey: "-assignees__first_name",
  },
  created_on: {
    title: "Created on",
    ascendingOrderKey: "-created_at",
    descendingOrderKey: "created_at",
  },
  due_date: {
    title: "Due date",
    ascendingOrderKey: "-target_date",
    descendingOrderKey: "target_date",
  },
  estimate: {
    title: "Estimate",
    ascendingOrderKey: "estimate_point",
    descendingOrderKey: "-estimate_point",
  },
  labels: {
    title: "Labels",
    ascendingOrderKey: "labels__name",
    descendingOrderKey: "-labels__name",
  },
  priority: {
    title: "Priority",
    ascendingOrderKey: "priority",
    descendingOrderKey: "-priority",
  },
  start_date: {
    title: "Start date",
    ascendingOrderKey: "-start_date",
    descendingOrderKey: "start_date",
  },
  state: {
    title: "State",
    ascendingOrderKey: "state__name",
    descendingOrderKey: "-state__name",
  },
  updated_on: {
    title: "Updated on",
    ascendingOrderKey: "-updated_at",
    descendingOrderKey: "updated_at",
  },
};
