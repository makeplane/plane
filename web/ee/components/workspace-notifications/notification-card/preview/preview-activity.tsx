"use client";

import { FC } from "react";
import { TNotification } from "@plane/types";
import { LiteTextReadOnlyEditor } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { replaceUnderscoreIfSnakeCase, stripAndTruncateHTML } from "@/helpers/string.helper";
// components
import { IssueActivityBlock } from "@/plane-web/components/workspace-notifications";

export type TNotificationPreviewActivity = {
  notification: TNotification;
  ends: "top" | "bottom" | "single" | undefined;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

const NotificationContent: FC<{
  notification: TNotification;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
}> = ({ notification, workspaceId, workspaceSlug, projectId }) => {
  const { data, triggered_by_details: triggeredBy } = notification;
  const notificationField = data?.issue_activity.field;
  const newValue = data?.issue_activity.new_value;
  const verb = data?.issue_activity.verb;

  const renderTriggerName = () => (
    <span className="text-custom-text-100 font-medium">
      {triggeredBy?.is_bot ? triggeredBy.first_name : triggeredBy?.display_name}{" "}
    </span>
  );

  const renderAction = () => {
    if (!notificationField) return "";
    if (notificationField === "duplicate")
      return verb === "created"
        ? "marked that this work item is a duplicate of"
        : "marked that this work item is not a duplicate";
    if (notificationField === "relates_to") return "marked that this work item is related to";
    if (notificationField === "comment") return "commented";
    if (notificationField === "archived_at") {
      return newValue === "restore" ? "restored the work item" : "archived the work item";
    }
    if (notificationField === "None") return null;

    const baseAction = !["comment", "archived_at"].includes(notificationField) ? verb : "";
    return `${baseAction} ${replaceUnderscoreIfSnakeCase(notificationField)}`;
  };

  const renderValue = () => {
    if (notificationField === "None") return "the work item and assigned it to you.";
    if (notificationField === "comment") return null;
    if (notificationField === "target_date" || notificationField === "start_date") return renderFormattedDate(newValue);
    if (notificationField === "attachment") return "the work item";
    if (notificationField === "description") return stripAndTruncateHTML(newValue || "", 55);
    if (notificationField === "archived_at") return null;
    return newValue;
  };

  const shouldShowConnector = !["comment", "archived_at", "None"].includes(notificationField || "");

  return (
    <>
      {renderTriggerName()}
      <span className="text-custom-text-300">{renderAction()} </span>
      {verb !== "deleted" && (
        <>
          {shouldShowConnector && <span className="text-custom-text-300">to </span>}
          <span className="text-custom-text-100 font-medium">{renderValue()}</span>.
          {notificationField === "comment" && (
            <div className="scale-75 origin-left">
              <LiteTextReadOnlyEditor
                id=""
                initialValue={newValue ?? ""}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            </div>
          )}
        </>
      )}
    </>
  );
};

export const NotificationPreviewActivity: FC<TNotificationPreviewActivity> = (props) => {
  const { notification, workspaceId, workspaceSlug, ends, projectId } = props;
  const notificationField = notification?.data?.issue_activity.field || undefined;
  // const notificationTriggeredBy = notification.triggered_by_details || undefined;
  const triggeredBy = notification.triggered_by_details;

  if (!workspaceSlug || !notification.id || !notification?.id || !notificationField) return <></>;

  return (
    <div className={cn("flex gap-2 items-center", ends === "bottom" ? "pb-4" : "")}>
      <IssueActivityBlock
        ends={ends}
        notificationField={notificationField}
        createdAt={notification?.created_at}
        triggeredBy={triggeredBy}
      >
        <div className="w-full whitespace-normal truncate text-sm">
          <NotificationContent
            notification={notification}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
        </div>
      </IssueActivityBlock>
    </div>
  );
};
