import { TIssueOrderByOptions } from "types";

export const SPREADSHEET_PROPERTY_DETAILS: {
  [key: string]: {
    title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TIssueOrderByOptions;
    descendingOrderTitle: string;
  };
} = {
  assignee: {
    title: "Assignees",
    ascendingOrderKey: "assignees__first_name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-assignees__first_name",
    descendingOrderTitle: "Z",
  },
  created_on: {
    title: "Created on",
    ascendingOrderKey: "-created_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "created_at",
    descendingOrderTitle: "Old",
  },
  due_date: {
    title: "Due date",
    ascendingOrderKey: "-target_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "target_date",
    descendingOrderTitle: "Old",
  },
  estimate: {
    title: "Estimate",
    ascendingOrderKey: "estimate_point",
    ascendingOrderTitle: "Low",
    descendingOrderKey: "-estimate_point",
    descendingOrderTitle: "High",
  },
  labels: {
    title: "Labels",
    ascendingOrderKey: "labels__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-labels__name",
    descendingOrderTitle: "Z",
  },
  priority: {
    title: "Priority",
    ascendingOrderKey: "priority",
    ascendingOrderTitle: "None",
    descendingOrderKey: "-priority",
    descendingOrderTitle: "Urgent",
  },
  start_date: {
    title: "Start date",
    ascendingOrderKey: "-start_date",
    ascendingOrderTitle: "New",
    descendingOrderKey: "start_date",
    descendingOrderTitle: "Old",
  },
  state: {
    title: "State",
    ascendingOrderKey: "state__name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-state__name",
    descendingOrderTitle: "Z",
  },
  updated_on: {
    title: "Updated on",
    ascendingOrderKey: "-updated_at",
    ascendingOrderTitle: "New",
    descendingOrderKey: "updated_at",
    descendingOrderTitle: "Old",
  },
};
