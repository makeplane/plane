/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
// plane imports
import type { TNotification } from "@plane/types";
import {
  convertMinutesToHoursMinutesString,
  getPageName,
  renderFormattedDate,
  replaceUnderscoreIfSnakeCase,
  sanitizeCommentForNotification,
  stripAndTruncateHTML,
} from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";

// Types
export type TNotificationFieldData = {
  field: string | undefined;
  newValue: string | undefined;
  oldValue: string | undefined;
  verb: string | undefined;
};

export type TNotificationContentDetails = {
  action?: ReactNode;
  value?: ReactNode;
  showConnector?: boolean;
};

export type TNotificationContentHandler = (data: TNotificationFieldData) => TNotificationContentDetails | null;

export type TNotificationContentMap = {
  [key: string]: TNotificationContentHandler;
};

// Base notification content map for core fields
export const NOTIFICATION_CONTENT_MAP: TNotificationContentMap = {
  duplicate: ({ verb }) => ({
    action:
      verb === "created"
        ? "marked that this work item is a duplicate of"
        : "marked that this work item is not a duplicate",
    value: null,
    showConnector: false,
  }),
  assignees: ({ newValue, oldValue }) => ({
    action: newValue !== "" ? "added assignee" : "removed assignee",
    value: newValue !== "" ? newValue : oldValue,
    showConnector: false,
  }),
  start_date: ({ newValue }) => ({
    action: newValue !== "" ? "set start date" : "removed the start date",
    value: renderFormattedDate(newValue),
    showConnector: false,
  }),
  target_date: ({ newValue }) => ({
    action: newValue !== "" ? "set due date" : "removed the due date",
    value: renderFormattedDate(newValue),
    showConnector: false,
  }),
  labels: ({ newValue, oldValue }) => ({
    action: newValue !== "" ? "added label" : "removed label",
    value: newValue !== "" ? newValue : oldValue,
    showConnector: false,
  }),
  parent: ({ newValue, oldValue }) => ({
    action: newValue !== "" ? "added parent" : "removed parent",
    value: newValue !== "" ? newValue : oldValue,
    showConnector: false,
  }),
  relates_to: () => ({
    action: "marked that this work item is related to",
    value: null,
    showConnector: true,
  }),
  comment: ({ newValue }, renderCommentBox?: boolean) => ({
    action: "commented",
    value: renderCommentBox ? null : sanitizeCommentForNotification(newValue),
    showConnector: false,
  }),
  archived_at: ({ newValue }) => ({
    action: newValue === "restore" ? "restored the work item" : "archived the work item",
    value: null,
    showConnector: false,
  }),
  None: () => ({
    action: null,
    value: "the work item and assigned it to you.",
    showConnector: false,
  }),
  // Fields below only define value - action falls through to default handler
  attachment: () => ({
    action: null,
    value: "the work item",
    showConnector: true,
  }),
  description: ({ newValue }) => ({
    value: stripAndTruncateHTML(newValue || "", 55),
    showConnector: true,
  }),
  estimate_time: ({ newValue, oldValue }) => ({
    value:
      newValue !== ""
        ? convertMinutesToHoursMinutesString(Number(newValue))
        : convertMinutesToHoursMinutesString(Number(oldValue)),
    showConnector: true,
  }),
  page: ({ newValue, oldValue, verb }) => ({
    action: verb === "added" ? "added a new page" : "removed the page",
    value: getPageName(newValue || oldValue || ""),
    showConnector: false,
  }),
  milestones: ({ newValue, oldValue }) => ({
    action: newValue ? "set the milestone" : "removed the milestone",
    value: newValue || oldValue || "",
    showConnector: !!newValue, // "to" only when setting, not when removing
  }),
};

// Helper to get content details from maps
const getNotificationContentDetails = (
  fieldData: TNotificationFieldData,
  renderCommentBox?: boolean
): TNotificationContentDetails | null => {
  const { field } = fieldData;
  if (!field) return null;

  // Check base map first
  const notificationContentHandler = NOTIFICATION_CONTENT_MAP[field];
  if (notificationContentHandler) {
    // Special case for comment field that needs renderCommentBox
    if (field === "comment") {
      return (
        notificationContentHandler as (
          data: TNotificationFieldData,
          renderCommentBox?: boolean
        ) => TNotificationContentDetails
      )(fieldData, renderCommentBox);
    }
    return notificationContentHandler(fieldData);
  }

  return null;
};

export const shouldShowConnector = (notificationField: string | undefined) =>
  !["comment", "archived_at", "None", "assignees", "labels", "start_date", "target_date", "parent", "page"].includes(
    notificationField || ""
  );

export const shouldRender = (notificationField: string | undefined, verb: string | undefined) =>
  verb !== "deleted" || (verb === "deleted" && ["page", "milestones"].includes(notificationField || ""));

export function NotificationContent({
  notification,
  workspaceId,
  workspaceSlug,
  projectId,
  renderCommentBox = false,
}: {
  notification: TNotification;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
  renderCommentBox?: boolean;
}) {
  const { data, triggered_by_details: triggeredBy } = notification;
  const notificationField = data?.issue_activity.field;
  const newValue = data?.issue_activity.new_value;
  const oldValue = data?.issue_activity.old_value;
  const verb = data?.issue_activity.verb;

  const fieldData: TNotificationFieldData = {
    field: notificationField,
    newValue,
    oldValue,
    verb,
  };

  const renderTriggerName = () => (
    <span className="text-primary font-medium">
      {triggeredBy?.is_bot ? triggeredBy.first_name : triggeredBy?.display_name}{" "}
    </span>
  );

  // Get content details from map
  const contentDetails = getNotificationContentDetails(fieldData, renderCommentBox);

  // Render action - use map value if defined, otherwise fall through to default handler
  // Note: undefined = fall through to default, null = explicitly no action text
  const renderAction = (): ReactNode => {
    if (!notificationField) return "";
    // Check if action is explicitly defined in map (including null)
    if (contentDetails && "action" in contentDetails) return contentDetails.action;
    // Fallback to default action handler for fields not in map or without action defined
    if (notificationField === "page") return verb === "added" ? "added a new page" : "removed the page";
    const baseAction = !["comment", "archived_at"].includes(notificationField) ? verb : "";
    return `${baseAction} ${replaceUnderscoreIfSnakeCase(notificationField)}`;
  };

  // Render value - use map value if defined, otherwise fall through to default handler
  const renderValue = (): ReactNode => {
    // Check if value is explicitly defined in map
    if (contentDetails && "value" in contentDetails) return contentDetails.value;
    // Fallback to default value handler for fields not in map or without value defined
    if (notificationField === "page") return getPageName(newValue || oldValue || "");
    return newValue;
  };

  // Determine if connector should be shown - prefer map value, fallback to function
  const showConnector =
    contentDetails?.showConnector !== undefined ? contentDetails.showConnector : shouldShowConnector(notificationField);

  return (
    <>
      {renderTriggerName()}
      <span className="text-tertiary">{renderAction()} </span>
      {shouldRender(notificationField, verb) && (
        <>
          {showConnector && <span className="text-tertiary">to </span>}
          <span className="text-primary font-medium">{renderValue()}</span>
          {notificationField === "comment" && renderCommentBox && (
            <div className="scale-75 origin-left">
              <LiteTextEditor
                editable={false}
                id=""
                initialValue={newValue ?? ""}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                displayConfig={{
                  fontSize: "small-font",
                }}
              />
            </div>
          )}
          {"."}
        </>
      )}
    </>
  );
}
