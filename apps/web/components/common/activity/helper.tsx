/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTranslationStore } from "@plane/i18n";
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

export const messages = (
  activity: TProjectActivity,
  t: TTranslationStore["t"]
): { message: string | ReactNode; customUserName?: string } => {
  const activityType = activity.field;
  const newValue = activity.new_value;
  const oldValue = activity.old_value;
  const verb = activity.verb;
  const workspaceDetail = store.workspaceRoot.getWorkspaceById(activity.workspace);

  const getBooleanActionText = (value: string | undefined) => {
    if (value === "true") return t("web_ui.enabled");
    if (value === "false") return t("web_ui.disabled");
    return verb;
  };

  switch (activityType) {
    case "priority":
      return {
        message: (
          <>
            {t("web_ui.set_the_priority_to")} <span className="font-medium text-primary">{newValue || "none"}</span>
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
            {t("web_ui.renamed_the_project_to")} <span className="font-medium text-primary">{newValue}</span>
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
                {t("web_ui.set_the_start_date_to")} <span className="font-medium text-primary">{newValue}</span>
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
                {t("web_ui.set_the_target_date_to")} <span className="font-medium text-primary">{newValue}</span>
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
            {t("web_ui.set_the_state_to")} <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "estimate":
      return {
        message: (
          <>
            {newValue ? (
              <>
                {t("web_ui.set_the_estimate_point_to")} <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              <>
                {t("web_ui.removed_the_estimate_point")}{" "}
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
              {verb} {t("web_ui.this_project")} {verb === "removed" ? t("web_ui.from") : t("web_ui.to")}{" "}
              {t("web_ui.the_cycle")}{" "}
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
              {verb} {t("web_ui.this_project")} {verb === "removed" ? t("web_ui.from") : t("web_ui.to")}{" "}
              {t("web_ui.the_module")}{" "}
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
            {verb} {t("web_ui.the_label")}{" "}
            <span className="font-medium text-primary">{newValue || oldValue || "Untitled label"}</span>
          </>
        ),
      };
    case "inbox":
      return {
        message: (
          <>
            {newValue ? t("common.enabled") : t("common.disabled")} {t("sidebar.inbox")}
          </>
        ),
      };
    case "page":
      return {
        message: (
          <>
            {newValue ? t("created") : t("web_ui.removed")} {t("web_ui.the_project_page")}{" "}
            <span className="font-medium text-primary">{newValue || oldValue || "Untitled page"}</span>
          </>
        ),
      };
    case "network":
      return {
        message: (
          <>
            {newValue ? t("common.enabled") : t("common.disabled")} {t("web_ui.network_access")}
          </>
        ),
      };
    case "identifier":
      return {
        message: (
          <>
            {t("web_ui.updated_project_identifier_to")}{" "}
            <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "timezone":
      return {
        message: (
          <>
            {t("web_ui.changed_project_timezone_to")}{" "}
            <span className="font-medium text-primary">{newValue || "default"}</span>
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
            {getBooleanActionText(newValue)} {activityType.replace(/_view$/, "").replace(/_/g, " ")}{" "}
            {t("common.view")}{" "}
          </>
        ),
      };
    case "is_project_updates_enabled":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {t("common.project_updates")}
          </>
        ),
      };
    case "is_epic_enabled":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {t("common.epics")}
          </>
        ),
      };
    case "is_workflow_enabled":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {t("web_ui.custom_workflow")}
          </>
        ),
      };
    case "is_time_tracking_enabled":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {t("time_tracking")}
          </>
        ),
      };
    case "is_issue_type_enabled":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {t("work_item_types.label")}
          </>
        ),
      };
    default:
      return {
        message: `${verb} ${activityType?.replace(/_/g, " ")} `,
      };
  }
};
