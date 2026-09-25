/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC, ReactNode } from "react";
import {
  AlignLeftOutline,
  ArchiveOutline,
  AttachOutline,
  ClockOutline,
  CyclesOutline,
  DocumentationOutline,
  DueDateOutline,
  EstimateOutline,
  GitBranchOutline,
  GlobeOutline,
  GridOutline,
  HashOutline,
  HierarchyOutline,
  InboxOutline,
  IntakeOutline,
  LabelsOutline,
  LinkOutline,
  MembersOutline,
  ModuleOutline,
  PriorityOutline,
  RefreshOutline,
  StartDateOutline,
  StateOutline,
  SubscribeOutline,
  TextOutline,
  TimeTrackingOutline,
  ToDoOutline,
  WorkItemsOutline,
} from "@makeplane/propel/icons";
// components

import { store } from "@/lib/store-context";
import type { TProjectActivity } from "@plane/types";

type ActivityIconMap = {
  [key: string]: FC<{ className?: string }>;
};
export const iconsMap: ActivityIconMap = {
  priority: PriorityOutline,
  archived_at: ArchiveOutline,
  restored: RefreshOutline,
  link: LinkOutline,
  start_date: StartDateOutline,
  target_date: DueDateOutline,
  label: LabelsOutline,
  inbox: InboxOutline,
  description: AlignLeftOutline,
  assignee: MembersOutline,
  attachment: AttachOutline,
  name: TextOutline,
  state: StateOutline,
  estimate: EstimateOutline,
  cycle: CyclesOutline,
  module: ModuleOutline,
  page: DocumentationOutline,
  network: GlobeOutline,
  identifier: HashOutline,
  timezone: ClockOutline,
  is_project_updates_enabled: SubscribeOutline,
  is_epic_enabled: GridOutline,
  is_workflow_enabled: GitBranchOutline,
  is_time_tracking_enabled: TimeTrackingOutline,
  is_issue_type_enabled: ToDoOutline,
  default: HierarchyOutline,
  module_view: ModuleOutline,
  cycle_view: CyclesOutline,
  issue_views_view: WorkItemsOutline,
  page_view: DocumentationOutline,
  intake_view: IntakeOutline,
};

export const messages = (activity: TProjectActivity): { message: string | ReactNode; customUserName?: string } => {
  const activityType = activity.field;
  const newValue = activity.new_value;
  const oldValue = activity.old_value;
  const verb = activity.verb;
  const workspaceDetail = store.workspaceRoot.getWorkspaceById(activity.workspace);

  const getBooleanActionText = (value: string | undefined) => {
    if (value === "true") return "enabled";
    if (value === "false") return "disabled";
    return verb;
  };

  switch (activityType) {
    case "priority":
      return {
        message: (
          <>
            set the priority to <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "archived_at":
      return {
        message: newValue === "restore" ? "restored the project" : "archived the project",
        customUserName: newValue === "archive" ? "Plane" : undefined,
      };
    case "name":
      return {
        message: (
          <>
            renamed the project to <span className="font-medium text-primary">{newValue}</span>
          </>
        ),
      };
    case "description":
      return {
        message: newValue ? "updated the project description" : "removed the project description",
      };
    case "start_date":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the start date to <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              "removed the start date"
            )}
          </>
        ),
      };
    case "target_date":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the target date to <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              "removed the target date"
            )}
          </>
        ),
      };
    case "state":
      return {
        message: (
          <>
            set the state to <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "estimate":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the estimate point to <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              <>
                removed the estimate point
                {oldValue && (
                  <>
                    {" "}
                    <span className="font-medium text-primary">{oldValue}</span>
                  </>
                )}
              </>
            )}
          </>
        ),
      };
    case "cycles":
      return {
        message: (
          <>
            <span>
              {verb} this project {verb === "removed" ? "from" : "to"} the cycle{" "}
            </span>
            {verb !== "removed" ? (
              <a
                href={`/${workspaceDetail?.slug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex font-medium text-primary"
              >
                {activity.new_value}
              </a>
            ) : (
              <span className="font-medium text-primary">{activity.old_value || "Unknown cycle"}</span>
            )}
          </>
        ),
      };
    case "modules":
      return {
        message: (
          <>
            <span>
              {verb} this project {verb === "removed" ? "from" : "to"} the module{" "}
            </span>
            <span className="font-medium text-primary">
              {verb === "removed" ? oldValue : newValue || "Unknown module"}
            </span>
          </>
        ),
      };
    case "labels":
      return {
        message: (
          <>
            {verb} the label{" "}
            <span className="font-medium text-primary">{newValue || oldValue || "Untitled label"}</span>
          </>
        ),
      };
    case "inbox":
      return {
        message: <>{newValue ? "enabled" : "disabled"} inbox</>,
      };
    case "page":
      return {
        message: (
          <>
            {newValue ? "created" : "removed"} the project page{" "}
            <span className="font-medium text-primary">{newValue || oldValue || "Untitled page"}</span>
          </>
        ),
      };
    case "network":
      return {
        message: <>{newValue ? "enabled" : "disabled"} network access</>,
      };
    case "identifier":
      return {
        message: (
          <>
            updated project identifier to <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "timezone":
      return {
        message: (
          <>
            changed project timezone to <span className="font-medium text-primary">{newValue || "default"}</span>
          </>
        ),
      };
    case "module_view":
    case "cycle_view":
    case "issue_views_view":
    case "page_view":
    case "intake_view":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {activityType.replace(/_view$/, "").replace(/_/g, " ")} view
          </>
        ),
      };
    case "is_project_updates_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} project updates</>,
      };
    case "is_epic_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} epics</>,
      };
    case "is_workflow_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} custom workflow</>,
      };
    case "is_time_tracking_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} time tracking</>,
      };
    case "is_issue_type_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} work item types</>,
      };
    default:
      return {
        message: `${verb} ${activityType?.replace(/_/g, " ")} `,
      };
  }
};
