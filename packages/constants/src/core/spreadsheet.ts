"use client";
// types
import { IIssueDisplayProperties } from "@plane/types";

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
